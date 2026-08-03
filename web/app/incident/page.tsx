"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import type { MapDevice, AllDevice } from "@/components/IncidentMap";
import { MapLegend } from "@/components/MapLegend";
import { Button } from "@/components/Button";

// Leaflet is browser-only, so the map is loaded client-side with no SSR.
// The placeholder keeps the layout stable while the chunk loads.
const IncidentMap = dynamic(() => import("@/components/IncidentMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-125 w-full items-center justify-center rounded-lg border border-line bg-paper">
      טוען מפה...
    </div>
  ),
});

// Default distress point: central Tel Aviv, the same area the devices were
// seeded around, so the page shows something meaningful on first load before
// the user clicks anywhere.
const DEFAULT_INCIDENT = { lat: 32.0853, lng: 34.7818 };

// Describes what the orange line on the map currently represents, which
// drives the notice under the map.
type RouteStatus = "none" | "loading" | "cycling" | "fallback";

// WHY sqrt(random) for the radius, not a plain random one: a uniform random
// radius bunches points near the center (there's less area in an inner ring
// than an outer one) - the same fix db/seed-devices.ts uses, for the same
// reason, so the quick-simulate button lands points in the same kind of
// spread as the seeded devices themselves.
function randomPointNearDeviceCluster(): { lat: number; lng: number } {
  const maxRadiusMeters = 15000;
  const earthRadiusMeters = 6371000;
  const radius = maxRadiusMeters * Math.sqrt(Math.random());
  const angle = Math.random() * 2 * Math.PI;
  const dLat = (radius * Math.cos(angle)) / earthRadiusMeters;
  const dLng =
    (radius * Math.sin(angle)) /
    (earthRadiusMeters * Math.cos((DEFAULT_INCIDENT.lat * Math.PI) / 180));
  return {
    lat: DEFAULT_INCIDENT.lat + (dLat * 180) / Math.PI,
    lng: DEFAULT_INCIDENT.lng + (dLng * 180) / Math.PI,
  };
}

type GoldenWindowLevel = "green" | "amber" | "red";

// WHY exactly 4 and 10 minutes: these are the assignment's own opening-
// paragraph figures for how fast cardiac-arrest survival odds drop, not an
// arbitrary UI choice.
const GOLDEN_WINDOW_GREEN_MAX_SECONDS = 4 * 60;
const GOLDEN_WINDOW_AMBER_MAX_SECONDS = 10 * 60;

function goldenWindowLevel(totalSeconds: number): GoldenWindowLevel {
  if (totalSeconds < GOLDEN_WINDOW_GREEN_MAX_SECONDS) return "green";
  if (totalSeconds < GOLDEN_WINDOW_AMBER_MAX_SECONDS) return "amber";
  return "red";
}

// A lookup object, not a template literal like `text-${level}` - Tailwind's
// compiler only generates CSS for class names it can see written out as
// literal strings, and a dynamic template literal wouldn't be seen.
const GOLDEN_WINDOW_TEXT_CLASS: Record<GoldenWindowLevel, string> = {
  green: "text-signal",
  amber: "text-beacon",
  red: "text-flare",
};

function formatMinutesSeconds(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default function IncidentPage() {
  const [incident, setIncident] = useState(DEFAULT_INCIDENT);
  const [radiusMeters, setRadiusMeters] = useState(0);
  const [devicesInRange, setDevicesInRange] = useState<MapDevice[]>([]);
  const [allDevices, setAllDevices] = useState<AllDevice[]>([]);
  const [routePath, setRoutePath] = useState<[number, number][] | null>(null);
  const [routeStatus, setRouteStatus] = useState<RouteStatus>("none");
  const [cyclingDistance, setCyclingDistance] = useState<number | null>(null);
  const [cyclingDurationSeconds, setCyclingDurationSeconds] = useState<
    number | null
  >(null);

  // The golden-window clock: incidentSetAt resets to "now" every time a new
  // incident point is set (click or quick-simulate); now ticks once a
  // second so elapsedSeconds below stays live without re-fetching anything.
  const [incidentSetAt, setIncidentSetAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const elapsedSeconds = Math.floor((now - incidentSetAt) / 1000);

  // WHY reset the clock here, in the same event handler that sets the
  // incident, instead of an effect keyed on `incident`: Date.now() is an
  // impure read (React's rules forbid impure calls during render/effects
  // meant to stay pure), but a plain event handler has no such restriction -
  // it only ever runs in response to an actual click or button press.
  function setIncidentAndResetClock(lat: number, lng: number) {
    setIncident({ lat, lng });
    const timestamp = Date.now();
    setIncidentSetAt(timestamp);
    setNow(timestamp);
  }

  // The full device population only needs loading once - it isn't affected
  // by where the incident is, unlike the in-range subset below.
  useEffect(() => {
    fetch("/api/devices")
      .then((r) => r.json())
      .then((data) => setAllDevices(data.devices ?? []));
  }, []);

  useEffect(() => {
    // Guards against a race: if the user clicks a new incident point before
    // the previous fetch chain finishes, the stale one bails out instead of
    // overwriting fresh state.
    let cancelled = false;

    async function loadIncident() {
      const res = await fetch("/api/incident", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(incident),
      });
      if (!res.ok || cancelled) return;
      const data = await res.json();
      if (cancelled) return;

      setRadiusMeters(data.radiusMeters);
      setDevicesInRange(data.devices);

      // No one in range: nothing to route to.
      if (data.devices.length === 0) {
        setRoutePath(null);
        setRouteStatus("none");
        setCyclingDistance(null);
        setCyclingDurationSeconds(null);
        return;
      }

      // Draw the straight line to the nearest device immediately. This is
      // both the first thing the user sees and the fallback if OSRM fails -
      // the map is useful before any external routing call returns.
      const nearest = data.devices[0];
      setRoutePath([
        [incident.lat, incident.lng],
        [nearest.lat, nearest.lng],
      ]);
      setRouteStatus("loading");
      setCyclingDistance(null);
      setCyclingDurationSeconds(null);

      // Now try to upgrade that straight line to a real cycling route.
      try {
        const routeRes = await fetch(
          `/api/route?fromLat=${incident.lat}&fromLng=${incident.lng}` +
            `&toLat=${nearest.lat}&toLng=${nearest.lng}`
        );
        if (cancelled) return;
        if (!routeRes.ok) {
          // OSRM slow/down/no-route: keep the straight line, tell the user.
          setRouteStatus("fallback");
          return;
        }
        const routeData = await routeRes.json();
        if (cancelled) return;
        setRoutePath(routeData.path);
        setCyclingDistance(routeData.distanceMeters);
        setCyclingDurationSeconds(routeData.durationSeconds);
        setRouteStatus("cycling");
      } catch {
        if (!cancelled) setRouteStatus("fallback");
      }
    }

    loadIncident();
    return () => {
      cancelled = true;
    };
  }, [incident]);

  // Quick entry point for the demo: picks a random point in the same area
  // the devices were seeded around and sets it as the incident, exactly as
  // if the user had clicked that spot on the map - manual clicking still
  // works too, this is just an additional way in.
  function handleQuickSimulate() {
    const { lat, lng } = randomPointNearDeviceCluster();
    setIncidentAndResetClock(lat, lng);
  }

  return (
    <main className="mx-auto flex max-w-4xl flex-1 flex-col gap-4 p-8">
      <h1 className="font-display text-3xl font-medium">עמוד מצוקה</h1>
      <p className="text-sm text-ink/70">
        זהו סימולטור: לחצו בכל מקום על המפה, או על כפתור &quot;הדמיה
        מהירה&quot;, כדי לדמות מהיכן מגיעה קריאת מצוקה - המערכת תאתר מכשירים
        ברדיוס שהוגדר ותציג מסלול רכיבה למכשיר הקרוב ביותר.
      </p>
      <p className="text-sm text-ink/70">
        המיקום להמחשה בלבד ומוגבל לאזור המכשירים המדומים סביב תל אביב - אינו
        קריאת GPS אמיתית.
      </p>

      <div>
        <Button variant="outline" onClick={handleQuickSimulate}>
          הדמיה מהירה
        </Button>
      </div>

      <IncidentMap
        incident={incident}
        radiusMeters={radiusMeters}
        devicesInRange={devicesInRange}
        allDevices={allDevices}
        routePath={routePath}
        onMapClick={setIncidentAndResetClock}
      />

      <MapLegend />

      {/* WHY 4/10-minute cutoffs, and why elapsed+ETA together for the second
          line: see goldenWindowLevel above - both figures come from the
          assignment's own survival-drop-off paragraph, and "will help arrive
          in time" is elapsed time since the call plus the remaining ride,
          not either number alone. */}
      <div className="flex flex-col gap-2 rounded-lg border border-line bg-paper px-4 py-3 text-sm">
        <p className="flex items-center gap-2">
          <span className="text-ink/70">זמן שחלף מאז קריאת המצוקה:</span>
          <span
            className={`font-mono text-base font-medium ${
              GOLDEN_WINDOW_TEXT_CLASS[goldenWindowLevel(elapsedSeconds)]
            }`}
          >
            {formatMinutesSeconds(elapsedSeconds)}
          </span>
        </p>
        {routeStatus === "cycling" && cyclingDurationSeconds !== null && (
          <p
            className={
              GOLDEN_WINDOW_TEXT_CLASS[
                goldenWindowLevel(elapsedSeconds + cyclingDurationSeconds)
              ]
            }
          >
            זמן הגעה משוער: {Math.round(cyclingDurationSeconds / 60)} דק&apos; -{" "}
            {goldenWindowLevel(elapsedSeconds + cyclingDurationSeconds) === "red"
              ? "מעבר לחלון הזהב"
              : "בתוך חלון הזהב"}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1 text-sm">
        <p>
          מכשירים בטווח ({radiusMeters} מ׳):{" "}
          <span className="font-mono font-medium">{devicesInRange.length}</span>
        </p>
        {routeStatus === "cycling" && cyclingDistance !== null && (
          <p className="text-signal">
            מסלול רכיבה למכשיר הקרוב:{" "}
            <span className="font-mono">{(cyclingDistance / 1000).toFixed(2)}</span>{" "}
            ק״מ
          </p>
        )}
        {routeStatus === "loading" && (
          <p className="text-ink/60">טוען מסלול רכיבה...</p>
        )}
        {routeStatus === "fallback" && (
          <p className="text-beacon">
            לא ניתן לטעון מסלול רכיבה כרגע, מוצג קו ישר למכשיר הקרוב.
          </p>
        )}
        {routeStatus === "none" && devicesInRange.length === 0 && (
          <p className="text-ink/60">אין מכשירים בטווח הנתון.</p>
        )}
      </div>
    </main>
  );
}
