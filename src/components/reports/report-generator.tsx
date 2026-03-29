"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, FileText, Copy } from "lucide-react";
import { toast } from "sonner";
import type { FunderReport } from "@/types";

export function ReportGenerator() {
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<FunderReport | null>(null);

  const generate = async () => {
    if (!periodStart || !periodEnd) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/ai/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          period_start: periodStart,
          period_end: periodEnd,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setReport(data as FunderReport);
      toast.success("Report generated.");
    } catch {
      toast.error("Report generation failed. Try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (!report) return;
    const text = report.sections
      .map((s) => `## ${s.title}\n\n${s.content}`)
      .join("\n\n---\n\n");
    void navigator.clipboard.writeText(`# ${report.title}\n\n${text}`);
    toast.success("Copied to clipboard.");
  };

  return (
    <div className="space-y-8">
      <Card className="border-primary/15 bg-gradient-to-br from-card to-primary/5">
        <CardHeader>
          <CardTitle className="font-heading text-xl">Funder-ready narrative</CardTitle>
          <CardDescription>
            Select a date range to generate a funder-ready narrative from your service data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="space-y-2">
              <Label htmlFor="pstart">Period start</Label>
              <Input
                id="pstart"
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pend">Period end</Label>
              <Input
                id="pend"
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
              />
            </div>
            <Button
              type="button"
              onClick={() => void generate()}
              disabled={isGenerating || !periodStart || !periodEnd}
              className="sm:mb-0.5"
            >
              {isGenerating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileText className="mr-2 h-4 w-4" />
              )}
              Generate report
            </Button>
          </div>
        </CardContent>
      </Card>

      {report ? (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-heading text-2xl tracking-tight">{report.title}</h2>
            <Button type="button" variant="outline" onClick={copyToClipboard}>
              <Copy className="mr-2 h-4 w-4" />
              Copy report
            </Button>
          </div>

          {report.sections.map((section, i) => (
            <Card key={section.title}>
              <CardHeader>
                <CardTitle className="font-heading text-lg">{section.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  className="min-h-[140px] w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm leading-relaxed outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  value={section.content}
                  onChange={(e) => {
                    const next = { ...report };
                    next.sections[i] = { ...section, content: e.target.value };
                    setReport(next);
                  }}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
