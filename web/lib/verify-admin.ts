// Guards Next.js API routes that only an admin should reach (registrations
// management, radius/marketing-copy edits). Verifies the access token
// in-process rather than calling the auth server's /me endpoint on every
// request: a JWT signature check needs only the shared secret - no DB
// lookup, no network round-trip - which is the whole point of a short-lived
// signed access token. Both servers hold the same JWT_ACCESS_SECRET (both
// under our control), so a token the auth server signs verifies here too.
// This file must stay in sync with auth-server/src/tokens.ts's
// AccessTokenPayload shape, since both sign/verify the same token format.

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
