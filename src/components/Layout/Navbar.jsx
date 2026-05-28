import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Icon from '../Icon';
import { getInitials } from '../../utils/formatters';

export default function Navbar({ collapsed, onMenuToggle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('ska_theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ska_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

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
    <nav className={`navbar ${collapsed ? 'collapsed' : ''}`}>
      <div className="navbar-left">
        <button className="btn-icon nav-menu-btn" onClick={onMenuToggle}>
          <Icon name="menu" size={20} />
        </button>
      </div>

      <div className="navbar-right">
        <button className="theme-toggle-btn" onClick={toggleTheme} title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={17} />
        </button>
        {user && (
          <div className="nav-user-section" ref={dropdownRef}>
            <div className="nav-user-info" style={{ textAlign: 'right', marginRight: '0.75rem' }}>
              <div className="nav-user-name">{user.ownerName}</div>
              <div className="nav-user-role">
                Flat {user.flatNo}
                {user.role === 'superadmin' && (
                  <span className="nav-badge admin" style={{ marginLeft: '0.5rem' }}>
                    <Icon name="crown" size={10} /> Admin
                  </span>
                )}
              </div>
            </div>

            <button
              className="nav-avatar"
              onClick={() => setDropdownOpen(p => !p)}
              style={{ cursor: 'pointer', border: dropdownOpen ? '2px solid var(--primary)' : '2px solid var(--border)', padding: user.photoUrl ? 0 : undefined }}
            >
              {user.photoUrl ? (
                <img src={user.photoUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              ) : (
                getInitials(user.ownerName)
              )}
            </button>

            {dropdownOpen && (
              <div className="nav-dropdown slide-up">
                <button className="nav-dropdown-item" onClick={() => { navigate('/my-account'); setDropdownOpen(false); }}>
                  <Icon name="user" size={16} /> My Account
                </button>
                <button className="nav-dropdown-item" onClick={() => { navigate('/complaints'); setDropdownOpen(false); }}>
                  <Icon name="complaint" size={16} /> My Complaints
                </button>
                <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: '0.25rem 0' }} />
                <button className="nav-dropdown-item text-danger-c" onClick={handleLogout}>
                  <Icon name="logout" size={16} /> Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
