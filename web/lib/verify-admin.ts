// Guards Next.js API routes that only an admin should reach (registrations
// management, radius/marketing-copy edits). Verifies the access token
// in-process instead of calling the auth server's /me endpoint - see
// DEFIBRILLATOR_PROJECT_BRIEF.md §11 (2026-07-11) for why. This file must
// stay in sync with auth-server/src/tokens.ts's AccessTokenPayload shape,
// since both servers sign/verify the same token format with the same secret.

import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

const jwtAccessSecret = process.env.JWT_ACCESS_SECRET;
if (!jwtAccessSecret) {
  throw new Error("Missing JWT_ACCESS_SECRET in web/.env");
}

export type AdminPayload = { adminId: number; username: string };

// Returns the decoded admin payload if the request carries a valid,
// unexpired access token, or null otherwise. Never throws - callers just
// check for null and respond 401.
export function getAdminFromRequest(req: NextRequest): AdminPayload | null {
  const header = req.headers.get("authorization");
  if (!header || !header.startsWith("Bearer ")) {
    return null;
  }
  const token = header.slice("Bearer ".length);
  try {
    const decoded = jwt.verify(token, jwtAccessSecret as string);
    if (typeof decoded === "string") {
      return null;
    }
    return decoded as AdminPayload;
  } catch {
    return null;
  }
}
