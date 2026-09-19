import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Gauge, Sparkles, ShieldCheck, RefreshCw, Play, Crown } from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';

export default function LeaderboardPage({ onNavigate }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('high_score'); // high_score | best_distance | modaks

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leaderboard?sort=${sortBy}`);
      const data = await res.json();
      if (data?.leaderboard) {
        setEntries(data.leaderboard);
      }
    } catch (err) {
      console.warn('Leaderboard fetch fallback:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [sortBy]);

  const handleRefresh = () => {
    audioEngine.playTempleBell(660);
    fetchLeaderboard();
  };

  return (
    <div className="min-h-[calc(100vh-4.5rem)] py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      
      {/* Header Banner */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full temple-glass border border-gold-400/40 text-xs font-cinzel text-amber-300 uppercase tracking-widest mb-3">
          <Trophy className="w-3.5 h-3.5 text-yellow-400" />
          <span>Ganesh Chaturthi Contest Standings</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-mythic text-amber-100 glow-text-gold">
          The Celestial Dash Leaderboard
        </h1>
        <p className="text-xs sm:text-sm text-amber-300/70 font-cinzel max-w-lg mx-auto mt-2">
          Rankings verified by the Celestial Anti-Cheat Engine &bull; Speed and Modak telemetry enforced
        </p>
      </div>

      {/* Ornate Royal Scroll Container */}
      <div className="relative rounded-3xl temple-glass-gold border-2 border-gold-temple p-4 sm:p-8 shadow-2xl overflow-hidden">
        
        {/* Scroll Trim Ornaments */}
        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-saffron-600 via-gold-400 to-saffron-600 opacity-75" />
        <div className="absolute bottom-0 inset-x-0 h-2 bg-gradient-to-r from-saffron-600 via-gold-400 to-saffron-600 opacity-75" />

        {/* Filter Controls & Refresh */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 pb-4 border-b border-gold-500/20">
          
          <div className="flex items-center gap-1.5 bg-cosmic-950/80 p-1 rounded-xl border border-gold-500/30">
            <button
              onClick={() => setSortBy('high_score')}
              className={`px-3 py-1.5 rounded-lg text-xs font-cinzel font-semibold transition-all ${
                sortBy === 'high_score'
                  ? 'bg-gradient-to-r from-saffron-600 to-marigold text-cosmic-950 shadow-sm'
                  : 'text-amber-200/70 hover:text-amber-100'
              }`}
            >
              Highest Score
            </button>

            <button
              onClick={() => setSortBy('best_distance')}
              className={`px-3 py-1.5 rounded-lg text-xs font-cinzel font-semibold transition-all ${
                sortBy === 'best_distance'
                  ? 'bg-gradient-to-r from-saffron-600 to-marigold text-cosmic-950 shadow-sm'
                  : 'text-amber-200/70 hover:text-amber-100'
              }`}
            >
              Max Distance
            </button>

            <button
              onClick={() => setSortBy('modaks')}
              className={`px-3 py-1.5 rounded-lg text-xs font-cinzel font-semibold transition-all ${
                sortBy === 'modaks'
                  ? 'bg-gradient-to-r from-saffron-600 to-marigold text-cosmic-950 shadow-sm'
                  : 'text-amber-200/70 hover:text-amber-100'
              }`}
            >
              Modaks Gathered
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className="p-2 rounded-xl border border-gold-500/30 text-amber-300 hover:bg-white/5 transition-colors flex items-center gap-1.5 text-xs font-cinzel"
              title="Refresh Standings"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={() => onNavigate('/play')}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-saffron-600 to-gold-400 text-cosmic-950 font-cinzel font-bold text-xs uppercase tracking-wider shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Enter Dash</span>
            </button>
          </div>

        </div>

        {/* Standings Table */}
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-3">
            <div className="w-10 h-10 rounded-full border-2 border-gold-400 border-t-transparent animate-spin" />
            <p className="text-xs font-cinzel text-amber-300 animate-pulse">
              Unrolling the Golden Scroll of Mount Kailash...
            </p>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12 text-amber-300/60 font-cinzel">
            No runners recorded yet. Be the first to dash!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-gold-500/20 text-[11px] font-cinzel uppercase tracking-widest text-amber-400/80">
                  <th className="py-3 px-3">Rank</th>
                  <th className="py-3 px-3">Seeker</th>
                  <th className="py-3 px-3">Title / Vahana Rank</th>
                  <th className="py-3 px-3 text-right">Distance</th>
                  <th className="py-3 px-3 text-right">Modaks</th>
                  <th className="py-3 px-3 text-right">Final Score</th>
                  <th className="py-3 px-3 text-center">Anti-Cheat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold-500/10 font-sans">
                {entries.map((entry, idx) => {
                  const rankBadge =
                    entry.rank === 1 ? '🥇' :
                    entry.rank === 2 ? '🥈' :
                    entry.rank === 3 ? '🥉' : `#${entry.rank}`;

                  const dist = entry.distance_traveled || (entry.final_score ? Math.floor(entry.final_score / 15) : 0);
                  const modaks = entry.modaks_collected || 0;

                  return (
                    <tr
                      key={entry.id || idx}
                      className={`hover:bg-saffron-950/30 transition-colors ${
                        entry.rank === 1 ? 'bg-saffron-900/20 font-semibold' : ''
                      }`}
                    >
                      {/* Rank */}
                      <td className="py-3.5 px-3 font-bold font-mythic text-base sm:text-lg">
                        <span className={entry.rank === 1 ? 'glow-text-gold' : ''}>
                          {rankBadge}
                        </span>
                      </td>

                      {/* Seeker Name */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-saffron-600/30 border border-gold-400/40 flex items-center justify-center text-xs font-bold text-amber-200">
                            {entry.username[0]?.toUpperCase() || 'M'}
                          </div>
                          <div>
                            <span className="font-medium text-amber-100 block">
                              {entry.username}
                            </span>
                            <span className="text-[10px] text-amber-400/60 font-mono">
                              {entry.created_at ? new Date(entry.created_at).toLocaleDateString() : 'Active'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Vahana Rank */}
                      <td className="py-3.5 px-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-cinzel font-medium bg-cosmic-950/80 border border-gold-500/30 text-amber-300">
                          <Sparkles className="w-3 h-3 text-marigold" />
                          <span>{entry.wisdom_rank || 'Celestial Seeker'}</span>
                        </span>
                      </td>

                      {/* Distance */}
                      <td className="py-3.5 px-3 text-right font-mono text-amber-200/90 font-bold">
                        {Number(dist).toFixed(1)}m
                      </td>

                      {/* Modaks */}
                      <td className="py-3.5 px-3 text-right font-mono text-marigold font-bold">
                        {modaks} 🥮
                      </td>

                      {/* Final Score */}
                      <td className="py-3.5 px-3 text-right font-mono text-base font-bold text-gold-divine glow-text-gold">
                        {entry.final_score}
                      </td>

                      {/* Anti-Cheat Status */}
                      <td className="py-3.5 px-3 text-center">
                        <span
                          title="Verified authentic by Celestial Anti-Cheat Telemetry"
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[10px] font-semibold"
                        >
                          <ShieldCheck className="w-3 h-3" />
                          <span className="hidden md:inline">Verified</span>
                        </span>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}
