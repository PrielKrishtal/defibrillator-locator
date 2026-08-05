// GET /api/devices: every simulated device, unfiltered. Public reference
// data - the incident map shows this muted alongside the in-range subset
// so the geofence's filtering effect is visible.

import { NextResponse } from "next/server";
import { connectToMongo } from "@/lib/mongodb";
import { Device } from "@/lib/models/device";

// Takes no arguments and returns every simulated device's id, position,
// LoRa flag, and battery level. Public reference data.
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
