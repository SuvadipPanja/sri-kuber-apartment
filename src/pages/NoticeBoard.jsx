import { useSupabaseTable } from '../hooks/useSupabase';
import { formatDate } from '../utils/formatters';
import Icon from '../components/Icon';
import PageShell from '../components/ui/PageShell';
import EmptyState from '../components/ui/EmptyState';

const PRIORITY_STYLES = {
  urgent:    { badge: 'badge-danger', bg: 'rgba(255,71,87,0.06)', border: 'var(--danger)' },
  important: { badge: 'badge-warning', bg: 'rgba(255,193,7,0.06)', border: 'var(--warning)' },
  normal:    { badge: 'badge-info', bg: 'rgba(84,160,255,0.04)', border: 'var(--border-subtle)' },
};

export default function NoticeBoard() {
  const { data: notices, loading } = useSupabaseTable('notices', q => q.order('created_at', { ascending: false }));

  // Filter out expired notices
  const now = new Date();
  const activeNotices = notices.filter(n => !n.expires_at || new Date(n.expires_at) > now);

  if (loading) return <div className="loading-screen"><div className="spinner lg"></div></div>;

  return (
    <PageShell
      icon="megaphone"
      title="Notice Board"
      subtitle="Society announcements and important updates"
      actions={<span className="badge badge-primary">{activeNotices.length} active</span>}
    >
      {activeNotices.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="megaphone"
            title="No Notices"
            description="There are no active notices at this time. Check back later!"
          />
        </div>
      ) : (
        <div className="flex-col gap-2">
          {activeNotices.map(notice => {
            const style = PRIORITY_STYLES[notice.priority] || PRIORITY_STYLES.normal;
            return (
              <div
                key={notice.id}
                className="card slide-up"
                style={{ borderLeft: `3px solid ${style.border}`, background: style.bg }}
              >
                <div className="flex-between mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base m-0 text-white">{notice.title}</h3>
                    <span className={`badge ${style.badge}`}>{notice.priority}</span>
                  </div>
                  <span className="text-xs text-muted-c">{formatDate(notice.created_at)}</span>
                </div>
                <p className="text-sm text-secondary-c mb-1" style={{ lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {notice.content}
                </p>
                {notice.expires_at && (
                  <div className="text-xs text-muted-c mt-2">
                    <Icon name="clock" size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                    Expires: {formatDate(notice.expires_at)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
