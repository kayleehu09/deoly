import { AppState } from 'react-native';
import { getMyProfile } from '../services/profile';
import { isUnauthorizedApiError, type UserProfile } from '../services/auth';
import * as SecureStore from 'expo-secure-store';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useCallback,
  useState,
  type PropsWithChildren
} from 'react';

import {
  deleteAccountWithToken,
  loginWithEmail,
  logoutWithToken,
  signupWithEmail,
  type AuthResponse,
  type LoginInput,
  type SignupInput
} from '../services/auth';

const AUTH_STORAGE_KEY = 'deoly.auth';
const MIN_AUTH_RESTORE_MS = 900;

type AuthContextValue = {
  auth: AuthResponse | null;
  isAuthenticated: boolean;
  isRestoring: boolean;
  signIn: (input: LoginInput) => Promise<void>;
  signUp: (input: SignupInput) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  clearSavedAuth: () => Promise<void>;
  updateUser: (user: UserProfile, token: string) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function isExpired(auth: AuthResponse) {
  return new Date(auth.session.expiresAt).getTime() <= Date.now();
}

async function saveAuth(auth: AuthResponse) {
  await SecureStore.setItemAsync(AUTH_STORAGE_KEY, JSON.stringify(auth));
}

async function clearAuth() {
  await SecureStore.deleteItemAsync(AUTH_STORAGE_KEY);
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [auth, setAuth] = useState<AuthResponse | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const authRef = useRef<AuthResponse | null>(null);
  const revision = useRef(0);
  const storageQueue = useRef<Promise<unknown>>(Promise.resolve());
  const persist = useCallback((next: AuthResponse | null) => {
    const operation = storageQueue.current.catch(() => undefined).then(() => next ? saveAuth(next) : clearAuth());
    storageQueue.current = operation;
    return operation;
  }, []);
  const replaceAuth = useCallback((next: AuthResponse | null) => {
    revision.current += 1;
    authRef.current = next;
    setAuth(next);
  }, []);
  const clearSavedAuth = useCallback(async () => {
    replaceAuth(null);
    await persist(null);
  }, [persist, replaceAuth]);
  const updateUser = useCallback(async (user: UserProfile, token: string) => {
    const current = authRef.current;
    if (!current || current.session.token !== token) return false;
    const next = { ...current, user };
    replaceAuth(next);
    try { await persist(next); return true; }
    catch { return false; }
  }, [persist, replaceAuth]);
  const refreshProfile = useCallback(async () => {
    const current = authRef.current;
    const startedRevision = revision.current;
    if (!current) return;
    try {
      const response = await getMyProfile(current.session.token);
      if (revision.current === startedRevision) await updateUser(response.user, current.session.token);
    } catch (error) {
      if (revision.current === startedRevision && isUnauthorizedApiError(error)) {
        replaceAuth(null);
        await persist(null).catch(() => undefined);
      }
    }
  }, [persist, replaceAuth, updateUser]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refreshProfile();
    });
    return () => subscription.remove();
  }, [refreshProfile]);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      const startedAt = Date.now();

      try {
        const storedAuth = await SecureStore.getItemAsync(AUTH_STORAGE_KEY);

        if (!storedAuth) {
          return;
        }

        const parsedAuth = JSON.parse(storedAuth) as AuthResponse;

        if (isExpired(parsedAuth)) {
          await clearAuth();
          return;
        }

        if (isMounted) {
          replaceAuth(parsedAuth);
          await refreshProfile();
        }
      } catch {
        await clearAuth();
      } finally {
        const remainingMs = Math.max(0, MIN_AUTH_RESTORE_MS - (Date.now() - startedAt));

        if (remainingMs > 0) {
          await wait(remainingMs);
        }

        if (isMounted) {
          setIsRestoring(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      auth,
      isAuthenticated: Boolean(auth),
      isRestoring,
      updateUser,
      refreshProfile,
      signIn: async (input) => {
        const nextAuth = await loginWithEmail(input);
        await persist(nextAuth);
        replaceAuth(nextAuth);
      },
      signUp: async (input) => {
        const nextAuth = await signupWithEmail(input);
        await persist(nextAuth);
        replaceAuth(nextAuth);
      },
      signOut: async () => {
        const token = auth?.session.token;

        replaceAuth(null);
        await persist(null);

        if (token) {
          await logoutWithToken(token).catch(() => undefined);
        }
      },
      deleteAccount: async () => {
        const token = auth?.session.token;

        if (!token) {
          return;
        }

        await deleteAccountWithToken(token);
        replaceAuth(null);
        await persist(null);
      },
      clearSavedAuth
    }),
    [auth, isRestoring, persist, replaceAuth, refreshProfile, updateUser, clearSavedAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider.');
  }

  return context;
}
