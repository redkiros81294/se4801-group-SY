import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';

interface JwtPayload {
  userId: string;
  sub: string;
  role: string;
  orgId?: string;
  status?: string;
  iat?: number;
  exp?: number;
}

interface User {
  userId: string;
  email: string;
  roles: string[];
  orgId?: string;
  status?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

let tokenStore: string | null = null;

export const getToken = (): string | null => tokenStore;
export const clearToken = (): void => { tokenStore = null; };

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const login = (newToken: string) => {
    tokenStore = newToken;
    setToken(newToken);
    try {
      const decoded = jwtDecode<JwtPayload>(newToken);
      setUser({
        userId: decoded.userId,
        email: decoded.sub,
        roles: [decoded.role],
        orgId: decoded.orgId,
        status: decoded.status || 'ACTIVE',
      });
    } catch {
      setUser(null);
    }
  };

  const logout = () => {
    tokenStore = null;
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
