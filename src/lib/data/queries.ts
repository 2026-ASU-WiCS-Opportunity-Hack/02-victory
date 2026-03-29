import { createClient } from "@/lib/supabase/server";
import {
  demoClients,
  demoServiceEntries,
  getClientById as getDemoClient,
  getServicesForClient as getDemoServices,
  demoServiceTypes,
  demoAppointments,
} from "./demo";
import type { Client, ServiceEntry } from "@/types";

export type ClientWithLastService = Client & {
  last_service_type: string | null;
  last_service_date: string | null;
};

export type CustomFieldDefinition = {
  id: string;
  key: string;
  label: string;
  field_type: "text" | "number" | "select";
  applies_to: "client" | "service";
  options: string[] | null;
  order_index: number;
};

export type AppointmentRow = {
  id: string;
  client_id: string;
  staff_id: string | null;
  title: string | null;
  starts_at: string;
  ends_at: string | null;
  notes: string | null;
  client?: { first_name: string; last_name: string } | null;
};

export type DashboardStats = {
  activeClients: number;
  totalRegistered: number;
  servicesWeek: number;
  servicesMonth: number;
  servicesQuarter: number;
  totalEntries: number;
  totalHours: number;
  weeklyTrend: { w: string; visits: number }[];
  servicesByType: { name: string; n: number }[];
  // Period-specific (set when a date range is active)
  servicesPeriod: number;
  hoursPeriod: number;
  activeClientsPeriod: number;
};

function ymd(iso: string): string {
  return iso.split("T")[0] ?? iso;
}

function toYmdLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function inYmdRange(iso: string, startYmd: string, endYmd: string): boolean {
  const d = ymd(iso);
  return d >= startYmd && d <= endYmd;
}

function startOfWeekSunday(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - x.getDay());
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function startOfQuarter(d: Date): Date {
  const q = Math.floor(d.getMonth() / 3);
  return new Date(d.getFullYear(), q * 3, 1, 0, 0, 0, 0);
}

type ChartEntry = {
  client_id?: string | null;
  service_date: string;
  duration_minutes?: number | null;
  service_types?: { name?: string } | { name?: string }[] | null;
};

const CHART_WEEKS = 6;
const ACTIVE_DAYS = 90;

function filterEntriesInRange(
  entries: ChartEntry[],
  start?: Date,
  end?: Date
): ChartEntry[] {
  if (!start && !end) return entries;
  return entries.filter((e) => {
    const t = new Date(e.service_date).getTime();
    if (start && t < start.getTime()) return false;
    if (end && t > end.getTime()) return false;
    return true;
  });
}

function filterEntriesLastWeeks(entries: ChartEntry[], weeks: number): ChartEntry[] {
  const cutoff = Date.now() - weeks * 7 * 86400000;
  return entries.filter((e) => new Date(e.service_date).getTime() >= cutoff);
}

function buildWeeklyTrend(entries: ChartEntry[], start?: Date, end?: Date) {
  // When a custom range is provided, build week buckets for that range.
  // Otherwise fall back to the rolling CHART_WEEKS window.
  if (start && end) {
    const rangeMs = end.getTime() - start.getTime();
    const weeks = Math.max(1, Math.ceil(rangeMs / (7 * 86400000)));
    const cappedWeeks = Math.min(weeks, 26); // cap at 26 weeks for readability
    const scoped = filterEntriesInRange(entries, start, end);
    return Array.from({ length: cappedWeeks }, (_, i) => {
      const weekStart = start.getTime() + i * 7 * 86400000;
      const weekEnd = weekStart + 7 * 86400000;
      const date = new Date(weekStart);
      const label = `Week of ${date.getMonth() + 1}/${date.getDate()}`;
      const visits = scoped.filter((e) => {
        const t = new Date(e.service_date).getTime();
        return t >= weekStart && t < weekEnd;
      }).length;
      return { w: label, visits };
    });
  }
  const scoped = filterEntriesLastWeeks(entries, CHART_WEEKS);
  const now = Date.now();
  return Array.from({ length: CHART_WEEKS }, (_, i) => {
    const weekStart = now - (CHART_WEEKS - 1 - i) * 7 * 86400000;
    const weekEnd = weekStart + 7 * 86400000;
    const date = new Date(weekStart);
    const label = `Week of ${date.getMonth() + 1}/${date.getDate()}`;
    const visits = scoped.filter((e) => {
      const t = new Date(e.service_date).getTime();
      return t >= weekStart && t < weekEnd;
    }).length;
    return { w: label, visits };
  });
}

function buildServicesByType(entries: ChartEntry[], start?: Date, end?: Date) {
  const scoped = start || end
    ? filterEntriesInRange(entries, start, end)
    : filterEntriesLastWeeks(entries, CHART_WEEKS);
  const counts: Record<string, number> = {};
  scoped.forEach((e) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const name: string = (e as any)?.service_types?.name ?? "Other";
    const short = name.length > 14 ? `${name.slice(0, 12)}…` : name;
    counts[short] = (counts[short] ?? 0) + 1;
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, n]) => ({ name, n }));
}

function countServicesInCalendarWeek(entries: ChartEntry[], ref: Date): number {
  const start = startOfWeekSunday(ref);
  const end = endOfDay(ref);
  const s = toYmdLocal(start);
  const e = toYmdLocal(end);
  return entries.filter((x) => inYmdRange(x.service_date, s, e)).length;
}

function countServicesInMonth(entries: ChartEntry[], ref: Date): number {
  const start = new Date(ref.getFullYear(), ref.getMonth(), 1);
  const end = endOfDay(ref);
  return entries.filter((x) => inYmdRange(x.service_date, toYmdLocal(start), toYmdLocal(end))).length;
}

function countServicesInQuarter(entries: ChartEntry[], ref: Date): number {
  const start = startOfQuarter(ref);
  const end = endOfDay(ref);
  return entries.filter((x) => inYmdRange(x.service_date, toYmdLocal(start), toYmdLocal(end))).length;
}

function activeClientCount(entries: ChartEntry[], ref: Date): number {
  const cutoff = new Date(ref);
  cutoff.setDate(cutoff.getDate() - ACTIVE_DAYS);
  const minYmd = toYmdLocal(cutoff);
  const ids = new Set<string>();
  for (const e of entries) {
    if (!e.client_id) continue;
    if (ymd(e.service_date) >= minYmd) ids.add(e.client_id);
  }
  return ids.size;
}

function computeDashboardFromEntries(
  entries: ChartEntry[],
  registeredCount: number,
  totalEntriesCount: number,
  chartStart?: Date,
  chartEnd?: Date
): DashboardStats {
  const ref = new Date();
  const periodEntries = (chartStart || chartEnd)
    ? filterEntriesInRange(entries, chartStart, chartEnd)
    : entries;
  const activeClientsPeriod = new Set(
    periodEntries.map((e) => e.client_id).filter(Boolean)
  ).size;
  return {
    activeClients: activeClientCount(entries, ref),
    totalRegistered: registeredCount,
    servicesWeek: countServicesInCalendarWeek(entries, ref),
    servicesMonth: countServicesInMonth(entries, ref),
    servicesQuarter: countServicesInQuarter(entries, ref),
    totalEntries: totalEntriesCount,
    totalHours: Math.round(
      entries.reduce((s, e) => s + (e.duration_minutes ?? 0), 0) / 60
    ),
    weeklyTrend: buildWeeklyTrend(entries, chartStart, chartEnd),
    servicesByType: buildServicesByType(entries, chartStart, chartEnd),
    servicesPeriod: periodEntries.length,
    hoursPeriod: Math.round(
      periodEntries.reduce((s, e) => s + (e.duration_minutes ?? 0), 0) / 60
    ),
    activeClientsPeriod,
  };
}

export async function getAllClients(): Promise<ClientWithLastService[]> {
  const supabase = await createClient();
  if (!supabase) {
    return demoClients.map((c) => {
      const entries = demoServiceEntries
        .filter((e) => e.client_id === c.id)
        .sort((a, b) => new Date(b.service_date).getTime() - new Date(a.service_date).getTime());
      return {
        ...c,
        last_service_type: entries[0]?.service_types?.name ?? null,
        last_service_date: entries[0]?.service_date ?? null,
      };
    });
  }

  const [clientsRes, entriesRes] = await Promise.all([
    supabase.from("clients").select("*").order("last_name"),
    supabase
      .from("service_entries")
      .select("client_id, service_date, service_types(name)")
      .order("service_date", { ascending: false }),
  ]);

  const clients = (clientsRes.data ?? []) as Client[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const entries = (entriesRes.data ?? []) as any[];

  const latestMap = new Map<string, { type: string | null; date: string }>();
  for (const e of entries) {
    if (!latestMap.has(e.client_id)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      latestMap.set(e.client_id, { type: (e as any)?.service_types?.name ?? null, date: e.service_date });
    }
  }

  return clients.map((c) => {
    const latest = latestMap.get(c.id);
    return { ...c, last_service_type: latest?.type ?? null, last_service_date: latest?.date ?? null };
  });
}

export async function getClientById(id: string): Promise<Client | null> {
  const supabase = await createClient();
  if (!supabase) return getDemoClient(id) ?? null;

  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return getDemoClient(id) ?? null;
  return data as Client;
}

export async function getServicesForClient(clientId: string): Promise<ServiceEntry[]> {
  const supabase = await createClient();
  if (!supabase) return getDemoServices(clientId);

  const { data, error } = await supabase
    .from("service_entries")
    .select("*, service_types(name)")
    .eq("client_id", clientId)
    .order("service_date", { ascending: false });

  if (error || !data) return getDemoServices(clientId);
  return data as ServiceEntry[];
}

export async function getServiceTypes(): Promise<string[]> {
  const supabase = await createClient();
  if (!supabase) return demoServiceTypes;

  const { data, error } = await supabase
    .from("service_types")
    .select("name")
    .eq("is_active", true)
    .order("name");

  if (error || !data) return demoServiceTypes;
  return data.map((r) => r.name);
}

export async function getDashboardStats(chartStart?: Date, chartEnd?: Date): Promise<DashboardStats> {
  const supabase = await createClient();
  if (!supabase) {
    return computeDashboardFromEntries(
      demoServiceEntries as ChartEntry[],
      demoClients.length,
      demoServiceEntries.length,
      chartStart,
      chartEnd
    );
  }

  const [clientsRes, entriesCountRes, entriesRes] = await Promise.all([
    supabase.from("clients").select("id", { count: "exact", head: true }),
    supabase.from("service_entries").select("id", { count: "exact", head: true }),
    supabase
      .from("service_entries")
      .select("client_id, service_date, duration_minutes, service_types(name)")
      .order("service_date", { ascending: false }),
  ]);

  const entries = (entriesRes.data ?? []) as ChartEntry[];
  return computeDashboardFromEntries(
    entries,
    clientsRes.count ?? 0,
    entriesCountRes.count ?? 0,
    chartStart,
    chartEnd
  );
}

export async function getCustomFieldDefinitions(
  appliesTo: "client" | "service"
): Promise<CustomFieldDefinition[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("custom_field_definitions")
    .select("*")
    .eq("applies_to", appliesTo)
    .order("order_index", { ascending: true });

  if (error || !data) return [];
  return data as CustomFieldDefinition[];
}

export async function getAppointmentsInRange(start: Date, end: Date): Promise<AppointmentRow[]> {
  const supabase = await createClient();
  if (!supabase) {
    return demoAppointments.filter((a) => {
      const t = new Date(a.starts_at).getTime();
      return t >= start.getTime() && t <= end.getTime();
    });
  }

  const { data, error } = await supabase
    .from("appointments")
    .select("id, client_id, staff_id, title, starts_at, ends_at, notes, clients(first_name, last_name)")
    .gte("starts_at", start.toISOString())
    .lte("starts_at", end.toISOString())
    .order("starts_at", { ascending: true });

  if (error || !data) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((row: any) => ({
    id: row.id,
    client_id: row.client_id,
    staff_id: row.staff_id,
    title: row.title,
    starts_at: row.starts_at,
    ends_at: row.ends_at,
    notes: row.notes,
    client: row.clients,
  }));
}

export async function getUpcomingAppointmentReminders(withinHours = 48): Promise<AppointmentRow[]> {
  const start = new Date();
  const end = new Date(start.getTime() + withinHours * 3600000);
  const rows = await getAppointmentsInRange(start, end);
  return rows.filter((a) => new Date(a.starts_at).getTime() >= start.getTime());
}
