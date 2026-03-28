import { createClient } from "@/lib/supabase/server";
import {
  demoClients,
  demoServiceEntries,
  getClientById as getDemoClient,
  getServicesForClient as getDemoServices,
  demoServiceTypes,
} from "./demo";
import type { Client, ServiceEntry } from "@/types";

export async function getAllClients(): Promise<Client[]> {
  const supabase = await createClient();
  if (!supabase) return demoClients;

  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("last_name");

  if (error || !data) return demoClients;
  return data as Client[];
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

export async function getDashboardStats() {
  const supabase = await createClient();
  if (!supabase) {
    return {
      totalClients: demoClients.length,
      totalEntries: demoServiceEntries.length,
      totalHours: Math.round(
        demoServiceEntries.reduce((s, e) => s + (e.duration_minutes ?? 0), 0) / 60
      ),
      recentEntries: demoServiceEntries.slice(0, 5),
    };
  }

  const [clientsRes, entriesCountRes, entriesRes] = await Promise.all([
    supabase.from("clients").select("id", { count: "exact", head: true }),
    supabase.from("service_entries").select("id", { count: "exact", head: true }),
    supabase
      .from("service_entries")
      .select("id, duration_minutes, service_date, service_types(name)")
      .order("service_date", { ascending: false })
      .limit(100),
  ]);

  const entries = entriesRes.data ?? [];
  return {
    totalClients: clientsRes.count ?? 0,
    totalEntries: entriesCountRes.count ?? entries.length,
    totalHours: Math.round(
      entries.reduce(
        (s, e: { duration_minutes?: number | null }) => s + (e.duration_minutes ?? 0),
        0
      ) / 60
    ),
    recentEntries: entries.slice(0, 5),
  };
}
