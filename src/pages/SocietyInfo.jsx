import { useConfig } from '../hooks/useSupabase';

export default function SocietyInfo() {
  const { config, loading } = useConfig();

  if (loading) return <div className="flex-center" style={{ height: '60vh' }}><div className="spinner" style={{ width: 40, height: 40 }} /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>🏠 Society Info</h1>
          <p className="page-subtitle">About Sri Kuber Apartment</p>
        </div>
      </div>

      {/* Society Photo */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: 0, overflow: 'hidden' }}>
        <div style={{ position: 'relative' }}>
          <img
            src={config?.society_photo_url || '/society.png'}
            alt="Sri Kuber Apartment Building"
            style={{
              width: '100%',
              height: '340px',
              objectFit: 'cover',
              display: 'block',
            }}
            onError={e => { e.target.src = '/society.png'; }}
          />
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: '2rem 2rem 1.5rem',
            background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
          }}>
            <h2 style={{ color: 'white', fontSize: '1.8rem', marginBottom: '0.25rem' }}>
              {config?.society_name || 'Sri Kuber Apartment'}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.9rem' }}>
              📍 {config?.address}, {config?.city}, {config?.state}
            </p>
          </div>
        </div>
      </div>

      {/* Details */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        <div className="card">
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>📋 Society Details</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {[
                ['🏠 Society Name', config?.society_name],
                ['📍 Address', config?.address],
                ['🏙️ City', `${config?.city}, ${config?.state}`],
                ['🏗️ Total Flats', config?.total_flats],
                ['💰 Monthly Charge', `₹${config?.monthly_charge}`],
                ['📅 Current Month', `${config?.current_month} ${config?.current_year}`],
              ].map(([label, val]) => (
                <tr key={label} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '0.7rem 0', color: 'var(--text-muted)', fontSize: '0.85rem', width: '45%' }}>{label}</td>
                  <td style={{ padding: '0.7rem 0', fontWeight: 500 }}>{val || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>📢 Announcement</h3>
          <div style={{
            background: 'rgba(108, 99, 255, 0.08)',
            border: '1px solid rgba(108, 99, 255, 0.2)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            color: 'var(--text-primary)',
            lineHeight: 1.7,
          }}>
            {config?.announcement || 'No announcements at this time.'}
          </div>

          {(config?.contact_phone || config?.contact_email) && (
            <div style={{ marginTop: '1.25rem' }}>
              <div className="section-title" style={{ fontSize: '0.75rem' }}>Contact</div>
              {config.contact_phone && (
                <p style={{ marginBottom: '0.5rem' }}>
                  📞 <a href={`tel:${config.contact_phone}`}>{config.contact_phone}</a>
                </p>
              )}
              {config.contact_email && (
                <p>
                  📧 <a href={`mailto:${config.contact_email}`}>{config.contact_email}</a>
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
