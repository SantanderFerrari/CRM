import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { loginRequest, logoutRequest, getMeRequest } from '../api/auth.api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true); // true while rehydrating from localStorage

  // ── Rehydrate on mount ─────────────────────────────────────────────
  useEffect(() => {
    const rehydrate = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) { setLoading(false); return; }
      try {
        const { data } = await getMeRequest();
        setUser(data.user);
      } catch {
        // Token invalid or expired and refresh also failed — clear everything
        localStorage.clear();
      } finally {
        setLoading(false);
      }
    };
    rehydrate();
  }, []);

  // ── Login ──────────────────────────────────────────────────────────
  const login = useCallback(async ({ email, password }) => {
    const { data } = await loginRequest({ email, password });
    localStorage.setItem('accessToken',  data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    setUser(data.user);
    return data.user;
  }, []);

  // ── Logout ─────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    try {
      if (refreshToken) await logoutRequest(refreshToken);
    } catch { /* ignore — clear anyway */ }
    localStorage.clear();
    setUser(null);
  }, []);

  const isAuthenticated = Boolean(user);

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// ── Hook ───────────────────────────────────────────────────────────────────
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider.');
  return ctx;
};