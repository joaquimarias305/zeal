import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './context/AuthContext';

// Pages – Auth
import LoginPage    from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import VerifyEmail  from './pages/auth/VerifyEmail';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword  from './pages/auth/ResetPassword';

// Pages – Worker
import WorkerDashboard  from './pages/worker/WorkerDashboard';
import WorkerProfile    from './pages/worker/WorkerProfile';
import WorkerAvailability from './pages/worker/WorkerAvailability';
import WorkerSettings   from './pages/worker/WorkerSettings';

// Pages – Business
import BusinessDashboard from './pages/business/BusinessDashboard';
import BusinessProfile   from './pages/business/BusinessProfile';
import PostShift         from './pages/business/PostShift';
import ManageShift       from './pages/business/ManageShift';
import ShiftPayment      from './pages/business/ShiftPayment';

// Pages – Shared
import LandingPage       from './pages/LandingPage';
import ShiftBoard        from './pages/shifts/ShiftBoard';
import ShiftDetail       from './pages/shifts/ShiftDetail';
import PaymentPage       from './pages/shifts/PaymentPage';

// Pages – Admin
import AdminDashboard from './pages/admin/AdminDashboard';

// Components
import Navbar        from './components/common/Navbar';
import LoadingScreen from './components/common/LoadingScreen';
import PushPrompt    from './components/common/PushPrompt';

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user)   return <Navigate to="/login" replace />;
  if (role && user.type !== role) return <Navigate to="/" replace />;
  return children;
};

const PublicOnlyRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to={user.type === 'worker' ? '/worker' : user.type === 'business' ? '/business' : '/admin'} replace />;
  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        <Routes>
          {/* Public */}
          <Route path="/" element={user ? <Navigate to={user.type === 'worker' ? '/worker' : user.type === 'business' ? '/business' : '/admin'} replace /> : <LandingPage />} />
          <Route path="/shifts" element={<ShiftBoard />} />
          <Route path="/shifts/:id" element={<ShiftDetail />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* Public only */}
          <Route path="/login"    element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
          <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
          <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPassword /></PublicOnlyRoute>} />
          <Route path="/reset-password"  element={<PublicOnlyRoute><ResetPassword /></PublicOnlyRoute>} />

          {/* Worker */}
          <Route path="/worker"              element={<ProtectedRoute role="worker"><WorkerDashboard /></ProtectedRoute>} />
          <Route path="/worker/profile"      element={<ProtectedRoute role="worker"><WorkerProfile /></ProtectedRoute>} />
          <Route path="/worker/availability" element={<ProtectedRoute role="worker"><WorkerAvailability /></ProtectedRoute>} />
          <Route path="/worker/settings"     element={<ProtectedRoute role="worker"><WorkerSettings /></ProtectedRoute>} />
          <Route path="/worker/pay/:paymentId" element={<ProtectedRoute role="worker"><PaymentPage /></ProtectedRoute>} />

          {/* Business */}
          <Route path="/business"            element={<ProtectedRoute role="business"><BusinessDashboard /></ProtectedRoute>} />
          <Route path="/business/profile"    element={<ProtectedRoute role="business"><BusinessProfile /></ProtectedRoute>} />
          <Route path="/business/post-shift" element={<ProtectedRoute role="business"><PostShift /></ProtectedRoute>} />
          <Route path="/business/shifts/:id" element={<ProtectedRoute role="business"><ManageShift /></ProtectedRoute>} />
          <Route path="/business/shifts/:shiftId/pay/:appId" element={<ProtectedRoute role="business"><ShiftPayment /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/shifts" replace />} />
        </Routes>
      </main>
      {user && <PushPrompt />}
      <ToastContainer position="top-right" autoClose={4000} theme="colored" />
    </>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
