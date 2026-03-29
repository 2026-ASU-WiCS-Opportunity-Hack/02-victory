"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export function AppointmentForm({
  clients,
}: {
  clients: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [clientId, setClientId] = useState("");
  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [notes, setNotes] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId || !startsAt) {
      toast.error("Choose a client and start time.");
      return;
    }
    setPending(true);
    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        title: title || null,
        starts_at: new Date(startsAt).toISOString(),
        ends_at: null,
        notes: notes || null,
      }),
    });
    setPending(false);
    if (res.ok) {
      toast.success("Appointment scheduled.");
      setTitle("");
      setStartsAt("");
      setNotes("");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error((data as { error?: string }).error ?? "Could not save appointment.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-lg">Schedule appointment</CardTitle>
        <CardDescription>Creates a future visit for the selected client. Requires the appointments table in Supabase.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid max-w-xl gap-4">
          <div className="space-y-2">
            <Label>Client</Label>
            <Select value={clientId} onValueChange={(v) => setClientId(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id} label={c.label}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="apt_title">Title (optional)</Label>
            <Input
              id="apt_title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Housing intake follow-up"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="apt_start">Starts</Label>
            <Input
              id="apt_start"
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="apt_notes">Notes</Label>
            <Textarea id="apt_notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save appointment"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
