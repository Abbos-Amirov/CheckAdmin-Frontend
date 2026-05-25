import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { adminLogin, adminLogout, adminSignup } from '@/api/auth';
import { ApiError } from '@/api/client';
import type { AdminLoginRequest, AdminSignupRequest, AuthSession } from '@/types/auth.types';

const TOKEN_KEY = 'admin-auth-token';
const USER_KEY = 'admin-auth-user';

type AuthContextValue = {
  user: AuthSession['user'] | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (body: AdminLoginRequest) => Promise<void>;
  signup: (body: AdminSignupRequest) => Promise<void>;
  logout: () => Promise<void>;
  authErrorMessage: (error: unknown) => string;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredSession(): AuthSession | null {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const rawUser = localStorage.getItem(USER_KEY);
    if (!token || !rawUser) return null;
    const user = JSON.parse(rawUser) as AuthSession['user'];
    return { token, user };
  } catch {
    return null;
  }
}

function persistSession(session: AuthSession | null): void {
  if (!session) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    return;
  }
  localStorage.setItem(TOKEN_KEY, session.token);
  localStorage.setItem(USER_KEY, JSON.stringify(session.user));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => readStoredSession());
  const [isLoading] = useState(false);

  const login = useCallback(async (body: AdminLoginRequest) => {
    const next = await adminLogin(body);
    persistSession(next);
    setSession(next);
  }, []);

  const signup = useCallback(async (body: AdminSignupRequest) => {
    const next = await adminSignup(body);
    persistSession(next);
    setSession(next);
  }, []);

  const logout = useCallback(async () => {
    const token = session?.token ?? getStoredAuthToken();
    try {
      if (token) {
        await adminLogout(token);
      }
    } catch {
      // Local session is cleared even if backend logout fails.
    } finally {
      persistSession(null);
      setSession(null);
    }
  }, [session?.token]);

  const authErrorMessage = useCallback((error: unknown) => {
    if (error instanceof ApiError) return error.message;
    if (error instanceof Error) return error.message;
    return 'Auth failed';
  }, []);

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      token: session?.token ?? null,
      isAuthenticated: Boolean(session?.token),
      isLoading,
      login,
      signup,
      logout,
      authErrorMessage,
    }),
    [session, isLoading, login, signup, logout, authErrorMessage],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}

export function getStoredAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
