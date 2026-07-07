-- Майстор24 — booking RPCs (Step 6). No changes to the bookings table itself.
--
-- 1) maistor_busy_ranges: lets anonymous visitors see ONLY the busy time ranges
--    of a майстор (no PII) so the client can compute free slots. bookings RLS
--    otherwise hides all rows from non-participants.
-- 2) create_booking: SECURITY DEFINER so it can insert guest bookings
--    (client_id null) and enforce rules the RLS insert path can't. Atomic
--    double-booking prevention via a transaction advisory lock + overlap re-check.

create or replace function public.maistor_busy_ranges(
  p_maistor_id uuid,
  p_from timestamptz,
  p_to timestamptz
)
returns table (start_at timestamptz, end_at timestamptz)
language sql
security definer
set search_path = public
stable
as $$
  select b.start_at, b.end_at
  from public.bookings b
  where b.maistor_id = p_maistor_id
    and b.status in ('requested', 'confirmed')
    and b.start_at < p_to
    and b.end_at > p_from;
$$;

grant execute on function public.maistor_busy_ranges(uuid, timestamptz, timestamptz)
  to anon, authenticated;

create or replace function public.create_booking(
  p_service_id uuid,
  p_start_at timestamptz,
  p_address text,
  p_notes text,
  p_contact_phone text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_maistor_id uuid;
  v_duration   int;
  v_end        timestamptz;
  v_dow        int;
  v_local_start time;
  v_local_end   time;
  v_uid        uuid := auth.uid();
  v_booking_id uuid;
begin
  if coalesce(trim(p_contact_phone), '') = '' then
    raise exception 'phone_required';
  end if;

  select s.maistor_id, coalesce(s.duration_min, 60)
    into v_maistor_id, v_duration
  from public.services s
  where s.id = p_service_id;

  if v_maistor_id is null then
    raise exception 'service_not_found';
  end if;

  if not exists (
    select 1 from public.maistor_profiles m
    where m.user_id = v_maistor_id and m.verified
  ) then
    raise exception 'maistor_not_available';
  end if;

  v_end := p_start_at + make_interval(mins => v_duration);

  if p_start_at <= now() then
    raise exception 'in_the_past';
  end if;

  -- Working-hours check in Europe/Sofia wall-clock.
  v_dow := extract(dow from (p_start_at at time zone 'Europe/Sofia'))::int;
  v_local_start := (p_start_at at time zone 'Europe/Sofia')::time;
  v_local_end := (v_end at time zone 'Europe/Sofia')::time;

  if not exists (
    select 1 from public.working_hours wh
    where wh.maistor_id = v_maistor_id
      and wh.weekday = v_dow
      and wh.start_time <= v_local_start
      and wh.end_time >= v_local_end
  ) then
    raise exception 'outside_working_hours';
  end if;

  -- Serialize concurrent attempts for this майстор+slot, then re-check overlap.
  perform pg_advisory_xact_lock(
    hashtextextended(v_maistor_id::text || '|' || p_start_at::text, 0)
  );

  if exists (
    select 1 from public.bookings b
    where b.maistor_id = v_maistor_id
      and b.status in ('requested', 'confirmed')
      and b.start_at < v_end
      and b.end_at > p_start_at
  ) then
    raise exception 'slot_taken';
  end if;

  insert into public.bookings (
    maistor_id, client_id, service_id, status,
    start_at, end_at, address, notes, contact_phone
  )
  values (
    v_maistor_id, v_uid, p_service_id, 'requested',
    p_start_at, v_end,
    nullif(trim(p_address), ''), nullif(trim(p_notes), ''), trim(p_contact_phone)
  )
  returning id into v_booking_id;

  return v_booking_id;
end;
$$;

grant execute on function public.create_booking(uuid, timestamptz, text, text, text)
  to anon, authenticated;
