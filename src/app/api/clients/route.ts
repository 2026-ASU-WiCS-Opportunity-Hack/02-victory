import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json({ id: "demo-" + Date.now() });
    }

    const { data, error } = await supabase
      .from("clients")
      .insert({
        first_name: body.first_name,
        last_name: body.last_name,
        date_of_birth: body.date_of_birth,
        phone: body.phone,
        email: body.email,
        address: body.address,
        demographics: body.demographics ?? {},
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
