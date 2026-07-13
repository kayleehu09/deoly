import Constants from 'expo-constants';
import type { ApiErrorShape } from '@sanctuary/shared';

export type AuthSession = {
  token: string;
  expiresAt: string;
};

export type UserProfile = {
  id: string;
  displayName: string;
  username: string;
  email: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
};

export type AuthResponse = {
  user: UserProfile;
  session: AuthSession;
};

export type SignupInput = {
  displayName: string;
  username: string;
  email: string;
  password: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

const configuredApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
const API_TIMEOUT_MS = 10000;
const shouldLogApiRequests = process.env.NODE_ENV !== 'production';

function getExpoHostApiBaseUrl() {
  const hostUri = Constants.expoConfig?.hostUri ?? Constants.manifest2?.extra?.expoClient?.hostUri;
  const host = hostUri?.split(':')[0];

  return host ? `http://${host}:4000` : undefined;
}

const API_BASE_URL = getExpoHostApiBaseUrl() ?? configuredApiBaseUrl;

let currentAuth: AuthResponse | null = null;

export function getApiBaseUrl() {
  return API_BASE_URL;
}

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
  }
}

export function isUnauthorizedApiError(error: unknown) {
  return error instanceof ApiRequestError && error.status === 401;
}

function fetchWithTimeout(url: string, init: RequestInit) {
  const controller = new AbortController();
  let timeout: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => {
      controller.abort();
      reject(new Error('API_REQUEST_TIMEOUT'));
    }, API_TIMEOUT_MS);
  });

  return Promise.race([
    fetch(url, {
      ...init,
      signal: controller.signal
    }),
    timeoutPromise
  ]).finally(() => clearTimeout(timeout));
}

function logApi(message: string) {
  if (shouldLogApiRequests) {
    console.log(`[mobile api] ${message}`);
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit, token?: string): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error('Set EXPO_PUBLIC_API_BASE_URL in apps/mobile/.env to your computer LAN address before testing in Expo Go.');
  }

  let response: Response;
  const url = `${API_BASE_URL}${path}`;
  const method = init?.method ?? 'GET';

  try {
    logApi(`${method} ${url}`);
    response = await fetchWithTimeout(url, {
      ...init,
      headers: {
        'cache-control': 'no-store',
        'content-type': 'application/json',
        pragma: 'no-cache',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...(init?.headers ?? {})
      }
    });
    logApi(`${method} ${path} -> ${response.status}`);
  } catch (err) {
    if (err instanceof Error && (err.name === 'AbortError' || err.message === 'API_REQUEST_TIMEOUT')) {
      logApi(`${method} ${path} -> timeout`);
      throw new Error(`The API at ${API_BASE_URL} took too long to respond. Make sure the API is running and your phone is on the same Wi-Fi.`);
    }

    logApi(`${method} ${path} -> network error`);
    throw new Error(`Could not reach the API at ${API_BASE_URL}. Make sure the API is running and your device can access it.`);
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ApiErrorShape | null;
    throw new ApiRequestError(payload?.error?.message ?? 'Request failed.', response.status, payload?.error?.code);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function signupWithEmail(input: SignupInput) {
  const auth = await apiFetch<AuthResponse>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(input)
  });

  currentAuth = auth;
  return auth;
}

export async function loginWithEmail(input: LoginInput) {
  const auth = await apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(input)
  });

  currentAuth = auth;
  return auth;
}

export async function logoutWithToken(token: string) {
  await apiFetch<void>('/auth/logout', {
    method: 'POST'
  }, token);

  currentAuth = null;
}

export async function deleteAccountWithToken(token: string) {
  await apiFetch<void>('/auth/account', {
    method: 'DELETE'
  }, token);

  currentAuth = null;
}

export function getCurrentAuth() {
  return currentAuth;
}
