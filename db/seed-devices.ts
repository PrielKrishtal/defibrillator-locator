// One-off script: fills the devices collection with ~50 fake defibrillator
// / LoRa devices scattered around central Israel, so the incident-page
// geo-fencing (built in a later phase) has something realistic to query
// against before any real registrant exists. Run with `npm run seed:devices`.

import "dotenv/config";
import mongoose from "mongoose";
import crypto from "node:crypto";
import { Device } from "./device-model.js";

const DEVICE_COUNT = 50;

// Center of the scatter: roughly Tel Aviv - a real, recognizable point so
// the map looks like an actual place during the demo, not empty ocean.
const CENTER_LAT = 32.0853;
const CENTER_LNG = 34.7818;

// WHY 15km: wide enough that devices spread across several towns (so a
// configurable radius parameter in the simulator has something to show),
// narrow enough that they stay in the Tel Aviv metro area, not the desert.
const MAX_RADIUS_METERS = 15000;
const EARTH_RADIUS_METERS = 6371000;

// WHY: picking a uniformly random angle and radius on their own would
// bunch points near the center (there's less area in an inner ring than
// an outer one). Taking sqrt(random) for the radius corrects for that so
// points spread evenly across the whole circle's area.
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

// Tel Aviv's coastline sits only ~1.5km west of the scatter center, so a
// plain uniform disk regularly lands points in the Mediterranean - visibly
// wrong for "portable defibrillator devices" on the map.
//
// WHY a latitude-dependent line, not a flat longitude cutoff (two flat
// values were tried first - 34.77, then 34.80 - and both still let points
// land in the sea near the scatter's northern edge): the coast angles
// northeast up the Sharon plain, not straight north-south. Real reference
// points confirm a consistent slope across the whole scatter radius (see
// brief §11, 2026-07-12): Bat Yam (south) sits at ~34.746, central Tel Aviv
// at ~34.766, Ga'ash Beach (north, near the scatter's edge) at ~34.825.
// Interpolating a line through these fits all three well, unlike a single
// number that can only ever be correct at one latitude.
const COASTLINE_REFERENCE_SOUTH = { lat: 32.02, lng: 34.746 }; // Bat Yam
const COASTLINE_REFERENCE_NORTH = { lat: 32.248, lng: 34.825 }; // Ga'ash Beach
// WHY a margin on top of the interpolated line at all: these are named-place
// reference points, not surveyed coastline vertices, so a small buffer
// absorbs that imprecision rather than sitting exactly on the estimated edge.
const COASTLINE_SAFETY_MARGIN_DEG = 0.015; // roughly 1.5km

function minLandLngAt(lat: number): number {
  const slope =
    (COASTLINE_REFERENCE_NORTH.lng - COASTLINE_REFERENCE_SOUTH.lng) /
    (COASTLINE_REFERENCE_NORTH.lat - COASTLINE_REFERENCE_SOUTH.lat);
  const interpolatedCoastLng =
    COASTLINE_REFERENCE_SOUTH.lng + slope * (lat - COASTLINE_REFERENCE_SOUTH.lat);
  return interpolatedCoastLng + COASTLINE_SAFETY_MARGIN_DEG;
}

// WHY retry instead of clamping a too-far-west point to the coastline:
// clamping would pile every rejected point along one straight edge; a
// fresh random redraw keeps the "spread evenly over an area" property from
// randomPointNear intact.
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
  // WHY a fallback at all: 50 rejected attempts in a row essentially never
  // happens (most of the disk is east of the coast), but returning the
  // exact center is a safe, always-on-land default if it somehow did,
  // rather than looping forever.
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
