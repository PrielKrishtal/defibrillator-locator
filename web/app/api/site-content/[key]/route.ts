// GET is public: pages render this content for every visitor. PATCH is
// admin-only: only the dashboard edits it. `key` is checked against an
// allowlist rather than accepted as-is - PATCH is already admin-gated, but
// this keeps the collection to a small, known set of real content slots
// instead of an arbitrary store any typo could add a new row to.

import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/verify-admin";
import {
  getSiteContent,
  setSiteContent,
  HOMEPAGE_INTRO_KEY,
  DEFAULT_HOMEPAGE_INTRO,
} from "@/lib/site-content";

// WHY a map of key -> default: Phase 9 adds more marketing-copy keys later:
// each one just needs an entry here, nothing else about this route changes.
const KNOWN_KEYS: Record<string, string> = {
  [HOMEPAGE_INTRO_KEY]: DEFAULT_HOMEPAGE_INTRO,
};

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

  await setSiteContent(key, body.value);
  return NextResponse.json({ key, value: body.value });
}
