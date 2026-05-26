"use client";
import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

// RBAC catalog shared by login, navigation, and protected layouts.
// Keep role ids stable because they are persisted in localStorage.
export const roles = ['customer', 'seller', 'shipper', 'admin'];

export const roleLabels = {
  customer: 'Khách hàng',
  seller: 'Merchant',
  shipper: 'Shipper',
  admin: 'Quản trị viên'
};

export const roleRedirects = {
  customer: '/',
  seller: '/seller',
  shipper: '/shipper',
  admin: '/admin'
};

function getStoredRole() {
  if (typeof window === 'undefined') return null;

  const storedRole = localStorage.getItem('hustfood_role');
  return storedRole && roles.includes(storedRole) ? storedRole : null;
}

export function AuthProvider({ children }) {
  const [role, setRole] = useState(getStoredRole);

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
      return true;
    }
    return false;
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
