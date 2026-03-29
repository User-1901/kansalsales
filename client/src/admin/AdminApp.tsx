import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AdminLayout from './AdminLayout';
import AdminLoginPage from './AdminLoginPage';
import AdminDashboard from './AdminDashboard';
import AdminProductsPage from './AdminProductsPage';
import AdminCategoriesPage from './AdminCategoriesPage';
import AdminUsersPage from './AdminUsersPage';
import AdminRatingsPage from './AdminRatingsPage';

export default function AdminApp() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Admin login — no sidebar */}
      <Route path="login" element={<AdminLoginPage />} />

      {/* Protected admin routes — with sidebar */}
      <Route
        path="/*"
        element={
          user === null ? (
            // Not logged in → go to admin login
            <Navigate to="/admin/login" replace />
          ) : user.role !== 'admin' ? (
            // Logged in but not admin → back to public site
            <Navigate to="/" replace />
          ) : (
            <AdminLayout />
          )
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="products" element={<AdminProductsPage />} />
        <Route path="categories" element={<AdminCategoriesPage />} />
        <Route path="ratings" element={<AdminRatingsPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  );
}
