-- 0002_functions.sql
-- Tenant-context helpers used by both RLS policies and the app.
--
-- They are SECURITY DEFINER so they read user_profiles bypassing RLS. This is
-- essential: it lets user_profiles' own RLS policy call get_my_restaurant_id()
-- without recursively re-evaluating that policy.

create or replace function public.get_my_restaurant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select restaurant_id from public.user_profiles where id = auth.uid();
$$;

create or replace function public.get_my_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.user_profiles where id = auth.uid();
$$;

revoke all on function public.get_my_restaurant_id() from public;
revoke all on function public.get_my_role() from public;
grant execute on function public.get_my_restaurant_id() to authenticated;
grant execute on function public.get_my_role() to authenticated;

-- ---------------------------------------------------------------------------
-- Defense-in-depth: default restaurant_id to the caller's tenant so client
-- code physically cannot insert rows into another restaurant. The RLS
-- WITH CHECK clauses (0004) still enforce this regardless of what is sent.
-- (user_profiles is intentionally excluded: its rows are created by the
--  onboarding RPC and the create-user Edge Function, which set it explicitly.)
-- ---------------------------------------------------------------------------
alter table public.menu_categories alter column restaurant_id set default public.get_my_restaurant_id();
alter table public.menu_items      alter column restaurant_id set default public.get_my_restaurant_id();
alter table public.tables          alter column restaurant_id set default public.get_my_restaurant_id();
alter table public.orders          alter column restaurant_id set default public.get_my_restaurant_id();
alter table public.order_items     alter column restaurant_id set default public.get_my_restaurant_id();
