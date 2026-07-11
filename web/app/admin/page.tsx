"use client";

import { useState, useEffect, useCallback, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/Button";

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

type SaveStatus = "idle" | "saving" | "done" | "error";

const INPUT_CLASSES =
  "rounded-lg border border-line bg-paper px-3 py-2 text-ink transition-colors focus:border-signal focus:outline-none focus:ring-2 focus:ring-signal/20";

// One shared "save button + status message" bit of markup, since the radius
// and intro-text forms both need exactly this after their own field.
function SaveButton({ status }: { status: SaveStatus }) {
  return (
    <div className="flex items-center gap-3">
      <Button type="submit" disabled={status === "saving"}>
        שמירה
      </Button>
      {status === "done" && <span className="text-sm text-signal">נשמר</span>}
      {status === "error" && (
        <span className="text-sm text-flare">שגיאה בשמירה</span>
      )}
    </div>
  );
}

export default function AdminDashboardPage() {
  const { accessToken, isLoading, logout, authFetch } = useAuth();
  const router = useRouter();

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [radiusMeters, setRadiusMeters] = useState("");
  const [radiusStatus, setRadiusStatus] = useState<SaveStatus>("idle");
  const [introText, setIntroText] = useState("");
  const [introStatus, setIntroStatus] = useState<SaveStatus>("idle");
  const [whyVolunteerText, setWhyVolunteerText] = useState("");
  const [whyVolunteerStatus, setWhyVolunteerStatus] = useState<SaveStatus>("idle");

  // WHY redirect here, not in app/admin/layout.tsx: the layout also wraps
  // /admin/login, and guarding there would redirect the login page to
  // itself in a loop. Guarding only the dashboard page avoids that.
  useEffect(() => {
    if (!isLoading && !accessToken) {
      router.replace("/admin/login");
    }
  }, [isLoading, accessToken, router]);

  // WHY authFetch is a real dependency here, not suppressed: authFetch is a
  // fresh closure every AuthProvider render, and it reads the current
  // accessToken from that closure. An empty dependency array would freeze
  // this callback to whichever authFetch existed at the very first render -
  // before login even resolves - so every request it makes would carry no
  // Authorization header at all and silently 401 forever.
  const loadRegistrations = useCallback(async () => {
    const res = await authFetch("/api/registrations");
    if (res.ok) {
      const body = await res.json();
      setRegistrations(body.registrations);
    }
  }, [authFetch]);

  useEffect(() => {
    if (!accessToken) return;

    // WHY a named inner function: calling setState as the effect's own
    // first synchronous action (as `loadRegistrations()` directly would be)
    // is flagged by React's rules. Wrapping the whole load sequence means
    // every setState call happens after an awaited fetch, the correct async
    // pattern.
    async function loadDashboardData() {
      await loadRegistrations();
      const radiusRes = await fetch("/api/settings/radius");
      const radiusBody = await radiusRes.json();
      setRadiusMeters(String(radiusBody.radiusMeters));
      const introRes = await fetch("/api/site-content/homepage_intro");
      const introBody = await introRes.json();
      setIntroText(introBody.value);
      const whyVolunteerRes = await fetch("/api/site-content/why_volunteer_copy");
      const whyVolunteerBody = await whyVolunteerRes.json();
      setWhyVolunteerText(whyVolunteerBody.value);
    }
    loadDashboardData();
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
    setRadiusStatus("saving");
    const res = await authFetch("/api/settings/radius", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ radiusMeters: Number(radiusMeters) }),
    });
    setRadiusStatus(res.ok ? "done" : "error");
  }

  async function handleIntroSave(e: FormEvent) {
    e.preventDefault();
    setIntroStatus("saving");
    const res = await authFetch("/api/site-content/homepage_intro", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: introText }),
    });
    setIntroStatus(res.ok ? "done" : "error");
  }

  async function handleWhyVolunteerSave(e: FormEvent) {
    e.preventDefault();
    setWhyVolunteerStatus("saving");
    const res = await authFetch("/api/site-content/why_volunteer_copy", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: whyVolunteerText }),
    });
    setWhyVolunteerStatus(res.ok ? "done" : "error");
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
        <p className="text-ink/50">טוען...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-4xl flex-1 flex-col gap-8 p-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-medium">לוח בקרה למנהל</h1>
        <Button variant="outline" onClick={handleLogout} className="text-sm">
          התנתקות
        </Button>
      </div>

      <section className="flex flex-col gap-4 rounded-xl border border-line bg-paper p-6 shadow-sm">
        <h2 className="font-display text-lg font-medium">
          נרשמים ({registrations.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-150 text-sm">
            <thead>
              <tr className="border-b border-line text-right">
                <th className="p-2 font-medium text-ink/70">שם</th>
                <th className="p-2 font-medium text-ink/70">טלפון</th>
                <th className="p-2 font-medium text-ink/70">דפיברילטור</th>
                <th className="p-2 font-medium text-ink/70">LoRa</th>
                <th className="p-2 font-medium text-ink/70">מזהה LoRa</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((r) => (
                <tr key={r.id} className="border-b border-line/50">
                  <td className="p-2">
                    {r.first_name} {r.last_name ?? ""}
                  </td>
                  <td className="p-2 font-mono">{r.mobile}</td>
                  <td className="p-2">
                    <YesNo value={r.has_defibrillator} />
                  </td>
                  <td className="p-2">
                    <YesNo value={r.has_lora} />
                  </td>
                  <td className="p-2 font-mono text-ink/70">
                    {r.lora_id ?? "-"}
                  </td>
                  <td className="p-2">
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="text-flare hover:underline"
                    >
                      מחיקה
                    </button>
                  </td>
                </tr>
              ))}
              {registrations.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-ink/50">
                    אין נרשמים עדיין
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-line bg-paper p-6 shadow-sm">
        <h2 className="font-display text-lg font-medium">
          רדיוס הסימולטור (מטרים)
        </h2>
        <form onSubmit={handleRadiusSave} className="flex items-center gap-3">
          <input
            type="number"
            min="1"
            value={radiusMeters}
            onChange={(e) => setRadiusMeters(e.target.value)}
            className={`w-32 font-mono ${INPUT_CLASSES}`}
          />
          <SaveButton status={radiusStatus} />
        </form>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-line bg-paper p-6 shadow-sm">
        <h2 className="font-display text-lg font-medium">
          טקסט הסבר בעמוד הבית
        </h2>
        <form onSubmit={handleIntroSave} className="flex flex-col gap-3">
          <textarea
            rows={5}
            value={introText}
            onChange={(e) => setIntroText(e.target.value)}
            className={INPUT_CLASSES}
          />
          <SaveButton status={introStatus} />
        </form>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-line bg-paper p-6 shadow-sm">
        <h2 className="font-display text-lg font-medium">
          טקסט - למה להתנדב
        </h2>
        <form onSubmit={handleWhyVolunteerSave} className="flex flex-col gap-3">
          <textarea
            rows={5}
            value={whyVolunteerText}
            onChange={(e) => setWhyVolunteerText(e.target.value)}
            className={INPUT_CLASSES}
          />
          <SaveButton status={whyVolunteerStatus} />
        </form>
      </section>
    </main>
  );
}

// כן in the system color, לא muted - the same "signal = active/true" language
// as the map's device markers, rather than plain identical-weight text.
function YesNo({ value }: { value: boolean }) {
  return value ? (
    <span className="font-medium text-signal">כן</span>
  ) : (
    <span className="text-ink/40">לא</span>
  );
}
