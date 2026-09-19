import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import CosmicBackground from './components/CosmicBackground';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import GameArena from './pages/GameArena';
import LeaderboardPage from './pages/LeaderboardPage';
import DashboardPage from './pages/DashboardPage';
import { audioEngine } from './utils/audioEngine';
import { supabase, isLiveSupabaseConfigured, localAuth, syncUserProfile } from './utils/supabaseClient';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState(() => {
    return window.location.pathname || '/';
  });

  // Keep path in sync with browser history
  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);

    // Supabase auth state listener (captures email auth session changes)
    if (isLiveSupabaseConfigured && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          const userMeta = session.user.user_metadata || {};
          const syncedUser = {
            id: session.user.id,
            username: userMeta.full_name || userMeta.name || session.user.email?.split('@')[0] || 'Celestial Seeker',
            email: session.user.email,
            avatar_url: userMeta.avatar_url || userMeta.picture || null,
            provider: 'email'
          };
          localAuth.setUser(syncedUser, true);
          await syncUserProfile(syncedUser);

          // Dispatch welcome email notification
          if (event === 'SIGNED_IN') {
            import('./utils/supabaseClient.js').then(({ notifyWelcomeSignIn }) => {
              notifyWelcomeSignIn(syncedUser);
            });
          }
        }
      });

      return () => {
        window.removeEventListener('popstate', handlePopState);
        subscription?.unsubscribe();
      };
    }

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path) => {
    audioEngine.playTempleBell(660);
    window.history.pushState({}, '', path);
    setCurrentRoute(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPage = () => {
    switch (currentRoute) {
      case '/':
        return <LandingPage onNavigate={navigate} />;
      case '/auth':
        return <AuthPage onNavigate={navigate} />;
      case '/play':
        return <GameArena onNavigate={navigate} />;
      case '/leaderboard':
        return <LeaderboardPage onNavigate={navigate} />;
      case '/dashboard':
        return <DashboardPage onNavigate={navigate} />;
      default:
        return <LandingPage onNavigate={navigate} />;
    }
  };

  return (
    <div className="relative min-h-screen bg-cosmic-950 text-amber-100 flex flex-col font-sans selection:bg-saffron-600 selection:text-white">
      {/* Dynamic Cosmic Background */}
      <CosmicBackground />

      {/* Persistent Navigation Header */}
      <Navbar currentRoute={currentRoute} onNavigate={navigate} />

      {/* Main Page Viewport */}
      <main className="relative z-10 flex-1">
        {renderPage()}
      </main>
    </div>
  );
}
