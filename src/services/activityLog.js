import { supabase } from './supabase';
import { generateId } from '../utils/formatters';

function baseEvent(sessionId, user, eventType, label, path = null, details = {}) {
  return {
    id: generateId('ACT'),
    session_id: sessionId,
    flat_no: user.flatNo,
    owner_name: user.ownerName,
    event_type: eventType,
    label,
    path,
    details,
    created_at: new Date().toISOString(),
  };
}

/** Start a session on successful login. Returns session id. */
export async function startUserSession(user) {
  const sessionId = generateId('SES');
  const now = new Date().toISOString();

  try {
    const { error: sessionError } = await supabase.from('user_sessions').insert({
      id: sessionId,
      flat_no: user.flatNo,
      owner_name: user.ownerName,
      role: user.role || 'resident',
      login_at: now,
    });
    if (sessionError) throw sessionError;

    const { error: eventError } = await supabase.from('user_activity_events').insert(
      baseEvent(sessionId, user, 'login', 'Logged in', '/login', { role: user.role })
    );
    if (eventError) throw eventError;
  } catch (err) {
    console.warn('Activity log: could not start session', err.message);
  }

  return sessionId;
}

/** End session on logout. */
export async function endUserSession(sessionId, user) {
  if (!sessionId || !user?.flatNo) return;

  const now = new Date().toISOString();
  try {
    await supabase.from('user_sessions').update({ logout_at: now }).eq('id', sessionId);
    await supabase.from('user_activity_events').insert(
      baseEvent(sessionId, user, 'logout', 'Logged out', null, {})
    );
  } catch (err) {
    console.warn('Activity log: could not end session', err.message);
  }
}

/** Log a page view (dedupe handled by caller). */
export async function logPageView(sessionId, user, path, label) {
  if (!sessionId || !user?.flatNo || !path) return;

  try {
    await supabase.from('user_activity_events').insert(
      baseEvent(sessionId, user, 'page_view', `Viewed: ${label}`, path, {})
    );
  } catch (err) {
    console.warn('Activity log: page view failed', err.message);
  }
}

/** Log a user action (button click, save, print, etc.). */
export async function logUserAction(sessionId, user, label, details = {}, path = null) {
  if (!sessionId || !user?.flatNo) return;

  try {
    await supabase.from('user_activity_events').insert(
      baseEvent(sessionId, user, 'action', label, path, details)
    );
  } catch (err) {
    console.warn('Activity log: action failed', err.message);
  }
}
