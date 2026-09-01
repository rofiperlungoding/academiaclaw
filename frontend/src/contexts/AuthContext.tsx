import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface User {
  nim: string;
  name: string;
  faculty: string;
  program: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (nim: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const DEMO_USER: User = {
  nim: '255150307111073',
  name: 'Muhammad Rofi Darmawan',
  faculty: 'FILKOM',
  program: 'Teknik Komputer',
};

const STORAGE_KEY = 'academiaclaw_auth';

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const login = async (_nim: string, _password: string): Promise<boolean> => {
    await new Promise((r) => setTimeout(r, 800));
    setUser(DEMO_USER);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEMO_USER));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!user, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
