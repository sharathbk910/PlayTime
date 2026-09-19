import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import CosmicBackground from './components/CosmicBackground';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import GameArena from './pages/GameArena';
import LeaderboardPage from './pages/LeaderboardPage';
import DashboardPage from './pages/DashboardPage';
import { audioEngine } from './utils/audioEngine';

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
