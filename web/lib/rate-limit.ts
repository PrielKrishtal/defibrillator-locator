// Minimal in-memory rate limiter, hand-rolled since express-rate-limit only
// attaches to an Express app, not a Next.js Route Handler. In-memory Map is
// fine for this single-instance project; wouldn't work behind a load balancer.

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
