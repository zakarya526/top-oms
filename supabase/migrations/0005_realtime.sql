-- 0005_realtime.sql
-- Stream changes the app subscribes to (useOrders, useOrder, useTables).
-- RLS still applies to realtime, so each client only receives rows for its own
-- restaurant. REPLICA IDENTITY FULL ensures UPDATE/DELETE payloads and
-- column filters work reliably.

alter table public.orders      replica identity full;
alter table public.order_items replica identity full;
alter table public.tables      replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'order_items'
  ) then
    alter publication supabase_realtime add table public.order_items;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'tables'
  ) then
    alter publication supabase_realtime add table public.tables;
  end if;
end
$$;
