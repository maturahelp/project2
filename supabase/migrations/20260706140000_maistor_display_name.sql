-- Майстор24 — add a public display name for майстори.
--
-- profiles.full_name is RLS-private (owner-only), so the public directory and
-- profile pages have no name to show. Add a public display_name on
-- maistor_profiles, which is already publicly readable when verified = true.

alter table public.maistor_profiles
  add column if not exists display_name text;

-- Let owners write it too (Step 2 restricted writes to specific columns).
grant insert (display_name) on public.maistor_profiles to authenticated;
grant update (display_name) on public.maistor_profiles to authenticated;
