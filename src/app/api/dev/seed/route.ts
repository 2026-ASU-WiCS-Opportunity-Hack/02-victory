import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Only available in development" }, { status: 403 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1. Create test user (service role bypasses trigger issues)
  let userId: string | undefined;

  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    email: "test@victory.app",
    password: "Test1234!",
    user_metadata: { full_name: "Test Staff" },
    email_confirm: true,
  });

  if (userError) {
    // User may exist already — look them up and reset password
    const { data: list } = await supabase.auth.admin.listUsers();
    const existing = list?.users?.find((u) => u.email === "test@victory.app");
    userId = existing?.id;
    if (!userId) {
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }
    // Reset password and confirm email on the existing user
    await supabase.auth.admin.updateUserById(userId, {
      password: "Test1234!",
      email_confirm: true,
    });
  } else {
    userId = userData?.user?.id;
  }

  // 2. Manually upsert the profile (service role bypasses RLS + trigger)
  if (userId) {
    await supabase.from("profiles").upsert(
      { id: userId, full_name: "Test Staff", email: "test@victory.app", role: "staff" },
      { onConflict: "id", ignoreDuplicates: true }
    );
  }

  // 3. Seed service types
  await supabase.from("service_types").upsert(
    [
      { name: "Housing navigation" },
      { name: "Benefits enrollment" },
      { name: "Mental health referral" },
      { name: "Food assistance" },
      { name: "Employment coaching" },
    ],
    { onConflict: "name", ignoreDuplicates: true }
  );

  // 4. Seed sample clients
  const { data: clients } = await supabase
    .from("clients")
    .upsert(
      [
        {
          first_name: "Maria",
          last_name: "Santos",
          date_of_birth: "1988-04-12",
          phone: "(555) 201-4490",
          email: "maria.santos@email.example",
          address: "142 Oak St, Springfield",
          demographics: { language: "ES/EN", household: 3 },
          created_by: userId ?? null,
        },
        {
          first_name: "James",
          last_name: "Okonkwo",
          date_of_birth: "1992-11-03",
          phone: "(555) 310-7721",
          email: "j.okonkwo@email.example",
          address: "9 River Rd, Springfield",
          demographics: { veteran: false, employment: "seeking" },
          created_by: userId ?? null,
        },
        {
          first_name: "Aisha",
          last_name: "Rahman",
          date_of_birth: "1995-07-21",
          phone: "(555) 884-1022",
          email: "a.rahman@email.example",
          address: "Unit 4B, Maple Commons",
          demographics: { language: "EN/BN", referral: "school" },
          created_by: userId ?? null,
        },
      ],
      { onConflict: "email", ignoreDuplicates: true }
    )
    .select("id, email");

  // 5. Seed service entries
  if (clients && clients.length > 0) {
    const { data: types } = await supabase.from("service_types").select("id, name");
    const typeMap = Object.fromEntries((types ?? []).map((t) => [t.name, t.id]));
    const maria = clients.find((c) => c.email === "maria.santos@email.example");
    const james = clients.find((c) => c.email === "j.okonkwo@email.example");

    const entries = [];
    if (maria) {
      entries.push(
        {
          client_id: maria.id,
          service_type_id: typeMap["Housing navigation"] ?? null,
          staff_id: userId ?? null,
          service_date: new Date(Date.now() - 86400000 * 2).toISOString(),
          duration_minutes: 45,
          notes: "Follow-up on rental application; landlord requested pay stubs.",
          source: "manual",
        },
        {
          client_id: maria.id,
          service_type_id: typeMap["Housing navigation"] ?? null,
          staff_id: userId ?? null,
          service_date: new Date(Date.now() - 86400000 * 9).toISOString(),
          duration_minutes: 30,
          notes: "Initial intake completed; goals set for stable housing.",
          source: "voice",
          audio_transcript: "Client described current living situation and housing goals.",
        }
      );
    }
    if (james) {
      entries.push({
        client_id: james.id,
        service_type_id: typeMap["Employment coaching"] ?? null,
        staff_id: userId ?? null,
        service_date: new Date(Date.now() - 86400000 * 2).toISOString(),
        duration_minutes: 60,
        notes: "Resume workshop; scheduled interview prep next week.",
        source: "manual",
      });
    }

    if (entries.length > 0) {
      await supabase.from("service_entries").insert(entries);
    }
  }

  return NextResponse.json({
    message: "Seed complete",
    credentials: { email: "test@victory.app", password: "Test1234!" },
  });
}
