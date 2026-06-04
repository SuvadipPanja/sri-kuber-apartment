import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logPageView } from '../services/activityLog';
import { getPageLabel } from '../utils/routeLabels';

/**
 * Tracks page views for the current logged-in session (every route change).
 */
export default function ActivityTracker() {
  const { user } = useAuth();
  const location = useLocation();
  const lastNavKeyRef = useRef(null);
  const sessionIdRef = useRef(null);

  useEffect(() => {
    const sessionId = user?.activitySessionId;
    if (!sessionId || !user?.flatNo) return;

    if (sessionIdRef.current !== sessionId) {
      sessionIdRef.current = sessionId;
      lastNavKeyRef.current = null;
    }

    const path = location.pathname;
    if (path === '/login' || path.startsWith('/login')) return;

    const navKey = `${sessionId}:${location.key}:${path}`;
    if (navKey === lastNavKeyRef.current) return;
    lastNavKeyRef.current = navKey;

    const label = getPageLabel(path);
    logPageView(sessionId, user, path, label);
  }, [location.key, location.pathname, user?.activitySessionId, user?.flatNo, user?.ownerName]);
}
