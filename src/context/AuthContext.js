"use client";
import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

// RBAC catalog shared by login, navigation, and protected layouts.
// Keep role ids stable because they are persisted in localStorage.
export const roles = ['customer', 'seller', 'shipper', 'admin'];

export const roleLabels = {
  customer: 'Khach hang',
  seller: 'Nguoi ban',
  shipper: 'Nguoi giao hang',
  admin: 'Quan tri vien'
};

export const roleRedirects = {
  customer: '/',
  seller: '/seller',
  shipper: '/shipper',
  admin: '/admin'
};

function getStoredUser() {
  if (typeof window === 'undefined') return null;

  const storedUser = localStorage.getItem('hustfood_user');
  if (!storedUser) return null;

  try {
    const user = JSON.parse(storedUser);
    return user?.role && roles.includes(user.role) ? user : null;
  } catch (error) {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);
  const role = user?.role && roles.includes(user.role) ? user.role : null;

  useEffect(() => {
    if (user?.role && roles.includes(user.role)) {
      localStorage.setItem('hustfood_user', JSON.stringify(user));
      localStorage.setItem('hustfood_role', user.role);
    } else {
      localStorage.removeItem('hustfood_user');
      localStorage.removeItem('hustfood_role');
    }
  }, [user]);

  const login = (authenticatedUser) => {
    if (authenticatedUser?.role && roles.includes(authenticatedUser.role)) {
      setUser(authenticatedUser);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
