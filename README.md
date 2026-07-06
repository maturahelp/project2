# Майстор24

Booking & client-management platform for tradespeople (майстори) in Bulgaria.
Майстори publish services + prices; clients book time slots online; майстори manage
their clients, bookings, reminders and reviews.

## Stack

- **Next.js** (App Router) + **TypeScript**
- **Tailwind CSS** + **shadcn/ui**
- **Supabase** (Postgres + Auth + Storage + RLS) — _wired up later_
- **Vercel** hosting · **pnpm** package manager

## Project structure

```
app/                Next.js App Router routes (landing "/" + layout shell)
components/         Shared UI (site-header, site-footer); shadcn/ui → components/ui
lib/                Utilities; lib/supabase/ holds stubbed client + server helpers
supabase/           Reserved for Supabase config & migrations
styles/             Global Tailwind stylesheet
```

## Prerequisites

- **Node.js** ≥ 20 (repo developed on Node 24)
- **pnpm** — enable via Corepack: `corepack enable && corepack prepare pnpm@latest --activate`

## Run locally

```bash
# 1. Install dependencies
pnpm install

# 2. (optional for now) create your env file — Supabase isn't wired up yet
cp .env.example .env.local   # then fill in values when auth/DB work begins

# 3. Start the dev server
pnpm dev
```

Open <http://localhost:3000> — you should see the hero **„Запази час при проверен майстор“**.

## Scripts

| Command          | What it does                          |
| ---------------- | ------------------------------------- |
| `pnpm dev`       | Start the dev server (localhost:3000) |
| `pnpm build`     | Production build                      |
| `pnpm start`     | Serve the production build            |
| `pnpm typecheck` | Type-check with `tsc --noEmit`        |
| `pnpm lint`      | Lint with ESLint (`next lint`)        |

## Environment variables

See [`.env.example`](./.env.example). `SUPABASE_SERVICE_ROLE_KEY` is server-only and must
never be exposed to the browser.

## Deployment

Hosted on **Vercel**. Pushes to the connected repo build and deploy automatically.
