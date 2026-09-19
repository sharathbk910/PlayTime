import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Trophy, Compass, User, LogOut, ShieldCheck, Sparkles, Play } from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';
import { localAuth, supabase, isLiveSupabaseConfigured } from '../utils/supabaseClient';

export default function Navbar({ currentRoute, onNavigate }) {
  const [isMuted, setIsMuted] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Check auth
    if (isLiveSupabaseConfigured && supabase) {
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user) {
          setCurrentUser({
            id: data.user.id,
            username: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'Mooshak Seeker',
            email: data.user.email
          });
        } else {
          setCurrentUser(localAuth.getUser());
        }
      });
    } else {
      setCurrentUser(localAuth.getUser());
    }
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
    onNavigate('/');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gold-500/20 bg-cosmic-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between py-3">
        
        {/* Brand / Logo */}
        <button 
          onClick={() => onNavigate('/')}
          className="flex items-center space-x-3 group text-left focus:outline-none"
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
            <span className="block text-xs uppercase tracking-widest text-amber-300/80 font-cinzel font-semibold">
              Ganesh Chaturthi Contest
            </span>
            <span className="block text-base sm:text-lg font-bold font-mythic tracking-wide bg-gradient-to-r from-amber-200 via-marigold to-saffron-400 bg-clip-text text-transparent">
              Celestial Dash: Mooshak's Quest
            </span>
          </div>
        </button>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center space-x-1 sm:space-x-2">
          <button
            onClick={() => onNavigate('/')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
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
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
              currentRoute === '/play' 
                ? 'bg-gradient-to-r from-saffron-700/40 to-amber-700/30 text-amber-200 border border-gold-500/40 shadow-sm'
                : 'text-amber-100/70 hover:text-amber-200 hover:bg-white/5'
            }`}
          >
            <Play className="w-4 h-4 text-marigold fill-current" />
            <span>Dash Arena</span>
          </button>

          <button
            onClick={() => onNavigate('/leaderboard')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
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
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
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
        <div className="flex items-center space-x-3">
          {/* Audio Engine Button */}
          <button
            onClick={handleToggleSound}
            title={isMuted ? 'Unmute Acoustics' : 'Mute Acoustics'}
            className="p-2 rounded-full border border-gold-500/30 bg-cosmic-800/80 text-amber-300 hover:text-amber-100 hover:bg-cosmic-700 transition-colors shadow-inner"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-marigold" />}
          </button>

          {/* User Profile / Login */}
          {currentUser ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onNavigate('/dashboard')}
                className="flex items-center space-x-2 px-3 py-1 rounded-full border border-marigold/40 bg-saffron-950/40 hover:bg-saffron-900/50 transition-colors text-xs text-amber-200"
              >
                <div className="w-5 h-5 rounded-full bg-saffron-500 text-cosmic-950 font-bold flex items-center justify-center text-[10px]">
                  {currentUser.username[0]?.toUpperCase() || 'M'}
                </div>
                <span className="hidden sm:inline font-medium max-w-[110px] truncate">
                  {currentUser.username}
                </span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 ml-1" title="Anti-Cheat Active" />
              </button>
              <button
                onClick={handleLogout}
                title="Sign Out"
                className="p-1.5 rounded-full text-amber-400/60 hover:text-rose-400 hover:bg-white/5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onNavigate('/auth')}
              className="px-4 py-1.5 text-xs font-semibold rounded-full bg-gradient-to-r from-saffron-600 via-amber-500 to-marigold text-cosmic-950 shadow-md shadow-saffron-600/30 hover:brightness-110 active:scale-95 transition-all"
            >
              Sign In
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
