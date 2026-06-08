import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Home from './pages/Home';
import BetDetails from './pages/BetDetails';
import Profile from './pages/Profile';
import Standings from './pages/Standings';
import Users from './pages/Users';
import { supabase } from './lib/supabase';
import { getUserFromSession } from './lib/api';

function ProtectedRoute({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
  }, []);

  if (loading) return null;
  if (!session) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[App] Starting auth check...');

    let mounted = true;
    let initialCheckDone = false;

    // Listen for auth changes FIRST (this is more reliable)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[App] Auth state changed:', event, session ? 'Has session' : 'No session');
      initialCheckDone = true; // Mark as done immediately
      clearTimeout(timeout); // Cancel timeout

      if (session) {
        console.log('[App] Fetching user data from session...');
        try {
          const userData = await getUserFromSession(session);
          console.log('[App] User loaded from session:', userData);
          if (mounted) {
            setUser(userData);
            setLoading(false);
          }
        } catch (error) {
          console.error('[App] Failed to load user:', error);
          if (mounted) setLoading(false);
        }
      } else {
        console.log('[App] No session, redirecting to login');
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    });

    // Fallback: stop loading after 2 seconds if auth listener hasn't fired
    const timeout = setTimeout(() => {
      console.log('[App] Timeout - auth listener did not fire, stopping loading');
      if (mounted && !initialCheckDone) {
        setLoading(false);
      }
    }, 2000);

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  console.log('[App] Render - loading:', loading, 'user:', user);

  if (loading) {
    return <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <div style={{ fontSize: '1.5rem', color: 'var(--bepbet-text-muted)' }}>Loading BepBet...</div>
    </div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home user={user} setUser={setUser} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bet/:betId"
          element={
            <ProtectedRoute>
              <BetDetails user={user} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile user={user} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/standings"
          element={
            <ProtectedRoute>
              <Standings user={user} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <Users user={user} />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
