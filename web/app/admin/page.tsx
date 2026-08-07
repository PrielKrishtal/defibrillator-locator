"use client";

import { useState, useEffect, useCallback, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/Button";
import type { LoraPurchaseLink } from "@/lib/site-content";

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

// Matches what GET /api/devices already returns - the ~50 seeded fleet
// devices from Phase 2, unfiltered. Read-only here: this dashboard section
// is for visibility into the simulated fleet, not editing it.
type Device = {
  deviceId: string;
  hasLora: boolean;
  batteryLevel: number;
  lastSeen: string;
};

type SaveStatus = "idle" | "saving" | "done" | "error";

// Placeholder shape while the real 3 links are still loading - never
// rendered as saved data, just keeps the form's 3 rows stable pre-fetch.
const EMPTY_LORA_LINKS: LoraPurchaseLink[] = [
  { label: "", url: "" },
  { label: "", url: "" },
  { label: "", url: "" },
];

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
  const [devices, setDevices] = useState<Device[]>([]);
  const [radiusMeters, setRadiusMeters] = useState("");
  const [radiusStatus, setRadiusStatus] = useState<SaveStatus>("idle");
  const [introText, setIntroText] = useState("");
  const [introStatus, setIntroStatus] = useState<SaveStatus>("idle");
  const [whyVolunteerText, setWhyVolunteerText] = useState("");
  const [whyVolunteerStatus, setWhyVolunteerStatus] = useState<SaveStatus>("idle");
  const [loraLinks, setLoraLinks] = useState<LoraPurchaseLink[]>(EMPTY_LORA_LINKS);
  const [loraLinksStatus, setLoraLinksStatus] = useState<SaveStatus>("idle");
  const [loraLinksError, setLoraLinksError] = useState("");

  // Runs whenever isLoading or accessToken changes. Redirects to the login
  // page once the silent-refresh attempt has finished and no session was
  // restored. Kept here, not in the layout, so it doesn't also guard (and
  // loop) /admin/login.
  useEffect(() => {
    if (!isLoading && !accessToken) {
      router.replace("/admin/login");
    }
  }, [isLoading, accessToken, router]);

  // Takes no arguments. Fetches every registration row and stores it in
  // state. authFetch is a real dependency, not suppressed: it's a fresh
  // closure per render holding the current token.
  const loadRegistrations = useCallback(async () => {
    const res = await authFetch("/api/registrations");
    if (res.ok) {
      const body = await res.json();
      setRegistrations(body.registrations);
    }
  }, [authFetch]);

  // Runs whenever accessToken or loadRegistrations changes. Loads every
  // piece of dashboard data in one pass once logged in: registrations,
  // simulator radius, both marketing-copy fields, and the device list.
  useEffect(() => {
    if (!accessToken) return;

    // Named inner function so every setState happens after an awaited
    // fetch, not as the effect's own first synchronous action.
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
      const loraLinksRes = await fetch("/api/site-content/lora_purchase_links");
      const loraLinksBody = await loraLinksRes.json();
      try {
        setLoraLinks(JSON.parse(loraLinksBody.value));
      } catch {
        setLoraLinks(EMPTY_LORA_LINKS);
      }
      // WHY plain fetch, not authFetch: GET /api/devices is public (the
      // incident map already reads it with no login), so this is just
      // reusing existing data, not a new admin-only endpoint.
      const devicesRes = await fetch("/api/devices");
      const devicesBody = await devicesRes.json();
      setDevices(devicesBody.devices ?? []);
    }
    loadDashboardData();
  }, [accessToken, loadRegistrations]);

  // Takes a registration id, deletes that row via the admin DELETE
  // endpoint, and reloads the registrations list on success.
  async function handleDelete(id: number) {
    const res = await authFetch(`/api/registrations/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      loadRegistrations();
    }
  }

  // Takes the form submit event and saves the entered radius value as the
  // new simulator radius via the admin PATCH endpoint.
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

  // Takes the form submit event and saves the edited homepage intro text
  // via the admin PATCH endpoint.
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

  // Takes the form submit event and saves the edited "why volunteer" copy
  // via the admin PATCH endpoint.
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

  // Takes the form submit event and saves the edited LoRa purchase links
  // via the admin PATCH endpoint. Shows the server's specific validation
  // error on failure instead of a generic message, since the endpoint
  // rejects bad input rather than silently fixing it.
  async function handleLoraLinksSave(e: FormEvent) {
    e.preventDefault();
    setLoraLinksStatus("saving");
    setLoraLinksError("");
    const res = await authFetch("/api/site-content/lora_purchase_links", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: JSON.stringify(loraLinks) }),
    });
    if (res.ok) {
      setLoraLinksStatus("done");
    } else {
      const body = await res.json().catch(() => ({}));
      setLoraLinksError(body.error || "שגיאה בשמירה");
      setLoraLinksStatus("error");
    }
  }

  // Takes an index into loraLinks and a partial update, and applies it to
  // just that one link's label/url without touching the other two.
  function updateLoraLink(index: number, patch: Partial<LoraPurchaseLink>) {
    setLoraLinks((prev) =>
      prev.map((link, i) => (i === index ? { ...link, ...patch } : link))
    );
  }

  // Takes no arguments. Revokes the refresh token via the auth context's
  // logout, then redirects to the login page.
  async function handleLogout() {
    await logout();
    router.push("/admin/login");
  }

  // isLoading covers the silent-refresh attempt; !accessToken covers the
  // gap before the redirect effect fires - both show a neutral loading state.
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

      <section className="flex flex-col gap-4 rounded-xl border border-line bg-paper p-6 shadow-sm">
        <h2 className="font-display text-lg font-medium">
          מכשירי השדה המדומים ({devices.length})
        </h2>
        {/* Fixed height + own scrollbar, unlike the registrations table
            above: 50 seeded devices would otherwise push the page down.
            Sticky header keeps labels visible while scrolling. */}
        <div className="max-h-96 overflow-x-auto overflow-y-auto">
          <table className="w-full min-w-100 text-sm">
            <thead>
              <tr className="sticky top-0 border-b border-line bg-paper text-right">
                <th className="p-2 font-medium text-ink/70">מזהה מכשיר</th>
                <th className="p-2 font-medium text-ink/70">LoRa</th>
                <th className="p-2 font-medium text-ink/70">סוללה</th>
                <th className="p-2 font-medium text-ink/70">נראה לאחרונה</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((d) => (
                <tr key={d.deviceId} className="border-b border-line/50">
                  <td className="p-2 font-mono text-ink/70">{d.deviceId}</td>
                  <td className="p-2">
                    <YesNo value={d.hasLora} />
                  </td>
                  <td className="p-2">
                    <BatteryBadge level={d.batteryLevel} />
                  </td>
                  <td className="p-2 font-mono text-ink/70">
                    {formatLastSeen(d.lastSeen)}
                  </td>
                </tr>
              ))}
              {devices.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-ink/50">
                    אין מכשירים
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

      <section className="flex flex-col gap-3 rounded-xl border border-line bg-paper p-6 shadow-sm">
        <h2 className="font-display text-lg font-medium">
          קישורי רכישת מכשירי LoRa
        </h2>
        <form onSubmit={handleLoraLinksSave} className="flex flex-col gap-4">
          {loraLinks.map((link, i) => (
            <div
              key={i}
              className="flex flex-col gap-2 rounded-lg border border-line/60 p-3"
            >
              <label className="flex flex-col gap-1">
                <span className="text-sm text-ink/70">כותרת</span>
                <input
                  value={link.label}
                  onChange={(e) => updateLoraLink(i, { label: e.target.value })}
                  className={INPUT_CLASSES}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm text-ink/70">קישור</span>
                <input
                  value={link.url}
                  onChange={(e) => updateLoraLink(i, { url: e.target.value })}
                  className={`${INPUT_CLASSES} font-mono`}
                />
              </label>
            </div>
          ))}
          {loraLinksError && (
            <p className="text-sm text-flare">{loraLinksError}</p>
          )}
          <SaveButton status={loraLinksStatus} />
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

// WHY the 20% cutoff specifically: it matches the assignment's own
// maintenance-alert wording for when a device should trigger a low-battery
// notice (see brief §7's bonus section) - not an arbitrary UI threshold.
function BatteryBadge({ level }: { level: number }) {
  const colorClass =
    level >= 50
      ? "bg-signal/15 text-signal"
      : level >= 20
        ? "bg-beacon/15 text-beacon"
        : "bg-flare/15 text-flare";
  return (
    <span
      className={`rounded-full px-2 py-0.5 font-mono text-xs font-medium ${colorClass}`}
    >
      {level}%
    </span>
  );
}

// Takes an ISO date string and returns it formatted as "DD/MM/YYYY HH:MM".
function formatLastSeen(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${d.getFullYear()} ${hours}:${minutes}`;
}
