-- Майстор24 — review submission + rating aggregation (Step 8).
--
-- 1) Allow guest reviews: reviews.client_id may be NULL (guest bookings have no
--    user). Logged-in reviews still store the client's id.
-- 2) submit_review(): inserts one review for a COMPLETED booking and recomputes
--    the майстор's rating_avg / rating_count in the same transaction. Executable
--    only by service_role (the token-verified server action calls it). booking_id
--    is already UNIQUE, so a booking can be reviewed at most once.

alter table public.reviews alter column client_id drop not null;

create or replace function public.submit_review(
  p_booking_id uuid,
  p_rating int,
  p_comment text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_maistor_id uuid;
  v_client_id  uuid;
  v_status     text;
begin
  if p_rating < 1 or p_rating > 5 then
    raise exception 'invalid_rating';
  end if;

  select b.maistor_id, b.client_id, b.status
    into v_maistor_id, v_client_id, v_status
  from public.bookings b
  where b.id = p_booking_id;

  if v_maistor_id is null then
    raise exception 'booking_not_found';
  end if;
  if v_status <> 'completed' then
    raise exception 'not_completed';
  end if;
  if exists (select 1 from public.reviews r where r.booking_id = p_booking_id) then
    raise exception 'already_reviewed';
  end if;

  insert into public.reviews (booking_id, maistor_id, client_id, rating, comment)
  values (p_booking_id, v_maistor_id, v_client_id, p_rating, nullif(trim(p_comment), ''));

  update public.maistor_profiles m
  set rating_count = agg.cnt,
      rating_avg   = agg.avg,
      updated_at   = now()
  from (
    select count(*)::int as cnt,
           coalesce(round(avg(r.rating)::numeric, 2), 0) as avg
    from public.reviews r
    where r.maistor_id = v_maistor_id
  ) agg
  where m.user_id = v_maistor_id;
end;
$$;

revoke all on function public.submit_review(uuid, int, text) from public;
grant execute on function public.submit_review(uuid, int, text) to service_role;
