"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export function ClientForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);

    const form = new FormData(e.currentTarget);

    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        first_name: form.get("first_name"),
        last_name: form.get("last_name"),
        date_of_birth: form.get("dob") || null,
        phone: form.get("phone") || null,
        email: form.get("email") || null,
        address: form.get("address") || null,
      }),
    });

    setPending(false);

    if (res.ok) {
      const data = (await res.json()) as { id: string };
      toast.success("Client saved.");
      router.push(`/clients/${data.id}`);
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error((data as { error?: string }).error ?? "Failed to save client.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-xl">New client</CardTitle>
        <CardDescription>Register a new client.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid max-w-2xl gap-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="first_name">First name</Label>
              <Input id="first_name" name="first_name" required placeholder="Maria" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last name</Label>
              <Input id="last_name" name="last_name" required placeholder="Santos" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dob">Date of birth</Label>
            <Input id="dob" name="dob" type="date" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" type="tel" placeholder="(555) 000-0000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="client@email.org" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              name="address"
              rows={2}
              placeholder="Street, city, unit notes…"
              className="min-h-[72px] resize-y"
            />
          </div>
          <div className="flex gap-3">
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save client"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
