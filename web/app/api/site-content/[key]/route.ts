// GET is public, PATCH is admin-only. `key` is checked against an
// allowlist so this stays a small, known set of content slots, not an
// arbitrary store any typo could add a new row to.

import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/verify-admin";
import { parseLoraPurchaseLinks } from "@/lib/validate-lora-links";
import {
  getSiteContent,
  setSiteContent,
  HOMEPAGE_INTRO_KEY,
  DEFAULT_HOMEPAGE_INTRO,
  WHY_VOLUNTEER_KEY,
  DEFAULT_WHY_VOLUNTEER,
  LORA_LINKS_KEY,
  DEFAULT_LORA_LINKS,
} from "@/lib/site-content";

// WHY a map of key -> default: each marketing-copy key just needs an entry
// here, nothing else about this route changes.
const KNOWN_KEYS: Record<string, string> = {
  [HOMEPAGE_INTRO_KEY]: DEFAULT_HOMEPAGE_INTRO,
  [WHY_VOLUNTEER_KEY]: DEFAULT_WHY_VOLUNTEER,
  [LORA_LINKS_KEY]: DEFAULT_LORA_LINKS,
};

// Takes a content key from the route params and returns its current
// admin-edited value, or the default if it hasn't been edited yet. 404s
// for a key outside KNOWN_KEYS. Public.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  if (!(key in KNOWN_KEYS)) {
    return NextResponse.json({ error: "Unknown content key" }, { status: 404 });
  }
  const value = await getSiteContent(key, KNOWN_KEYS[key]);
  return NextResponse.json({ key, value });
}

// Admin-only. Takes a content key from the route params and {value} in the
// body, and overwrites that key's stored value. 404s for a key outside
// KNOWN_KEYS.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  if (!getAdminFromRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { key } = await params;
  if (!(key in KNOWN_KEYS)) {
    return NextResponse.json({ error: "Unknown content key" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body.value !== "string") {
    return NextResponse.json({ error: "value is required" }, { status: 400 });
  }

  // lora_purchase_links stores JSON, not free text - validate its shape and
  // URLs instead of accepting anything, then re-serialize the sanitized
  // (trimmed) data rather than storing the raw body verbatim.
  if (key === LORA_LINKS_KEY) {
    const result = parseLoraPurchaseLinks(body.value);
    if (!result.valid) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    const value = JSON.stringify(result.data);
    await setSiteContent(key, value);
    return NextResponse.json({ key, value });
  }

  await setSiteContent(key, body.value);
  return NextResponse.json({ key, value: body.value });
}
