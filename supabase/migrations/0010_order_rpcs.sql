-- 0010_order_rpcs.sql
-- H2/M4/M5/M3: make order creation and status changes server-authoritative.
--
--  * create_order() looks up prices from menu_items (never trusts the client),
--    validates the table + items belong to the caller's tenant, computes the
--    total + service charge, and marks the table occupied — all atomically.
--  * set_order_status() enforces a role-aware state machine and frees the table
--    only when no other active order remains on it.
--  * Direct client INSERT/UPDATE on orders/order_items is removed so these RPCs
--    are the only write path (clients keep SELECT for reads/realtime).

alter table public.orders
  add column if not exists service_charge numeric(10, 2) not null default 0;

-- --------------------------------------------------------------------------
-- create_order
-- p_items: jsonb array of { menu_item_id: uuid, quantity: int, notes?: text }
-- --------------------------------------------------------------------------
create or replace function public.create_order(
  p_table_id uuid,
  p_notes text,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  rid uuid := public.get_my_restaurant_id();
  rrole public.user_role := public.get_my_role();
  v_order_id uuid;
  v_subtotal numeric(10,2) := 0;
  v_service numeric(10,2);
  v_service_rate constant numeric := 0.10;
  it jsonb;
  mi record;
  v_qty int;
begin
  if rid is null then
    raise exception 'Not authorized';
  end if;
  if rrole not in ('waiter', 'admin') then
    raise exception 'Only waiters or admins can create orders';
  end if;
  if not exists (select 1 from public.tables where id = p_table_id and restaurant_id = rid) then
    raise exception 'Table not found in your restaurant';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Order must contain at least one item';
  end if;

  insert into public.orders (restaurant_id, table_id, waiter_id, status, total_amount, service_charge, notes)
  values (rid, p_table_id, auth.uid(), 'pending', 0, 0, nullif(trim(coalesce(p_notes, '')), ''))
  returning id into v_order_id;

  for it in select * from jsonb_array_elements(p_items)
  loop
    v_qty := coalesce((it->>'quantity')::int, 0);
    if v_qty <= 0 then
      raise exception 'Invalid quantity';
    end if;

    -- Price + name come from the catalog, NOT the client.
    select id, name, price into mi
    from public.menu_items
    where id = (it->>'menu_item_id')::uuid and restaurant_id = rid and is_available;
    if not found then
      raise exception 'Menu item unavailable or not in your restaurant';
    end if;

    insert into public.order_items
      (restaurant_id, order_id, menu_item_id, item_name, item_price, quantity, notes)
    values
      (rid, v_order_id, mi.id, mi.name, mi.price, v_qty, nullif(trim(coalesce(it->>'notes', '')), ''));

    v_subtotal := v_subtotal + mi.price * v_qty;
  end loop;

  v_service := round(v_subtotal * v_service_rate, 2);
  update public.orders
    set total_amount = v_subtotal + v_service, service_charge = v_service
    where id = v_order_id;

  update public.tables set status = 'occupied' where id = p_table_id and restaurant_id = rid;

  return v_order_id;
end;
$$;

revoke all on function public.create_order(uuid, text, jsonb) from public, anon;
grant execute on function public.create_order(uuid, text, jsonb) to authenticated;

-- --------------------------------------------------------------------------
-- set_order_status: role-aware state machine
--   kitchen/admin: pending->preparing->ready
--   waiter/admin : ready->served->completed
--   waiter/admin : cancel from any non-terminal state
-- Frees the table on completed/cancelled only if no other active order remains.
-- --------------------------------------------------------------------------
create or replace function public.set_order_status(
  p_order_id uuid,
  p_status public.order_status
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  rid uuid := public.get_my_restaurant_id();
  rrole public.user_role := public.get_my_role();
  v_current public.order_status;
  v_table uuid;
  v_allowed boolean;
begin
  if rid is null then
    raise exception 'Not authorized';
  end if;

  select status, table_id into v_current, v_table
  from public.orders where id = p_order_id and restaurant_id = rid;
  if not found then
    raise exception 'Order not found in your restaurant';
  end if;

  if p_status = v_current then
    return;
  end if;

  v_allowed := case
    when v_current = 'pending'   and p_status = 'preparing' and rrole in ('kitchen', 'admin') then true
    when v_current = 'preparing' and p_status = 'ready'     and rrole in ('kitchen', 'admin') then true
    when v_current = 'ready'     and p_status = 'served'    and rrole in ('waiter', 'admin')  then true
    when v_current = 'served'    and p_status = 'completed' and rrole in ('waiter', 'admin')  then true
    when p_status = 'cancelled'  and v_current not in ('completed', 'cancelled') and rrole in ('waiter', 'admin') then true
    else false
  end;

  if not v_allowed then
    raise exception 'Illegal status change % -> % for role %', v_current, p_status, rrole;
  end if;

  update public.orders set status = p_status where id = p_order_id;

  if p_status in ('completed', 'cancelled') then
    if not exists (
      select 1 from public.orders
      where table_id = v_table and restaurant_id = rid
        and id <> p_order_id and status not in ('completed', 'cancelled')
    ) then
      update public.tables set status = 'available' where id = v_table and restaurant_id = rid;
    end if;
  end if;
end;
$$;

revoke all on function public.set_order_status(uuid, public.order_status) from public, anon;
grant execute on function public.set_order_status(uuid, public.order_status) to authenticated;

-- --------------------------------------------------------------------------
-- Lock down direct writes: the RPCs above are now the only write path.
-- --------------------------------------------------------------------------
drop policy if exists orders_insert_staff   on public.orders;
drop policy if exists orders_update_member  on public.orders;
drop policy if exists order_items_insert_staff   on public.order_items;
drop policy if exists order_items_update_member  on public.order_items;
drop policy if exists order_items_delete_member  on public.order_items;

-- Table status is now changed only via the RPCs; structural edits are admin-only.
drop policy if exists tables_update_member on public.tables;
create policy tables_update_admin on public.tables
  for update to authenticated
  using (restaurant_id = public.get_my_restaurant_id() and public.get_my_role() = 'admin')
  with check (restaurant_id = public.get_my_restaurant_id() and public.get_my_role() = 'admin');
