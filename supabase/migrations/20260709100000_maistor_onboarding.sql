-- Майстор24 — maistor onboarding: optional БУЛСТАТ + atomic onboarding RPC.
--
-- bulstat: optional, self-reported, speeds up manual verification. No RLS
-- change needed — existing insert/update policies already scope by
-- user_id/verified; this just extends the column-level grant, same pattern
-- as 20260706140000_maistor_display_name.sql.
alter table public.maistor_profiles add column if not exists bulstat text;

comment on column public.maistor_profiles.bulstat is
  'Optional Bulgarian company registration ID (БУЛСТАТ), self-reported by the майстор to speed up manual verification. Not validated by the system.';

grant insert (bulstat) on public.maistor_profiles to authenticated;
grant update (bulstat) on public.maistor_profiles to authenticated;

-- complete_maistor_onboarding: creates maistor_profiles + services +
-- working_hours in one transaction, so a mid-flow failure can never leave a
-- half-built profile. security invoker (NOT definer) — all three inserts are
-- already owner-scoped by existing RLS policies, so this only needs
-- transactional atomicity, not an RLS bypass. New profiles are always
-- verified = false (system default); only a service-role/admin update can
-- flip that column, per the Step 2 RLS design.
create or replace function public.complete_maistor_onboarding(
  p_slug_base text,
  p_display_name text,
  p_bio text,
  p_base_city text,
  p_categories text[],
  p_bulstat text,
  p_services jsonb,       -- [{title, description, price_from, price_unit, duration_min}, ...]
  p_working_hours jsonb   -- [{weekday, start_time, end_time}, ...]
)
returns table (slug text)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_slug text;
  v_suffix int := 0;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  if exists (select 1 from public.maistor_profiles where user_id = v_uid) then
    raise exception 'already_onboarded';
  end if;

  v_slug := p_slug_base;
  loop
    begin
      insert into public.maistor_profiles
        (user_id, slug, display_name, bio, categories, base_city, bulstat)
      values
        (v_uid, v_slug, p_display_name, p_bio, p_categories, p_base_city, p_bulstat);
      exit;
    exception when unique_violation then
      v_suffix := v_suffix + 1;
      v_slug := p_slug_base || '-' || v_suffix;
      if v_suffix > 50 then
        raise exception 'slug_exhausted';
      end if;
    end;
  end loop;

  insert into public.services (maistor_id, title, description, price_from, price_unit, duration_min)
  select v_uid, x.title, x.description, x.price_from, x.price_unit, x.duration_min
  from jsonb_to_recordset(p_services)
    as x(title text, description text, price_from numeric, price_unit text, duration_min int);

  insert into public.working_hours (maistor_id, weekday, start_time, end_time)
  select v_uid, x.weekday, x.start_time, x.end_time
  from jsonb_to_recordset(p_working_hours)
    as x(weekday int, start_time time, end_time time);

  return query select v_slug;
end;
$$;

grant execute on function public.complete_maistor_onboarding(text, text, text, text, text[], text, jsonb, jsonb)
  to authenticated;
