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
