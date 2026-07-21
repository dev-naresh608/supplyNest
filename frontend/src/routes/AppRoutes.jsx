import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070a13] flex items-center justify-center text-slate-400 text-sm">
        Authenticating Invora Session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginView />} />

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
