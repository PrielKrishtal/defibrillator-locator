// Mongoose model for the simulated LoRa/defibrillator devices seeded in
// Phase 2 (db/seed-devices.ts). web/ is a separate npm package from db/, so
// it declares its own model against the same `devices` collection rather
// than importing across package boundaries (which Next's bundler dislikes).
// The schema shape must match what the seed script wrote.

import mongoose from "mongoose";

export interface DeviceDoc {
  deviceId: string;
  registrationId: number | null;
  lat: number;
  lng: number;
  batteryLevel: number;
  hasLora: boolean;
  lastSeen: Date;
}

const deviceSchema = new mongoose.Schema<DeviceDoc>({
  deviceId: String,
  registrationId: { type: Number, default: null },
  lat: Number,
  lng: Number,
  batteryLevel: Number,
  hasLora: Boolean,
  lastSeen: Date,
});

// WHY the mongoose.models check: Next.js re-imports this module on hot
// reload and on serverless cold starts - without it, mongoose would try to
// register the "Device" model twice in one process and throw.
export const Device: mongoose.Model<DeviceDoc> =
  mongoose.models.Device || mongoose.model<DeviceDoc>("Device", deviceSchema);
