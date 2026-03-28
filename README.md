# 2026_spring_wics_asu Hackathon Project

## Quick Links

- [Hackathon Details](https://www.ohack.dev/hack/2026_spring_wics_asu)
- [DevPost Submission](https://wics-ohack-sp26-hackathon.devpost.com/)
- [Team Slack Channel](https://opportunity-hack.slack.com/app_redirect?channel=team-02-victory)

## Team "Victory"

- Tanmai Potla
- Suma Mallu
- Mrudula Eluri
- Sanjana Soma

## Project Overview

**Victory** is a client case management web app for nonprofits: client profiles, searchable directory, voice-assisted visit notes (Groq Whisper + Llama), and funder-style report generation. Built for the hackathon stack (Next.js, Supabase, Groq, Vercel).

## Tech Stack

- **Frontend:** Next.js (App Router), React, Tailwind CSS, shadcn/ui, Recharts
- **Backend:** Next.js Route Handlers (`/api/ai/*`, `/api/export/csv`)
- **Database / Auth:** Supabase (PostgreSQL + Auth + RLS) — wire via env vars
- **AI:** Groq (Whisper STT + Llama 3.3 70B); optional Google Gemini fallback per architecture

## Live demo

_Add your Vercel (or other) deployment URL here once deployed._

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

Open [http://localhost:3000](http://localhost:3000). Without API keys, the app uses demo data and mock AI responses.

```bash
npm run build   # production build
npm start       # run production server locally
```

## Environment variables

Copy `.env.local.example` to `.env.local` and fill in:

- `GROQ_API_KEY` — Whisper + Llama (optional for demo mode)
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase client
- `SUPABASE_SERVICE_ROLE_KEY` — server-only if needed
- `NEXT_PUBLIC_APP_URL` — e.g. `http://localhost:3000` or your deploy URL

## Checklist for the final submission

### 0/Judging Criteria

- [ ] Review the [judging criteria](https://www.ohack.dev/about/judges#judging-criteria) to understand how your project will be evaluated

### 1/DevPost

- [ ] Submit a [DevPost project to this DevPost page for our hackathon](https://wics-ohack-sp26-hackathon.devpost.com/) - see our [YouTube Walkthrough](https://youtu.be/rsAAd7LXMDE) or a more general one from DevPost [here](https://www.youtube.com/watch?v=vCa7QFFthfU)
- [ ] Your DevPost final submission demo video should be 4 minutes or less
- [ ] Link your team to your DevPost project on ohack.dev in [your team dashboard](https://www.ohack.dev/hack/2026_spring_wics_asu/manageteam)
- [ ] Link your GitHub repo to your DevPost project on the DevPost submission form under "Try it out" links

### 2/GitHub

- [ ] Add everyone on your team to your GitHub repo [YouTube Walkthrough](https://youtu.be/kHs0jOewVKI)
- [ ] Make sure your repo is public
- [ ] Make sure your repo has a MIT License
- [ ] Make sure your repo has a detailed README.md (see below for details)

## What should your final README look like?

Your readme should be a one-stop-shop for the judges to understand your project. It should include:

- Team name
- Team members
- Slack channel
- Problem statement
- Tech stack
- Link to your working project on the web so judges can try it out
- Link to your DevPost project
- Link to your final demo video
- Instructions on how to run your project
- Any other relevant links (e.g. Figma, GitHub repos for any open source libraries you used, etc.)

You'll use this repo as your resume in the future, so make it shine.

## Examples

Examples of stellar readmes:

- [2019 Team 3](https://github.com/2019-Arizona-Opportunity-Hack/Team-3)
- [2019 Team 6](https://github.com/2019-Arizona-Opportunity-Hack/Team-6)
- [2020 Team 2](https://github.com/2020-opportunity-hack/Team-02)
- [2020 Team 4](https://github.com/2020-opportunity-hack/Team-04)
- [2020 Team 8](https://github.com/2020-opportunity-hack/Team-08)
- [2020 Team 12](https://github.com/2020-opportunity-hack/Team-12)

Examples of winning DevPost submissions:

- [1st place 2024](https://devpost.com/software/nature-s-edge-wildlife-and-reptile-rescue)
- [2nd place 2024](https://devpost.com/software/team13-kidcoda-steam)
- [1st place 2023](https://devpost.com/software/preservation-partners-search-engine)
- [1st place 2019](https://devpost.com/software/zuri-s-dashboard)
- [1st place 2018](https://devpost.com/software/matthews-crossing-data-manager-oj4ica)
