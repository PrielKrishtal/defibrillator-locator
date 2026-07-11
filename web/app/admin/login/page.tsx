"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const INPUT_CLASSES =
  "rounded-lg border border-line bg-paper px-3 py-2 text-ink transition-colors focus:border-signal focus:outline-none focus:ring-2 focus:ring-signal/20";

export default function AdminLoginPage() {
  const { login, accessToken, isLoading } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // WHY: if the silent-refresh on mount already restored a session (admin
  // still has a valid refresh cookie from before), skip straight to the
  // dashboard instead of showing the login form again.
  useEffect(() => {
    if (!isLoading && accessToken) {
      router.replace("/admin");
    }
  }, [isLoading, accessToken, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const result = await login(username, password);
    setSubmitting(false);
    if (result.ok) {
      router.push("/admin");
    } else {
      setError(result.error);
    }
  }

  return (
    <main className="mx-auto flex max-w-sm flex-1 flex-col justify-center p-8">
      <div className="flex flex-col gap-6 rounded-xl border border-line bg-paper p-8 shadow-sm">
        <h1 className="font-display text-2xl font-medium">כניסת מנהל</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-ink/70">שם משתמש</span>
            <input
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={INPUT_CLASSES}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-ink/70">סיסמה</span>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={INPUT_CLASSES}
            />
          </label>
          {error && <p className="text-sm text-flare">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-signal px-4 py-2 font-medium text-paper transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "מתחבר..." : "כניסה"}
          </button>
        </form>
      </div>
    </main>
  );
}
