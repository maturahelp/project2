# CLAUDE.md — Майстор24

## Project
Майстор24 — a booking & client-management platform for tradespeople (майстори) in Bulgaria.
Studio24-style: майстори publish services + prices, clients book time slots online, майстори
manage their clients, bookings, reminders and reviews. NOT just a lead-gen board.

## Repository (LOCKED)
- GitHub repo name: **project2**, owned by the account **danko1212**.
- This is the ONLY correct repository for Майстор24. Never push to, pull from, or create any other repo for this project.

## Stack (LOCKED — do not change without asking)
- Next.js (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase: Postgres + Auth + Storage + Row Level Security (RLS)
- Hosting: Vercel · Package manager: pnpm

## Conventions
- All USER-FACING copy in Bulgarian. Code, comments, commit messages in English.
- Server Components by default; Client Components only when interactivity is required.
- All DB access through a typed Supabase client. NEVER expose the service-role key to the browser.
- Validate every input with zod. No silent failures — surface errors to the user.
- Mobile-first. Must look correct at 375px and 1440px.

## Standing rules (apply to EVERY task)
- Implement ONLY what the current task asks. Do NOT add extra files, abstractions, features, or refactors.
- READ the existing files in the relevant directory BEFORE editing them.
- Keep all changes inside the paths named in the task.
- After each meaningful action, print one line: ✅ [what was done].
- When done, print the acceptance checklist with PASS/FAIL per item, then STOP.

## STOP and ask before:
- Installing or upgrading ANY dependency
- Creating or altering ANY table, column, or RLS policy
- Deleting or renaming any existing file
- Editing a migration in /supabase/migrations that already shipped
- Changing auth, billing, or payment logic beyond what the task describes

## Secrets
- Read keys from env only: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY, plus per-step vars. Never hardcode. Never print secret values.

## Definition of done (every task)
- `pnpm typecheck` and lint pass · runs locally with no console errors · all acceptance criteria pass.