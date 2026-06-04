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

/** Start a session on successful login. */
export async function startUserSession(user) {
  const sessionId = generateId('SES');
  const now = new Date().toISOString();
  const row = {
    flat_no: String(user.flatNo),
    owner_name: user.ownerName || `Flat ${user.flatNo}`,
    role: user.role || 'resident',
  };

  try {
    await closeOpenSessionsForFlat(row.flat_no);

    const { error: sessionError } = await supabase.from('user_sessions').insert({
      id: sessionId,
      ...row,
      login_at: now,
    });
    if (sessionError) throw sessionError;

    const { error: eventError } = await supabase.from('user_activity_events').insert(
      baseEvent(sessionId, user, 'login', 'Logged in', '/login', { role: row.role })
    );
    if (eventError) throw eventError;

    return { sessionId, ok: true };
  } catch (err) {
    console.error('Activity log: could not start session', err);
    return { sessionId, ok: false, error: err.message || 'Unknown error' };
  }
}

/** Quick check for admin diagnostics (tables + RLS). */
export async function checkActivityTablesReady() {
  const { error } = await supabase.from('user_sessions').select('id').limit(1);
  if (!error) return { ok: true };
  const msg = error.message || '';
  if (msg.includes('schema cache') || msg.includes('does not exist')) {
    return { ok: false, reason: 'tables', message: msg };
  }
  if (msg.includes('policy') || msg.includes('permission') || msg.includes('RLS')) {
    return { ok: false, reason: 'rls', message: msg };
  }
  return { ok: false, reason: 'other', message: msg };
}

/** Close any sessions for this flat still marked active (orphans from failed logout / refresh). */
export async function closeOpenSessionsForFlat(flatNo, exceptSessionId = null) {
  if (!flatNo) return;
  const now = new Date().toISOString();
  let q = supabase
    .from('user_sessions')
    .update({ logout_at: now })
    .eq('flat_no', String(flatNo))
    .is('logout_at', null);
  if (exceptSessionId) q = q.neq('id', exceptSessionId);
  const { error } = await q;
  if (error) console.warn('Activity log: close open sessions', error.message);
}

/** End session on logout or tab close. */
export async function endUserSession(sessionId, user) {
  if (!sessionId || !user?.flatNo) return { ok: false };

  const now = new Date().toISOString();
  try {
    const { data: updated, error: sessionError } = await supabase
      .from('user_sessions')
      .update({ logout_at: now })
      .eq('id', sessionId)
      .select('id');
    if (sessionError) throw sessionError;
    if (!updated?.length) {
      console.warn('Activity log: session not found for logout', sessionId);
    }

    const { error: eventError } = await supabase.from('user_activity_events').insert(
      baseEvent(sessionId, user, 'logout', 'Logged out', '/login', { ended_at: now })
    );
    if (eventError) throw eventError;

    return { ok: true, logoutAt: now };
  } catch (err) {
    console.warn('Activity log: could not end session', err.message);
    return { ok: false, error: err.message };
  }
}

/** Best-effort session end when the tab closes (fetch keepalive). */
export function endUserSessionKeepalive(sessionId) {
  if (!sessionId) return;
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return;

  const now = new Date().toISOString();
  fetch(`${url}/rest/v1/user_sessions?id=eq.${encodeURIComponent(sessionId)}`, {
    method: 'PATCH',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ logout_at: now }),
    keepalive: true,
  }).catch(() => {});
}

/** Log a page view. */
export async function logPageView(sessionId, user, path, label) {
  if (!sessionId || !user?.flatNo || !path) return { ok: false };

  try {
    const { error } = await supabase.from('user_activity_events').insert(
      baseEvent(sessionId, user, 'page_view', `Viewed: ${label}`, path, {})
    );
    if (error) throw error;
    return { ok: true };
  } catch (err) {
    console.warn('Activity log: page view failed', path, err.message);
    return { ok: false, error: err.message };
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

/**
 * Delete one session (activity events removed via ON DELETE CASCADE).
 */
export async function deleteActivitySession(sessionId) {
  const { error } = await supabase.from('user_sessions').delete().eq('id', sessionId);
  if (error) throw error;
}

/** Delete multiple sessions by id. */
export async function deleteActivitySessions(sessionIds) {
  if (!sessionIds?.length) return;
  const { error } = await supabase.from('user_sessions').delete().in('id', sessionIds);
  if (error) throw error;
}

/**
 * Delete sessions matching filters. Requires at least one filter so we never wipe the whole table by mistake.
 */
export async function deleteFilteredActivitySessions({ flatNo, dateFrom, dateTo } = {}) {
  const hasFilter = !!(flatNo?.trim() || dateFrom || dateTo);
  if (!hasFilter) {
    throw new Error('Set a flat number or date filter before deleting by filter.');
  }

  let q = supabase.from('user_sessions').delete();
  if (flatNo?.trim()) q = q.eq('flat_no', flatNo.trim());
  if (dateFrom) q = q.gte('login_at', `${dateFrom}T00:00:00`);
  if (dateTo) q = q.lte('login_at', `${dateTo}T23:59:59`);
  const { error } = await q;
  if (error) throw error;
}

/** Delete sessions with login before the given ISO timestamp. */
export async function deleteActivitySessionsBefore(isoDateTime) {
  const { error } = await supabase.from('user_sessions').delete().lt('login_at', isoDateTime);
  if (error) throw error;
}

/** Delete every session (frees Supabase storage on free tier). */
export async function deleteAllActivitySessions() {
  const { error } = await supabase.from('user_sessions').delete().gte('login_at', '1970-01-01T00:00:00');
  if (error) throw error;
}
