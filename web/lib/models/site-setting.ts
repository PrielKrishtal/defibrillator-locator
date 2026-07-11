// Generic key/value store for admin-editable site settings: the homepage
// intro text, the simulator's default radius, and (later) other marketing
// copy. One schema instead of one collection per setting, since every use
// is the same shape: a named value an admin can overwrite from the dashboard.
// See DEFIBRILLATOR_PROJECT_BRIEF.md §11 (2026-07-11) for why this lives in
// Mongo rather than a new Supabase table.

import mongoose from "mongoose";

// WHY an explicit interface: without one, mongoose infers document fields
// as `any`, and `.lean()` results lose field names entirely (TypeScript
// only sees generic Mongoose internals like `_id` and `__v`).
export interface SiteSettingDoc {
  key: string;
  value: string;
  updatedAt: Date;
}

const siteSettingSchema = new mongoose.Schema<SiteSettingDoc>({
  key: { type: String, required: true, unique: true },
  value: { type: String, required: true },
  updatedAt: { type: Date, default: Date.now },
});

// WHY the mongoose.models check: Next.js re-imports this module on every
// hot reload in dev and on every cold start of a serverless function: without
// it, mongoose would try to register the same model twice and throw.
export const SiteSetting: mongoose.Model<SiteSettingDoc> =
  mongoose.models.SiteSetting ||
  mongoose.model<SiteSettingDoc>("SiteSetting", siteSettingSchema);
