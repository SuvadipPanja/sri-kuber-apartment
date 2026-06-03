-- User login sessions and activity audit trail (Admin Activity Report)

CREATE TABLE IF NOT EXISTS public.user_sessions (
  id TEXT PRIMARY KEY,
  flat_no TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'resident',
  login_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  logout_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_activity_events (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES public.user_sessions(id) ON DELETE CASCADE,
  flat_no TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('login', 'logout', 'page_view', 'action')),
  label TEXT NOT NULL,
  path TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_login_at ON public.user_sessions (login_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_flat_no ON public.user_sessions (flat_no);
CREATE INDEX IF NOT EXISTS idx_user_activity_session ON public.user_activity_events (session_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_created ON public.user_activity_events (created_at DESC);

COMMENT ON TABLE public.user_sessions IS 'Login/logout sessions per portal visit';
COMMENT ON TABLE public.user_activity_events IS 'Page views and actions during a session';
