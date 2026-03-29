import { NextResponse } from "next/server";
import { runDemoSeed } from "@/lib/seed/run-demo-seed";

/**
 * Development seed: 10+ clients and 30+ service entries for local demos.
 * POST only in development. Requires SUPABASE_SERVICE_ROLE_KEY.
 */
export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Only available in development" }, { status: 403 });
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
