-- =================================================================
-- "CELESTIAL DASH: MOOSHAK'S QUEST" (SECURE MULTIPLAYER RUNNER EDITION)
-- Production PostgreSQL Database Schema & Row Level Security Policies
-- =================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  wisdom_rank TEXT DEFAULT 'Celestial Seeker' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Game Sessions (Runner Attempts) Table
CREATE TABLE IF NOT EXISTS public.game_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  distance_traveled NUMERIC(10, 2) NOT NULL,
  modaks_collected INT NOT NULL DEFAULT 0,
  duration_seconds NUMERIC(8, 2) NOT NULL,
  final_score INT NOT NULL,
  hash_signature TEXT NOT NULL, -- Anti-cheat validation hash
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Contest Leaderboard View
CREATE OR REPLACE VIEW public.leaderboard AS
SELECT 
  p.username,
  p.avatar_url,
  p.wisdom_rank,
  g.user_id,
  MAX(g.final_score) as high_score,
  MAX(g.distance_traveled) as best_distance,
  SUM(g.modaks_collected) as total_modaks,
  COUNT(g.id) as runs_completed
FROM public.game_sessions g
JOIN public.profiles p ON g.user_id = p.id
GROUP BY p.username, p.avatar_url, p.wisdom_rank, g.user_id
ORDER BY high_score DESC;

-- 5. Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

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

-- 6. Supabase Realtime Publication Configuration
-- Enables Realtime broadcast and presence for ghost multiplayer
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_sessions;
