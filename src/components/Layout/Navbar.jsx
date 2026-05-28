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
              style={{ cursor: 'pointer', border: dropdownOpen ? '2px solid var(--primary)' : '2px solid var(--border)' }}
            >
              {getInitials(user.ownerName)}
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
