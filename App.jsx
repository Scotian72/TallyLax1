// ✅ Cleaned and restored TallyLax App with full functionality
// Tabs: Setup, Roster, Games, Game Stats, Summary — Working

import React, { useState, useEffect } from 'react';
import { BarChart2, Clipboard, Users, Calendar, Activity, Award, Settings } from 'lucide-react';

const getFromStorage = (key, fallback) => {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch (e) {
    console.error('Storage parse error:', e);
    return fallback;
  }
};

const saveToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Storage write error:', e);
  }
};

const App = () => {
  const [activeTab, setActiveTab] = useState('setup');
  const [team, setTeam] = useState(getFromStorage('team', { name: 'My Team' }));
  const [roster, setRoster] = useState(getFromStorage('roster', []));
  const [newPlayer, setNewPlayer] = useState({ name: '', number: '', role: 'runner' });
  const [games, setGames] = useState(getFromStorage('games', []));
  const [newGame, setNewGame] = useState({ opponent: '', date: new Date().toISOString().split('T')[0] });
  const [currentGame, setCurrentGame] = useState(null);
  const [statsByGame, setStatsByGame] = useState(getFromStorage('statsByGame', {}));
  const [attendanceByGame, setAttendanceByGame] = useState(getFromStorage('attendanceByGame', {}));
  const [teamStatsByGame, setTeamStatsByGame] = useState(getFromStorage('teamStatsByGame', {}));
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  useEffect(() => saveToStorage('team', team), [team]);
  useEffect(() => saveToStorage('roster', roster), [roster]);
  useEffect(() => saveToStorage('games', games), [games]);
  useEffect(() => saveToStorage('statsByGame', statsByGame), [statsByGame]);
  useEffect(() => saveToStorage('attendanceByGame', attendanceByGame), [attendanceByGame]);
  useEffect(() => saveToStorage('teamStatsByGame', teamStatsByGame), [teamStatsByGame]);

  const TabButton = ({ id, icon, label }) => (
    <button onClick={() => setActiveTab(id)}
      className={`flex flex-col items-center p-2 ${activeTab === id ? 'bg-yellow-400 text-black' : 'text-yellow-400'}`}>
      {icon}<span className='text-xs'>{label}</span>
    </button>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'setup':
        return (
          <div>
            <h2 className='text-xl mb-4'>Team Setup</h2>
            <input className='bg-black border border-yellow-400 p-2 text-yellow-400 mb-4' value={team.name} onChange={e => setTeam({ ...team, name: e.target.value })} />
            <div className='flex gap-2 mb-4'>
              <button className='bg-yellow-400 text-black px-4 py-2' onClick={() => {
                const data = { team, roster, games, statsByGame, attendanceByGame, teamStatsByGame };
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'tallylax-backup.json';
                a.click();
                URL.revokeObjectURL(url);
              }}>Export Backup</button>
              <label className='bg-yellow-400 text-black px-4 py-2 cursor-pointer'>
                Import
                <input type='file' className='hidden' accept='.json' onChange={e => {
                  const file = e.target.files[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = event => {
                    try {
                      const data = JSON.parse(event.target.result);
                      setTeam(data.team || {});
                      setRoster(data.roster || []);
                      setGames(data.games || []);
                      setStatsByGame(data.statsByGame || {});
                      setAttendanceByGame(data.attendanceByGame || {});
                      setTeamStatsByGame(data.teamStatsByGame || {});
                    } catch (e) {
                      alert('Invalid backup file.');
                    }
                  };
                  reader.readAsText(file);
                }} />
              </label>
              <button className='bg-red-600 text-white px-4 py-2' onClick={() => {
                if (window.confirm('Are you sure you want to reset all data?')) {
                  localStorage.clear();
                  window.location.reload();
                }
              }}>Reset All Data</button>
            </div>
          </div>
        );
      case 'roster':
        return (
          <div>
            <h2 className='text-xl mb-4'>Roster</h2>
            <div className='flex flex-wrap gap-2 mb-4'>
              <input placeholder='Name' className='bg-black border border-yellow-400 p-2 text-yellow-400' value={newPlayer.name} onChange={e => setNewPlayer({ ...newPlayer, name: e.target.value })} />
              <input placeholder='Number' className='bg-black border border-yellow-400 p-2 text-yellow-400' value={newPlayer.number} onChange={e => setNewPlayer({ ...newPlayer, number: e.target.value })} />
              <select className='bg-black border border-yellow-400 p-2 text-yellow-400' value={newPlayer.role} onChange={e => setNewPlayer({ ...newPlayer, role: e.target.value })}>
                <option value='runner'>Runner</option>
                <option value='goalie'>Goalie</option>
              </select>
              <button className='bg-yellow-400 text-black px-4 py-2' onClick={() => {
                if (!newPlayer.name || !newPlayer.number) return;
                const player = { ...newPlayer, id: Date.now().toString() };
                setRoster([...roster, player]);
                setNewPlayer({ name: '', number: '', role: 'runner' });
              }}>Add Player</button>
            </div>
            <ul>
              {roster.map(player => (
                <li key={player.id} className='mb-1'>#{player.number} {player.name} ({player.role})
                  <button onClick={() => {
                    if (window.confirm(`Remove ${player.name}?`)) {
                      setRoster(roster.filter(p => p.id !== player.id));
                    }
                  }} className='ml-4 text-red-400 underline'>Remove</button>
                </li>
              ))}
            </ul>
          </div>
        );

      case 'games':
        return (
          <div>
            <h2 className='text-xl mb-4'>Games</h2>
            <div className='flex gap-2 mb-4'>
              <input placeholder='Opponent' className='bg-black border border-yellow-400 p-2 text-yellow-400' value={newGame.opponent} onChange={e => setNewGame({ ...newGame, opponent: e.target.value })} />
              <input type='date' className='bg-black border border-yellow-400 p-2 text-yellow-400' value={newGame.date} onChange={e => setNewGame({ ...newGame, date: e.target.value })} />
              <button className='bg-yellow-400 text-black px-4 py-2' onClick={() => {
                const game = { ...newGame, id: Date.now().toString() };
                setGames([...games, game]);
                setCurrentGame(game.id);
              }}>Add Game</button>
            </div>
            <ul>
              {games.map(g => (
                <li key={g.id} className='mb-1'>
                  {g.date} vs {g.opponent}
                  <button onClick={() => setCurrentGame(g.id)} className='ml-4 text-yellow-400 underline'>Select</button>
                </li>
              ))}
            </ul>
          </div>
        );

      case 'game-stats':
        if (!currentGame) return <p>Select a game first.</p>;
        const attendees = roster.filter(p => attendanceByGame[currentGame]?.[p.id]);
        return (
          <div>
            <h2 className='text-xl mb-4'>Game Stats</h2>
            <h3 className='text-lg mb-2'>Attendance</h3>
            <div className='flex flex-wrap gap-2 mb-4'>
              {roster.map(player => (
                <button key={player.id} onClick={() => {
                  setAttendanceByGame(prev => ({
                    ...prev,
                    [currentGame]: {
                      ...(prev[currentGame] || {}),
                      [player.id]: !((prev[currentGame] || {})[player.id])
                    }
                  }));
                }} className={`px-3 py-1 rounded ${attendanceByGame[currentGame]?.[player.id] ? 'bg-yellow-400 text-black' : 'bg-gray-800 text-yellow-400'}`}>
                  #{player.number} {player.name}
                </button>
              ))}
            </div>
            <h3 className='text-lg mb-2'>Stat Entry</h3>
            <div className='flex flex-wrap gap-2 mb-4'>
              {attendees.map(player => (
                <button key={player.id} onClick={() => setSelectedPlayer(player.id)} className={`px-3 py-2 rounded ${selectedPlayer === player.id ? 'bg-yellow-400 text-black' : 'bg-gray-700 text-yellow-400'}`}>
                  #{player.number} {player.name}
                </button>
              ))}
            </div>
            {selectedPlayer && roster.find(p => p.id === selectedPlayer)?.role === 'runner' && (
              <div className='grid grid-cols-2 sm:grid-cols-3 gap-2'>
                {['Goals', 'Assists', 'Shots Taken', 'Shots on Net', 'Power Play Goals', 'Short Handed Goals'].map(cat => (
                  <button key={cat} onClick={() => {
                    setStatsByGame(prev => {
                      const updatedGame = { ...(prev[currentGame] || {}) };
                      const playerStats = { ...(updatedGame[selectedPlayer] || {}) };
                      playerStats[cat] = (playerStats[cat] || 0) + 1;
                      updatedGame[selectedPlayer] = playerStats;
                      return { ...prev, [currentGame]: updatedGame };
                    });
                  }} className='bg-yellow-400 text-black px-2 py-2 rounded'>{cat}</button>
                ))}
              </div>
            )}
          </div>
        );

      case 'summary':
        return (
          <div>
            <h2 className='text-xl mb-4'>Summary</h2>
            <div className='overflow-x-auto'>
              <table className='w-full border-collapse text-sm'>
                <thead>
                  <tr>
                    <th className='border p-2'>Game</th>
                    {roster.map(p => <th key={p.id} className='border p-2'>{p.name}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {games.map(game => (
                    <tr key={game.id}>
                      <td className='border p-2'>{game.date} vs {game.opponent}</td>
                      {roster.map(p => {
                        const s = statsByGame[game.id]?.[p.id] || {};
                        const total = (s['Goals'] || 0) + 'G ' + (s['Assists'] || 0) + 'A';
                        return <td key={p.id} className='border p-2'>{total}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
                
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black text-yellow-400">
      <header className="bg-black border-b border-yellow-400 p-4">
        <h1 className="text-2xl font-bold">{team.name} - TallyLax</h1>
      </header>
      <div className='flex overflow-x-auto border-b border-yellow-400'>
        <TabButton id='setup' icon={<Settings size={20} />} label='Setup' />
        <TabButton id='roster' icon={<Users size={20} />} label='Roster' />
        <TabButton id='games' icon={<Calendar size={20} />} label='Games' />
        <TabButton id='game-stats' icon={<Activity size={20} />} label='Game Stats' />
        <TabButton id='summary' icon={<Clipboard size={20} />} label='Summary' />
      </div>
      <main className="p-4">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
