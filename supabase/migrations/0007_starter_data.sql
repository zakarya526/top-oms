-- 0007_starter_data.sql
-- Give every new tenant a populated starter menu + tables so the app isn't
-- empty on first login. seed_starter_data is invoked from the onboarding RPC,
-- and is idempotent (it no-ops if the restaurant already has a menu), so it's
-- also safe to call manually to backfill an existing restaurant.

create or replace function public.seed_starter_data(p_restaurant_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  cat_starters uuid;
  cat_mains    uuid;
  cat_desserts uuid;
  cat_drinks   uuid;
begin
  -- Don't double-seed.
  if exists (select 1 from public.menu_categories where restaurant_id = p_restaurant_id) then
    return;
  end if;

  insert into public.menu_categories (restaurant_id, name, sort_order)
    values (p_restaurant_id, 'Starters', 1) returning id into cat_starters;
  insert into public.menu_categories (restaurant_id, name, sort_order)
    values (p_restaurant_id, 'Mains', 2) returning id into cat_mains;
  insert into public.menu_categories (restaurant_id, name, sort_order)
    values (p_restaurant_id, 'Desserts', 3) returning id into cat_desserts;
  insert into public.menu_categories (restaurant_id, name, sort_order)
    values (p_restaurant_id, 'Drinks', 4) returning id into cat_drinks;

  insert into public.menu_items
    (restaurant_id, category_id, name, description, price, sort_order)
  values
    (p_restaurant_id, cat_starters, 'Garlic Bread',       'Toasted ciabatta with garlic butter',            4.50, 1),
    (p_restaurant_id, cat_starters, 'Soup of the Day',    'Chef''s daily seasonal soup',                    5.00, 2),
    (p_restaurant_id, cat_starters, 'Bruschetta',         'Tomato, basil & olive oil on toasted bread',     5.50, 3),
    (p_restaurant_id, cat_starters, 'Halloumi Fries',     'Crispy halloumi with sweet chilli dip',          6.50, 4),
    (p_restaurant_id, cat_mains,    'Classic Burger',     'Beef patty, cheese, lettuce, tomato & fries',   12.50, 1),
    (p_restaurant_id, cat_mains,    'Margherita Pizza',   'Tomato, mozzarella & fresh basil',              11.00, 2),
    (p_restaurant_id, cat_mains,    'Grilled Chicken',    'Herb-marinated chicken with seasonal veg',      14.00, 3),
    (p_restaurant_id, cat_mains,    'Fish & Chips',       'Beer-battered cod with chips & peas',           13.50, 4),
    (p_restaurant_id, cat_mains,    'Veggie Pasta',       'Penne with roasted vegetables & tomato sauce',  10.50, 5),
    (p_restaurant_id, cat_desserts, 'Chocolate Brownie',  'Warm brownie with vanilla ice cream',            6.00, 1),
    (p_restaurant_id, cat_desserts, 'Cheesecake',         'New York style with berry compote',              6.50, 2),
    (p_restaurant_id, cat_desserts, 'Ice Cream',          'Three scoops: vanilla, chocolate, strawberry',   4.50, 3),
    (p_restaurant_id, cat_drinks,   'Still Water',        '500ml bottle',                                   2.00, 1),
    (p_restaurant_id, cat_drinks,   'Soft Drink',         'Cola, lemonade or orange',                       2.50, 2),
    (p_restaurant_id, cat_drinks,   'Fresh Orange Juice', 'Freshly squeezed',                               3.50, 3),
    (p_restaurant_id, cat_drinks,   'House Coffee',       'Americano, latte or cappuccino',                 2.80, 4);

  -- Starter dining tables (skip if any already exist).
  if not exists (select 1 from public.tables where restaurant_id = p_restaurant_id) then
    insert into public.tables (restaurant_id, table_number, label, capacity, status)
    select
      p_restaurant_id,
      gs,
      'Table ' || gs,
      case when gs <= 4 then 2 when gs <= 6 then 4 else 6 end,
      'available'
    from generate_series(1, 8) as gs;
  end if;
end;
$$;

revoke all on function public.seed_starter_data(uuid) from public;

-- Seed the starter data as part of creating a restaurant.
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

  -- Populate a starter menu + tables for the brand-new tenant.
  perform public.seed_starter_data(new_restaurant_id);

  return new_restaurant_id;
end;
$$;

revoke execute on function public.create_restaurant_for_current_user(text, text, text) from anon;
grant execute on function public.create_restaurant_for_current_user(text, text, text) to authenticated;
