import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password });
    const { token: jwt, role, fullName, totalXp, learningStreak } = res.data;
    const userObj = { email, role, fullName, totalXp, learningStreak };
    localStorage.setItem('token', jwt);
    localStorage.setItem('user', JSON.stringify(userObj));
    setToken(jwt);
    setUser(userObj);
    return userObj;
  };

  const register = async (fullName, email, password, role) => {
    const res = await api.post('/api/auth/register', { fullName, email, password, role });
    const { token: jwt, role: userRole, fullName: name, totalXp, learningStreak } = res.data;
    const userObj = { email, role: userRole, fullName: name, totalXp: totalXp ?? 0, learningStreak: learningStreak ?? 0 };
    localStorage.setItem('token', jwt);
    localStorage.setItem('user', JSON.stringify(userObj));
    setToken(jwt);
    setUser(userObj);
    return userObj;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, register, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
