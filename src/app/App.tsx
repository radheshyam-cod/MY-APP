import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AuthPage } from './pages/AuthPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { UploadPage } from './pages/UploadPage';
import { DiagnosisPage } from './pages/DiagnosisPage';
import { CorrectionPage } from './pages/CorrectionPage';
import { RevisionPage } from './pages/RevisionPage';
import { ProgressPage } from './pages/ProgressPage';
import { SettingsPage } from './pages/SettingsPage';
import { Toaster } from './components/ui/sonner';

import { api } from '../lib/supabase';
import { AIChat } from './components/AIChat';

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('access_token');
    if (storedToken) {
      setToken(storedToken);
      loadSession(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const loadSession = async (accessToken: string) => {
    try {
      const { session, user } = await api.getSession(accessToken);
      if (session && user) {
        setUser(user);
        setToken(accessToken);
      } else {
        localStorage.removeItem('access_token');
        setToken(null);
      }
    } catch (err) {
      console.error('Session load error:', err);
      localStorage.removeItem('access_token');
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = (accessToken: string, userData: any) => {
    localStorage.setItem('access_token', accessToken);
    setToken(accessToken);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setToken(null);
    setUser(null);
  };

  const handleUpdateUser = (updatedUser: any) => {
    setUser(updatedUser);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
      <div className="min-h-screen bg-gray-50">

        <Routes>
          <Route
            path="/auth"
            element={
              !user ? (
                <AuthPage onAuth={handleAuth} />
              ) : user.class ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Navigate to="/onboarding" replace />
              )
            }
          />
          <Route
            path="/onboarding"
            element={
              user && !user.class ? (
                <OnboardingPage user={user} token={token!} onComplete={handleUpdateUser} />
              ) : !user ? (
                <Navigate to="/auth" replace />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
          <Route
            path="/dashboard"
            element={
              user && user.class ? (
                <DashboardPage user={user} token={token!} onLogout={handleLogout} />
              ) : !user ? (
                <Navigate to="/auth" replace />
              ) : (
                <Navigate to="/onboarding" replace />
              )
            }
          />
          <Route
            path="/upload"
            element={
              user && user.class ? (
                <UploadPage user={user} token={token!} onLogout={handleLogout} />
              ) : (
                <Navigate to="/auth" replace />
              )
            }
          />
          <Route
            path="/diagnosis/:topic"
            element={
              user && user.class ? (
                <DiagnosisPage user={user} token={token!} onLogout={handleLogout} />
              ) : (
                <Navigate to="/auth" replace />
              )
            }
          />
          <Route
            path="/correction/:topic"
            element={
              user && user.class ? (
                <CorrectionPage user={user} token={token!} onLogout={handleLogout} />
              ) : (
                <Navigate to="/auth" replace />
              )
            }
          />
          <Route
            path="/revision"
            element={
              user && user.class ? (
                <RevisionPage user={user} token={token!} onLogout={handleLogout} />
              ) : (
                <Navigate to="/auth" replace />
              )
            }
          />
          <Route
            path="/progress"
            element={
              user && user.class ? (
                <ProgressPage user={user} token={token!} onLogout={handleLogout} />
              ) : (
                <Navigate to="/auth" replace />
              )
            }
          />
          <Route
            path="/settings"
            element={
              user && user.class ? (
                <SettingsPage user={user} token={token!} onLogout={handleLogout} onUserUpdate={handleUpdateUser} />
              ) : (
                <Navigate to="/auth" replace />
              )
            }
          />
          <Route path="*" element={<Navigate to={user ? "/dashboard" : "/auth"} replace />} />
        </Routes>
        <Toaster />
        {user && user.class && <AIChat />}
      </div>
    </HashRouter>
  );
}

export default App;
