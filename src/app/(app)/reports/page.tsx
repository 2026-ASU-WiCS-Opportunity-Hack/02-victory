import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { ReportGenerator } from "@/components/reports/report-generator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/lib/button-variants";
import { demoReportId } from "@/lib/data/demo";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ReportsPage() {
  return (
    <>
      <AppHeader
        title="Reports"
        description="Generate funder narratives from aggregated visits."
        actions={
          <Link
            href={`/reports/${demoReportId}`}
            className={cn(buttonVariants({ variant: "outline" }), "gap-2")}
          >
            <FileText className="size-4" />
            View sample
          </Link>
        }
      />
      <div className="flex-1 space-y-8 px-6 py-8">
        <ReportGenerator />
        <Card size="sm">
          <CardHeader>
            <CardTitle className="font-heading text-base">CSV export</CardTitle>
            <CardDescription>
              Demo endpoint at <code className="text-xs">/api/export/csv</code> — wire Papa Parse
              on the client when you add bulk spreadsheets.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a
              href="/api/export/csv"
              className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
              download
            >
              Download CSV
            </a>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
