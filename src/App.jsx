import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import AppLayout from './components/Layout/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MyPayments from './pages/MyPayments';
import PendingDues from './pages/PendingDues';
import Expenses from './pages/Expenses';
import SocietyInfo from './pages/SocietyInfo';
import FlatDirectory from './pages/FlatDirectory';
import PrintableStatement from './pages/PrintableStatement';
import WhatsAppShare from './pages/WhatsAppShare';
import ChangePassword from './pages/ChangePassword';
import AdminPanel from './pages/admin/AdminPanel';
import ManagePayments from './pages/admin/ManagePayments';
import ManageExpenses from './pages/admin/ManageExpenses';
import ManageOwners from './pages/admin/ManageOwners';
import SocietySettings from './pages/admin/SocietySettings';
import ResetPassword from './pages/admin/ResetPassword';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="loading-screen">
      <div className="loading-logo">🏠 Sri Kuber</div>
      <div className="spinner"></div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { user, loading, isSuperAdmin } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!isSuperAdmin()) return <Navigate to="/dashboard" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={
              <PublicRoute><Login /></PublicRoute>
            } />
            <Route path="/" element={
              <ProtectedRoute><AppLayout /></ProtectedRoute>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="my-payments" element={<MyPayments />} />
              <Route path="pending-dues" element={<PendingDues />} />
              <Route path="expenses" element={<Expenses />} />
              <Route path="society-info" element={<SocietyInfo />} />
              <Route path="flat-directory" element={<FlatDirectory />} />
              <Route path="printable-statement" element={<PrintableStatement />} />
              <Route path="whatsapp-share" element={<WhatsAppShare />} />
              <Route path="change-password" element={<ChangePassword />} />
              {/* Admin Routes */}
              <Route path="admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
              <Route path="admin/payments" element={<AdminRoute><ManagePayments /></AdminRoute>} />
              <Route path="admin/expenses" element={<AdminRoute><ManageExpenses /></AdminRoute>} />
              <Route path="admin/owners" element={<AdminRoute><ManageOwners /></AdminRoute>} />
              <Route path="admin/settings" element={<AdminRoute><SocietySettings /></AdminRoute>} />
              <Route path="admin/reset-password" element={<AdminRoute><ResetPassword /></AdminRoute>} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
