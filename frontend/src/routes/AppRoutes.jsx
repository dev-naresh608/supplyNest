import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useGetProfileQuery } from '../store/api/authApi';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { LoginView } from '../features/auth/LoginView';
import { DashboardView } from '../features/dashboard/DashboardView';
import { HierarchyTreeView } from '../features/hierarchy/HierarchyTreeView';
import { RolesView } from '../features/roles/RolesView';
import { ProductsView } from '../features/products/ProductsView';
import { InventoryView } from '../features/inventory/InventoryView';
import { RevenueView } from '../features/revenue/RevenueView';
import { SessionManagerView } from '../features/auth/SessionManagerView';

const ProtectedRoute = ({ children }) => {
  const { user, isInitialized } = useSelector((state) => state.auth);
  const { isLoading } = useGetProfileQuery(undefined, {
    skip: !!user, // Skip if already populated in store
  });

  if (!isInitialized && isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center text-slate-600 text-sm gap-3">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-medium text-slate-600">Authenticating Invora Session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

export const AppRoutes = () => {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginView />
          </PublicRoute>
        }
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardView />} />
        <Route path="hierarchy" element={<HierarchyTreeView />} />
        <Route path="roles" element={<RolesView />} />
        <Route path="products" element={<ProductsView />} />
        <Route path="inventory" element={<InventoryView />} />
        <Route path="revenue" element={<RevenueView />} />
        <Route path="sessions" element={<SessionManagerView />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

