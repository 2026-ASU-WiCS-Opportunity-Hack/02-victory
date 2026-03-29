import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit/log";
import { getAdminContext } from "@/lib/auth/admin";
import { serviceTypeNameSchema, serviceTypePatchSchema } from "@/lib/validation/schemas";

export async function GET() {
  const { isAdmin } = await getAdminContext();
  if (!isAdmin) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({
      items: [
        { id: "demo-1", name: "Housing navigation", is_active: true },
        { id: "demo-2", name: "Benefits enrollment", is_active: true },
      ],
    });
  }

  const { data, error } = await supabase
    .from("service_types")
    .select("id, name, is_active")
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: data ?? [] });
}

export async function POST(req: Request) {
  const { isAdmin, userId } = await getAdminContext();
  if (!isAdmin) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = serviceTypeNameSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ id: crypto.randomUUID(), name: parsed.data.name });
  }

  const { data, error } = await supabase
    .from("service_types")
    .insert({ name: parsed.data.name, is_active: true })
    .select("id, name, is_active")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAudit(supabase, {
    userId: userId ?? null,
    action: "create",
    tableName: "service_types",
    recordId: data.id,
    payload: { name: parsed.data.name },
  });

  return NextResponse.json(data);
}

export async function PATCH(req: Request) {
  const { isAdmin, userId } = await getAdminContext();
  if (!isAdmin) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = serviceTypePatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ ok: true });
  }

  const { error } = await supabase
    .from("service_types")
    .update({ is_active: parsed.data.is_active })
    .eq("id", parsed.data.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAudit(supabase, {
    userId: userId ?? null,
    action: "update",
    tableName: "service_types",
    recordId: parsed.data.id,
    payload: { is_active: parsed.data.is_active },
  });

  return NextResponse.json({ ok: true });
}
