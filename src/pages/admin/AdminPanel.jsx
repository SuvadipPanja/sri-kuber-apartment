import { Link } from 'react-router-dom';

const adminCards = [
  { title: 'Manage Payments',  icon: '💰', desc: 'Add, edit, or delete maintenance payment records', path: '/admin/payments',  color: 'green' },
  { title: 'Manage Expenses',  icon: '🧾', desc: 'Add, edit, or delete society expense entries',    path: '/admin/expenses',  color: 'red' },
  { title: 'Manage Income',    icon: '💵', desc: 'Add, edit, or delete other society income sources',path: '/admin/income',    color: 'accent' },
  { title: 'Manage Owners',    icon: '🏡', desc: 'Update flat owner details, phone, email, photo',  path: '/admin/owners',    color: 'blue' },
  { title: 'Society Settings', icon: '🔧', desc: 'Update society info, announcement, carry forward', path: '/admin/settings',  color: 'gold' },
  { title: 'Reset Password',   icon: '🔐', desc: 'Reset password for any flat owner',              path: '/admin/reset-password', color: 'info' },
];

export default function AdminPanel() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1>⚙️ Admin Panel</h1>
          <p className="page-subtitle">Super Admin — Full system control</p>
        </div>
        <span className="badge badge-admin">👑 Super Admin</span>
      </div>

      <div className="alert alert-warning shadow-primary">
        <span className="alert-icon">⚠️</span>
        <div>You are logged in as <strong>Super Admin (Flat 301)</strong>. Changes made here are saved to the database and visible to all users immediately.</div>
      </div>

      <div className="grid-3 mt-3">
        {adminCards.map(card => (
          <Link key={card.path} to={card.path} style={{ textDecoration: 'none' }}>
            <div className={`kpi-card kpi-${card.color} card-interactive h-full`} style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem' }}>
              <div className="kpi-icon mb-2" style={{ width: 48, height: 48, fontSize: '1.4rem' }}>
                {card.icon}
              </div>
              <div>
                <div className="text-white fw-bold text-base mb-1">{card.title}</div>
                <div className="text-sm text-secondary-c leading-relaxed">{card.desc}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
