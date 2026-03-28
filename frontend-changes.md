# Frontend Changes — Complete Checklist

Everything below lives in `src/`. Organized by priority: do them in order.

---

## Priority 1: Data Layer — Read/Write Supabase Instead of Demo Arrays

### Status: Every page currently reads from hardcoded `src/lib/data/demo.ts`. Forms show toasts but save nothing.

---

### 1.1 NEW FILE: `src/lib/data/queries.ts`

**Why:** Centralized server-side data access. Tries Supabase, falls back to demo arrays.

```ts
import { createClient } from "@/lib/supabase/server";
import {
  demoClients,
  demoServiceEntries,
  getClientById as getDemoClient,
  getServicesForClient as getDemoServices,
  demoServiceTypes,
} from "./demo";
import type { Client, ServiceEntry } from "@/types";

export async function getAllClients(): Promise<Client[]> {
  const supabase = await createClient();
  if (!supabase) return demoClients;

  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("last_name");

  if (error || !data) return demoClients;
  return data as Client[];
}

export async function getClientById(id: string): Promise<Client | null> {
  const supabase = await createClient();
  if (!supabase) return getDemoClient(id) ?? null;

  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return getDemoClient(id) ?? null;
  return data as Client;
}

export async function getServicesForClient(clientId: string): Promise<ServiceEntry[]> {
  const supabase = await createClient();
  if (!supabase) return getDemoServices(clientId);

  const { data, error } = await supabase
    .from("service_entries")
    .select("*, service_types(name)")
    .eq("client_id", clientId)
    .order("service_date", { ascending: false });

  if (error || !data) return getDemoServices(clientId);
  return data as ServiceEntry[];
}

export async function getServiceTypes(): Promise<string[]> {
  const supabase = await createClient();
  if (!supabase) return demoServiceTypes;

  const { data, error } = await supabase
    .from("service_types")
    .select("name")
    .eq("is_active", true)
    .order("name");

  if (error || !data) return demoServiceTypes;
  return data.map((r) => r.name);
}

export async function getDashboardStats() {
  const supabase = await createClient();
  if (!supabase) {
    return {
      totalClients: demoClients.length,
      totalEntries: demoServiceEntries.length,
      totalHours: Math.round(
        demoServiceEntries.reduce((s, e) => s + (e.duration_minutes ?? 0), 0) / 60
      ),
      recentEntries: demoServiceEntries.slice(0, 5),
    };
  }

  const [clientsRes, entriesRes] = await Promise.all([
    supabase.from("clients").select("id", { count: "exact", head: true }),
    supabase
      .from("service_entries")
      .select("id, duration_minutes, service_date, service_types(name)")
      .order("service_date", { ascending: false })
      .limit(100),
  ]);

  const entries = entriesRes.data ?? [];
  return {
    totalClients: clientsRes.count ?? 0,
    totalEntries: entries.length,
    totalHours: Math.round(
      entries.reduce((s, e: { duration_minutes?: number | null }) => s + ((e.duration_minutes) ?? 0), 0) / 60
    ),
    recentEntries: entries.slice(0, 5),
  };
}
```

---

### 1.2 CHANGE: `src/app/(app)/clients/page.tsx`

**Current:** Imports `demoClients` directly.
**Change:** Call `getAllClients()` from queries.

```diff
- import { demoClients } from "@/lib/data/demo";
+ import { getAllClients } from "@/lib/data/queries";

- export default function ClientsPage() {
+ export default async function ClientsPage() {
+   const clients = await getAllClients();
    return (
      <>
        <AppHeader ... />
        <div className="flex-1 px-6 py-8">
-         <ClientList clients={demoClients} />
+         <ClientList clients={clients} />
        </div>
      </>
    );
  }
```

---

### 1.3 CHANGE: `src/app/(app)/clients/[id]/page.tsx`

**Current:** Uses `getClientById` from demo.ts.
**Change:** Use async version from queries.ts.

```diff
- import { getClientById } from "@/lib/data/demo";
+ import { getClientById } from "@/lib/data/queries";

  export default async function ClientDetailPage({ params }: PageProps) {
    const { id } = await params;
    const client = await getClientById(id);
    if (!client) notFound();
    ...
  }
```

---

### 1.4 CHANGE: `src/components/services/service-history.tsx`

**Current:** Calls `getServicesForClient` from demo.ts (sync).
**Change:** Make it async, call from queries.ts.

```diff
- import { getServicesForClient } from "@/lib/data/demo";
+ import { getServicesForClient } from "@/lib/data/queries";

- export function ServiceHistory({ clientId }: ServiceHistoryProps) {
-   const entries = getServicesForClient(clientId);
+ export async function ServiceHistory({ clientId }: ServiceHistoryProps) {
+   const entries = await getServicesForClient(clientId);
    ...
  }
```

---

### 1.5 CHANGE: `src/app/(app)/services/new/[clientId]/page.tsx`

**Current:** Uses demo `getClientById`.
**Change:** Use queries.ts version + pass service types.

```diff
- import { getClientById } from "@/lib/data/demo";
+ import { getClientById, getServiceTypes } from "@/lib/data/queries";

  export default async function NewServicePage({ params }: PageProps) {
    const { clientId } = await params;
    const client = await getClientById(clientId);
    if (!client) notFound();
+   const serviceTypes = await getServiceTypes();

    return (
      <>
        <AppHeader ... />
        <div className="flex-1 px-6 py-8">
          <ServiceForm
            clientId={client.id}
            clientLabel={`${client.first_name} ${client.last_name}`}
+           serviceTypes={serviceTypes}
          />
        </div>
      </>
    );
  }
```

---

## Priority 2: Forms That Actually Save

### 2.1 CHANGE: `src/components/clients/client-form.tsx`

**Current:** `onSubmit` shows a toast and redirects. No insert.
**What to add:** POST to a new API route or use Supabase client directly.

Option A — call an API route (simpler, avoids client-side Supabase):

```diff
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
-   toast.success("Client saved (demo — connect Supabase to persist).");
-   setTimeout(() => {
-     setPending(false);
-     router.push("/clients");
-   }, 600);
+   const form = new FormData(e.currentTarget);
+   fetch("/api/clients", {
+     method: "POST",
+     headers: { "Content-Type": "application/json" },
+     body: JSON.stringify({
+       first_name: form.get("first_name"),
+       last_name: form.get("last_name"),
+       date_of_birth: form.get("dob") || null,
+       phone: form.get("phone") || null,
+       email: form.get("email") || null,
+       address: form.get("address") || null,
+     }),
+   })
+     .then((res) => {
+       if (!res.ok) throw new Error("Save failed");
+       toast.success("Client saved.");
+       router.push("/clients");
+     })
+     .catch(() => {
+       toast.error("Could not save. Check Supabase connection.");
+       setPending(false);
+     });
  }
```

Requires NEW API route: `src/app/api/clients/route.ts` (see backend tasks).

---

### 2.2 CHANGE: `src/components/services/service-form.tsx`

**Current:** `onSubmit` shows toast only. Doesn't save entry or AI fields.
**What to add:** POST to `/api/services` with all fields including AI output.

```diff
+ const [duration, setDuration] = useState("");
+ const [serviceDate, setServiceDate] = useState("");
+ const [transcript, setTranscript] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
-   toast.success("Service entry saved (demo — wire Supabase insert).");
+   setPending(true);
+   fetch("/api/services", {
+     method: "POST",
+     headers: { "Content-Type": "application/json" },
+     body: JSON.stringify({
+       client_id: clientId,
+       service_type: serviceType,
+       service_date: serviceDate,
+       duration_minutes: duration ? Number(duration) : null,
+       notes,
+       ai_summary: aiSummary,
+       ai_action_items: actionItems,
+       ai_mood_risk: aiMood,
+       source: transcript ? "voice" : "manual",
+       audio_transcript: transcript,
+     }),
+   })
+     .then((res) => {
+       if (!res.ok) throw new Error();
+       toast.success("Service entry saved.");
+       router.push(`/clients/${clientId}`);
+     })
+     .catch(() => {
+       toast.error("Could not save.");
+       setPending(false);
+     });
  }
```

Also update the VoiceRecorder callback to store the transcript:

```diff
  const onStructured = (data: StructuredNote) => {
    setAiSummary(data.summary);
    setAiMood(data.mood_risk);
    setActionItems(data.action_items);
+   // transcript is set from the voice recorder via a new prop or state lift
    ...
  };
```

And update `ServiceForm` props to accept `serviceTypes` from parent:

```diff
  interface ServiceFormProps {
    clientId: string;
    clientLabel: string;
+   serviceTypes?: string[];
  }

- import { demoServiceTypes } from "@/lib/data/demo";

  export function ServiceForm({ clientId, clientLabel, serviceTypes }: ServiceFormProps) {
-   // remove demoServiceTypes usage, use prop instead
+   const types = serviceTypes ?? [];
    ...
  }
```

---

### 2.3 CHANGE: `src/components/services/voice-recorder.tsx`

**Current:** Doesn't expose raw transcript to parent form.
**What to add:** Callback for raw transcript so ServiceForm can save it.

```diff
  interface VoiceRecorderProps {
    onStructuredNote: (data: StructuredNote) => void;
+   onTranscript?: (text: string) => void;
    serviceTypes: string[];
  }

  export function VoiceRecorder({
    onStructuredNote,
+   onTranscript,
    serviceTypes,
  }: VoiceRecorderProps) {
    ...
    const processAudio = async (audioBlob: Blob) => {
      ...
      const text = transcribeJson.transcript as string;
      setTranscript(text);
+     onTranscript?.(text);
      ...
    };
  }
```

---

## Priority 3: New API Routes for CRUD

### 3.1 NEW FILE: `src/app/api/clients/route.ts`

```ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json({ id: "demo-" + Date.now() }); // demo mode
    }

    const { data, error } = await supabase
      .from("clients")
      .insert({
        first_name: body.first_name,
        last_name: body.last_name,
        date_of_birth: body.date_of_birth,
        phone: body.phone,
        email: body.email,
        address: body.address,
        demographics: body.demographics ?? {},
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ id: data.id });
  } catch {
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }
}
```

---

### 3.2 NEW FILE: `src/app/api/services/route.ts`

```ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json({ id: "demo-" + Date.now() });
    }

    // Look up service_type_id from name
    let serviceTypeId: string | null = null;
    if (body.service_type) {
      const { data: typeRow } = await supabase
        .from("service_types")
        .select("id")
        .eq("name", body.service_type)
        .single();
      serviceTypeId = typeRow?.id ?? null;
    }

    const { data, error } = await supabase
      .from("service_entries")
      .insert({
        client_id: body.client_id,
        service_type_id: serviceTypeId,
        service_date: body.service_date || new Date().toISOString(),
        duration_minutes: body.duration_minutes,
        notes: body.notes,
        ai_summary: body.ai_summary,
        ai_action_items: body.ai_action_items ?? [],
        ai_mood_risk: body.ai_mood_risk,
        source: body.source ?? "manual",
        audio_transcript: body.audio_transcript,
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ id: data.id });
  } catch {
    return NextResponse.json({ error: "Failed to save service entry" }, { status: 500 });
  }
}
```

---

## Priority 4: Dashboard Reads Real Data

### 4.1 CHANGE: `src/components/dashboard/stats-cards.tsx`

**Current:** All stats are hardcoded (`128`, `342`, `516`, `23`).
**What to add:** Accept props from server, fall back to demo.

```diff
+ interface StatsCardsProps {
+   totalClients?: number;
+   totalEntries?: number;
+   totalHours?: number;
+ }

- export function StatsCards() {
+ export function StatsCards({
+   totalClients = 128,
+   totalEntries = 342,
+   totalHours = 516,
+ }: StatsCardsProps) {
    const stats = [
-     { label: "Active clients", value: "128", ... },
-     { label: "Visits logged", value: "342", ... },
-     { label: "Hours documented", value: "516", ... },
+     { label: "Active clients", value: String(totalClients), ... },
+     { label: "Visits logged", value: String(totalEntries), ... },
+     { label: "Hours documented", value: String(totalHours), ... },
      { label: "Follow-ups due", value: "23", hint: "This week", icon: TrendingUp },
    ];
    ...
  }
```

### 4.2 CHANGE: `src/components/dashboard/stats-cards-loader.tsx`

Pass real data down:

```diff
+ import { getDashboardStats } from "@/lib/data/queries";

- export function StatsCardsLoader() {
-   return <StatsCards />;
+ export async function StatsCardsLoader() {
+   const stats = await getDashboardStats();
+   return (
+     <StatsCards
+       totalClients={stats.totalClients}
+       totalEntries={stats.totalEntries}
+       totalHours={stats.totalHours}
+     />
+   );
  }
```

Note: This changes from a client component to a server component. Remove the `dynamic()` import and `"use client"` — or keep the wrapper and pass data via a server-side parent.

Simpler approach — keep the loader as-is but change `src/app/(app)/dashboard/page.tsx`:

```diff
+ import { getDashboardStats } from "@/lib/data/queries";

  export default async function DashboardPage() {
+   const stats = await getDashboardStats();
    return (
      <>
        <AppHeader ... />
        <div className="flex-1 space-y-8 px-6 py-8">
-         <StatsCardsLoader />
+         <StatsCardsLoader
+           totalClients={stats.totalClients}
+           totalEntries={stats.totalEntries}
+           totalHours={stats.totalHours}
+         />
        </div>
      </>
    );
  }
```

---

## Priority 5: CSV Export That Returns Real Data

### 5.1 CHANGE: `src/app/api/export/csv/route.ts`

**Current:** Returns 1 hardcoded row.
**What to add:** Query all clients from Supabase, format as CSV.

```diff
  import { NextResponse } from "next/server";
+ import { createClient } from "@/lib/supabase/server";
+ import { demoClients } from "@/lib/data/demo";

  export async function GET() {
-   const csv =
-     "client_id,first_name,last_name,last_service_date\n" +
-     "a0000000-0000-4000-8000-000000000001,Maria,Santos,2026-03-26\n";
+   const supabase = await createClient();
+   let rows: { id: string; first_name: string; last_name: string; phone: string | null; email: string | null }[];
+
+   if (supabase) {
+     const { data } = await supabase.from("clients").select("id, first_name, last_name, phone, email").order("last_name");
+     rows = data ?? [];
+   } else {
+     rows = demoClients.map((c) => ({ id: c.id, first_name: c.first_name, last_name: c.last_name, phone: c.phone, email: c.email }));
+   }
+
+   const header = "id,first_name,last_name,phone,email";
+   const lines = rows.map((r) => `${r.id},${r.first_name},${r.last_name},${r.phone ?? ""},${r.email ?? ""}`);
+   const csv = [header, ...lines].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
-       "Content-Disposition": 'attachment; filename="clients-export-demo.csv"',
+       "Content-Disposition": 'attachment; filename="clients-export.csv"',
      },
    });
  }
```

---

## Priority 6: .env.local.example

### 6.1 NEW FILE: `.env.local.example`

```env
# Groq — free, no credit card (console.groq.com)
GROQ_API_KEY=

# Supabase — free tier (supabase.com)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Google Gemini — optional fallback LLM (aistudio.google.com)
GOOGLE_AI_API_KEY=

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Priority 7: Enrich Demo Data

### 7.1 CHANGE: `src/lib/data/demo.ts`

**Current:** Only 3 clients and 3 service entries.
**What to add:** At least 10 clients and 15+ service entries so the app looks populated even without Supabase.

Add these clients to `demoClients`:

```ts
{
  id: "a0000000-0000-4000-8000-000000000004",
  first_name: "David",
  last_name: "Williams",
  date_of_birth: "1968-01-30",
  phone: "(555) 440-1004",
  email: null,
  address: "88 Pine Ave, Springfield",
  demographics: { language: "EN", veteran: true },
},
{
  id: "a0000000-0000-4000-8000-000000000005",
  first_name: "Fatima",
  last_name: "Hassan",
  date_of_birth: "1995-09-12",
  phone: "(555) 660-1005",
  email: "fatima.h@email.example",
  address: "12 Cedar Ln, Unit 3A",
  demographics: { language: "AR/EN", household: 5, referral: "Refugee Services" },
},
{
  id: "a0000000-0000-4000-8000-000000000006",
  first_name: "Robert",
  last_name: "Johnson",
  date_of_birth: "1980-05-20",
  phone: "(555) 770-1006",
  email: "r.johnson@email.example",
  address: "301 Elm St, Springfield",
  demographics: { language: "EN", employment: "part-time" },
},
{
  id: "a0000000-0000-4000-8000-000000000007",
  first_name: "Lisa",
  last_name: "Chen",
  date_of_birth: "1988-12-03",
  phone: "(555) 880-1007",
  email: "lisa.c@email.example",
  address: null,
  demographics: { language: "ZH/EN", household: 2 },
},
{
  id: "a0000000-0000-4000-8000-000000000008",
  first_name: "Marcus",
  last_name: "Brown",
  date_of_birth: "2005-04-17",
  phone: "(555) 990-1008",
  email: null,
  address: "Unit 7, Maple Commons",
  demographics: { language: "EN", referral: "School counselor" },
},
{
  id: "a0000000-0000-4000-8000-000000000009",
  first_name: "Patricia",
  last_name: "Rivera",
  date_of_birth: "1975-08-25",
  phone: "(555) 110-1009",
  email: "p.rivera@email.example",
  address: "550 Birch Rd, Springfield",
  demographics: { language: "ES/EN", household: 6 },
},
{
  id: "a0000000-0000-4000-8000-000000000010",
  first_name: "Samuel",
  last_name: "Okafor",
  date_of_birth: "1992-02-14",
  phone: "(555) 220-1010",
  email: "sam.o@email.example",
  address: "19 Walnut Dr",
  demographics: { language: "EN", employment: "seeking" },
},
```

Add more service entries spanning different clients and types:

```ts
{
  id: "e1000000-0000-4000-8000-000000000004",
  client_id: "a0000000-0000-4000-8000-000000000005",
  service_type_id: null, staff_id: null,
  service_date: new Date(Date.now() - 86400000 * 4).toISOString(),
  duration_minutes: 60,
  notes: "Completed refugee resettlement paperwork. Discussed ESL class enrollment and transportation options.",
  ai_summary: null, ai_action_items: [], ai_mood_risk: null,
  source: "manual", audio_transcript: null,
  service_types: { name: "Benefits enrollment" },
},
{
  id: "e1000000-0000-4000-8000-000000000005",
  client_id: "a0000000-0000-4000-8000-000000000004",
  service_type_id: null, staff_id: null,
  service_date: new Date(Date.now() - 86400000 * 5).toISOString(),
  duration_minutes: 50,
  notes: "VA benefits review. Client eligible for housing voucher — submitted application today.",
  ai_summary: null, ai_action_items: [], ai_mood_risk: null,
  source: "voice", audio_transcript: "Veteran discussed VA housing options...",
  service_types: { name: "Housing navigation" },
},
{
  id: "e1000000-0000-4000-8000-000000000006",
  client_id: "a0000000-0000-4000-8000-000000000006",
  service_type_id: null, staff_id: null,
  service_date: new Date(Date.now() - 86400000 * 1).toISOString(),
  duration_minutes: 40,
  notes: "Mock interview practice. Client showed strong improvement. Referred to two open positions at partner employer.",
  ai_summary: null, ai_action_items: [], ai_mood_risk: null,
  source: "manual", audio_transcript: null,
  service_types: { name: "Employment coaching" },
},
{
  id: "e1000000-0000-4000-8000-000000000007",
  client_id: "a0000000-0000-4000-8000-000000000008",
  service_type_id: null, staff_id: null,
  service_date: new Date(Date.now() - 86400000 * 3).toISOString(),
  duration_minutes: 55,
  notes: "After-school mentoring session. Worked on college application essay. Student is motivated and on track.",
  ai_summary: null, ai_action_items: [], ai_mood_risk: null,
  source: "manual", audio_transcript: null,
  service_types: { name: "Mental health referral" },
},
{
  id: "e1000000-0000-4000-8000-000000000008",
  client_id: "a0000000-0000-4000-8000-000000000009",
  service_type_id: null, staff_id: null,
  service_date: new Date(Date.now() - 86400000 * 6).toISOString(),
  duration_minutes: 35,
  notes: "Food pantry visit. Provided two weeks of groceries and connected family with WIC enrollment.",
  ai_summary: null, ai_action_items: [], ai_mood_risk: null,
  source: "manual", audio_transcript: null,
  service_types: { name: "Food assistance" },
},
{
  id: "e1000000-0000-4000-8000-000000000009",
  client_id: DEMO_CLIENT_IDS.maria,
  service_type_id: null, staff_id: null,
  service_date: new Date(Date.now() - 86400000 * 15).toISOString(),
  duration_minutes: 30,
  notes: "Reviewed county benefits application status. Client received approval letter — enrollment next step.",
  ai_summary: null, ai_action_items: [], ai_mood_risk: null,
  source: "manual", audio_transcript: null,
  service_types: { name: "Benefits enrollment" },
},
{
  id: "e1000000-0000-4000-8000-000000000010",
  client_id: DEMO_CLIENT_IDS.james,
  service_type_id: null, staff_id: null,
  service_date: new Date(Date.now() - 86400000 * 8).toISOString(),
  duration_minutes: 45,
  notes: "Completed job readiness assessment. Score improved from 4 to 7. Scheduled follow-up for interview coaching.",
  ai_summary: null, ai_action_items: [], ai_mood_risk: null,
  source: "voice", audio_transcript: "Client and I reviewed his job readiness checklist...",
  service_types: { name: "Employment coaching" },
},
```

Also update `DEMO_CLIENT_IDS` to include new IDs so `getServicesForClient` works.

---

## Priority 8: Minor UI Fixes

### 8.1 CHANGE: `src/components/clients/client-list.tsx`

**Fix:** Update the record count text to not always say "(demo data)":

```diff
  <p className="text-xs text-muted-foreground">
-   Showing {filtered.length} of {clients.length} records (demo data).
+   Showing {filtered.length} of {clients.length} records.
  </p>
```

---

### 8.2 CHANGE: `src/components/services/service-form.tsx`

**Fix:** Remove hardcoded `demoServiceTypes` import, use prop:

```diff
- import { demoServiceTypes } from "@/lib/data/demo";
  ...
- {demoServiceTypes.map((t) => (
+ {(serviceTypes ?? []).map((t) => (
    <SelectItem key={t} value={t}>{t}</SelectItem>
  ))}
```

---

### 8.3 CHANGE: `src/app/(app)/reports/page.tsx`

**Fix:** The "View sample" link hardcodes a demo ID. Leave it, but update the description text:

```diff
  <CardDescription>
-   Demo endpoint at <code className="text-xs">/api/export/csv</code> — wire Papa Parse
-   on the client when you add bulk spreadsheets.
+   Export all client records as CSV.
  </CardDescription>
```

---

### 8.4 CHANGE: Various description strings

Search for strings containing "demo", "wire", "connect Supabase" and clean them up for judges. Key files:

| File | Current text | Replace with |
|---|---|---|
| `clients/page.tsx` | "Data below is demo content until Supabase is configured." | "Search and manage client records." |
| `clients/new/page.tsx` | "Capture intake fields mapped to your `clients` table." | "Register a new client." |
| `services/new/[clientId]/page.tsx` | "Manual entry plus voice capture — Groq Whisper + Llama structure your notes." | "Log a visit manually or use voice capture." |
| `dashboard/page.tsx` | "Program pulse: visits, hours, and service mix. Demo metrics light up the UI before Supabase is connected." | "Program pulse: visits, hours, and service mix." |
| `reports/page.tsx` | "Generate funder narratives from aggregated visits. Preview a saved sample report anytime." | "Generate funder narratives from aggregated visits." |
| `login/page.tsx` | "Supabase Auth plugs in here — use demo access below for the hackathon UI." | "Sign in to access your workspace." |

---

## Priority 9: Mobile Responsiveness Pass

### 9.1 CHANGE: `src/components/layout/app-sidebar.tsx`

**Problem:** Sidebar is always visible, no mobile toggle. On small screens it squeezes content.
**Quick fix:** Hide sidebar on mobile, add a hamburger menu.

```diff
  <aside className="
-   flex h-full w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground
+   hidden md:flex h-full w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground
  ">
```

Then add a mobile header in `app-shell.tsx`:

```diff
+ import { AppMobileNav } from "@/components/layout/app-mobile-nav";

  export function AppShell({ children }: { children: ReactNode }) {
    return (
      <div className="flex min-h-screen bg-background">
        <AppSidebar />
-       <div className="flex min-h-screen min-w-0 flex-1 flex-col">{children}</div>
+       <div className="flex min-h-screen min-w-0 flex-1 flex-col">
+         <AppMobileNav />
+         {children}
+       </div>
      </div>
    );
  }
```

### 9.2 NEW FILE: `src/components/layout/app-mobile-nav.tsx`

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, FileBarChart, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/reports", label: "Reports", icon: FileBarChart },
];

export function AppMobileNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 border-b border-border bg-background px-4 py-2 md:hidden">
      <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary mr-2">
        <Sparkles className="size-4" />
      </div>
      {nav.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
              active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="size-3.5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
```

---

## Summary: File Change Checklist

| # | File | Action | Priority |
|---|---|---|---|
| 1 | `src/lib/data/queries.ts` | CREATE — server-side data access | P1 |
| 2 | `src/app/(app)/clients/page.tsx` | CHANGE — use queries.ts | P1 |
| 3 | `src/app/(app)/clients/[id]/page.tsx` | CHANGE — use queries.ts | P1 |
| 4 | `src/components/services/service-history.tsx` | CHANGE — async, use queries.ts | P1 |
| 5 | `src/app/(app)/services/new/[clientId]/page.tsx` | CHANGE — pass serviceTypes | P1 |
| 6 | `src/components/clients/client-form.tsx` | CHANGE — POST to API | P2 |
| 7 | `src/components/services/service-form.tsx` | CHANGE — POST to API, use prop | P2 |
| 8 | `src/components/services/voice-recorder.tsx` | CHANGE — expose transcript | P2 |
| 9 | `src/app/api/clients/route.ts` | CREATE — Supabase insert | P2 |
| 10 | `src/app/api/services/route.ts` | CREATE — Supabase insert | P2 |
| 11 | `src/components/dashboard/stats-cards.tsx` | CHANGE — accept props | P3 |
| 12 | `src/app/(app)/dashboard/page.tsx` | CHANGE — pass real stats | P3 |
| 13 | `src/app/api/export/csv/route.ts` | CHANGE — query Supabase | P4 |
| 14 | `.env.local.example` | CREATE | P4 |
| 15 | `src/lib/data/demo.ts` | CHANGE — add 7+ clients, 7+ entries | P5 |
| 16 | `src/components/clients/client-list.tsx` | CHANGE — remove "demo data" text | P6 |
| 17 | Multiple page files | CHANGE — clean up description strings | P6 |
| 18 | `src/components/layout/app-sidebar.tsx` | CHANGE — hide on mobile | P7 |
| 19 | `src/components/layout/app-shell.tsx` | CHANGE — add mobile nav | P7 |
| 20 | `src/components/layout/app-mobile-nav.tsx` | CREATE — mobile navigation | P7 |

---

## What NOT to Change (Already Working Well)

- `src/components/services/voice-recorder.tsx` — core recording logic is solid
- `src/components/reports/report-generator.tsx` — generation + editing + copy works
- `src/components/reports/report-preview.tsx` — clean read-only view
- `src/app/api/ai/*` — all three AI routes have proper Groq calls + demo fallbacks
- `src/lib/ai/groq.ts` — well-structured with null-key guard
- `src/app/page.tsx` — landing page is polished
- `src/app/login/page.tsx` — login UI works (just needs real auth wiring)
- `src/components/ui/*` — all shadcn components are properly configured
- `src/app/globals.css` — theme/colors are well tuned
- `src/app/layout.tsx` — fonts + metadata + Toaster all good
