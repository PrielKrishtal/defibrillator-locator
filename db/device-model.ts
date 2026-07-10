// Mongoose schema for simulated LoRa/defibrillator device pings. Lives here
// (not inside seed-devices.ts) because the Next.js API routes built in a
// later phase read from this same collection and need the same shape.
//
// WHY Mongo instead of another SQL table: real devices would report
// inconsistent fields depending on hardware revision (some have battery
// telemetry, some don't, some report over LoRa vs cellular). A flexible
// document schema fits that better than a rigid SQL table would.

import mongoose from "mongoose";

const deviceSchema = new mongoose.Schema({
  deviceId: String, // simulated DevEUI, e.g. "SIM-A1B2C3D4"
  // WHY: nullable/optional - simulated devices aren't tied to a real
  // registrant, only devices created through the actual /register flow
  // (added in a later phase) will carry a real registrations.id here.
  registrationId: Number,
  lat: Number,
  lng: Number,
  batteryLevel: Number,
  hasLora: Boolean,
  lastSeen: Date,
});

// WHY: mongoose.models check avoids "OverwriteModelError" - Next.js hot
// reload (and repeated imports of this file across API routes) would
// otherwise try to register the same model twice in one process.
export const Device =
  mongoose.models.Device || mongoose.model("Device", deviceSchema);
