// Mongoose schema for simulated device pings, kept separate from
// seed-devices.ts since web/'s API routes read this same collection/shape.
// Mongo over SQL here: real devices would report inconsistent fields by
// hardware revision - a flexible document fits that better than a rigid table.

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
