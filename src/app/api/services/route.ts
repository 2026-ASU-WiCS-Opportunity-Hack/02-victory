import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const body = await req.json();
  const {
    client_id,
    service_type_name,
    service_date,
    duration_minutes,
    notes,
    ai_summary,
    ai_action_items,
    ai_mood_risk,
    source,
    audio_transcript,
  } = body;

  if (!client_id || !service_date) {
    return NextResponse.json({ error: "client_id and service_date required" }, { status: 400 });
  }

  const supabase = await createClient();

  if (!supabase) {
    return NextResponse.json({ id: crypto.randomUUID() });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Resolve service type name → id
  let service_type_id: string | null = null;
  if (service_type_name) {
    const { data: st } = await supabase
      .from("service_types")
      .select("id")
      .eq("name", service_type_name)
      .single();
    service_type_id = st?.id ?? null;
  }

  const { data, error } = await supabase
    .from("service_entries")
    .insert({
      client_id,
      service_type_id,
      staff_id: user?.id ?? null,
      service_date,
      duration_minutes: duration_minutes ?? null,
      notes: notes || null,
      ai_summary: ai_summary || null,
      ai_action_items: ai_action_items ?? [],
      ai_mood_risk: ai_mood_risk || null,
      source: source ?? "manual",
      audio_transcript: audio_transcript || null,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}
