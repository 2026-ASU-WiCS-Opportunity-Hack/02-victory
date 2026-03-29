/**
 * Simple in-memory rate limiter for serverless-friendly bursts (not distributed).
 * Keyed by IP or user id; window sliding ~1 minute.
 */

const buckets = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60_000;
const DEFAULT_MAX = 30;

export function rateLimit(
  key: string,
  max: number = DEFAULT_MAX
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now > b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true };
  }
  if (b.count >= max) {
    return { ok: false, retryAfterSec: Math.ceil((b.resetAt - now) / 1000) };
  }
  b.count += 1;
  return { ok: true };
}

export function getClientKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() ?? "unknown";
  return req.headers.get("x-real-ip") ?? "unknown";
}
