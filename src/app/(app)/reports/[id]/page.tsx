import { notFound } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { ReportPreview } from "@/components/reports/report-preview";
import { createClient } from "@/lib/supabase/server";
import { demoReportId, demoSavedReport } from "@/lib/data/demo";
import type { ReportSection } from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ReportDetailPage({ params }: PageProps) {
  const { id } = await params;

  let title: string;
  let periodStart: string;
  let periodEnd: string;
  let sections: ReportSection[];

  const supabase = await createClient();

  if (supabase) {
    const { data } = await supabase
      .from("generated_reports")
      .select("*")
      .eq("id", id)
      .single();

    if (data) {
      const narrative = JSON.parse(data.narrative ?? "{}") as {
        title?: string;
        sections?: ReportSection[];
      };
      title = narrative.title ?? `Report — ${data.period_start} to ${data.period_end}`;
      periodStart = data.period_start;
      periodEnd = data.period_end;
      sections = narrative.sections ?? [];
    } else if (id === demoReportId) {
      title = demoSavedReport.title;
      periodStart = demoSavedReport.period_start;
      periodEnd = demoSavedReport.period_end;
      sections = demoSavedReport.sections;
    } else {
      return notFound();
    }
  } else if (id === demoReportId) {
    title = demoSavedReport.title;
    periodStart = demoSavedReport.period_start;
    periodEnd = demoSavedReport.period_end;
    sections = demoSavedReport.sections;
  } else {
    return notFound();
  }

  return (
    <>
      <AppHeader
        title="Saved report"
        description="Read-only preview of a generated narrative."
      />
      <div className="flex-1 px-6 py-8">
        <ReportPreview
          title={title}
          periodStart={periodStart}
          periodEnd={periodEnd}
          sections={sections}
        />
      </div>
    </>
  );
}
