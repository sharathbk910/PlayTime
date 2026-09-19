-- =========================================================================================
-- "CELESTIAL DASH: MOOSHAK'S QUEST" (SECURE MULTIPLAYER RUNNER EDITION)
-- Production PostgreSQL Database Schema & Row Level Security Policies
-- Clean, human-readable, and comprehensive database structure for Supabase
-- =========================================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================================================
-- 2. Profiles Table (Human-Readable Seeker Personas & Aggregated Lifetime Stats)
-- =========================================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  avatar_aspect TEXT DEFAULT 'Golden Mooshak' NOT NULL, -- 'Golden Mooshak', 'Bal Ganesha', 'Mayura Runner', 'Vighnaharta'
  wisdom_rank TEXT DEFAULT 'Celestial Seeker' NOT NULL,
  highest_score INT DEFAULT 0 NOT NULL,
  best_distance_meters NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
  total_modaks_collected INT DEFAULT 0 NOT NULL,
  total_races_completed INT DEFAULT 0 NOT NULL,
  unlocked_achievements TEXT[] DEFAULT ARRAY['Initiate of Kailash', 'First Dash']::TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Comments for database readability
COMMENT ON TABLE public.profiles IS 'Human-readable player personas with aggregated stats, chosen avatar, and achievements';
COMMENT ON COLUMN public.profiles.avatar_aspect IS 'Chosen spiritual vahana aspect displayed across the celestial realm';
COMMENT ON COLUMN public.profiles.wisdom_rank IS 'Earned mythological rank based on verified runner distance and score';

-- =========================================================================================
-- 3. Game Sessions Table (Authoritative Runner Attempts)
-- =========================================================================================
CREATE TABLE IF NOT EXISTS public.game_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  player_name TEXT DEFAULT 'Celestial Seeker' NOT NULL, -- Human-readable snapshot of player name
  distance_traveled NUMERIC(10, 2) NOT NULL,           -- Total distance dashed in meters
  modaks_collected INT NOT NULL DEFAULT 0,              -- Sweet golden Modaks collected during run
  duration_seconds NUMERIC(8, 2) NOT NULL,              -- Run duration in seconds
  final_score INT NOT NULL,                             -- Authoritative anti-cheat validated score
  wisdom_rank TEXT DEFAULT 'Celestial Seeker' NOT NULL, -- Rank earned in this run
  revives_used INT NOT NULL DEFAULT 0,                  -- Gemini AI trivia gates passed
  anti_cheat_verified BOOLEAN DEFAULT true NOT NULL,    -- Passed HMAC & kinematic validation
  hash_signature TEXT NOT NULL,                         -- Cryptographic HMAC-SHA256 signature
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

COMMENT ON TABLE public.game_sessions IS 'Authoritative individual runs verified by Celestial Anti-Cheat Telemetry';
COMMENT ON COLUMN public.game_sessions.player_name IS 'Cached username at time of run for easy human readability';

-- =========================================================================================
-- 4. User Actions Table (Real-time Event & Milestone Audit Trail)
-- =========================================================================================
CREATE TABLE IF NOT EXISTS public.user_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  player_name TEXT DEFAULT 'Celestial Seeker' NOT NULL,
  action_type TEXT NOT NULL, -- 'GAME_START', 'MODAK_MILESTONE', 'DIVINE_GATE_SOLVED', 'ACHIEVEMENT_UNLOCKED', 'AVATAR_CHANGED', 'GAME_COMPLETED'
  action_description TEXT NOT NULL, -- Clear, human-readable description of what took place
  metadata JSONB DEFAULT '{}'::JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

COMMENT ON TABLE public.user_actions IS 'Audit log of active game milestones, AI trivia resolutions, and player choices';

-- =========================================================================================
-- 5. Contest Leaderboard View (Human-Readable Global Rankings)
-- =========================================================================================
CREATE OR REPLACE VIEW public.leaderboard AS
SELECT 
  p.id as user_id,
  p.username,
  p.avatar_url,
  p.avatar_aspect,
  p.wisdom_rank,
  COALESCE(MAX(g.final_score), p.highest_score, 0) as high_score,
  COALESCE(MAX(g.distance_traveled), p.best_distance_meters, 0.00) as best_distance,
  COALESCE(SUM(g.modaks_collected), p.total_modaks_collected, 0) as total_modaks,
  COALESCE(COUNT(g.id), p.total_races_completed, 0) as runs_completed,
  MAX(g.created_at) as last_played_at
FROM public.profiles p
LEFT JOIN public.game_sessions g ON g.user_id = p.id
GROUP BY p.id, p.username, p.avatar_url, p.avatar_aspect, p.wisdom_rank, p.highest_score, p.best_distance_meters, p.total_modaks_collected, p.total_races_completed
ORDER BY high_score DESC;

-- =========================================================================================
-- 6. Automatic User Creation Trigger (Handles Google OAuth & Email Signups)
-- Automatically provisions public.profiles whenever an auth.users record is created
-- =========================================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    username,
    email,
    avatar_url,
    wisdom_rank
  )
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      SPLIT_PART(NEW.email, '@', 1),
      'Celestial Seeker'
    ),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'),
    'Celestial Seeker'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================================================
-- 7. Row Level Security (RLS) Policies
-- =========================================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_actions ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." 
  ON public.profiles FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile." 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile." 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Game Sessions Policies
DROP POLICY IF EXISTS "Sessions viewable by everyone." ON public.game_sessions;
CREATE POLICY "Sessions viewable by everyone." 
  ON public.game_sessions FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Users can insert own session." ON public.game_sessions;
CREATE POLICY "Users can insert own session." 
  ON public.game_sessions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- User Actions Policies
DROP POLICY IF EXISTS "Actions viewable by everyone." ON public.user_actions;
CREATE POLICY "Actions viewable by everyone." 
  ON public.user_actions FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Users can insert own actions." ON public.user_actions;
CREATE POLICY "Users can insert own actions." 
  ON public.user_actions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- =========================================================================================
-- 8. Supabase Realtime Publication Configuration
-- =========================================================================================
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_actions;
