import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layout
import { AppLayout } from './components/layout/AppLayout';

// Merchant Dashboard Pages
import { DashboardPage } from './pages/merchant/DashboardPage';
import { InventoryPage } from './pages/merchant/InventoryPage';
import { BillFormatPage } from './pages/merchant/BillFormatPage';
import { OrdersPage } from './pages/merchant/OrdersPage';
import { ReportsPage } from './pages/merchant/ReportsPage';
import { HistoryPage } from './pages/merchant/HistoryPage';
import { ShareStorePage } from './pages/merchant/ShareStorePage';
import { SettingsPage } from './pages/merchant/SettingsPage';

// Public & Marketing Pages
import { LandingPage } from './pages/marketing/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { OnboardingPage } from './pages/auth/OnboardingPage';
import { PublicStorefrontPage } from './pages/public/PublicStorefrontPage';
import { PlatformAdminPage } from './pages/platform/PlatformAdminPage';
import { AdminRoute } from './components/auth/AdminRoute';

// React Toastify Notifications
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Protected Route Wrapper - Strictly checks token & active user session
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#f4f7fc] space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
        <p className="text-xs font-semibold text-slate-500">Checking authorization...</p>
      </div>
    );
  }

  const token = localStorage.getItem('mystore_token');

  // Enforce secure access: If no token or no user, redirect immediately to login
  if (!user || !token) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return children;
};

export const App = () => {
  return (
    <AuthProvider>
      <ToastContainer
        position="top-right"
        autoClose={3500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      <Routes>
        {/* Public Marketing & Auth */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/signin" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<RegisterPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />

        {/* Public Storefront */}
        <Route path="/store/:storeHandle" element={<PublicStorefrontPage />} />

        {/* Protected Platform Admin Console */}
        <Route
          path="/platform"
          element={
            <AdminRoute>
              <PlatformAdminPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <PlatformAdminPage />
            </AdminRoute>
          }
        />

        {/* Merchant Application Layout */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="bill-format" element={<BillFormatPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="share" element={<ShareStorePage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
};

export default App;
