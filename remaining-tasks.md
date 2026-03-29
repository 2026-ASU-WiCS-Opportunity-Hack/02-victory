# Victory — Remaining Tasks

---

## 1. Hardcoded Values to Fix

### 1.1 Invalid demo report ID
**File:** `src/lib/data/demo.ts`
**Issue:** `demoReportId` is set to `r0000000-0000-4000-8000-000000000001`. The prefix `r` is not valid hexadecimal, which means this UUID will fail any strict UUID validation. Change the prefix to a valid hex character like `b1`.

### 1.2 Service form card description
**File:** `src/components/services/service-form.tsx`
**Issue:** The CardDescription still reads "Manual fields merge with drafted output from voice capture when you use it." This exposes internal implementation language to users. Replace with something user-facing like "Fill in details below. Voice capture auto-fills summary and action items."

### 1.3 Report generator description
**File:** `src/components/reports/report-generator.tsx`
**Issue:** The CardDescription says "Aggregates service data for the period, then drafts narrative sections you can edit before export or filing." This is fine but could be simplified to "Select a date range to generate a funder-ready narrative from your service data."

### 1.4 Future-proof seed data dates
**File:** `src/lib/data/demo.ts`
**Issue:** All demo service entry dates are computed relative to `Date.now()` using subtraction (e.g., `Date.now() - 86400000 * 2`). This means all demo entries are in the past. There are zero future-dated entries, which means the dashboard charts only show historical data and the calendar has no upcoming demo appointments beyond a few hours out. Add demo entries with future dates spanning the next 30–60 days so charts and calendar look populated for judges.

### 1.5 Demo appointment dates
**File:** `src/lib/data/demo.ts`
**Issue:** The three demo appointments use offsets of 2, 26, and 50 hours from now. If the app is demoed at a certain time, some of these may have already passed. Consider using larger future offsets (1–5 days out) to ensure they always appear as upcoming.

---

## 2. Dashboard Date Selection for Charts

### 2.1 Add date range picker to dashboard
**File:** `src/app/(app)/dashboard/page.tsx`
**What to do:** The dashboard currently computes all stats server-side with no user-selectable date range. Add a client-side date range control (start date, end date, plus preset buttons like 7d / 30d / 90d / 1 year / all time) that lets users filter the weekly trend chart and service-type bar chart by a custom window.

### 2.2 Create a dashboard stats API route
**File:** `src/app/api/dashboard/stats/route.ts` (new file)
**What to do:** Create an API route that accepts `start` and `end` query parameters and returns the same stats shape that `getDashboardStats()` currently returns, but filtered to the given date range. The dashboard shell will call this endpoint when the user changes the date picker.

### 2.3 Create a client-side dashboard shell component
**File:** `src/components/dashboard/dashboard-shell.tsx` (new file)
**What to do:** Extract the dashboard rendering into a client component that owns the date range state. On mount it loads default stats (last 90 days). When the user picks a new range, it fetches from the new API route and re-renders the charts. The page.tsx becomes a thin server component that renders DashboardShell.

### 2.4 Update queries.ts to support date-filtered stats
**File:** `src/lib/data/queries.ts`
**What to do:** Add an optional date range parameter to the dashboard stats computation logic so the API route can pass `start` and `end` dates and get filtered results for active clients, weekly trend, and service-type breakdown.

---

## 3. SQL Seed Data for Future Services

### 3.1 Generate seed SQL with future-dated service entries
**What to do:** Create a new SQL seed file (or extend the existing seed) that inserts 10–15 service entries with dates spanning the next 30–60 days. These should be spread across multiple clients and service types so the dashboard charts, calendar, and upcoming reminders all show meaningful future data when judges view the app.

### 3.2 Generate seed SQL with future appointments
**What to do:** Insert 5–8 appointments into the `appointments` table with `starts_at` dates spread over the next 1–2 weeks. Assign them to different clients. This ensures the calendar page and dashboard reminders section are populated.

---

## 4. SRD Requirements — What's Left

### P0 (All Done)
All five P0 requirements are complete: Auth + role-based access, client registration, service/visit logging, client profile view, deploy + seed data.

### P1 — Done
- **CSV Import/Export** — Both export routes work (clients CSV, service logs CSV). Import route accepts file upload and creates clients.
- **Basic Reporting Dashboard** — Stats cards, weekly trend area chart, service-type bar chart, print-friendly layout.
- **Scheduling / Calendar** — Appointment form, agenda view, upcoming reminders on dashboard.
- **Configurable Fields** — Admin UI to define custom fields, fields render on client form and service form, stored as JSONB.
- **Audit Log** — Audit table exists, client and service creation write redacted entries, admin page displays log.

### P1 — Gaps / Polish Needed
- **Dashboard date filtering** — SRD says "services delivered this week/month/quarter" with breakdown. The stats cards show these, but the charts have no user-selectable date range (see Section 2 above).
- **Dashboard export to PDF** — SRD mentions "exportable to PDF or printable." Print toolbar exists but there is no direct PDF download button. The current "Print / Save as PDF" button relies on the browser print dialog.
- **Email reminders for appointments** — SRD says "Email or in-app reminder for upcoming appointments." In-app reminders are on the dashboard. Email reminders are not implemented (noted in the UI as "can be enabled when mail is configured").

### P2 — Done (AI Features)
- **Voice-to-Structured Case Notes (P2-AI-1)** — Fully built with Groq Whisper + Llama 3.3 70B.
- **Funder Report Templates (P2)** — Report generator aggregates data, calls LLM, returns editable sections, copy to clipboard.
- **Client Summary / Handoff Brief (P2-AI-4)** — One-click summary generation from client demographics and visit history.
- **Mobile-Responsive / PWA (P2)** — Mobile nav, responsive layout, PWA manifest.

### P2 — Not Built (judges do not expect these)
- Multi-tenant support
- Document uploads (file attachments to client profiles)
- Photo-to-intake (AI form digitization)
- Semantic search across case notes
- Smart nudges / AI follow-up detection
- Real-time multilingual intake
- DonorPerfect / Salesforce / Zapier integration

---

## 5. Client List Page — Remove Client ID Column

### 5.1 Hide client ID from the table
**File:** `src/components/clients/client-list.tsx`
**What to do:** The client list table currently shows a "Client ID" column (the raw UUID). This is not useful for nonprofit staff and clutters the table. Remove the Client ID `TableHead` and the corresponding `TableCell` from the table. The client ID is still visible on the individual client profile page where it's useful for support and debugging.

---

## 6. Client List Page — Pagination

### 6.1 Add pagination to client list
**File:** `src/components/clients/client-list.tsx`
**What to do:** The client list currently renders all clients at once. With 12 seed clients this is fine, but in production a nonprofit could have hundreds or thousands. Add client-side pagination showing 10 clients per page with Previous / Next buttons and a page indicator (e.g., "Page 1 of 3"). The search filter should still work across all clients, and the pagination should reset to page 1 when the search query changes.

### 6.2 (Optional) Server-side pagination
**File:** `src/lib/data/queries.ts` and `src/app/(app)/clients/page.tsx`
**What to do:** For large datasets, client-side pagination is not efficient because all rows are still fetched. If time allows, add `page` and `pageSize` parameters to `getAllClients()` and use Supabase `.range()` to fetch only one page of results at a time. Pass the page number as a URL search param so the page is bookmarkable.

---

## 7. Submission Checklist

### 7.1 Record demo video
**What to do:** DevPost requires a video under 4 minutes. Script: landing page → login → dashboard (show date filter, real stats) → clients (show search, pagination) → open a client profile → log a new voice note → watch AI fill fields → save → Reports → generate for Q1 → edit a section → copy → close with "$0 to deploy, $0 to run."

### 7.2 Submit to DevPost
**What to do:** Link the GitHub repo, paste the Vercel URL (https://02-victory.vercel.app), upload the demo video, register the team on ohack.dev.

---

## Summary — Priority Order

| # | Task | Effort | Impact |
|---|------|--------|--------|
| 1 | Fix invalid demoReportId UUID | 1 min | Prevents potential crash |
| 2 | Remove Client ID column from list | 2 min | Cleaner UX for judges |
| 3 | Fix service form / report generator description strings | 2 min | No dev jargon in UI |
| 4 | Add pagination to client list | 15 min | Professional feel |
| 5 | Add date range picker to dashboard charts | 30 min | SRD P1 requirement |
| 6 | Generate future-dated seed SQL | 15 min | Charts + calendar look alive |
| 7 | Add future demo entries to demo.ts | 10 min | Demo mode also looks alive |
| 8 | Record demo video | 30 min | Required for submission |
| 9 | Submit to DevPost | 10 min | Required for submission |
