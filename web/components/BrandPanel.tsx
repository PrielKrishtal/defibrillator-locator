import { SignalIcon, RegisterIcon, IncidentIcon } from "./icons";

// The visual half of the split-screen auth pages (register, admin login).
// A narrow centered card alone left most of a wide screen empty; this fills
// that space with real on-brand content instead of a stock photo - there
// are no actual product photos/logo assets for this project, so the same
// signal-ring motif used on the map and homepage does the same job a hero
// image would, for free. Hidden below the lg breakpoint - on a narrow
// screen there's no spare width for it to fill in the first place.
export function BrandPanel() {
  return (
    <div className="relative hidden flex-1 flex-col items-center justify-center gap-10 overflow-hidden bg-signal p-12 text-paper lg:flex">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div className="h-72 w-72 rounded-full border border-paper/10" />
        <div className="absolute h-100 w-100 rounded-full border border-paper/10" />
        <div className="absolute h-140 w-140 rounded-full border border-paper/5" />
      </div>

      <div className="relative flex flex-col items-center gap-3 text-center">
        <h2 className="font-display text-3xl font-medium">
          דפיברילטורים ניידים
        </h2>
        <p className="max-w-xs text-paper/80">
          רשת מתנדבים המשלבת טכנולוגיית LoRa לאיתור מהיר של דפיברילטורים
          בשטח.
        </p>
      </div>

      <ul className="relative flex flex-col gap-4 text-sm">
        <li className="flex items-center gap-3">
          <SignalIcon className="h-6 w-6 shrink-0" />
          כיסוי מיקום גם ללא רשת סלולרית
        </li>
        <li className="flex items-center gap-3">
          <RegisterIcon className="h-6 w-6 shrink-0" />
          הרשמה תוך פחות מדקה
        </li>
        <li className="flex items-center gap-3">
          <IncidentIcon className="h-6 w-6 shrink-0" />
          איתור מתנדבים קרובים בזמן אמת
        </li>
      </ul>
    </div>
  );
}
