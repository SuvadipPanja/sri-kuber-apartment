-- Ensure anon can UPDATE user_sessions (logout_at) — fixes logout time not saving
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_update_user_sessions" ON public.user_sessions;
CREATE POLICY "anon_update_user_sessions" ON public.user_sessions
  FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);
