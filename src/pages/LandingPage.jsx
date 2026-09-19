import React from 'react';
import { Play, Trophy, Sparkles, Flame, Compass } from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';

export default function LandingPage({ onNavigate }) {
  const handleStartDash = () => {
    audioEngine.playTempleBell(880);
    audioEngine.playShankhaBlast();
    audioEngine.startAmbientDrone();
    onNavigate('/play');
  };

  return (
    <div className="relative min-h-[calc(100vh-4.5rem)] flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden select-none">
      
      {/* Dynamic Animated Cosmic Background Orbs & Dust */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Swirling Nebula Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] sm:w-[700px] sm:h-[700px] rounded-full bg-gradient-to-tr from-saffron-600/25 via-marigold/20 to-amber-500/10 blur-3xl animate-pulse-glow" />
        <div className="absolute top-1/3 left-1/4 w-72 h-72 rounded-full bg-rose-600/15 blur-3xl animate-float-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-amber-500/15 blur-3xl animate-float" />

        {/* Ambient Floating Golden Stars / Particles */}
        <div className="absolute top-16 left-1/6 text-amber-300/40 text-xl animate-float">✦</div>
        <div className="absolute top-28 right-1/5 text-marigold/50 text-2xl animate-float-slow">✦</div>
        <div className="absolute bottom-24 left-1/4 text-amber-400/40 text-lg animate-float-slow">✦</div>
        <div className="absolute bottom-32 right-1/6 text-gold-divine/50 text-xl animate-float">✦</div>
        <div className="absolute top-1/2 left-12 text-amber-200/30 text-base animate-pulse">★</div>
        <div className="absolute top-1/2 right-12 text-amber-200/30 text-base animate-pulse">★</div>
      </div>

      {/* Main Gaming Hero Container */}
      <div className="relative z-10 w-full max-w-3xl flex flex-col items-center text-center my-auto py-8">

        {/* Majestic Glowing Mooshak Hero Emblem */}
        <div className="relative my-4 w-52 h-52 sm:w-64 sm:h-64 flex items-center justify-center">
          {/* Rotating Celestial Mandala Rings */}
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-gold-divine/40 animate-mandala-reverse opacity-70" />
          <div className="absolute inset-3 rounded-full border border-saffron-500/50 animate-mandala-spin opacity-60" />
          <div className="absolute inset-6 rounded-full bg-gradient-to-tr from-saffron-950/80 via-cosmic-950/90 to-amber-950/70 border border-gold-400/40 shadow-2xl backdrop-blur-sm" />

          {/* Interactive Mooshak Vahana */}
          <div
            onClick={handleStartDash}
            className="relative z-10 text-8xl sm:text-9xl drop-shadow-[0_0_45px_rgba(255,153,51,0.95)] transform hover:scale-115 hover:rotate-6 active:scale-95 transition-all duration-500 cursor-pointer animate-float"
            title="Click to launch Celestial Dash!"
          >
            🐭
          </div>

          {/* Floating Sacred Modaks */}
          <span className="absolute -top-1 -right-2 text-3xl sm:text-4xl animate-float filter drop-shadow(0 0 15px #ffd700)">
            🥮
          </span>
          <span className="absolute bottom-2 -left-2 text-2xl sm:text-3xl animate-float-slow filter drop-shadow(0 0 15px #ff9933)">
            🥮
          </span>
          <span className="absolute -bottom-2 right-6 text-2xl animate-float filter drop-shadow(0 0 10px #ff7722)">
            ✨
          </span>
        </div>

        {/* Bold Gaming Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black font-mythic tracking-wider uppercase bg-gradient-to-b from-amber-100 via-marigold to-saffron-500 bg-clip-text text-transparent glow-text-gold drop-shadow-[0_0_50px_rgba(255,180,0,0.5)]">
          Celestial Dash
        </h1>

        {/* Clean Gaming Subtitle */}
        <p className="text-sm sm:text-base md:text-lg font-cinzel uppercase tracking-[0.35em] text-amber-300/90 font-bold mt-2 mb-8">
          Mooshak's Quest
        </p>

        {/* Prominent Centerpiece Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md">
          {/* Prominent Center PLAY Button */}
          <button
            onClick={handleStartDash}
            className="w-full sm:flex-1 py-4 sm:py-5 px-8 rounded-3xl bg-gradient-to-r from-saffron-600 via-marigold to-gold-400 text-cosmic-950 font-black font-mythic text-xl sm:text-2xl uppercase tracking-widest shadow-[0_0_40px_rgba(255,153,51,0.65)] hover:shadow-[0_0_60px_rgba(255,215,0,0.9)] hover:brightness-115 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer group border-2 border-gold-200"
          >
            <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-current group-hover:translate-x-1.5 transition-transform drop-shadow" />
            <span>PLAY NOW</span>
          </button>

          {/* Secondary Leaderboard Button */}
          <button
            onClick={() => onNavigate('/leaderboard')}
            className="w-full sm:w-auto py-4 sm:py-5 px-6 rounded-3xl temple-glass border-2 border-gold-500/40 text-amber-200 font-cinzel font-bold text-sm sm:text-base uppercase tracking-wider hover:bg-white/10 hover:border-gold-300 hover:scale-102 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-xl"
          >
            <Trophy className="w-5 h-5 text-yellow-400" />
            <span>Leaderboard</span>
          </button>
        </div>

        {/* Minimal Gaming Status Ticker */}
        <div className="flex items-center justify-center gap-4 sm:gap-6 mt-10 text-xs font-cinzel text-amber-300/70">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Mount Kailash 3-Lane Track</span>
          </span>
          <span className="text-amber-500/40">&bull;</span>
          <span>10 Lore Chapters</span>
          <span className="text-amber-500/40">&bull;</span>
          <span>Realtime Ghost Racers</span>
        </div>

      </div>

    </div>
  );
}
