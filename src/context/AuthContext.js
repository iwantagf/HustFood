"use client";
import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();
const roles = ['customer', 'seller', 'admin'];

export function AuthProvider({ children }) {
  const [role, setRole] = useState(null);

  useEffect(() => {
    const storedRole = typeof window !== 'undefined' ? localStorage.getItem('hustfood_role') : null;
    if (storedRole && roles.includes(storedRole)) {
      setRole(storedRole);
    }
  }, []);

  useEffect(() => {
    if (role) {
      localStorage.setItem('hustfood_role', role);
    } else {
      localStorage.removeItem('hustfood_role');
    }
  }, [role]);

  const login = (newRole) => {
    if (roles.includes(newRole)) {
      setRole(newRole);
    }
  };

  const logout = () => {
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
