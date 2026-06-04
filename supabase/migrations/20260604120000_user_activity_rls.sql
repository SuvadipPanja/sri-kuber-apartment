-- Allow the portal (anon key) to read/write activity logs.
-- Run this in Supabase SQL Editor if Activity Report stays empty after login.

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all_user_sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "anon_all_user_activity_events" ON public.user_activity_events;

CREATE POLICY "anon_all_user_sessions" ON public.user_sessions
  FOR ALL TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "anon_all_user_activity_events" ON public.user_activity_events
  FOR ALL TO anon
  USING (true)
  WITH CHECK (true);
