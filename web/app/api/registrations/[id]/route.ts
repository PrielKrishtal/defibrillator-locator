// Admin-only: remove a single registration. Deleting is the "basic
// registration-DB management" §2 asks for - no edit-in-place, since the
// assignment doesn't require changing a registrant's own submitted details.

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAdminFromRequest } from "@/lib/verify-admin";

export async function DELETE(
  req: NextRequest,
  // WHY params is a Promise: Next.js 16 made all dynamic route params async
  // - see DEFIBRILLATOR_PROJECT_BRIEF.md §11 (2026-07-10, Next.js 16 entry).
  { params }: { params: Promise<{ id: string }> }
) {
  if (!getAdminFromRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { error } = await supabase
    .from("registrations")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
