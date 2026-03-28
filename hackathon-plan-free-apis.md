# Client Case Management Platform — 24-Hour Hackathon Battle Plan
## Updated: 100% Free APIs (Groq + Supabase + Vercel)

---

## Total Cost: $0

Every API in this plan has a free tier. No credit card required anywhere.

| Service | Free Tier | What We Use It For |
|---|---|---|
| **Groq** (console.groq.com) | 14,400 req/day, 6,000 tokens/min, no credit card | Whisper STT + Llama 3.3 70B for note structuring & reports |
| **Supabase** (supabase.com) | 500MB DB, 1GB storage, 50K auth users | PostgreSQL, Auth, Row-Level Security, Storage |
| **Vercel** (vercel.com) | 100GB bandwidth, serverless functions | Hosting + one-click deploy from GitHub |
| **Google Gemini** (aistudio.google.com) | 250 req/day on 2.5 Flash, no credit card | Backup LLM if Groq rate-limits hit |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Vercel)                      │
│             Next.js 14 + shadcn/ui + Tailwind            │
│                                                           │
│  Dashboard │ Client List │ Profile │ Voice Form │ Reports │
└──────────────────────────┬──────────────────────────────┘
                           │
                    Next.js API Routes
                           │
            ┌──────────────┼──────────────┐
            ▼              ▼              ▼
   ┌─────────────┐ ┌────────────┐ ┌─────────────┐
   │  Groq API   │ │  Supabase  │ │  Groq API   │
   │  Whisper    │ │ PostgreSQL │ │  Llama 3.3  │
   │  (FREE STT) │ │  + Auth    │ │  70B (FREE) │
   └─────────────┘ │  (FREE)    │ └─────────────┘
                   └────────────┘
                        │
                  ┌─────┴──────┐
                  │  Fallback  │
                  │  Gemini    │
                  │  2.5 Flash │
                  │  (FREE)    │
                  └────────────┘
```

### Why Groq for Everything

1. **One API key** covers both speech-to-text (Whisper) and LLM (Llama 3.3 70B)
2. **OpenAI-compatible** — uses the standard `openai` SDK, just change the base URL
3. **14,400 requests/day** — more than enough for a hackathon
4. **700+ tokens/second** — judges see near-instant AI responses
5. **No credit card required** — sign up and start building immediately
6. **Llama 3.3 70B** handles structured JSON output well for note structuring and report generation

---

## Tech Stack (Final)

| Layer | Technology | Cost |
|---|---|---|
| Frontend | Next.js 14+ (App Router) | Free |
| UI Library | shadcn/ui + Tailwind CSS | Free |
| Database | Supabase (PostgreSQL + Auth + RLS) | Free |
| Hosting | Vercel | Free |
| Speech-to-Text | **Groq Whisper Large v3 Turbo** | Free |
| LLM (Notes + Reports) | **Groq Llama 3.3 70B Versatile** | Free |
| Fallback LLM | Google Gemini 2.5 Flash | Free |
| CSV Processing | Papa Parse | Free |
| Charts | Recharts | Free |

---

## Environment Variables (.env.local)

```env
# Groq — ONE key for STT + LLM (free, no credit card)
GROQ_API_KEY=gsk_...

# Google Gemini — backup LLM (free, no credit card)
GOOGLE_AI_API_KEY=AI...

# Supabase (free)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Getting Your Keys (10 minutes)

1. **Groq**: Go to console.groq.com → Sign up → API Keys → Create → Copy
2. **Google AI Studio**: Go to aistudio.google.com → Sign in with Google → Get API Key → Create → Copy
3. **Supabase**: Go to supabase.com → New Project → Settings → API → Copy URL + anon key + service role key
4. **Vercel**: Connect GitHub repo → Auto-deploys on push

---

## Database Schema

```sql
-- 1. Profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Clients
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE,
  phone TEXT,
  email TEXT,
  address TEXT,
  demographics JSONB DEFAULT '{}',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Service Types (configurable dropdown)
CREATE TABLE service_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Service Entries (visit/service log)
CREATE TABLE service_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  service_type_id UUID REFERENCES service_types(id),
  staff_id UUID REFERENCES profiles(id),
  service_date TIMESTAMPTZ DEFAULT now(),
  duration_minutes INTEGER,
  notes TEXT,
  ai_summary TEXT,
  ai_action_items JSONB DEFAULT '[]',
  ai_mood_risk TEXT,
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'voice')),
  audio_transcript TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Funder Report Templates
CREATE TABLE report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  funder_name TEXT,
  template_prompt TEXT NOT NULL,
  sections JSONB NOT NULL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Generated Reports
CREATE TABLE generated_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES report_templates(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  raw_data JSONB,
  narrative TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'final')),
  generated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Audit Log
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  changes JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_clients_name ON clients(last_name, first_name);
CREATE INDEX idx_service_entries_client ON service_entries(client_id);
CREATE INDEX idx_service_entries_date ON service_entries(service_date);
CREATE INDEX idx_audit_log_date ON audit_log(created_at);
```

### Row Level Security (RLS)

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_entries ENABLE ROW LEVEL SECURITY;

-- Staff can read all, create new
CREATE POLICY "Staff can view all clients" ON clients
  FOR SELECT USING (auth.uid() IN (SELECT id FROM profiles));

CREATE POLICY "Staff can create clients" ON clients
  FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM profiles));

-- Only admins can update/delete
CREATE POLICY "Admins can update clients" ON clients
  FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

CREATE POLICY "Admins can delete clients" ON clients
  FOR DELETE USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- Service entries: all staff can read and create
CREATE POLICY "Staff can view service entries" ON service_entries
  FOR SELECT USING (auth.uid() IN (SELECT id FROM profiles));

CREATE POLICY "Staff can create service entries" ON service_entries
  FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM profiles));
```

---

## Project Structure

```
client-case-management/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── login/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── clients/
│   │   │   ├── page.tsx               # Client list + search
│   │   │   ├── new/page.tsx           # New client form
│   │   │   └── [id]/page.tsx          # Client profile
│   │   ├── services/
│   │   │   └── new/[clientId]/page.tsx # Service form + voice
│   │   ├── reports/
│   │   │   ├── page.tsx               # Report generator
│   │   │   └── [id]/page.tsx          # View report
│   │   └── api/
│   │       ├── ai/
│   │       │   ├── transcribe/route.ts
│   │       │   ├── structure-notes/route.ts
│   │       │   └── generate-report/route.ts
│   │       └── export/
│   │           └── csv/route.ts
│   ├── components/
│   │   ├── ui/                        # shadcn components
│   │   ├── clients/
│   │   │   ├── ClientList.tsx
│   │   │   ├── ClientForm.tsx
│   │   │   └── ClientProfile.tsx
│   │   ├── services/
│   │   │   ├── ServiceForm.tsx
│   │   │   ├── ServiceHistory.tsx
│   │   │   └── VoiceRecorder.tsx
│   │   ├── reports/
│   │   │   ├── ReportGenerator.tsx
│   │   │   └── ReportPreview.tsx
│   │   └── dashboard/
│   │       └── StatsCards.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   └── server.ts
│   │   ├── ai/
│   │   │   ├── groq.ts               # Groq client (STT + LLM)
│   │   │   ├── gemini.ts             # Fallback LLM
│   │   │   └── prompts.ts            # System prompt registry
│   │   └── utils/
│   │       └── csv.ts
│   └── types/index.ts
├── supabase/
│   ├── migrations/001_initial_schema.sql
│   └── seed.sql
├── .env.local.example
├── package.json
└── README.md
```

---

## AI Client Setup (lib/ai/groq.ts)

This is the central AI client — one file handles both STT and LLM.

```typescript
// lib/ai/groq.ts
import OpenAI from "openai";

// Single Groq client for EVERYTHING (STT + LLM)
// OpenAI-compatible API — same SDK, different base URL
export const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY!,
  baseURL: "https://api.groq.com/openai/v1",
});

// ----- Speech-to-Text -----
export async function transcribeAudio(audioFile: File): Promise<string> {
  const transcription = await groq.audio.transcriptions.create({
    model: "whisper-large-v3-turbo",  // fastest, free on Groq
    file: audioFile,
    language: "en",
  });
  return transcription.text;
}

// ----- LLM: Structure Notes -----
export async function structureNotes(
  transcript: string,
  serviceTypes: string[]
): Promise<StructuredNote> {
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: `You are a case management assistant for a nonprofit organization.
Given a voice transcript from a case manager after a client session, extract structured case notes.

Available service types: ${serviceTypes.join(", ")}

Respond ONLY with valid JSON matching this exact schema:
{
  "summary": "2-3 sentence clinical summary of the session",
  "service_type": "best matching service type from the list above",
  "action_items": ["specific follow-up actions mentioned or implied"],
  "mood_risk": "brief mood/risk assessment (Low/Medium/High risk with one-line reasoning)",
  "follow_up_date": "YYYY-MM-DD if mentioned or implied, null otherwise",
  "key_observations": "notable client statements or behavioral observations"
}

Rules:
- Extract ONLY what was said. Never fabricate details.
- If no service type matches, use the closest one.
- If no follow-up date is mentioned, set to null.
- Keep summary under 3 sentences.`
      },
      { role: "user", content: transcript }
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
    max_tokens: 1024,
  });

  return JSON.parse(completion.choices[0].message.content!);
}

// ----- LLM: Generate Funder Report -----
export async function generateFunderReport(
  aggregatedData: ReportData
): Promise<FunderReport> {
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: `You are a grant report writer for a nonprofit organization.
Given aggregated service data, generate a professional funder report.

Write in a warm but data-driven tone. Include specific numbers from the data.

Respond ONLY with valid JSON matching this schema:
{
  "title": "Quarterly Impact Report — [Quarter] [Year]",
  "sections": [
    { "title": "Executive Summary", "content": "2-3 paragraph overview..." },
    { "title": "Population Served", "content": "Demographics narrative with numbers..." },
    { "title": "Services Delivered", "content": "Breakdown by service type with hours..." },
    { "title": "Outcomes & Impact", "content": "Key outcomes and client stories..." },
    { "title": "Looking Ahead", "content": "Goals and needs for next quarter..." }
  ]
}

Rules:
- Use ONLY the numbers in the provided data. Never fabricate statistics.
- Write complete paragraphs, not bullet points.
- Make it compelling for a funder — show impact, not just activity.`
      },
      {
        role: "user",
        content: `Generate a funder report for this data:\n${JSON.stringify(aggregatedData, null, 2)}`
      }
    ],
    response_format: { type: "json_object" },
    temperature: 0.5,
    max_tokens: 4096,
  });

  return JSON.parse(completion.choices[0].message.content!);
}
```

## Fallback LLM (lib/ai/gemini.ts)

```typescript
// lib/ai/gemini.ts
// Backup if Groq rate limits hit during demo

const GEMINI_API_KEY = process.env.GOOGLE_AI_API_KEY;
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

export async function geminiChat(
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: [{ text: userMessage }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.3,
        maxOutputTokens: 4096,
      },
    }),
  });

  const data = await res.json();
  return data.candidates[0].content.parts[0].text;
}
```

## Smart Fallback Wrapper (lib/ai/llm.ts)

```typescript
// lib/ai/llm.ts
// Tries Groq first, falls back to Gemini on 429 errors

import { groq } from "./groq";
import { geminiChat } from "./gemini";

export async function llmChat(
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  try {
    // Primary: Groq (fastest, 14,400 req/day)
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 4096,
    });
    return completion.choices[0].message.content!;
  } catch (error: any) {
    if (error?.status === 429) {
      console.warn("Groq rate limited, falling back to Gemini...");
      // Fallback: Gemini 2.5 Flash (250 req/day)
      return geminiChat(systemPrompt, userMessage);
    }
    throw error;
  }
}
```

---

## API Routes (Updated for Groq)

### /api/ai/transcribe/route.ts

```typescript
import { NextResponse } from "next/server";
import { transcribeAudio } from "@/lib/ai/groq";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file" }, { status: 400 });
    }

    const transcript = await transcribeAudio(audioFile);
    return NextResponse.json({ transcript });
  } catch (error: any) {
    console.error("Transcription error:", error);
    return NextResponse.json(
      { error: "Transcription failed" },
      { status: 500 }
    );
  }
}
```

### /api/ai/structure-notes/route.ts

```typescript
import { NextResponse } from "next/server";
import { structureNotes } from "@/lib/ai/groq";

export async function POST(req: Request) {
  try {
    const { transcript, serviceTypes } = await req.json();

    if (!transcript) {
      return NextResponse.json({ error: "No transcript" }, { status: 400 });
    }

    const structured = await structureNotes(transcript, serviceTypes);
    return NextResponse.json(structured);
  } catch (error: any) {
    console.error("Note structuring error:", error);
    return NextResponse.json(
      { error: "Note structuring failed" },
      { status: 500 }
    );
  }
}
```

### /api/ai/generate-report/route.ts

```typescript
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateFunderReport } from "@/lib/ai/groq";

export async function POST(req: Request) {
  try {
    const { period_start, period_end } = await req.json();
    const supabase = await createClient();

    // Aggregate data from database
    const [clientsRes, servicesRes] = await Promise.all([
      supabase
        .from("service_entries")
        .select("client_id")
        .gte("service_date", period_start)
        .lte("service_date", period_end),
      supabase
        .from("service_entries")
        .select(`
          id,
          service_date,
          duration_minutes,
          notes,
          service_types (name),
          clients (first_name, last_name, demographics, date_of_birth)
        `)
        .gte("service_date", period_start)
        .lte("service_date", period_end),
    ]);

    // Build aggregated data
    const uniqueClients = new Set(clientsRes.data?.map(r => r.client_id));
    const servicesByType: Record<string, number> = {};
    let totalHours = 0;

    servicesRes.data?.forEach((entry: any) => {
      const typeName = entry.service_types?.name || "Other";
      servicesByType[typeName] = (servicesByType[typeName] || 0) + 1;
      totalHours += (entry.duration_minutes || 0) / 60;
    });

    const aggregatedData = {
      period: { start: period_start, end: period_end },
      total_unique_clients: uniqueClients.size,
      total_service_entries: servicesRes.data?.length || 0,
      total_service_hours: Math.round(totalHours * 10) / 10,
      services_by_type: servicesByType,
    };

    // Generate narrative with Groq Llama 3.3 70B
    const report = await generateFunderReport(aggregatedData);

    // Save to database
    const { data: user } = await supabase.auth.getUser();
    await supabase.from("generated_reports").insert({
      period_start,
      period_end,
      raw_data: aggregatedData,
      narrative: JSON.stringify(report),
      generated_by: user.user?.id,
    });

    return NextResponse.json(report);
  } catch (error: any) {
    console.error("Report generation error:", error);
    return NextResponse.json(
      { error: "Report generation failed" },
      { status: 500 }
    );
  }
}
```

---

## Voice Recorder Component

```tsx
// components/services/VoiceRecorder.tsx
"use client";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2, CheckCircle } from "lucide-react";

interface StructuredNote {
  summary: string;
  service_type: string;
  action_items: string[];
  mood_risk: string;
  follow_up_date: string | null;
  key_observations: string;
}

interface VoiceRecorderProps {
  onTranscriptionComplete: (data: StructuredNote) => void;
  serviceTypes: string[];
}

export function VoiceRecorder({
  onTranscriptionComplete,
  serviceTypes,
}: VoiceRecorderProps) {
  const [status, setStatus] = useState<
    "idle" | "recording" | "transcribing" | "structuring" | "done"
  >("idle");
  const [transcript, setTranscript] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        await processAudio(audioBlob);
      };

      mediaRecorder.start(1000);
      setStatus("recording");
    } catch (err) {
      alert("Microphone access denied. Please allow microphone access.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
  };

  const processAudio = async (audioBlob: Blob) => {
    try {
      // Step 1: Transcribe via Groq Whisper
      setStatus("transcribing");
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      const transcribeRes = await fetch("/api/ai/transcribe", {
        method: "POST",
        body: formData,
      });
      const { transcript: text } = await transcribeRes.json();
      setTranscript(text);

      // Step 2: Structure via Groq Llama 3.3 70B
      setStatus("structuring");
      const structureRes = await fetch("/api/ai/structure-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: text, serviceTypes }),
      });
      const structured = await structureRes.json();

      setStatus("done");
      onTranscriptionComplete(structured);
    } catch (error) {
      console.error("Processing failed:", error);
      setStatus("idle");
      alert("Processing failed. Please try again.");
    }
  };

  const statusMessages = {
    idle: null,
    recording: "Recording... speak now",
    transcribing: "Transcribing with Whisper...",
    structuring: "AI is structuring your notes...",
    done: "Notes structured successfully!",
  };

  return (
    <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
      <div className="flex items-center gap-3">
        {status === "idle" && (
          <Button onClick={startRecording} variant="outline">
            <Mic className="mr-2 h-4 w-4" />
            Record Case Notes
          </Button>
        )}

        {status === "recording" && (
          <Button onClick={stopRecording} variant="destructive">
            <Square className="mr-2 h-4 w-4" />
            Stop Recording
          </Button>
        )}

        {(status === "transcribing" || status === "structuring") && (
          <Button disabled variant="outline">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </Button>
        )}

        {status === "done" && (
          <Button
            onClick={() => { setStatus("idle"); setTranscript(""); }}
            variant="outline"
          >
            <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
            Record Another
          </Button>
        )}

        {statusMessages[status] && (
          <span className={`text-sm ${
            status === "recording" ? "text-red-500 animate-pulse" :
            status === "done" ? "text-green-600" :
            "text-muted-foreground"
          }`}>
            {status === "recording" && "● "}
            {statusMessages[status]}
          </span>
        )}
      </div>

      {transcript && (
        <div className="text-sm text-muted-foreground bg-background p-3 rounded border">
          <span className="font-medium">Transcript: </span>
          {transcript}
        </div>
      )}
    </div>
  );
}
```

---

## Report Generator Component

```tsx
// components/reports/ReportGenerator.tsx
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, FileText, Copy } from "lucide-react";

interface ReportSection {
  title: string;
  content: string;
}

interface Report {
  title: string;
  sections: ReportSection[];
}

export function ReportGenerator() {
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<Report | null>(null);

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
      setReport(data);
    } catch (error) {
      alert("Report generation failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (!report) return;
    const text = report.sections
      .map((s) => `## ${s.title}\n\n${s.content}`)
      .join("\n\n---\n\n");
    navigator.clipboard.writeText(`# ${report.title}\n\n${text}`);
    alert("Report copied to clipboard!");
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4 items-end flex-wrap">
        <div>
          <label className="text-sm font-medium">Period Start</label>
          <Input
            type="date"
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Period End</label>
          <Input
            type="date"
            value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value)}
          />
        </div>
        <Button
          onClick={generate}
          disabled={isGenerating || !periodStart || !periodEnd}
        >
          {isGenerating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileText className="mr-2 h-4 w-4" />
          )}
          Generate Report
        </Button>
      </div>

      {report && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">{report.title}</h2>
            <Button variant="outline" onClick={copyToClipboard}>
              <Copy className="mr-2 h-4 w-4" />
              Copy Report
            </Button>
          </div>

          {report.sections.map((section, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-2">
              <h3 className="font-medium text-lg">{section.title}</h3>
              <textarea
                className="w-full min-h-[120px] p-3 border rounded text-sm leading-relaxed resize-y"
                defaultValue={section.content}
                onChange={(e) => {
                  const updated = { ...report };
                  updated.sections[i].content = e.target.value;
                  setReport(updated);
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## Supabase RPC Functions

```sql
-- Get services grouped by type for a date range
CREATE OR REPLACE FUNCTION get_services_by_type(
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ
)
RETURNS TABLE(service_type TEXT, count BIGINT, total_hours NUMERIC) AS $$
  SELECT
    st.name AS service_type,
    COUNT(*) AS count,
    COALESCE(SUM(se.duration_minutes) / 60.0, 0) AS total_hours
  FROM service_entries se
  JOIN service_types st ON se.service_type_id = st.id
  WHERE se.service_date BETWEEN start_date AND end_date
  GROUP BY st.name
  ORDER BY count DESC;
$$ LANGUAGE sql SECURITY DEFINER;

-- Get demographics breakdown
CREATE OR REPLACE FUNCTION get_demographics_breakdown(
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ
)
RETURNS JSONB AS $$
  SELECT jsonb_build_object(
    'total_unique_clients', (
      SELECT COUNT(DISTINCT client_id)
      FROM service_entries
      WHERE service_date BETWEEN start_date AND end_date
    ),
    'new_clients', (
      SELECT COUNT(*) FROM clients
      WHERE created_at BETWEEN start_date AND end_date
    ),
    'gender_breakdown', (
      SELECT jsonb_object_agg(
        COALESCE(demographics->>'gender', 'Not specified'), cnt
      )
      FROM (
        SELECT demographics->>'gender' AS gender, COUNT(*) AS cnt
        FROM clients
        WHERE id IN (
          SELECT DISTINCT client_id FROM service_entries
          WHERE service_date BETWEEN start_date AND end_date
        )
        GROUP BY demographics->>'gender'
      ) sub
    )
  );
$$ LANGUAGE sql SECURITY DEFINER;
```

---

## Seed Data (supabase/seed.sql)

```sql
-- Service Types
INSERT INTO service_types (name, description) VALUES
  ('Individual Therapy', 'One-on-one therapeutic session'),
  ('Group Therapy', 'Group therapeutic session'),
  ('Crisis Intervention', 'Emergency crisis support'),
  ('Food Assistance', 'Food pantry or meal services'),
  ('Housing Referral', 'Housing assistance and referrals'),
  ('Case Management', 'Ongoing case management meeting'),
  ('Music Therapy', 'Music-based therapeutic session'),
  ('Job Training', 'Employment skills and training'),
  ('Legal Aid Referral', 'Legal assistance referral'),
  ('Youth Mentoring', 'Youth development and mentoring');

-- 12 Clients with diverse demographics
INSERT INTO clients (first_name, last_name, date_of_birth, phone, email, demographics) VALUES
  ('Maria', 'Garcia', '1985-03-15', '480-555-0101', 'maria.g@email.com',
   '{"gender": "Female", "language": "Spanish", "household_size": 4, "referral_source": "Walk-in"}'),
  ('James', 'Thompson', '1972-11-22', '480-555-0102', NULL,
   '{"gender": "Male", "language": "English", "household_size": 1, "referral_source": "211 Hotline"}'),
  ('Anh', 'Nguyen', '1990-07-08', '480-555-0103', 'anh.n@email.com',
   '{"gender": "Female", "language": "Vietnamese", "household_size": 3, "referral_source": "Partner Agency"}'),
  ('David', 'Williams', '1968-01-30', '480-555-0104', NULL,
   '{"gender": "Male", "language": "English", "household_size": 2, "referral_source": "Self"}'),
  ('Fatima', 'Hassan', '1995-09-12', '480-555-0105', 'fatima.h@email.com',
   '{"gender": "Female", "language": "Arabic", "household_size": 5, "referral_source": "Refugee Services"}'),
  ('Robert', 'Johnson', '1980-05-20', '480-555-0106', 'r.johnson@email.com',
   '{"gender": "Male", "language": "English", "household_size": 3, "referral_source": "Church"}'),
  ('Lisa', 'Chen', '1988-12-03', '480-555-0107', 'lisa.c@email.com',
   '{"gender": "Female", "language": "Mandarin", "household_size": 2, "referral_source": "Walk-in"}'),
  ('Marcus', 'Brown', '2005-04-17', '480-555-0108', NULL,
   '{"gender": "Male", "language": "English", "household_size": 4, "referral_source": "School Counselor"}'),
  ('Patricia', 'Rivera', '1975-08-25', '480-555-0109', 'p.rivera@email.com',
   '{"gender": "Female", "language": "Spanish", "household_size": 6, "referral_source": "Partner Agency"}'),
  ('Samuel', 'Okonkwo', '1992-02-14', '480-555-0110', 'sam.o@email.com',
   '{"gender": "Male", "language": "English", "household_size": 1, "referral_source": "Self"}'),
  ('Jennifer', 'Martinez', '1998-06-30', '480-555-0111', 'jen.m@email.com',
   '{"gender": "Female", "language": "Spanish", "household_size": 3, "referral_source": "Hospital Discharge"}'),
  ('Thomas', 'Anderson', '1960-10-05', '480-555-0112', NULL,
   '{"gender": "Male", "language": "English", "household_size": 1, "referral_source": "VA Referral"}');

-- 35+ Service Entries with realistic case notes
-- (Using a simplified approach — in practice, link to actual client/type UUIDs)
-- You'll run this after clients and service_types are inserted, referencing their UUIDs
```

---

## package.json Dependencies

```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@supabase/supabase-js": "^2.45.0",
    "@supabase/ssr": "^0.5.0",
    "openai": "^4.60.0",
    "lucide-react": "^0.383.0",
    "recharts": "^2.12.0",
    "papaparse": "^5.4.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.4.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "@types/node": "^22.0.0",
    "@types/react": "^18.3.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  }
}
```

Note: We use the `openai` SDK for Groq (OpenAI-compatible). No separate Groq SDK needed.

---

## Hour-by-Hour Execution Plan

### Phase 1: Foundation (Hours 0–3)

| Time | Task | Owner | Done When |
|---|---|---|---|
| 0:00–0:20 | Sign up for Groq + Google AI Studio + Supabase | Everyone | All API keys in hand |
| 0:00–0:30 | `npx create-next-app@latest` + Tailwind + TypeScript | Frontend | Repo created |
| 0:20–0:50 | Create Supabase project, run schema SQL, enable Auth | Backend | DB + Auth live |
| 0:30–1:00 | `npx shadcn-ui@latest init` + install: Button, Input, Card, Table, Textarea, Badge, Select, Tabs | Frontend | UI kit ready |
| 1:00–1:30 | Build login page + Supabase auth middleware + profile auto-creation | Full-Stack | Sign in works |
| 1:30–2:00 | Create `lib/ai/groq.ts` + `lib/ai/gemini.ts` + `lib/ai/llm.ts` | Backend | AI clients ready |
| 2:00–2:30 | Deploy to Vercel, add env vars, verify build passes | Full-Stack | Live URL exists |
| 2:30–3:00 | Run seed SQL, build root layout with sidebar nav | Both | Nav + data ready |

**Hour 3 Checkpoint:** App deploys. Auth works. DB has seed data. AI clients configured.

### Phase 2: Core CRUD — All P0 Features (Hours 3–8)

| Time | Task | Owner | Done When |
|---|---|---|---|
| 3:00–4:30 | Client list page: table + search by name | Frontend | Can browse clients |
| 3:00–4:00 | New client form: name, DOB, phone, email, demographics | Backend | Can create clients |
| 4:00–5:30 | Client profile page: demographics card + service history | Frontend | Can view a client |
| 4:30–5:30 | Service entry form: date, type dropdown, duration, notes textarea | Backend | Can log services |
| 5:30–6:30 | Wire service form into client profile ("Log Service" button) | Both | End-to-end flow |
| 6:30–7:30 | Role-based UI: admin sees edit/delete, staff sees view/create | Frontend | RBAC visible |
| 7:00–8:00 | Dashboard page: stats cards + service type chart (Recharts) | Both | Dashboard live |

**Hour 8 Checkpoint:** All P0 features work. Create clients, log services, view profiles, see dashboard.

### Phase 3: Voice-to-Notes with Groq (Hours 8–13)

| Time | Task | Owner | Done When |
|---|---|---|---|
| 8:00–9:00 | Build VoiceRecorder component (MediaRecorder, start/stop, blob) | Frontend | Can record audio |
| 8:00–9:00 | Build `/api/ai/transcribe` route (Groq Whisper) | Backend | Audio → text works |
| 9:00–10:00 | Build `/api/ai/structure-notes` route (Groq Llama 3.3) | Backend | Text → JSON works |
| 10:00–11:00 | Integrate VoiceRecorder into service form — auto-populate all fields | Frontend | Form fills from voice |
| 11:00–12:00 | Add source indicator, transcript display, consent toggle | Frontend | Production-quality UX |
| 12:00–13:00 | Test with 5+ recordings, tune system prompt, add error handling | Both | Reliable end-to-end |

**Hour 13 Checkpoint:** Record voice → Whisper transcribes → Llama structures → Form fills → Save to DB.

### Phase 4: Funder Reports with Groq (Hours 13–18)

| Time | Task | Owner | Done When |
|---|---|---|---|
| 13:00–14:00 | Create Supabase RPC functions for aggregation | Backend | SQL queries work |
| 13:00–14:00 | Build report generator UI: date pickers, generate button | Frontend | Report page exists |
| 14:00–15:30 | Build `/api/ai/generate-report` route (aggregate → Llama narrative) | Backend | Data → narrative works |
| 15:30–16:30 | Build report preview with editable sections | Frontend | Can view + edit report |
| 16:30–17:30 | Add "Copy to Clipboard" + raw data summary cards above sections | Both | Complete report UX |
| 17:30–18:00 | Test with different date ranges, verify data accuracy | Both | Reliable reports |

**Hour 18 Checkpoint:** Select dates → Generate report → Edit sections → Copy/export.

### Phase 5: Polish, Demo Prep, Ship (Hours 18–24)

| Time | Task | Owner | Done When |
|---|---|---|---|
| 18:00–19:00 | CSV import (upload CSV → create clients) + CSV export | Backend | Data portability |
| 19:00–20:00 | Mobile responsiveness pass on all pages | Frontend | Works on phone |
| 20:00–21:00 | Bug fixes, loading states, empty states, error messages | Both | No crashes |
| 21:00–22:00 | Seed rich demo data (12 clients, 35+ entries, varied notes) | Both | Compelling data |
| 22:00–23:00 | Write README + record demo video (3 min) | PM/All | README + video done |
| 23:00–24:00 | Final deploy, clean browser test, submit to DevPost | All | SHIPPED |

---

## Demo Script (3 Minutes)

### Act 1: The Problem (30 sec)
"92% of nonprofits run on budgets under $1M. They track clients on spreadsheets. Enterprise tools cost $50–150 per user per month. We built the alternative — for $0."

### Act 2: Core Product (60 sec)
- Show client list → search "Garcia" → open Maria's profile
- Scroll through service history with dates and types
- Create a new client in 20 seconds
- Log a manual service entry
- Show dashboard with live stats

### Act 3: Voice-to-Notes — The Wow Moment (45 sec)
- Open service entry form
- Tap microphone, speak for 15 seconds:
  > "Just finished a session with Maria. She's sleeping better since the new medication. She mentioned her landlord is raising rent — I want to connect her with housing services next week. Mood is good, much improved."
- Show Whisper transcription appear
- Show Llama 3.3 structuring in real-time
- Point out: auto-detected service type, extracted action items, follow-up date, mood assessment
- "20 minutes of typing → 15 seconds of speaking. Zero cost."

### Act 4: Funder Reports — The Closer (30 sec)
- Open Reports → select Q1 date range → click Generate
- Show the raw data cards at the top
- Show the AI-generated professional narrative below
- Edit a section inline to show human-in-the-loop
- "This saves 3–5 days per quarter per funder. Free to run."

### Act 5: The Ask (15 sec)
"Open source. $0 to deploy. $0 to run. Built for the 92% of nonprofits Salesforce forgot."

---

## Critical Rules

**Privacy:**
- Audio is NEVER stored — only transcript + structured output
- One client per LLM call — never batch client data together
- Every AI output is a DRAFT — human reviews before saving
- Consent toggle before recording

**Groq-specific:**
- Max audio file: 25MB (Groq limit) — fine for 2–3 min recordings
- If you get 429 errors: the fallback wrapper auto-switches to Gemini
- Llama 3.3 70B handles JSON output well with `response_format: { type: "json_object" }`
- Keep system prompts concise — Groq's free tier rate-limits on tokens/min too

**Demo:**
- Seed realistic data: diverse names, varied service types, dates spanning 90 days
- Have at least one client with 5+ entries to show rich history
- Pre-test the voice recording in Chrome (works best)
- Have Gemini key ready as backup — never demo without a fallback
