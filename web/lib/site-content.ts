// Read/write helpers for site_setting - the one place that knows fallback
// values, so a fresh install still shows sensible content instead of blank.

import { connectToMongo } from "./mongodb";
import { SiteSetting } from "./models/site-setting";

// Takes a settings key and a fallback, and returns the admin-saved value
// for that key, or the fallback if it hasn't been set yet.
export async function getSiteContent(
  key: string,
  fallback: string
): Promise<string> {
  await connectToMongo();
  const doc = await SiteSetting.findOne({ key }).lean();
  return doc?.value ?? fallback;
}

// Takes a settings key and a new value, and upserts it into site_setting.
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

export type LoraPurchaseLink = { label: string; url: string };

export const LORA_LINKS_KEY = "lora_purchase_links";
const DEFAULT_LORA_PURCHASE_LINKS: LoraPurchaseLink[] = [
  {
    label: "Adafruit LoRa FeatherWing - RFM95W 433MHz",
    url: "https://www.adafruit.com/product/3232",
  },
  {
    label: "SparkFun - LoRa Transceiver Module RFM95CW",
    url: "https://www.sparkfun.com/lora-transceiver-module-rfm95cw.html",
  },
  {
    label: "Seeed Studio - Grove LoRa Radio 433MHz",
    url: "https://www.seeedstudio.com/Grove-LoRa-Radio-433MHz-p-2777.html",
  },
];
// Stored as a JSON string, like every other site_content value - the schema
// stays a single string column, and this is the one key whose string
// happens to be JSON instead of plain text.
export const DEFAULT_LORA_LINKS = JSON.stringify(DEFAULT_LORA_PURCHASE_LINKS);

export const RADIUS_METERS_KEY = "simulator_radius_meters";
export const DEFAULT_RADIUS_METERS = 5000;

// Takes no arguments and returns the current simulator radius in meters,
// falling back to the default if none is saved or the saved value is
// invalid (guards against a corrupted/non-numeric value ever having been
// stored, so the incident simulator always gets a usable number).
export async function getRadiusMeters(): Promise<number> {
  const raw = await getSiteContent(
    RADIUS_METERS_KEY,
    String(DEFAULT_RADIUS_METERS)
  );
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_RADIUS_METERS;
}

// Takes a radius in meters and saves it as the simulator's configured
// alert radius.
export async function setRadiusMeters(meters: number): Promise<void> {
  await setSiteContent(RADIUS_METERS_KEY, String(meters));
}
