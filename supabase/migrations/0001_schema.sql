-- 0001_schema.sql
-- Core multi-tenant schema for TOP OMS.
-- `restaurants` is the tenant table; every business row carries restaurant_id.
-- Tenant isolation is enforced by RLS in 0004_rls.sql.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.order_status as enum (
  'pending', 'preparing', 'ready', 'served', 'completed', 'cancelled'
);
create type public.table_status as enum ('available', 'occupied');
create type public.user_role as enum ('admin', 'waiter', 'kitchen');

-- ---------------------------------------------------------------------------
-- Tenants
-- ---------------------------------------------------------------------------
create table public.restaurants (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  currency   text not null default 'GBP',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- User profiles: one row per auth user, belongs to exactly one restaurant.
-- ---------------------------------------------------------------------------
create table public.user_profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  full_name     text not null,
  role          public.user_role not null,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);
create index user_profiles_restaurant_id_idx on public.user_profiles (restaurant_id);

-- ---------------------------------------------------------------------------
-- Menu
-- ---------------------------------------------------------------------------
create table public.menu_categories (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  name          text not null,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now()
);
create index menu_categories_restaurant_id_idx on public.menu_categories (restaurant_id);

create table public.menu_items (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  category_id   uuid not null references public.menu_categories (id) on delete cascade,
  name          text not null,
  description   text,
  price         numeric(10, 2) not null,
  is_available  boolean not null default true,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now()
);
create index menu_items_restaurant_id_idx on public.menu_items (restaurant_id);
create index menu_items_category_id_idx on public.menu_items (category_id);

-- ---------------------------------------------------------------------------
-- Dining tables
-- ---------------------------------------------------------------------------
create table public.tables (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  table_number  integer not null,
  label         text,
  capacity      integer,
  status        public.table_status not null default 'available',
  created_at    timestamptz not null default now(),
  unique (restaurant_id, table_number)
);
create index tables_restaurant_id_idx on public.tables (restaurant_id);

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------
create table public.orders (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  table_id      uuid not null references public.tables (id) on delete restrict,
  waiter_id     uuid not null references public.user_profiles (id) on delete restrict,
  status        public.order_status not null default 'pending',
  total_amount  numeric(10, 2) not null default 0,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index orders_restaurant_id_idx on public.orders (restaurant_id);
create index orders_status_idx on public.orders (restaurant_id, status);
create index orders_table_id_idx on public.orders (table_id);
create index orders_waiter_id_idx on public.orders (waiter_id);

-- ---------------------------------------------------------------------------
-- Order items (item_name / item_price are snapshots, independent of menu edits)
-- ---------------------------------------------------------------------------
create table public.order_items (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  order_id      uuid not null references public.orders (id) on delete cascade,
  menu_item_id  uuid not null references public.menu_items (id) on delete restrict,
  item_name     text not null,
  item_price    numeric(10, 2) not null,
  quantity      integer not null default 1,
  notes         text,
  created_at    timestamptz not null default now()
);
create index order_items_restaurant_id_idx on public.order_items (restaurant_id);
create index order_items_order_id_idx on public.order_items (order_id);

-- ---------------------------------------------------------------------------
-- Keep orders.updated_at fresh on every update
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();
