import React, { useState, useEffect } from 'react';

const getFromStorage = (key, fallback) => {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
};

const saveToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};

const statCategories = [
  'Shots Taken', 'Shots on Net', 'Goals', 'Power Play Goals', 'Short Handed Goals',
  'Assists', 'Loose Balls', 'Blocked Shots', 'Caused Turnovers',
  'Turnovers', 'Face Offs Taken', 'Face Offs Won', 'Penalty Minutes'
];

const goalieCategories = ['Shots Faced', 'Goals Allowed', 'Goals', 'Assists'];

const App = () => {
  const [team, setTeam] = useState(getFromStorage('team', { name: 'My Team' }));
  const [roster, setRoster] = useState(getFromStorage('roster', []));
  const [games, setGames] = useState(getFromStorage('games', []));
  const [statsByGame, setStatsByGame] = useState(getFromStorage('statsByGame', {}));
  const [attendanceByGame, setAttendanceByGame] = useState(getFromStorage('attendanceByGame', {}));
  const [lockedGames, setLockedGames] = useState(getFromStorage('lockedGames', {}));
  const [activeTab, setActiveTab] = useState('summary');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [currentGameId, setCurrentGameId] = useState(null);

  useEffect(() => saveToStorage('team', team), [team]);
  useEffect(() => saveToStorage('roster', roster), [roster]);
  useEffect(() => saveToStorage('games', games), [games]);
  useEffect(() => saveToStorage('statsByGame', statsByGame), [statsByGame]);
  useEffect(() => saveToStorage('attendanceByGame', attendanceByGame), [attendanceByGame]);
  useEffect(() => saveToStorage('lockedGames', lockedGames), [lockedGames]);

  const currentGame = games.find(g => g.id === currentGameId);
  const isRunner = selectedPlayer && roster.find(p => p.id === selectedPlayer)?.role === 'runner';
  const isGoalie = selectedPlayer && roster.find(p => p.id === selectedPlayer)?.role === 'goalie';
  const locked = currentGameId && lockedGames[currentGameId];

  const updateStat = (playerId, category, change) => {
    if (!currentGameId || locked) return;
    setStatsByGame(prev => {
      const updatedGame = { ...(prev[currentGameId] || {}) };
      const playerStats = { ...(updatedGame[playerId] || {}) };
      playerStats[category] = (playerStats[category] || 0) + change;
      if (playerStats[category] < 0) playerStats[category] = 0;
      if (category === 'Shots Faced' || category === 'Goals Allowed') {
        const shots = playerStats['Shots Faced'] || 0;
        const goals = playerStats['Goals Allowed'] || 0;
        playerStats['Saves'] = Math.max(0, shots - goals);
        playerStats['Save %'] = shots > 0 ? ((shots - goals) / shots * 100).toFixed(1) : '0.0';
      }
      updatedGame[playerId] = playerStats;
      return { ...prev, [currentGameId]: updatedGame };
    });
    setSelectedPlayer(null);
  };

  const renderStatButtons = () => {
    const categories = isRunner ? statCategories : isGoalie ? goalieCategories : [];
    return (
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <div key={cat} className="relative bg-yellow-400 text-black w-28 h-20 flex items-center justify-center rounded">
            <button className="absolute inset-0 w-full h-full" onClick={() => updateStat(selectedPlayer, cat, 1)}>
              {cat}
            </button>
            <button className="absolute bottom-1 right-1 text-xs bg-black text-yellow-400 px-1 py-0.5 rounded"
              onClick={(e) => { e.stopPropagation(); updateStat(selectedPlayer, cat, -1); }}>
              -1
            </button>
          </div>
        ))}
      </div>
    );
  };

  const renderTabs = () => (
    <div className="flex overflow-x-auto border-b border-yellow-400">
      {['summary', 'season', ...games.map(g => g.id)].map(id => {
        const label = id === 'summary' ? 'Game Stats' : id === 'season' ? 'Season' : `Game: ${games.find(g => g.id === id)?.opponent || 'N/A'}`;
        return (
          <button key={id} onClick={() => setActiveTab(id)} className={`p-2 ${activeTab === id ? 'bg-yellow-400 text-black' : 'text-yellow-400'}`}>
            {label}
          </button>
        );
      })}
    </div>
  );

  const renderGameStats = (gameId) => {
    const players = roster.filter(p => attendanceByGame[gameId]?.[p.id]);
    return (
      <div>
        {!locked && <div className="mb-2">
          <strong>Attendance:</strong>
          <div className="flex flex-wrap gap-1 mt-1">
            {roster.map(p => (
              <button key={p.id} onClick={() => {
                setAttendanceByGame(prev => ({
                  ...prev,
                  [gameId]: { ...(prev[gameId] || {}), [p.id]: !prev[gameId]?.[p.id] }
                }));
              }} className={`px-2 py-1 rounded ${attendanceByGame[gameId]?.[p.id] ? 'bg-yellow-400 text-black' : 'bg-gray-700 text-yellow-400'}`}>
                #{p.number} {p.name}
              </button>
            ))}
          </div>
        </div>}
        {!locked && <div className="mb-2">
          <strong>Stat Entry:</strong>
          <div className="flex flex-wrap gap-2 mt-2">
            {players.map(p => (
              <button key={p.id} onClick={() => setSelectedPlayer(p.id)} className={`px-3 py-2 rounded ${selectedPlayer === p.id ? 'bg-yellow-400 text-black' : 'bg-gray-800 text-yellow-400'}`}>
                #{p.number} {p.name}
              </button>
            ))}
          </div>
          {selectedPlayer && renderStatButtons()}
        </div>}
        {locked && <p className="text-yellow-400 font-semibold">This game is locked. Stats are read-only.</p>}
        <div className="mt-4">
          <button className="bg-red-600 text-white px-4 py-2 rounded" onClick={() => {
            if (window.confirm("Lock this game? This cannot be undone.")) {
              setLockedGames(prev => ({ ...prev, [gameId]: true }));
            }
          }} disabled={locked}>{locked ? "Game Locked" : "Lock Game"}</button>
        </div>
      </div>
    );
  };

  const renderSummary = () => (
    <div>
      <h2 className="text-xl mb-4">Game Stats Summary</h2>
      {games.map(g => (
        <div key={g.id} className="mb-4">
          <h3 className="text-lg">{g.date} vs {g.opponent}</h3>
          <table className="w-full border-collapse text-sm">
            <thead><tr><th className="border p-2">Player</th>{statCategories.map(cat => <th key={cat} className="border p-1">{cat}</th>)}</tr></thead>
            <tbody>
              {roster.map(p => {
                const stats = statsByGame[g.id]?.[p.id] || {};
                return (
                  <tr key={p.id}>
                    <td className="border p-1">{p.name}</td>
                    {statCategories.map(cat => <td key={cat} className="border p-1">{stats[cat] || 0}</td>)}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );

  const renderSeason = () => {
    const totals = {};
    games.forEach(g => {
      const stats = statsByGame[g.id] || {};
      Object.keys(stats).forEach(pid => {
        const playerStats = stats[pid];
        if (!totals[pid]) totals[pid] = {};
        statCategories.forEach(cat => {
          totals[pid][cat] = (totals[pid][cat] || 0) + (playerStats[cat] || 0);
        });
      });
    });
    return (
      <div>
        <h2 className="text-xl mb-4">Season Totals</h2>
        <table className="w-full border-collapse text-sm">
          <thead><tr><th className="border p-2">Player</th>{statCategories.map(cat => <th key={cat} className="border p-1">{cat}</th>)}</tr></thead>
          <tbody>
            {roster.map(p => (
              <tr key={p.id}>
                <td className="border p-1">{p.name}</td>
                {statCategories.map(cat => <td key={cat} className="border p-1">{totals[p.id]?.[cat] || 0}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-yellow-400">
      <header className="bg-black border-b border-yellow-400 p-4">
        <h1 className="text-2xl font-bold">{team.name} - TallyLax</h1>
      </header>
      {renderTabs()}
      <main className="p-4">
        {activeTab === 'summary' && renderSummary()}
        {activeTab === 'season' && renderSeason()}
        {games.find(g => g.id === activeTab) && renderGameStats(activeTab)}
      </main>
    </div>
  );
};

export default App;
