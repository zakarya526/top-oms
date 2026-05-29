-- 0008_peshawar_menu.sql
-- Replace the generic starter menu with the real "Taste of Peshawar" menu
-- (from EXACT_MENU.txt): 12 categories, 77 items. Every new restaurant is
-- seeded with this as its starting menu (independent copy it can then edit).
-- Combo contents (Mix Grill, Tawa, Maicha, Kabli Pilau, etc.) go in the item
-- description; prices and item names match the source exactly.

create or replace function public.seed_starter_data(p_restaurant_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  cat_starters uuid;
  cat_special  uuid;
  cat_tawa     uuid;
  cat_veg      uuid;
  cat_mains    uuid;
  cat_sides    uuid;
  cat_cans     uuid;
  cat_glass    uuid;
  cat_water    uuid;
  cat_big      uuid;
  cat_hot      uuid;
  cat_lassi    uuid;
  tawa_desc text := 'Chicken Curry, Lamb Curry, Karahi, Kebabs, Wings, Seekh, Chapli Kebab, Chips, Naan';
begin
  if exists (select 1 from public.menu_categories where restaurant_id = p_restaurant_id) then
    return;
  end if;

  insert into public.menu_categories (restaurant_id, name, sort_order) values
    (p_restaurant_id, 'Starters', 1)               returning id into cat_starters;
  insert into public.menu_categories (restaurant_id, name, sort_order) values
    (p_restaurant_id, 'Special Offers', 2)         returning id into cat_special;
  insert into public.menu_categories (restaurant_id, name, sort_order) values
    (p_restaurant_id, 'Tawa (Family Sets)', 3)     returning id into cat_tawa;
  insert into public.menu_categories (restaurant_id, name, sort_order) values
    (p_restaurant_id, 'Vegetarian', 4)             returning id into cat_veg;
  insert into public.menu_categories (restaurant_id, name, sort_order) values
    (p_restaurant_id, 'Main Courses', 5)           returning id into cat_mains;
  insert into public.menu_categories (restaurant_id, name, sort_order) values
    (p_restaurant_id, 'Sides', 6)                  returning id into cat_sides;
  insert into public.menu_categories (restaurant_id, name, sort_order) values
    (p_restaurant_id, 'Drinks - Cans', 7)          returning id into cat_cans;
  insert into public.menu_categories (restaurant_id, name, sort_order) values
    (p_restaurant_id, 'Drinks - Glass Bottles', 8) returning id into cat_glass;
  insert into public.menu_categories (restaurant_id, name, sort_order) values
    (p_restaurant_id, 'Drinks - Water', 9)         returning id into cat_water;
  insert into public.menu_categories (restaurant_id, name, sort_order) values
    (p_restaurant_id, 'Drinks - Big Bottles', 10)  returning id into cat_big;
  insert into public.menu_categories (restaurant_id, name, sort_order) values
    (p_restaurant_id, 'Drinks - Hot', 11)          returning id into cat_hot;
  insert into public.menu_categories (restaurant_id, name, sort_order) values
    (p_restaurant_id, 'Drinks - Lassi / Yogurt', 12) returning id into cat_lassi;

  insert into public.menu_items
    (restaurant_id, category_id, name, description, price, sort_order)
  values
    -- Starters
    (p_restaurant_id, cat_starters, 'BBQ Chicken Wings',           null, 4.99, 1),
    (p_restaurant_id, cat_starters, 'Chicken Seekh Tikka',         null, 5.99, 2),
    (p_restaurant_id, cat_starters, 'Chicken Seekh Kebab',         null, 5.99, 3),
    (p_restaurant_id, cat_starters, 'Lamb Chops',                  null, 5.99, 4),
    (p_restaurant_id, cat_starters, 'Chapli Kebab',                null, 4.99, 5),
    (p_restaurant_id, cat_starters, 'Chapli Kebab Sauce Salad',    null, 4.99, 6),
    (p_restaurant_id, cat_starters, 'Mix Grill',   '2 Seekh Kebabs, 2 Lamb Chops, 2 Wings, 4 Chicken Tikka',   18.99, 7),
    (p_restaurant_id, cat_starters, 'Mix Grill 2', '4 Seekh Kebabs, 4 Lamb Chops, 4 Chicken Wings, 8 Chicken Tikka', 34.99, 8),

    -- Special Offers
    (p_restaurant_id, cat_special, 'Peshawari Special Chapli Kebab', '4 Chapli Kebabs, Sauce & Salad', 16.99, 1),
    (p_restaurant_id, cat_special, 'Maicha',                 'Rice with Lamb Shank, Tarkari, Naan & Salad', 14.99, 2),
    (p_restaurant_id, cat_special, 'Kabli Pilau',            'Rice with Lamb Meat, Tarkari, Naan, Salad',   13.99, 3),
    (p_restaurant_id, cat_special, 'Kabli Pilau Rice (No Meat)', null,                                       7.99, 4),

    -- Tawa (Family Sets)
    (p_restaurant_id, cat_tawa, 'Tawa for 2 Persons', tawa_desc, 35.99, 1),
    (p_restaurant_id, cat_tawa, 'Tawa for 3 Persons', tawa_desc, 46.99, 2),
    (p_restaurant_id, cat_tawa, 'Tawa for 4 Persons', tawa_desc, 57.99, 3),
    (p_restaurant_id, cat_tawa, 'Tawa for 5 Persons', tawa_desc, 68.99, 4),

    -- Vegetarian
    (p_restaurant_id, cat_veg, 'Tarka Dall (V)', null, 5.99, 1),
    (p_restaurant_id, cat_veg, 'Saag Aloo (V)',  null, 6.99, 2),
    (p_restaurant_id, cat_veg, 'Saag Dall (V)',  null, 6.99, 3),

    -- Main Courses
    (p_restaurant_id, cat_mains, 'Chicken Biryani',                   null,  7.99, 1),
    (p_restaurant_id, cat_mains, 'Chicken Masala Curry',              null,  8.99, 2),
    (p_restaurant_id, cat_mains, 'Lamb Masala Curry',                 null, 12.99, 3),
    (p_restaurant_id, cat_mains, 'Chicken Karahi Boneless',           null, 12.99, 4),
    (p_restaurant_id, cat_mains, 'Peshawari Chicken Karahi (Half)',   null, 12.99, 5),
    (p_restaurant_id, cat_mains, 'Peshawari Chicken Karahi (Full)',   null, 22.99, 6),
    (p_restaurant_id, cat_mains, 'Chicken Seekh Tikka Karahi (Half)', null, 12.99, 7),
    (p_restaurant_id, cat_mains, 'Chicken Seekh Tikka Karahi (Full)', null, 22.99, 8),
    (p_restaurant_id, cat_mains, 'Lahori Lamb Karahi (Half)',         null, 18.99, 9),
    (p_restaurant_id, cat_mains, 'Lahori Lamb Karahi (Full)',         null, 28.99, 10),
    (p_restaurant_id, cat_mains, 'Peshawari Lamb Karahi (Half)',      null, 23.99, 11),
    (p_restaurant_id, cat_mains, 'Peshawari Lamb Karahi (Full)',      null, 36.99, 12),

    -- Sides
    (p_restaurant_id, cat_sides, 'Pilau Rice',           null, 3.50, 1),
    (p_restaurant_id, cat_sides, 'Portion of Chips',     null, 2.50, 2),
    (p_restaurant_id, cat_sides, 'Naan',                 null, 0.99, 3),
    (p_restaurant_id, cat_sides, 'Butter Naan',          null, 1.39, 4),
    (p_restaurant_id, cat_sides, 'Garlic Naan',          null, 1.69, 5),
    (p_restaurant_id, cat_sides, 'Kulcha Naan',          null, 1.79, 6),
    (p_restaurant_id, cat_sides, 'Naan (Large)',         null, 1.99, 7),
    (p_restaurant_id, cat_sides, 'Kheer (Rice Pudding)', null, 3.99, 8),

    -- Drinks - Cans
    (p_restaurant_id, cat_cans, 'Coke (Can)',      null, 1.79, 1),
    (p_restaurant_id, cat_cans, 'Diet Coke (Can)', null, 1.79, 2),
    (p_restaurant_id, cat_cans, 'Coke Zero (Can)', null, 1.79, 3),
    (p_restaurant_id, cat_cans, 'Sprite (Can)',    null, 1.79, 4),
    (p_restaurant_id, cat_cans, 'Fanta (Can)',     null, 1.79, 5),
    (p_restaurant_id, cat_cans, 'Pepsi (Can)',     null, 1.79, 6),
    (p_restaurant_id, cat_cans, '7up (Can)',       null, 1.79, 7),
    (p_restaurant_id, cat_cans, 'Tango (Can)',     null, 1.79, 8),
    (p_restaurant_id, cat_cans, 'Can Drink',       null, 1.79, 9),

    -- Drinks - Glass Bottles
    (p_restaurant_id, cat_glass, 'Coke (Glass Bottle)',      null, 2.50, 1),
    (p_restaurant_id, cat_glass, 'Diet Coke (Glass Bottle)', null, 2.50, 2),
    (p_restaurant_id, cat_glass, 'Coke Zero (Glass Bottle)', null, 2.50, 3),
    (p_restaurant_id, cat_glass, '7UP (Glass Bottle)',       null, 2.50, 4),
    (p_restaurant_id, cat_glass, 'Sprite (Glass Bottle)',    null, 2.50, 5),
    (p_restaurant_id, cat_glass, 'Fanta (Glass Bottle)',     null, 2.50, 6),
    (p_restaurant_id, cat_glass, 'Pepsi (Glass Bottle)',     null, 2.50, 7),
    (p_restaurant_id, cat_glass, 'J2O (Glass Bottle)',       null, 2.50, 8),
    (p_restaurant_id, cat_glass, 'Glass Bottle Drink',       null, 2.50, 9),

    -- Drinks - Water
    (p_restaurant_id, cat_water, 'Still Water',      null, 1.00, 1),
    (p_restaurant_id, cat_water, 'Big Bottle Water', null, 2.50, 2),
    (p_restaurant_id, cat_water, 'Sparkling Water',  null, 1.29, 3),

    -- Drinks - Big Bottles
    (p_restaurant_id, cat_big, 'Coke (Big Bottle)',      null, 3.99, 1),
    (p_restaurant_id, cat_big, 'Diet Coke (Big Bottle)', null, 3.99, 2),
    (p_restaurant_id, cat_big, 'Sprite (Big Bottle)',    null, 3.99, 3),
    (p_restaurant_id, cat_big, 'Fanta (Big Bottle)',     null, 3.99, 4),
    (p_restaurant_id, cat_big, 'Pepsi (Big Bottle)',     null, 3.99, 5),
    (p_restaurant_id, cat_big, '7UP (Big Bottle)',       null, 3.99, 6),
    (p_restaurant_id, cat_big, 'Big Bottle Drinks',      null, 3.99, 7),

    -- Drinks - Hot
    (p_restaurant_id, cat_hot, 'Green Tea (Qahwa)',   null, 0.70, 1),
    (p_restaurant_id, cat_hot, 'Tea (Doodh Patti)',   null, 1.20, 2),
    (p_restaurant_id, cat_hot, 'English Tea',         null, 1.20, 3),
    (p_restaurant_id, cat_hot, 'Coffee',              null, 1.50, 4),

    -- Drinks - Lassi / Yogurt
    (p_restaurant_id, cat_lassi, 'Sweet Lassi (Glass)',  null, 2.50, 1),
    (p_restaurant_id, cat_lassi, 'Sweet Lassi (Jug)',    null, 5.99, 2),
    (p_restaurant_id, cat_lassi, 'Salted Lassi (Glass)', null, 2.50, 3),
    (p_restaurant_id, cat_lassi, 'Salted Lassi (Jug)',   null, 5.99, 4),
    (p_restaurant_id, cat_lassi, 'Mango Lassi (Glass)',  null, 2.99, 5),
    (p_restaurant_id, cat_lassi, 'Mango Lassi (Jug)',    null, 6.99, 6);

  -- Starter dining tables (unchanged).
  if not exists (select 1 from public.tables where restaurant_id = p_restaurant_id) then
    insert into public.tables (restaurant_id, table_number, label, capacity, status)
    select
      p_restaurant_id, gs, 'Table ' || gs,
      case when gs <= 4 then 2 when gs <= 6 then 4 else 6 end, 'available'
    from generate_series(1, 8) as gs;
  end if;
end;
$$;
