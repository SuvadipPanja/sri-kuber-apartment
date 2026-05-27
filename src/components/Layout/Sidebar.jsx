import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { label: 'Dashboard',         icon: '📊', path: '/dashboard' },
  { label: 'My Payments',       icon: '💳', path: '/my-payments' },
  { label: 'Pending Dues',      icon: '⏳', path: '/pending-dues' },
  { label: 'Expenses',          icon: '📉', path: '/expenses' },
  { label: 'Printable Statement', icon: '🖨️', path: '/printable-statement' },
  { label: 'WhatsApp Share',    icon: '📱', path: '/whatsapp-share' },
];

const infoItems = [
  { label: 'Society Info',      icon: '🏠', path: '/society-info' },
  { label: 'Flat Directory',    icon: '👥', path: '/flat-directory' },
  { label: 'Change Password',   icon: '🔑', path: '/change-password' },
];

const adminItems = [
  { label: 'Admin Panel',       icon: '⚙️', path: '/admin' },
  { label: 'Manage Payments',   icon: '💰', path: '/admin/payments' },
  { label: 'Manage Expenses',   icon: '🧾', path: '/admin/expenses' },
  { label: 'Manage Owners',     icon: '🏡', path: '/admin/owners' },
  { label: 'Society Settings',  icon: '🔧', path: '/admin/settings' },
  { label: 'Reset Password',    icon: '🔐', path: '/admin/reset-password' },
];

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }) {
  const { isSuperAdmin } = useAuth();

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🏠</div>
        <div className="sidebar-logo-text">
          <div className="sidebar-logo-title">Sri Kuber</div>
          <div className="sidebar-logo-sub">Apartment Portal</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Main</div>
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onMobileClose}
            title={collapsed ? item.label : ''}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}

        <div className="sidebar-section-label">Info</div>
        {infoItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onMobileClose}
            title={collapsed ? item.label : ''}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}

        {isSuperAdmin() && (
          <>
            <div className="sidebar-section-label">Admin</div>
            {adminItems.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/admin'}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={onMobileClose}
                title={collapsed ? item.label : ''}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </NavLink>
            ))}
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <button className="sidebar-toggle" onClick={onToggle}>
          {collapsed ? '→' : '← Collapse'}
        </button>
      </div>
    </aside>
  );
}
