import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { DEMO_CLIENT_IDS, demoClients, demoServiceEntries } from "@/lib/data/demo";
import type { ServiceEntry } from "@/types";

/** Published test accounts for judges / QA (seed resets passwords to these values). */
export const SEED_TEST_CREDENTIALS = {
  staff: { email: "test@victory.app", password: "Test1234!" },
  admin: { email: "admin@casemanager.com", password: "Admin123!" },
  client: { email: "maria.santos@email.example", password: "Client123!" },
} as const;

export type DemoSeedResult =
  | {
      ok: true;
      message: string;
      counts: { clients: number; service_entries: number };
      credentials: typeof SEED_TEST_CREDENTIALS;
    }
  | { ok: false; error: string };

/** Auth admin listUsers is paginated (default 50/page). Scan all pages so seeded emails are always found. */
async function findUserIdByEmail(
  supabase: SupabaseClient,
  email: string
): Promise<string | undefined> {
  const normalized = email.trim().toLowerCase();
  let page = 1;
  const perPage = 1000;
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(error.message);
    const users = data?.users ?? [];
    const found = users.find((u) => u.email?.toLowerCase() === normalized);
    if (found) return found.id;
    if (users.length < perPage) break;
    page += 1;
  }
  return undefined;
}

async function ensureUserWithProfile(
  supabase: SupabaseClient,
  opts: {
    email: string;
    password: string;
    fullName: string;
    role: "admin" | "staff" | "client";
    clientId?: string | null;
  }
): Promise<string | undefined> {
  const { email, password, fullName, role, clientId } = opts;

  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    email,
    password,
    user_metadata: { full_name: fullName },
    email_confirm: true,
  });

  let userId: string | undefined;

  if (userError) {
    userId = await findUserIdByEmail(supabase, email);
    if (!userId) {
      throw new Error(
        `${userError.message} (no matching auth user after paginated lookup — check service role and Auth logs.)`
      );
    }
  } else {
    userId = userData?.user?.id;
  }

  if (userId) {
    const { error: pwErr } = await supabase.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
    });
    if (pwErr) throw new Error(pwErr.message);

    const row = {
      id: userId,
      full_name: fullName,
      email,
      role,
      client_id: clientId ?? null,
    };
    const { error: upErr } = await supabase.from("profiles").upsert(row as never, { onConflict: "id" });
    if (upErr) throw new Error(upErr.message);
  }

  return userId;
}

/**
 * Seeds demo clients + service entries (10+ clients, 30+ visits) and test users:
 * staff, admin, and portal client (Maria Santos).
 * Requires SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL.
 */
export async function runDemoSeed(): Promise<DemoSeedResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return { ok: false, error: "Supabase not configured" };
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    await ensureUserWithProfile(supabase, {
      email: SEED_TEST_CREDENTIALS.admin.email,
      password: SEED_TEST_CREDENTIALS.admin.password,
      fullName: "Demo Admin",
      role: "admin",
      clientId: null,
    });

    const userId = await ensureUserWithProfile(supabase, {
      email: SEED_TEST_CREDENTIALS.staff.email,
      password: SEED_TEST_CREDENTIALS.staff.password,
      fullName: "Test Staff",
      role: "staff",
      clientId: null,
    });

    await supabase.from("service_types").upsert(
      [
        { name: "Housing navigation", is_active: true },
        { name: "Benefits enrollment", is_active: true },
        { name: "Mental health referral", is_active: true },
        { name: "Food assistance", is_active: true },
        { name: "Employment coaching", is_active: true },
      ],
      { onConflict: "name", ignoreDuplicates: true }
    );

    const { data: types } = await supabase.from("service_types").select("id, name");
    const typeMap = Object.fromEntries((types ?? []).map((t) => [t.name, t.id]));

    const clientRows = demoClients.map((c) => ({
      id: c.id,
      first_name: c.first_name,
      last_name: c.last_name,
      date_of_birth: c.date_of_birth,
      phone: c.phone,
      email: c.email,
      address: c.address,
      demographics: c.demographics ?? {},
      created_by: userId ?? null,
    }));

    const { error: clientErr } = await supabase.from("clients").upsert(clientRows, {
      onConflict: "id",
    });

    if (clientErr) {
      return { ok: false, error: clientErr.message };
    }

    await ensureUserWithProfile(supabase, {
      email: SEED_TEST_CREDENTIALS.client.email,
      password: SEED_TEST_CREDENTIALS.client.password,
      fullName: "Maria Santos",
      role: "client",
      clientId: DEMO_CLIENT_IDS.maria,
    });

    const clientIds = demoClients.map((c) => c.id);
    await supabase.from("service_entries").delete().in("client_id", clientIds);

    function entryToRow(e: ServiceEntry) {
      const typeName = e.service_types?.name;
      return {
        id: e.id,
        client_id: e.client_id,
        service_type_id: typeName ? typeMap[typeName] ?? null : null,
        staff_id: userId ?? null,
        service_date: e.service_date,
        duration_minutes: e.duration_minutes,
        notes: e.notes,
        ai_summary: e.ai_summary,
        ai_action_items: e.ai_action_items ?? [],
        ai_mood_risk: e.ai_mood_risk,
        source: e.source ?? "manual",
        audio_transcript: e.audio_transcript,
      };
    }

    const rows = demoServiceEntries.map(entryToRow);

    const typeNames = [
      "Housing navigation",
      "Benefits enrollment",
      "Mental health referral",
      "Food assistance",
      "Employment coaching",
    ];
    const notesTemplate = [
      "Quarterly check-in; goals reviewed.",
      "Resource referral and follow-up scheduled.",
      "Transportation assistance coordinated.",
      "Benefits paperwork assistance.",
      "Group workshop attendance.",
      "Phone intake follow-up.",
      "Home visit — safety plan reviewed.",
      "Partner agency warm handoff.",
    ];

    for (let i = 0; i < 18; i++) {
      const c = demoClients[i % demoClients.length];
      const t = typeNames[i % typeNames.length];
      const suffix = String(16 + i).padStart(12, "0");
      const id = `e1000000-0000-4000-8000-${suffix}`;
      const daysAgo = 20 + (i % 60);
      rows.push({
        id,
        client_id: c.id,
        service_type_id: typeMap[t] ?? null,
        staff_id: userId ?? null,
        service_date: new Date(Date.now() - 86400000 * daysAgo).toISOString(),
        duration_minutes: 30 + (i % 5) * 5,
        notes: notesTemplate[i % notesTemplate.length],
        ai_summary: null,
        ai_action_items: [],
        ai_mood_risk: null,
        source: "manual",
        audio_transcript: null,
      });
    }

    const { error: insErr } = await supabase.from("service_entries").insert(rows);
    if (insErr) {
      return { ok: false, error: insErr.message };
    }

    return {
      ok: true,
      message: "Seed complete (10 clients, 33+ service entries; admin, staff, client test users)",
      counts: { clients: demoClients.length, service_entries: rows.length },
      credentials: SEED_TEST_CREDENTIALS,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}
