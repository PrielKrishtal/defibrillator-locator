"use client";

import { useState, FormEvent } from "react";

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
        <h1 className="text-2xl font-semibold">ההרשמה נקלטה בהצלחה</h1>
        <p className="text-zinc-600 dark:text-zinc-400">תודה שהצטרפתם למערכת.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold">הרשמה למערכת</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm">שם פרטי *</span>
          <input
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm">שם משפחה</span>
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm">מספר טלפון נייד *</span>
          <input
            required
            type="tel"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={hasDefibrillator}
            onChange={(e) => setHasDefibrillator(e.target.checked)}
          />
          <span className="text-sm">יש לי דפיברילטור נייד</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={hasLora}
            onChange={(e) => setHasLora(e.target.checked)}
          />
          <span className="text-sm">יש לי מכשיר LoRa</span>
        </label>

        {hasLora && (
          <label className="flex flex-col gap-1">
            <span className="text-sm">מזהה LoRa</span>
            <input
              value={loraId}
              onChange={(e) => setLoraId(e.target.value)}
              className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
        )}

        {status === "error" && (
          <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
        )}

        <button
          type="submit"
          disabled={status === "submitting"}
          className="rounded bg-zinc-900 px-4 py-2 text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {status === "submitting" ? "שולח..." : "הרשמה"}
        </button>
      </form>
    </main>
  );
}
