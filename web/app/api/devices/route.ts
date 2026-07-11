// GET /api/devices: every simulated device, unfiltered - the route §6
// originally planned. The incident map uses this to show the full
// registered population (muted, for context) alongside the in-range subset
// /api/incident computes, so a viewer can see the geofence actually working
// rather than only ever seeing devices that already passed the filter.
// Public - this is reference data, not admin-only.

import { NextResponse } from "next/server";
import { connectToMongo } from "@/lib/mongodb";
import { Device } from "@/lib/models/device";

export async function GET() {
  try {
    await connectToMongo();
    const devices = await Device.find({}).lean();
    return NextResponse.json({
      devices: devices.map((d) => ({
        deviceId: d.deviceId,
        lat: d.lat,
        lng: d.lng,
        hasLora: d.hasLora,
        batteryLevel: d.batteryLevel,
      })),
    });
  } catch (err) {
    console.error("Failed to list devices:", err);
    return NextResponse.json(
      { error: "Failed to load devices" },
      { status: 500 }
    );
  }
}
