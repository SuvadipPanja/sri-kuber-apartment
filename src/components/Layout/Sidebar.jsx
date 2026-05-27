import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const mainNav = [
  { label: 'Dashboard',           icon: '📊', path: '/dashboard' },
  { label: 'Monthly Collection',  icon: '📅', path: '/monthly-collection' },
  { label: 'My Payments',         icon: '💳', path: '/my-payments' },
  { label: 'Pending Dues',        icon: '⏳', path: '/pending-dues' },
  { label: 'Expenses',            icon: '📉', path: '/expenses' },
  { label: 'Other Income',        icon: '💵', path: '/other-income' },
];
const infoNav = [
  { label: 'Society Info',        icon: '🏠', path: '/society-info' },
  { label: 'Flat Directory',      icon: '👥', path: '/flat-directory' },
  { label: 'My Account',          icon: '👤', path: '/my-account' },
];
const adminReportsNav = [
  { label: 'Printable Statement', icon: '🖨️', path: '/printable-statement' },
  { label: 'WhatsApp Share',      icon: '📱', path: '/whatsapp-share' },
];
const adminNav = [
  { label: 'Admin Panel',         icon: '⚙️', path: '/admin',                  exact: true },
  { label: 'Manage Payments',     icon: '💰', path: '/admin/payments' },
  { label: 'Manage Expenses',     icon: '🧾', path: '/admin/expenses' },
  { label: 'Other Income',        icon: '💵', path: '/admin/income' },
  { label: 'Manage Owners',       icon: '🏡', path: '/admin/owners' },
  { label: 'Society Settings',    icon: '🔧', path: '/admin/settings' },
  { label: 'Reset Password',      icon: '🔐', path: '/admin/reset-password' },
];

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }) {
  const { isSuperAdmin } = useAuth();

  const NavItem = ({ item }) => (
    <NavLink
      to={item.path}
      end={item.exact}
      className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
      onClick={onMobileClose}
      title={collapsed ? item.label : ''}
    >
      <span className="nav-link-icon">{item.icon}</span>
      <span className="nav-link-text">{item.label}</span>
    </NavLink>
  );

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-logo">🏠</div>
        <div className="sidebar-brand-text">
          <div className="sidebar-brand-name">Sri Kuber</div>
          <div className="sidebar-brand-sub">Society Portal</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-title">Main</div>
        {mainNav.map(item => <NavItem key={item.path} item={item} />)}

        <div className="nav-section-title">Info & Reports</div>
        {infoNav.map(item => <NavItem key={item.path} item={item} />)}

        {isSuperAdmin() && (
          <>
            <div className="nav-section-title" style={{ color: 'var(--accent)', opacity: 0.8 }}>
              👑 Super Admin
            </div>
            <hr className="nav-admin-divider" />
            {adminNav.map(item => <NavItem key={item.path} item={item} />)}

            <div className="nav-section-title">Reports & Sharing</div>
            {adminReportsNav.map(item => <NavItem key={item.path} item={item} />)}
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <button className="sidebar-collapse-btn" onClick={onToggle}>
          <span>{collapsed ? '→' : '←'}</span>
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
