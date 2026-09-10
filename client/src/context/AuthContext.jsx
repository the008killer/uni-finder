import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMe } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('unifinder_token') || null);
  const [loading, setLoading] = useState(true);

  // Check if token exists on initial app load
  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const res = await getMe();
          if (res.data.success) {
            setUser(res.data.user);
          }
        } catch (err) {
          console.error('Session expired or invalid token:', err);
          logout();
        }
      }
      setLoading(false);
    }
    loadUser();
  }, [token]);

  const login =  async(newToken, userData) => {
    localStorage.setItem('unifinder_token', newToken);
    setToken(newToken);

    try {
      const res = await getMe();
      if (res.data.success) {
        setUser(res.data.user);
      } else {
        setUser(userData);
      }
    } catch {
    setUser(userData);
    }
  };

  const updateUser = (updatedData) => {
    setUser((prev) => ({ ...prev, ...updatedData }));
  };

  const logout = () => {
    localStorage.removeItem('unifinder_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);