-- Майстор24 — profile editing: portfolio storage bucket/RLS + atomic edit RPC.
--
-- Portfolio storage: bucket + owner-scoped RLS. Public bucket (getPublicUrl already
-- assumed by app/maistor/[slug]/page.tsx), writes restricted to the caller's own folder
-- (path convention: `${auth.uid()}/<filename>`).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('portfolio', 'portfolio', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "portfolio: owner can upload to own folder"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'portfolio' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "portfolio: owner can delete own files"
  on storage.objects for delete to authenticated
  using (bucket_id = 'portfolio' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "portfolio: public can read"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'portfolio');

-- update_maistor_profile: atomic edit of profile + full replace of services/working_hours.
-- security invoker — owner-scoped RLS already covers each table; this just adds
-- transactional atomicity across the three updates, same reasoning as
-- complete_maistor_onboarding. Slug is intentionally NOT editable here (keeps the
-- maistor's public link stable).
create or replace function public.update_maistor_profile(
  p_display_name text,
  p_bio text,
  p_base_city text,
  p_categories text[],
  p_bulstat text,
  p_services jsonb,       -- [{title, description, price_from, price_unit, duration_min}, ...]
  p_working_hours jsonb   -- [{weekday, start_time, end_time}, ...]
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  -- updated_at is intentionally left alone: it isn't in the column-level grant
  -- (only slug/display_name/bio/categories/base_city/bulstat are), and adding it
  -- would require widening that grant for a cosmetic timestamp.
  update public.maistor_profiles
  set display_name = p_display_name, bio = p_bio, base_city = p_base_city,
      categories = p_categories, bulstat = p_bulstat
  where user_id = v_uid;

  if not found then
    raise exception 'profile_not_found';
  end if;

  delete from public.services where maistor_id = v_uid;
  insert into public.services (maistor_id, title, description, price_from, price_unit, duration_min)
  select v_uid, x.title, x.description, x.price_from, x.price_unit, x.duration_min
  from jsonb_to_recordset(p_services)
    as x(title text, description text, price_from numeric, price_unit text, duration_min int);

  delete from public.working_hours where maistor_id = v_uid;
  insert into public.working_hours (maistor_id, weekday, start_time, end_time)
  select v_uid, x.weekday, x.start_time, x.end_time
  from jsonb_to_recordset(p_working_hours)
    as x(weekday int, start_time time, end_time time);
end;
$$;

grant execute on function public.update_maistor_profile(text, text, text, text[], text, jsonb, jsonb)
  to authenticated;
