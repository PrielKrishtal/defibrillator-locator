// Guards admin-only Next.js API routes. Verifies the access token
// in-process (signature check only, no DB/network call) instead of calling
// auth-server's /me - both servers share JWT_ACCESS_SECRET. Must stay in
// sync with auth-server/src/tokens.ts's AccessTokenPayload shape.

import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

const jwtAccessSecret = process.env.JWT_ACCESS_SECRET;
if (!jwtAccessSecret) {
  throw new Error("Missing JWT_ACCESS_SECRET in web/.env");
}

export type AdminPayload = { adminId: number; username: string };

// Takes a Next.js request and returns the decoded admin payload if its
// Authorization header carries a valid, unexpired access token, or null
// otherwise. Never throws - callers just check for null and respond 401.
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
