import { useState, useEffect, useCallback } from 'react';
import AuthContext from './AuthCtx';

import API_URL from '../config';

function parseNetworkError(err, fallback) {
  if (err instanceof TypeError && /fetch|network/i.test(err.message)) {
    return new Error(`Cannot connect to the server at ${API_URL}. Make sure the backend is running.`);
  }
  return new Error(err.message || fallback);
}

function storeAuth(token, user, remember) {
  const storage = remember !== false ? localStorage : sessionStorage;
  storage.setItem('dreamhomes_token', token);
  storage.setItem('dreamhomes_user', JSON.stringify(user));
}

function clearStoredAuth() {
  localStorage.removeItem('dreamhomes_token');
  localStorage.removeItem('dreamhomes_user');
  sessionStorage.removeItem('dreamhomes_token');
  sessionStorage.removeItem('dreamhomes_user');
}

function readStoredSession() {
  let token = localStorage.getItem('dreamhomes_token');
  let user = localStorage.getItem('dreamhomes_user');
  if (token && user) return { token, user: JSON.parse(user), remember: true };
  token = sessionStorage.getItem('dreamhomes_token');
  user = sessionStorage.getItem('dreamhomes_user');
  if (token && user) return { token, user: JSON.parse(user), remember: false };
  return null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = readStoredSession();
    if (!session) { setLoading(false); return; }
    setToken(session.token);
    setUser(session.user);
    fetch(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${session.token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Session expired');
        return res.json();
      })
      .then((data) => {
        const u = data.user || data;
        setUser(u);
        storeAuth(session.token, u, session.remember);
      })
      .catch(() => {
        clearStoredAuth();
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password, remember = true) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Login failed');
      storeAuth(data.token, data.user, remember);
      setToken(data.token);
      setUser(data.user);
      return data;
    } catch (err) {
      throw parseNetworkError(err, 'Login failed');
    }
  }, []);

  const signup = useCallback(async (name, email, password) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Signup failed');
      storeAuth(data.token, data.user);
      setToken(data.token);
      setUser(data.user);
      return data;
    } catch (err) {
      throw parseNetworkError(err, 'Signup failed');
    }
  }, []);

  const logout = useCallback(() => {
    clearStoredAuth();
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
