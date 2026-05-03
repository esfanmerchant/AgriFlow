import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, clearToken, getToken, setToken } from '../lib/api.js';

const AuthContext = createContext(null);

const ROLE_HOME = { farmer: '/farmer', supplier: '/supplier', admin: '/admin' };

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('agf_user');
    return raw ? JSON.parse(raw) : null;
  });
  const [bootstrapping, setBootstrapping] = useState(() => !!getToken());
  const navigate = useNavigate();

  // On mount, if we have a token, verify it by calling /users/me.
  // Drops stale users / invalidates tokens that no longer work.
  useEffect(() => {
    if (!getToken()) return;
    let cancelled = false;
    (async () => {
      try {
        const me = await api('/users/me', { auth: true });
        if (!cancelled) setUser(me);
      } catch {
        if (!cancelled) {
          clearToken();
          setUser(null);
        }
      } finally {
        if (!cancelled) setBootstrapping(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (user) localStorage.setItem('agf_user', JSON.stringify(user));
    else localStorage.removeItem('agf_user');
  }, [user]);

  const redirectByRole = (role) => navigate(ROLE_HOME[role] || '/farmer');

  const login = async ({ email, password }) => {
    const data = await api('/auth/login', {
      method: 'POST',
      body: { email, password },
      auth: false,
    });
    setToken(data.access_token);
    setUser(data.user);
    redirectByRole(data.user.role);
    return data.user;
  };

  const signup = async ({ name, email, password, phone, role }) => {
    const data = await api('/auth/signup', {
      method: 'POST',
      body: {
        full_name: name,
        email,
        password,
        phone: phone || null,
        role: role || 'farmer',
      },
      auth: false,
    });
    setToken(data.access_token);
    setUser(data.user);
    redirectByRole(data.user.role);
    return data.user;
  };

  const logout = () => {
    clearToken();
    setUser(null);
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, bootstrapping }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
