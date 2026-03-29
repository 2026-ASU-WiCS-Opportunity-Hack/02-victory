"use client";

import dynamic from "next/dynamic";

const StatsCards = dynamic(
  () => import("./stats-cards").then((m) => m.StatsCards),
  {
    ssr: false,
    loading: () => (
      <div className="h-96 animate-pulse rounded-xl bg-muted/40" aria-hidden />
    ),
  }
);

interface StatsCardsLoaderProps {
  activeClients?: number;
  totalRegistered?: number;
  servicesWeek?: number;
  servicesMonth?: number;
  servicesQuarter?: number;
  totalEntries?: number;
  totalHours?: number;
  weeklyTrend?: { w: string; visits: number }[];
  servicesByType?: { name: string; n: number }[];
  isFiltered?: boolean;
  servicesPeriod?: number;
  hoursPeriod?: number;
  activeClientsPeriod?: number;
}

export function StatsCardsLoader(props: StatsCardsLoaderProps) {
  return <StatsCards {...props} />;
}
