import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Icon from '../Icon';
import { getInitials } from '../../utils/formatters';

const ROUTE_LABELS = {
  dashboard: 'Dashboard',
  'monthly-collection': 'Collection & Dues',
  'pending-dues': 'Collection & Dues',
  'my-payments': 'My Payments',
  expenses: 'Expenses',
  'other-income': 'Other Income',
  'society-info': 'Society Info',
  'flat-directory': 'Flat Directory',
  'notice-board': 'Notice Board',
  complaints: 'Complaints',
  'important-contacts': 'Important Contacts',
  'my-account': 'My Account',
  'printable-statement': 'Statement & Reports',
  admin: 'Admin Panel',
};

export default function Navbar({ collapsed, onMenuToggle }) {
  const { user, logout, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const pathParts = location.pathname.split('/').filter(Boolean);
  const pageKey = pathParts[pathParts.length - 1] || 'dashboard';
  const pageLabel =
    ROUTE_LABELS[pageKey] ||
    pageKey.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('ska_theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ska_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className={`navbar ${collapsed ? 'collapsed' : ''}`}>
      <div className="navbar-left">
        <button
          type="button"
          className="btn-icon nav-menu-btn"
          onClick={onMenuToggle}
          aria-label="Open menu"
        >
          <Icon name="menu" size={20} />
        </button>
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <span className="breadcrumb-root">Sri Kuber</span>
          <Icon name="chevronRight" size={12} className="breadcrumb-icon" aria-hidden />
          <span className="breadcrumb-current">{pageLabel}</span>
        </nav>
      </div>

      <div className="navbar-right">
        <button
          type="button"
          className="theme-toggle-btn"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={17} />
        </button>

        {user && (
          <>
            <span className="navbar-divider" aria-hidden />
            <div className="nav-user-section" ref={dropdownRef}>
              <button
                type="button"
                className={`nav-user-trigger${dropdownOpen ? ' is-open' : ''}`}
                onClick={() => setDropdownOpen((p) => !p)}
                aria-expanded={dropdownOpen}
                aria-haspopup="menu"
                id="nav-user-menu-btn"
              >
                <div className="nav-user-meta">
                  <span className="nav-user-name">{user.ownerName}</span>
                  <span className="nav-user-details">
                    <span className="nav-user-flat">Flat {user.flatNo}</span>
                    {isSuperAdmin() && (
                      <span className="nav-badge admin">
                        <Icon name="crown" size={10} aria-hidden />
                        Admin
                      </span>
                    )}
                  </span>
                </div>
                <span className="nav-avatar" aria-hidden>
                  {user.photoUrl ? (
                    <img src={user.photoUrl} alt="" />
                  ) : (
                    getInitials(user.ownerName)
                  )}
                </span>
                <Icon
                  name="chevronDown"
                  size={14}
                  className={`nav-user-chevron${dropdownOpen ? ' is-open' : ''}`}
                  aria-hidden
                />
              </button>

              {dropdownOpen && (
                <div className="nav-dropdown slide-up" role="menu" aria-labelledby="nav-user-menu-btn">
                  <div className="nav-dropdown-header">
                    <span className="nav-dropdown-name">{user.ownerName}</span>
                    <span className="nav-dropdown-flat">Flat {user.flatNo}</span>
                  </div>
                  <button
                    type="button"
                    className="nav-dropdown-item"
                    role="menuitem"
                    onClick={() => {
                      navigate('/my-account');
                      setDropdownOpen(false);
                    }}
                  >
                    <Icon name="user" size={16} /> My Account
                  </button>
                  <button
                    type="button"
                    className="nav-dropdown-item"
                    role="menuitem"
                    onClick={() => {
                      navigate('/complaints');
                      setDropdownOpen(false);
                    }}
                  >
                    <Icon name="complaint" size={16} /> My Complaints
                  </button>
                  <hr className="nav-dropdown-sep" />
                  <button
                    type="button"
                    className="nav-dropdown-item text-danger-c"
                    role="menuitem"
                    onClick={handleLogout}
                  >
                    <Icon name="logout" size={16} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
}
