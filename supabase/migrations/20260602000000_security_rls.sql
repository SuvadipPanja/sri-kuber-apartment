-- Sri Kuber Apartment — Row Level Security baseline
-- Run in Supabase SQL Editor or via CLI. Adjust flat_no claims when migrating to Supabase Auth.

-- Helper: flat number from JWT app_metadata (set via Edge Function after login)
-- CREATE OR REPLACE FUNCTION public.current_flat_no()
-- RETURNS text LANGUAGE sql STABLE AS $$
--   SELECT nullif(auth.jwt() -> 'app_metadata' ->> 'flat_no', '');
-- $$;

-- Example policies (enable RLS on each table first):

-- ALTER TABLE public.auth_users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.auth_users FORCE ROW LEVEL SECURITY;

-- Block anon from reading password hashes (prefer Edge Function login + Supabase Auth long-term)
-- CREATE POLICY auth_users_no_anon_select ON public.auth_users
--   FOR SELECT TO authenticated
--   USING (false);

-- ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY payments_resident_read ON public.payments
--   FOR SELECT TO authenticated
--   USING (flat_no = (SELECT auth.jwt() -> 'app_metadata' ->> 'flat_no'));

-- ALTER TABLE public.owners ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY owners_read_all ON public.owners
--   FOR SELECT TO authenticated
--   USING (true);

-- Storage: private buckets
-- CREATE POLICY profile_photos_own ON storage.objects
--   FOR ALL TO authenticated
--   USING (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = (auth.jwt() -> 'app_metadata' ->> 'flat_no'));

-- REVOKE ALL ON public.auth_users FROM anon;
-- Grant only what each role needs. Never expose service_role in VITE_* env vars.

COMMENT ON SCHEMA public IS 'Apply RLS before production. See society-app/SECURITY.md';
