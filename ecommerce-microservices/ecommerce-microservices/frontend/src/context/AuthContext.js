import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const role = localStorage.getItem('role');
    if (token && username) {
      setUser({ token, username, role });
    }
    setLoading(false);
  }, []);

  const login = (authResponse) => {
    localStorage.setItem('token', authResponse.accessToken);
    localStorage.setItem('username', authResponse.username);
    localStorage.setItem('role', authResponse.role);
    setUser({
      token: authResponse.accessToken,
      username: authResponse.username,
      role: authResponse.role,
    });
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  const isAdmin = () => user?.role === 'ROLE_ADMIN';
  const isManager = () => user?.role === 'ROLE_MANAGER' || isAdmin();

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAdmin, isManager }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
