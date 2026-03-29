"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileBarChart,
  Sparkles,
  LogOut,
  UserCircle,
  CalendarDays,
  ScrollText,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/lib/button-variants";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";

interface AppSidebarProps {
  profile: { full_name: string; email: string; role: string } | null;
  isAdmin?: boolean;
}

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/reports", label: "Reports", icon: FileBarChart },
];

const adminNav = [
  { href: "/admin/audit", label: "Audit log", icon: ScrollText },
  { href: "/admin/fields", label: "Custom fields", icon: SlidersHorizontal },
];

export function AppSidebar({ profile, isAdmin }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    if (supabase) await supabase.auth.signOut();
    router.push("/");
  }

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "CM";

  return (
    <aside className="no-print hidden min-h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
      <div className="flex items-center gap-2 px-4 py-5">
        <div className="flex size-9 items-center justify-center rounded-lg bg-sidebar-primary/15 text-sidebar-primary">
          <Sparkles className="size-5" aria-hidden />
        </div>
        <div>
          <p className="font-heading text-lg leading-tight tracking-tight text-sidebar-foreground">
            Victory
          </p>
        </div>
      </div>

      <Separator className="bg-sidebar-border" />

      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        {nav.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                buttonVariants({
                  variant: active ? "secondary" : "ghost",
                  size: "default",
                  className: "w-full justify-start gap-2 text-sidebar-foreground",
                }),
                active &&
                  "bg-sidebar-accent text-sidebar-accent-foreground border border-sidebar-border"
              )}
            >
              <Icon className="size-4 shrink-0 opacity-90" />
              {label}
            </Link>
          );
        })}
        {isAdmin &&
          adminNav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  buttonVariants({
                    variant: active ? "secondary" : "ghost",
                    size: "default",
                    className: "w-full justify-start gap-2 text-sidebar-foreground",
                  }),
                  active &&
                    "bg-sidebar-accent text-sidebar-accent-foreground border border-sidebar-border"
                )}
              >
                <Icon className="size-4 shrink-0 opacity-90" />
                {label}
              </Link>
            );
          })}
      </nav>

      <div className="mt-auto border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/50 px-2 py-2">
          <Avatar className="size-9 border border-sidebar-border">
            <AvatarFallback className="bg-sidebar-primary/20 text-xs font-medium text-sidebar-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 overflow-hidden">
            <p className="text-sm font-medium leading-snug break-words">
              {profile?.full_name ?? "Case Manager"}
            </p>
            <p className="text-xs capitalize text-muted-foreground">
              {profile?.role ?? "Staff"}
            </p>
          </div>
          <div className="flex gap-1">
            <Link
              href="/profile"
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "text-sidebar-foreground"
              )}
              title="Profile"
            >
              <UserCircle className="size-4" />
            </Link>
            <button
              onClick={handleSignOut}
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "text-sidebar-foreground"
              )}
              title="Sign out"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
