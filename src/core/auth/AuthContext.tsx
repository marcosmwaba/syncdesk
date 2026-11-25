import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type {
  AppConfig,
  AuthTokens,
  MeResponse,
  UserProfile,
} from '../../types/contract';
import {
  apiClient,
  getErrorMessage,
  isForbiddenError,
  isUnauthorizedError,
  registerSessionExpiredHandler,
} from '../api';
import {
  clearStoredTokens,
  getStoredTokens,
  setStoredTokens,
} from './storage';

export type BootstrapStatus = 'loading' | 'ready' | 'error' | 'forbidden';

export interface AuthContextValue {
  status: BootstrapStatus;
  isAuthenticated: boolean;
  user: UserProfile | null;
  permissions: string[];
  modules: string[];
  config: AppConfig | null;
  configError: string | null;
  error: string | null;
  reloadBootstrap: () => Promise<void>;
  reloadConfig: () => Promise<void>;
  loginWithTokens: (tokens: AuthTokens) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<BootstrapStatus>('loading');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [modules, setModules] = useState<string[]>([]);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadBootstrap = useCallback(async () => {
    setStatus('loading');
    setError(null);
    setConfigError(null);

    const [meResult, configResult] = await Promise.allSettled([
      apiClient.get<MeResponse>('/me'),
      apiClient.get<AppConfig>('/config'),
    ]);

    let nextForbidden = false;
    let fatalError: string | null = null;

    if (meResult.status === 'fulfilled') {
      setUser(meResult.value.data.user);
      setPermissions(meResult.value.data.permissions ?? []);
      setModules(meResult.value.data.modules ?? []);
    } else {
      const err = meResult.reason;
      if (isUnauthorizedError(err)) {
        clearStoredTokens();
        setUser(null);
        setPermissions([]);
        setModules([]);
      } else if (isForbiddenError(err)) {
        nextForbidden = true;
        setUser(null);
        setPermissions([]);
        setModules([]);
      } else {
        setUser(null);
        setPermissions([]);
        setModules([]);
        fatalError = getErrorMessage(err, 'Failed to load user session.');
      }
    }

    if (configResult.status === 'fulfilled') {
      setConfig(configResult.value.data);
      setConfigError(null);
    } else {
      const cfgErr = configResult.reason;
      if (!isUnauthorizedError(cfgErr)) {
        setConfigError(getErrorMessage(cfgErr, 'Failed to load workspace configuration.'));
      }
      setConfig(null);
    }

    if (nextForbidden) {
      setStatus('forbidden');
      return;
    }

    if (fatalError && !getStoredTokens() && configResult.status === 'fulfilled') {
      // Public config loaded, allow public pages like /board and /login
      setStatus('ready');
      return;
    }

    if (fatalError) {
      setError(fatalError);
      setStatus('error');
      return;
    }

    setStatus('ready');
  }, []);

  const reloadConfig = useCallback(async () => {
    try {
      const res = await apiClient.get<AppConfig>('/config');
      setConfig(res.data);
      setConfigError(null);
    } catch (err) {
      setConfigError(getErrorMessage(err, 'Failed to reload configuration.'));
    }
  }, []);

  const loginWithTokens = useCallback(
    async (tokens: AuthTokens) => {
      setStoredTokens(tokens);
      await loadBootstrap();
    },
    [loadBootstrap]
  );

  const logout = useCallback(async () => {
    const tokens = getStoredTokens();
    try {
      await apiClient.post(
        '/auth/logout',
        tokens?.refreshToken ? { refreshToken: tokens.refreshToken } : {},
        { skipAuthRefresh: true }
      );
    } catch {
      // Clear local session regardless of server response
    } finally {
      clearStoredTokens();
      setUser(null);
      setPermissions([]);
      setModules([]);
      await loadBootstrap();
    }
  }, [loadBootstrap]);

  useEffect(() => {
    void loadBootstrap();
  }, [loadBootstrap]);

  useEffect(() => {
    return registerSessionExpiredHandler(() => {
      setUser(null);
      setPermissions([]);
      setModules([]);
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      isAuthenticated: Boolean(user),
      user,
      permissions,
      modules,
      config,
      configError,
      error,
      reloadBootstrap: loadBootstrap,
      reloadConfig,
      loginWithTokens,
      logout,
    }),
    [
      status,
      user,
      permissions,
      modules,
      config,
      configError,
      error,
      loadBootstrap,
      reloadConfig,
      loginWithTokens,
      logout,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
