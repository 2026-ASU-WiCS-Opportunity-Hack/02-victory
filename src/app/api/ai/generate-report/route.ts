import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateFunderReport } from "@/lib/ai/groq";
import { demoServiceEntries } from "@/lib/data/demo";
import type { ReportData } from "@/lib/ai/groq";
import { getStaffContext } from "@/lib/auth/admin";
import { guardAiRate } from "@/lib/ai-guard";
import { aiReportPeriodSchema } from "@/lib/validation/schemas";

function aggregateFromDemo(period_start: string, period_end: string): ReportData {
  const start = new Date(period_start).getTime();
  const end = new Date(period_end).getTime();
  const inRange = demoServiceEntries.filter((e) => {
    const t = new Date(e.service_date).getTime();
    return t >= start && t <= end;
  });
  const unique = new Set(inRange.map((e) => e.client_id));
  const servicesByType: Record<string, number> = {};
  let totalHours = 0;
  inRange.forEach((e) => {
    const name = e.service_types?.name ?? "Other";
    servicesByType[name] = (servicesByType[name] ?? 0) + 1;
    totalHours += (e.duration_minutes ?? 0) / 60;
  });
  return {
    period: { start: period_start, end: period_end },
    total_unique_clients: unique.size,
    total_service_entries: inRange.length,
    total_service_hours: Math.round(totalHours * 10) / 10,
    services_by_type: servicesByType,
  };
}

const FALLBACK_REPORT = {
  title: "Quarterly Impact Report — Demo Period",
  sections: [
    {
      title: "Executive Summary",
      content:
        "During this reporting period, our team maintained consistent engagement with active clients. Service entries reflect a focus on housing stability and employment readiness. This narrative is a demo preview; connect Groq and Supabase for live generation.",
    },
    {
      title: "Population Served",
      content:
        "The aggregated data reflects unique clients served within the selected date window. Demographic detail will appear here once your Supabase instance contains production data.",
    },
    {
      title: "Services Delivered",
      content:
        "Service types are counted from structured visit logs. Hours are derived from recorded session durations where available.",
    },
    {
      title: "Outcomes & Impact",
      content:
        "Outcome narratives highlight measurable progress and qualitative stories suitable for grant reporting. Edit sections after generation to match your program's voice.",
    },
    {
      title: "Looking Ahead",
      content:
        "Upcoming priorities include expanding partner referrals and documenting follow-up tasks from recorded case notes.",
    },
  ],
};

export async function POST(req: Request) {
  try {
    const { isStaff, userId } = await getStaffContext();
    if (!isStaff) {
      return NextResponse.json({ error: "Only staff can generate reports." }, { status: 403 });
    }

    const rate = guardAiRate(req, userId, 15);
    if (rate) return rate;

    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = aiReportPeriodSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { period_start, period_end } = parsed.data;

    const supabase = await createClient();
    let aggregated: ReportData;

    if (supabase) {
      const [clientsRes, servicesRes] = await Promise.all([
        supabase
          .from("service_entries")
          .select("client_id")
          .gte("service_date", period_start)
          .lte("service_date", period_end),
        supabase
          .from("service_entries")
          .select(
            `
          id,
          service_date,
          duration_minutes,
          notes,
          service_types (name),
          clients (first_name, last_name, demographics, date_of_birth)
        `
          )
          .gte("service_date", period_start)
          .lte("service_date", period_end),
      ]);

      const uniqueClients = new Set(clientsRes.data?.map((r) => r.client_id));
      const servicesByType: Record<string, number> = {};
      let totalHours = 0;

      for (const entry of servicesRes.data ?? []) {
        const row = entry as {
          duration_minutes?: number | null;
          service_types?: { name?: string } | { name?: string }[] | null;
        };
        const st = row.service_types;
        const typeName = (Array.isArray(st) ? st[0]?.name : st?.name) ?? "Other";
        servicesByType[typeName] = (servicesByType[typeName] ?? 0) + 1;
        totalHours += (row.duration_minutes ?? 0) / 60;
      }

      aggregated = {
        period: { start: period_start, end: period_end },
        total_unique_clients: uniqueClients.size,
        total_service_entries: servicesRes.data?.length ?? 0,
        total_service_hours: Math.round(totalHours * 10) / 10,
        services_by_type: servicesByType,
      };
    } else {
      aggregated = aggregateFromDemo(period_start, period_end);
    }

    try {
      const report = await generateFunderReport(aggregated);
      if (supabase) {
        try {
          const { data: user } = await supabase.auth.getUser();
          await supabase.from("generated_reports").insert({
            period_start,
            period_end,
            raw_data: aggregated,
            narrative: JSON.stringify(report),
            generated_by: user.user?.id ?? null,
          });
        } catch {
          /* table may not exist in local dev */
        }
      }
      return NextResponse.json(report);
    } catch {
      return NextResponse.json({
        ...FALLBACK_REPORT,
        title: `Impact report — ${period_start} to ${period_end}`,
      });
    }
  } catch (error) {
    console.error("Report generation error:", error);
    return NextResponse.json({ error: "Report generation failed" }, { status: 500 });
  }
}
