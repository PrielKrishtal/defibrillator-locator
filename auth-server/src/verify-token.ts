// Express middleware that guards admin-only routes. It only checks the access
// token's signature and expiry - no DB call - which is the whole reason access
// tokens are short-lived and separate from refresh tokens.

import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, AccessTokenPayload } from "./tokens";

// Lets downstream handlers read req.admin with proper typing after this
// middleware has run.
export interface AuthedRequest extends Request {
  admin?: AccessTokenPayload;
}

export function verifyToken(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;
  // Expect "Authorization: Bearer <token>".
  if (!header || !header.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Missing or malformed Authorization header" });
  }

  const token = header.slice("Bearer ".length);
  try {
    req.admin = verifyAccessToken(token);
    next();
  } catch {
    // One 401 for both a tampered signature and a plain expired token - the
    // client's response either way is to try /refresh, then re-login.
    return res.status(401).json({ error: "Invalid or expired access token" });
  }
}
