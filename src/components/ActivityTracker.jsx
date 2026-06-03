import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logPageView } from '../services/activityLog';
import { getPageLabel } from '../utils/routeLabels';

/**
 * Tracks page views for the current logged-in session.
 */
export default function ActivityTracker() {
  const { user } = useAuth();
  const location = useLocation();
  const lastPathRef = useRef('');

  useEffect(() => {
    if (!user?.activitySessionId) return;
    const path = location.pathname;
    if (path === '/login' || path === lastPathRef.current) return;

    lastPathRef.current = path;
    const label = getPageLabel(path);
    logPageView(user.activitySessionId, user, path, label);
  }, [location.pathname, user]);

  return null;
}
