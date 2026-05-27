import { useSupabaseTable } from '../hooks/useSupabase';
import { useAuth } from '../context/AuthContext';
import { getInitials } from '../utils/formatters';

export default function FlatDirectory() {
  const { isSuperAdmin } = useAuth();
  const { data: rawOwners, loading } = useSupabaseTable('owners', q => q.order('flat_no'));
  const activeOwners = rawOwners.filter(o => o.active);
  const inactiveOwners = rawOwners.filter(o => !o.active);

  const OwnerCard = ({ owner }) => (
    <div className="card card-glass flex gap-2 items-center p-3 relative overflow-hidden h-full">
      <div className="relative flex-shrink-0 z-10">
        {owner.photo_url ? (
          <img
            src={owner.photo_url}
            alt={owner.owner_name}
            className="rounded-full shadow-md"
            style={{ width: 72, height: 72, objectFit: 'cover', border: '2px solid var(--border-bright)' }}
            onError={e => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div 
            className="rounded-full shadow-primary flex-center text-white fw-bold text-xl"
            style={{ width: 72, height: 72, background: 'var(--grad-primary)', border: '2px solid var(--border-bright)' }}
          >
            {getInitials(owner.owner_name)}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 z-10">
        <div className="flex items-center gap-1 mb-1">
          <strong className="text-white text-base truncate">{owner.owner_name}</strong>
          {owner.notes && <span className="badge badge-accent ml-1" style={{ fontSize: '0.65rem' }}>{owner.notes}</span>}
        </div>
        <div className="flex items-center gap-1 mb-2 flex-wrap">
          <span className="badge badge-info">Flat {owner.flat_no}</span>
          {isSuperAdmin() && (
            <span className="badge badge-success">₹{owner.monthly_charge}/mo</span>
          )}
        </div>
        {owner.phone && (
          <div className="flex items-center gap-1 text-sm text-secondary-c mb-1">
            <span>📞</span>
            <a href={`tel:${owner.phone}`} className="text-accent-c hover-primary truncate">{owner.phone}</a>
          </div>
        )}
        {owner.email && (
          <div className="flex items-center gap-1 text-sm text-secondary-c">
            <span>📧</span>
            <a href={`mailto:${owner.email}`} className="text-accent-c hover-primary truncate">{owner.email}</a>
          </div>
        )}
        {!owner.phone && !owner.email && (
          <div className="text-xs text-muted-c mt-1">Contact details not added</div>
        )}
      </div>
      
      {/* Decorative background flat number */}
      <div 
        className="absolute font-display fw-black text-muted-c select-none" 
        style={{ fontSize: '6rem', right: '-10%', bottom: '-20%', opacity: 0.1, zIndex: 0 }}
      >
        {owner.flat_no}
      </div>
    </div>
  );

  if (loading) return <div className="loading-screen"><div className="loading-logo">SK</div><div className="spinner lg"></div></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>👥 Flat Directory</h1>
          <p className="page-subtitle">All residents of Sri Kuber Apartment</p>
        </div>
        <div className="flex gap-1">
          <span className="badge badge-success">✅ {activeOwners.length} Active</span>
          <span className="badge badge-muted">🔕 {inactiveOwners.length} Vacant</span>
        </div>
      </div>

      <div className="section-divider">Active Residents</div>
      <div className="grid-3 mb-3">
        {activeOwners.map(o => <OwnerCard key={o.flat_no} owner={o} />)}
      </div>

      {inactiveOwners.length > 0 && (
        <>
          <div className="section-divider">Vacant / Inactive Flats</div>
          <div className="grid-3">
            {inactiveOwners.map(o => (
              <div key={o.flat_no} className="card p-3 opacity-50 flex items-center gap-2">
                <div 
                  className="rounded-full flex-center text-xl bg-elevated"
                  style={{ width: 56, height: 56, border: '1px dashed var(--text-muted)' }}
                >🏚️</div>
                <div>
                  <div className="fw-semi text-base mb-1">Flat {o.flat_no}</div>
                  <span className="badge badge-muted">Vacant / Inactive</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
