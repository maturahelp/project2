-- Майстор24 — initial schema + RLS
-- Booking & client-management platform for tradespeople (майстори).
--
-- Conventions:
--   * Every table has RLS ENABLED. With RLS on and no permissive policy, access is
--     denied by default — so no table is left "public-write".
--   * A майстор's identity == their auth user id. maistor_profiles.user_id == auth.uid().
--   * The service_role key BYPASSES RLS; server-side/admin flows (e.g. guest bookings)
--     are expected to run there.
--
-- Safe to run on a fresh database. This migration creates only new objects.

-- Needed for gen_random_uuid() (present by default on Supabase, guarded for portability).
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- profiles — one row per authenticated user
-- ---------------------------------------------------------------------------
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  role       text not null check (role in ('maistor', 'client')),
  full_name  text,
  phone      text,
  city       text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Base profile per auth user. Private: readable only by its owner.';

-- ---------------------------------------------------------------------------
-- maistor_profiles — extended, public-facing profile for a майстор
-- ---------------------------------------------------------------------------
create table public.maistor_profiles (
  user_id      uuid primary key references public.profiles (id) on delete cascade,
  slug         text not null unique,
  bio          text,
  categories   text[] not null default '{}',
  base_city    text,
  verified     boolean not null default false,
  rating_avg   numeric(3, 2) not null default 0 check (rating_avg >= 0 and rating_avg <= 5),
  rating_count integer not null default 0 check (rating_count >= 0),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.maistor_profiles is 'Public майстор profile. Publicly readable only when verified = true.';
comment on column public.maistor_profiles.verified is 'Set by admins/server only (not user-writable via column grants).';

create index maistor_profiles_verified_idx on public.maistor_profiles (verified) where verified;

-- ---------------------------------------------------------------------------
-- services — offerings published by a майстор
-- ---------------------------------------------------------------------------
create table public.services (
  id           uuid primary key default gen_random_uuid(),
  maistor_id   uuid not null references public.maistor_profiles (user_id) on delete cascade,
  title        text not null,
  description  text,
  price_from   numeric(10, 2) check (price_from >= 0),
  price_unit   text,
  duration_min integer check (duration_min > 0),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index services_maistor_id_idx on public.services (maistor_id);

-- ---------------------------------------------------------------------------
-- working_hours — weekly availability windows per майстор
-- (surrogate id added for row-level addressing; named columns kept as specified)
-- ---------------------------------------------------------------------------
create table public.working_hours (
  id         uuid primary key default gen_random_uuid(),
  maistor_id uuid not null references public.maistor_profiles (user_id) on delete cascade,
  weekday    smallint not null check (weekday between 0 and 6), -- 0 = Sunday .. 6 = Saturday (Postgres dow)
  start_time time not null,
  end_time   time not null,
  check (end_time > start_time)
);

create index working_hours_maistor_id_idx on public.working_hours (maistor_id);

-- ---------------------------------------------------------------------------
-- bookings — a requested/scheduled job between a client and a майстор
-- client_id is nullable to allow guest bookings (created server-side via service_role).
-- ---------------------------------------------------------------------------
create table public.bookings (
  id            uuid primary key default gen_random_uuid(),
  maistor_id    uuid not null references public.maistor_profiles (user_id) on delete cascade,
  client_id     uuid references public.profiles (id) on delete set null,
  service_id    uuid not null references public.services (id) on delete restrict,
  status        text not null default 'requested'
                  check (status in ('requested', 'confirmed', 'declined', 'completed', 'cancelled')),
  start_at      timestamptz not null,
  end_at        timestamptz not null,
  address       text,
  notes         text,
  contact_phone text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check (end_at > start_at)
);

create index bookings_maistor_id_idx on public.bookings (maistor_id);
create index bookings_client_id_idx on public.bookings (client_id);
create index bookings_service_id_idx on public.bookings (service_id);

-- ---------------------------------------------------------------------------
-- reviews — one review per booking, written by the booking's client
-- ---------------------------------------------------------------------------
create table public.reviews (
  id         uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings (id) on delete cascade,
  maistor_id uuid not null references public.maistor_profiles (user_id) on delete cascade,
  client_id  uuid not null references public.profiles (id) on delete cascade,
  rating     smallint not null check (rating between 1 and 5),
  comment    text,
  created_at timestamptz not null default now()
);

create index reviews_maistor_id_idx on public.reviews (maistor_id);
create index reviews_client_id_idx on public.reviews (client_id);

-- ===========================================================================
-- Row Level Security
-- ===========================================================================
alter table public.profiles         enable row level security;
alter table public.maistor_profiles enable row level security;
alter table public.services         enable row level security;
alter table public.working_hours    enable row level security;
alter table public.bookings         enable row level security;
alter table public.reviews          enable row level security;

-- --- profiles: private to the owner ----------------------------------------
create policy "profiles: owner can read own"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

create policy "profiles: owner can insert own"
  on public.profiles for insert to authenticated
  with check (id = (select auth.uid()));

create policy "profiles: owner can update own"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
-- No DELETE policy: profile rows are removed via auth.users cascade only.

-- --- maistor_profiles ------------------------------------------------------
-- verified, rating_avg and rating_count are system-managed. Restrict which
-- columns clients may write so users cannot self-verify or fake ratings.
revoke insert, update on public.maistor_profiles from anon, authenticated;
grant insert (user_id, slug, bio, categories, base_city) on public.maistor_profiles to authenticated;
grant update (slug, bio, categories, base_city)          on public.maistor_profiles to authenticated;

create policy "maistor_profiles: public can read verified"
  on public.maistor_profiles for select to anon, authenticated
  using (verified);

create policy "maistor_profiles: owner can read own"
  on public.maistor_profiles for select to authenticated
  using (user_id = (select auth.uid()));

create policy "maistor_profiles: owner can insert own"
  on public.maistor_profiles for insert to authenticated
  with check (user_id = (select auth.uid()) and verified = false);

create policy "maistor_profiles: owner can update own"
  on public.maistor_profiles for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "maistor_profiles: owner can delete own"
  on public.maistor_profiles for delete to authenticated
  using (user_id = (select auth.uid()));

-- --- services --------------------------------------------------------------
create policy "services: public can read (verified майстори)"
  on public.services for select to anon, authenticated
  using (
    exists (
      select 1 from public.maistor_profiles m
      where m.user_id = services.maistor_id and m.verified
    )
  );

create policy "services: owner can read own"
  on public.services for select to authenticated
  using (maistor_id = (select auth.uid()));

create policy "services: owner can insert own"
  on public.services for insert to authenticated
  with check (maistor_id = (select auth.uid()));

create policy "services: owner can update own"
  on public.services for update to authenticated
  using (maistor_id = (select auth.uid()))
  with check (maistor_id = (select auth.uid()));

create policy "services: owner can delete own"
  on public.services for delete to authenticated
  using (maistor_id = (select auth.uid()));

-- --- working_hours ---------------------------------------------------------
create policy "working_hours: public can read (verified майстори)"
  on public.working_hours for select to anon, authenticated
  using (
    exists (
      select 1 from public.maistor_profiles m
      where m.user_id = working_hours.maistor_id and m.verified
    )
  );

create policy "working_hours: owner can read own"
  on public.working_hours for select to authenticated
  using (maistor_id = (select auth.uid()));

create policy "working_hours: owner can insert own"
  on public.working_hours for insert to authenticated
  with check (maistor_id = (select auth.uid()));

create policy "working_hours: owner can update own"
  on public.working_hours for update to authenticated
  using (maistor_id = (select auth.uid()))
  with check (maistor_id = (select auth.uid()));

create policy "working_hours: owner can delete own"
  on public.working_hours for delete to authenticated
  using (maistor_id = (select auth.uid()));

-- --- bookings --------------------------------------------------------------
-- Both parties can read their bookings. Registered clients create their own
-- (always as 'requested'). Guest bookings (client_id null) are created
-- server-side via the service_role key, which bypasses RLS.
create policy "bookings: maistor can read own"
  on public.bookings for select to authenticated
  using (maistor_id = (select auth.uid()));

create policy "bookings: client can read own"
  on public.bookings for select to authenticated
  using (client_id = (select auth.uid()));

create policy "bookings: client can create own request"
  on public.bookings for insert to authenticated
  with check (client_id = (select auth.uid()) and status = 'requested');

create policy "bookings: maistor can update own"
  on public.bookings for update to authenticated
  using (maistor_id = (select auth.uid()))
  with check (maistor_id = (select auth.uid()));

-- Clients may only cancel (or leave as requested) — never self-confirm/complete,
-- which would otherwise let them unlock the review-insert check below.
create policy "bookings: client can update own"
  on public.bookings for update to authenticated
  using (client_id = (select auth.uid()))
  with check (client_id = (select auth.uid()) and status in ('requested', 'cancelled'));
-- No DELETE policy: bookings are cancelled via status, never hard-deleted by users.

-- --- reviews ---------------------------------------------------------------
-- Publicly readable. A client may write exactly one review for their own
-- COMPLETED booking; maistor_id must match that booking.
create policy "reviews: public can read"
  on public.reviews for select to anon, authenticated
  using (true);

create policy "reviews: client can create for own completed booking"
  on public.reviews for insert to authenticated
  with check (
    client_id = (select auth.uid())
    and exists (
      select 1 from public.bookings b
      where b.id = reviews.booking_id
        and b.client_id = (select auth.uid())
        and b.maistor_id = reviews.maistor_id
        and b.status = 'completed'
    )
  );

create policy "reviews: author can update own"
  on public.reviews for update to authenticated
  using (client_id = (select auth.uid()))
  with check (client_id = (select auth.uid()));

create policy "reviews: author can delete own"
  on public.reviews for delete to authenticated
  using (client_id = (select auth.uid()));
