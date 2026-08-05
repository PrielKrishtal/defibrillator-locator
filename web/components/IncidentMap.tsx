"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Duplicated from globals.css's --color-* tokens: Leaflet's SVG renderer
// takes literal color strings, not CSS classes, so these need manual sync.
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
  // Null before the user has clicked or hit quick-simulate - nothing is
  // drawn yet in that state (see the effects below).
  incident: { lat: number; lng: number } | null;
  // Where the map centers itself on mount, regardless of whether an
  // incident exists yet. Kept separate from `incident` so an empty map
  // still has somewhere sensible to look at.
  initialCenter: { lat: number; lng: number };
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

// Leaflet touches `window` at import time, so this is client-only (next/
// dynamic ssr:false). Drives Leaflet imperatively rather than via
// react-leaflet, so every map operation is an explicit, defensible call.
export default function IncidentMap({
  incident,
  initialCenter,
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
  // Click callback lives in a ref so the mount-once click handler always
  // calls the latest version. Updated in an effect, not during render:
  // mutating a ref while rendering is unsafe under React's rules.
  const onMapClickRef = useRef(onMapClick);
  // Runs after every render. Keeps onMapClickRef pointed at the latest
  // onMapClick prop, so the mount-once click handler below never calls a
  // stale closure.
  useEffect(() => {
    onMapClickRef.current = onMapClick;
  });

  // Runs once on mount (empty dep array - never re-runs on a prop change).
  // Creates the Leaflet map, adds the OSM tile layer and a click handler,
  // and sets up the overlay layer group; tears the map down on unmount.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current).setView(
      [initialCenter.lat, initialCenter.lng],
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

  // Runs whenever incident, radiusMeters, devicesInRange, allDevices, or
  // routePath changes. Clears and redraws every overlay - the radius
  // circle, muted and in-range device markers, the incident marker, and
  // the route line - to match the current props.
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    overlay.clearLayers();

    // Alert radius circle - the visible geo-fence, in the system's own
    // color. Skipped entirely before an incident exists: there's no
    // geofence to show yet.
    if (incident) {
      L.circle([incident.lat, incident.lng], {
        radius: radiusMeters,
        color: COLOR.signal,
        weight: 1,
        fillOpacity: 0.05,
      }).addTo(overlay);
    }

    // Muted out-of-range devices drawn first so the in-range set (next,
    // full color) visibly stands out against them.
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

    // Nearest device (index 0, API sorts by distance) gets a larger dot.
    // hasLora devices get an outer ring too - a shape distinction, not just
    // color, so it reads for anyone who can't distinguish the two hues.
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

    // divIcon, not circleMarker: the pulse ring needs real DOM/CSS, not SVG.
    // Skipped with no incident, same as the circle above.
    if (incident) {
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
    }

    // Beacon color, same as the LoRa ring ("a signal in motion"). Draws
    // whatever routePath holds - straight-line fallback or real OSRM route.
    if (routePath && routePath.length > 0) {
      L.polyline(routePath, { color: COLOR.beacon, weight: 4 }).addTo(overlay);
    }
  }, [incident, radiusMeters, devicesInRange, allDevices, routePath]);

  // Runs whenever incident or radiusMeters changes. Pans/zooms the map to
  // fit the radius circle, so a click/simulate near the scatter's edge
  // doesn't land outside the visible map. Every in-range device is
  // guaranteed inside this circle by definition; an OSRM route can
  // occasionally jut slightly outside it on a winding road - accepted.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !incident) return;
    // toBounds, not L.circle(...).getBounds(): getBounds() needs the circle
    // attached to a map to project its radius - a throwaway unattached
    // circle crashed Leaflet internals. toBounds is pure lat/lng math.
    const bounds = L.latLng(incident.lat, incident.lng).toBounds(radiusMeters);
    // 100px padding so the fit isn't cropped tight to the circle's edge.
    map.fitBounds(bounds, { padding: [100, 100] });
  }, [incident, radiusMeters]);

  return <div ref={containerRef} className="h-125 w-full rounded-lg" />;
}
