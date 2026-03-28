import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json({ id: "demo-" + Date.now() });
    }

    let serviceTypeId: string | null = null;
    if (body.service_type) {
      const { data: typeRow } = await supabase
        .from("service_types")
        .select("id")
        .eq("name", body.service_type)
        .maybeSingle();
      serviceTypeId = typeRow?.id ?? null;
    }

    const { data, error } = await supabase
      .from("service_entries")
      .insert({
        client_id: body.client_id,
        service_type_id: serviceTypeId,
        service_date: body.service_date || new Date().toISOString(),
        duration_minutes: body.duration_minutes,
        notes: body.notes,
        ai_summary: body.ai_summary,
        ai_action_items: body.ai_action_items ?? [],
        ai_mood_risk: body.ai_mood_risk,
        source: body.source ?? "manual",
        audio_transcript: body.audio_transcript,
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ id: data.id });
  } catch {
    return NextResponse.json({ error: "Failed to save service entry" }, { status: 500 });
  }
}
