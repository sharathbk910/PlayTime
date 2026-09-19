import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, XCircle, BookOpen, Heart, AlertOctagon, ArrowRight } from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';

export default function RiddleModal({
  isOpen,
  foulMessage = '',
  distance = 0,
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
      const startStamp = Date.now();

      try {
        const res = await fetch('/api/trivia/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ difficulty: 'medium' })
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
            topic: 'Mooshak the Sacred Vahana',
            question: 'Why does Lord Ganesha, the remover of all obstacles, choose to ride upon Mooshak the mouse?',
            options: [
              'Mooshak symbolizes turbulent desires, tamed and steered by supreme wisdom',
              'Because mice are swift enough to outrun celestial garudas',
              'Mooshak possessed the ability to burrow into Mount Meru',
              'Because Mount Kailash pathways are barred to larger animals'
            ],
            correct_index: 0,
            wisdom_explanation: 'The mouse represents restless desires gnawing in the dark. Ganesha sitting atop Mooshak demonstrates intellect guiding desires into righteousness.',
            divine_blessing: '+200 Divine Multiplier & Extra Life Granted'
          });
          setOracleNotice('The Oracle is resting in cosmic meditation. Ancient temple scrolls have unsealed.');
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
  }, [isOpen]);

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
        blessing: trivia.divine_blessing
      });
    }, 2200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cosmic-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-xl rounded-3xl temple-glass-gold border-2 border-gold-temple p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Corner Accents */}
        <div className="absolute top-2 left-2 text-gold-divine/60 text-xs">🪷</div>
        <div className="absolute top-2 right-2 text-gold-divine/60 text-xs">🪷</div>
        <div className="absolute bottom-2 left-2 text-gold-divine/60 text-xs">🪷</div>
        <div className="absolute bottom-2 right-2 text-gold-divine/60 text-xs">🪷</div>

        {/* Modal Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/70 border border-rose-500/60 text-rose-300 text-xs font-semibold uppercase tracking-wider mb-2">
            <AlertOctagon className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            <span>Foul Incurred &bull; Divine Gate Challenge</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold font-mythic text-amber-100 glow-text-gold">
            The Oracle's Inscription
          </h3>
          <p className="text-xs text-amber-300/80 font-cinzel mt-1">
            {foulMessage || `Foul at ${distance ? distance.toFixed(0) : 0}m!`} Answer correctly to clear the foul & continue your quest!
          </p>
        </div>

        {/* Oracle Notice (Fallback or API limit notice) */}
        {oracleNotice && (
          <div className="mb-4 p-2.5 rounded-xl bg-amber-950/50 border border-amber-500/40 flex items-center gap-2 text-xs text-amber-200">
            <BookOpen className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{oracleNotice}</span>
          </div>
        )}

        {/* Body Content */}
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 rounded-full border-2 border-gold-400 border-t-transparent animate-spin" />
            <p className="text-sm font-cinzel text-amber-300 animate-pulse">
              Consulting the Kailash Oracle (Gemini AI)...
            </p>
          </div>
        ) : trivia ? (
          <div className="space-y-4">
            {/* Question Card */}
            <div className="p-4 rounded-xl bg-cosmic-900/85 border border-gold-500/30 shadow-inner">
              <p className="text-sm sm:text-base font-medium text-amber-50 leading-relaxed">
                "{trivia.question}"
              </p>
            </div>

            {/* 4 Choices */}
            <div className="space-y-2.5">
              {trivia.options.map((opt, idx) => {
                let btnStyle = 'border-gold-500/30 bg-cosmic-800/60 hover:bg-saffron-950/60 hover:border-gold-400 text-amber-100';

                if (isAnswered) {
                  if (idx === trivia.correct_index) {
                    btnStyle = 'border-emerald-500 bg-emerald-950/70 text-emerald-200 shadow-md shadow-emerald-900/50';
                  } else if (idx === selectedOption) {
                    btnStyle = 'border-rose-500 bg-rose-950/70 text-rose-200 shadow-md shadow-rose-900/50';
                  } else {
                    btnStyle = 'opacity-50 border-gray-700 bg-black/30 text-gray-400';
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={isAnswered}
                    onClick={() => handleSelectOption(idx)}
                    className={`w-full p-3.5 rounded-xl border text-left text-xs sm:text-sm font-medium transition-all duration-200 flex items-start gap-3 ${btnStyle}`}
                  >
                    <span className="w-6 h-6 rounded-full border border-gold-400/40 bg-cosmic-950 flex items-center justify-center text-xs font-bold text-amber-300 shrink-0">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="flex-1 mt-0.5">{opt}</span>
                    {isAnswered && idx === trivia.correct_index && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    )}
                    {isAnswered && idx === selectedOption && idx !== trivia.correct_index && (
                      <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Post-Answer Result & Wisdom Explanation */}
            {isAnswered && (
              <div className={`p-4 rounded-xl border animate-in fade-in duration-300 ${
                isCorrect 
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' 
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
              }`}>
                <div className="flex items-center gap-2 font-semibold text-xs sm:text-sm mb-1">
                  <Sparkles className="w-4 h-4 text-marigold" />
                  <span>
                    {isCorrect
                      ? '✨ Foul Cleared! Extra Life & Invulnerability Granted (+200 pts)!'
                      : '❌ Failed to Clear Foul. The Run Has Concluded.'}
                  </span>
                </div>
                <p className="text-xs leading-relaxed opacity-90">
                  {trivia.wisdom_explanation}
                </p>
              </div>
            )}

            {/* Decline / Give Up Button */}
            {!isAnswered && (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={onGiveUp}
                  className="text-xs text-amber-400/60 hover:text-amber-300 font-cinzel underline"
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
