// One-off script: fills the devices collection with ~50 fake defibrillator/
// LoRa devices around central Israel. Run with `npm run seed:devices`.

import "dotenv/config";
import mongoose from "mongoose";
import crypto from "node:crypto";
import { Device } from "./device-model.js";

const DEVICE_COUNT = 50;

// Center of the scatter: roughly Tel Aviv - a real, recognizable point so
// the map looks like an actual place during the demo, not empty ocean.
const CENTER_LAT = 32.0853;
const CENTER_LNG = 34.7818;

// 15km: wide enough to span several towns (gives the radius setting
// something to show), narrow enough to stay in the metro area.
const MAX_RADIUS_METERS = 15000;
const EARTH_RADIUS_METERS = 6371000;

// sqrt(random) for the radius: a plain random radius bunches points near
// the center (less area in an inner ring) - this spreads them evenly.
function randomPointNear(centerLat: number, centerLng: number, maxRadiusMeters: number) {
  const radius = maxRadiusMeters * Math.sqrt(Math.random());
  const angle = Math.random() * 2 * Math.PI;

  const dLat = (radius * Math.cos(angle)) / EARTH_RADIUS_METERS;
  const dLng =
    (radius * Math.sin(angle)) /
    (EARTH_RADIUS_METERS * Math.cos((centerLat * Math.PI) / 180));

  return {
    lat: centerLat + (dLat * 180) / Math.PI,
    lng: centerLng + (dLng * 180) / Math.PI,
  };
}

// Keeps devices out of the Mediterranean. A flat longitude cutoff (tried at
// 34.77, then 34.80) kept failing because the coast angles northeast, not
// north-south - a single number is only ever right at one latitude. This
// interpolates a line through two real reference points instead (see brief
// §11, 2026-07-12); the margin absorbs their imprecision as named places,
// not surveyed coastline vertices.
const COASTLINE_REFERENCE_SOUTH = { lat: 32.02, lng: 34.746 }; // Bat Yam
const COASTLINE_REFERENCE_NORTH = { lat: 32.248, lng: 34.825 }; // Ga'ash Beach
const COASTLINE_SAFETY_MARGIN_DEG = 0.015; // roughly 1.5km

function minLandLngAt(lat: number): number {
  const slope =
    (COASTLINE_REFERENCE_NORTH.lng - COASTLINE_REFERENCE_SOUTH.lng) /
    (COASTLINE_REFERENCE_NORTH.lat - COASTLINE_REFERENCE_SOUTH.lat);
  const interpolatedCoastLng =
    COASTLINE_REFERENCE_SOUTH.lng + slope * (lat - COASTLINE_REFERENCE_SOUTH.lat);
  return interpolatedCoastLng + COASTLINE_SAFETY_MARGIN_DEG;
}

// Retries rather than clamping a too-far-west point: clamping would pile
// rejects along one edge instead of keeping an even spread.
function randomLandPointNear(
  centerLat: number,
  centerLng: number,
  maxRadiusMeters: number
) {
  for (let attempt = 0; attempt < 50; attempt++) {
    const point = randomPointNear(centerLat, centerLng, maxRadiusMeters);
    if (point.lng >= minLandLngAt(point.lat)) {
      return point;
    }
  }
  // 50 rejections in a row essentially never happens - center is a safe
  // always-on-land fallback rather than looping forever.
  return { lat: centerLat, lng: centerLng };
}

function randomDeviceId() {
  // WHY: 4 random bytes as hex gives a short, DevEUI-looking ID
  // ("SIM-A1B2C3D4") without needing a real LoRa allocation.
  return `SIM-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

function randomRecentDate(maxHoursAgo: number) {
  const msAgo = Math.random() * maxHoursAgo * 60 * 60 * 1000;
  return new Date(Date.now() - msAgo);
}

function buildSimulatedDevices() {
  const devices = [];
  for (let i = 0; i < DEVICE_COUNT; i++) {
    const { lat, lng } = randomLandPointNear(CENTER_LAT, CENTER_LNG, MAX_RADIUS_METERS);
    devices.push({
      deviceId: randomDeviceId(),
      // WHY: null, not a real registrations.id - these are simulated
      // devices for the map demo, not tied to anyone who actually
      // registered through the /register form.
      registrationId: null,
      lat,
      lng,
      batteryLevel: Math.floor(Math.random() * 101),
      // WHY 60%: mix of LoRa and non-LoRa owners, matching the spec's
      // "defibrillator owner with or without LoRa" eligibility rule.
      hasLora: Math.random() < 0.6,
      lastSeen: randomRecentDate(48),
    });
  }
  return devices;
}

async function seedDevices() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Missing MONGODB_URI in db/.env");
  }

  await mongoose.connect(uri);

  // WHY: clear existing simulated devices first so re-running this script
  // (e.g. after changing DEVICE_COUNT) replaces the set instead of piling
  // up duplicates alongside the old ones.
  await Device.deleteMany({});
  await Device.insertMany(buildSimulatedDevices());

  console.log(`Seeded ${DEVICE_COUNT} simulated devices around Tel Aviv.`);
  await mongoose.disconnect();
}

seedDevices();
