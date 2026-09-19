import React from 'react';
import { Play, Sparkles, Trophy, Shield, Cpu, Flame, Zap, ArrowRight, Gauge } from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';

export default function LandingPage({ onNavigate }) {
  const handleStartDash = () => {
    audioEngine.playTempleBell(528);
    audioEngine.startAmbientDrone();
    onNavigate('/play');
  };

  return (
    <div className="relative min-h-[calc(100vh-4.5rem)] flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8">
      
      {/* Hero Section */}
      <section className="max-w-5xl mx-auto w-full text-center pt-6 pb-12">
        
        {/* Contest Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full temple-glass border border-gold-400/40 text-xs sm:text-sm font-cinzel text-amber-200 mb-6 shadow-lg shadow-saffron-900/20">
          <span className="w-2 h-2 rounded-full bg-saffron-500 animate-ping" />
          <span className="text-amber-300 font-semibold">Ganesh Chaturthi Game Design Contest</span>
          <span className="text-amber-400/60">&bull;</span>
          <span className="text-marigold">3D Endless Runner Edition</span>
        </div>

        {/* Majestic Glowing Mooshak Hero Centerpiece */}
        <div className="relative mx-auto my-4 w-44 h-44 sm:w-56 sm:h-56 flex items-center justify-center">
          {/* Pulsing Diya Glow Rings */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-saffron-600/30 via-marigold/20 to-crimson-600/20 blur-2xl animate-pulse-glow" />
          <div className="absolute inset-3 rounded-full border border-gold-divine/40 animate-mandala-reverse opacity-60" />
          <div className="absolute inset-0 rounded-full border border-saffron-500/50 animate-mandala-spin opacity-40" />
          
          {/* Mooshak Vahana Silhouette */}
          <div className="relative z-10 text-7xl sm:text-8xl drop-shadow-[0_0_35px_rgba(255,153,51,0.9)] select-none transform hover:scale-110 transition-transform duration-500">
            🐭
          </div>

          {/* Golden Floating Modaks & Celestial Symbols */}
          <span className="absolute top-2 right-4 text-2xl animate-float">🥮</span>
          <span className="absolute bottom-3 left-4 text-2xl animate-float-slow">✨</span>
          <span className="absolute top-3 left-6 text-xl animate-float">🪷</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-mythic tracking-wide leading-tight mt-2 mb-4 bg-gradient-to-r from-amber-100 via-marigold to-saffron-400 bg-clip-text text-transparent glow-text-gold">
          Celestial Dash: Mooshak's Quest
        </h1>

        <p className="max-w-2xl mx-auto text-sm sm:text-base text-amber-200/80 font-normal leading-relaxed mb-8">
          Take control of Lord Ganesha's loyal vahana, Mooshak! Sprint along the 3 cosmic lanes, jump over sacred fire pits, slide under demon barriers, and collect golden Modaks across the heavens.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
          <button
            onClick={handleStartDash}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-saffron-600 via-marigold to-gold-400 text-cosmic-950 font-bold font-cinzel text-sm sm:text-base tracking-wider uppercase shadow-xl shadow-saffron-600/40 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 group"
          >
            <Play className="w-5 h-5 fill-current group-hover:translate-x-0.5 transition-transform" />
            <span>Dash into the Cosmos</span>
          </button>

          <button
            onClick={() => onNavigate('/leaderboard')}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl temple-glass border border-gold-400/30 text-amber-200 font-cinzel text-sm sm:text-base hover:bg-white/5 hover:border-gold-300 transition-all flex items-center justify-center gap-2"
          >
            <Trophy className="w-5 h-5 text-yellow-400" />
            <span>Leaderboard</span>
          </button>
        </div>

      </section>

      {/* Feature Pillar Cards */}
      <section className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-6 my-6">
        
        {/* Pillar 1: 3-Lane Runner Mechanics */}
        <div className="temple-glass rounded-2xl p-6 border border-gold-500/20 hover:border-gold-400/50 transition-all group">
          <div className="w-12 h-12 rounded-xl bg-saffron-950/60 border border-saffron-500/40 flex items-center justify-center text-saffron-400 mb-4 group-hover:scale-110 transition-transform">
            <Gauge className="w-6 h-6 text-marigold" />
          </div>
          <h2 className="text-lg font-bold font-cinzel text-amber-100 mb-2">
            3-Lane High-Speed Dash
          </h2>
          <p className="text-xs sm:text-sm text-amber-200/70 leading-relaxed">
            Fast, responsive 3D controls. Switch lanes with Arrow Keys/Swipe, leap over rolling pillars and fire pits, and slide flat under floating demon maces while hoarding glowing Modaks.
          </p>
        </div>

        {/* Pillar 2: AI Divine Gate Checkpoint */}
        <div className="temple-glass rounded-2xl p-6 border border-gold-500/20 hover:border-gold-400/50 transition-all group">
          <div className="w-12 h-12 rounded-xl bg-cosmic-800/60 border border-gold-500/40 flex items-center justify-center text-yellow-300 mb-4 group-hover:scale-110 transition-transform">
            <Cpu className="w-6 h-6 text-yellow-400" />
          </div>
          <h2 className="text-lg font-bold font-cinzel text-amber-100 mb-2">
            Gemini AI "Divine Gate" Revive
          </h2>
          <p className="text-xs sm:text-sm text-amber-200/70 leading-relaxed">
            Hitting an obstacle triggers the Divine Gate! Answer high-stakes mythological trivia generated via Google Gemini 2.5 Flash for an Extra Life and multiplier. Protected by an offline 25+ question vault.
          </p>
        </div>

        {/* Pillar 3: Ghost Multiplayer & Anti-Cheat */}
        <div className="temple-glass rounded-2xl p-6 border border-gold-500/20 hover:border-gold-400/50 transition-all group">
          <div className="w-12 h-12 rounded-xl bg-crimson-sacred/40 border border-crimson-500/40 flex items-center justify-center text-rose-400 mb-4 group-hover:scale-110 transition-transform">
            <Shield className="w-6 h-6 text-emerald-400" />
          </div>
          <h2 className="text-lg font-bold font-cinzel text-amber-100 mb-2">
            Ghost Racing & Anti-Cheat
          </h2>
          <p className="text-xs sm:text-sm text-amber-200/70 leading-relaxed">
            See concurrent runners alongside Mooshak via Supabase Realtime WebSockets. Scores are mathematically verified by speed limit bounds (distance/time) and item density checks.
          </p>
        </div>

      </section>

      {/* Controls Reference Bar */}
      <section className="max-w-4xl mx-auto w-full my-4 p-5 rounded-2xl bg-gradient-to-r from-saffron-950/40 via-cosmic-900/80 to-saffron-950/40 border border-gold-500/30 text-center">
        <div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-widest text-amber-300 mb-1">
          <Zap className="w-4 h-4 text-marigold" />
          <span>Vahana Navigation Commands</span>
        </div>
        <p className="text-xs sm:text-sm text-amber-100">
          <span className="font-mono text-amber-300">&larr; / A</span>: Left Lane &bull;{' '}
          <span className="font-mono text-amber-300">&rarr; / D</span>: Right Lane &bull;{' '}
          <span className="font-mono text-amber-300">&uarr; / W / Space</span>: Jump Over Obstacles &bull;{' '}
          <span className="font-mono text-amber-300">&darr; / S</span>: Slide Under Barriers
        </p>
      </section>

      {/* Footer / Contest Attribution */}
      <footer className="text-center py-4 text-xs text-amber-400/50 font-cinzel">
        Created with devotion for the Ganesh Chaturthi Game Design Contest &bull; Built with React, Three.js, Gemini AI & Supabase
      </footer>

    </div>
  );
}
