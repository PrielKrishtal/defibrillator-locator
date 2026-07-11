"use client";

import { useState, useEffect, useCallback, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

type Registration = {
  id: number;
  first_name: string;
  last_name: string | null;
  mobile: string;
  lora_id: string | null;
  has_defibrillator: boolean;
  has_lora: boolean;
  created_at: string;
};

export default function AdminDashboardPage() {
  const { accessToken, isLoading, logout, authFetch } = useAuth();
  const router = useRouter();

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [radiusMeters, setRadiusMeters] = useState("");
  const [radiusStatus, setRadiusStatus] = useState("");
  const [introText, setIntroText] = useState("");
  const [introStatus, setIntroStatus] = useState("");

  // WHY redirect here, not in app/admin/layout.tsx: the layout also wraps
  // /admin/login, and guarding there would redirect the login page to
  // itself in a loop. Guarding only the dashboard page avoids that.
  useEffect(() => {
    if (!isLoading && !accessToken) {
      router.replace("/admin/login");
    }
  }, [isLoading, accessToken, router]);

  const loadRegistrations = useCallback(async () => {
    const res = await authFetch("/api/registrations");
    if (res.ok) {
      const body = await res.json();
      setRegistrations(body.registrations);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!accessToken) return;
    loadRegistrations();
    fetch("/api/settings/radius")
      .then((r) => r.json())
      .then((b) => setRadiusMeters(String(b.radiusMeters)));
    fetch("/api/site-content/homepage_intro")
      .then((r) => r.json())
      .then((b) => setIntroText(b.value));
  }, [accessToken, loadRegistrations]);

  async function handleDelete(id: number) {
    const res = await authFetch(`/api/registrations/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      loadRegistrations();
    }
  }

  async function handleRadiusSave(e: FormEvent) {
    e.preventDefault();
    setRadiusStatus("שומר...");
    const res = await authFetch("/api/settings/radius", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ radiusMeters: Number(radiusMeters) }),
    });
    setRadiusStatus(res.ok ? "נשמר" : "שגיאה בשמירה");
  }

  async function handleIntroSave(e: FormEvent) {
    e.preventDefault();
    setIntroStatus("שומר...");
    const res = await authFetch("/api/site-content/homepage_intro", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: introText }),
    });
    setIntroStatus(res.ok ? "נשמר" : "שגיאה בשמירה");
  }

  async function handleLogout() {
    await logout();
    router.push("/admin/login");
  }

  // WHY this early return: isLoading covers the initial silent-refresh
  // attempt, and !accessToken covers the moment between "refresh failed"
  // and the redirect effect above actually firing - both should show a
  // neutral loading state instead of a flash of an empty dashboard.
  if (isLoading || !accessToken) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <p className="text-zinc-500">טוען...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-1 flex-col gap-10 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">לוח בקרה למנהל</h1>
        <button
          onClick={handleLogout}
          className="rounded border border-zinc-300 px-3 py-1 text-sm dark:border-zinc-700"
        >
          התנתקות
        </button>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">נרשמים ({registrations.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-zinc-300 text-right dark:border-zinc-700">
                <th className="p-2">שם</th>
                <th className="p-2">טלפון</th>
                <th className="p-2">דפיברילטור</th>
                <th className="p-2">LoRa</th>
                <th className="p-2">מזהה LoRa</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((r) => (
                <tr key={r.id} className="border-b border-zinc-200 dark:border-zinc-800">
                  <td className="p-2">
                    {r.first_name} {r.last_name ?? ""}
                  </td>
                  <td className="p-2">{r.mobile}</td>
                  <td className="p-2">{r.has_defibrillator ? "כן" : "לא"}</td>
                  <td className="p-2">{r.has_lora ? "כן" : "לא"}</td>
                  <td className="p-2">{r.lora_id ?? "-"}</td>
                  <td className="p-2">
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="text-red-600 hover:underline dark:text-red-400"
                    >
                      מחיקה
                    </button>
                  </td>
                </tr>
              ))}
              {registrations.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-zinc-500">
                    אין נרשמים עדיין
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">רדיוס הסימולטור (מטרים)</h2>
        <form onSubmit={handleRadiusSave} className="flex items-center gap-3">
          <input
            type="number"
            min="1"
            value={radiusMeters}
            onChange={(e) => setRadiusMeters(e.target.value)}
            className="w-32 rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
          <button
            type="submit"
            className="rounded bg-zinc-900 px-4 py-2 text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            שמירה
          </button>
          {radiusStatus && <span className="text-sm text-zinc-500">{radiusStatus}</span>}
        </form>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">טקסט הסבר בעמוד הבית</h2>
        <form onSubmit={handleIntroSave} className="flex flex-col gap-3">
          <textarea
            rows={5}
            value={introText}
            onChange={(e) => setIntroText(e.target.value)}
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="rounded bg-zinc-900 px-4 py-2 text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              שמירה
            </button>
            {introStatus && <span className="text-sm text-zinc-500">{introStatus}</span>}
          </div>
        </form>
      </section>
    </main>
  );
}
