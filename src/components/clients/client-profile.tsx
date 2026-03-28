import Link from "next/link";
import { Calendar, Mail, MapPin, Phone, Mic } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ServiceHistory } from "@/components/services/service-history";
import type { Client } from "@/types";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";

interface ClientProfileProps {
  client: Client;
}

export function ClientProfile({ client }: ClientProfileProps) {
  const demo = client.demographics as Record<string, string>;

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-primary/15 bg-gradient-to-br from-card via-card to-primary/5">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Client record</p>
            <CardTitle className="mt-1 font-heading text-3xl tracking-tight">
              {client.first_name} {client.last_name}
            </CardTitle>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="secondary">Active</Badge>
              {client.date_of_birth ? (
                <Badge variant="outline">DOB {client.date_of_birth}</Badge>
              ) : null}
            </div>
          </div>
          <Link
            href={`/services/new/${client.id}`}
            className={cn(buttonVariants({ size: "lg" }), "gap-2 shrink-0")}
          >
            <Mic className="size-4" />
            Log service / voice
          </Link>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex gap-3 rounded-lg border border-border/80 bg-background/60 p-3">
            <Phone className="mt-0.5 size-4 text-primary" />
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Phone
              </p>
              <p className="text-sm">{client.phone ?? "—"}</p>
            </div>
          </div>
          <div className="flex gap-3 rounded-lg border border-border/80 bg-background/60 p-3">
            <Mail className="mt-0.5 size-4 text-primary" />
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Email
              </p>
              <p className="text-sm break-all">{client.email ?? "—"}</p>
            </div>
          </div>
          <div className="flex gap-3 rounded-lg border border-border/80 bg-background/60 p-3 sm:col-span-2 lg:col-span-1">
            <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Address
              </p>
              <p className="text-sm">{client.address ?? "—"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="services">Service history</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <Calendar className="size-4 text-muted-foreground" />
              <CardTitle className="font-heading text-lg">Demographics & notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.keys(demo).length === 0 ? (
                <p className="text-sm text-muted-foreground">No extra fields yet.</p>
              ) : (
                <dl className="grid gap-3 sm:grid-cols-2">
                  {Object.entries(demo).map(([k, v]) => (
                    <div key={k} className="rounded-lg bg-muted/50 px-3 py-2">
                      <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                        {k}
                      </dt>
                      <dd className="text-sm font-medium">{String(v)}</dd>
                    </div>
                  ))}
                </dl>
              )}
              <Separator />
              <p className="text-xs text-muted-foreground">
                Additional program-specific fields can be added as your team configures the database.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="services" className="mt-4">
          <ServiceHistory clientId={client.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
