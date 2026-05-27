import { useSupabaseTable } from '../hooks/useSupabase';
import { getInitials } from '../utils/formatters';

export default function FlatDirectory() {
  const { data: rawOwners, loading } = useSupabaseTable('owners', q => q.order('flat_no'));
  const activeOwners = rawOwners.filter(o => o.active);
  const inactiveOwners = rawOwners.filter(o => !o.active);

  const OwnerCard = ({ owner }) => (
    <div className="card" style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
      <div style={{ flexShrink: 0 }}>
        {owner.photo_url ? (
          <img
            src={owner.photo_url}
            alt={owner.owner_name}
            style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }}
          />
        ) : (
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.4rem', fontWeight: 700, color: 'white', flexShrink: 0,
          }}>
            {getInitials(owner.owner_name)}
          </div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
          <strong style={{ color: 'var(--text-white)', fontSize: '1rem' }}>{owner.owner_name}</strong>
          {owner.notes && <span className="badge badge-accent" style={{ fontSize: '0.7rem' }}>{owner.notes}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span className="badge badge-info">Flat {owner.flat_no}</span>
          <span className="badge badge-success">₹{owner.monthly_charge}/month</span>
        </div>
        {owner.phone && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
            <span>📞</span>
            <a href={`tel:${owner.phone}`} style={{ color: 'var(--accent)' }}>{owner.phone}</a>
          </div>
        )}
        {owner.email && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            <span>📧</span>
            <a href={`mailto:${owner.email}`} style={{ color: 'var(--accent)' }}>{owner.email}</a>
          </div>
        )}
        {!owner.phone && !owner.email && (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Contact details not added yet</div>
        )}
      </div>
    </div>
  );

  if (loading) return <div className="flex-center" style={{ height: '60vh' }}><div className="spinner" style={{ width: 40, height: 40 }} /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>👥 Flat Directory</h1>
          <p className="page-subtitle">All residents of Sri Kuber Apartment</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <span className="badge badge-success">✅ {activeOwners.length} Active</span>
          <span className="badge badge-muted">🔕 {inactiveOwners.length} Inactive</span>
        </div>
      </div>

      {/* Active Residents */}
      <div className="section-title">Active Residents</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {activeOwners.map(o => <OwnerCard key={o.flat_no} owner={o} />)}
      </div>

      {/* Inactive / Vacant */}
      {inactiveOwners.length > 0 && (
        <>
          <div className="section-title">Vacant / Inactive Flats</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {inactiveOwners.map(o => (
              <div key={o.flat_no} className="card" style={{ opacity: 0.55 }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%', background: 'var(--bg-elevated)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem',
                  }}>🏚️</div>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: '0.3rem' }}>Flat {o.flat_no}</div>
                    <span className="badge badge-muted">Vacant / Inactive</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
