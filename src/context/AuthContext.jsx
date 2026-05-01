import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

/**
 * Frontend-only auth shell.
 * Stores user info in localStorage so role-based redirects work.
 * Your friend will replace `login` and `signup` with real FastAPI calls.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('agf_user');
    return raw ? JSON.parse(raw) : null;
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (user) localStorage.setItem('agf_user', JSON.stringify(user));
    else localStorage.removeItem('agf_user');
  }, [user]);

  const login = async ({ email, role }) => {
    const u = {
      id: 1,
      name: email.split('@')[0] || 'User',
      email,
      role: role || 'farmer',
    };
    setUser(u);
    redirectByRole(u.role);
    return u;
  };

  const signup = async ({ name, email, role }) => {
    const u = { id: Date.now(), name, email, role };
    setUser(u);
    redirectByRole(u.role);
    return u;
  };

  const logout = () => {
    setUser(null);
    navigate('/');
  };

  const redirectByRole = (role) => {
    const map = { farmer: '/farmer', supplier: '/supplier', admin: '/admin' };
    navigate(map[role] || '/farmer');
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
