import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../lib/api';
import { setAccessToken } from '../lib/authToken';

const ACCESS_TOKEN_KEY = 'chaintrack_access_token';

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
  refreshToken: string | null;
  login: (token: string, refreshToken?: string, rememberMe?: boolean) => void;
  refresh: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'chaintrack_token';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(ACCESS_TOKEN_KEY);
    }
    return null;
  });
  const [refreshToken, setRefreshToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(TOKEN_KEY);
    }
    return null;
  });
  const [user, setUser] = useState<User | null>(null);

  const decodeUser = useCallback((rawToken: string): User | null => {
    try {
      const decoded = jwtDecode<JwtPayload>(rawToken);
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
  }, []);

  const refresh = useCallback(async () => {
    const stored = typeof window !== 'undefined' ? sessionStorage.getItem(TOKEN_KEY) : null;
    if (!stored) return;
    try {
      const response = await api.post('/auth/refresh', { refreshToken: stored });
      const next = response.data;
      if (next?.token) {
        setToken(next.token);
        setRefreshToken(next.refreshToken || stored);
        const decodedUser = decodeUser(next.token);
        if (decodedUser) setUser(decodedUser);
      }
    } catch {
      logout();
    }
  }, [decodeUser]);

  const login = useCallback((newToken: string, newRefreshToken?: string, rememberMe = false) => {
    setToken(newToken);
    setRefreshToken(newRefreshToken ?? null);
    setAccessToken(newToken);
    const decodedUser = decodeUser(newToken);
    setUser(decodedUser);
    if (rememberMe && newRefreshToken) {
      sessionStorage.setItem(TOKEN_KEY, newRefreshToken);
    }
  }, [decodeUser]);

  const logout = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    setToken(null);
    setRefreshToken(null);
    setUser(null);
    setAccessToken(null);
  }, []);

  // On boot, prefer a persisted access token if present.
  // If only a refresh token exists, attempt silent refresh.
  useEffect(() => {
    const storedAccess = typeof window !== 'undefined' ? sessionStorage.getItem(ACCESS_TOKEN_KEY) : null;
    if (storedAccess) {
      const decoded = decodeUser(storedAccess);
      if (decoded) {
        setToken(storedAccess);
        setUser(decoded);
        setAccessToken(storedAccess);
        return;
      }
    }

    const stored = typeof window !== 'undefined' ? sessionStorage.getItem(TOKEN_KEY) : null;
    if (stored) {
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, refreshToken, login, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
