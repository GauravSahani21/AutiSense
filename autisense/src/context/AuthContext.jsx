import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { auth } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    localStorage.removeItem('autisense_token');
    const restore = async () => {
      try {
        const res = await auth.getMe();
        setUser(res.data);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    restore();
  }, []);

  const login = useCallback(async (email, password, role) => {
    try {
      const res = await auth.login({ email, password, role });
      setUser(res.user);
      return { ok: true, user: res.user };
    } catch (err) {
      return { ok: false, error: err.message || 'Login failed' };
    }
  }, []);

  const register = useCallback(async (name, email, password, confirmPassword, role) => {
    if (password !== confirmPassword) {
      return { ok: false, error: 'Passwords do not match.' };
    }
    try {
      const res = await auth.register({ name, email, password, role });
      setUser(res.user);
      return { ok: true, user: res.user };
    } catch (err) {
      return { ok: false, error: err.message || 'Registration failed' };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await auth.logout();
    } catch {
      /* cookie cleared server-side when reachable */
    }
    setUser(null);
  }, []);

  const isAuthenticated = !!user;

  const dashboardPath = useCallback((u = user) => {
    if (!u) return '/login';
    return '/parent';
  }, [user]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--cream)', flexDirection: 'column', gap: 16,
      }}>
        <div style={{
          width: 44, height: 44,
          border: '4px solid rgba(255,107,43,0.15)',
          borderTopColor: 'var(--orange)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ fontFamily: 'var(--font-body)', color: 'var(--muted)', fontSize: '0.9rem' }}>
          Loading AutiSense…
        </p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      logout,
      isAuthenticated,
      dashboardPath,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
