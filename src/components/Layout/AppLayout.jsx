import { useState, useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ActivityTracker from '../ActivityTracker';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function AppLayout() {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="app-layout">
      <ActivityTracker />
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="mobile-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <Navbar
        collapsed={collapsed}
        onMenuToggle={() => setMobileOpen(m => !m)}
      />

      <main className={`main-content ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="page-container">
          <div className="slide-up">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
