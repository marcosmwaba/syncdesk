import type {
  ApiEnvelope,
  ApiErrorResponse,
  AuthTokens,
  PaginationMeta,
} from '../../types/contract';
import { clearStoredTokens, getStoredTokens, setStoredTokens } from '../auth/storage';

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields?: Record<string, string>;

  constructor(
    status: number,
    code: string,
    message: string,
    fields?: Record<string, string>
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

export function isForbiddenError(err: unknown): boolean {
  return err instanceof ApiClientError && err.status === 403;
}

export function isUnauthorizedError(err: unknown): boolean {
  return err instanceof ApiClientError && err.status === 401;
}

export function getErrorMessage(err: unknown, fallback = 'Something went wrong.'): string {
  if (err instanceof ApiClientError) {
    return err.message || fallback;
  }
  if (err instanceof Error) {
    return err.message || fallback;
  }
  return fallback;
}

export function buildQueryString(
  params?: Record<string, string | number | boolean | undefined | null>
): string {
  if (!params) return '';
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

function getBaseUrl(): string {
  const envUrl =
    typeof import.meta !== 'undefined' && import.meta.env
      ? (import.meta.env.VITE_API_URL as string | undefined)
      : undefined;
  if (!envUrl) return '';
  return envUrl.replace(/\/+$/, '');
}

let activeRefreshPromise: Promise<AuthTokens | null> | null = null;
let onSessionExpiredCallback: (() => void) | null = null;

export function registerSessionExpiredHandler(handler: () => void): () => void {
  onSessionExpiredCallback = handler;
  return () => {
    if (onSessionExpiredCallback === handler) {
      onSessionExpiredCallback = null;
    }
  };
}

async function performRefresh(): Promise<AuthTokens | null> {
  if (activeRefreshPromise) {
    return activeRefreshPromise;
  }

  const tokens = getStoredTokens();
  if (!tokens?.refreshToken) {
    return null;
  }

  activeRefreshPromise = (async () => {
    try {
      const response = await fetch(`${getBaseUrl()}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      });

      if (!response.ok) {
        clearStoredTokens();
        onSessionExpiredCallback?.();
        return null;
      }

      const payload = (await response.json()) as ApiEnvelope<AuthTokens>;
      if ('error' in payload) {
        clearStoredTokens();
        onSessionExpiredCallback?.();
        return null;
      }

      const nextTokens: AuthTokens = {
        accessToken: payload.data.accessToken,
        refreshToken: payload.data.refreshToken ?? tokens.refreshToken,
        expiresAt: payload.data.expiresAt,
      };
      setStoredTokens(nextTokens);
      return nextTokens;
    } catch {
      return null;
    } finally {
      activeRefreshPromise = null;
    }
  })();

  return activeRefreshPromise;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  signal?: AbortSignal;
  skipAuthRefresh?: boolean;
  headers?: Record<string, string>;
}

export interface ApiResult<T, M = PaginationMeta> {
  data: T;
  meta?: M;
}

function isErrorEnvelope(payload: unknown): payload is ApiErrorResponse {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'error' in payload &&
    typeof (payload as ApiErrorResponse).error === 'object' &&
    (payload as ApiErrorResponse).error !== null
  );
}

async function executeRequest<T, M = PaginationMeta>(
  path: string,
  options: RequestOptions = {},
  hasRetried = false
): Promise<ApiResult<T, M>> {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${getBaseUrl()}${normalizedPath}${buildQueryString(options.query)}`;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...options.headers,
  };

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const tokens = getStoredTokens();
  if (tokens?.accessToken) {
    headers.Authorization = `Bearer ${tokens.accessToken}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw err;
    }
    throw new ApiClientError(
      0,
      'NETWORK_ERROR',
      'Unable to reach the service desk API. Check your connection and try again.'
    );
  }

  if (
    response.status === 401 &&
    !hasRetried &&
    !options.skipAuthRefresh &&
    !normalizedPath.startsWith('/auth/refresh') &&
    !normalizedPath.startsWith('/auth/verify') &&
    !normalizedPath.startsWith('/auth/request-code')
  ) {
    const refreshed = await performRefresh();
    if (refreshed) {
      return executeRequest<T, M>(path, options, true);
    }
  }

  const contentType = response.headers.get('content-type') ?? '';
  let parsed: unknown = null;

  if (contentType.includes('application/json')) {
    try {
      parsed = await response.json();
    } catch {
      parsed = null;
    }
  } else {
    const text = await response.text().catch(() => '');
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = null;
      }
    }
  }

  if (isErrorEnvelope(parsed)) {
    throw new ApiClientError(
      response.status,
      parsed.error.code || `HTTP_${response.status}`,
      parsed.error.message || response.statusText || 'Request failed.',
      parsed.error.fields
    );
  }

  if (!response.ok) {
    throw new ApiClientError(
      response.status,
      `HTTP_${response.status}`,
      response.statusText || `Request failed with status ${response.status}.`
    );
  }

  if (
    typeof parsed === 'object' &&
    parsed !== null &&
    'data' in parsed
  ) {
    const envelope = parsed as { data: T; meta?: M };
    return { data: envelope.data, meta: envelope.meta };
  }

  throw new ApiClientError(
    response.status,
    'INVALID_RESPONSE',
    'Unexpected response format from the server.'
  );
}

export const apiClient = {
  get<T, M = PaginationMeta>(
    path: string,
    options?: Omit<RequestOptions, 'method' | 'body'>
  ): Promise<ApiResult<T, M>> {
    return executeRequest<T, M>(path, { ...options, method: 'GET' });
  },

  post<T, M = PaginationMeta>(
    path: string,
    body?: unknown,
    options?: Omit<RequestOptions, 'method' | 'body'>
  ): Promise<ApiResult<T, M>> {
    return executeRequest<T, M>(path, { ...options, method: 'POST', body });
  },

  patch<T, M = PaginationMeta>(
    path: string,
    body?: unknown,
    options?: Omit<RequestOptions, 'method' | 'body'>
  ): Promise<ApiResult<T, M>> {
    return executeRequest<T, M>(path, { ...options, method: 'PATCH', body });
  },

  delete<T, M = PaginationMeta>(
    path: string,
    options?: Omit<RequestOptions, 'method' | 'body'>
  ): Promise<ApiResult<T, M>> {
    return executeRequest<T, M>(path, { ...options, method: 'DELETE' });
  },
};
