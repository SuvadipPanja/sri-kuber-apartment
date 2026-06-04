import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import AppLayout from './components/Layout/AppLayout';

// Public
import Login from './pages/Login';

// User Pages
import Dashboard from './pages/Dashboard';
import MonthlyCollection from './pages/MonthlyCollection';
import MyPayments from './pages/MyPayments';
import Expenses from './pages/Expenses';
import OtherIncome from './pages/OtherIncome';
import SocietyInfo from './pages/SocietyInfo';
import FlatDirectory from './pages/FlatDirectory';
import NoticeBoard from './pages/NoticeBoard';
import Complaints from './pages/Complaints';
import MyAccount from './pages/MyAccount';
import PrintableStatement from './pages/PrintableStatement';
import ImportantContacts from './pages/ImportantContacts';

// Admin Pages
import AdminPanel from './pages/admin/AdminPanel';
import ManagePayments from './pages/admin/ManagePayments';
import ManageExpenses from './pages/admin/ManageExpenses';
import ManageIncome from './pages/admin/ManageIncome';
import ManageOwners from './pages/admin/ManageOwners';
import ManageNotices from './pages/admin/ManageNotices';
import ManageComplaints from './pages/admin/ManageComplaints';
import ManageContacts from './pages/admin/ManageContacts';
import SocietySettings from './pages/admin/SocietySettings';
import ResetPassword from './pages/admin/ResetPassword';
import ActivityReport from './pages/admin/ActivityReport';
import DataBackup from './pages/admin/DataBackup';

// Route wrappers
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="loading-logo">SK</div><div className="spinner lg"></div></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { user, loading, isSuperAdmin } = useAuth();
  if (loading) return <div className="loading-screen"><div className="loading-logo">SK</div><div className="spinner lg"></div></div>;
  if (!user || !isSuperAdmin()) return <Navigate to="/dashboard" replace />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />

        {/* User Routes */}
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="monthly-collection" element={<MonthlyCollection />} />
        <Route path="pending-dues" element={<Navigate to="/monthly-collection" replace />} />
        <Route path="my-payments" element={<MyPayments />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="other-income" element={<OtherIncome />} />
        <Route path="society-info" element={<SocietyInfo />} />
        <Route path="flat-directory" element={<FlatDirectory />} />
        <Route path="notice-board" element={<NoticeBoard />} />
        <Route path="complaints" element={<Complaints />} />
        <Route path="important-contacts" element={<ImportantContacts />} />
        <Route path="my-account" element={<MyAccount />} />

        {/* Admin Only Routes */}
        <Route path="printable-statement" element={<AdminRoute><PrintableStatement /></AdminRoute>} />
        <Route path="admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
        <Route path="admin/payments" element={<AdminRoute><ManagePayments /></AdminRoute>} />
        <Route path="admin/expenses" element={<AdminRoute><ManageExpenses /></AdminRoute>} />
        <Route path="admin/income" element={<AdminRoute><ManageIncome /></AdminRoute>} />
        <Route path="admin/owners" element={<AdminRoute><ManageOwners /></AdminRoute>} />
        <Route path="admin/notices" element={<AdminRoute><ManageNotices /></AdminRoute>} />
        <Route path="admin/complaints" element={<AdminRoute><ManageComplaints /></AdminRoute>} />
        <Route path="admin/contacts" element={<AdminRoute><ManageContacts /></AdminRoute>} />
        <Route path="admin/settings" element={<AdminRoute><SocietySettings /></AdminRoute>} />
        <Route path="admin/reset-password" element={<AdminRoute><ResetPassword /></AdminRoute>} />
        <Route path="admin/activity-report" element={<AdminRoute><ActivityReport /></AdminRoute>} />
        <Route path="admin/data-backup" element={<AdminRoute><DataBackup /></AdminRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
