// The three auth endpoints: login, refresh, logout. This is the whole public
// surface of the auth server (plus /me and /health wired up in index.ts).

import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import crypto from "node:crypto";
import { supabase } from "./supabase";
import { config } from "./env";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  REFRESH_TOKEN_TTL_MS,
} from "./tokens";
import {
  storeJti,
  isJtiValid,
  deleteJti,
  deleteExpiredForAdmin,
} from "./refresh-store";

export const authRouter = Router();

// The refresh token lives in this cookie. Named once here so login (set),
// refresh (read) and logout (clear) can't drift apart.
const REFRESH_COOKIE_NAME = "refreshToken";

// Cookie flags in one place. httpOnly keeps the refresh token out of reach of
// page JavaScript (so an XSS bug can't read it). Secure + SameSite=None are
// required for the cross-site prod setup (Vercel frontend -> Render backend);
// locally the two are same-site over http, where Lax + non-Secure is correct.
function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: config.isProduction ? ("none" as const) : ("lax" as const),
    maxAge: REFRESH_TOKEN_TTL_MS,
    path: "/",
  };
}

authRouter.post("/login", async (req: Request, res: Response) => {
  const { username, password } = req.body ?? {};
  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "username and password are required" });
  }

  const { data: admin, error } = await supabase
    .from("admins")
    .select("id, username, password_hash")
    .eq("username", username)
    .maybeSingle();

  // WHY the same 401 for "no such user" and "wrong password": if the two
  // differed, an attacker could probe which usernames exist. bcrypt.compare
  // is only reached once we have a real hash to compare against.
  if (error || !admin) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const passwordMatches = await bcrypt.compare(password, admin.password_hash);
  if (!passwordMatches) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  // Tidy this admin's expired token rows before issuing a fresh one.
  await deleteExpiredForAdmin(admin.id);

  // crypto.randomUUID gives a unique id for this specific refresh token, so
  // it can be revoked individually without affecting other sessions.
  const jti = crypto.randomUUID();
  const accessToken = signAccessToken({
    adminId: admin.id,
    username: admin.username,
  });
  const refreshToken = signRefreshToken({ adminId: admin.id, jti });
  await storeJti(admin.id, jti, new Date(Date.now() + REFRESH_TOKEN_TTL_MS));

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());
  // Access token goes in the body -> the frontend holds it in memory. The
  // refresh token is never exposed to JS; it rides in the httpOnly cookie.
  return res.json({ accessToken });
});

authRouter.post("/refresh", async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ error: "No refresh token" });
  }

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    return res
      .status(401)
      .json({ error: "Invalid or expired refresh token" });
  }

  // Signature checks out, but the token may have been revoked at logout -
  // its jti must still be in the store.
  const stillValid = await isJtiValid(payload.jti);
  if (!stillValid) {
    return res.status(401).json({ error: "Refresh token has been revoked" });
  }

  // Look the admin up by id so the new access token's username is authoritative
  // (rather than trusting a username copied into the refresh token).
  const { data: admin, error } = await supabase
    .from("admins")
    .select("id, username")
    .eq("id", payload.adminId)
    .maybeSingle();
  if (error || !admin) {
    return res.status(401).json({ error: "Admin no longer exists" });
  }

  const accessToken = signAccessToken({
    adminId: admin.id,
    username: admin.username,
  });
  return res.json({ accessToken });
});

authRouter.post("/logout", async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  if (token) {
    try {
      // Revoke by deleting the jti - after this the refresh token is dead
      // even though its signature and expiry are still fine.
      const payload = verifyRefreshToken(token);
      await deleteJti(payload.jti);
    } catch {
      // Token already invalid/expired: nothing to revoke, just clear the cookie.
    }
  }
  // clearCookie must be given the same flags the cookie was set with, or the
  // browser won't match and remove it.
  res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions());
  return res.status(204).send();
});
