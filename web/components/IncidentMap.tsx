"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// WHY these are duplicated here instead of read from globals.css: Leaflet's
// SVG renderer (circleMarker/circle) takes literal color strings for its
// `color`/`fillColor` options, not CSS classes - these must be kept in sync
// by hand with the --color-* tokens in globals.css. The divIcon below (the
// one DOM-based marker) uses the real Tailwind classes instead.
const COLOR = {
  signal: "#175c52",
  flare: "#c4432a",
  beacon: "#b8862e",
  line: "#dcd9d2",
};

// A device as the incident geo-fence returns it: in range, with its
// distance from the incident.
export type MapDevice = {
  deviceId: string;
  lat: number;
  lng: number;
  hasLora: boolean;
  batteryLevel: number;
  distanceMeters: number;
};

// A device as the unfiltered /api/devices list returns it - no distance,
// since it isn't necessarily near anything.
export type AllDevice = {
  deviceId: string;
  lat: number;
  lng: number;
  hasLora: boolean;
  batteryLevel: number;
};

type IncidentMapProps = {
  incident: { lat: number; lng: number };
  radiusMeters: number;
  devicesInRange: MapDevice[];
  // The full seeded population, shown muted for context so the geofence's
  // effect is visible (this device is in range, that one isn't) rather than
  // only ever showing the devices that already passed the filter.
  allDevices: AllDevice[];
  // The line drawn to the nearest device: either the OSRM cycling path once
  // it loads, or a straight [incident, device] fallback until then. Null
  // when there's no device in range to route to.
  routePath: [number, number][] | null;
  onMapClick: (lat: number, lng: number) => void;
};

// Leaflet touches `window` at import time, so this whole component is loaded
// client-only (via next/dynamic ssr:false on the page). It drives Leaflet
// imperatively - the React-idiomatic way would be react-leaflet, but vanilla
// Leaflet keeps every map operation an explicit, defensible call.
export default function IncidentMap({
  incident,
  radiusMeters,
  devicesInRange,
  allDevices,
  routePath,
  onMapClick,
}: IncidentMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  // One layer group holds everything that changes (markers, circle, route);
  // redrawing means clearing this group and repopulating, rather than
  // tracking each layer individually.
  const overlayRef = useRef<L.LayerGroup | null>(null);
  // The click callback lives in a ref so the map's click handler (bound once
  // on mount) always calls the latest version without re-creating the map.
  // WHY updated in an effect, not directly in the render body: mutating a
  // ref while rendering is unsafe under React's rules (a render can be
  // discarded without committing, but the mutation would already have
  // happened) - an effect with no dependency array runs after every commit
  // instead, which is the safe equivalent of "always keep this current."
  const onMapClickRef = useRef(onMapClick);
  useEffect(() => {
    onMapClickRef.current = onMapClick;
  });

  // Mount: create the map once. The empty dep array is deliberate - we never
  // want to tear down and rebuild the whole map on a prop change.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current).setView(
      [incident.lat, incident.lng],
      13
    );
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
      maxZoom: 19,
    }).addTo(map);

    map.on("click", (e: L.LeafletMouseEvent) => {
      onMapClickRef.current(e.latlng.lat, e.latlng.lng);
    });

    overlayRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      overlayRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redraw overlays whenever the incident, radius, devices, or route change.
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    overlay.clearLayers();

    // Alert radius circle - the visible geo-fence, in the system's own color.
    L.circle([incident.lat, incident.lng], {
      radius: radiusMeters,
      color: COLOR.signal,
      weight: 1,
      fillOpacity: 0.05,
    }).addTo(overlay);

    // Devices outside the radius, drawn muted first so the in-range set
    // (drawn next, in full color) visibly stands out against them - this is
    // what makes the geofence's effect legible rather than only ever
    // showing devices that already passed the filter.
    const inRangeIds = new Set(devicesInRange.map((d) => d.deviceId));
    allDevices
      .filter((d) => !inRangeIds.has(d.deviceId))
      .forEach((device) => {
        L.circleMarker([device.lat, device.lng], {
          radius: 4,
          color: COLOR.line,
          fillColor: COLOR.line,
          fillOpacity: 0.7,
          weight: 1,
        })
          .bindTooltip(`${device.deviceId} - מחוץ לטווח`)
          .addTo(overlay);
      });

    // Devices in range. The nearest (devicesInRange[0], since the API sorts
    // by distance) gets a larger dot since it's the one being routed to.
    // hasLora devices additionally get an outer ring in the beacon color -
    // a broadcast-ring motif, not just a different color, so the LoRa/
    // non-LoRa distinction reads even for someone who can't distinguish the
    // two hues.
    devicesInRange.forEach((device, index) => {
      const isNearest = index === 0;
      const dotRadius = isNearest ? 8 : 6;

      if (device.hasLora) {
        L.circleMarker([device.lat, device.lng], {
          radius: dotRadius + 4,
          color: COLOR.beacon,
          weight: 1.5,
          fillOpacity: 0,
        }).addTo(overlay);
      }

      L.circleMarker([device.lat, device.lng], {
        radius: dotRadius,
        color: COLOR.signal,
        fillColor: COLOR.signal,
        fillOpacity: 0.9,
      })
        .bindTooltip(
          `${device.deviceId} - ${Math.round(device.distanceMeters)} מ׳` +
            (device.hasLora ? " (LoRa)" : "") +
            ` - סוללה ${device.batteryLevel}%`
        )
        .addTo(overlay);
    });

    // The incident marker itself: an L.marker with a divIcon, not a
    // circleMarker like everything else - it's the one element on the map
    // with motion (the pulse ring), which needs real DOM/CSS, not SVG.
    const incidentIcon = L.divIcon({
      className: "incident-icon",
      html: `
        <div class="flex h-9 w-9 items-center justify-center">
          <div class="relative h-4 w-4">
            <div class="incident-pulse absolute inset-0 rounded-full bg-flare"></div>
            <div class="absolute inset-0 rounded-full border-2 border-paper bg-flare"></div>
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });
    L.marker([incident.lat, incident.lng], { icon: incidentIcon })
      .bindTooltip("נקודת המצוקה")
      .addTo(overlay);

    // The path to the nearest device, in the beacon color - the same color
    // as the LoRa ring, since both represent "a signal in motion toward
    // someone." This same polyline shows either the straight-line fallback
    // or the OSRM cycling route; the page swaps the coordinates in
    // `routePath`, so the map just draws whatever it's given.
    if (routePath && routePath.length > 0) {
      L.polyline(routePath, { color: COLOR.beacon, weight: 4 }).addTo(overlay);
    }
  }, [incident, radiusMeters, devicesInRange, allDevices, routePath]);

  return <div ref={containerRef} className="h-125 w-full rounded-lg" />;
}
