import type { AuthTokens } from '../../types/contract';

const ACCESS_TOKEN_KEY = 'syncdesk_access_token';
const REFRESH_TOKEN_KEY = 'syncdesk_refresh_token';
const EXPIRES_AT_KEY = 'syncdesk_expires_at';

function getStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    return null;
  }
  return null;
}

export function getStoredTokens(): AuthTokens | null {
  const storage = getStorage();
  if (!storage) return null;
  const accessToken = storage.getItem(ACCESS_TOKEN_KEY);
  if (!accessToken) return null;
  const refreshToken = storage.getItem(REFRESH_TOKEN_KEY) ?? undefined;
  const expiresAt = storage.getItem(EXPIRES_AT_KEY) ?? undefined;
  return { accessToken, refreshToken, expiresAt };
}

export function setStoredTokens(tokens: AuthTokens): void {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  if (tokens.refreshToken) {
    storage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  } else {
    storage.removeItem(REFRESH_TOKEN_KEY);
  }
  if (tokens.expiresAt) {
    storage.setItem(EXPIRES_AT_KEY, tokens.expiresAt);
  } else {
    storage.removeItem(EXPIRES_AT_KEY);
  }
}

export function clearStoredTokens(): void {
  const storage = getStorage();
  if (!storage) return;
  storage.removeItem(ACCESS_TOKEN_KEY);
  storage.removeItem(REFRESH_TOKEN_KEY);
  storage.removeItem(EXPIRES_AT_KEY);
}
