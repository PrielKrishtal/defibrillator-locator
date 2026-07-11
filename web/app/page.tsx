import {
  getSiteContent,
  HOMEPAGE_INTRO_KEY,
  DEFAULT_HOMEPAGE_INTRO,
} from "@/lib/site-content";

// Flow-diagram step, drawn as a bordered box. Kept as one small component
// instead of repeating the same className string four times below.
function FlowStep({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-zinc-300 bg-white px-4 py-3 text-center text-sm shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      {label}
    </div>
  );
}

// Arrow between two flow-diagram steps. WHY "←" not "→": the page is RTL,
// so reading order runs right-to-left - the arrow should point the same way
// the boxes read, or the diagram looks backwards despite being logically
// correct.
function FlowArrow() {
  return <span className="text-xl text-zinc-400" aria-hidden>←</span>;
}

// This is a Server Component (no "use client"): it reads straight from
// Mongo at request time instead of round-tripping through /api/site-content
// itself. The admin dashboard is what calls that API route to write new
// content - this page only ever reads.
export default async function Home() {
  const intro = await getSiteContent(HOMEPAGE_INTRO_KEY, DEFAULT_HOMEPAGE_INTRO);

  return (
    <main className="mx-auto flex max-w-3xl flex-1 flex-col gap-10 p-8">
      <section className="flex flex-col gap-4 text-center">
        <h1 className="text-3xl font-semibold">מערכת דפיברילטורים ניידים</h1>
        <p className="whitespace-pre-line text-zinc-600 dark:text-zinc-400">
          {intro}
        </p>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-center text-lg font-medium">
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
            <div className="flex items-center justify-center gap-2 text-sm text-zinc-500">
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
