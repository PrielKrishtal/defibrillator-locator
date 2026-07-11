import {
  getSiteContent,
  HOMEPAGE_INTRO_KEY,
  DEFAULT_HOMEPAGE_INTRO,
} from "@/lib/site-content";

// Flow-diagram step, drawn as a bordered card. Kept as one small component
// instead of repeating the same className string four times below.
function FlowStep({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-line bg-paper px-4 py-3 text-center text-sm shadow-sm">
      {label}
    </div>
  );
}

// Arrow between two flow-diagram steps, in the beacon color - the same
// color as the map's route line and LoRa ring, since all three represent
// "a signal moving from one point to another." WHY "←" not "→": the page
// is RTL, so reading order runs right-to-left - the arrow should point the
// same way the boxes read, or the diagram looks backwards despite being
// logically correct.
function FlowArrow() {
  return (
    <span className="text-xl text-beacon" aria-hidden>
      ←
    </span>
  );
}

// Faint concentric rings behind the hero heading - the same signal-range
// motif as the map's geofence circle and pulsing incident marker, carried
// quietly onto the page that recruits volunteers into that same system.
// One signature element reused site-wide beats a different treatment per
// page. Decorative only: aria-hidden, and sized so it never crowds the text.
function SignalRings() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
    >
      <div className="h-56 w-56 rounded-full border border-signal/10" />
      <div className="absolute h-80 w-80 rounded-full border border-signal/10" />
      <div className="absolute h-112 w-md rounded-full border border-signal/5" />
    </div>
  );
}

// This is a Server Component (no "use client"): it reads straight from
// Mongo at request time instead of round-tripping through /api/site-content
// itself. The admin dashboard is what calls that API route to write new
// content - this page only ever reads.
export default async function Home() {
  const intro = await getSiteContent(HOMEPAGE_INTRO_KEY, DEFAULT_HOMEPAGE_INTRO);

  return (
    <main className="mx-auto flex max-w-3xl flex-1 flex-col gap-12 p-8">
      <section className="relative flex flex-col items-center gap-4 overflow-hidden py-8 text-center">
        <SignalRings />
        <h1 className="relative font-display text-4xl font-medium">
          מערכת דפיברילטורים ניידים
        </h1>
        <p className="relative max-w-xl whitespace-pre-line text-ink/70">
          {intro}
        </p>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-center font-display text-xl font-medium">
          איך קריאת מצוקה מגיעה למתנדב
        </h2>

        <div className="flex flex-col items-center gap-4">
          <FlowStep label="קריאת מצוקה (דום לב)" />

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <FlowStep label="רשת LoRa / Meshtastic" />
              <FlowArrow />
              <FlowStep label="נקודת מיקום GPS" />
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-ink/50">
              <span>או</span>
            </div>
            <div className="flex items-center gap-3">
              <FlowStep label="הודעת SMS" />
              <FlowArrow />
              <FlowStep label="מספר טלפון + מיקום בעל המכשיר" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
