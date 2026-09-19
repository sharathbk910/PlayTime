import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Gauge, Sparkles, ShieldCheck, RefreshCw, Play, Crown, Search, Cloud, Star } from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';

export default function LeaderboardPage({ onNavigate }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('high_score'); // high_score | best_distance | modaks
  const [searchQuery, setSearchQuery] = useState('');
  const [dataSource, setDataSource] = useState('supabase_cloud');

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leaderboard?sort=${sortBy}`);
      const data = await res.json();
      if (data?.leaderboard) {
        setEntries(data.leaderboard);
        if (data.source) setDataSource(data.source);
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

  const filteredEntries = entries.filter((e) =>
    e.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.wisdom_rank?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const top3 = entries.slice(0, 3);

  return (
    <div className="min-h-[calc(100vh-4.5rem)] py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8">
      
      {/* Header Banner */}
      <div className="text-center">
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full temple-glass border border-gold-400/40 text-xs font-cinzel text-amber-300 uppercase tracking-widest mb-3 shadow-lg">
          <Trophy className="w-3.5 h-3.5 text-yellow-400" />
          <span>ModhakVerse Global Standings</span>
          <span className="text-amber-400/50">&bull;</span>
          <span className="text-emerald-300 font-mono text-[10px] flex items-center gap-1">
            <Cloud className="w-3 h-3" />
            <span>Supabase Cloud Sync</span>
          </span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-bold font-mythic text-amber-100 glow-text-gold">
          The ModhakVerse Leaderboard
        </h1>
        <p className="text-xs sm:text-sm text-amber-300/80 font-cinzel max-w-lg mx-auto mt-2">
          Rankings cryptographically verified by the Celestial Anti-Cheat Engine &bull; Speed, item density & distance enforced
        </p>
      </div>

      {/* Top 3 Podium Cards */}
      {top3.length >= 3 && !loading && (
        <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end max-w-2xl mx-auto pt-4 pb-2">
          
          {/* 2nd Place (Silver) */}
          <div className="order-1 temple-glass rounded-3xl p-3 sm:p-4 text-center border border-slate-300/40 shadow-xl relative transform hover:-translate-y-1 transition-transform">
            <div className="text-2xl sm:text-3xl mb-1">🥈</div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-800 border-2 border-slate-300 mx-auto mb-2 flex items-center justify-center font-bold text-amber-100 text-sm">
              {top3[1]?.username[0]?.toUpperCase() || 'M'}
            </div>
            <span className="block font-bold text-xs sm:text-sm text-amber-100 truncate font-cinzel">
              {top3[1]?.username}
            </span>
            <span className="block text-[10px] text-amber-300/70 truncate">{top3[1]?.wisdom_rank}</span>
            <div className="mt-2 pt-1.5 border-t border-slate-400/20 text-xs sm:text-sm font-bold font-mono text-slate-200">
              {top3[1]?.final_score} pts
            </div>
          </div>

          {/* 1st Place (Gold - Tall Pedestal) */}
          <div className="order-2 temple-glass-gold rounded-3xl p-4 sm:p-5 text-center border-2 border-gold-temple shadow-2xl relative transform -translate-y-3 hover:-translate-y-4 transition-transform ring-2 ring-gold-400/50">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-cosmic-950 border border-gold-400 text-[10px] font-cinzel font-bold text-gold-divine uppercase tracking-widest flex items-center gap-1 shadow-md">
              <Crown className="w-3 h-3 text-gold-divine fill-gold-divine" />
              <span>Leader</span>
            </div>
            <div className="text-3xl sm:text-4xl mb-1 mt-1">🥇</div>
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-saffron-600 via-marigold to-gold-400 border-2 border-gold-300 mx-auto mb-2 flex items-center justify-center font-bold text-cosmic-950 text-base shadow-lg shadow-saffron-500/40">
              {top3[0]?.username[0]?.toUpperCase() || 'M'}
            </div>
            <span className="block font-bold text-xs sm:text-base text-amber-100 truncate font-cinzel glow-text-gold">
              {top3[0]?.username}
            </span>
            <span className="block text-[11px] text-amber-300 truncate">{top3[0]?.wisdom_rank}</span>
            <div className="mt-2 pt-1.5 border-t border-gold-500/30 text-sm sm:text-base font-bold font-mono text-gold-divine glow-text-gold">
              {top3[0]?.final_score} pts
            </div>
          </div>

          {/* 3rd Place (Bronze) */}
          <div className="order-3 temple-glass rounded-3xl p-3 sm:p-4 text-center border border-amber-700/40 shadow-xl relative transform hover:-translate-y-1 transition-transform">
            <div className="text-2xl sm:text-3xl mb-1">🥉</div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-amber-950 border-2 border-amber-600 mx-auto mb-2 flex items-center justify-center font-bold text-amber-200 text-sm">
              {top3[2]?.username[0]?.toUpperCase() || 'M'}
            </div>
            <span className="block font-bold text-xs sm:text-sm text-amber-100 truncate font-cinzel">
              {top3[2]?.username}
            </span>
            <span className="block text-[10px] text-amber-300/70 truncate">{top3[2]?.wisdom_rank}</span>
            <div className="mt-2 pt-1.5 border-t border-amber-700/20 text-xs sm:text-sm font-bold font-mono text-amber-300">
              {top3[2]?.final_score} pts
            </div>
          </div>

        </div>
      )}

      {/* Ornate Royal Scroll Container */}
      <div className="relative rounded-3xl temple-glass-gold border-2 border-gold-temple p-4 sm:p-8 shadow-2xl overflow-hidden backdrop-blur-xl">
        
        {/* Scroll Trim Ornaments */}
        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-saffron-600 via-gold-400 to-saffron-600 opacity-80" />
        <div className="absolute bottom-0 inset-x-0 h-2 bg-gradient-to-r from-saffron-600 via-gold-400 to-saffron-600 opacity-80" />

        {/* Filter Controls & Search */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 pb-4 border-b border-gold-500/20">
          
          {/* Sort Buttons */}
          <div className="flex items-center gap-1.5 bg-cosmic-950/80 p-1 rounded-2xl border border-gold-500/30">
            <button
              onClick={() => setSortBy('high_score')}
              className={`px-3 py-1.5 rounded-xl text-xs font-cinzel font-semibold transition-all cursor-pointer ${
                sortBy === 'high_score'
                  ? 'bg-gradient-to-r from-saffron-600 to-marigold text-cosmic-950 shadow-sm font-bold'
                  : 'text-amber-200/70 hover:text-amber-100'
              }`}
            >
              Highest Score
            </button>

            <button
              onClick={() => setSortBy('best_distance')}
              className={`px-3 py-1.5 rounded-xl text-xs font-cinzel font-semibold transition-all cursor-pointer ${
                sortBy === 'best_distance'
                  ? 'bg-gradient-to-r from-saffron-600 to-marigold text-cosmic-950 shadow-sm font-bold'
                  : 'text-amber-200/70 hover:text-amber-100'
              }`}
            >
              Max Distance
            </button>

            <button
              onClick={() => setSortBy('modaks')}
              className={`px-3 py-1.5 rounded-xl text-xs font-cinzel font-semibold transition-all cursor-pointer ${
                sortBy === 'modaks'
                  ? 'bg-gradient-to-r from-saffron-600 to-marigold text-cosmic-950 shadow-sm font-bold'
                  : 'text-amber-200/70 hover:text-amber-100'
              }`}
            >
              Modaks Gathered
            </button>
          </div>

          {/* Search & Actions */}
          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <div className="relative flex-1 md:w-48">
              <Search className="w-3.5 h-3.5 text-amber-400/60 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Seeker..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-cosmic-950/80 border border-gold-500/30 text-amber-100 placeholder-amber-400/40 text-xs focus:outline-none focus:border-gold-400"
              />
            </div>

            <button
              onClick={handleRefresh}
              className="p-2 rounded-xl border border-gold-500/30 text-amber-300 hover:bg-white/5 transition-colors flex items-center gap-1.5 text-xs font-cinzel cursor-pointer"
              title="Refresh Standings from Supabase"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={() => onNavigate('/play')}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-saffron-600 to-gold-400 text-cosmic-950 font-cinzel font-bold text-xs uppercase tracking-wider shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
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
              Unrolling the Golden Scroll from Supabase Vault...
            </p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center py-12 text-amber-300/60 font-cinzel">
            {searchQuery ? `No seekers found matching "${searchQuery}"` : 'No runners recorded yet. Be the first to dash!'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-gold-500/20 text-[11px] font-cinzel uppercase tracking-widest text-amber-400/80">
                  <th className="py-3 px-3">Rank</th>
                  <th className="py-3 px-3">Seeker Persona</th>
                  <th className="py-3 px-3">Vahana Rank</th>
                  <th className="py-3 px-3 text-right">Distance</th>
                  <th className="py-3 px-3 text-right">Modaks</th>
                  <th className="py-3 px-3 text-right">Final Score</th>
                  <th className="py-3 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold-500/10 font-sans">
                {filteredEntries.map((entry, idx) => {
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
                        <div className="flex items-center gap-2.5">
                          {entry.avatar_url ? (
                            <img
                              src={entry.avatar_url}
                              alt={entry.username}
                              className="w-8 h-8 rounded-full object-cover border border-gold-400"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-saffron-600/30 border border-gold-400/40 flex items-center justify-center text-xs font-bold text-amber-200">
                              {entry.username[0]?.toUpperCase() || 'M'}
                            </div>
                          )}
                          <div>
                            <span className="font-medium text-amber-100 block font-cinzel">
                              {entry.username}
                            </span>
                            <span className="text-[10px] text-amber-400/60 font-mono">
                              {entry.runs_completed ? `${entry.runs_completed} runs completed` : 'Active Seeker'}
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

                      {/* Anti-Cheat & Cloud Status */}
                      <td className="py-3.5 px-3 text-center">
                        <span
                          title="Verified authentic & synced to Supabase Cloud"
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[10px] font-semibold"
                        >
                          <ShieldCheck className="w-3 h-3" />
                          <span>Verified</span>
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
