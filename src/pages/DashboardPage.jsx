import React, { useState, useEffect } from 'react';
import {
  User,
  Trophy,
  Award,
  Gauge,
  Sparkles,
  ShieldCheck,
  Play,
  ArrowRight,
  Heart,
  CloudCheck,
  CheckCircle2,
  History,
  Edit3,
  Check,
  X,
  BookOpen,
  Lock,
  Unlock,
  ChevronRight
} from 'lucide-react';
import {
  localAuth,
  supabase,
  isLiveSupabaseConfigured,
  logUserAction,
  syncUserProfile,
  updateCustomDisplayName,
  CELESTIAL_GUEST_UUID
} from '../utils/supabaseClient';
import { audioEngine } from '../utils/audioEngine';

// 10 Chronological Ganesha Lore Chapters
const LORE_CHAPTERS = [
  {
    level: 1,
    title: 'The Sacred Turmeric Creation',
    summary: 'Before her holy bath on Mount Kailash, Goddess Parvati shaped a divine child from fragrant golden turmeric paste and infused Him with life to guard her inner sanctum.',
    teaching: 'Symbolizes auspicious beginnings (Shubha), primal purity, and unshakeable filial love.',
    blessing: '+200 Wisdom & Shield of Auspiciousness',
    source: 'Shiva Purana'
  },
  {
    level: 2,
    title: 'The Guardian at the Door',
    summary: 'Standing steadfast at the threshold, young Ganesha loyally barred even Lord Shiva from entering, upholding his mother’s sacred trust with absolute devotion.',
    teaching: 'Teaches unwavering commitment to righteous duty (Dharma) and resolute fearlessness.',
    blessing: '+220 Wisdom & Unshakeable Loyalty',
    source: 'Ganesha Purana'
  },
  {
    level: 3,
    title: 'The Wrath of the Trishula',
    summary: 'In an earth-shaking clash of cosmic wills, Lord Shiva’s divine trident severed young Ganesha’s head before his true identity was revealed.',
    teaching: 'Represents the destruction of the mortal ego (Ahamkara), opening the soul to universal cosmic consciousness.',
    blessing: '+240 Wisdom & Transcendence',
    source: 'Shiva Purana'
  },
  {
    level: 4,
    title: 'The Quest Northward',
    summary: 'Grief-stricken Parvati wept. Shiva commanded his Ganas to journey North and bring back the head of the first living being found sleeping facing North.',
    teaching: 'North represents the magnetic pole of Mount Kailash and spiritual enlightenment.',
    blessing: '+260 Wisdom & Divine Compass',
    source: 'Mudgala Purana'
  },
  {
    level: 5,
    title: 'Rebirth as Gajanana',
    summary: 'A noble celestial elephant peacefully offered its head in devotion. Shiva joined it with the boy, breathing eternal cosmic life into Gajanana.',
    teaching: 'The elephant head signifies supreme intellect (Buddhi), profound memory, and the power to uproot life’s heaviest obstacles.',
    blessing: '+280 Wisdom & Elephant Fortitude',
    source: 'Brahma Vaivarta Purana'
  },
  {
    level: 6,
    title: 'Coronation as Ganapati & Vighnaharta',
    summary: 'The Devas celebrated His resurgence. Shiva bestowed the boon that Ganesha must be worshipped first before any new endeavor begins.',
    teaching: 'Acknowledges Ganesha as Prathama-Pujya, who clears impediments from all spiritual and worldly endeavors.',
    blessing: '+300 Wisdom & Obstacle Cleared',
    source: 'Ganesha Sahasranama'
  },
  {
    level: 7,
    title: 'The Great Cosmic Race',
    summary: 'When challenged to race around the universe against Kartikeya, Ganesha simply walked three times around his parents Shiva and Parvati.',
    teaching: 'Proves that devoted love and honoring one’s parents encompasses the entire living cosmos.',
    blessing: '+320 Wisdom & Fruit of Jnana',
    source: 'Skanda Purana'
  },
  {
    level: 8,
    title: 'Taming Krauncha into Mooshak',
    summary: 'When the giant demon mouse Krauncha wreaked havoc across hermitages, Ganesha reined in his pride with a golden noose, accepting him as his loyal vahana.',
    teaching: 'Shows divine wisdom taming restless worldly desires (symbolized by the burrowing mouse).',
    blessing: '+350 Wisdom & Mastery of Senses',
    source: 'Mudgala Purana'
  },
  {
    level: 9,
    title: 'The Broken Tusk & The Mahabharata',
    summary: 'When Sage Vyasa recited the Mahabharata without pause, Ganesha snapped off his own right tusk to continue writing without interruption.',
    teaching: 'Teaches that personal comfort must be sacrificed in the pursuit of eternal knowledge (Ekadanta).',
    blessing: '+380 Wisdom & Ekadanta Blessing',
    source: 'Mahabharata Adi Parva'
  },
  {
    level: 10,
    title: 'The Golden Modaka & Supreme Bliss',
    summary: 'In His hand, Ganesha holds the sacred Modaka: a humble outer dough shell concealing a golden sweet core of jaggery and coconut.',
    teaching: 'The outer shell represents the mortal vessel, while the sweet center represents Atma-Ananda (eternal spiritual bliss).',
    blessing: '+400 Wisdom & Supreme Enlightenment',
    source: 'Vedic Symbolism'
  }
];

export default function DashboardPage({ onNavigate }) {
  const [currentUser, setCurrentUser] = useState(() => localAuth.getUser() || {
    id: CELESTIAL_GUEST_UUID,
    username: 'Celestial Seeker',
    email: 'seeker@kailash.io'
  });

  // Custom Display Name Editing State
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameInput, setEditNameInput] = useState('');
  const [nameSaveStatus, setNameSaveStatus] = useState(null); // 'saving' | 'saved' | 'error'
  const [nameSaveMessage, setNameSaveMessage] = useState('');

  // Codex & Lore Progression State
  const [clearedLoreLevels, setClearedLoreLevels] = useState(() => {
    try {
      const saved = localStorage.getItem('celestial_cleared_lore');
      return saved ? JSON.parse(saved) : [1];
    } catch (e) {
      return [1];
    }
  });
  const [activeCodexChapter, setActiveCodexChapter] = useState(null);

  const [stats, setStats] = useState({
    total_score: 0,
    races_count: 0,
    modaks_total: 0,
    highest_score: 0,
    best_distance: 0,
    achievements: ['Initiate of Kailash', 'First Dash']
  });

  const [races, setRaces] = useState([]);
  const [selectedAvatar, setSelectedAvatar] = useState('Golden Mooshak');
  const [avatarSaveNotice, setAvatarSaveNotice] = useState(false);

  const avatarOptions = [
    { id: 'Golden Mooshak', emoji: '🐭', title: 'Golden Mooshak', aura: 'Swift Devotion & Keen Wit' },
    { id: 'Bal Ganesha', emoji: '🐘', title: 'Bal Ganesha', aura: 'Pure Joy & Modak Lover' },
    { id: 'Mayura Vahana', emoji: '🦚', title: 'Mayura Runner', aura: 'High-Speed Aerial Dash' },
    { id: 'Vighnaharta', emoji: '🪷', title: 'Vighnaharta', aura: 'Master of All Obstacles' }
  ];

  const allAchievements = [
    {
      id: 'First Dash',
      name: 'First Dash',
      desc: 'Took your first sprint along the 3 celestial lanes with Mooshak.',
      icon: '🐭'
    },
    {
      id: 'Divine Revive',
      name: 'Divine Revive',
      desc: 'Answered a Gemini AI Divine Gate trivia question to gain an Extra Life and shield.',
      icon: '💖'
    },
    {
      id: 'Modak Hoarder',
      name: 'Modak Hoarder',
      desc: 'Gathered over 25 glowing Modaks across celestial runs.',
      icon: '🥮'
    },
    {
      id: '500m Celestial Sprinter',
      name: '500m Celestial Sprinter',
      desc: 'Dashed over 500 meters in a single continuous cosmic run.',
      icon: '⚡'
    },
    {
      id: 'Speed Defier',
      name: 'Speed Defier',
      desc: 'Surpassed 8,000 authoritative points, verified by the Anti-Cheat telemetry.',
      icon: '🛡️'
    }
  ];

  // Refresh auth and profile from Supabase
  useEffect(() => {
    if (isLiveSupabaseConfigured && supabase) {
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user) {
          const meta = data.user.user_metadata || {};
          const userObj = {
            id: data.user.id,
            username: meta.full_name || meta.name || data.user.email?.split('@')[0] || 'Celestial Seeker',
            email: data.user.email,
            avatar_url: meta.avatar_url || meta.picture || null
          };
          setCurrentUser(userObj);
          localAuth.setUser(userObj);
        }
      });
    }

    fetch(`/api/profile/${currentUser.id}`)
      .then(res => res.json())
      .then(data => {
        if (data?.profile) {
          setStats(prev => ({ ...prev, ...data.profile }));
          if (data.profile.avatar_aspect) {
            setSelectedAvatar(data.profile.avatar_aspect);
          }
          if (data.profile.cleared_lore_levels && Array.isArray(data.profile.cleared_lore_levels)) {
            setClearedLoreLevels(data.profile.cleared_lore_levels);
            try {
              localStorage.setItem('celestial_cleared_lore', JSON.stringify(data.profile.cleared_lore_levels));
            } catch (e) {}
          }
        }
        if (data?.race_history) {
          setRaces(data.race_history);
        }
      })
      .catch(err => console.warn('Profile fetch note:', err));
  }, [currentUser.id]);

  const handleSaveName = async (e) => {
    if (e) e.preventDefault();
    const clean = editNameInput.trim();
    if (!clean || clean.length < 2) {
      setNameSaveStatus('error');
      setNameSaveMessage('Display name must have at least 2 characters.');
      return;
    }

    setNameSaveStatus('saving');
    const res = await updateCustomDisplayName(currentUser.id, clean);

    if (res.success) {
      setCurrentUser(prev => ({ ...prev, username: clean }));
      setNameSaveStatus('saved');
      setNameSaveMessage('Display name updated & synced to Supabase!');
      setIsEditingName(false);
      audioEngine.playTempleBell(660);
      setTimeout(() => setNameSaveStatus(null), 3500);
    } else {
      setNameSaveStatus('error');
      setNameSaveMessage(res.message || 'Failed to update name.');
    }
  };

  const handleSelectAvatar = async (av) => {
    setSelectedAvatar(av.id);
    audioEngine.playTempleBell(740);

    setAvatarSaveNotice(true);
    setTimeout(() => setAvatarSaveNotice(false), 2200);

    logUserAction('AVATAR_CHANGED', `Seeker chose avatar aspect: ${av.title}`);

    if (isLiveSupabaseConfigured && supabase && currentUser?.id && currentUser.id.length === 36) {
      try {
        await supabase
          .from('profiles')
          .update({ avatar_aspect: av.id })
          .eq('id', currentUser.id);
      } catch (e) {}
    }
  };

  return (
    <div className="min-h-[calc(100vh-4.5rem)] py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8">
      
      {/* Profile Header Card */}
      <div className="rounded-3xl temple-glass-gold border-2 border-gold-temple p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          
          {/* Avatar Icon */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-saffron-600 via-marigold to-gold-400 p-[3px] shadow-xl shadow-saffron-600/30">
            <div className="w-full h-full rounded-3xl bg-cosmic-950 flex items-center justify-center text-5xl select-none">
              {currentUser.avatar_url ? (
                <img
                  src={currentUser.avatar_url}
                  alt={currentUser.username}
                  className="w-full h-full rounded-3xl object-cover"
                />
              ) : (
                avatarOptions.find(a => a.id === selectedAvatar)?.emoji || '🐭'
              )}
            </div>
          </div>

          {/* User Details */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
              <span className="px-3 py-0.5 rounded-full text-xs font-cinzel font-semibold bg-saffron-950/80 border border-gold-500/40 text-amber-300">
                Mooshak's Chosen Runner
              </span>
              <span className="px-3 py-0.5 rounded-full text-xs font-cinzel font-semibold bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Supabase Synced</span>
              </span>
            </div>

            {/* Editable Custom Display Name */}
            {isEditingName ? (
              <form onSubmit={handleSaveName} className="flex flex-wrap items-center justify-center sm:justify-start gap-2 my-1">
                <input
                  type="text"
                  value={editNameInput}
                  onChange={(e) => setEditNameInput(e.target.value)}
                  maxLength={32}
                  placeholder="Enter devotee name..."
                  className="px-3 py-1.5 rounded-xl bg-cosmic-950 border border-gold-400 text-amber-100 font-mythic text-xl focus:outline-none focus:ring-2 focus:ring-gold-400/50 shadow-inner"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={nameSaveStatus === 'saving'}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-saffron-600 to-gold-400 text-cosmic-950 font-cinzel font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{nameSaveStatus === 'saving' ? 'Saving...' : 'Save'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingName(false);
                    setEditNameInput(currentUser.username);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-gold-500/30 text-amber-300 text-xs font-cinzel hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <div className="flex items-center justify-center sm:justify-start gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-bold font-mythic text-amber-100 glow-text-gold">
                  {currentUser.username}
                </h1>
                <button
                  onClick={() => {
                    setEditNameInput(currentUser.username || '');
                    setIsEditingName(true);
                  }}
                  title="Edit Custom Display Name"
                  className="p-1.5 rounded-lg border border-gold-500/30 bg-cosmic-900/60 text-amber-300 hover:text-amber-100 hover:border-gold-400 transition-all cursor-pointer shadow"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {nameSaveStatus === 'saved' && (
              <p className="text-xs text-emerald-300 font-cinzel mt-1 flex items-center justify-center sm:justify-start gap-1 animate-pulse">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{nameSaveMessage}</span>
              </p>
            )}
            {nameSaveStatus === 'error' && (
              <p className="text-xs text-rose-300 font-cinzel mt-1">
                {nameSaveMessage}
              </p>
            )}

            <p className="text-xs text-amber-300/70 font-cinzel mt-0.5">
              Contestant Email: <span className="text-amber-200">{currentUser.email}</span>
            </p>
            <p className="text-[11px] text-amber-400/50 font-mono mt-0.5">
              Vault ID: {currentUser.id}
            </p>
          </div>

          {/* CTA Button */}
          <button
            onClick={() => onNavigate('/play')}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-saffron-600 via-marigold to-gold-400 text-cosmic-950 font-cinzel font-bold text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-saffron-600/30 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Launch Next Dash</span>
          </button>

        </div>

        {/* Avatar Persona Selector */}
        <div className="mt-8 pt-6 border-t border-gold-500/20">
          <div className="flex items-center justify-between mb-3">
            <span className="block text-xs font-cinzel uppercase tracking-wider text-amber-300 font-semibold">
              Choose Celestial Avatar Aspect
            </span>
            {avatarSaveNotice && (
              <span className="text-xs text-emerald-300 font-cinzel flex items-center gap-1 animate-pulse">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Aspect Saved to Supabase!</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {avatarOptions.map(av => (
              <button
                key={av.id}
                onClick={() => handleSelectAvatar(av)}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  selectedAvatar === av.id
                    ? 'border-gold-400 bg-saffron-950/60 shadow-lg shadow-saffron-600/30 ring-1 ring-gold-400'
                    : 'border-gold-500/20 bg-cosmic-900/50 hover:bg-white/5 text-amber-200/70'
                }`}
              >
                <div className="text-3xl mb-1.5">{av.emoji}</div>
                <div className="font-cinzel text-xs font-bold text-amber-100">{av.title}</div>
                <div className="text-[10px] text-amber-300/70 mt-0.5 leading-snug">{av.aura}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Highest Score */}
        <div className="temple-glass rounded-3xl p-5 border border-gold-500/20 shadow-lg">
          <div className="w-10 h-10 rounded-2xl bg-saffron-950/60 border border-saffron-500/40 flex items-center justify-center text-saffron-400 mb-3">
            <Trophy className="w-5 h-5 text-marigold" />
          </div>
          <span className="block text-xs font-cinzel uppercase text-amber-400/70">Highest Score</span>
          <span className="text-2xl sm:text-3xl font-bold font-mono text-amber-100 glow-text-gold">
            {stats.highest_score || 0}
          </span>
        </div>

        {/* Best Distance */}
        <div className="temple-glass rounded-3xl p-5 border border-gold-500/20 shadow-lg">
          <div className="w-10 h-10 rounded-2xl bg-cosmic-800/60 border border-gold-500/40 flex items-center justify-center text-yellow-300 mb-3">
            <Gauge className="w-5 h-5 text-yellow-400" />
          </div>
          <span className="block text-xs font-cinzel uppercase text-amber-400/70">Best Distance</span>
          <span className="text-2xl sm:text-3xl font-bold font-mono text-amber-100">
            {Number(stats.best_distance).toFixed(1)}m
          </span>
        </div>

        {/* Modaks Gathered */}
        <div className="temple-glass rounded-3xl p-5 border border-gold-500/20 shadow-lg">
          <div className="w-10 h-10 rounded-2xl bg-amber-950/60 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-3">
            <span className="text-xl">🥮</span>
          </div>
          <span className="block text-xs font-cinzel uppercase text-amber-400/70">Total Modaks</span>
          <span className="text-2xl sm:text-3xl font-bold font-mono text-marigold">
            {stats.modaks_total || 0}
          </span>
        </div>

        {/* Runs Completed */}
        <div className="temple-glass rounded-3xl p-5 border border-gold-500/20 shadow-lg">
          <div className="w-10 h-10 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-3">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="block text-xs font-cinzel uppercase text-amber-400/70">Runs Completed</span>
          <span className="text-2xl sm:text-3xl font-bold font-mono text-amber-100">
            {stats.races_count || races.length}
          </span>
        </div>

      </div>

      {/* Ganesha Lore & Wisdom Codex Section */}
      <div className="rounded-3xl temple-glass border border-gold-500/30 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gradient-to-br from-saffron-500/10 to-gold-400/5 blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-3 py-0.5 rounded-full text-xs font-cinzel font-semibold bg-saffron-950/80 border border-gold-500/40 text-amber-300 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-marigold" />
                <span>Mythological Knowledge Vault</span>
              </span>
              <span className="text-xs font-mono text-amber-400/70">
                10 Sacred Chapters
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold font-mythic text-amber-100 glow-text-gold">
              Ganesha Lore & Wisdom Codex
            </h3>
            <p className="text-xs text-amber-300/70 font-cinzel mt-1">
              Chronologically explore Lord Ganesha's life by solving Gemini AI Divine Gate riddles in the arena.
            </p>
          </div>

          {/* Lore Progress & Mastery Bar */}
          <div className="temple-glass rounded-2xl p-4 border border-gold-500/20 bg-cosmic-950/70 min-w-[240px]">
            <div className="flex justify-between text-xs font-cinzel mb-1.5">
              <span className="text-amber-300/80">Codex Mastery:</span>
              <span className="font-bold text-amber-100 font-mono">
                {clearedLoreLevels.length} / 10 Chapters ({Math.min(100, Math.round((clearedLoreLevels.length / 10) * 100))}%)
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-cosmic-900 border border-gold-500/30 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-saffron-600 via-marigold to-gold-400 shadow-md shadow-saffron-500/50 transition-all duration-500"
                style={{ width: `${Math.min(100, (clearedLoreLevels.length / 10) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* 10 Chapters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
          {LORE_CHAPTERS.map((ch) => {
            const isUnlocked = clearedLoreLevels.includes(ch.level) || ch.level === 1;

            return (
              <div
                key={ch.level}
                onClick={() => {
                  if (isUnlocked) {
                    setActiveCodexChapter(ch);
                    audioEngine.playTempleBell(528);
                  }
                }}
                className={`rounded-2xl p-4 border transition-all relative overflow-hidden ${
                  isUnlocked
                    ? 'border-gold-500/40 bg-cosmic-900/70 hover:border-gold-400 hover:bg-saffron-950/40 cursor-pointer shadow-md hover:shadow-xl hover:shadow-saffron-600/20'
                    : 'border-gold-500/10 bg-cosmic-950/40 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold font-mono border ${
                      isUnlocked
                        ? 'bg-gradient-to-tr from-saffron-600 to-gold-400 text-cosmic-950 border-gold-300 shadow'
                        : 'bg-cosmic-950 text-amber-400/40 border-gold-500/20'
                    }`}>
                      {ch.level}
                    </div>
                    <div>
                      <span className="block text-[10px] font-cinzel font-semibold uppercase tracking-wider text-amber-400/70">
                        Chapter {ch.level}
                      </span>
                      <h4 className="font-bold text-sm text-amber-100 font-cinzel line-clamp-1">
                        {ch.title}
                      </h4>
                    </div>
                  </div>

                  {isUnlocked ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 flex items-center gap-1 shrink-0">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>Unlocked</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-cosmic-950 border border-gold-500/20 text-amber-400/50 flex items-center gap-1 shrink-0">
                      <Lock className="w-2.5 h-2.5" />
                      <span>Sealed</span>
                    </span>
                  )}
                </div>

                <p className="text-xs text-amber-200/80 font-cinzel line-clamp-2 leading-relaxed mb-3">
                  {isUnlocked ? ch.summary : `Solve Divine Gate Riddle Level ${ch.level} in the arena to unseal this sacred chapter.`}
                </p>

                {isUnlocked && (
                  <div className="flex items-center justify-between pt-2 border-t border-gold-500/15 text-[11px]">
                    <span className="text-marigold font-cinzel font-semibold">
                      {ch.blessing}
                    </span>
                    <span className="text-amber-400/60 font-mono text-[10px] flex items-center gap-1">
                      <span>{ch.source}</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Race History (Direct from Supabase) */}
      <div className="rounded-3xl temple-glass border border-gold-500/30 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold font-cinzel text-amber-100 flex items-center gap-2">
            <History className="w-5 h-5 text-marigold" />
            <span>Recent Celestial Runs (Supabase Cloud Vault)</span>
          </h3>
          <span className="text-xs text-amber-300/70 font-mono">
            {races.length} recorded runs
          </span>
        </div>

        {races.length === 0 ? (
          <div className="text-center py-8 text-amber-300/60 font-cinzel text-sm">
            No race runs recorded yet. Dash into the arena to log your first verified time!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {races.slice(0, 6).map((run, i) => (
              <div key={run.id || i} className="p-3.5 rounded-2xl bg-cosmic-950/80 border border-gold-500/20 text-xs space-y-1.5 shadow-inner">
                <div className="flex justify-between items-center text-[11px] text-amber-400/70">
                  <span>{run.created_at ? new Date(run.created_at).toLocaleDateString() : 'Just now'}</span>
                  <span className="font-semibold text-emerald-300 flex items-center gap-0.5">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Verified</span>
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-base font-bold font-mono text-gold-divine glow-text-gold">{run.final_score} pts</span>
                  <span className="font-mono text-amber-100 font-medium">{Number(run.distance_traveled).toFixed(1)}m</span>
                </div>
                <div className="flex justify-between text-[11px] text-amber-300/70 pt-1 border-t border-gold-500/10">
                  <span>Modaks: {run.modaks_collected} 🥮</span>
                  <span>Duration: {Number(run.duration_seconds).toFixed(1)}s</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contest Achievements */}
      <div className="rounded-3xl temple-glass border border-gold-500/30 p-6 shadow-xl">
        <h3 className="text-lg font-bold font-cinzel text-amber-100 mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-marigold" />
          <span>Contest Runner Achievements</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allAchievements.map(ach => {
            const unlocked = stats.achievements?.includes(ach.id) || ach.id === 'First Dash';

            return (
              <div
                key={ach.id}
                className={`p-4 rounded-2xl border flex items-start gap-4 transition-all ${
                  unlocked
                    ? 'border-gold-500/40 bg-saffron-950/20 shadow-md'
                    : 'border-gold-500/10 bg-black/20 opacity-40'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-cosmic-950 border border-gold-500/30 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                  {ach.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-amber-100 font-cinzel">
                      {ach.name}
                    </span>
                    {unlocked && (
                      <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-900/50 text-emerald-300 border border-emerald-500/30 font-semibold font-mono">
                        Unlocked
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-amber-200/70 mt-1 leading-relaxed">
                    {ach.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Chapter Reader Modal */}
      {activeCodexChapter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cosmic-950/85 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-3xl temple-glass-gold border-2 border-gold-temple p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-gold-500/20 mb-4">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-saffron-950/80 border border-gold-400 text-amber-300 text-xs font-mono font-bold">
                  Chapter {activeCodexChapter.level}
                </span>
                <span className="text-xs text-amber-400/70 font-mono">
                  {activeCodexChapter.source}
                </span>
              </div>
              <button
                onClick={() => setActiveCodexChapter(null)}
                className="p-1.5 rounded-xl border border-gold-500/30 text-amber-300 hover:text-amber-100 hover:bg-white/5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h3 className="text-2xl font-bold font-mythic text-amber-100 glow-text-gold mb-3">
              {activeCodexChapter.title}
            </h3>

            <div className="space-y-4 text-xs font-cinzel text-amber-200/90 leading-relaxed mb-6">
              <div className="p-4 rounded-2xl bg-cosmic-950/70 border border-gold-500/20 shadow-inner">
                <span className="block text-[10px] uppercase font-bold text-amber-400/70 mb-1">
                  Sacred Mythological Story
                </span>
                <p className="text-amber-100">{activeCodexChapter.summary}</p>
              </div>

              <div className="p-4 rounded-2xl bg-saffron-950/40 border border-gold-400/30 shadow-inner">
                <span className="block text-[10px] uppercase font-bold text-marigold mb-1">
                  Spiritual Teaching & Philosophy
                </span>
                <p className="text-amber-200">{activeCodexChapter.teaching}</p>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs">
                <span className="font-semibold">Divine Blessing:</span>
                <span className="font-bold font-mono">{activeCodexChapter.blessing}</span>
              </div>
            </div>

            <button
              onClick={() => setActiveCodexChapter(null)}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-saffron-600 via-marigold to-gold-400 text-cosmic-950 font-cinzel font-bold text-xs uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              Close Chapter Codex
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
