import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#f4f7fc]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  // Allow unauthenticated demo exploration or redirect
  return children;
};

export const App = () => {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Marketing & Auth */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/signin" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<RegisterPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />

        {/* Public Storefront */}
        <Route path="/store/:storeSlug" element={<PublicStorefrontPage />} />

        {/* Platform Admin Console */}
        <Route path="/platform" element={<PlatformAdminPage />} />

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
