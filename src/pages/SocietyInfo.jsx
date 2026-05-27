import { useState } from 'react';
import { useConfig } from '../hooks/useSupabase';

export default function SocietyInfo() {
  const { config, loading } = useConfig();
  const [lightbox, setLightbox] = useState(null);

  if (loading) return <div className="loading-screen"><div className="loading-logo">SK</div><div className="spinner lg"></div></div>;

  const photos = [
    { src: '/society_real.jpg', caption: 'Sri Kuber Apartment (Google Maps View)' },
    { src: config?.society_photo_url || '/society.png', caption: 'Front Elevation' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>🏠 Society Info</h1>
          <p className="page-subtitle">About Sri Kuber Apartment</p>
        </div>
      </div>

      <div className="grid-2 mb-3">
        {photos.map((photo, i) => (
          <div key={i} className="gallery-item" style={{ height: '300px', borderRadius: 'var(--r-xl)' }} onClick={() => setLightbox(photo.src)}>
            <img src={photo.src} alt={photo.caption} onError={e => { e.target.style.display = 'none'; }} />
            <div className="gallery-item-overlay">
              <span className="gallery-caption">{photo.caption}</span>
            </div>
          </div>
        ))}
      </div>

      {lightbox && (
        <div className="lightbox-overlay" onClick={() => setLightbox(null)}>
          <button className="lightbox-close" onClick={() => setLightbox(null)}>✕</button>
          <img src={lightbox} className="lightbox-img" alt="Enlarged view" onClick={e => e.stopPropagation()} />
        </div>
      )}

      <div className="grid-2">
        <div className="card">
          <h3 className="text-base mb-2">📋 Society Details</h3>
          <table className="w-full" style={{ borderCollapse: 'collapse' }}>
            <tbody>
              {[
                ['🏠 Name', config?.society_name],
                ['📍 Address', config?.address],
                ['🏙️ City', `${config?.city}, ${config?.state}`],
                ['🏗️ Total Flats', config?.total_flats],
                ['💰 Monthly Charge', `₹${config?.monthly_charge}`],
                ['📅 Current Month', `${config?.current_month} ${config?.current_year}`],
              ].map(([label, val]) => (
                <tr key={label} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td className="text-muted-c py-2 text-sm w-1/2">{label}</td>
                  <td className="py-2 fw-medium">{val || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3 className="text-base mb-2">📢 Announcement</h3>
          <div className="alert alert-info" style={{ marginBottom: 0 }}>
            {config?.announcement || 'No announcements at this time.'}
          </div>

          {(config?.contact_phone || config?.contact_email) && (
            <div className="mt-3 border-top">
              <div className="text-xs fw-bold text-muted-c uppercase mb-1 tracking-wider">Contact Details</div>
              {config.contact_phone && (
                <div className="mb-1 flex items-center gap-1">
                  📞 <a href={`tel:${config.contact_phone}`} className="text-accent-c fw-medium">{config.contact_phone}</a>
                </div>
              )}
              {config.contact_email && (
                <div className="flex items-center gap-1">
                  📧 <a href={`mailto:${config.contact_email}`} className="text-accent-c fw-medium">{config.contact_email}</a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
