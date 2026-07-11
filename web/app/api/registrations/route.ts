// POST is the public registration endpoint (§6: "POST /api/registrations -
// write to Supabase"), reachable by anyone, no login required - that's the
// assignment's own rule ("no password required for a public registrant").
// GET is admin-only: the dashboard's registrations list.

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAdminFromRequest } from "@/lib/verify-admin";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { firstName, lastName, mobile, loraId, hasDefibrillator, hasLora } =
    body;

  if (!firstName || typeof firstName !== "string") {
    return NextResponse.json(
      { error: "firstName is required" },
      { status: 400 }
    );
  }
  if (!mobile || typeof mobile !== "string") {
    return NextResponse.json(
      { error: "mobile is required" },
      { status: 400 }
    );
  }
  // WHY this check: §2's eligibility rule is "defibrillator owner (with or
  // without LoRa) OR LoRa-only owner" - someone with neither isn't a valid
  // registrant for this system.
  if (!hasDefibrillator && !hasLora) {
    return NextResponse.json(
      { error: "Must have a defibrillator, a LoRa device, or both" },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("registrations").insert({
    first_name: firstName,
    last_name: lastName || null,
    mobile,
    lora_id: hasLora ? loraId || null : null,
    has_defibrillator: Boolean(hasDefibrillator),
    has_lora: Boolean(hasLora),
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
