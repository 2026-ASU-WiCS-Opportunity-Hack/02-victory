import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createClient } from "@/lib/supabase/server";
import { getServicesForClient } from "@/lib/data/demo";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";
import type { ServiceEntry } from "@/types";

interface ServiceHistoryProps {
  clientId: string;
}

function formatServiceDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export async function ServiceHistory({ clientId }: ServiceHistoryProps) {
  const supabase = await createClient();
  let entries: ServiceEntry[];

  if (supabase) {
    const { data } = await supabase
      .from("service_entries")
      .select("*, service_types(name)")
      .eq("client_id", clientId)
      .order("service_date", { ascending: false });
    entries = (data ?? []) as ServiceEntry[];
  } else {
    entries = getServicesForClient(clientId);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle className="font-heading text-lg">Recent visits</CardTitle>
        <Link
          href={`/services/new/${clientId}`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Add entry
        </Link>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No services logged yet.</p>
        ) : (
          <ScrollArea className="h-[min(420px,50vh)] pr-3">
            <ul className="space-y-4">
              {entries.map((e) => (
                <li
                  key={e.id}
                  className="rounded-xl border border-border bg-muted/20 p-4 ring-1 ring-foreground/5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium">
                      {formatServiceDate(e.service_date)}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">
                        {e.service_types?.name ?? "Service"}
                      </Badge>
                      <Badge variant={e.source === "voice" ? "default" : "outline"}>
                        {e.source === "voice" ? "Voice" : "Manual"}
                      </Badge>
                    </div>
                  </div>
                  {e.duration_minutes != null ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Duration {e.duration_minutes} min
                    </p>
                  ) : null}
                  <p className="mt-2 text-sm leading-relaxed text-foreground/90">
                    {e.notes ?? e.audio_transcript ?? "—"}
                  </p>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
