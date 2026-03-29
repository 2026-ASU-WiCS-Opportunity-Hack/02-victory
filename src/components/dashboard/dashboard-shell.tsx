"use client";

import { useState, useCallback } from "react";
import { CalendarIcon } from "lucide-react";
import { StatsCardsLoader } from "@/components/dashboard/stats-cards-loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DashboardStats } from "@/lib/data/queries";

type Preset = { label: string; days: number | null };

const PRESETS: Preset[] = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
  { label: "1 year", days: 365 },
  { label: "All time", days: null },
];

function toYmd(d: Date): string {
  return d.toISOString().split("T")[0]!;
}

interface DashboardShellProps {
  initialStats: DashboardStats;
}

export function DashboardShell({ initialStats }: DashboardShellProps) {
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [loading, setLoading] = useState(false);
  // "90d" is the default — stat cards show period-specific values
  const [activePreset, setActivePreset] = useState<string>("90d");

  const defaultEnd = new Date();
  const defaultStart = new Date(Date.now() - 90 * 86400000);
  const [startDate, setStartDate] = useState(toYmd(defaultStart));
  const [endDate, setEndDate] = useState(toYmd(defaultEnd));

  // Stat cards show period stats for any preset except "All time"
  const isFiltered = activePreset !== "All time";

  const fetchStats = useCallback(async (start?: string, end?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (start) params.set("start", start);
      if (end) params.set("end", end);
      const res = await fetch(`/api/dashboard/stats?${params.toString()}`);
      if (res.ok) {
        const data: DashboardStats = await res.json();
        setStats(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  function applyPreset(preset: Preset) {
    setActivePreset(preset.label);
    if (preset.days === null) {
      setStartDate("");
      setEndDate("");
      void fetchStats(undefined, undefined);
    } else {
      const end = new Date();
      const start = new Date(Date.now() - preset.days * 86400000);
      const s = toYmd(start);
      const e = toYmd(end);
      setStartDate(s);
      setEndDate(e);
      void fetchStats(s, e);
    }
  }

  function applyCustomRange() {
    setActivePreset("custom");
    void fetchStats(startDate || undefined, endDate || undefined);
  }

  return (
    <div className="flex-1 space-y-6 px-6 py-8">
      {/* Date range controls */}
      <div className="no-print flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4">
        <CalendarIcon className="mt-1 size-4 shrink-0 text-muted-foreground self-center" />
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <Button
              key={p.label}
              size="sm"
              variant={activePreset === p.label ? "default" : "outline"}
              onClick={() => applyPreset(p)}
              disabled={loading}
            >
              {p.label}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-2 border-l border-border pl-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">From</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setActivePreset("custom");
              }}
              className="h-8 w-[140px] text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">To</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setActivePreset("custom");
              }}
              className="h-8 w-[140px] text-sm"
            />
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={applyCustomRange}
            disabled={loading}
            className="h-8"
          >
            {loading ? "Loading…" : "Apply"}
          </Button>
        </div>
      </div>

      <StatsCardsLoader
        activeClients={stats.activeClients}
        totalRegistered={stats.totalRegistered}
        servicesWeek={stats.servicesWeek}
        servicesMonth={stats.servicesMonth}
        servicesQuarter={stats.servicesQuarter}
        totalEntries={stats.totalEntries}
        totalHours={stats.totalHours}
        weeklyTrend={stats.weeklyTrend}
        servicesByType={stats.servicesByType}
        isFiltered={isFiltered}
        servicesPeriod={stats.servicesPeriod}
        hoursPeriod={stats.hoursPeriod}
        activeClientsPeriod={stats.activeClientsPeriod}
      />
    </div>
  );
}
