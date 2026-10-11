import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api, setAuthToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  loading: boolean;
  login: (credentials: { username_or_email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasPermission: (allowedRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchUser = async () => {
    try {
      const data = await api.getMe();
      setUser(data);
    } catch {
      setUser(null);
      setAuthToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = async (credentials: { username_or_email: string; password: string }) => {
    setLoading(true);
    try {
      const resp = await api.login(credentials);
      setAuthToken(resp.access_token);
      await fetchUser();
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout().catch(() => {});
    } finally {
      setAuthToken(null);
      setUser(null);
      window.location.href = '/login';
    }
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  const hasPermission = (allowedRoles: UserRole[]) => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user ? user.role : null,
        loading,
        login,
        logout,
        refreshUser,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
