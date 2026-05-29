-- 0011_lock_seed_function.sql
-- seed_starter_data is an internal helper called only by the onboarding RPC
-- (which runs as the function owner and so bypasses these grants). Supabase's
-- default privileges had left it EXECUTE-able by anon/authenticated via
-- /rest/v1/rpc — revoke that so it can't be invoked directly with an arbitrary
-- restaurant_id.
revoke all on function public.seed_starter_data(uuid) from public, anon, authenticated;
