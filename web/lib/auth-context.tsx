"use client";

// Holds the admin's access token in memory only (React state) - never in
// localStorage or a readable cookie. The refresh token lives in the
// auth server's httpOnly cookie, invisible to this code entirely; the
// browser attaches it automatically on every fetch to the auth server as
// long as `credentials: "include"` is set.

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

const AUTH_SERVER_URL = process.env.NEXT_PUBLIC_AUTH_SERVER_URL;
if (!AUTH_SERVER_URL) {
  throw new Error("Missing NEXT_PUBLIC_AUTH_SERVER_URL in web/.env");
}

type LoginResult = { ok: true } | { ok: false; error: string };

type AuthContextValue = {
  accessToken: string | null;
  // WHY isLoading exists separately from accessToken===null: on first
  // mount we don't yet know if the admin has a still-valid refresh cookie
  // from a previous visit. Without this flag, the dashboard would flash a
  // "please log in" redirect before the silent-refresh attempt even runs.
  isLoading: boolean;
  login: (username: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  // Wraps fetch: attaches the access token, and on a 401 tries exactly one
  // silent refresh + retry before giving up. Every admin-only API call in
  // the dashboard goes through this instead of raw fetch.
  authFetch: (input: string, init?: RequestInit) => Promise<Response>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Returns the new access token on success (and updates state), or null
  // on failure. Returning the value directly - not just relying on state -
  // means callers can use the fresh token immediately without waiting for
  // a re-render, which matters for the retry-once logic in authFetch.
  async function refreshSilently(): Promise<string | null> {
    try {
      const res = await fetch(`${AUTH_SERVER_URL}/refresh`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        setAccessToken(null);
        return null;
      }
      const body = await res.json();
      setAccessToken(body.accessToken);
      return body.accessToken as string;
    } catch {
      setAccessToken(null);
      return null;
    }
  }

  useEffect(() => {
    // WHY run this once on mount: it's the "silent refresh flow" from
    // DEFIBRILLATOR_PROJECT_BRIEF.md §8 Phase 6 - if the admin already has a
    // valid refresh cookie from an earlier session, this restores them
    // without asking for a password again.
    refreshSilently().finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login(username: string, password: string): Promise<LoginResult> {
    try {
      const res = await fetch(`${AUTH_SERVER_URL}/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        return { ok: false, error: body.error || "שם משתמש או סיסמה שגויים" };
      }
      const body = await res.json();
      setAccessToken(body.accessToken);
      return { ok: true };
    } catch {
      return { ok: false, error: "שגיאת תקשורת עם שרת ההתחברות" };
    }
  }

  async function logout(): Promise<void> {
    try {
      await fetch(`${AUTH_SERVER_URL}/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      // WHY finally: even if the network call fails, the admin clicked
      // logout - clear the local token so the UI treats them as logged out.
      setAccessToken(null);
    }
  }

  async function authFetch(
    input: string,
    init: RequestInit = {}
  ): Promise<Response> {
    const attempt = (token: string | null) =>
      fetch(input, {
        ...init,
        headers: {
          ...init.headers,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

    let res = await attempt(accessToken);
    if (res.status === 401) {
      const refreshedToken = await refreshSilently();
      if (refreshedToken) {
        res = await attempt(refreshedToken);
      }
    }
    return res;
  }

  return (
    <AuthContext.Provider
      value={{ accessToken, isLoading, login, logout, authFetch }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return context;
}
