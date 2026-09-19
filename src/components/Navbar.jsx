import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Trophy, Compass, User, LogOut, ShieldCheck, Sparkles, Play, Cloud } from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';
import { localAuth, supabase, isLiveSupabaseConfigured } from '../utils/supabaseClient';

export default function Navbar({ currentRoute, onNavigate }) {
  const [isMuted, setIsMuted] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const refreshUser = () => {
    if (isLiveSupabaseConfigured && supabase) {
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user) {
          const meta = data.user.user_metadata || {};
          setCurrentUser({
            id: data.user.id,
            username: meta.full_name || meta.name || data.user.email?.split('@')[0] || 'Mooshak Seeker',
            email: data.user.email,
            avatar_url: meta.avatar_url || meta.picture || null
          });
        } else {
          setCurrentUser(localAuth.getUser());
        }
      });
    } else {
      setCurrentUser(localAuth.getUser());
    }
  };

  useEffect(() => {
    refreshUser();
  }, [currentRoute]);

  const handleToggleSound = () => {
    const muted = audioEngine.toggleMute();
    setIsMuted(muted);
    if (!muted) {
      audioEngine.playTempleBell(660);
    }
  };

  const handleLogout = async () => {
    if (isLiveSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    localAuth.clearUser();
    setCurrentUser(null);
    audioEngine.playTempleBell(528);
    onNavigate('/');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gold-500/20 bg-cosmic-950/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between py-3">
        
        {/* Brand / Logo */}
        <button 
          onClick={() => onNavigate('/')}
          className="flex items-center space-x-3 group text-left focus:outline-none cursor-pointer"
        >
          <div className="relative w-11 h-11 rounded-full bg-gradient-to-tr from-saffron-600 via-marigold to-gold-400 p-[2px] shadow-lg shadow-saffron-600/30 group-hover:scale-105 transition-transform duration-300">
            <div className="w-full h-full rounded-full bg-cosmic-900 flex items-center justify-center text-xl">
              🐭
            </div>
            {/* Glowing Diya Pulse */}
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-saffron-500 items-center justify-center text-[8px]">✨</span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="block text-[10px] uppercase tracking-widest text-amber-300/80 font-cinzel font-semibold">
                Ganesh Chaturthi Contest
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.2 rounded bg-emerald-950/60 border border-emerald-500/30 text-[9px] text-emerald-300 font-mono">
                Supabase Live
              </span>
            </div>
            <span className="block text-base sm:text-lg font-bold font-mythic tracking-wide bg-gradient-to-r from-amber-200 via-marigold to-saffron-400 bg-clip-text text-transparent">
              Celestial Dash: Mooshak's Quest
            </span>
          </div>
        </button>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center space-x-1 sm:space-x-2">
          <button
            onClick={() => onNavigate('/')}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
              currentRoute === '/' 
                ? 'bg-gradient-to-r from-saffron-700/40 to-amber-700/30 text-amber-200 border border-gold-500/40 shadow-sm'
                : 'text-amber-100/70 hover:text-amber-200 hover:bg-white/5'
            }`}
          >
            <Compass className="w-4 h-4 text-saffron-400" />
            <span>Realm</span>
          </button>

          <button
            onClick={() => onNavigate('/play')}
            className={`px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
              currentRoute === '/play' 
                ? 'bg-gradient-to-r from-saffron-600 to-marigold text-cosmic-950 font-bold shadow-md shadow-saffron-600/30'
                : 'text-amber-200 hover:text-amber-100 hover:bg-white/5'
            }`}
          >
            <Play className={`w-4 h-4 ${currentRoute === '/play' ? 'fill-cosmic-950' : 'text-marigold fill-current'}`} />
            <span>Dash Arena</span>
          </button>

          <button
            onClick={() => onNavigate('/leaderboard')}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
              currentRoute === '/leaderboard' 
                ? 'bg-gradient-to-r from-saffron-700/40 to-amber-700/30 text-amber-200 border border-gold-500/40 shadow-sm'
                : 'text-amber-100/70 hover:text-amber-200 hover:bg-white/5'
            }`}
          >
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span>Leaderboard</span>
          </button>

          <button
            onClick={() => onNavigate('/dashboard')}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
              currentRoute === '/dashboard' 
                ? 'bg-gradient-to-r from-saffron-700/40 to-amber-700/30 text-amber-200 border border-gold-500/40 shadow-sm'
                : 'text-amber-100/70 hover:text-amber-200 hover:bg-white/5'
            }`}
          >
            <User className="w-4 h-4 text-amber-300" />
            <span>Profile</span>
          </button>
        </nav>

        {/* Right Action Icons & Auth */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Audio Engine Button */}
          <button
            onClick={handleToggleSound}
            title={isMuted ? 'Unmute Divine Acoustics' : 'Mute Divine Acoustics'}
            className="p-2 rounded-xl border border-gold-500/30 bg-cosmic-800/80 text-amber-300 hover:text-amber-100 hover:bg-cosmic-700 transition-colors shadow-inner cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-marigold animate-pulse" />}
          </button>

          {/* User Profile / Login */}
          {currentUser ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onNavigate('/dashboard')}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-full border border-marigold/40 bg-saffron-950/50 hover:bg-saffron-900/60 transition-colors text-xs text-amber-200 cursor-pointer shadow-sm"
              >
                {currentUser.avatar_url ? (
                  <img
                    src={currentUser.avatar_url}
                    alt={currentUser.username}
                    className="w-5 h-5 rounded-full object-cover border border-gold-400"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-saffron-600 to-gold-400 text-cosmic-950 font-bold flex items-center justify-center text-[10px]">
                    {currentUser.username[0]?.toUpperCase() || 'M'}
                  </div>
                )}
                <span className="hidden sm:inline font-medium max-w-[110px] truncate font-cinzel">
                  {currentUser.username}
                </span>
                <span title="Supabase Cloud Synced">
                  <Cloud className="w-3.5 h-3.5 text-emerald-400 ml-0.5" />
                </span>
              </button>
              <button
                onClick={handleLogout}
                title="Sign Out"
                className="p-1.5 rounded-lg text-amber-400/60 hover:text-rose-400 hover:bg-white/5 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onNavigate('/auth')}
              className="px-4 py-1.5 text-xs font-semibold rounded-full bg-gradient-to-r from-saffron-600 via-amber-500 to-marigold text-cosmic-950 shadow-md shadow-saffron-600/30 hover:brightness-110 active:scale-95 transition-all cursor-pointer font-cinzel"
            >
              Sign In
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
