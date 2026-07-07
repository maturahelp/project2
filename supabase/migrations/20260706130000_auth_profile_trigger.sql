-- Майстор24 — auto-create a profiles row when a new auth user signs up.
--
-- The app calls supabase.auth.signUp(..., { data: { role, full_name } }).
-- Those land in auth.users.raw_user_meta_data. This trigger reads them and
-- inserts the matching public.profiles row.
--
-- SECURITY DEFINER so it runs as the owner and bypasses RLS (the new user has
-- no session yet at auth.users insert time). search_path is pinned for safety.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := coalesce(nullif(new.raw_user_meta_data ->> 'role', ''), 'client');
begin
  -- Guard against unexpected metadata; the profiles CHECK also enforces this.
  if v_role not in ('maistor', 'client') then
    v_role := 'client';
  end if;

  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    v_role,
    nullif(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
