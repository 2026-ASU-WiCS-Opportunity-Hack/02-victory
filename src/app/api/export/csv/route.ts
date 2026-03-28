import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { demoClients } from "@/lib/data/demo";

function csvCell(value: string) {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET() {
  const supabase = await createClient();
  let rows: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string | null;
    email: string | null;
  }[];

  if (supabase) {
    const { data } = await supabase
      .from("clients")
      .select("id, first_name, last_name, phone, email")
      .order("last_name");
    rows = data ?? [];
  } else {
    rows = demoClients.map((c) => ({
      id: c.id,
      first_name: c.first_name,
      last_name: c.last_name,
      phone: c.phone,
      email: c.email,
    }));
  }

  const header = "id,first_name,last_name,phone,email";
  const lines = rows.map(
    (r) =>
      [r.id, r.first_name, r.last_name, r.phone ?? "", r.email ?? ""]
        .map((v) => csvCell(String(v)))
        .join(",")
  );
  const csv = [header, ...lines].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="clients-export.csv"',
    },
  });
}
