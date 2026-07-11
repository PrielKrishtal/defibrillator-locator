import Link from "next/link";
import {
  getSiteContent,
  HOMEPAGE_INTRO_KEY,
  DEFAULT_HOMEPAGE_INTRO,
} from "@/lib/site-content";
import { ButtonLink } from "@/components/Button";
import {
  SignalIcon,
  RegisterIcon,
  IncidentIcon,
  PinIcon,
  SmsIcon,
} from "@/components/icons";

// A single icon+label node inside a flow-path card (no border of its own -
// the card around it already has one, so two nested borders don't compete).
function FlowMiniNode({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 text-center">
      {icon}
      <span className="text-xs text-ink/70">{label}</span>
    </div>
  );
}

// A short line + a small triangle, not just a lone arrow glyph - a bare "←"
// character read as a stray typo at this size; pairing it with a connector
// line makes it read as an actual flowchart connector.
function FlowArrow() {
  return (
    <div className="flex items-center gap-1 text-beacon" aria-hidden>
      <span className="text-xs">◀</span>
      <span className="h-px w-5 bg-beacon" />
    </div>
  );
}

// One of the two "how the signal gets out" options - each groups two
// connected steps inside a single bordered card.
function FlowPathCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-xl border border-line bg-paper p-5 shadow-sm">
      {children}
    </div>
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
      <div className="h-64 w-64 rounded-full border border-signal/10" />
      <div className="absolute h-96 w-96 rounded-full border border-signal/10" />
      <div className="absolute h-150 w-150 rounded-full border border-signal/5" />
    </div>
  );
}

// One of the three "what you can do here" cards below the hero. A plain
// info card when href is omitted (the LoRa explainer), a card with a call
// to action when it links somewhere (register, incident).
function ConceptCard({
  icon,
  title,
  description,
  href,
  linkLabel,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-line bg-paper p-6 text-center shadow-sm">
      {icon}
      <h3 className="font-display text-lg font-medium">{title}</h3>
      <p className="text-sm text-ink/70">{description}</p>
      {href && linkLabel && (
        <Link
          href={href}
          className="mt-1 text-sm font-medium text-signal hover:underline"
        >
          {linkLabel} ←
        </Link>
      )}
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
    <main className="mx-auto flex max-w-4xl flex-1 flex-col gap-16 p-8">
      <section className="relative flex flex-col items-center gap-5 overflow-hidden py-12 text-center">
        <SignalRings />
        <span className="relative text-sm font-medium tracking-wide text-signal">
          סימולציית מערכת התרעה
        </span>
        <h1 className="relative font-display text-4xl font-medium sm:text-5xl">
          מערכת דפיברילטורים ניידים
        </h1>
        <p className="relative max-w-xl whitespace-pre-line text-ink/70">
          {intro}
        </p>
        <div className="relative mt-2 flex flex-wrap items-center justify-center gap-3">
          <ButtonLink href="/register">הרשמה כמתנדב</ButtonLink>
          <ButtonLink href="/incident" variant="outline">
            צפייה בדיווח מצוקה
          </ButtonLink>
        </div>
      </section>

      {/* WHY this section sits directly after the hero, not lower down: the
          assignment requires the LoRa/distress-flow diagram on the homepage
          specifically (not just somewhere on the site), so it stays close
          to the top rather than trailing after the concept cards below. */}
      <section className="flex flex-col items-center gap-6">
        <h2 className="text-center font-display text-2xl font-medium">
          איך קריאת מצוקה מגיעה למתנדב
        </h2>

        <div className="flex flex-col items-center gap-3">
          <div className="flex flex-col items-center gap-2 rounded-xl border border-line bg-paper px-6 py-4 shadow-sm">
            <IncidentIcon className="h-8 w-8" />
            <span className="font-medium">קריאת מצוקה (דום לב)</span>
          </div>

          <div className="flex flex-col items-center text-beacon" aria-hidden>
            <span className="h-6 w-px bg-beacon" />
            <span className="text-xs">▾</span>
          </div>

          <div className="grid w-full max-w-2xl grid-cols-1 items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
            <FlowPathCard>
              <FlowMiniNode
                icon={<SignalIcon className="h-7 w-7 text-signal" />}
                label="LoRa / Meshtastic"
              />
              <FlowArrow />
              <FlowMiniNode
                icon={<PinIcon className="h-7 w-7 text-signal" />}
                label="נקודת מיקום GPS"
              />
            </FlowPathCard>

            <span className="justify-self-center rounded-full border border-line bg-paper px-3 py-1 text-xs font-medium text-ink/60">
              או
            </span>

            <FlowPathCard>
              <FlowMiniNode
                icon={<SmsIcon className="h-7 w-7 text-beacon" />}
                label="הודעת SMS"
              />
              <FlowArrow />
              <FlowMiniNode
                icon={<PinIcon className="h-7 w-7 text-beacon" />}
                label="טלפון + מיקום"
              />
            </FlowPathCard>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ConceptCard
          icon={<SignalIcon className="h-10 w-10 text-signal" />}
          title="מה זה LoRa?"
          description="טכנולוגיית רדיו לטווח ארוך וצריכת חשמל נמוכה, שמאפשרת שידור מיקום גם באזורים ללא כיסוי סלולרי."
        />
        <ConceptCard
          icon={<RegisterIcon className="h-10 w-10 text-signal" />}
          title="הרשמה למערכת"
          description="בעלי דפיברילטור נייד או מכשיר LoRa יכולים להירשם בכמה שניות ולהצטרף לרשת המתנדבים."
          href="/register"
          linkLabel="להרשמה"
        />
        <ConceptCard
          icon={<IncidentIcon className="h-10 w-10" />}
          title="דיווח על מצוקה"
          description="צפו כיצד המערכת מאתרת מתנדבים קרובים ומציגה מסלול רכיבה למכשיר הזמין ביותר."
          href="/incident"
          linkLabel="לצפייה בסימולציה"
        />
      </section>
    </main>
  );
}
