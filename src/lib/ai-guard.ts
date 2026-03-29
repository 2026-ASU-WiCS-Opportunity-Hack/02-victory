import { NextResponse } from "next/server";
import { getClientKey, rateLimit } from "@/lib/rate-limit";

/** Per-user or per-IP burst limit for AI endpoints (in-memory; resets per minute window). */
export function guardAiRate(req: Request, userId: string | null, maxPerMinute = 40) {
  const key = userId ? `ai:u:${userId}` : `ai:ip:${getClientKey(req)}`;
  const result = rateLimit(key, maxPerMinute);
  if (result.ok) return null;
  return NextResponse.json(
    { error: "Too many requests. Try again shortly." },
    {
      status: 429,
      headers: { "Retry-After": String(result.retryAfterSec) },
    }
  );
}
