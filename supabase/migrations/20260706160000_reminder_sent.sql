-- Майстор24 — reminder idempotency (Step 7).
--
-- 1) reminder_sent flag on bookings so a 24h reminder is sent at most once.
-- 2) claim_due_reminders(): atomically marks + returns confirmed bookings whose
--    start is within the next N hours and not yet reminded. Uses FOR UPDATE SKIP
--    LOCKED so overlapping cron runs never claim the same row twice. Returns
--    contact details (reads auth.users as a SECURITY DEFINER owned by postgres).
--    Executable ONLY by service_role (the cron uses the service key server-side).

alter table public.bookings
  add column if not exists reminder_sent boolean not null default false;

create or replace function public.claim_due_reminders(p_within_hours int)
returns table (
  id            uuid,
  start_at      timestamptz,
  contact_phone text,
  service_title text,
  maistor_name  text,
  maistor_email text,
  maistor_phone text,
  client_email  text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update public.bookings b
  set reminder_sent = true, updated_at = now()
  where b.id in (
    select b2.id
    from public.bookings b2
    where b2.status = 'confirmed'
      and b2.reminder_sent = false
      and b2.start_at > now()
      and b2.start_at <= now() + make_interval(hours => p_within_hours)
    for update skip locked
  )
  returning
    b.id,
    b.start_at,
    b.contact_phone,
    (select s.title from public.services s where s.id = b.service_id),
    (select m.display_name from public.maistor_profiles m where m.user_id = b.maistor_id),
    (select u.email::text from auth.users u where u.id = b.maistor_id),
    (select p.phone from public.profiles p where p.id = b.maistor_id),
    (select u.email::text from auth.users u where u.id = b.client_id);
end;
$$;

revoke all on function public.claim_due_reminders(int) from public;
grant execute on function public.claim_due_reminders(int) to service_role;
