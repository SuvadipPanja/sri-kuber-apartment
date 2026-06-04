import { useState, useEffect, useCallback, Fragment } from 'react';
import { supabase } from '../../services/supabase';
import {
  deleteActivitySession,
  deleteActivitySessions,
  deleteFilteredActivitySessions,
  deleteActivitySessionsBefore,
  deleteAllActivitySessions,
  checkActivityTablesReady,
} from '../../services/activityLog';
import { useToast } from '../../context/ToastContext';
import Icon from '../../components/Icon';
import PageShell from '../../components/ui/PageShell';
import { formatDateTime } from '../../utils/formatters';

const EVENT_BADGE = {
  login: 'badge-success',
  logout: 'badge-muted',
  page_view: 'badge-info',
  action: 'badge-gold',
};

function sessionDuration(loginAt, logoutAt) {
  if (!loginAt) return '—';
  const start = new Date(loginAt).getTime();
  const end = logoutAt ? new Date(logoutAt).getTime() : Date.now();
  const mins = Math.max(0, Math.round((end - start) / 60000));
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export default function ActivityReport() {
  const { addToast } = useToast();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [flatFilter, setFlatFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [eventsBySession, setEventsBySession] = useState({});
  const [loadingEvents, setLoadingEvents] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [deleting, setDeleting] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [setupIssue, setSetupIssue] = useState(null);

  const runSetupCheck = useCallback(async () => {
    const check = await checkActivityTablesReady();
    setSetupIssue(check.ok ? null : check);
  }, []);

  useEffect(() => {
    runSetupCheck();
  }, [runSetupCheck]);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      let q = supabase
        .from('user_sessions')
        .select('*')
        .order('login_at', { ascending: false })
        .limit(200);

      if (flatFilter.trim()) {
        q = q.eq('flat_no', flatFilter.trim());
      }
      if (dateFrom) {
        q = q.gte('login_at', `${dateFrom}T00:00:00`);
      }
      if (dateTo) {
        q = q.lte('login_at', `${dateTo}T23:59:59`);
      }

      const { data, error } = await q;
      if (error) throw error;
      setSessions(data || []);
      setSelectedIds(new Set());
      await runSetupCheck();
    } catch (err) {
      console.error(err);
      setSessions([]);
      setFetchError(err.message);
      addToast('Could not load activity logs: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [flatFilter, dateFrom, dateTo, runSetupCheck]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const loadEvents = async (sessionId) => {
    if (eventsBySession[sessionId]) {
      setExpandedId(expandedId === sessionId ? null : sessionId);
      return;
    }
    setLoadingEvents(sessionId);
    try {
      const { data, error } = await supabase
        .from('user_activity_events')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setEventsBySession((prev) => ({ ...prev, [sessionId]: data || [] }));
      setExpandedId(sessionId);
    } catch (err) {
      console.error(err);
      addToast('Could not load session details', 'error');
    } finally {
      setLoadingEvents(null);
    }
  };

  const clearLocalSessionState = (removedIds) => {
    const idSet = new Set(removedIds);
    setSessions((prev) => prev.filter((s) => !idSet.has(s.id)));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      removedIds.forEach((id) => next.delete(id));
      return next;
    });
    if (expandedId && idSet.has(expandedId)) setExpandedId(null);
    setEventsBySession((prev) => {
      const next = { ...prev };
      removedIds.forEach((id) => delete next[id]);
      return next;
    });
  };

  const handleDeleteOne = async (session) => {
    if (!confirm(`Delete activity log for Flat ${session.flat_no} (${formatDateTime(session.login_at)})?`)) return;
    setDeleting(true);
    try {
      await deleteActivitySession(session.id);
      clearLocalSessionState([session.id]);
      addToast('Session log deleted.', 'success');
    } catch (err) {
      addToast('Delete failed: ' + err.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteSelected = async () => {
    const ids = [...selectedIds];
    if (!ids.length) {
      addToast('Select at least one session to delete.', 'error');
      return;
    }
    if (!confirm(`Delete ${ids.length} selected session log(s)? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await deleteActivitySessions(ids);
      clearLocalSessionState(ids);
      addToast(`${ids.length} session log(s) deleted.`, 'success');
    } catch (err) {
      addToast('Delete failed: ' + err.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteFiltered = async () => {
    setDeleting(true);
    try {
      if (hasFilters) {
        if (!confirm('Permanently delete all sessions matching your filters (flat/date)? Page views and actions for those sessions will also be removed.')) {
          setDeleting(false);
          return;
        }
        await deleteFilteredActivitySessions({
          flatNo: flatFilter,
          dateFrom,
          dateTo,
        });
        await fetchSessions();
        addToast('Matching activity logs deleted.', 'success');
      } else {
        const ids = sessions.map((s) => s.id);
        if (!ids.length) return;
        if (!confirm(`Delete ${ids.length} session(s) currently shown in this list?`)) {
          setDeleting(false);
          return;
        }
        await deleteActivitySessions(ids);
        clearLocalSessionState(ids);
        addToast(`${ids.length} session log(s) deleted.`, 'success');
      }
    } catch (err) {
      addToast('Delete failed: ' + err.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteOlderThan = async (days) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const iso = cutoff.toISOString();
    if (!confirm(`Delete all sessions older than ${days} days (before ${formatDateTime(iso)})?`)) return;
    setDeleting(true);
    try {
      await deleteActivitySessionsBefore(iso);
      await fetchSessions();
      addToast(`Logs older than ${days} days deleted.`, 'success');
    } catch (err) {
      addToast('Delete failed: ' + err.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAll = async () => {
    const typed = window.prompt(
      'This permanently deletes ALL activity logs in Supabase.\n\nType DELETE (capital letters) to confirm:'
    );
    if (typed !== 'DELETE') {
      if (typed !== null) addToast('Cancelled — you must type DELETE exactly.', 'info');
      return;
    }
    setDeleting(true);
    try {
      await deleteAllActivitySessions();
      setSessions([]);
      setSelectedIds(new Set());
      setEventsBySession({});
      setExpandedId(null);
      addToast('All activity logs cleared.', 'success');
    } catch (err) {
      addToast('Delete failed: ' + err.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === sessions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sessions.map((s) => s.id)));
    }
  };

  const hasFilters = !!(flatFilter.trim() || dateFrom || dateTo);

  return (
    <PageShell
      icon="eye"
      title="Activity Report"
      subtitle="Login sessions, page views, and actions — admin only"
      actions={
        <button type="button" className="btn btn-ghost" onClick={fetchSessions} disabled={deleting}>
          <Icon name="refresh" size={16} /> Refresh
        </button>
      }
    >
      {setupIssue && (
        <div className="alert alert-error mb-3">
          <strong>Activity logging is not working.</strong>
          <p className="text-sm mt-1 mb-1">
            {setupIssue.reason === 'tables'
              ? 'Tables missing — run migration SQL in Supabase (see supabase/migrations/20260603120000_user_activity.sql).'
              : setupIssue.reason === 'rls'
                ? 'Row Level Security is blocking access — run RLS policy SQL (see supabase/migrations/20260604120000_user_activity_rls.sql).'
                : setupIssue.message}
          </p>
          <p className="text-sm text-muted-c mb-0">
            After running SQL: sign out, sign in again, visit 2–3 pages, then click Refresh.
          </p>
        </div>
      )}

      <div className="alert alert-warning mb-3" style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
        <Icon name="warning" size={20} style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <strong>Free Supabase storage:</strong> Delete old logs here to save space. Deleting a session also removes its page views and actions from the database.
        </div>
      </div>

      <div className="card mb-3">
        <h3 className="text-base mb-2">Delete logs</h3>
        <p className="text-sm text-muted-c mb-2">
          Remove login/logout and activity records from Supabase. Deleted data cannot be restored on the free plan.
          Without filters, &quot;Delete all on this page&quot; only removes the rows listed below (max 200).
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={handleDeleteSelected}
            disabled={deleting || selectedIds.size === 0}
          >
            <Icon name="trash" size={14} /> Delete selected ({selectedIds.size})
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={handleDeleteFiltered}
            disabled={deleting || sessions.length === 0}
          >
            <Icon name="trash" size={14} />
            {hasFilters ? 'Delete all matching filters' : 'Delete all on this page'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => handleDeleteOlderThan(30)} disabled={deleting}>
            Delete older than 30 days
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => handleDeleteOlderThan(90)} disabled={deleting}>
            Delete older than 90 days
          </button>
          <button type="button" className="btn btn-ghost text-danger-c" onClick={handleDeleteAll} disabled={deleting}>
            <Icon name="trash" size={14} /> Clear all logs
          </button>
        </div>
      </div>

      <div className="card mb-3">
        <div className="form-row" style={{ alignItems: 'flex-end', marginBottom: 0 }}>
          <div className="form-group" style={{ flex: 1, minWidth: 120 }}>
            <label className="form-label">Flat No</label>
            <input
              type="text"
              className="form-input"
              placeholder="All flats"
              value={flatFilter}
              onChange={(e) => setFlatFilter(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: 140 }}>
            <label className="form-label">From date</label>
            <input
              type="date"
              className="form-input"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: 140 }}>
            <label className="form-label">To date</label>
            <input
              type="date"
              className="form-input"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <button type="button" className="btn btn-primary" onClick={fetchSessions} disabled={deleting}>
            <Icon name="filter" size={16} /> Apply
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-center" style={{ padding: '3rem' }}>
          <div className="spinner" style={{ width: 40, height: 40 }} />
        </div>
      ) : fetchError ? (
        <div className="card text-center text-danger-c" style={{ padding: '2.5rem' }}>
          <Icon name="warning" size={32} style={{ marginBottom: '0.75rem' }} />
          <p className="fw-medium">Could not load logs</p>
          <p className="text-sm mt-1">{fetchError}</p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="card text-center text-muted-c" style={{ padding: '2.5rem' }}>
          <Icon name="info" size={32} style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
          <p>No sessions in the database yet.</p>
          <p className="text-sm mt-1">
            Sign out → sign in again → open Dashboard and 2 other pages → Refresh here.
            {setupIssue ? ' Fix the red setup message above first.' : ''}
          </p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input
                    type="checkbox"
                    checked={sessions.length > 0 && selectedIds.size === sessions.length}
                    onChange={toggleSelectAll}
                    aria-label="Select all"
                  />
                </th>
                <th>Flat</th>
                <th>Name</th>
                <th>Role</th>
                <th>Login</th>
                <th>Logout</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <Fragment key={s.id}>
                  <tr>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(s.id)}
                        onChange={() => toggleSelect(s.id)}
                        aria-label={`Select Flat ${s.flat_no}`}
                      />
                    </td>
                    <td><strong>Flat {s.flat_no}</strong></td>
                    <td>{s.owner_name}</td>
                    <td>
                      <span className={`badge ${s.role === 'superadmin' ? 'badge-admin' : 'badge-muted'}`}>
                        {s.role === 'superadmin' ? 'Admin' : 'Resident'}
                      </span>
                    </td>
                    <td className="text-sm">{formatDateTime(s.login_at)}</td>
                    <td className="text-sm">{s.logout_at ? formatDateTime(s.logout_at) : '—'}</td>
                    <td>{sessionDuration(s.login_at, s.logout_at)}</td>
                    <td>
                      {s.logout_at ? (
                        <span className="badge badge-muted">Ended</span>
                      ) : (
                        <span className="badge badge-success">Active</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => loadEvents(s.id)}
                          disabled={loadingEvents === s.id || deleting}
                        >
                          {loadingEvents === s.id ? (
                            <span className="spinner" style={{ width: 14, height: 14 }} />
                          ) : (
                            <>
                              <Icon name="eye" size={14} />
                              {expandedId === s.id ? 'Hide' : 'View'}
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--danger)' }}
                          onClick={() => handleDeleteOne(s)}
                          disabled={deleting}
                          title="Delete this session"
                        >
                          <Icon name="trash" size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedId === s.id && eventsBySession[s.id] && (
                    <tr>
                      <td colSpan={9} style={{ background: 'var(--bg-subtle)', padding: '1rem' }}>
                        <div className="text-xs fw-bold text-muted-c uppercase mb-2">Session activity</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {eventsBySession[s.id].map((ev) => (
                            <div
                              key={ev.id}
                              className="flex items-center gap-2 flex-wrap"
                              style={{
                                padding: '0.5rem 0.75rem',
                                background: 'var(--bg-card)',
                                borderRadius: 'var(--r-md)',
                                border: '1px solid var(--border-subtle)',
                              }}
                            >
                              <span className={`badge ${EVENT_BADGE[ev.event_type] || 'badge-muted'}`}>
                                {ev.event_type.replace('_', ' ')}
                              </span>
                              <span className="fw-medium">{ev.label}</span>
                              {ev.path && (
                                <span className="text-xs text-muted-c">{ev.path}</span>
                              )}
                              <span className="text-xs text-muted-c ml-auto">
                                {formatDateTime(ev.created_at)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageShell>
  );
}
