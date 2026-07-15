// A minimal in-memory rate limiter. WHY hand-rolled instead of a library
// like express-rate-limit: that library only attaches to a real Express
// app, and this is a Next.js Route Handler (a different runtime with no
// Express middleware chain) - a small self-contained version avoids
// pulling in a mismatched dependency for one endpoint.
//
// WHY in-memory, not a shared store: this is a single-instance course
// project, not a multi-server production deployment. A plain Map is simple
// to explain and resets harmlessly on redeploy - it just wouldn't work
// correctly if the app ever ran as multiple server instances behind a load
// balancer, which is a real limitation, not a concern here.

type RateLimitEntry = { count: number; resetAt: number };

const requestLog = new Map<string, RateLimitEntry>();

// Returns true if `key` (e.g. an IP address) has made more than
// `maxRequests` requests within the last `windowMs` milliseconds. Each call
// counts as one request, whether or not it turns out to be over the limit.
export function isRateLimited(
  key: string,
  maxRequests: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const entry = requestLog.get(key);

  // No record yet, or the previous window has expired: start a fresh count.
  if (!entry || now > entry.resetAt) {
    requestLog.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  entry.count += 1;
  return entry.count > maxRequests;
}
