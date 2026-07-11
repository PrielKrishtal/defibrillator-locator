// GET is public: the incident page (Phase 7) needs the current radius
// without requiring admin login. PATCH is admin-only: only the dashboard
// changes it.

import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/verify-admin";
import { getRadiusMeters, setRadiusMeters } from "@/lib/site-content";

export async function GET() {
  const radiusMeters = await getRadiusMeters();
  return NextResponse.json({ radiusMeters });
}

export async function PATCH(req: NextRequest) {
  if (!getAdminFromRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const radiusMeters = Number(body?.radiusMeters);
  if (!Number.isFinite(radiusMeters) || radiusMeters <= 0) {
    return NextResponse.json(
      { error: "radiusMeters must be a positive number" },
      { status: 400 }
    );
  }

  await setRadiusMeters(radiusMeters);
  return NextResponse.json({ radiusMeters });
}
