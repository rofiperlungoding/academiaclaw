import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from '../types';
import { api } from '../api';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: (nim: string, password: string) => Promise<boolean>;
  register: (payload: {
    nim: string;
    name: string;
    password: string;
    email?: string;
    faculty?: string;
    program?: string;
  }) => Promise<boolean>;
  logout: () => void;
}

const STORAGE_USER_KEY = 'academiaclaw_user';
const STORAGE_TOKEN_KEY = 'academiaclaw_token';

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem(STORAGE_TOKEN_KEY);
      const storedUser = localStorage.getItem(STORAGE_USER_KEY);
      
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          localStorage.removeItem(STORAGE_USER_KEY);
        }
      }

      if (token) {
        try {
          const freshUser = await api.getMe();
          setUser(freshUser);
          localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(freshUser));
        } catch {
          // Token expired or invalid
          console.warn('[AuthContext] Session expired, clearing credentials.');
          localStorage.removeItem(STORAGE_TOKEN_KEY);
          localStorage.removeItem(STORAGE_USER_KEY);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (nim: string, password: string): Promise<boolean> => {
    try {
      const res = await api.login(nim, password);
      setUser(res.user);
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(res.user));
      return true;
    } catch (err: any) {
      throw new Error(err.message || 'Login gagal.');
    }
  };

  const register = async (payload: {
    nim: string;
    name: string;
    password: string;
    email?: string;
    faculty?: string;
    program?: string;
  }): Promise<boolean> => {
    try {
      const res = await api.register(payload);
      setUser(res.user);
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(res.user));
      return true;
    } catch (err: any) {
      throw new Error(err.message || 'Pendaftaran gagal.');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    localStorage.removeItem(STORAGE_USER_KEY);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!user, isLoading, user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
