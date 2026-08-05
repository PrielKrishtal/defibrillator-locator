// Minimal in-memory rate limiter, hand-rolled since express-rate-limit only
// attaches to an Express app, not a Next.js Route Handler. In-memory Map is
// fine for this single-instance project; wouldn't work behind a load balancer.

type RateLimitEntry = { count: number; resetAt: number };

const requestLog = new Map<string, RateLimitEntry>();

// Takes a key (e.g. an IP address), a max request count, and a window in
// milliseconds. Records this call against that key and returns true if the
// key has now exceeded maxRequests within the current window.
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
