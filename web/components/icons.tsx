// A small icon set built entirely from the site's own visual language
// (concentric rings, simple strokes, the map's own pulse animation) instead
// of pulling in an icon library - three icons don't justify a new
// dependency, and building them this way keeps them visually part of the
// same system as the map rather than a mismatched, generic icon set.

export function SignalIcon({ className }: { className?: string }) {
  // Concentric rings + center dot: LoRa/radio broadcast, the same shape as
  // the map's geofence circle.
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden>
      <circle cx="24" cy="24" r="4" fill="currentColor" />
      <circle cx="24" cy="24" r="13" stroke="currentColor" strokeWidth="2" opacity="0.5" />
      <circle cx="24" cy="24" r="21" stroke="currentColor" strokeWidth="2" opacity="0.25" />
    </svg>
  );
}

export function RegisterIcon({ className }: { className?: string }) {
  // A ring with a checkmark: joining the registry.
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden>
      <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2" opacity="0.3" />
      <path
        d="M15 24.5l6 6 12-13"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// The exact same pulse the incident marker uses on the map (see
// .incident-pulse in globals.css) - reused here, not just visually similar,
// so the connection between "this icon" and "that marker" is literal.
export function IncidentIcon({ className }: { className?: string }) {
  return (
    <span
      className={`relative flex items-center justify-center ${className ?? ""}`}
      aria-hidden
    >
      <span className="incident-pulse absolute h-3 w-3 rounded-full bg-flare" />
      <span className="relative h-3 w-3 rounded-full bg-flare" />
    </span>
  );
}

export function PinIcon({ className }: { className?: string }) {
  // A map-pin teardrop: the GPS point a distress call resolves to.
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden>
      <path
        d="M24 6c-7.7 0-14 6.3-14 14 0 10 14 22 14 22s14-12 14-22c0-7.7-6.3-14-14-14z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="24" cy="20" r="5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function SmsIcon({ className }: { className?: string }) {
  // A message bubble: the SMS fallback path when there's no LoRa coverage.
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden>
      <path
        d="M8 12a4 4 0 0 1 4-4h24a4 4 0 0 1 4 4v16a4 4 0 0 1-4 4H19l-8 7v-7h-3a4 4 0 0 1-4-4V12z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
