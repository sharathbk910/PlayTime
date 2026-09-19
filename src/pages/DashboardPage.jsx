import React, { useState, useEffect } from 'react';
import { User, Trophy, Award, Gauge, Sparkles, ShieldCheck, Play, ArrowRight, Heart, CloudCheck, CheckCircle2, History } from 'lucide-react';
import { localAuth, supabase, isLiveSupabaseConfigured, logUserAction, syncUserProfile, CELESTIAL_GUEST_UUID } from '../utils/supabaseClient';
import { audioEngine } from '../utils/audioEngine';

export default function DashboardPage({ onNavigate }) {
  const [currentUser, setCurrentUser] = useState(() => localAuth.getUser() || {
    id: CELESTIAL_GUEST_UUID,
    username: 'Celestial Seeker',
    email: 'seeker@kailash.io'
  });

  const [stats, setStats] = useState({
    total_score: 0,
    races_count: 0,
    modaks_total: 0,
    highest_score: 0,
    best_distance: 0,
    achievements: ['Initiate of Kailash', 'First Dash']
  });

  const [races, setRaces] = useState([]);
  const [selectedAvatar, setSelectedAvatar] = useState('Golden Mooshak');
  const [avatarSaveNotice, setAvatarSaveNotice] = useState(false);

  const avatarOptions = [
    { id: 'Golden Mooshak', emoji: '🐭', title: 'Golden Mooshak', aura: 'Swift Devotion & Keen Wit' },
    { id: 'Bal Ganesha', emoji: '🐘', title: 'Bal Ganesha', aura: 'Pure Joy & Modak Lover' },
    { id: 'Mayura Vahana', emoji: '🦚', title: 'Mayura Runner', aura: 'High-Speed Aerial Dash' },
    { id: 'Vighnaharta', emoji: '🪷', title: 'Vighnaharta', aura: 'Master of All Obstacles' }
  ];

  const allAchievements = [
    {
      id: 'First Dash',
      name: 'First Dash',
      desc: 'Took your first sprint along the 3 celestial lanes with Mooshak.',
      icon: '🐭'
    },
    {
      id: 'Divine Revive',
      name: 'Divine Revive',
      desc: 'Answered a Gemini AI Divine Gate trivia question to gain an Extra Life and shield.',
      icon: '💖'
    },
    {
      id: 'Modak Hoarder',
      name: 'Modak Hoarder',
      desc: 'Gathered over 25 glowing Modaks across celestial runs.',
      icon: '🥮'
    },
    {
      id: '500m Celestial Sprinter',
      name: '500m Celestial Sprinter',
      desc: 'Dashed over 500 meters in a single continuous cosmic run.',
      icon: '⚡'
    },
    {
      id: 'Speed Defier',
      name: 'Speed Defier',
      desc: 'Surpassed 8,000 authoritative points, verified by the Anti-Cheat telemetry.',
      icon: '🛡️'
    }
  ];

  // Refresh auth and profile from Supabase
  useEffect(() => {
    if (isLiveSupabaseConfigured && supabase) {
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user) {
          const meta = data.user.user_metadata || {};
          const userObj = {
            id: data.user.id,
            username: meta.full_name || meta.name || data.user.email?.split('@')[0] || 'Celestial Seeker',
            email: data.user.email,
            avatar_url: meta.avatar_url || meta.picture || null
          };
          setCurrentUser(userObj);
          localAuth.setUser(userObj);
        }
      });
    }

    fetch(`/api/profile/${currentUser.id}`)
      .then(res => res.json())
      .then(data => {
        if (data?.profile) {
          setStats(prev => ({ ...prev, ...data.profile }));
          if (data.profile.avatar_aspect) {
            setSelectedAvatar(data.profile.avatar_aspect);
          }
        }
        if (data?.race_history) {
          setRaces(data.race_history);
        }
      })
      .catch(err => console.warn('Profile fetch note:', err));
  }, [currentUser.id]);

  const handleSelectAvatar = async (av) => {
    setSelectedAvatar(av.id);
    audioEngine.playTempleBell(740);

    setAvatarSaveNotice(true);
    setTimeout(() => setAvatarSaveNotice(false), 2200);

    logUserAction('AVATAR_CHANGED', `Seeker chose avatar aspect: ${av.title}`);

    if (isLiveSupabaseConfigured && supabase && currentUser?.id && currentUser.id.length === 36) {
      try {
        await supabase
          .from('profiles')
          .update({ avatar_aspect: av.id })
          .eq('id', currentUser.id);
      } catch (e) {}
    }
  };

  return (
    <div className="min-h-[calc(100vh-4.5rem)] py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8">
      
      {/* Profile Header Card */}
      <div className="rounded-3xl temple-glass-gold border-2 border-gold-temple p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          
          {/* Avatar Icon */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-saffron-600 via-marigold to-gold-400 p-[3px] shadow-xl shadow-saffron-600/30">
            <div className="w-full h-full rounded-3xl bg-cosmic-950 flex items-center justify-center text-5xl select-none">
              {currentUser.avatar_url ? (
                <img
                  src={currentUser.avatar_url}
                  alt={currentUser.username}
                  className="w-full h-full rounded-3xl object-cover"
                />
              ) : (
                avatarOptions.find(a => a.id === selectedAvatar)?.emoji || '🐭'
              )}
            </div>
          </div>

          {/* User Details */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
              <span className="px-3 py-0.5 rounded-full text-xs font-cinzel font-semibold bg-saffron-950/80 border border-gold-500/40 text-amber-300">
                Mooshak's Chosen Runner
              </span>
              <span className="px-3 py-0.5 rounded-full text-xs font-cinzel font-semibold bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Supabase Synced</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold font-mythic text-amber-100 glow-text-gold">
              {currentUser.username}
            </h1>
            <p className="text-xs text-amber-300/70 font-cinzel mt-0.5">
              Contestant Email: <span className="text-amber-200">{currentUser.email}</span>
            </p>
            <p className="text-[11px] text-amber-400/50 font-mono mt-0.5">
              Vault ID: {currentUser.id}
            </p>
          </div>

          {/* CTA Button */}
          <button
            onClick={() => onNavigate('/play')}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-saffron-600 via-marigold to-gold-400 text-cosmic-950 font-cinzel font-bold text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-saffron-600/30 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Launch Next Dash</span>
          </button>

        </div>

        {/* Avatar Persona Selector */}
        <div className="mt-8 pt-6 border-t border-gold-500/20">
          <div className="flex items-center justify-between mb-3">
            <span className="block text-xs font-cinzel uppercase tracking-wider text-amber-300 font-semibold">
              Choose Celestial Avatar Aspect
            </span>
            {avatarSaveNotice && (
              <span className="text-xs text-emerald-300 font-cinzel flex items-center gap-1 animate-pulse">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Aspect Saved to Supabase!</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {avatarOptions.map(av => (
              <button
                key={av.id}
                onClick={() => handleSelectAvatar(av)}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  selectedAvatar === av.id
                    ? 'border-gold-400 bg-saffron-950/60 shadow-lg shadow-saffron-600/30 ring-1 ring-gold-400'
                    : 'border-gold-500/20 bg-cosmic-900/50 hover:bg-white/5 text-amber-200/70'
                }`}
              >
                <div className="text-3xl mb-1.5">{av.emoji}</div>
                <div className="font-cinzel text-xs font-bold text-amber-100">{av.title}</div>
                <div className="text-[10px] text-amber-300/70 mt-0.5 leading-snug">{av.aura}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Highest Score */}
        <div className="temple-glass rounded-3xl p-5 border border-gold-500/20 shadow-lg">
          <div className="w-10 h-10 rounded-2xl bg-saffron-950/60 border border-saffron-500/40 flex items-center justify-center text-saffron-400 mb-3">
            <Trophy className="w-5 h-5 text-marigold" />
          </div>
          <span className="block text-xs font-cinzel uppercase text-amber-400/70">Highest Score</span>
          <span className="text-2xl sm:text-3xl font-bold font-mono text-amber-100 glow-text-gold">
            {stats.highest_score || 0}
          </span>
        </div>

        {/* Best Distance */}
        <div className="temple-glass rounded-3xl p-5 border border-gold-500/20 shadow-lg">
          <div className="w-10 h-10 rounded-2xl bg-cosmic-800/60 border border-gold-500/40 flex items-center justify-center text-yellow-300 mb-3">
            <Gauge className="w-5 h-5 text-yellow-400" />
          </div>
          <span className="block text-xs font-cinzel uppercase text-amber-400/70">Best Distance</span>
          <span className="text-2xl sm:text-3xl font-bold font-mono text-amber-100">
            {Number(stats.best_distance).toFixed(1)}m
          </span>
        </div>

        {/* Modaks Gathered */}
        <div className="temple-glass rounded-3xl p-5 border border-gold-500/20 shadow-lg">
          <div className="w-10 h-10 rounded-2xl bg-amber-950/60 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-3">
            <span className="text-xl">🥮</span>
          </div>
          <span className="block text-xs font-cinzel uppercase text-amber-400/70">Total Modaks</span>
          <span className="text-2xl sm:text-3xl font-bold font-mono text-marigold">
            {stats.modaks_total || 0}
          </span>
        </div>

        {/* Runs Completed */}
        <div className="temple-glass rounded-3xl p-5 border border-gold-500/20 shadow-lg">
          <div className="w-10 h-10 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-3">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="block text-xs font-cinzel uppercase text-amber-400/70">Runs Completed</span>
          <span className="text-2xl sm:text-3xl font-bold font-mono text-amber-100">
            {stats.races_count || races.length}
          </span>
        </div>

      </div>

      {/* Recent Race History (Direct from Supabase) */}
      <div className="rounded-3xl temple-glass border border-gold-500/30 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold font-cinzel text-amber-100 flex items-center gap-2">
            <History className="w-5 h-5 text-marigold" />
            <span>Recent Celestial Runs (Supabase Cloud Vault)</span>
          </h3>
          <span className="text-xs text-amber-300/70 font-mono">
            {races.length} recorded runs
          </span>
        </div>

        {races.length === 0 ? (
          <div className="text-center py-8 text-amber-300/60 font-cinzel text-sm">
            No race runs recorded yet. Dash into the arena to log your first verified time!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {races.slice(0, 6).map((run, i) => (
              <div key={run.id || i} className="p-3.5 rounded-2xl bg-cosmic-950/80 border border-gold-500/20 text-xs space-y-1.5 shadow-inner">
                <div className="flex justify-between items-center text-[11px] text-amber-400/70">
                  <span>{run.created_at ? new Date(run.created_at).toLocaleDateString() : 'Just now'}</span>
                  <span className="font-semibold text-emerald-300 flex items-center gap-0.5">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Verified</span>
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-base font-bold font-mono text-gold-divine glow-text-gold">{run.final_score} pts</span>
                  <span className="font-mono text-amber-100 font-medium">{Number(run.distance_traveled).toFixed(1)}m</span>
                </div>
                <div className="flex justify-between text-[11px] text-amber-300/70 pt-1 border-t border-gold-500/10">
                  <span>Modaks: {run.modaks_collected} 🥮</span>
                  <span>Duration: {Number(run.duration_seconds).toFixed(1)}s</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contest Achievements */}
      <div className="rounded-3xl temple-glass border border-gold-500/30 p-6 shadow-xl">
        <h3 className="text-lg font-bold font-cinzel text-amber-100 mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-marigold" />
          <span>Contest Runner Achievements</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allAchievements.map(ach => {
            const unlocked = stats.achievements?.includes(ach.id) || ach.id === 'First Dash';

            return (
              <div
                key={ach.id}
                className={`p-4 rounded-2xl border flex items-start gap-4 transition-all ${
                  unlocked
                    ? 'border-gold-500/40 bg-saffron-950/20 shadow-md'
                    : 'border-gold-500/10 bg-black/20 opacity-40'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-cosmic-950 border border-gold-500/30 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                  {ach.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-amber-100 font-cinzel">
                      {ach.name}
                    </span>
                    {unlocked && (
                      <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-900/50 text-emerald-300 border border-emerald-500/30 font-semibold font-mono">
                        Unlocked
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-amber-200/70 mt-1 leading-relaxed">
                    {ach.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
