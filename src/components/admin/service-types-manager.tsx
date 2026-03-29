"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export type ServiceTypeRow = { id: string; name: string; is_active: boolean };

export function ServiceTypesManager({ initialItems }: { initialItems: ServiceTypeRow[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function createType(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/service-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof data.error === "string" ? data.error : "Could not add type");
        return;
      }
      setName("");
      toast.success("Service type added");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function setActive(id: string, is_active: boolean) {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/service-types", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof data.error === "string" ? data.error : "Update failed");
        return;
      }
      toast.success(is_active ? "Activated" : "Deactivated");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={createType} className="flex max-w-md flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1 space-y-1.5">
          <label htmlFor="new-service-type" className="text-sm font-medium">
            New service type name
          </label>
          <Input
            id="new-service-type"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Housing navigation"
            autoComplete="off"
            disabled={busy}
          />
        </div>
        <Button type="submit" disabled={busy || !name.trim()}>
          Add
        </Button>
      </form>

      <ul className="divide-y divide-border rounded-lg border border-border">
        {initialItems.length === 0 ? (
          <li className="px-4 py-6 text-sm text-muted-foreground">No service types yet.</li>
        ) : (
          initialItems.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="font-medium">{row.name}</span>
                {!row.is_active ? (
                  <Badge variant="secondary">Inactive</Badge>
                ) : (
                  <Badge variant="outline" className="border-primary/30 text-muted-foreground">
                    Active
                  </Badge>
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                {row.is_active ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => setActive(row.id, false)}
                  >
                    Deactivate
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={busy}
                    onClick={() => setActive(row.id, true)}
                  >
                    Activate
                  </Button>
                )}
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
