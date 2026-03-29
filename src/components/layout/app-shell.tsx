import type { ReactNode } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppMobileNav } from "@/components/layout/app-mobile-nav";
import { SkipLink } from "@/components/layout/skip-link";
import { createClient } from "@/lib/supabase/server";

export async function AppShell({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  let profile: { full_name: string; email: string; role: string; client_id?: string | null } | null =
    null;

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, email, role, client_id")
        .eq("id", user.id)
        .maybeSingle();
      profile = data;
    }
  }

  const isAdmin = !supabase || profile?.role === "admin";
  const isClientPortal = profile?.role === "client";

  return (
    <div className="flex min-h-screen items-stretch bg-background">
      <SkipLink />
      <AppSidebar profile={profile} isAdmin={isAdmin} isClientPortal={isClientPortal} />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col bg-background">
        <AppMobileNav isAdmin={isAdmin} isClientPortal={isClientPortal} />
        <main
          id="main-content"
          className="flex min-h-0 flex-1 flex-col bg-background outline-none"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
