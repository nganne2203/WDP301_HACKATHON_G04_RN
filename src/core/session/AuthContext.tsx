import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { authApi } from '../../features/auth/api/authApi';
import { clearTokens, getAccessToken, setTokens } from '../storage/tokenStorage';
import type { LoginRequest, RegisterRequest, User } from '../api/types';
import { notificationsApi } from '../../features/notifications/api/notificationsApi';

interface AuthContextValue {
  user: User | null;
  isBootstrapping: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: User) => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const SESSION_BOOTSTRAP_TIMEOUT_MS = 8000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const refreshUser = useCallback(async () => {
    const response = await authApi.getMe();
    setUserState(response.data);
  }, []);

  useEffect(() => {
    let mounted = true;
    let bootstrapExpired = false;

    async function bootstrap() {
      let timeoutId: ReturnType<typeof setTimeout> | undefined;

      try {
        const restoreSession = async () => {
          const token = await getAccessToken();
          if (!token) return;

          const response = await authApi.getMe();
          if (mounted && !bootstrapExpired) setUserState(response.data);
        };

        const timeout = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => {
            bootstrapExpired = true;
            reject(new Error('Session bootstrap timed out'));
          }, SESSION_BOOTSTRAP_TIMEOUT_MS);
        });

        await Promise.race([restoreSession(), timeout]);
      } catch {
        // Never keep the app on its loading screen because storage or the API is unavailable.
        clearTokens().catch(() => undefined);
        if (mounted) setUserState(null);
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
        if (mounted) setIsBootstrapping(false);
      }
    }

    bootstrap();
    return () => {
      mounted = false;
      bootstrapExpired = true;
    };
  }, []);

  const login = useCallback(async (data: LoginRequest) => {
    const response = await authApi.login(data);
    await setTokens(response.data.tokens.accessToken, response.data.tokens.refreshToken);
    setUserState(response.data.user);
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    const response = await authApi.register(data);
    return response.data;
  }, []);

  const logout = useCallback(async () => {
    try {
      if (await getAccessToken()) {
        try {
          await notificationsApi.unregisterPushToken();
        } catch {
          // A stale push token must not prevent the user from logging out locally.
        }
        await authApi.logout();
      }
    } catch {
      // Logging out should always clear local session even if the server is unavailable.
    } finally {
      await clearTokens();
      setUserState(null);
    }
  }, []);

  const hasPermission = useCallback((permission: string) => {
    return user?.permissions.includes(permission) ?? false;
  }, [user]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isBootstrapping,
    isAuthenticated: Boolean(user),
    login,
    register,
    logout,
    refreshUser,
    setUser: setUserState,
    hasPermission,
  }), [hasPermission, isBootstrapping, login, logout, refreshUser, register, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
