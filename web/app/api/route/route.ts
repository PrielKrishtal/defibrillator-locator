// GET /api/route: a thin proxy to OSRM's free public routing server for a
// cycling-profile route between two points. The incident page calls this to
// upgrade the straight line drawn to the nearest volunteer into an actual
// bike-path route (brief §7, item #10).
//
// WHY proxy through our own server instead of the browser calling OSRM
// directly: §7 says to call it "from a Next.js API route", it avoids any
// browser CORS issue with the public OSRM host, and it lets us put a timeout
// around a third-party service we don't control so a slow OSRM can't hang
// the request forever.

import { NextRequest, NextResponse } from "next/server";

// Abort the OSRM call if it takes longer than this. The incident page has
// already rendered a usable straight-line fallback by the time it calls us,
// so waiting a long time here buys nothing - fail fast and keep the fallback.
const OSRM_TIMEOUT_MS = 7000;

function parseCoord(value: string | null): number | null {
  if (value === null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const fromLat = parseCoord(params.get("fromLat"));
  const fromLng = parseCoord(params.get("fromLng"));
  const toLat = parseCoord(params.get("toLat"));
  const toLng = parseCoord(params.get("toLng"));

  if (fromLat === null || fromLng === null || toLat === null || toLng === null) {
    return NextResponse.json(
      { error: "fromLat, fromLng, toLat, toLng are all required" },
      { status: 400 }
    );
  }

  // OSRM wants lng,lat order in the path (GeoJSON convention), and the query
  // param is `geometries` (plural) - the brief's `geometry=geojson` is
  // ignored by OSRM and would return an encoded polyline instead of the
  // GeoJSON coordinates we need. `overview=full` gives the detailed path,
  // not a simplified one.
  const osrmUrl =
    `https://router.project-osrm.org/route/v1/cycling/` +
    `${fromLng},${fromLat};${toLng},${toLat}` +
    `?geometries=geojson&overview=full`;

  // AbortController is how fetch gets a timeout: the timer aborts the request,
  // which makes fetch reject, which we catch below as a 504.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OSRM_TIMEOUT_MS);

  try {
    const osrmRes = await fetch(osrmUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (!osrmRes.ok) {
      return NextResponse.json(
        { error: "Routing service returned an error" },
        { status: 502 }
      );
    }

    const data = await osrmRes.json();
    if (data.code !== "Ok" || !data.routes?.[0]) {
      return NextResponse.json(
        { error: "No route found" },
        { status: 502 }
      );
    }

    const route = data.routes[0];
    // OSRM/GeoJSON coordinates are [lng, lat]; Leaflet wants [lat, lng], so
    // flip each pair here once, server-side, and hand the client a list it
    // can drop straight into a polyline.
    const path: [number, number][] = route.geometry.coordinates.map(
      ([lng, lat]: [number, number]) => [lat, lng]
    );

    return NextResponse.json({
      path,
      distanceMeters: route.distance,
      durationSeconds: route.duration,
    });
  } catch (err) {
    clearTimeout(timeout);
    // AbortError (timeout) vs any other network failure - either way the
    // client keeps its straight-line fallback; we just distinguish the
    // status so a timeout reads as 504 and a genuine failure as 502.
    const isTimeout = err instanceof Error && err.name === "AbortError";
    console.error("OSRM route request failed:", err);
    return NextResponse.json(
      { error: isTimeout ? "Routing service timed out" : "Routing request failed" },
      { status: isTimeout ? 504 : 502 }
    );
  }
}
