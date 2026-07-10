// Loads and validates every environment variable the auth server needs,
// once, at startup. Reading process.env in one place (instead of scattered
// through the code) means a missing secret fails loudly here on boot rather
// than as a confusing error deep inside a request handler.

import "dotenv/config";

// WHY: throw immediately if a required var is missing, so a misconfigured
// deploy never starts up half-working (e.g. issuing tokens with an undefined
// secret, which jsonwebtoken would happily do).
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 4000),
  supabaseUrl: required("SUPABASE_URL"),
  supabaseServiceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY"),
  // Two separate secrets so a leak of the access-token secret can't be used
  // to forge refresh tokens, and vice versa.
  jwtAccessSecret: required("JWT_ACCESS_SECRET"),
  jwtRefreshSecret: required("JWT_REFRESH_SECRET"),
  // Only this origin (the Next.js app) may call the auth server.
  webAppOrigin: required("WEB_APP_ORIGIN"),
  // Drives the cookie's Secure/SameSite flags: locally the frontend and auth
  // server are same-site over http, in production they're cross-site over https.
  isProduction: process.env.NODE_ENV === "production",
};
