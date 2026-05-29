import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Icon from '../Icon';

const mainNav = [
  { label: 'Dashboard',           icon: 'dashboard',  path: '/dashboard' },
  { label: 'Monthly Collection',  icon: 'calendar',   path: '/monthly-collection' },
  { label: 'My Payments',         icon: 'wallet',     path: '/my-payments' },
  { label: 'Pending Dues',        icon: 'clock',      path: '/pending-dues' },
  { label: 'Expenses',            icon: 'expense',    path: '/expenses' },
  { label: 'Other Income',        icon: 'income',     path: '/other-income' },
];
const infoNav = [
  { label: 'Society Info',        icon: 'building',   path: '/society-info' },
  { label: 'Flat Directory',      icon: 'users',      path: '/flat-directory' },
  { label: 'Notice Board',        icon: 'megaphone',  path: '/notice-board' },
  { label: 'Complaints',          icon: 'complaint',   path: '/complaints' },
  { label: 'Important Contacts',  icon: 'headphone',  path: '/important-contacts' },
  { label: 'My Account',          icon: 'user',        path: '/my-account' },
];
const adminReportsNav = [
  { label: 'Statement & Reports', icon: 'printer',    path: '/printable-statement' },
];
const adminNav = [
  { label: 'Admin Panel',         icon: 'shield',     path: '/admin',             exact: true },
  { label: 'Manage Payments',     icon: 'money',      path: '/admin/payments' },
  { label: 'Manage Expenses',     icon: 'receipt',    path: '/admin/expenses' },
  { label: 'Other Income',        icon: 'income',     path: '/admin/income' },
  { label: 'Manage Owners',       icon: 'home',       path: '/admin/owners' },
  { label: 'Manage Notices',      icon: 'notice',     path: '/admin/notices' },
  { label: 'Manage Complaints',   icon: 'complaint',  path: '/admin/complaints' },
  { label: 'Manage Contacts',    icon: 'headphone',  path: '/admin/contacts' },
  { label: 'Society Settings',    icon: 'settings',   path: '/admin/settings' },
  { label: 'Reset Password',      icon: 'lock',       path: '/admin/reset-password' },
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
      <span className="nav-link-icon"><Icon name={item.icon} size={18} /></span>
      <span className="nav-link-text">{item.label}</span>
    </NavLink>
  );

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-brand">
        <div className="sidebar-brand-logo">
          <Icon name="building" size={22} color="white" />
        </div>
        <div className="sidebar-brand-text">
          <div className="sidebar-brand-name">Sri Kuber Apartment</div>
          <div className="sidebar-brand-sub">Society Portal</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-title">Main</div>
        {mainNav.map(item => <NavItem key={item.path} item={item} />)}

        <div className="nav-section-title">Community</div>
        {infoNav.map(item => <NavItem key={item.path} item={item} />)}

        {isSuperAdmin() && (
          <>
            <div className="nav-section-title" style={{ color: 'var(--accent)', opacity: 0.8 }}>
              Super Admin
            </div>
            <hr className="nav-admin-divider" />
            {adminNav.map(item => <NavItem key={item.path} item={item} />)}

            <div className="nav-section-title">Reports</div>
            {adminReportsNav.map(item => <NavItem key={item.path} item={item} />)}
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <button className="sidebar-collapse-btn" onClick={onToggle}>
          <Icon name={collapsed ? 'chevronRight' : 'chevronLeft'} size={16} />
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
