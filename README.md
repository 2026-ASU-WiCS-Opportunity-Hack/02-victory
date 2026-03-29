# Victory — Nonprofit client case management

## Quick links

- [Source repository](https://github.com/2026-ASU-WiCS-Opportunity-Hack/02-victory)
- [Live app](https://02-victory.vercel.app)
- [Team Slack](https://opportunity-hack.slack.com/app_redirect?channel=team-02-victory)

## Team

- Tanmai Potla
- Suma Mallu
- Mrudula Eluri
- Sanjana Soma

## Overview

**Victory** is a web app for nonprofits: client profiles, searchable directory, voice capture with structured visit notes, funder-style reports, dashboards, calendar, CSV import/export, configurable fields, and an admin audit trail. Stack: Next.js, Supabase, Groq (optional for live transcription and drafting), Vercel.

## Problem

Teams delivering human services need to **register clients**, **log visits**, **schedule follow-ups**, and **report outcomes** to funders—without enterprise pricing. Victory keeps structured data, role-based access, migration paths, and reporting in one place.

## What you can try

| Area | In this repo |
|------|----------------|
| Auth & roles | Email signup, Google OAuth, middleware-protected routes; `profiles.role` (staff / admin) |
| Clients | Intake with demographics and custom fields; search by name, phone, email, ID |
| Services | Manual entry with **staff member** selector, voice capture → structured summary; visit history shows staff name |
| Operations | Dashboard KPIs (print-friendly), appointments calendar, in-app reminders; **optional email** reminders via Resend + Vercel Cron |
| Data | CSV import/export (admin); **local** seed (`POST /api/dev/seed` in development); **production** seed (`POST /api/admin/seed` with `SEED_SECRET`) |
| Governance | Custom field definitions, audit log; apply SQL migrations in Supabase (including RLS in `supabase/migrations/`) |

Routes under `/api/ai/` handle transcription, note structuring, funder narratives, and client handoff summaries when `GROQ_API_KEY` is set; otherwise the app uses demo data and mock responses.

## Local demo seed

With `.env.local` configured and migrations applied:

```bash
curl -X POST http://localhost:3000/api/dev/seed
```

Returns counts and test credentials for **staff** (`test@victory.app` / `Test1234!`), **admin** (`admin@casemanager.com` / `Admin123!`), and **portal client** (`maria.santos@email.example` / `Client123!`). Disabled outside `NODE_ENV=development`.

### Production / judge demo seed (Vercel or any host)

Set `SEED_SECRET` and `SUPABASE_SERVICE_ROLE_KEY` in the deployment environment, then run **once**:

```bash
curl -X POST "https://YOUR_DEPLOY_URL/api/admin/seed" \
  -H "Authorization: Bearer YOUR_SEED_SECRET"
```

This loads the same **10 clients**, **33+ service entries**, and the same **three test accounts** (staff / admin / client) as local seed so the public URL is reviewable without an empty database.

**Google sign-in:** In Supabase → Authentication → Providers → Google, enable and add OAuth client ID/secret; redirect URLs: `https://<your-domain>/auth/callback` and `http://localhost:3000/auth/callback`.

### Auth troubleshooting

| Symptom | What to do |
|--------|----------------|
| **Invalid login credentials** for seeded emails | Run the seed again so users exist and passwords reset: `POST /api/dev/seed` (development) or `POST /api/admin/seed` with `SEED_SECRET`. Needs `SUPABASE_SERVICE_ROLE_KEY` in env. |
| **Database error querying schema** on sign-in | Often `auth.users` rows with NULL token columns. Try `supabase/scripts/fix_auth_null_tokens.sql` in the SQL Editor (see script header). Check **Logs → Auth** in Supabase. |
| **SQL-only test users** (no API seed) | Run `supabase/scripts/seed_test_accounts.sql` in the SQL Editor: creates admin, staff, and Maria portal logins plus Maria’s `clients` row. Does not load the full demo service history. |
| Client portal shows “not linked” | In `profiles`, set `role = 'client'` and `client_id` to the correct `clients.id` (the seed sets Maria’s portal user automatically). |

### Email reminders (optional)

Set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` (verify your domain in Resend). Deploy with `vercel.json` cron: daily call to `/api/cron/appointment-reminders` (uses `x-vercel-cron` on Vercel, or `Authorization: Bearer CRON_SECRET` for manual runs). Sends reminders for appointments in the next 48 hours when the client has an email on file.

## Tech stack

- **Frontend:** Next.js (App Router), React, Tailwind CSS, shadcn/ui, Recharts
- **Backend:** Next.js Route Handlers (`/api/*` including transcription, reports, export)
- **Database / auth:** Supabase (PostgreSQL + Auth + RLS)
- **Transcription & drafting:** Groq (Whisper-class STT + Llama 3.3); optional Gemini fallback (see planning notes in repo)

## Run locally

Prerequisites: [Node.js](https://nodejs.org/) 20+

```bash
git clone https://github.com/2026-ASU-WiCS-Opportunity-Hack/02-victory.git
cd 02-victory
npm install
cp .env.local.example .env.local
# Add GROQ_API_KEY and Supabase keys as needed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Without API keys, the app uses demo data and mock responses.

```bash
npm run build
npm start
```

## Environment variables

Copy `.env.local.example` to `.env.local` and set:

- `GROQ_API_KEY` — optional; enables live transcription and drafting
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase client
- `SUPABASE_SERVICE_ROLE_KEY` — server-only (seed, admin operations)
- `NEXT_PUBLIC_APP_URL` — e.g. `http://localhost:3000` or your deploy URL
- `SEED_SECRET` — protects `POST /api/admin/seed` (production demo data)
- `CRON_SECRET` — optional; authorizes manual/cron reminder requests if not using Vercel’s `x-vercel-cron` header
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL` — optional; enables appointment reminder emails

## License

MIT — see [LICENSE](./LICENSE).
