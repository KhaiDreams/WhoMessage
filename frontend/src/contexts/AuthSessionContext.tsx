"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { userAPI, type BootstrapResponse } from "@/lib/api";

const PUBLIC_ROUTES = ["/login", "/register", "/", "/_error"];
const SESSION_CACHE_TTL_MS = 20_000;

type AuthUser = BootstrapResponse["user"];

export interface AuthState {
  isAuthenticated: boolean;
  hasProfile: boolean;
  hasGames: boolean;
  hasInterests: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  token: string | null;
  unreadNotifications: number;
  unreadMessages: number;
}

interface AuthSessionContextValue extends AuthState {
  refreshSession: (options?: { force?: boolean }) => Promise<AuthState>;
  clearSession: () => void;
}

const INITIAL_AUTH_STATE: AuthState = {
  isAuthenticated: false,
  hasProfile: false,
  hasGames: false,
  hasInterests: false,
  isLoading: true,
  user: null,
  token: null,
  unreadNotifications: 0,
  unreadMessages: 0,
};

type CachedBootstrap = {
  token: string;
  data: BootstrapResponse;
  expiresAt: number;
};

let bootstrapCache: CachedBootstrap | null = null;
let inFlightBootstrap: Promise<BootstrapResponse> | null = null;
let inFlightToken: string | null = null;

function buildAuthState(token: string, bootstrap: BootstrapResponse): AuthState {
  const user = bootstrap.user;

  return {
    isAuthenticated: true,
    hasProfile: bootstrap.setupStatus.hasProfile,
    hasGames: bootstrap.setupStatus.hasGames,
    hasInterests: bootstrap.setupStatus.hasInterests,
    isLoading: false,
    user,
    token,
    unreadNotifications: bootstrap.unread?.notifications ?? 0,
    unreadMessages: bootstrap.unread?.messages ?? 0,
  };
}

async function getBootstrapCached(token: string, force = false): Promise<BootstrapResponse> {
  const now = Date.now();

  if (
    !force &&
    bootstrapCache &&
    bootstrapCache.token === token &&
    bootstrapCache.expiresAt > now
  ) {
    return bootstrapCache.data;
  }

  if (!force && inFlightBootstrap && inFlightToken === token) {
    return inFlightBootstrap;
  }

  inFlightToken = token;
  inFlightBootstrap = userAPI
    .getBootstrap()
    .then((data) => {
      bootstrapCache = {
        token,
        data,
        expiresAt: Date.now() + SESSION_CACHE_TTL_MS,
      };
      return data;
    })
    .finally(() => {
      inFlightBootstrap = null;
      inFlightToken = null;
    });

  return inFlightBootstrap;
}

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [state, setState] = useState<AuthState>(INITIAL_AUTH_STATE);
  const stateRef = useRef<AuthState>(INITIAL_AUTH_STATE);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const clearSession = useCallback(() => {
    bootstrapCache = null;
    inFlightBootstrap = null;
    inFlightToken = null;

    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("is_admin");
    }

    setState({
      ...INITIAL_AUTH_STATE,
      isLoading: false,
    });
  }, []);

  const refreshSession = useCallback(
    async ({ force = false }: { force?: boolean } = {}): Promise<AuthState> => {
      if (typeof window === "undefined") {
        return stateRef.current;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        const nextState = { ...INITIAL_AUTH_STATE, isLoading: false };
        setState(nextState);
        return nextState;
      }

      setState((prev) => ({ ...prev, isLoading: true, token }));

      try {
        const bootstrap = await getBootstrapCached(token, force);
        const user = bootstrap?.user;

        if (!user || user.ban || user.active === false) {
          clearSession();
          return { ...INITIAL_AUTH_STATE, isLoading: false };
        }

        localStorage.setItem("is_admin", user.is_admin ? "true" : "false");

        const nextState = buildAuthState(token, bootstrap);
        setState(nextState);
        return nextState;
      } catch (error) {
        clearSession();
        return { ...INITIAL_AUTH_STATE, isLoading: false };
      }
    },
    [clearSession]
  );

  useEffect(() => {
    const currentPath = pathname || "";
    const isPublicRoute = PUBLIC_ROUTES.includes(currentPath);
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    if (!token) {
      setState((prev) => (prev.isLoading ? { ...INITIAL_AUTH_STATE, isLoading: false } : prev));
      return;
    }

    if (isPublicRoute && !stateRef.current.isAuthenticated) {
      setState((prev) => ({ ...prev, isLoading: false, token }));
      return;
    }

    void refreshSession();
  }, [pathname, refreshSession]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== "token") return;

      if (!event.newValue) {
        clearSession();
        return;
      }

      void refreshSession({ force: true });
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [clearSession, refreshSession]);

  const value = useMemo(
    () => ({
      ...state,
      refreshSession,
      clearSession,
    }),
    [state, refreshSession, clearSession]
  );

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession() {
  const context = useContext(AuthSessionContext);
  if (!context) {
    throw new Error("useAuthSession must be used within AuthSessionProvider");
  }
  return context;
}

