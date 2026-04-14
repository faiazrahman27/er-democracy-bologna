'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { apiRequest } from '@/lib/api';

type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  emailVerified: boolean;
  isActive: boolean;
};

type LoginPayload = {
  email: string;
  password: string;
};

type LoginResponse = {
  message: string;
  accessToken: string;
  user: AuthUser;
};

type RefreshResponse = {
  message: string;
  accessToken: string;
  user: AuthUser;
};

type LogoutResponse = {
  message: string;
};

type MeResponse = {
  message: string;
  user: AuthUser;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = useCallback(() => {
    setUser(null);
    setToken(null);
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const response = await apiRequest<RefreshResponse>('/auth/refresh', {
        method: 'POST',
      });

      setToken(response.accessToken);
      setUser(response.user);
    } catch {
      clearSession();
    } finally {
      setIsLoading(false);
    }
  }, [clearSession]);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const login = useCallback(async (payload: LoginPayload) => {
    const response = await apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: payload,
    });

    setToken(response.accessToken);
    setUser(response.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      if (token) {
        await apiRequest<LogoutResponse>('/auth/logout', {
          method: 'POST',
          token,
        });
      }
    } catch {
      // ignore logout response errors and still clear local session state
    } finally {
      clearSession();
    }
  }, [token, clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isLoading,
      login,
      logout,
      refreshSession,
    }),
    [user, token, isLoading, login, logout, refreshSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
