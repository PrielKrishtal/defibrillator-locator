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

// adminId, not the JWT-standard "sub": sub is typed as a string and our id
// is a number - our own claim name sidesteps that mismatch.
export type AccessTokenPayload = { adminId: number; username: string };

// The refresh token carries only the admin id and a unique token id (jti).
// The jti is what the refresh_tokens table tracks for revocation.
export type RefreshTokenPayload = { adminId: number; jti: string };

// Takes an admin's id and username and returns a signed access token,
// valid for 15 minutes.
export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, config.jwtAccessSecret, {
    expiresIn: ACCESS_TOKEN_TTL,
  });
}

// Takes an admin's id and a unique token id (jti) and returns a signed
// refresh token, valid for 7 days.
export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, config.jwtRefreshSecret, {
    expiresIn: REFRESH_TOKEN_TTL,
  });
}

// Takes a raw access token string, verifies its signature and expiry, and
// returns the decoded {adminId, username} payload. Throws on a bad
// signature or an expired token.
export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, config.jwtAccessSecret);
  if (typeof decoded === "string") {
    throw new Error("Unexpected string token payload");
  }
  return decoded as AccessTokenPayload;
}

// Takes a raw refresh token string, verifies its signature and expiry, and
// returns the decoded {adminId, jti} payload. Throws on a bad signature or
// an expired token.
export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const decoded = jwt.verify(token, config.jwtRefreshSecret);
  if (typeof decoded === "string") {
    throw new Error("Unexpected string token payload");
  }
  return decoded as RefreshTokenPayload;
}
