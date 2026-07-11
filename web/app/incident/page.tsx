"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import type { MapDevice, AllDevice } from "@/components/IncidentMap";
import { MapLegend } from "@/components/MapLegend";

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

export default function IncidentPage() {
  const [incident, setIncident] = useState(DEFAULT_INCIDENT);
  const [radiusMeters, setRadiusMeters] = useState(0);
  const [devicesInRange, setDevicesInRange] = useState<MapDevice[]>([]);
  const [allDevices, setAllDevices] = useState<AllDevice[]>([]);
  const [routePath, setRoutePath] = useState<[number, number][] | null>(null);
  const [routeStatus, setRouteStatus] = useState<RouteStatus>("none");
  const [cyclingDistance, setCyclingDistance] = useState<number | null>(null);

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
      <h1 className="font-display text-3xl font-medium">עמוד מצוקה</h1>
      <p className="text-sm text-ink/70">
        לחצו על המפה כדי לקבוע את מיקום קריאת המצוקה. המערכת תאתר את המכשירים
        הרשומים ברדיוס שהוגדר ותציג מסלול רכיבה למכשיר הקרוב ביותר.
      </p>

      <IncidentMap
        incident={incident}
        radiusMeters={radiusMeters}
        devicesInRange={devicesInRange}
        allDevices={allDevices}
        routePath={routePath}
        onMapClick={(lat, lng) => setIncident({ lat, lng })}
      />

      <MapLegend />

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
