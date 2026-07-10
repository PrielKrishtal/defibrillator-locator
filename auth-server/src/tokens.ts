// All JWT signing and verifying lives here so the token shapes and lifetimes
// are defined in exactly one place. Nothing else in the codebase calls
// jsonwebtoken directly.

import jwt from "jsonwebtoken";
import { config } from "./env";

// Short access-token life: if one leaks, it's only usable for 15 minutes.
// Long refresh-token life: the admin isn't forced to re-login every 15 min.
export const ACCESS_TOKEN_TTL = "15m";
export const REFRESH_TOKEN_TTL = "7d";

// Same 7 days expressed in milliseconds, reused for the cookie's maxAge and
// the refresh_tokens.expires_at column so all three agree on one number.
export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// The access token carries who the admin is, so protected routes don't need
// a DB lookup to know that. WHY adminId (not the JWT-standard "sub"): the
// jsonwebtoken types define sub as a string, and our id is a number - using
// our own claim name sidesteps that mismatch and reads more clearly.
export type AccessTokenPayload = { adminId: number; username: string };

// The refresh token carries only the admin id and a unique token id (jti).
// The jti is what the refresh_tokens table tracks for revocation.
export type RefreshTokenPayload = { adminId: number; jti: string };

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, config.jwtAccessSecret, {
    expiresIn: ACCESS_TOKEN_TTL,
  });
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, config.jwtRefreshSecret, {
    expiresIn: REFRESH_TOKEN_TTL,
  });
}

// jwt.verify throws on a bad signature or an expired token - callers wrap it
// in try/catch and answer 401. It returns `string | JwtPayload`; we always
// sign an object, so we rule out the string case before returning our shape
// (plus jsonwebtoken's own iat/exp fields, which we ignore).
export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, config.jwtAccessSecret);
  if (typeof decoded === "string") {
    throw new Error("Unexpected string token payload");
  }
  return decoded as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const decoded = jwt.verify(token, config.jwtRefreshSecret);
  if (typeof decoded === "string") {
    throw new Error("Unexpected string token payload");
  }
  return decoded as RefreshTokenPayload;
}
