import { useSupabaseTable } from '../hooks/useSupabase';
import { useAuth } from '../context/AuthContext';
import { getInitials } from '../utils/formatters';
import Icon from '../components/Icon';
import PageShell from '../components/ui/PageShell';

export default function FlatDirectory() {
  const { isSuperAdmin } = useAuth();
  const { data: rawOwners, loading } = useSupabaseTable('owners', q => q.order('flat_no'));
  const activeOwners = rawOwners.filter(o => o.active);
  const inactiveOwners = rawOwners.filter(o => !o.active);

  const OwnerCard = ({ owner }) => (
    <div className="card" style={{ padding: '1.25rem' }}>
      <div className="flex gap-2 items-center">
        {owner.photo_url ? (
          <img
            src={owner.photo_url}
            alt={owner.owner_name}
            className="rounded-full"
            style={{ width: 56, height: 56, objectFit: 'cover', border: '2px solid var(--border)', flexShrink: 0 }}
            onError={e => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div
            className="rounded-full flex-center fw-bold"
            style={{ width: 56, height: 56, background: 'var(--grad-primary)', color: 'white', fontSize: '1rem', flexShrink: 0 }}
          >
            {getInitials(owner.owner_name)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="fw-bold text-white text-base truncate mb-1">{owner.owner_name}</div>
          <div className="flex items-center gap-1 flex-wrap">
            <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>Flat {owner.flat_no}</span>
            {isSuperAdmin() && (
              <span className="badge badge-accent" style={{ fontSize: '0.65rem' }}>₹{owner.monthly_charge}/mo</span>
            )}
            {owner.notes && <span className="badge badge-gold" style={{ fontSize: '0.65rem' }}>{owner.notes}</span>}
          </div>
        </div>
      </div>
      <div className="mt-2" style={{ paddingLeft: '0.25rem' }}>
        {owner.phone && (
          <div className="flex items-center gap-1 text-sm text-secondary-c mb-1">
            <Icon name="phone" size={13} />
            <a href={`tel:${owner.phone}`} style={{ color: 'var(--text-secondary)' }}>{owner.phone}</a>
          </div>
        )}
        {owner.email && (
          <div className="flex items-center gap-1 text-sm text-secondary-c">
            <Icon name="mail" size={13} />
            <a href={`mailto:${owner.email}`} className="truncate" style={{ color: 'var(--text-secondary)' }}>{owner.email}</a>
          </div>
        )}
        {!owner.phone && !owner.email && (
          <div className="text-xs text-muted-c mt-1">Contact details not added</div>
        )}
      </div>
    </div>
  );

  if (loading) return <div className="loading-screen"><div className="loading-logo">SK</div><div className="spinner lg"></div></div>;

  return (
    <PageShell
      icon="users"
      title="Flat Directory"
      subtitle="All residents of Sri Kuber Apartment"
      actions={
        <>
          <span className="badge badge-success">{activeOwners.length} Active</span>
          <span className="badge badge-muted">{inactiveOwners.length} Vacant</span>
        </>
      }
    >
      <div className="section-divider">Active Residents</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }} className="mb-3">
        {activeOwners.map(o => <OwnerCard key={o.flat_no} owner={o} />)}
      </div>

      {inactiveOwners.length > 0 && (
        <>
          <div className="section-divider">Vacant / Inactive Flats</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
            {inactiveOwners.map(o => (
              <div key={o.flat_no} className="card flex items-center gap-2" style={{ padding: '1rem', opacity: 0.5 }}>
                <div
                  className="rounded-full flex-center"
                  style={{ width: 44, height: 44, border: '1px dashed var(--text-muted)', color: 'var(--text-muted)' }}
                >
                  <Icon name="home" size={18} />
                </div>
                <div>
                  <div className="fw-semi text-base mb-1">Flat {o.flat_no}</div>
                  <span className="badge badge-muted">Vacant</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </PageShell>
  );
}
