import type { SupabaseClient, User } from "@supabase/supabase-js";

/**
 * If auth exists but public.profiles has no row (e.g. before trigger was added), insert a staff row.
 * Safe: only inserts when missing; uses RLS policy profiles_insert_own (role staff).
 */
export async function ensureProfileRow(supabase: SupabaseClient, user: User) {
  const { data: existing, error: selErr } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (selErr) return { error: selErr };
  if (existing) return { ok: true as const };

  const fullName =
    (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()) ||
    (user.email ? user.email.split("@")[0] : "User");

  const { error: insErr } = await supabase.from("profiles").insert({
    id: user.id,
    email: user.email ?? "",
    full_name: fullName,
    role: "staff",
  });

  if (insErr) return { error: insErr };
  return { ok: true as const };
}
