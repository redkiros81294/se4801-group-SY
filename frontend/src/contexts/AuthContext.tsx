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

const TOKEN_KEY = 'chaintrack_token';

export const getToken = (): string | null => sessionStorage.getItem(TOKEN_KEY);
export const clearToken = (): void => { sessionStorage.removeItem(TOKEN_KEY); };

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => getToken());
  const [user, setUser] = useState<User | null>(() => {
    const savedToken = getToken();
    if (savedToken) {
      try {
        const decoded = jwtDecode<JwtPayload>(savedToken);
        return {
          userId: decoded.userId,
          email: decoded.sub,
          roles: [decoded.role],
          orgId: decoded.orgId,
          status: decoded.status || 'ACTIVE',
        };
      } catch {
        return null;
      }
    }
    return null;
  });

  const login = (newToken: string) => {
    sessionStorage.setItem(TOKEN_KEY, newToken);
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
    clearToken();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
