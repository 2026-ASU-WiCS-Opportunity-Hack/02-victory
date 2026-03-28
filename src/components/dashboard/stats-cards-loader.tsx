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
  totalClients?: number;
  totalEntries?: number;
  totalHours?: number;
}

export function StatsCardsLoader({
  totalClients,
  totalEntries,
  totalHours,
}: StatsCardsLoaderProps) {
  return (
    <StatsCards
      totalClients={totalClients}
      totalEntries={totalEntries}
      totalHours={totalHours}
    />
  );
}
