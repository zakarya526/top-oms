-- 0009_enforce_is_active.sql
-- H1: make deactivation real. A user with is_active=false now resolves to NO
-- tenant/role, so every RLS check denies them — even though their JWT is still
-- valid. They can still read their OWN profile row so the app can detect the
-- deactivation and sign them out.

create or replace function public.get_my_restaurant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select restaurant_id from public.user_profiles where id = auth.uid() and is_active;
$$;

create or replace function public.get_my_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.user_profiles where id = auth.uid() and is_active;
$$;

-- create or replace preserves ACLs, but re-assert them defensively.
revoke execute on function public.get_my_restaurant_id() from anon;
revoke execute on function public.get_my_role() from anon;
grant execute on function public.get_my_restaurant_id() to authenticated;
grant execute on function public.get_my_role() to authenticated;

-- Always let a user read their own profile (so a deactivated user can be
-- detected client-side), in addition to seeing active colleagues.
drop policy if exists user_profiles_select on public.user_profiles;
create policy user_profiles_select on public.user_profiles
  for select to authenticated
  using (id = auth.uid() or restaurant_id = public.get_my_restaurant_id());
