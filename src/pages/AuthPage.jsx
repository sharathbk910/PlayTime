import React, { useState } from 'react';
import { Mail, Lock, User, ShieldCheck, Sparkles, AlertCircle, ArrowRight, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { supabase, isLiveSupabaseConfigured, localAuth, logUserAction, notifyWelcomeSignIn, CELESTIAL_GUEST_UUID } from '../utils/supabaseClient';
import { audioEngine } from '../utils/audioEngine';

export default function AuthPage({ onNavigate }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Standard Email Authentication (Sign In & Sign Up with dedicated Supabase Profiles)
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/email-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          username: username.trim(),
          isSignUp
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Authentication error. Please check your sacred credentials.');
      }

      // Establish live Supabase client session if available
      if (data.session?.access_token && isLiveSupabaseConfigured && supabase) {
        try {
          await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token
          });
        } catch (sessErr) {
          console.warn('Session set note:', sessErr.message);
        }
      }

      // Store authentic user record in local auth state
      localAuth.setUser(data.user, rememberMe);
      notifyWelcomeSignIn(data.user);
      logUserAction(
        isSignUp ? 'SIGN_UP' : 'SIGN_IN',
        `${data.user.username} authenticated with email ${data.user.email}`,
        { email: data.user.email, id: data.user.id }
      );

      audioEngine.playDivineWisdomChime();
      setSuccessMsg(data.message || (isSignUp ? 'Account created! Entering sanctum...' : 'Welcome back! Entering sanctum...'));
      setTimeout(() => onNavigate('/play'), 700);

    } catch (err) {
      console.warn('Auth exception:', err);
      setErrorMsg(err.message || 'Authentication failed. Please verify your email and password.');
    } finally {
      setLoading(false);
    }
  };

  // Instant Guest Access (1 Trial Dash)
  const handleInstantGuest = () => {
    const guestUser = {
      id: CELESTIAL_GUEST_UUID,
      username: `Seeker ${Math.floor(1000 + Math.random() * 9000)}`,
      email: 'guest@celestialrealm.io',
      provider: 'guest'
    };
    localAuth.setUser(guestUser, rememberMe);
    logUserAction('GUEST_LOGIN', `Guest runner embarked on Dash as ${guestUser.username}`);
    audioEngine.playTempleBell(660);
    onNavigate('/play');
  };

  return (
    <div className="min-h-[calc(100vh-4.5rem)] flex items-center justify-center p-4 sm:p-6">
      <div className="relative w-full max-w-md rounded-3xl temple-glass-gold border-2 border-gold-temple p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        
        {/* Decorative Arch Header */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-cosmic-950 border border-gold-400 text-xs font-cinzel text-amber-300 uppercase tracking-widest flex items-center gap-1.5 shadow-md">
          <span>🔔</span>
          <span>Temple Sanctum Gates</span>
          <span>🔔</span>
        </div>

        {/* Header */}
        <div className="text-center mt-2 mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-saffron-600/40 via-marigold/30 to-amber-400/20 border border-gold-400/40 text-3xl mb-3 shadow-inner shadow-saffron-500/20 transform hover:scale-105 transition-transform duration-300">
            🪷
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-mythic text-amber-100 glow-text-gold">
            {isSignUp ? 'Create Contestant Account' : 'Enter The Celestial Realm'}
          </h2>
          <p className="text-xs text-amber-300/80 font-cinzel mt-1">
            {isSignUp ? 'Register your unique email & password to save custom scores & lore' : 'Sign in with your email to record verified race telemetry & sync to Supabase'}
          </p>
        </div>

        {/* Live Supabase Connected Status Pill */}
        <div className="mb-5 p-2 rounded-xl bg-cosmic-950/70 border border-gold-500/30 flex items-center justify-between text-[11px] text-amber-300 px-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-cinzel font-semibold">Supabase Cloud Vault:</span>
          </div>
          <span className="text-emerald-300 font-mono font-medium">Distinct Profile Security</span>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 flex items-start gap-2 text-xs text-rose-200 animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success message */}
        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 flex items-start gap-2 text-xs text-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Standard Email Authentication Form */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-[11px] font-cinzel uppercase tracking-wider text-amber-300 mb-1">
                Devotee Display Name / Persona
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-amber-400/60 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. VedaSeeker"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-cosmic-900/90 border border-gold-500/30 text-amber-100 placeholder-amber-400/30 text-xs sm:text-sm focus:outline-none focus:border-gold-400 focus:ring-1 focus:ring-gold-400/50"
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
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-cosmic-900/90 border border-gold-500/30 text-amber-100 placeholder-amber-400/30 text-xs sm:text-sm focus:outline-none focus:border-gold-400 focus:ring-1 focus:ring-gold-400/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-cinzel uppercase tracking-wider text-amber-300 mb-1">
              Secret Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-amber-400/60 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="•••••••• (Min 6 chars)"
                className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-cosmic-900/90 border border-gold-500/30 text-amber-100 placeholder-amber-400/30 text-xs sm:text-sm focus:outline-none focus:border-gold-400 focus:ring-1 focus:ring-gold-400/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-400/60 hover:text-amber-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
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
              <span>Remember session</span>
            </label>
            <span className="text-[11px] text-amber-400/60 font-cinzel">Cloud Encrypted</span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-saffron-600 via-marigold to-gold-400 text-cosmic-950 font-bold font-cinzel text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-saffron-600/30 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 mt-3 cursor-pointer"
          >
            <span>{loading ? 'Entering Sanctum...' : isSignUp ? 'Create Contestant Account' : 'Sign In With Email'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Toggle between Sign In / Sign Up */}
        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className="text-xs text-amber-300 hover:text-amber-100 underline font-medium transition-colors cursor-pointer"
          >
            {isSignUp ? 'Already registered? Sign In with Email instead' : "New contestant? Register for contest"}
          </button>
        </div>

        {/* Instant Guest Mode Button */}
        <div className="mt-5 pt-4 border-t border-gold-500/20 text-center">
          <button
            type="button"
            onClick={handleInstantGuest}
            className="w-full py-2.5 px-3 rounded-xl border border-gold-500/30 bg-white/5 hover:bg-white/10 text-xs font-cinzel text-amber-300 hover:text-amber-100 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-marigold" />
            <span>Play 1 Free Trial Dash as Guest</span>
          </button>
        </div>

      </div>
    </div>
  );
}
