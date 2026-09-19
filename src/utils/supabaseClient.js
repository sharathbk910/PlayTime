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
        detectSessionInUrl: true,
      }
    })
  : null;

// Verified fallback guest UUID registered in Supabase
export const CELESTIAL_GUEST_UUID = '75305c97-42f8-4686-a591-33e055b62e3b';

// Local auth storage helper
const LOCAL_USER_KEY = 'celestial_ganesha_auth_user';

export const localAuth = {
  getUser: () => {
    try {
      const saved = localStorage.getItem(LOCAL_USER_KEY) || sessionStorage.getItem(LOCAL_USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  },
  setUser: (user, rememberMe = true) => {
    try {
      const payload = JSON.stringify(user);
      if (rememberMe) {
        localStorage.setItem(LOCAL_USER_KEY, payload);
      } else {
        sessionStorage.setItem(LOCAL_USER_KEY, payload);
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

/**
 * Synchronizes user profile with Supabase public.profiles table
 */
export async function syncUserProfile(user) {
  if (!isLiveSupabaseConfigured || !supabase || !user?.id) return null;

  try {
    const profilePayload = {
      id: user.id,
      username: user.username || user.email?.split('@')[0] || 'Celestial Seeker',
      email: user.email || 'seeker@kailash.io',
      avatar_url: user.avatar_url || null,
      wisdom_rank: user.wisdom_rank || 'Celestial Seeker',
    };

    const { data, error } = await supabase
      .from('profiles')
      .upsert(profilePayload, { onConflict: 'id' })
      .select()
      .maybeSingle();

    if (error) {
      console.warn('Supabase profile sync notice:', error.message);
    }
    return data;
  } catch (err) {
    console.warn('Profile sync exception:', err);
    return null;
  }
}

/**
 * Logs a human-readable user action / game milestone to Supabase
 */
export async function logUserAction(actionType, actionDescription, metadata = {}) {
  try {
    const currentUser = localAuth.getUser();
    const payload = {
      user_id: currentUser?.id && currentUser.id.includes('-') && currentUser.id.length === 36 ? currentUser.id : CELESTIAL_GUEST_UUID,
      player_name: currentUser?.username || 'Celestial Seeker',
      action_type: actionType,
      action_description: actionDescription,
      metadata: {
        ...metadata,
        client_timestamp: new Date().toISOString()
      }
    };

    // Attempt direct Supabase insert if logged in
    if (isLiveSupabaseConfigured && supabase) {
      supabase.from('user_actions').insert(payload).then(({ error }) => {
        if (error) {
          // Fallback to server endpoint
          fetch('/api/actions/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          }).catch(() => {});
        }
      });
    } else {
      fetch('/api/actions/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => {});
    }
  } catch (e) {
    // Non-blocking telemetry
  }
}
