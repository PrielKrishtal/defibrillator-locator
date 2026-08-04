"use client";

// Holds the admin's access token in memory only - never localStorage. The
// refresh token lives in auth-server's httpOnly cookie, invisible here; the
// browser attaches it automatically with `credentials: "include"`.

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
  // Separate from accessToken===null: without this, the dashboard would
  // flash a login redirect before the silent-refresh attempt even runs.
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

  // Returns the token directly, not just via state, so authFetch's
  // retry-once logic can use it immediately without waiting for a re-render.
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
    // Named inner function so setState only runs after the awaited work
    // resolves, not as the effect's own first synchronous action.
    async function attemptSilentRefresh() {
      // Runs once on mount: restores a session from an existing valid
      // refresh cookie without asking for a password again.
      await refreshSilently();
      setIsLoading(false);
    }
    attemptSilentRefresh();
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
