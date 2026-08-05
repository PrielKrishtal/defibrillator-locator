// Reads every required env var once at startup - a missing secret fails
// loudly here instead of deep inside a request handler.

import "dotenv/config";

// Reads one required environment variable by name and returns its value.
// Throws if it's missing or empty, so a misconfigured deploy fails at
// startup rather than mid-request.
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
