"use client";
import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

// RBAC catalog shared by login, navigation, and protected layouts.
export const roles = ['customer', 'seller', 'shipper', 'admin'];

export const roleLabels = {
  customer: 'Khách hàng',
  seller: 'Người bán',
  shipper: 'Người giao hàng',
  admin: 'Quản trị viên'
};

export const roleRedirects = {
  customer: '/',
  seller: '/seller',
  shipper: '/shipper',
  admin: '/admin'
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const role = user?.role && roles.includes(user.role) ? user.role : null;

  useEffect(() => {
    let isCurrent = true;

    async function loadSession() {
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();
        if (isCurrent && res.ok && data.user?.role && roles.includes(data.user.role)) {
          setUser(data.user);
        }
      } catch (error) {
        if (isCurrent) setUser(null);
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }

    loadSession();

    return () => {
      isCurrent = false;
    };
  }, []);

  const login = (authenticatedUser) => {
    if (authenticatedUser?.role && roles.includes(authenticatedUser.role)) {
      setUser(authenticatedUser);
      return true;
    }
    return false;
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/session', { method: 'DELETE' });
    } catch (error) {
      // The client state is cleared even if the network request fails.
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
