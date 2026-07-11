"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import type { MapDevice } from "@/components/IncidentMap";

// Leaflet is browser-only, so the map is loaded client-side with no SSR.
// The placeholder keeps the layout stable while the chunk loads.
const IncidentMap = dynamic(() => import("@/components/IncidentMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-125 w-full items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-900">
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

export default function IncidentPage() {
  const [incident, setIncident] = useState(DEFAULT_INCIDENT);
  const [radiusMeters, setRadiusMeters] = useState(0);
  const [devices, setDevices] = useState<MapDevice[]>([]);
  const [routePath, setRoutePath] = useState<[number, number][] | null>(null);
  const [routeStatus, setRouteStatus] = useState<RouteStatus>("none");
  const [cyclingDistance, setCyclingDistance] = useState<number | null>(null);

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
      setDevices(data.devices);

      // No one in range: nothing to route to.
      if (data.devices.length === 0) {
        setRoutePath(null);
        setRouteStatus("none");
        setCyclingDistance(null);
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

  return (
    <main className="mx-auto flex max-w-4xl flex-1 flex-col gap-4 p-8">
      <h1 className="text-2xl font-semibold">עמוד מצוקה</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        לחצו על המפה כדי לקבוע את מיקום קריאת המצוקה. המערכת תאתר את המכשירים
        הרשומים ברדיוס שהוגדר ותציג מסלול רכיבה למכשיר הקרוב ביותר.
      </p>

      <IncidentMap
        incident={incident}
        radiusMeters={radiusMeters}
        devices={devices}
        routePath={routePath}
        onMapClick={(lat, lng) => setIncident({ lat, lng })}
      />

      <div className="flex flex-col gap-1 text-sm">
        <p>
          מכשירים בטווח ({radiusMeters} מ׳):{" "}
          <span className="font-medium">{devices.length}</span>
        </p>
        {routeStatus === "cycling" && cyclingDistance !== null && (
          <p className="text-green-700 dark:text-green-400">
            מסלול רכיבה למכשיר הקרוב: {(cyclingDistance / 1000).toFixed(2)} ק״מ
          </p>
        )}
        {routeStatus === "loading" && (
          <p className="text-zinc-500">טוען מסלול רכיבה...</p>
        )}
        {routeStatus === "fallback" && (
          <p className="text-amber-600 dark:text-amber-400">
            לא ניתן לטעון מסלול רכיבה כרגע, מוצג קו ישר למכשיר הקרוב.
          </p>
        )}
        {routeStatus === "none" && devices.length === 0 && (
          <p className="text-zinc-500">אין מכשירים בטווח הנתון.</p>
        )}
      </div>
    </main>
  );
}
