import { NextResponse } from "next/server";
import { runDemoSeed } from "@/lib/seed/run-demo-seed";

/**
 * Production-safe demo seed: same data as /api/dev/seed.
 * POST with header: Authorization: Bearer <SEED_SECRET> or X-Seed-Secret: <SEED_SECRET>
 * Requires SEED_SECRET and SUPABASE_SERVICE_ROLE_KEY in environment.
 * Run once after deploy so judges see populated data (or use Supabase SQL import).
 */
export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  const bearer = auth?.replace(/^Bearer\s+/i, "").trim();
  const headerSecret = req.headers.get("x-seed-secret");
  const secret = bearer || headerSecret || "";
  const expected = process.env.SEED_SECRET;

  if (!expected || secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runDemoSeed();
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({
    message: result.message,
    counts: result.counts,
    credentials: result.credentials,
  });
}
