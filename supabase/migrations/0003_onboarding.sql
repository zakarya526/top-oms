-- 0003_onboarding.sql
-- Self-service tenant onboarding.
--
-- A signed-in user (created via supabase.auth.signUp) calls this to create
-- THEIR OWN restaurant and become its admin. Security properties:
--   * role is hard-coded to 'admin' — a caller can never grant themselves a
--     different role or join an existing restaurant,
--   * the restaurant is always freshly created — no way to attach to someone
--     else's tenant,
--   * one profile per account — re-running is rejected.
-- SECURITY DEFINER so it can insert past RLS for the brand-new tenant.

create or replace function public.create_restaurant_for_current_user(
  restaurant_name text,
  admin_full_name text,
  currency text default 'GBP'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  new_restaurant_id uuid;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if exists (select 1 from public.user_profiles where id = uid) then
    raise exception 'This account already belongs to a restaurant';
  end if;

  if coalesce(trim(restaurant_name), '') = '' then
    raise exception 'Restaurant name is required';
  end if;

  insert into public.restaurants (name, currency)
  values (
    trim(restaurant_name),
    coalesce(nullif(trim(currency), ''), 'GBP')
  )
  returning id into new_restaurant_id;

  insert into public.user_profiles (id, restaurant_id, full_name, role, is_active)
  values (
    uid,
    new_restaurant_id,
    coalesce(nullif(trim(admin_full_name), ''), 'Admin'),
    'admin',
    true
  );

  return new_restaurant_id;
end;
$$;

revoke all on function public.create_restaurant_for_current_user(text, text, text) from public;
grant execute on function public.create_restaurant_for_current_user(text, text, text) to authenticated;
