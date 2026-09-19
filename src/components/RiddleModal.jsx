import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, XCircle, BookOpen, Heart, AlertOctagon, ArrowRight, ShieldCheck } from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';

export default function RiddleModal({
  isOpen,
  foulMessage = '',
  distance = 0,
  loreLevel = 1,
  onClose,
  onAnswerResolved,
  onGiveUp
}) {
  const [loading, setLoading] = useState(true);
  const [trivia, setTrivia] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [oracleNotice, setOracleNotice] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setTrivia(null);
      setSelectedOption(null);
      setIsAnswered(false);
      setLoading(true);
      setOracleNotice('');
      return;
    }

    let isMounted = true;
    const fetchTrivia = async () => {
      setLoading(true);

      try {
        const res = await fetch('/api/trivia/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ difficulty: 'medium', loreLevel: loreLevel || 1 })
        });

        const data = await res.json();
        if (!isMounted) return;

        const triviaItem = data?.trivia || data?.riddle;
        if (triviaItem) {
          setTrivia(triviaItem);
          setStartTime(Date.now());
          if (triviaItem.oracle_notice) {
            setOracleNotice(triviaItem.oracle_notice);
          }
        }
      } catch (err) {
        console.warn('Trivia API fallback:', err);
        if (isMounted) {
          setTrivia({
            id: 'local-fallback',
            lore_level: loreLevel || 1,
            chapter_title: 'Chapter 1: The Sacred Turmeric Creation',
            story_summary: 'Goddess Parvati shaped young Ganesha from turmeric paste and breathed life into Him.',
            question: 'From which sacred substance did Goddess Parvati shape young Ganesha?',
            options: [
              'White Himalayan river clay',
              'Sacred turmeric paste and divine breath',
              'Carved golden sandalwood',
              'Blossoming lotus petals'
            ],
            correct_index: 1,
            wisdom_explanation: 'Parvati created Ganesha from golden turmeric paste (haldi), symbolizing auspicious beginnings.',
            divine_blessing: '+200 Divine Multiplier & Extra Life'
          });
          setStartTime(Date.now());
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTrivia();

    return () => {
      isMounted = false;
    };
  }, [isOpen, loreLevel]);

  const handleSelectOption = (idx) => {
    if (isAnswered || !trivia) return;

    const solveTime = Date.now();
    setSelectedOption(idx);
    setIsAnswered(true);

    const correct = idx === trivia.correct_index;
    setIsCorrect(correct);

    if (correct) {
      audioEngine.playReviveFanfare();
    } else {
      audioEngine.playCollisionSound();
    }

    // Give player time to read the profound wisdom explanation
    setTimeout(() => {
      onAnswerResolved({
        puzzleId: trivia.id,
        startTime,
        solveTime,
        isCorrect: correct,
        loreLevel: trivia.lore_level || loreLevel || 1,
        chapterTitle: trivia.chapter_title || `Chapter ${loreLevel}`,
        storySummary: trivia.story_summary || trivia.wisdom_explanation,
        blessing: trivia.divine_blessing
      });
    }, 2200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cosmic-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-3xl temple-glass-gold border-2 border-gold-temple p-5 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Corner Accents */}
        <div className="absolute top-2 left-2 text-gold-divine/60 text-xs">🪷</div>
        <div className="absolute top-2 right-2 text-gold-divine/60 text-xs">🪷</div>
        <div className="absolute bottom-2 left-2 text-gold-divine/60 text-xs">🪷</div>
        <div className="absolute bottom-2 right-2 text-gold-divine/60 text-xs">🪷</div>

        {/* Modal Header */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-saffron-950/80 border border-gold-500/50 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-2 shadow-sm font-cinzel">
            <BookOpen className="w-3.5 h-3.5 text-marigold" />
            <span>Ganesha Lore: Chapter {trivia?.lore_level || loreLevel || 1} of 10</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-bold font-mythic text-amber-100 glow-text-gold">
            The Divine Gate of Kailash
          </h3>
          <p className="text-xs text-amber-300/80 font-cinzel mt-0.5">
            Answer the sacred riddle to clear the foul, revive Mooshak, and unlock sacred wisdom!
          </p>
        </div>

        {/* Body Content */}
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <div className="w-10 h-10 rounded-full border-2 border-gold-400 border-t-transparent animate-spin" />
            <p className="text-xs font-cinzel text-amber-300 animate-pulse">
              Consulting the Sacred Chronicles of Ganesha (Gemini AI)...
            </p>
          </div>
        ) : trivia ? (
          <div className="space-y-3.5">
            {/* Question Card (Short & Clear) */}
            <div className="p-3.5 rounded-2xl bg-cosmic-900/90 border border-gold-500/40 shadow-inner text-center">
              <p className="text-sm sm:text-base font-semibold text-amber-50 leading-relaxed font-sans">
                "{trivia.question}"
              </p>
            </div>

            {/* 4 Choices (Shuffled & Randomized) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {trivia.options.map((opt, idx) => {
                let btnStyle = 'border-gold-500/30 bg-cosmic-900/70 hover:bg-saffron-950/80 hover:border-gold-400 text-amber-100';

                if (isAnswered) {
                  if (idx === trivia.correct_index) {
                    btnStyle = 'border-emerald-500 bg-emerald-950/80 text-emerald-100 shadow-md shadow-emerald-900/60 ring-1 ring-emerald-400';
                  } else if (idx === selectedOption) {
                    btnStyle = 'border-rose-500 bg-rose-950/80 text-rose-200 shadow-md shadow-rose-900/60';
                  } else {
                    btnStyle = 'opacity-40 border-gray-700 bg-black/30 text-gray-400';
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={isAnswered}
                    onClick={() => handleSelectOption(idx)}
                    className={`p-3 rounded-2xl border text-left text-xs font-medium transition-all duration-150 flex items-center gap-2.5 cursor-pointer active:scale-98 ${btnStyle}`}
                  >
                    <span className="w-5 h-5 rounded-full border border-gold-400/50 bg-cosmic-950 flex items-center justify-center text-[11px] font-bold text-amber-300 shrink-0 font-cinzel">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="flex-1 leading-snug">{opt}</span>
                    {isAnswered && idx === trivia.correct_index && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    )}
                    {isAnswered && idx === selectedOption && idx !== trivia.correct_index && (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Post-Answer Result & Wisdom Explanation */}
            {isAnswered && (
              <div className={`p-3.5 rounded-2xl border animate-in fade-in duration-200 text-xs ${
                isCorrect 
                  ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200' 
                  : 'bg-rose-950/50 border-rose-500/40 text-rose-200'
              }`}>
                <div className="flex items-center gap-2 font-bold mb-1">
                  <Sparkles className="w-4 h-4 text-marigold" />
                  <span>
                    {isCorrect
                      ? `✨ Correct! Unlocked Chapter ${trivia.lore_level || loreLevel} Wisdom (+200 pts)!`
                      : '❌ Incorrect answer. Sacred run concluded.'}
                  </span>
                </div>
                <p className="opacity-90 leading-relaxed">
                  {trivia.wisdom_explanation}
                </p>
              </div>
            )}

            {/* Decline / Give Up Button */}
            {!isAnswered && (
              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={onGiveUp}
                  className="text-xs text-amber-400/60 hover:text-amber-200 font-cinzel underline cursor-pointer"
                >
                  Accept Foul & Conclude Run
                </button>
              </div>
            )}
          </div>
        ) : null}

      </div>
    </div>
  );
}
