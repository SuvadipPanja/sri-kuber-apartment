import { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function AppLayout() {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="app-layout">
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'var(--bg-overlay)', zIndex: 940, backdropFilter: 'blur(4px)' }}
          onClick={() => setMobileOpen(false)}
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
