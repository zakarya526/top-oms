-- 0004_rls.sql
-- Row-Level Security: the heart of multi-tenancy.
--
-- Baseline rule on every table: a row is visible/writable only when its
-- restaurant_id equals the caller's tenant (get_my_restaurant_id()). On top of
-- that, writes are gated by role to mirror the app's screens:
--   * menu + restaurant settings + staff management  -> admin only
--   * dining tables: structure (insert/delete) = admin, status (update) = any staff
--   * orders / order_items: created by waiter/admin, status updated by any staff
--
-- A user with no profile yet (just signed up, restaurant not created) gets
-- NULL from get_my_restaurant_id(), so every comparison is false -> sees nothing.

alter table public.restaurants     enable row level security;
alter table public.user_profiles   enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items      enable row level security;
alter table public.tables          enable row level security;
alter table public.orders          enable row level security;
alter table public.order_items     enable row level security;

-- ---------------------------------------------------------------------------
-- restaurants — members read their own; only admin edits. No client insert
-- (created via the onboarding RPC) and no delete.
-- ---------------------------------------------------------------------------
create policy restaurants_select on public.restaurants
  for select to authenticated
  using (id = public.get_my_restaurant_id());

create policy restaurants_update_admin on public.restaurants
  for update to authenticated
  using (id = public.get_my_restaurant_id() and public.get_my_role() = 'admin')
  with check (id = public.get_my_restaurant_id() and public.get_my_role() = 'admin');

-- ---------------------------------------------------------------------------
-- user_profiles — members see colleagues in their restaurant; admin manages.
-- (Profile creation runs through the onboarding RPC and the create-user Edge
--  Function, both of which bypass RLS, so no general INSERT policy is needed;
--  an admin INSERT policy is kept as a safety net.)
-- ---------------------------------------------------------------------------
create policy user_profiles_select on public.user_profiles
  for select to authenticated
  using (restaurant_id = public.get_my_restaurant_id());

create policy user_profiles_insert_admin on public.user_profiles
  for insert to authenticated
  with check (restaurant_id = public.get_my_restaurant_id() and public.get_my_role() = 'admin');

create policy user_profiles_update_admin on public.user_profiles
  for update to authenticated
  using (restaurant_id = public.get_my_restaurant_id() and public.get_my_role() = 'admin')
  with check (restaurant_id = public.get_my_restaurant_id() and public.get_my_role() = 'admin');

-- ---------------------------------------------------------------------------
-- menu_categories — read: members; write: admin
-- ---------------------------------------------------------------------------
create policy menu_categories_select on public.menu_categories
  for select to authenticated
  using (restaurant_id = public.get_my_restaurant_id());

create policy menu_categories_insert_admin on public.menu_categories
  for insert to authenticated
  with check (restaurant_id = public.get_my_restaurant_id() and public.get_my_role() = 'admin');

create policy menu_categories_update_admin on public.menu_categories
  for update to authenticated
  using (restaurant_id = public.get_my_restaurant_id() and public.get_my_role() = 'admin')
  with check (restaurant_id = public.get_my_restaurant_id() and public.get_my_role() = 'admin');

create policy menu_categories_delete_admin on public.menu_categories
  for delete to authenticated
  using (restaurant_id = public.get_my_restaurant_id() and public.get_my_role() = 'admin');

-- ---------------------------------------------------------------------------
-- menu_items — read: members; write: admin
-- ---------------------------------------------------------------------------
create policy menu_items_select on public.menu_items
  for select to authenticated
  using (restaurant_id = public.get_my_restaurant_id());

create policy menu_items_insert_admin on public.menu_items
  for insert to authenticated
  with check (restaurant_id = public.get_my_restaurant_id() and public.get_my_role() = 'admin');

create policy menu_items_update_admin on public.menu_items
  for update to authenticated
  using (restaurant_id = public.get_my_restaurant_id() and public.get_my_role() = 'admin')
  with check (restaurant_id = public.get_my_restaurant_id() and public.get_my_role() = 'admin');

create policy menu_items_delete_admin on public.menu_items
  for delete to authenticated
  using (restaurant_id = public.get_my_restaurant_id() and public.get_my_role() = 'admin');

-- ---------------------------------------------------------------------------
-- tables — read: members; insert/delete: admin; update (status): any staff
-- ---------------------------------------------------------------------------
create policy tables_select on public.tables
  for select to authenticated
  using (restaurant_id = public.get_my_restaurant_id());

create policy tables_insert_admin on public.tables
  for insert to authenticated
  with check (restaurant_id = public.get_my_restaurant_id() and public.get_my_role() = 'admin');

create policy tables_update_member on public.tables
  for update to authenticated
  using (restaurant_id = public.get_my_restaurant_id())
  with check (restaurant_id = public.get_my_restaurant_id());

create policy tables_delete_admin on public.tables
  for delete to authenticated
  using (restaurant_id = public.get_my_restaurant_id() and public.get_my_role() = 'admin');

-- ---------------------------------------------------------------------------
-- orders — read: members; insert: waiter/admin; update (status): any staff;
-- delete: admin
-- ---------------------------------------------------------------------------
create policy orders_select on public.orders
  for select to authenticated
  using (restaurant_id = public.get_my_restaurant_id());

create policy orders_insert_staff on public.orders
  for insert to authenticated
  with check (restaurant_id = public.get_my_restaurant_id() and public.get_my_role() in ('waiter', 'admin'));

create policy orders_update_member on public.orders
  for update to authenticated
  using (restaurant_id = public.get_my_restaurant_id())
  with check (restaurant_id = public.get_my_restaurant_id());

create policy orders_delete_admin on public.orders
  for delete to authenticated
  using (restaurant_id = public.get_my_restaurant_id() and public.get_my_role() = 'admin');

-- ---------------------------------------------------------------------------
-- order_items — read: members; insert: waiter/admin; update/delete: any staff
-- ---------------------------------------------------------------------------
create policy order_items_select on public.order_items
  for select to authenticated
  using (restaurant_id = public.get_my_restaurant_id());

create policy order_items_insert_staff on public.order_items
  for insert to authenticated
  with check (restaurant_id = public.get_my_restaurant_id() and public.get_my_role() in ('waiter', 'admin'));

create policy order_items_update_member on public.order_items
  for update to authenticated
  using (restaurant_id = public.get_my_restaurant_id())
  with check (restaurant_id = public.get_my_restaurant_id());

create policy order_items_delete_member on public.order_items
  for delete to authenticated
  using (restaurant_id = public.get_my_restaurant_id());
