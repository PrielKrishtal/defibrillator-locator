"use client";

import { useState, FormEvent } from "react";

// One shared input style instead of repeating the same long className four
// times - not a full field component, since these inputs don't share any
// behavior, only appearance.
const INPUT_CLASSES =
  "rounded-lg border border-line bg-paper px-3 py-2 text-ink transition-colors focus:border-signal focus:outline-none focus:ring-2 focus:ring-signal/20";

// The registration form is a client component (not a Server Action) because
// it needs to show inline validation and a success/error message without a
// full page reload, and because §6 names this as calling a specific API
// route ("POST /api/registrations") rather than leaving the mechanism open.
export default function RegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobile, setMobile] = useState("");
  const [hasDefibrillator, setHasDefibrillator] = useState(true);
  const [hasLora, setHasLora] = useState(false);
  const [loraId, setLoraId] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    // WHY check this before even calling the API: it mirrors the server's
    // own eligibility rule, so the user sees the problem immediately
    // instead of waiting for a round trip to find out.
    if (!hasDefibrillator && !hasLora) {
      setStatus("error");
      setErrorMessage("יש לסמן דפיברילטור, מכשיר LoRa, או שניהם");
      return;
    }

    setStatus("submitting");
    const res = await fetch("/api/registrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName,
        lastName,
        mobile,
        hasDefibrillator,
        hasLora,
        loraId,
      }),
    });

    if (res.ok) {
      setStatus("done");
      return;
    }
    const body = await res.json().catch(() => ({}));
    setStatus("error");
    setErrorMessage(body.error || "ההרשמה נכשלה, נסו שוב");
  }

  if (status === "done") {
    return (
      <main className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-signal">
          <span className="text-2xl text-signal" aria-hidden>
            ✓
          </span>
        </div>
        <h1 className="font-display text-2xl font-medium">
          ההרשמה נקלטה בהצלחה
        </h1>
        <p className="text-ink/70">תודה שהצטרפתם למערכת.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col gap-6 p-8">
      <h1 className="font-display text-3xl font-medium">הרשמה למערכת</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-ink/70">שם פרטי *</span>
          <input
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className={INPUT_CLASSES}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-ink/70">שם משפחה</span>
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className={INPUT_CLASSES}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-ink/70">מספר טלפון נייד *</span>
          <input
            required
            type="tel"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            className={INPUT_CLASSES}
          />
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={hasDefibrillator}
            onChange={(e) => setHasDefibrillator(e.target.checked)}
            className="h-4 w-4 accent-signal"
          />
          <span className="text-sm">יש לי דפיברילטור נייד</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={hasLora}
            onChange={(e) => setHasLora(e.target.checked)}
            className="h-4 w-4 accent-signal"
          />
          <span className="text-sm">יש לי מכשיר LoRa</span>
        </label>

        {hasLora && (
          <label className="flex flex-col gap-1">
            <span className="text-sm text-ink/70">מזהה LoRa</span>
            <input
              value={loraId}
              onChange={(e) => setLoraId(e.target.value)}
              className={`${INPUT_CLASSES} font-mono`}
            />
          </label>
        )}

        {status === "error" && (
          <p className="text-sm text-flare">{errorMessage}</p>
        )}

        <button
          type="submit"
          disabled={status === "submitting"}
          className="rounded-lg bg-signal px-4 py-2 font-medium text-paper transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {status === "submitting" ? "שולח..." : "הרשמה"}
        </button>
      </form>
    </main>
  );
}
