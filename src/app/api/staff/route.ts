import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStaffContext } from "@/lib/auth/admin";

/**
 * Team directory for service logging: admin + staff profiles (name + email).
 */
export async function GET() {
  const { isStaff, userId } = await getStaffContext();
  if (!isStaff) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({
      staff: [
        {
          id: "00000000-0000-0000-0000-000000000001",
          full_name: "Demo Staff",
          email: "staff@demo.local",
          role: "staff",
        },
      ],
      currentUserId: null,
    });
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .in("role", ["admin", "staff"])
    .order("full_name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    staff: data ?? [],
    currentUserId: userId,
  });
}
