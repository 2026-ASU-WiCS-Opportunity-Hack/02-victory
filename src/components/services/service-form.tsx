"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VoiceRecorder } from "@/components/services/voice-recorder";
import type { StructuredNote } from "@/types";
import { toast } from "sonner";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";

interface ServiceFormProps {
  clientId: string;
  clientLabel: string;
  serviceTypes: string[];
}

export function ServiceForm({ clientId, clientLabel, serviceTypes }: ServiceFormProps) {
  const router = useRouter();
  const [serviceType, setServiceType] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiMood, setAiMood] = useState<string | null>(null);
  const [actionItems, setActionItems] = useState<string[]>([]);
  const [audioTranscript, setAudioTranscript] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (aiSummary) setNotes((prev) => prev || aiSummary);
  }, [aiSummary]);

  const onStructured = (data: StructuredNote) => {
    setAiSummary(data.summary);
    setAiMood(data.mood_risk);
    setActionItems(data.action_items);
    if (data.service_type && !serviceType) {
      const match = serviceTypes.find(
        (t) => t.toLowerCase() === data.service_type.toLowerCase()
      );
      setServiceType(match ?? data.service_type);
    }
    toast.success("AI filled summary & action items — review before saving.");
  };

  async function onSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);

    const form = new FormData(e.currentTarget);

    const res = await fetch("/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        service_type_name: serviceType,
        service_date: form.get("svc_date"),
        duration_minutes: form.get("duration") ? Number(form.get("duration")) : null,
        notes,
        ai_summary: aiSummary,
        ai_action_items: actionItems,
        ai_mood_risk: aiMood,
        source: audioTranscript ? "voice" : "manual",
        audio_transcript: audioTranscript,
      }),
    });

    setPending(false);

    if (res.ok) {
      toast.success("Service entry saved.");
      router.push(`/clients/${clientId}`);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error((data as { error?: string }).error ?? "Failed to save entry.");
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            Logging for{" "}
            <span className="font-medium text-foreground">{clientLabel}</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Client ID: {clientId}</p>
        </div>
        <Link href={`/clients/${clientId}`} className={cn(buttonVariants({ variant: "outline" }))}>
          Back to profile
        </Link>
      </div>

      <VoiceRecorder
        onStructuredNote={onStructured}
        serviceTypes={serviceTypes}
        onTranscript={(t) => setAudioTranscript(t)}
      />

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-xl">Service entry</CardTitle>
          <CardDescription>
            Manual fields merge with AI output. Voice flow calls Groq Whisper + Llama via API routes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid max-w-2xl gap-6">
            <div className="space-y-2">
              <Label>Service type</Label>
              <Select
                value={serviceType || undefined}
                onValueChange={(v) => setServiceType(v ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {serviceTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="svc_date">Service date</Label>
                <Input id="svc_date" name="svc_date" type="datetime-local" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input id="duration" name="duration" type="number" min={5} step={5} placeholder="45" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                rows={5}
                placeholder="Session details, or paste from voice transcript…"
                className="min-h-[120px] resize-y"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {(aiSummary || aiMood || actionItems.length > 0) && (
              <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                <p className="text-sm font-medium">AI-assisted fields</p>
                {aiSummary ? (
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Summary</p>
                    <p className="text-sm">{aiSummary}</p>
                  </div>
                ) : null}
                {aiMood ? (
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Mood / risk</p>
                    <p className="text-sm">{aiMood}</p>
                  </div>
                ) : null}
                {actionItems.length > 0 ? (
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Action items</p>
                    <ul className="list-inside list-disc text-sm">
                      {actionItems.map((a) => (
                        <li key={a}>{a}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            )}

            <div className="flex gap-3">
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : "Save entry"}
              </Button>
              <Link href="/clients" className={cn(buttonVariants({ variant: "outline" }))}>
                Cancel
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
