import { createClient } from "@/lib/supabase/server";

export type AppRole = "admin" | "staff" | "client";

/** Full role + portal link for layout and middleware-style checks. */
export async function getRoleContext(): Promise<{
  role: AppRole | null;
  clientId: string | null;
  isStaff: boolean;
  isClient: boolean;
  userId: string | null;
}> {
  const supabase = await createClient();
  if (!supabase) {
    return {
      role: null,
      clientId: null,
      isStaff: true,
      isClient: false,
      userId: null,
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      role: null,
      clientId: null,
      isStaff: false,
      isClient: false,
      userId: null,
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, client_id")
    .eq("id", user.id)
    .maybeSingle();

  const role = (profile?.role as AppRole | undefined) ?? null;
  const isClient = role === "client";
  const isStaff = role === "admin" || role === "staff";

  return {
    role,
    clientId: (profile?.client_id as string | null) ?? null,
    isStaff,
    isClient,
    userId: user.id,
  };
}

export async function getAdminContext(): Promise<{
  isAdmin: boolean;
  userId: string | null;
}> {
  const supabase = await createClient();
  if (!supabase) {
    return { isAdmin: true, userId: null };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { isAdmin: false, userId: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  return {
    isAdmin: profile?.role === "admin",
    userId: user.id,
  };
}

/** Returns true for both `admin` and `staff` roles. Use to guard pages / API routes
 *  that should be visible to all authenticated team members. */
export async function getStaffContext(): Promise<{
  isStaff: boolean;
  isAdmin: boolean;
  userId: string | null;
}> {
  const supabase = await createClient();
  if (!supabase) {
    return { isStaff: true, isAdmin: true, userId: null };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { isStaff: false, isAdmin: false, userId: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const isAdmin = profile?.role === "admin";
  const isStaff = isAdmin || profile?.role === "staff";

  return { isStaff, isAdmin, userId: user.id };
}

