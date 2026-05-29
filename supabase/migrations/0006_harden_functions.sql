-- 0006_harden_functions.sql
-- Address security advisor findings.

-- set_updated_at touches no tables, so an empty search_path is safe and silences
-- the "mutable search path" lint.
alter function public.set_updated_at() set search_path = '';

-- Supabase's default privileges grant EXECUTE on new functions to `anon`.
-- These functions are only meaningful for signed-in users, so deny anon:
--   * get_my_restaurant_id / get_my_role are used inside RLS (authenticated only),
--   * create_restaurant_for_current_user requires auth.uid().
-- `authenticated` keeps EXECUTE (required for RLS policy evaluation + onboarding).
revoke execute on function public.get_my_restaurant_id() from anon;
revoke execute on function public.get_my_role() from anon;
revoke execute on function public.create_restaurant_for_current_user(text, text, text) from anon;
