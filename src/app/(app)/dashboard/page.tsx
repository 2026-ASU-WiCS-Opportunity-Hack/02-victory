import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardPrintToolbar } from "@/components/dashboard/dashboard-print-toolbar";
import { UpcomingReminders } from "@/components/dashboard/upcoming-reminders";
import { getDashboardStats, getUpcomingAppointmentReminders } from "@/lib/data/queries";
import { buttonVariants } from "@/lib/button-variants";
import { UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  // Load initial stats (last 90 days matches the shell's default preset)
  const defaultEnd = new Date();
  const defaultStart = new Date(Date.now() - 90 * 86400000);

  const [stats, reminders] = await Promise.all([
    getDashboardStats(defaultStart, defaultEnd),
    getUpcomingAppointmentReminders(72),
  ]);

  return (
    <>
      <AppHeader
        title="Dashboard"
        description="Program pulse: active caseload, period activity, and service mix."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <DashboardPrintToolbar />
            <Link href="/clients/new" className={cn(buttonVariants(), "gap-2")}>
              <UserPlus className="size-4" />
              New client
            </Link>
          </div>
        }
      />
      <div className="dashboard-print-area space-y-0">
        <div className="print-only mb-4 border-b border-border px-6 pb-4 pt-8">
          <p className="font-heading text-xl">Victory — Dashboard report</p>
          <p className="text-sm text-muted-foreground">
            Generated from live metrics. Use your browser print dialog to save as PDF.
          </p>
        </div>
        <div className="px-6 py-4">
          <UpcomingReminders items={reminders} />
        </div>
        <DashboardShell initialStats={stats} />
      </div>
    </>
  );
}
