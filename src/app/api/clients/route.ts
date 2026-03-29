import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit/log";
import { getStaffContext } from "@/lib/auth/admin";
import { createClientSchema } from "@/lib/validation/schemas";

export async function POST(req: Request) {
  try {
    const { isStaff } = await getStaffContext();
    if (!isStaff) {
      return NextResponse.json({ error: "Only staff can create clients." }, { status: 403 });
    }

    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = createClientSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      first_name,
      last_name,
      date_of_birth,
      phone,
      email,
      address,
      demographics,
    } = parsed.data;

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
        date_of_birth: date_of_birth ?? null,
        phone: phone ?? null,
        email: email ?? null,
        address: address ?? null,
        demographics: demographics ?? {},
        created_by: user?.id ?? null,
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logAudit(supabase, {
      userId: user?.id ?? null,
      action: "create",
      tableName: "clients",
      recordId: data.id,
      payload: { first_name, last_name },
    });

    return NextResponse.json({ id: data.id });
  } catch {
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }
}
