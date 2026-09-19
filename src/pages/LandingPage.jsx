import React from 'react';
import { Play, Trophy, Sparkles } from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';
import modhakverseLogo from '../assets/modhakverse_logo.jpg';

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
      <div className="relative z-10 w-full max-w-3xl flex flex-col items-center text-center my-auto py-6">

        {/* Majestic Glowing Ganpati Logo Hero Emblem */}
        <div className="relative my-3 w-48 h-48 sm:w-60 sm:h-60 flex items-center justify-center">
          {/* Rotating Sacred Mandala Rings */}
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-gold-divine/40 animate-mandala-reverse opacity-70" />
          <div className="absolute inset-2 rounded-full border border-saffron-500/50 animate-mandala-spin opacity-60" />

          {/* Interactive Ganpati Theme Logo Emblem */}
          <div
            onClick={handleStartDash}
            className="relative z-10 w-40 h-40 sm:w-52 sm:h-52 rounded-full p-1 bg-gradient-to-tr from-saffron-500 via-gold-400 to-amber-300 shadow-[0_0_50px_rgba(255,180,0,0.75)] hover:shadow-[0_0_80px_rgba(255,215,0,0.95)] transform hover:scale-105 active:scale-95 transition-all duration-500 cursor-pointer overflow-hidden border-2 border-gold-300 group"
            title="Click to enter ModhakVerse!"
          >
            <img 
              src={modhakverseLogo} 
              alt="ModhakVerse Logo" 
              className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-500" 
            />
          </div>

          {/* Floating Sacred Modaks & Sparks */}
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

        {/* Game Title: ModhakVerse */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black font-mythic tracking-wider uppercase bg-gradient-to-b from-amber-100 via-marigold to-saffron-500 bg-clip-text text-transparent glow-text-gold drop-shadow-[0_0_50px_rgba(255,180,0,0.5)]">
          ModhakVerse
        </h1>

        {/* Mythic Subtitle */}
        <p className="text-xs sm:text-sm md:text-base font-cinzel uppercase tracking-[0.35em] text-amber-300/90 font-bold mt-2 mb-4">
          The Epic Journey of Ganpati
        </p>

        {/* Core Gameplay Description */}
        <div className="max-w-xl mx-auto mb-6 px-6 py-4 rounded-2xl temple-glass border border-gold-500/30 shadow-xl backdrop-blur-md">
          <p className="text-sm sm:text-base text-amber-100/95 leading-relaxed font-sans">
            Run through sacred celestial realms, collect sweet golden Modaks, and answer mythological trivia questions to discover and master the epic story of Ganpati's legendary journey!
          </p>
        </div>

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

        {/* Clean Gaming Status Ticker */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mt-8 text-xs font-cinzel text-amber-300/80">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Run & Learn</span>
          </span>
          <span className="text-amber-500/40">&bull;</span>
          <span>10 Epic Lore Chapters</span>
          <span className="text-amber-500/40">&bull;</span>
          <span>Realtime Ghost Racers</span>
        </div>

      </div>

    </div>
  );
}
