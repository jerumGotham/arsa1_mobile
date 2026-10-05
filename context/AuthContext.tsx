import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

import { setAuthToken, setUnauthorizedHandler } from "@/services/api";
import { getMe, login as loginRequest, User } from "@/services/authApi";

const TOKEN_KEY = "arsa1.token";

// SecureStore is native-only; fall back to localStorage for `expo start --web`.
const tokenStore = {
  get: () =>
    Platform.OS === "web"
      ? Promise.resolve(globalThis.localStorage?.getItem(TOKEN_KEY) ?? null)
      : SecureStore.getItemAsync(TOKEN_KEY),
  set: (value: string) =>
    Platform.OS === "web"
      ? Promise.resolve(globalThis.localStorage?.setItem(TOKEN_KEY, value))
      : SecureStore.setItemAsync(TOKEN_KEY, value),
  clear: () =>
    Platform.OS === "web"
      ? Promise.resolve(globalThis.localStorage?.removeItem(TOKEN_KEY))
      : SecureStore.deleteItemAsync(TOKEN_KEY),
};

type AuthState = {
  user: User | null;
  ready: boolean;
  isAdmin: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  const signOut = useCallback(async () => {
    setAuthToken(null);
    setUser(null);
    await tokenStore.clear();
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      signOut();
    });

    (async () => {
      try {
        const token = await tokenStore.get();

        if (token) {
          setAuthToken(token);
          setUser(await getMe());
        }
      } catch (error: any) {
        // Only drop the saved session if the server rejected it,
        // not when the phone is simply offline.
        if (error?.response?.status === 401) {
          await signOut();
        }
      } finally {
        setReady(true);
      }
    })();

    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  const signIn = useCallback(async (username: string, password: string) => {
    const result = await loginRequest(username.trim(), password);
    setAuthToken(result.token);
    await tokenStore.set(result.token);
    setUser(result.user);
  }, []);

  const value = useMemo(
    () => ({
      user,
      ready,
      isAdmin: user?.role === "ADMIN",
      signIn,
      signOut,
    }),
    [user, ready, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }

  return context;
}
