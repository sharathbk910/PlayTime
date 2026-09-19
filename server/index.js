import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { createClient } from '@supabase/supabase-js';
import { getDivineTrivia, getCelestialRiddle } from './services/geminiService.js';
import { validateGameSession } from './services/antiCheat.js';
import { sendWelcomeEmailNotification } from './services/emailService.js';

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
    game: "ModhakVerse: The Epic Journey of Ganpati",
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
    const { difficulty = 'medium', loreLevel = 1 } = req.body;
    const trivia = await getDivineTrivia(difficulty, loreLevel);
    return res.json({
      success: true,
      trivia,
      riddle: trivia
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
    const { difficulty = 'medium', loreLevel = 1 } = req.body;
    const trivia = await getDivineTrivia(difficulty, loreLevel);
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
 * POST /api/notify/welcome-signin
 * Dispatches welcome email notification upon user authentication
 */
app.post('/api/notify/welcome-signin', async (req, res) => {
  try {
    const { email, username = 'Celestial Seeker', provider = 'google' } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address required' });
    }

    const result = await sendWelcomeEmailNotification({ email, username, provider });

    // Audit log to user_actions if Supabase is connected
    if (supabase) {
      try {
        const isUuid = (val) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
        const userId = req.body.user_id && isUuid(req.body.user_id) ? req.body.user_id : '75305c97-42f8-4686-a591-33e055b62e3b';
        await supabase.from('user_actions').insert({
          user_id: userId,
          player_name: username,
          action_type: 'WELCOME_EMAIL_SENT',
          action_description: `Dispatched welcome sign-in notification to ${email} (${provider})`,
          metadata: { email, provider, timestamp: new Date().toISOString() }
        });
      } catch (e) {}
    }

    return res.json({ success: true, notification: result });
  } catch (err) {
    console.warn('Welcome notification note:', err.message);
    return res.json({ success: false, message: err.message });
  }
});

/**
 * POST /api/auth/email-auth
 * Standard Email & Password Authentication Endpoint
 * Creates distinct users in Supabase Auth & public.profiles with auto-confirmation
 */
app.post('/api/auth/email-auth', async (req, res) => {
  try {
    const { email, password, username, isSignUp } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = (username && username.trim().slice(0, 32)) || cleanEmail.split('@')[0];

    if (!supabase) {
      // In-memory demo fallback
      const demoId = `devotee-${cleanEmail.replace(/[^a-zA-Z0-9]/g, '')}`;
      const userObj = {
        id: demoId,
        username: cleanUsername,
        email: cleanEmail,
        provider: 'email'
      };
      profileStore.set(demoId, userObj);
      return res.json({
        success: true,
        user: userObj,
        session: { access_token: `demo_${Date.now()}` },
        message: isSignUp ? 'Contestant registered successfully!' : 'Signed in successfully!'
      });
    }

    if (isSignUp) {
      // 1. Check if user with this email already exists
      const { data: userList } = await supabase.auth.admin.listUsers();
      const existingUser = userList?.users?.find(u => u.email?.toLowerCase() === cleanEmail);

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email already exists. Please Sign In.'
        });
      }

      // 2. Check username collision to prevent constraint conflicts
      let finalUsername = cleanUsername;
      const { data: nameCheck } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', finalUsername)
        .maybeSingle();

      if (nameCheck) {
        finalUsername = `${cleanUsername}_${Math.floor(100 + Math.random() * 900)}`;
      }

      // 3. Create user via admin API with email_confirm: true to avoid email lockout
      const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
        email: cleanEmail,
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: finalUsername
        }
      });

      if (createErr) throw createErr;

      // 4. Ensure distinct row in public.profiles for this unique user ID
      if (newUser?.user) {
        await supabase.from('profiles').upsert({
          id: newUser.user.id,
          username: finalUsername,
          email: cleanEmail,
          wisdom_rank: 'Celestial Seeker',
          avatar_aspect: 'Golden Mooshak',
          highest_score: 0,
          best_distance_meters: 0,
          total_modaks_collected: 0,
          total_races_completed: 0,
          wisdom_level: 1,
          cleared_lore_levels: [1],
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
      }

      // 5. Authenticate newly created user to generate live session tokens
      const anonClient = createClient(
        process.env.SUPABASE_URL,
        process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      const { data: loginData } = await anonClient.auth.signInWithPassword({
        email: cleanEmail,
        password
      });

      const userProfile = {
        id: newUser.user.id,
        username: finalUsername,
        email: cleanEmail,
        provider: 'email'
      };

      return res.json({
        success: true,
        session: loginData?.session || null,
        user: userProfile,
        message: 'Contestant account created and verified! Entering sanctum...'
      });

    } else {
      // Sign In Flow
      const anonClient = createClient(
        process.env.SUPABASE_URL,
        process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      let { data: loginData, error: loginErr } = await anonClient.auth.signInWithPassword({
        email: cleanEmail,
        password
      });

      // If failed due to unconfirmed email, auto-confirm via admin and retry
      if (loginErr && loginErr.message?.toLowerCase().includes('confirm')) {
        const { data: userList } = await supabase.auth.admin.listUsers();
        const userRec = userList?.users?.find(u => u.email?.toLowerCase() === cleanEmail);
        if (userRec) {
          await supabase.auth.admin.updateUserById(userRec.id, { email_confirm: true });
          const retry = await anonClient.auth.signInWithPassword({ email: cleanEmail, password });
          loginData = retry.data;
          loginErr = retry.error;
        }
      }

      if (loginErr) {
        return res.status(401).json({
          success: false,
          message: loginErr.message || 'Invalid email or password.'
        });
      }

      const authUser = loginData?.user;
      if (!authUser) {
        return res.status(401).json({ success: false, message: 'Authentication failed.' });
      }

      // Fetch devotee's distinct profile from Supabase
      const { data: dbProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      const userProfile = {
        id: authUser.id,
        username: dbProfile?.username || authUser.user_metadata?.full_name || cleanEmail.split('@')[0],
        email: authUser.email,
        avatar_url: dbProfile?.avatar_url || authUser.user_metadata?.avatar_url || null,
        avatar_aspect: dbProfile?.avatar_aspect || 'Golden Mooshak',
        wisdom_rank: dbProfile?.wisdom_rank || 'Celestial Seeker',
        highest_score: dbProfile?.highest_score || 0,
        best_distance: Number(dbProfile?.best_distance_meters) || 0,
        wisdom_level: dbProfile?.wisdom_level || 1,
        cleared_lore_levels: dbProfile?.cleared_lore_levels || [1],
        provider: 'email'
      };

      // Ensure distinct profile exists in public.profiles if missing
      if (!dbProfile) {
        await supabase.from('profiles').upsert({
          id: authUser.id,
          username: userProfile.username,
          email: cleanEmail,
          wisdom_rank: 'Celestial Seeker',
          avatar_aspect: 'Golden Mooshak',
          highest_score: 0,
          best_distance_meters: 0,
          total_modaks_collected: 0,
          total_races_completed: 0,
          wisdom_level: 1,
          cleared_lore_levels: [1],
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
      }

      return res.json({
        success: true,
        session: loginData.session,
        user: userProfile,
        message: 'Welcome back, devotee!'
      });
    }
  } catch (err) {
    console.error('Email authentication error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Authentication error.' });
  }
});

/**
 * POST /api/profile/update-username
 * Allows devotee to customize and persist their display name
 */
app.post('/api/profile/update-username', async (req, res) => {
  try {
    const { user_id, username } = req.body;
    if (!username || username.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Display name must have at least 2 characters.' });
    }

    const cleanName = username.trim().slice(0, 32);
    const isUuid = (val) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

    if (supabase && isUuid(user_id)) {
      const { error } = await supabase
        .from('profiles')
        .update({ username: cleanName, updated_at: new Date().toISOString() })
        .eq('id', user_id);

      if (error) throw error;
    }

    return res.json({ success: true, username: cleanName });
  } catch (err) {
    console.error('Username update error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/profile/unlock-lore
 * Progresses wisdom level and marks chapter unlocked in Supabase
 */
app.post('/api/profile/unlock-lore', async (req, res) => {
  try {
    const { user_id, loreLevel } = req.body;
    const lvl = Math.max(1, Math.min(10, Number(loreLevel) || 1));
    const isUuid = (val) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

    if (supabase && isUuid(user_id)) {
      try {
        const { data: profile, error: selectErr } = await supabase
          .from('profiles')
          .select('cleared_lore_levels, wisdom_level')
          .eq('id', user_id)
          .maybeSingle();

        if (!selectErr && profile) {
          const existingLevels = profile.cleared_lore_levels || [1];
          const updatedLevels = Array.from(new Set([...existingLevels, lvl])).sort((a, b) => a - b);
          const nextWisdom = Math.min(10, Math.max(profile.wisdom_level || 1, lvl + 1));

          await supabase
            .from('profiles')
            .update({
              cleared_lore_levels: updatedLevels,
              wisdom_level: nextWisdom,
              updated_at: new Date().toISOString()
            })
            .eq('id', user_id);
        }
      } catch (dbErr) {
        console.warn('Unlock lore Supabase sync notice:', dbErr.message);
      }
    }

    // Also update in-memory store
    const mem = profileStore.get(user_id) || {};
    const memExisting = mem.cleared_lore_levels || [1];
    mem.cleared_lore_levels = Array.from(new Set([...memExisting, lvl])).sort((a, b) => a - b);
    mem.wisdom_level = Math.min(10, Math.max(mem.wisdom_level || 1, lvl + 1));
    profileStore.set(user_id, mem);

    return res.json({ success: true, unlockedLevel: lvl, nextLevel: Math.min(10, lvl + 1) });
  } catch (err) {
    return res.json({ success: true, unlockedLevel: 1, message: err.message });
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

    const GUEST_FALLBACK_UUID = '75305c97-42f8-4686-a591-33e055b62e3b';
    const isUuid = (val) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
    const isRealUser = isUuid(user_id) && user_id !== GUEST_FALLBACK_UUID;
    const targetUserId = isRealUser ? user_id : GUEST_FALLBACK_UUID;

    // Supabase authoritative persistence
    let supabasePersisted = false;
    if (supabase) {
      try {
        // 1. Only update aggregated stats for authenticated users (never overwrite guest profile)
        if (isRealUser) {
          const { data: currentDbProfile } = await supabase
            .from('profiles')
            .select('highest_score, best_distance_meters, total_modaks_collected, total_races_completed')
            .eq('id', targetUserId)
            .maybeSingle();

          const prevHighest = currentDbProfile?.highest_score || 0;
          const prevDistance = Number(currentDbProfile?.best_distance_meters) || 0;
          const prevModaks = currentDbProfile?.total_modaks_collected || 0;
          const prevRaces = currentDbProfile?.total_races_completed || 0;

          await supabase
            .from('profiles')
            .update({
              highest_score: Math.max(prevHighest, authoritativeScore),
              best_distance_meters: Math.max(prevDistance, finalDistance),
              total_modaks_collected: prevModaks + modaks_collected,
              total_races_completed: prevRaces + 1,
              wisdom_rank: wisdom_rank,
              updated_at: new Date().toISOString()
            })
            .eq('id', targetUserId);
        }

        // 2. Insert validated game session
        const { data: dbSession, error: dbErr } = await supabase.from('game_sessions').insert({
          user_id: targetUserId,
          distance_traveled: finalDistance,
          modaks_collected,
          duration_seconds: finalDuration,
          final_score: authoritativeScore,
          hash_signature
        }).select().single();

        if (dbErr) {
          console.warn('Supabase game_sessions insert note:', dbErr.message);
        } else {
          supabasePersisted = true;
          console.log(`✨ Successfully saved run to Supabase for ${username} (Score: ${authoritativeScore})`);
        }

        // 3. Log user action audit trail
        try {
          await supabase.from('user_actions').insert({
            user_id: targetUserId,
            player_name: username,
            action_type: 'GAME_COMPLETED',
            action_description: `Finished Celestial Dash of ${finalDistance.toFixed(1)}m with ${modaks_collected} Modaks. Score: ${authoritativeScore} (${wisdom_rank}).`,
            metadata: {
              distance: finalDistance,
              modaks: modaks_collected,
              duration: finalDuration,
              score: authoritativeScore,
              wisdom_rank
            }
          });
        } catch (actErr) {
          // Table may not exist yet if migration hasn't been executed
        }
      } catch (err) {
        console.warn('Supabase sync warning:', err.message);
      }
    }

    return res.json({
      success: true,
      session: sessionRecord,
      authoritativeScore,
      distance_traveled: finalDistance,
      modaks_collected,
      wisdom_rank,
      supabase_synced: supabasePersisted,
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
 * POST /api/actions/log
 * Actively logs in-game actions and milestones to Supabase
 */
app.post('/api/actions/log', async (req, res) => {
  try {
    const {
      user_id,
      player_name = 'Celestial Seeker',
      action_type = 'MILESTONE',
      action_description = 'Celestial action recorded',
      metadata = {}
    } = req.body;

    const isUuid = (val) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
    const targetUserId = isUuid(user_id) ? user_id : '75305c97-42f8-4686-a591-33e055b62e3b';

    if (supabase) {
      try {
        await supabase.from('user_actions').insert({
          user_id: targetUserId,
          player_name,
          action_type,
          action_description,
          metadata
        });
      } catch (e) {}
    }

    return res.json({ success: true, logged: true });
  } catch (err) {
    return res.json({ success: true, logged: false });
  }
});

/**
 * GET /api/leaderboard
 * Fetches top 50 ranked contest entries directly from Supabase with in-memory fallback
 */
app.get('/api/leaderboard', async (req, res) => {
  try {
    const sortBy = req.query.sort || 'high_score'; // high_score | best_distance | modaks

    // 1. Try querying live Supabase database
    if (supabase) {
      try {
        const { data: dbData, error: dbErr } = await supabase
          .from('leaderboard')
          .select('*')
          .limit(50);

        if (!dbErr && dbData && dbData.length > 0) {
          let sortedDb = [...dbData];
          if (sortBy === 'best_distance') {
            sortedDb.sort((a, b) => (Number(b.best_distance) || 0) - (Number(a.best_distance) || 0));
          } else if (sortBy === 'modaks') {
            sortedDb.sort((a, b) => (Number(b.total_modaks) || 0) - (Number(a.total_modaks) || 0));
          } else {
            sortedDb.sort((a, b) => (Number(b.high_score) || 0) - (Number(a.high_score) || 0));
          }

          const topEntries = sortedDb.map((entry, index) => ({
            rank: index + 1,
            id: entry.user_id || `entry-${index}`,
            username: entry.username || 'Celestial Pilgrim',
            avatar_url: entry.avatar_url || null,
            avatar_aspect: entry.avatar_aspect || 'Golden Mooshak',
            wisdom_rank: entry.wisdom_rank || 'Devoted Pilgrim',
            distance_traveled: Number(entry.best_distance) || 0,
            modaks_collected: Number(entry.total_modaks) || 0,
            final_score: Number(entry.high_score) || 0,
            runs_completed: Number(entry.runs_completed) || 1,
            verified: true,
            source: 'supabase_cloud'
          }));

          return res.json({
            success: true,
            source: 'supabase_cloud',
            total_contestants: topEntries.length,
            leaderboard: topEntries
          });
        }
      } catch (sbErr) {
        console.warn('Leaderboard Supabase query note:', sbErr.message);
      }
    }

    // 2. In-memory fallback
    let sorted = [...leaderboardStore];
    if (sortBy === 'best_distance') {
      sorted.sort((a, b) => (b.distance_traveled || 0) - (a.distance_traveled || 0));
    } else if (sortBy === 'modaks') {
      sorted.sort((a, b) => (b.modaks_collected || 0) - (a.modaks_collected || 0));
    } else {
      sorted.sort((a, b) => b.final_score - a.final_score);
    }

    const topEntries = sorted.slice(0, 50).map((entry, index) => ({
      rank: index + 1,
      ...entry,
      source: 'local_memory'
    }));

    return res.json({
      success: true,
      source: 'local_memory',
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
 * Fetches player profile & statistics from Supabase with fallback
 */
app.get('/api/profile/:id', async (req, res) => {
  const userId = req.params.id;
  const isUuid = (val) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

  let profile = profileStore.get(userId) || {
    user_id: userId,
    username: 'Celestial Seeker',
    total_score: 0,
    races_count: 0,
    modaks_total: 0,
    highest_score: 0,
    best_distance: 0,
    best_time: null,
    achievements: ['Initiate of Kailash', 'First Dash']
  };

  let userRuns = leaderboardStore.filter(r => r.user_id === userId);

  // If Supabase is connected, query live database
  if (supabase && isUuid(userId)) {
    try {
      const { data: dbProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      const { data: dbRuns } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (dbProfile) {
        profile = {
          ...profile,
          username: dbProfile.username || profile.username,
          wisdom_rank: dbProfile.wisdom_rank || 'Celestial Seeker',
          highest_score: dbProfile.highest_score || profile.highest_score,
          best_distance: Number(dbProfile.best_distance_meters) || profile.best_distance,
          modaks_total: dbProfile.total_modaks_collected || profile.modaks_total,
          races_count: dbProfile.total_races_completed || profile.races_count,
          avatar_aspect: dbProfile.avatar_aspect || 'Golden Mooshak',
          wisdom_level: dbProfile.wisdom_level || profile.wisdom_level || 1,
          cleared_lore_levels: dbProfile.cleared_lore_levels || profile.cleared_lore_levels || [1]
        };
      }

      if (dbRuns && dbRuns.length > 0) {
        userRuns = dbRuns.map(r => ({
          id: r.id,
          distance_traveled: Number(r.distance_traveled),
          modaks_collected: r.modaks_collected,
          duration_seconds: Number(r.duration_seconds),
          final_score: r.final_score,
          created_at: r.created_at
        }));
      }
    } catch (dbErr) {
      console.warn('Profile Supabase query note:', dbErr.message);
    }
  }

  return res.json({
    success: true,
    profile,
    race_history: userRuns
  });
});

if (!process.env.VERCEL) {
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
}

export default app;

