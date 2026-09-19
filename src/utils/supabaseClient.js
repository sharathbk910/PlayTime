import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isLiveSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-project') &&
  !supabaseAnonKey.includes('your_')
);

export const supabase = isLiveSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    })
  : null;

// Mock local auth storage helper for instant testing
const LOCAL_USER_KEY = 'celestial_ganesha_auth_user';

export const localAuth = {
  getUser: () => {
    try {
      const saved = localStorage.getItem(LOCAL_USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  },
  setUser: (user, rememberMe = true) => {
    try {
      if (rememberMe) {
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
      } else {
        sessionStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
      }
    } catch (e) {}
  },
  clearUser: () => {
    try {
      localStorage.removeItem(LOCAL_USER_KEY);
      sessionStorage.removeItem(LOCAL_USER_KEY);
    } catch (e) {}
  }
};
