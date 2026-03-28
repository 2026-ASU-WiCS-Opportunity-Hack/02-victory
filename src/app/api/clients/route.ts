import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { first_name, last_name, date_of_birth, phone, email, address } = body;

    if (!first_name || !last_name) {
      return NextResponse.json(
        { error: "first_name and last_name required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json({ id: crypto.randomUUID() });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("clients")
      .insert({
        first_name,
        last_name,
        date_of_birth: date_of_birth || null,
        phone: phone || null,
        email: email || null,
        address: address || null,
        demographics: body.demographics ?? {},
        created_by: user?.id ?? null,
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ id: data.id });
  } catch {
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }
}
