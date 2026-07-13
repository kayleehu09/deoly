import * as SecureStore from 'expo-secure-store';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
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
          setAuth(parsedAuth);
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
      signIn: async (input) => {
        const nextAuth = await loginWithEmail(input);
        await saveAuth(nextAuth);
        setAuth(nextAuth);
      },
      signUp: async (input) => {
        const nextAuth = await signupWithEmail(input);
        await saveAuth(nextAuth);
        setAuth(nextAuth);
      },
      signOut: async () => {
        const token = auth?.session.token;

        setAuth(null);
        await clearAuth();

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
        setAuth(null);
        await clearAuth();
      },
      clearSavedAuth: async () => {
        setAuth(null);
        await clearAuth();
      }
    }),
    [auth, isRestoring]
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
