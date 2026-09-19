import React, { useMemo } from 'react';

export default function CosmicBackground() {
  // Generate stable particle positions
  const particles = useMemo(() => {
    return Array.from({ length: 22 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 6 + 3,
      duration: Math.random() * 8 + 6,
      delay: Math.random() * 5,
      type: i % 3 === 0 ? 'petal' : i % 3 === 1 ? 'ember' : 'star'
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Deep Cosmic Nebula Gradient Layer */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,53,15,0.25),rgba(255,255,255,0))]" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-saffron-600/10 via-purple-900/15 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-crimson-sacred/10 rounded-full blur-3xl" />

      {/* Rotating Sacred Mandala Pattern Watermark */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] sm:w-[850px] sm:h-[850px] opacity-[0.04] animate-mandala-spin select-none">
        <svg viewBox="0 0 500 500" fill="none" stroke="currentColor" className="w-full h-full text-gold-divine">
          <circle cx="250" cy="250" r="230" strokeWidth="1.5" strokeDasharray="6 6" />
          <circle cx="250" cy="250" r="190" strokeWidth="1" />
          <circle cx="250" cy="250" r="150" strokeWidth="2" />
          <circle cx="250" cy="250" r="100" strokeWidth="1.5" strokeDasharray="4 4" />
          <circle cx="250" cy="250" r="50" strokeWidth="1" />
          {/* 12 Petal rays */}
          {Array.from({ length: 16 }).map((_, i) => (
            <path
              key={i}
              d="M 250 250 L 250 20 Q 230 100 250 180"
              transform={`rotate(${i * 22.5} 250 250)`}
              strokeWidth="1.2"
            />
          ))}
          {/* Center Omkara Symbol representation */}
          <circle cx="250" cy="250" r="15" fill="currentColor" opacity="0.3" />
        </svg>
      </div>

      {/* Floating Diyas / Floating Petals / Cosmic Sparkles */}
      {particles.map((p) => {
        if (p.type === 'petal') {
          return (
            <div
              key={p.id}
              className="absolute animate-float-slow text-amber-500/30"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                fontSize: `${p.size + 8}px`,
                animationDuration: `${p.duration}s`,
                animationDelay: `${p.delay}s`,
              }}
            >
              🌸
            </div>
          );
        } else if (p.type === 'ember') {
          return (
            <div
              key={p.id}
              className="absolute rounded-full bg-gradient-to-t from-saffron-500 to-yellow-300 animate-pulse-glow"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                opacity: 0.6,
                animationDuration: `${p.duration}s`,
                animationDelay: `${p.delay}s`,
              }}
            />
          );
        } else {
          return (
            <div
              key={p.id}
              className="absolute rounded-full bg-white/40"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: `${Math.max(2, p.size / 2)}px`,
                height: `${Math.max(2, p.size / 2)}px`,
                opacity: 0.5,
              }}
            />
          );
        }
      })}
    </div>
  );
}
