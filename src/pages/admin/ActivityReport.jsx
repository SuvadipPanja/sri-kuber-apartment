import { useState, useEffect, useCallback, Fragment } from 'react';
import { supabase } from '../../services/supabase';
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
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [flatFilter, setFlatFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [eventsBySession, setEventsBySession] = useState({});
  const [loadingEvents, setLoadingEvents] = useState(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
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
    } catch (err) {
      console.error(err);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [flatFilter, dateFrom, dateTo]);

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
    } finally {
      setLoadingEvents(null);
    }
  };

  return (
    <PageShell
      icon="eye"
      title="Activity Report"
      subtitle="Login sessions, page views, and user actions — admin only"
      actions={
        <button type="button" className="btn btn-ghost" onClick={fetchSessions}>
          <Icon name="refresh" size={16} /> Refresh
        </button>
      }
    >
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
          <button type="button" className="btn btn-primary" onClick={fetchSessions}>
            <Icon name="filter" size={16} /> Apply
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-center" style={{ padding: '3rem' }}>
          <div className="spinner" style={{ width: 40, height: 40 }} />
        </div>
      ) : sessions.length === 0 ? (
        <div className="card text-center text-muted-c" style={{ padding: '2.5rem' }}>
          <Icon name="info" size={32} style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
          <p>No activity sessions found. Run the Supabase migration and log in again to start recording.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Flat</th>
                <th>Name</th>
                <th>Role</th>
                <th>Login</th>
                <th>Logout</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <Fragment key={s.id}>
                  <tr>
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
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => loadEvents(s.id)}
                        disabled={loadingEvents === s.id}
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
                    </td>
                  </tr>
                  {expandedId === s.id && eventsBySession[s.id] && (
                    <tr key={`${s.id}-events`}>
                      <td colSpan={8} style={{ background: 'var(--bg-subtle)', padding: '1rem' }}>
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
