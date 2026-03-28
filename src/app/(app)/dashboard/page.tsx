import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { StatsCardsLoader } from "@/components/dashboard/stats-cards-loader";
import { getDashboardStats } from "@/lib/data/queries";
import { buttonVariants } from "@/lib/button-variants";
import { UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  return (
    <>
      <AppHeader
        title="Dashboard"
        description="Program pulse: visits, hours, and service mix."
        actions={
          <Link href="/clients/new" className={cn(buttonVariants(), "gap-2")}>
            <UserPlus className="size-4" />
            New client
          </Link>
        }
      />
      <div className="flex-1 space-y-8 px-6 py-8">
        <StatsCardsLoader
          totalClients={stats.totalClients}
          totalEntries={stats.totalEntries}
          totalHours={stats.totalHours}
        />
      </div>
    </>
  );
}
