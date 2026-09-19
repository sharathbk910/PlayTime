import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { createClient } from '@supabase/supabase-js';
import { getDivineTrivia, getCelestialRiddle } from './services/geminiService.js';
import { validateGameSession } from './services/antiCheat.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Optional Supabase client on backend for authoritative queries
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
let supabase = null;

if (supabaseUrl && supabaseServiceKey && !supabaseUrl.includes('your-project')) {
  try {
    supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('✨ Connected to Supabase backend client');
  } catch (err) {
    console.warn('⚠️ Supabase backend init warning:', err.message);
  }
}

// In-Memory Leaderboard Store (always available & seeded with legendary celestial runners)
const leaderboardStore = [
  {
    id: 'seed-1',
    user_id: 'kartikeya-avatar',
    username: 'Kartikeya (Mayura Rider)',
    distance_traveled: 840.5,
    modaks_collected: 42,
    duration_seconds: 48.2,
    final_score: 11550,
    wisdom_rank: 'Celestial Swift Master',
    verified: true,
    created_at: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: 'seed-2',
    user_id: 'narada-muni',
    username: 'Narada Muni (Veena Seeker)',
    distance_traveled: 720.0,
    modaks_collected: 38,
    duration_seconds: 42.0,
    final_score: 10050,
    wisdom_rank: 'Brahmarishi of Kailash',
    verified: true,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'seed-3',
    user_id: 'vyasa-sage',
    username: 'Maharishi Vyasa',
    distance_traveled: 590.2,
    modaks_collected: 31,
    duration_seconds: 35.5,
    final_score: 8225,
    wisdom_rank: 'Supreme Sage of the Vedas',
    verified: true,
    created_at: new Date(Date.now() - 3600000).toISOString()
  }
];

// Profile storage for achievements & race history
const profileStore = new Map();

// Rate limiter for Gemini Trivia generation: max 5 requests per minute per IP
const triviaLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many celestial inquiries from this realm.',
    oracle_notice: 'The Oracle is resting in cosmic meditation. Please consult ancient temple scrolls or wait 1 minute.'
  }
});

// Middleware: Optional JWT / Auth verification
async function verifySupabaseToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];
  if (supabase && token) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (!error && user) {
        req.user = user;
      }
    } catch (e) {
      console.warn('JWT verification error:', e.message);
    }
  }
  next();
}

app.use(verifySupabaseToken);

// ==========================================
// ROUTES
// ==========================================

/**
 * Health & Config Status Endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    game: "Celestial Dash: Mooshak's Quest (Secure Multiplayer Runner Edition)",
    timestamp: new Date().toISOString(),
    services: {
      gemini_ai: process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('your_') ? 'active' : 'fallback_mode',
      supabase: supabase ? 'connected' : 'in_memory_mode',
      anti_cheat: 'enforced'
    }
  });
});

/**
 * POST /api/trivia/generate
 * Rate-limited endpoint for high-difficulty AI trivia with caching & fallback
 */
app.post('/api/trivia/generate', triviaLimiter, async (req, res) => {
  try {
    const { difficulty = 'medium' } = req.body;
    const trivia = await getDivineTrivia(difficulty);
    return res.json({
      success: true,
      trivia,
      riddle: trivia // Compatibility with older client modals
    });
  } catch (error) {
    console.error('Error generating divine trivia:', error);
    return res.status(500).json({
      success: false,
      error: 'The Oracle cannot be reached right now.',
      oracle_notice: 'The Celestial Oracle is resting; ancient temple scrolls are unsealed.'
    });
  }
});

/**
 * POST /api/riddle/generate (Backward compatibility alias)
 */
app.post('/api/riddle/generate', triviaLimiter, async (req, res) => {
  try {
    const { difficulty = 'medium' } = req.body;
    const trivia = await getDivineTrivia(difficulty);
    return res.json({
      success: true,
      riddle: trivia,
      trivia
    });
  } catch (error) {
    console.error('Error in riddle alias:', error);
    return res.status(500).json({
      success: false,
      error: 'The Oracle is in cosmic meditation.',
      oracle_notice: 'Ancient scrolls have unsealed.'
    });
  }
});

/**
 * POST /api/scores/submit
 * Anti-Cheat Score Submission Endpoint
 * Mathematically rejects speed hacks (distance/duration) & item hacks (modaks/distance)
 */
app.post('/api/scores/submit', async (req, res) => {
  try {
    const validation = validateGameSession(req.body);

    if (!validation.valid) {
      console.warn(`🚨 Anti-Cheat Flag: ${validation.reason} - ${validation.details}`);
      return res.status(403).json({
        success: false,
        flagged: true,
        reason: validation.reason,
        message: 'Celestial Anti-Cheat rejected abnormal runner telemetry.',
        details: validation.details
      });
    }

    const {
      user_id,
      username = 'Celestial Seeker',
      distance_traveled,
      duration_seconds,
      modaks_collected = 0,
      hash_signature
    } = req.body;

    const authoritativeScore = validation.score;
    const finalDistance = validation.distance || distance_traveled || 0;
    const finalDuration = validation.duration || duration_seconds || 1;

    // Determine Wisdom Rank based on runner performance
    let wisdom_rank = 'Celestial Seeker';
    if (authoritativeScore > 12000 || finalDistance > 1000) {
      wisdom_rank = 'Supreme Vahana Champion';
    } else if (authoritativeScore > 8000 || finalDistance > 600) {
      wisdom_rank = 'Master of the Three Cosmic Lanes';
    } else if (authoritativeScore > 4000 || finalDistance > 300) {
      wisdom_rank = 'Devoted Pilgrim of Kailash';
    }

    const sessionRecord = {
      id: `session-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user_id,
      username,
      distance_traveled: finalDistance,
      modaks_collected,
      duration_seconds: finalDuration,
      final_score: authoritativeScore,
      wisdom_rank,
      verified: true,
      created_at: new Date().toISOString()
    };

    // Store in-memory
    leaderboardStore.push(sessionRecord);

    // Update player profile
    const existingProfile = profileStore.get(user_id) || {
      user_id,
      username,
      total_score: 0,
      races_count: 0,
      modaks_total: 0,
      highest_score: 0,
      best_distance: 0,
      best_time: 0,
      achievements: []
    };

    existingProfile.total_score += authoritativeScore;
    existingProfile.races_count += 1;
    existingProfile.modaks_total += modaks_collected;
    existingProfile.highest_score = Math.max(existingProfile.highest_score, authoritativeScore);
    existingProfile.best_distance = Math.max(existingProfile.best_distance || 0, finalDistance);
    existingProfile.best_time = Math.max(existingProfile.best_time || 0, finalDuration);

    if (finalDistance >= 500 && !existingProfile.achievements.includes('500m Celestial Sprinter')) {
      existingProfile.achievements.push('500m Celestial Sprinter');
    }
    if (modaks_collected >= 25 && !existingProfile.achievements.includes('Modak Hoarder')) {
      existingProfile.achievements.push('Modak Hoarder');
    }
    if (authoritativeScore >= 8000 && !existingProfile.achievements.includes('Speed Defier')) {
      existingProfile.achievements.push('Speed Defier');
    }

    profileStore.set(user_id, existingProfile);

    // Optional Supabase DB persistence
    if (supabase) {
      try {
        await supabase.from('game_sessions').insert({
          user_id,
          distance_traveled: finalDistance,
          modaks_collected,
          duration_seconds: finalDuration,
          final_score: authoritativeScore,
          hash_signature
        });
      } catch (dbErr) {
        // Also support legacy table schema columns if applicable
        try {
          await supabase.from('game_sessions').insert({
            user_id,
            level_number: 1,
            completion_time_seconds: finalDuration,
            wisdom_points: Math.floor(finalDistance / 10),
            modaks_collected,
            pradakshina_completed: true,
            final_score: authoritativeScore,
            hash_signature
          });
        } catch (legacyErr) {
          console.warn('Supabase DB insert note:', dbErr.message);
        }
      }
    }

    return res.json({
      success: true,
      session: sessionRecord,
      authoritativeScore,
      distance_traveled: finalDistance,
      modaks_collected,
      wisdom_rank,
      anti_cheat_status: 'AUTHENTICATED_AND_VERIFIED',
      metrics: validation.metrics
    });
  } catch (err) {
    console.error('Error in score submission:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error validating celestial runner score',
      error: err.message
    });
  }
});

/**
 * GET /api/leaderboard
 * Fetches top 50 ranked contest entries
 */
app.get('/api/leaderboard', async (req, res) => {
  try {
    const sortBy = req.query.sort || 'high_score'; // high_score | best_distance | modaks

    // Clone and sort in-memory rankings
    let sorted = [...leaderboardStore];
    if (sortBy === 'best_distance') {
      sorted.sort((a, b) => (b.distance_traveled || 0) - (a.distance_traveled || 0));
    } else if (sortBy === 'modaks') {
      sorted.sort((a, b) => (b.modaks_collected || 0) - (a.modaks_collected || 0));
    } else {
      sorted.sort((a, b) => b.final_score - a.final_score);
    }

    // Top 50 entries
    const topEntries = sorted.slice(0, 50).map((entry, index) => ({
      rank: index + 1,
      ...entry
    }));

    return res.json({
      success: true,
      total_contestants: leaderboardStore.length,
      leaderboard: topEntries
    });
  } catch (err) {
    console.error('Leaderboard error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/profile/:id
 * Fetches player profile & statistics
 */
app.get('/api/profile/:id', (req, res) => {
  const userId = req.params.id;
  const profile = profileStore.get(userId) || {
    user_id: userId,
    username: 'Celestial Seeker',
    total_score: 0,
    races_count: 0,
    modaks_total: 0,
    highest_score: 0,
    best_distance: 0,
    best_time: null,
    achievements: ['Initiate of Kailash', 'Master of the Three Cosmic Lanes']
  };

  const userRuns = leaderboardStore.filter(r => r.user_id === userId);

  return res.json({
    success: true,
    profile,
    race_history: userRuns
  });
});

const server = app.listen(PORT, () => {
  console.log(`🛕 Celestial Dash Server running on port ${PORT}`);
  console.log(`🛡️  Anti-Cheat Engine: Enforcing Speed Bounds & Item Density Checks`);
  console.log(`🌌 Gemini AI Status: ${process.env.GEMINI_API_KEY ? 'Configured' : 'Fallback Vault Active'}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use! Kill the existing server process and retry.`);
    console.error(`   Run: netstat -ano | findstr :${PORT}  then  taskkill /PID <PID> /F`);
  } else {
    console.error('❌ Server error:', err.message);
  }
  process.exit(1);
});
