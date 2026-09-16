import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { FullScreenLoading, ProtectedOutlet } from '@/components/guards';

import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import PortalLoginPage from '@/pages/barber/PortalLoginPage';

import ManagerLayout from '@/components/layout/ManagerLayout';
import AdminLayout from '@/components/layout/AdminLayout';
import BarberLayout from '@/components/layout/BarberLayout';

import DashboardPage from '@/pages/manager/DashboardPage';
import BarbersPage from '@/pages/manager/BarbersPage';
import TransactionsPage from '@/pages/manager/TransactionsPage';
import LoansPage from '@/pages/manager/LoansPage';
import WalletPage from '@/pages/manager/WalletPage';
import ReportsPage from '@/pages/manager/ReportsPage';
import SettingsPage from '@/pages/manager/SettingsPage';
import SupportPage from '@/pages/manager/SupportPage';

import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';
import AdminUsersPage from '@/pages/admin/AdminUsersPage';
import AdminRetentionPage from '@/pages/admin/AdminRetentionPage';

import PortalDashboardPage from '@/pages/barber/PortalDashboardPage';

function RoleHome() {
  const { role, loading } = useAuth();
  if (loading) return <FullScreenLoading />;
  if (role === 'manager') return <Navigate to="/dashboard" replace />;
  if (role === 'admin') return <Navigate to="/admin" replace />;
  if (role === 'barber') return <Navigate to="/portal" replace />;
  return <Navigate to="/login" replace />;
}

function RequireRole({ roles, children }: { roles: ('manager' | 'admin' | 'barber')[]; children: React.ReactNode }) {
  const { role, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullScreenLoading />;
  if (!role) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (!roles.includes(role)) {
    if (role === 'manager') return <Navigate to="/dashboard" replace />;
    if (role === 'admin') return <Navigate to="/admin" replace />;
    return <Navigate to="/portal" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/portal/login" element={<PortalLoginPage />} />

      {/* Manager app */}
      <Route
        path="/"
        element={
          <RequireRole roles={['manager']}>
            <ProtectedOutlet />
          </RequireRole>
        }
      >
        <Route element={<ManagerLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/barbers" element={<BarbersPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/loans" element={<LoansPage />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/support" element={<SupportPage />} />
        </Route>
      </Route>

      {/* Admin app */}
      <Route
        path="/"
        element={
          <RequireRole roles={['admin']}>
            <ProtectedOutlet />
          </RequireRole>
        }
      >
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/retention" element={<AdminRetentionPage />} />
        </Route>
      </Route>

      {/* Barber portal */}
      <Route
        path="/"
        element={
          <RequireRole roles={['barber']}>
            <ProtectedOutlet />
          </RequireRole>
        }
      >
        <Route element={<BarberLayout />}>
          <Route path="/portal" element={<PortalDashboardPage />} />
        </Route>
      </Route>

      <Route path="*" element={<RoleHome />} />
    </Routes>
  );
}