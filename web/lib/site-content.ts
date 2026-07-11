// Read/write helpers for the site_setting collection. Callers never touch
// the model directly - this file is the one place that knows the fallback
// values, so a fresh install (no admin edits yet) still shows sensible
// Hebrew content instead of a blank page.

import { connectToMongo } from "./mongodb";
import { SiteSetting } from "./models/site-setting";

export async function getSiteContent(
  key: string,
  fallback: string
): Promise<string> {
  await connectToMongo();
  const doc = await SiteSetting.findOne({ key }).lean();
  return doc?.value ?? fallback;
}

export async function setSiteContent(key: string, value: string): Promise<void> {
  await connectToMongo();
  // WHY upsert: the first admin edit is what creates the document - there's
  // no seed script for this collection, unlike devices/admins.
  await SiteSetting.updateOne(
    { key },
    { $set: { value, updatedAt: new Date() } },
    { upsert: true }
  );
}

export const HOMEPAGE_INTRO_KEY = "homepage_intro";
export const DEFAULT_HOMEPAGE_INTRO =
  "LoRa היא טכנולוגיית תקשורת אלחוטית לטווח ארוך וצריכת חשמל נמוכה. " +
  "מכשיר LoRa נייד (למשל דרך רשת Meshtastic) יכול לשדר נקודת מיקום GPS " +
  "גם באזורים ללא כיסוי סלולרי. כשמדווחים על אירוע דום לב, המערכת שולחת " +
  "את המיקום למתנדבים הקרובים ביותר - דרך רשת ה-LoRa, או באמצעות הודעת " +
  "SMS הכוללת את מספר הטלפון והמיקום של בעל המכשיר.";

export const WHY_VOLUNTEER_KEY = "why_volunteer_copy";
export const DEFAULT_WHY_VOLUNTEER =
  "כל מתנדב עם דפיברילטור נייד או מכשיר LoRa יכול להיות ההבדל בין חיים " +
  "למוות בדקות הראשונות של אירוע דום לב, לפני שצוות רפואי מגיע לזירה. " +
  "ההרשמה חינמית, אינה דורשת סיסמה, ואינה מחייבת אתכם בכלום מלבד הסכמה " +
  "שהמערכת תדע לאתר אתכם בעת הצורך.";

export const RADIUS_METERS_KEY = "simulator_radius_meters";
export const DEFAULT_RADIUS_METERS = 5000;

export async function getRadiusMeters(): Promise<number> {
  const raw = await getSiteContent(
    RADIUS_METERS_KEY,
    String(DEFAULT_RADIUS_METERS)
  );
  const parsed = Number(raw);
  // WHY the fallback here too: guards against a corrupted/non-numeric value
  // ever having been saved, so the incident simulator (Phase 7) always gets
  // a usable number instead of NaN.
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_RADIUS_METERS;
}

export async function setRadiusMeters(meters: number): Promise<void> {
  await setSiteContent(RADIUS_METERS_KEY, String(meters));
}
