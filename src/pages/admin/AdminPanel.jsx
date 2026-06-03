import PageShell from '../../components/ui/PageShell';
import AdminHubCard from '../../components/ui/AdminHubCard';
import Icon from '../../components/Icon';

const adminCards = [
  { title: 'Manage Payments', icon: 'money', desc: 'Add, edit, or delete maintenance payment records', path: '/admin/payments', color: 'green' },
  { title: 'Manage Expenses', icon: 'expense', desc: 'Add, edit, or delete society expense entries', path: '/admin/expenses', color: 'red' },
  { title: 'Manage Income', icon: 'income', desc: 'Track other society income sources', path: '/admin/income', color: 'accent' },
  { title: 'Manage Owners', icon: 'home', desc: 'Update flat owner details, phone, email, photo', path: '/admin/owners', color: 'blue' },
  { title: 'Manage Notices', icon: 'notice', desc: 'Publish and manage society notices', path: '/admin/notices', color: 'gold' },
  { title: 'Manage Complaints', icon: 'complaint', desc: 'Review and resolve resident complaints', path: '/admin/complaints', color: 'red' },
  { title: 'Manage Contacts', icon: 'headphone', desc: 'Emergency and service contact directory', path: '/admin/contacts', color: 'accent' },
  { title: 'Society Settings', icon: 'settings', desc: 'Society info, gallery photos, announcement, carry forward', path: '/admin/settings', color: 'gold' },
  { title: 'Activity Report', icon: 'eye', desc: 'User login, logout, pages visited, and actions', path: '/admin/activity-report', color: 'info' },
  { title: 'Reset Password', icon: 'lock', desc: 'Reset password for any flat owner', path: '/admin/reset-password', color: 'info' },
];

export default function AdminPanel() {
  return (
    <PageShell
      icon="shield"
      title="Admin Panel"
      subtitle="Super Admin — Full system control for Sri Kuber Apartment"
      actions={
        <span className="badge badge-admin" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
          <Icon name="crown" size={12} /> Super Admin
        </span>
      }
    >
      <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
        <span className="alert-icon"><Icon name="info" size={18} /></span>
        <div>
          You are logged in as <strong>Super Admin (Flat 301)</strong>. Changes sync to the database
          and are visible to all residents immediately.
        </div>
      </div>

      <div className="admin-hub-grid">
        {adminCards.map(card => (
          <AdminHubCard key={card.path} {...card} />
        ))}
      </div>
    </PageShell>
  );
}
