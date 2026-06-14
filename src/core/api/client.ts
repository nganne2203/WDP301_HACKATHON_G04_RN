import { clearTokens, getAccessToken, getRefreshToken, setTokens } from '../storage/tokenStorage';
import type { ApiErrorResponse, ApiSuccessResponse, AuthData, PaginatedData } from './types';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000/api';

export class ApiError extends Error {
  code: string;
  statusCode: number;
  errors: string[];

  constructor(response: ApiErrorResponse, statusCode: number) {
    super(response.message);
    this.name = 'ApiError';
    this.code = response.code;
    this.statusCode = statusCode;
    this.errors = response.errors || [];
  }

  get firstError() {
    return this.errors[0] || this.message;
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined | null>;
  auth?: boolean;
}

let refreshPromise: Promise<string | null> | null = null;

function buildUrl(path: string, params?: RequestOptions['params']) {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
}

async function refreshAccessToken() {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    await clearTokens();
    return null;
  }

  const json = (await response.json()) as ApiSuccessResponse<AuthData>;
  await setTokens(json.data.tokens.accessToken, json.data.tokens.refreshToken);
  return json.data.tokens.accessToken;
}

async function getFreshToken() {
  refreshPromise = refreshPromise || refreshAccessToken();
  const token = await refreshPromise;
  refreshPromise = null;
  return token;
}

async function parseError(response: Response) {
  const fallback: ApiErrorResponse = {
    success: false,
    code: 'REQUEST_FAILED',
    message: `Request failed with status ${response.status}`,
    errors: [],
  };

  try {
    return (await response.json()) as ApiErrorResponse;
  } catch {
    return fallback;
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<ApiSuccessResponse<T>> {
  const { body, params, auth = true, headers: extraHeaders, ...fetchOptions } = options;
  const url = buildUrl(path, params);
  const headers: Record<string, string> = {
    ...(extraHeaders as Record<string, string> | undefined),
  };

  if (body !== undefined) headers['Content-Type'] = 'application/json';

  if (auth) {
    const token = await getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401 && auth) {
    const errorJson = await response.clone().json().catch(() => null) as ApiErrorResponse | null;
    if (errorJson?.code === 'TOKEN_EXPIRED') {
      const newToken = await getFreshToken();
      if (newToken) {
        headers.Authorization = `Bearer ${newToken}`;
        const retryResponse = await fetch(url, {
          ...fetchOptions,
          headers,
          body: body !== undefined ? JSON.stringify(body) : undefined,
        });

        if (!retryResponse.ok) {
          throw new ApiError(await parseError(retryResponse), retryResponse.status);
        }

        return (await retryResponse.json()) as ApiSuccessResponse<T>;
      }
    }

    await clearTokens();
  }

  if (!response.ok) {
    throw new ApiError(await parseError(response), response.status);
  }

  return (await response.json()) as ApiSuccessResponse<T>;
}

export const api = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'DELETE' }),
};

export async function getPaginated<T>(path: string, params?: RequestOptions['params']): Promise<PaginatedData<T>> {
  const response = await api.get<T>(path, { params });
  return { data: response.data, pagination: response.pagination };
}
