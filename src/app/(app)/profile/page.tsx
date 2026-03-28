import { redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/profile/profile-form";

export default async function ProfilePage() {
  const supabase = await createClient();

  if (!supabase) redirect("/dashboard");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <>
      <AppHeader
        title="Profile"
        description="Manage your account details."
      />
      <div className="flex-1 px-6 py-8">
        <ProfileForm profile={profile} email={user.email ?? ""} />
      </div>
    </>
  );
}
