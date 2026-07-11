"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// A device as the incident geo-fence returns it (only the fields the map
// needs). Distance is used to label the nearest one.
export type MapDevice = {
  deviceId: string;
  lat: number;
  lng: number;
  hasLora: boolean;
  distanceMeters: number;
};

type IncidentMapProps = {
  incident: { lat: number; lng: number };
  radiusMeters: number;
  devices: MapDevice[];
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
  devices,
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
  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;

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

    // Alert radius circle - the visible geo-fence.
    L.circle([incident.lat, incident.lng], {
      radius: radiusMeters,
      color: "#2563eb",
      weight: 1,
      fillOpacity: 0.05,
    }).addTo(overlay);

    // Incident origin - red, the distress call location.
    L.circleMarker([incident.lat, incident.lng], {
      radius: 9,
      color: "#dc2626",
      fillColor: "#dc2626",
      fillOpacity: 1,
    })
      .bindTooltip("נקודת המצוקה")
      .addTo(overlay);

    // Devices in range. The nearest (devices[0], since the API sorts by
    // distance) is highlighted green because it's the one being routed to;
    // the rest are blue. hasLora-vs-not icon differences come in Phase 8.
    devices.forEach((device, index) => {
      const isNearest = index === 0;
      L.circleMarker([device.lat, device.lng], {
        radius: isNearest ? 8 : 6,
        color: isNearest ? "#16a34a" : "#2563eb",
        fillColor: isNearest ? "#16a34a" : "#2563eb",
        fillOpacity: 0.9,
      })
        .bindTooltip(
          `${device.deviceId} - ${Math.round(device.distanceMeters)} מ׳` +
            (device.hasLora ? " (LoRa)" : "")
        )
        .addTo(overlay);
    });

    // The path to the nearest device. This same polyline shows either the
    // straight-line fallback or the OSRM cycling route - the page swaps the
    // coordinates in `routePath`, so the map just draws whatever it's given.
    if (routePath && routePath.length > 0) {
      L.polyline(routePath, { color: "#ea580c", weight: 4 }).addTo(overlay);
    }
  }, [incident, radiusMeters, devices, routePath]);

  return <div ref={containerRef} className="h-125 w-full rounded-lg" />;
}
