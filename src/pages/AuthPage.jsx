import React, { useState } from 'react';
import { Mail, Lock, User, ShieldCheck, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { supabase, isLiveSupabaseConfigured, localAuth } from '../utils/supabaseClient';
import { audioEngine } from '../utils/audioEngine';

export default function AuthPage({ onNavigate }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle Google OAuth
  const handleGoogleLogin = async () => {
    setErrorMsg('');
    audioEngine.playTempleBell(587);

    if (isLiveSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin
          }
        });
        if (error) throw error;
      } catch (err) {
        setErrorMsg(err.message || 'Google authentication error');
      }
    } else {
      // Fallback Demo Google User
      const demoUser = {
        id: `google-seeker-${Date.now().toString(36)}`,
        username: 'Celestial Sage (Google)',
        email: 'sage@celestialrealm.io',
        provider: 'google',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
      };
      localAuth.setUser(demoUser, rememberMe);
      audioEngine.playDivineWisdomChime();
      onNavigate('/play');
    }
  };

  // Handle Email & Password
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (isLiveSupabaseConfigured && supabase) {
        if (isSignUp) {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { full_name: username || 'Celestial Seeker' }
            }
          });
          if (error) throw error;
          if (data?.user) {
            audioEngine.playDivineWisdomChime();
            onNavigate('/play');
          }
        } else {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
          });
          if (error) throw error;
          if (data?.user) {
            audioEngine.playDivineWisdomChime();
            onNavigate('/play');
          }
        }
      } else {
        // Fallback demo auth for instant evaluation
        const demoUser = {
          id: `seeker-${email.replace(/[^a-zA-Z0-9]/g, '') || Date.now().toString(36)}`,
          username: username || email.split('@')[0] || 'Celestial Seeker',
          email: email || 'seeker@kailash.io',
          provider: 'email'
        };
        localAuth.setUser(demoUser, rememberMe);
        audioEngine.playDivineWisdomChime();
        onNavigate('/play');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Instant Guest Access
  const handleInstantGuest = () => {
    const guestUser = {
      id: `guest-seeker-${Date.now().toString(36)}`,
      username: `Seeker ${Math.floor(1000 + Math.random() * 9000)}`,
      email: 'guest@celestialrealm.io',
      provider: 'guest'
    };
    localAuth.setUser(guestUser, rememberMe);
    audioEngine.playTempleBell(660);
    onNavigate('/play');
  };

  return (
    <div className="min-h-[calc(100vh-4.5rem)] flex items-center justify-center p-4 sm:p-6">
      <div className="relative w-full max-w-md rounded-3xl temple-glass-gold border-2 border-gold-temple p-6 sm:p-8 shadow-2xl">
        
        {/* Golden Temple-Bell Decorative Corners & Top Arch */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-cosmic-950 border border-gold-400 text-xs font-cinzel text-amber-300 uppercase tracking-widest flex items-center gap-1.5 shadow-md">
          <span>🔔</span>
          <span>Temple Gates</span>
          <span>🔔</span>
        </div>

        {/* Header */}
        <div className="text-center mt-2 mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-saffron-950/70 border border-saffron-500/40 text-3xl mb-3 shadow-inner">
            🪷
          </div>
          <h2 className="text-2xl font-bold font-mythic text-amber-100 glow-text-gold">
            {isSignUp ? 'Begin Your Divine Pilgrimage' : 'Enter The Celestial Realm'}
          </h2>
          <p className="text-xs text-amber-300/70 font-cinzel mt-1">
            {isSignUp ? 'Create your celestial contestant persona' : 'Authenticate to record verified race times'}
          </p>
        </div>

        {/* Notice banner if in demo/fallback mode */}
        {!isLiveSupabaseConfigured && (
          <div className="mb-5 p-2.5 rounded-xl bg-saffron-950/40 border border-saffron-500/30 flex items-center gap-2 text-xs text-amber-200">
            <Sparkles className="w-4 h-4 text-marigold shrink-0" />
            <span>Instant Demo Mode active &bull; All logins persist securely locally</span>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 flex items-start gap-2 text-xs text-rose-200">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full py-2.5 px-4 rounded-xl border border-gold-500/30 bg-cosmic-900/80 hover:bg-cosmic-800 text-amber-100 font-medium text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all shadow-sm group mb-4"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
            />
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
            />
            <path
              fill="#FBBC05"
              d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2s.7 5.5 1.9 7.9l3.7-2.9z"
            />
            <path
              fill="#34A853"
              d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z"
            />
          </svg>
          <span>Sign in with Google</span>
        </button>

        {/* Divider */}
        <div className="relative my-4 flex items-center justify-center">
          <div className="border-t border-gold-500/20 w-full" />
          <span className="bg-cosmic-950 px-3 text-[11px] text-amber-400/60 uppercase tracking-widest font-cinzel">
            or sacred email
          </span>
          <div className="border-t border-gold-500/20 w-full" />
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleEmailAuth} className="space-y-3.5">
          {isSignUp && (
            <div>
              <label className="block text-[11px] font-cinzel uppercase tracking-wider text-amber-300 mb-1">
                Celestial Persona / Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-amber-400/60 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. VedaSeeker"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-cosmic-900/90 border border-gold-500/30 text-amber-100 placeholder-amber-400/30 text-xs sm:text-sm focus:outline-none focus:border-gold-400"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-cinzel uppercase tracking-wider text-amber-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-amber-400/60 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="devotee@kailash.io"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-cosmic-900/90 border border-gold-500/30 text-amber-100 placeholder-amber-400/30 text-xs sm:text-sm focus:outline-none focus:border-gold-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-cinzel uppercase tracking-wider text-amber-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-amber-400/60 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-cosmic-900/90 border border-gold-500/30 text-amber-100 placeholder-amber-400/30 text-xs sm:text-sm focus:outline-none focus:border-gold-400"
              />
            </div>
          </div>

          {/* Remember Me Toggle */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-amber-200/80">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded bg-cosmic-900 border-gold-500/40 text-saffron-500 focus:ring-0 w-3.5 h-3.5"
              />
              <span>Remember my session</span>
            </label>
            <span className="text-[11px] text-amber-400/60">Persistent Vault</span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-saffron-600 via-marigold to-gold-400 text-cosmic-950 font-bold font-cinzel text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-saffron-600/30 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 mt-2"
          >
            <span>{loading ? 'Authenticating...' : isSignUp ? 'Create Contestant Account' : 'Sign In To Contest'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Toggle between Sign In / Sign Up */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg('');
            }}
            className="text-xs text-amber-300/80 hover:text-amber-200 underline font-medium"
          >
            {isSignUp ? 'Already registered? Sign In instead' : "New contestant? Register for contest"}
          </button>
        </div>

        {/* Instant Guest Mode Button */}
        <div className="mt-5 pt-4 border-t border-gold-500/20 text-center">
          <button
            type="button"
            onClick={handleInstantGuest}
            className="w-full py-2 px-3 rounded-xl border border-gold-500/30 bg-white/5 hover:bg-white/10 text-xs font-cinzel text-amber-300 hover:text-amber-100 flex items-center justify-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-marigold" />
            <span>Play Instantly as Guest Celestial Seeker</span>
          </button>
        </div>

      </div>
    </div>
  );
}
