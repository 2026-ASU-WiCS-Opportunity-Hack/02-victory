import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { demoClients, demoServiceEntries } from "@/lib/data/demo";

export async function GET() {
  const supabase = await createClient();

  type Row = { client_id: string; first_name: string; last_name: string; last_service_date: string };
  let rows: Row[];

  if (supabase) {
    const { data } = await supabase
      .from("clients")
      .select("id, first_name, last_name, service_entries(service_date)")
      .order("last_name");

    rows = (data ?? []).map((c: { id: string; first_name: string; last_name: string; service_entries?: { service_date: string }[] }) => {
      const entries = c.service_entries ?? [];
      const dates = entries.map((e) => e.service_date).sort().reverse();
      return {
        client_id: c.id,
        first_name: c.first_name,
        last_name: c.last_name,
        last_service_date: dates[0]?.split("T")[0] ?? "",
      };
    });
  } else {
    rows = demoClients.map((c) => {
      const entries = demoServiceEntries.filter((e) => e.client_id === c.id);
      const dates = entries.map((e) => e.service_date).sort().reverse();
      return {
        client_id: c.id,
        first_name: c.first_name,
        last_name: c.last_name,
        last_service_date: dates[0]?.split("T")[0] ?? "",
      };
    });
  }

  const header = "client_id,first_name,last_name,last_service_date";
  const body = rows
    .map((r) => `${r.client_id},${r.first_name},${r.last_name},${r.last_service_date}`)
    .join("\n");

  return new NextResponse(`${header}\n${body}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="clients-export.csv"',
    },
  });
}
