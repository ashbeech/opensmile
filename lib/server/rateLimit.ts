// Simple in-memory rate limiter for MVP
// Replace with Upstash Redis (@upstash/ratelimit) for production
import "server-only";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimits = new Map<string, RateLimitEntry>();

// Cleanup expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimits.entries()) {
    if (now > entry.resetAt) {
      rateLimits.delete(key);
    }
  }
}, 60_000); // every minute

/**
 * Check if a request should be rate limited.
 * Returns true if allowed, false if rate limited.
 */
export function checkRateLimit(
  key: string,
  max: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const limit = rateLimits.get(key);

  if (!limit || now > limit.resetAt) {
    rateLimits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (limit.count >= max) {
    return false;
  }

  limit.count++;
  return true;
}

// Pre-configured rate limiters per spec
export const RATE_LIMITS = {
  /** Login: 5 attempts per 15 minutes per IP */
  login: (ip: string) => checkRateLimit(`login:${ip}`, 5, 15 * 60 * 1000),
  /** Password reset: 3 per hour per email */
  passwordReset: (email: string) =>
    checkRateLimit(`pwd-reset:${email}`, 3, 60 * 60 * 1000),
  /** Sign-up: 10 per hour per IP */
  signUp: (ip: string) => checkRateLimit(`signup:${ip}`, 10, 60 * 60 * 1000),
  /** Lead search: 100 per hour per user */
  leadSearch: (userId: string) =>
    checkRateLimit(`lead-search:${userId}`, 100, 60 * 60 * 1000),
  /** Data export: 10 per day per user */
  dataExport: (userId: string) =>
    checkRateLimit(`export:${userId}`, 10, 24 * 60 * 60 * 1000),
  /** AI context: 60 per hour per user */
  aiContext: (userId: string) =>
    checkRateLimit(`ai:${userId}`, 60, 60 * 60 * 1000),
  /** Webhook: 100 per minute per IP */
  webhook: (ip: string) => checkRateLimit(`webhook:${ip}`, 100, 60 * 1000),
} as const;
