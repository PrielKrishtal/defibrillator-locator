"use client";

import { useState, FormEvent } from "react";
import { Button } from "@/components/Button";
import { RegisterIcon } from "@/components/icons";
import { BrandPanel } from "@/components/BrandPanel";

// One shared input style instead of repeating the same long className four
// times - not a full field component, since these inputs don't share any
// behavior, only appearance.
const INPUT_CLASSES =
  "rounded-lg border border-line bg-paper px-3 py-2 text-ink transition-colors focus:border-signal focus:outline-none focus:ring-2 focus:ring-signal/20";

// Shared shell for the form and success screen: full-width split with the
// brand panel, not a narrow centered card. Kept local - only this page needs it.
function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 flex-col lg:grid lg:grid-cols-2">
      <div className="flex flex-1 items-center justify-center p-8">
        {children}
      </div>
      <BrandPanel />
    </main>
  );
}

// A client component, not a Server Action: needs inline validation/error
// state without a reload, and §6 names a specific API route to call.
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

  // Takes the form submit event. Client-side-checks the eligibility rule
  // for instant feedback, then POSTs the form fields to /api/registrations
  // and shows the success screen or an error message based on the response.
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

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
      <AuthLayout>
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-signal">
            <span className="text-2xl text-signal" aria-hidden>
              ✓
            </span>
          </div>
          <h1 className="font-display text-2xl font-medium">
            ההרשמה נקלטה בהצלחה
          </h1>
          <p className="text-ink/70">תודה שהצטרפתם למערכת.</p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="flex w-full max-w-md flex-col gap-6 rounded-xl border border-line bg-paper p-8 shadow-sm sm:p-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <RegisterIcon className="h-10 w-10 text-signal" />
          <h1 className="font-display text-3xl font-medium">הרשמה למערכת</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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

          <div className="flex flex-col gap-3 rounded-lg border border-line/60 p-4">
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
              <label className="flex flex-col gap-1 pt-1">
                <span className="text-sm text-ink/70">מזהה LoRa</span>
                <input
                  value={loraId}
                  onChange={(e) => setLoraId(e.target.value)}
                  className={`${INPUT_CLASSES} font-mono`}
                />
              </label>
            )}
          </div>

          {status === "error" && (
            <p className="text-sm text-flare">{errorMessage}</p>
          )}

          <Button type="submit" disabled={status === "submitting"}>
            {status === "submitting" ? "שולח..." : "הרשמה"}
          </Button>
        </form>
      </div>
    </AuthLayout>
  );
}
