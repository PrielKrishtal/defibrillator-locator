// Generic key/value store for admin-editable settings (homepage intro,
// simulator radius, etc.) - one schema, not one collection per setting.
// Mongo, not a new Supabase table: no DDL access to add a Postgres table by
// hand, and it keeps relational data in SQL, flexible data in Mongo.

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
