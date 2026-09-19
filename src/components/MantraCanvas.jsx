import React, { useRef, useState, useEffect } from 'react';
import { Sparkles, Check, RefreshCw, Hand } from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';

export default function MantraCanvas({ isOpen, onMantraCompleted, onClose }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [coverage, setCoverage] = useState(0);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCoverage(0);
      setHasDrawn(false);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // High DPI scaling
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Initial clear
    ctx.clearRect(0, 0, rect.width, rect.height);
  }, [isOpen]);

  const startDrawing = (e) => {
    setIsDrawing(true);
    setHasDrawn(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const draw = (e) => {
    if (!isDrawing && e.type !== 'mousedown' && e.type !== 'touchstart') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowBlur = 18;
    ctx.shadowColor = '#FFB300';
    ctx.strokeStyle = '#FF7722';

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);

    // Increment simulated sacred resonance coverage
    setCoverage(prev => Math.min(100, prev + 2.5));
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.beginPath();
    setCoverage(0);
    setHasDrawn(false);
  };

  const handleInvoke = () => {
    audioEngine.playShankhaBlast();
    audioEngine.playDivineWisdomChime();
    onMantraCompleted();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cosmic-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-2xl temple-glass-gold border-2 border-gold-temple p-6 text-center animate-in zoom-in-95 duration-200">
        
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-saffron-600/30 border border-saffron-500/40 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5 text-marigold" />
          Kailash Sanctum &bull; Sacred Mantra Unsealing
        </div>

        <h3 className="text-xl sm:text-2xl font-bold font-mythic text-amber-100 glow-text-gold">
          Trace The Sacred Omkara (ॐ)
        </h3>
        <p className="text-xs text-amber-200/80 mb-4 font-cinzel">
          Draw the sacred vibration to attune your mind and unlock the Divine Pradakshina Path
        </p>

        {/* Canvas Area with Ghost Template */}
        <div className="relative mx-auto w-full max-w-[320px] h-[220px] rounded-xl bg-cosmic-900/90 border border-gold-500/40 overflow-hidden shadow-inner flex items-center justify-center">
          {/* Sacred Silhouette Template */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-20 text-gold-divine text-8xl font-mythic">
            ॐ
          </div>

          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onMouseMove={draw}
            onTouchStart={startDrawing}
            onTouchEnd={stopDrawing}
            onTouchMove={draw}
            className="w-full h-full cursor-crosshair touch-none"
          />

          {!hasDrawn && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-amber-300/50 text-xs gap-1">
              <Hand className="w-5 h-5 animate-bounce text-marigold" />
              <span>Trace over the sacred symbol</span>
            </div>
          )}
        </div>

        {/* Resonance Bar */}
        <div className="mt-4 max-w-[320px] mx-auto">
          <div className="flex justify-between text-[11px] text-amber-300 mb-1">
            <span>Mantra Resonance</span>
            <span>{Math.round(coverage)}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-cosmic-950 overflow-hidden border border-gold-500/30">
            <div
              className="h-full bg-gradient-to-r from-saffron-500 via-marigold to-gold-divine transition-all duration-150"
              style={{ width: `${coverage}%` }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            onClick={handleClear}
            className="px-4 py-2 rounded-lg border border-gold-500/30 text-amber-300 hover:bg-white/5 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Clear
          </button>

          <button
            onClick={handleInvoke}
            disabled={coverage < 30}
            className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all duration-200 ${
              coverage >= 30
                ? 'bg-gradient-to-r from-saffron-600 via-marigold to-gold-400 text-cosmic-950 hover:brightness-110 shadow-saffron-600/40 cursor-pointer'
                : 'bg-cosmic-800 text-amber-100/40 border border-gold-500/20 cursor-not-allowed'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>Invoke Sacred Seal</span>
          </button>
        </div>

        <button
          onClick={onClose}
          className="mt-3 text-[11px] text-amber-400/60 hover:text-amber-300 underline"
        >
          Close and return to outer race
        </button>

      </div>
    </div>
  );
}
