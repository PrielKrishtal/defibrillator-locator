// POST is public (§6/§2: no password for a public registrant). GET is
// admin-only: the dashboard's registrations list.

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAdminFromRequest } from "@/lib/verify-admin";
import { parseRegistration } from "@/lib/validate-registration";
import { isRateLimited } from "@/lib/rate-limit";

// 5/min: no legitimate visitor submits this more than a couple times a
// minute - blocks scripted spam without needing a CAPTCHA.
const REGISTER_MAX_REQUESTS = 5;
const REGISTER_WINDOW_MS = 60 * 1000;

export async function POST(req: NextRequest) {
  // x-forwarded-for: the proxy in front records the real client IP here,
  // first entry if there are several hops. "unknown" is the local-dev fallback.
  const forwardedFor = req.headers.get("x-forwarded-for");
  const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "unknown";
  if (isRateLimited(ip, REGISTER_MAX_REQUESTS, REGISTER_WINDOW_MS)) {
    return NextResponse.json(
      { error: "Too many requests, try again shortly" },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = parseRegistration(body);
  if (!result.valid) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  const { firstName, lastName, mobile, loraId, hasDefibrillator, hasLora } =
    result.data;

  const { error } = await supabase.from("registrations").insert({
    first_name: firstName,
    last_name: lastName || null,
    mobile,
    lora_id: hasLora ? loraId || null : null,
    has_defibrillator: hasDefibrillator,
    has_lora: hasLora,
  });

  if (error) {
    // WHY log the real error but return a generic one: error.message from
    // Supabase can include internal detail (column/constraint names) that
    // has no business reaching an anonymous caller of a public endpoint.
    console.error("Failed to insert registration:", error.message);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function GET(req: NextRequest) {
  if (!getAdminFromRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("registrations")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to list registrations:", error.message);
    return NextResponse.json(
      { error: "Failed to load registrations" },
      { status: 500 }
    );
  }
  return NextResponse.json({ registrations: data });
}
