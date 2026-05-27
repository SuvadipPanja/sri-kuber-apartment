import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ownersData from '../../data/owners.json';
import { getInitials } from '../../utils/formatters';

export default function Navbar({ collapsed, onMenuToggle }) {
  const { user, logout, isSuperAdmin } = useAuth();
  const navigate = useNavigate();

  const owner = ownersData.find(o => o.flatNo === user?.flatNo);
  const displayName = owner?.ownerName || `Flat ${user?.flatNo}`;
  const initials = getInitials(displayName);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className={`navbar ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="navbar-left">
        {/* Mobile hamburger */}
        <button
          className="btn-icon"
          onClick={onMenuToggle}
          style={{ display: 'none' }}
          id="mobile-menu-btn"
          aria-label="Open menu"
        >
          ☰
        </button>

        <div>
          <div className="navbar-greeting">
            Welcome, <strong>{displayName}</strong>
          </div>
        </div>
      </div>

      <div className="navbar-right">
        <span className="navbar-flat-badge">
          {isSuperAdmin() ? '👑 Admin' : `Flat ${user?.flatNo}`}
        </span>
        <div className="navbar-avatar" title={displayName}>
          {initials}
        </div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={handleLogout}
          id="logout-btn"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
