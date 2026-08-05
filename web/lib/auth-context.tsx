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

  // Takes no arguments. Calls auth-server's /refresh using the httpOnly
  // cookie, updates accessToken state, and returns the new token directly
  // (not just via state) so authFetch's retry logic can use it immediately
  // - or returns null on failure.
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
    // Takes no arguments. Runs once on mount: attempts a silent refresh to
    // restore a session from an existing valid refresh cookie without
    // asking for a password again, then marks loading finished either way.
    // Named inner function so setState only runs after the awaited work
    // resolves, not as the effect's own first synchronous action.
    async function attemptSilentRefresh() {
      await refreshSilently();
      setIsLoading(false);
    }
    attemptSilentRefresh();
  }, []);

  // Takes a username and password, calls auth-server's /login, and on
  // success stores the returned access token. Returns {ok: true} or
  // {ok: false, error}.
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

  // Takes no arguments. Calls auth-server's /logout to revoke the refresh
  // token, then clears the local access token in a finally block, so the
  // UI treats the admin as logged out even if the network call fails.
  async function logout(): Promise<void> {
    try {
      await fetch(`${AUTH_SERVER_URL}/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      setAccessToken(null);
    }
  }

  // Takes the same (input, init) pair as fetch. Attaches the current
  // access token as a Bearer header, and if the first attempt returns 401,
  // silently refreshes and retries exactly once with the new token.
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

// Takes no arguments and returns the current AuthContext value (token,
// loading state, login/logout/authFetch). Throws if called outside an
// AuthProvider.
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return context;
}
