"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  CalendarDays,
  CalendarRange,
  CalendarClock,
  ClipboardList,
  Clock,
  TrendingUp,
} from "lucide-react";

interface StatsCardsProps {
  activeClients?: number;
  totalRegistered?: number;
  servicesWeek?: number;
  servicesMonth?: number;
  servicesQuarter?: number;
  totalEntries?: number;
  totalHours?: number;
  weeklyTrend?: { w: string; visits: number }[];
  servicesByType?: { name: string; n: number }[];
  // Period-specific
  isFiltered?: boolean;
  servicesPeriod?: number;
  hoursPeriod?: number;
  activeClientsPeriod?: number;
}

export function StatsCards({
  activeClients = 0,
  totalRegistered = 0,
  servicesWeek = 0,
  servicesMonth = 0,
  servicesQuarter = 0,
  totalEntries = 0,
  totalHours = 0,
  weeklyTrend = [],
  servicesByType = [],
  isFiltered = false,
  servicesPeriod = 0,
  hoursPeriod = 0,
  activeClientsPeriod = 0,
}: StatsCardsProps) {
  const avgPerClient =
    activeClientsPeriod > 0
      ? Math.round((servicesPeriod / activeClientsPeriod) * 10) / 10
      : 0;

  const periodStats = [
    {
      label: "Clients served",
      value: String(activeClientsPeriod),
      hint: "Unique clients with a visit in this period",
      icon: Users,
    },
    {
      label: "Services in period",
      value: String(servicesPeriod),
      hint: "Total service entries logged",
      icon: ClipboardList,
    },
    {
      label: "Hours in period",
      value: String(hoursPeriod),
      hint: "Total documented service hours",
      icon: Clock,
    },
    {
      label: "Avg sessions / client",
      value: String(avgPerClient),
      hint: "Average visits per client served",
      icon: TrendingUp,
    },
  ];

  const allTimeStats = [
    {
      label: "Active clients",
      value: String(activeClients),
      hint: "With a visit in the last 90 days",
      icon: Users,
    },
    {
      label: "Services this week",
      value: String(servicesWeek),
      hint: "Sun–today (calendar week)",
      icon: CalendarDays,
    },
    {
      label: "Services this month",
      value: String(servicesMonth),
      hint: "Month to date",
      icon: CalendarRange,
    },
    {
      label: "Services this quarter",
      value: String(servicesQuarter),
      hint: "Quarter to date",
      icon: CalendarClock,
    },
  ];

  const stats = isFiltered ? periodStats : allTimeStats;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, hint, icon: Icon }) => (
          <Card key={label} size="sm">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {label}
              </CardTitle>
              <Icon className="size-4 text-primary" aria-hidden />
            </CardHeader>
            <CardContent className="pt-0">
              <p className="font-heading text-3xl tracking-tight">{value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <ClipboardList className="size-3.5 opacity-70" aria-hidden />
          Registered clients: <span className="font-medium text-foreground">{totalRegistered}</span>
        </span>
        <span className="text-border">·</span>
        <span>
          Total visit records:{" "}
          <span className="font-medium text-foreground">{totalEntries}</span>
        </span>
        <span className="text-border">·</span>
        <span>
          Hours documented (all time):{" "}
          <span className="font-medium text-foreground">{totalHours}</span>
        </span>
      </p>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="font-heading text-lg">Visit volume</CardTitle>
            <p className="text-sm text-muted-foreground">
              Count of service entries per rolling week — last {weeklyTrend.length || 6} weeks
            </p>
          </CardHeader>
          <CardContent className="h-72 pt-0">
            {weeklyTrend.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No entries in the chart window
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fillVisits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="w" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid var(--border)",
                      background: "var(--card)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="visits"
                    name="Visits"
                    stroke="var(--color-chart-1)"
                    strokeWidth={2}
                    fill="url(#fillVisits)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-heading text-lg">By service type</CardTitle>
            <p className="text-sm text-muted-foreground">Share of visits in the selected period</p>
          </CardHeader>
          <CardContent className="h-72 pt-0">
            {servicesByType.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No data in this window
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={servicesByType} layout="vertical" margin={{ left: 8, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={88}
                    tick={{ fontSize: 11 }}
                    stroke="var(--muted-foreground)"
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid var(--border)",
                      background: "var(--card)",
                    }}
                  />
                  <Bar dataKey="n" name="Visits" radius={[0, 6, 6, 0]} fill="var(--color-chart-2)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
