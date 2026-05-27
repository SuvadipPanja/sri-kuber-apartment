import { Link } from 'react-router-dom';

const adminCards = [
  { title: 'Manage Payments',  icon: '💰', desc: 'Add, edit, or delete maintenance payment records', path: '/admin/payments',  color: 'green' },
  { title: 'Manage Expenses',  icon: '🧾', desc: 'Add, edit, or delete society expense entries',    path: '/admin/expenses',  color: 'red' },
  { title: 'Manage Owners',    icon: '🏡', desc: 'Update flat owner details, phone, email, photo',  path: '/admin/owners',    color: 'blue' },
  { title: 'Society Settings', icon: '🔧', desc: 'Update society info, announcement, carry forward', path: '/admin/settings',  color: 'gold' },
  { title: 'Reset Password',   icon: '🔐', desc: 'Reset password for any flat owner',              path: '/admin/reset-password', color: 'accent' },
];

export default function AdminPanel() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1>⚙️ Admin Panel</h1>
          <p className="page-subtitle">Super Admin — Full system control</p>
        </div>
        <span className="badge badge-danger">👑 Super Admin</span>
      </div>

      <div className="alert alert-warning" style={{ marginBottom: '1.5rem' }}>
        ⚠️ You are logged in as <strong>Super Admin (Flat 301)</strong>. Changes made here are saved to the database and visible to all users immediately.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
        {adminCards.map(card => (
          <Link key={card.path} to={card.path} style={{ textDecoration: 'none' }}>
            <div className={`stat-card ${card.color}`} style={{ padding: '1.5rem', height: '100%', cursor: 'pointer' }}>
              <div className="stat-icon" style={{ width: 48, height: 48, fontSize: '1.4rem' }}>
                {card.icon}
              </div>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-white)', marginBottom: '0.3rem' }}>{card.title}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{card.desc}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
