// POST /api/incident: the geo-fence. Given a distress-call point {lat,lng},
// return the registered devices within the admin-configured alert radius,
// nearest first. Public - a passerby reporting an incident has no login.
//
// The radius comes from the Phase 6 admin setting (getRadiusMeters), not the
// request, so there's one source of truth: change it in the dashboard and
// this endpoint's geo-fence changes with it. It's echoed back in the
// response so the map can draw the matching circle.

import { NextRequest, NextResponse } from "next/server";
import { connectToMongo } from "@/lib/mongodb";
import { Device } from "@/lib/models/device";
import { haversineMeters } from "@/lib/geo";
import { getRadiusMeters } from "@/lib/site-content";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const lat = Number(body?.lat);
  const lng = Number(body?.lng);

  // Reject anything that isn't a real coordinate before touching the DB.
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return NextResponse.json(
      { error: "Valid lat and lng are required" },
      { status: 400 }
    );
  }

  try {
    const radiusMeters = await getRadiusMeters();
    await connectToMongo();
    const devices = await Device.find({}).lean();

    // Straight-line geo-fence: attach each device's distance from the
    // incident, keep only those within the radius, nearest first. O(n) over
    // ~50 devices - simpler and easier to defend than a Mongo $near query
    // plus a 2dsphere index (see brief §7).
    const withinRadius = devices
      .map((d) => ({
        deviceId: d.deviceId,
        lat: d.lat,
        lng: d.lng,
        hasLora: d.hasLora,
        batteryLevel: d.batteryLevel,
        lastSeen: d.lastSeen,
        distanceMeters: haversineMeters(lat, lng, d.lat, d.lng),
      }))
      .filter((d) => d.distanceMeters <= radiusMeters)
      .sort((a, b) => a.distanceMeters - b.distanceMeters);

    return NextResponse.json({
      incident: { lat, lng },
      radiusMeters,
      devices: withinRadius,
    });
  } catch (err) {
    console.error("Incident geo-fence failed:", err);
    return NextResponse.json(
      { error: "Failed to compute nearby devices" },
      { status: 500 }
    );
  }
}
