import React from 'react';
import { Play, Sparkles, Trophy, Shield, Cpu, Flame, Zap, ArrowRight, Gauge, CloudCheck, Star, Users } from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';

export default function LandingPage({ onNavigate }) {
  const handleStartDash = () => {
    audioEngine.playTempleBell(528);
    audioEngine.startAmbientDrone();
    onNavigate('/play');
  };

  return (
    <div className="relative min-h-[calc(100vh-4.5rem)] flex flex-col justify-between py-6 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      
      {/* Hero Section */}
      <section className="w-full text-center pt-4 pb-8">
        
        {/* Contest Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full temple-glass border border-gold-400/40 text-xs sm:text-sm font-cinzel text-amber-200 mb-6 shadow-xl shadow-saffron-900/30">
          <span className="w-2.5 h-2.5 rounded-full bg-saffron-500 animate-ping" />
          <span className="text-amber-300 font-semibold">Ganesh Chaturthi Game Design Contest</span>
          <span className="text-amber-400/60">&bull;</span>
          <span className="text-marigold font-bold">3D Infinite Cosmic Runner</span>
        </div>

        {/* Majestic Glowing Mooshak Hero Centerpiece */}
        <div className="relative mx-auto my-3 w-48 h-48 sm:w-60 sm:h-60 flex items-center justify-center">
          {/* Pulsing Diya Glow Rings */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-saffron-600/40 via-marigold/30 to-crimson-600/30 blur-3xl animate-pulse-glow" />
          <div className="absolute inset-2 rounded-full border-2 border-dashed border-gold-divine/40 animate-mandala-reverse opacity-70" />
          <div className="absolute inset-0 rounded-full border border-saffron-500/60 animate-mandala-spin opacity-50" />
          
          {/* Mooshak Vahana Silhouette */}
          <div 
            onClick={handleStartDash}
            className="relative z-10 text-7xl sm:text-8xl drop-shadow-[0_0_40px_rgba(255,153,51,0.95)] select-none transform hover:scale-115 hover:rotate-3 active:scale-95 transition-all duration-500 cursor-pointer"
            title="Click to launch Mooshak's Dash!"
          >
            🐭
          </div>

          {/* Golden Floating Modaks & Celestial Symbols */}
          <span className="absolute top-1 right-3 text-3xl animate-float filter drop-shadow(0 0 10px #ffd700)">🥮</span>
          <span className="absolute bottom-2 left-3 text-2xl animate-float-slow filter drop-shadow(0 0 10px #ff9933)">✨</span>
          <span className="absolute top-2 left-4 text-2xl animate-float filter drop-shadow(0 0 10px #ff7722)">🪷</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-mythic tracking-wide leading-tight mt-3 mb-3 bg-gradient-to-r from-amber-100 via-marigold to-saffron-400 bg-clip-text text-transparent glow-text-gold">
          Celestial Dash: Mooshak's Quest
        </h1>

        <p className="max-w-2xl mx-auto text-sm sm:text-base text-amber-200/80 font-normal leading-relaxed mb-6">
          Embark upon the sacred 3-lane cosmic tracks of Mount Kailash! Leap over holy fire pits, slide under demon barriers, collect glowing Modaks, and unlock Gemini AI Divine Gate trivia to save Lord Ganesha's realm.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-8">
          <button
            onClick={handleStartDash}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-saffron-600 via-marigold to-gold-400 text-cosmic-950 font-bold font-cinzel text-sm sm:text-base tracking-wider uppercase shadow-xl shadow-saffron-600/40 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 group cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current group-hover:translate-x-1 transition-transform" />
            <span>Dash into the Cosmos</span>
          </button>

          <button
            onClick={() => onNavigate('/leaderboard')}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl temple-glass border border-gold-400/40 text-amber-200 font-cinzel text-sm sm:text-base hover:bg-white/5 hover:border-gold-300 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
          >
            <Trophy className="w-5 h-5 text-yellow-400" />
            <span>Leaderboard</span>
          </button>
        </div>

        {/* Real-time Realm Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto my-4">
          <div className="temple-glass rounded-xl p-3 border border-gold-500/20 text-center">
            <span className="block text-lg font-bold font-mono text-gold-divine glow-text-gold">3 Lanes</span>
            <span className="text-[11px] text-amber-300/70 font-cinzel uppercase">Cosmic Highway</span>
          </div>
          <div className="temple-glass rounded-xl p-3 border border-gold-500/20 text-center">
            <span className="block text-lg font-bold font-mono text-marigold">Gemini 2.5 Flash</span>
            <span className="text-[11px] text-amber-300/70 font-cinzel uppercase">AI Divine Oracle</span>
          </div>
          <div className="temple-glass rounded-xl p-3 border border-gold-500/20 text-center">
            <span className="block text-lg font-bold font-mono text-emerald-400">HMAC-SHA256</span>
            <span className="text-[11px] text-amber-300/70 font-cinzel uppercase">Anti-Cheat Telemetry</span>
          </div>
          <div className="temple-glass rounded-xl p-3 border border-gold-500/20 text-center">
            <span className="block text-lg font-bold font-mono text-cyan-300">Supabase Cloud</span>
            <span className="text-[11px] text-amber-300/70 font-cinzel uppercase">Realtime Sync</span>
          </div>
        </div>

      </section>

      {/* Feature Pillar Cards */}
      <section className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 my-4">
        
        {/* Pillar 1 */}
        <div className="temple-glass rounded-3xl p-6 border border-gold-500/20 hover:border-gold-400/50 hover:bg-white/[0.02] transition-all group shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-saffron-950/60 border border-saffron-500/40 flex items-center justify-center text-saffron-400 mb-4 group-hover:scale-110 transition-transform">
            <Gauge className="w-6 h-6 text-marigold" />
          </div>
          <h2 className="text-lg font-bold font-cinzel text-amber-100 mb-2">
            3-Lane High-Speed Dash
          </h2>
          <p className="text-xs sm:text-sm text-amber-200/70 leading-relaxed">
            Fast, responsive 3D controls. Switch lanes instantly with Arrow Keys or Swipe, leap over sacred fire pits, and slide flat under floating demon maces while hoarding glowing Modaks.
          </p>
        </div>

        {/* Pillar 2 */}
        <div className="temple-glass rounded-3xl p-6 border border-gold-500/20 hover:border-gold-400/50 hover:bg-white/[0.02] transition-all group shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-cosmic-800/60 border border-gold-500/40 flex items-center justify-center text-yellow-300 mb-4 group-hover:scale-110 transition-transform">
            <Cpu className="w-6 h-6 text-yellow-400" />
          </div>
          <h2 className="text-lg font-bold font-cinzel text-amber-100 mb-2">
            Gemini AI "Divine Gate" Revive
          </h2>
          <p className="text-xs sm:text-sm text-amber-200/70 leading-relaxed">
            Hitting an obstacle triggers the Divine Gate! Answer high-stakes mythological trivia generated via Google Gemini AI for an Extra Life and multiplier, backed by an offline 25+ question vault.
          </p>
        </div>

        {/* Pillar 3 */}
        <div className="temple-glass rounded-3xl p-6 border border-gold-500/20 hover:border-gold-400/50 hover:bg-white/[0.02] transition-all group shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
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

      {/* Controls Reference Bar with Keycaps */}
      <section className="w-full my-4 p-5 rounded-3xl temple-glass-gold border border-gold-500/40 text-center shadow-xl">
        <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-300 mb-3 font-cinzel">
          <Zap className="w-4 h-4 text-marigold" />
          <span>Vahana Navigation Keycap Commands</span>
        </div>
        
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs text-amber-100">
          <div className="flex items-center gap-1.5">
            <kbd className="px-2.5 py-1 rounded-lg bg-cosmic-950 border border-gold-400 text-amber-300 font-mono text-xs shadow-md">A</kbd>
            <span>or</span>
            <kbd className="px-2.5 py-1 rounded-lg bg-cosmic-950 border border-gold-400 text-amber-300 font-mono text-xs shadow-md">&larr;</kbd>
            <span className="ml-1 text-amber-200/80 font-cinzel font-semibold">Left Lane</span>
          </div>

          <div className="flex items-center gap-1.5">
            <kbd className="px-2.5 py-1 rounded-lg bg-cosmic-950 border border-gold-400 text-amber-300 font-mono text-xs shadow-md">D</kbd>
            <span>or</span>
            <kbd className="px-2.5 py-1 rounded-lg bg-cosmic-950 border border-gold-400 text-amber-300 font-mono text-xs shadow-md">&rarr;</kbd>
            <span className="ml-1 text-amber-200/80 font-cinzel font-semibold">Right Lane</span>
          </div>

          <div className="flex items-center gap-1.5">
            <kbd className="px-2.5 py-1 rounded-lg bg-cosmic-950 border border-gold-400 text-amber-300 font-mono text-xs shadow-md">W</kbd>
            <span>or</span>
            <kbd className="px-2.5 py-1 rounded-lg bg-cosmic-950 border border-gold-400 text-amber-300 font-mono text-xs shadow-md">Space</kbd>
            <span className="ml-1 text-amber-200/80 font-cinzel font-semibold">Jump</span>
          </div>

          <div className="flex items-center gap-1.5">
            <kbd className="px-2.5 py-1 rounded-lg bg-cosmic-950 border border-gold-400 text-amber-300 font-mono text-xs shadow-md">S</kbd>
            <span>or</span>
            <kbd className="px-2.5 py-1 rounded-lg bg-cosmic-950 border border-gold-400 text-amber-300 font-mono text-xs shadow-md">&darr;</kbd>
            <span className="ml-1 text-amber-200/80 font-cinzel font-semibold">Slide</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-amber-400/50 font-cinzel">
        Created with devotion for the Ganesh Chaturthi Game Design Contest &bull; Built with React, Three.js, Gemini AI & Supabase
      </footer>

    </div>
  );
}
