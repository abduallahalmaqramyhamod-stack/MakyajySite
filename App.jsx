import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import StoreLayout from './layouts/StoreLayout';
import AdminLayout from './layouts/AdminLayout';

// Store Pages
import HomePage from './pages/store/HomePage';
import ProductsPage from './pages/store/ProductsPage';
import ProductDetailPage from './pages/store/ProductDetailPage';
import CategoryPage from './pages/store/CategoryPage';
import CartPage from './pages/store/CartPage';
import CheckoutPage from './pages/store/CheckoutPage';
import OrderConfirmationPage from './pages/store/OrderConfirmationPage';
import OrderTrackingPage from './pages/store/OrderTrackingPage';

// Admin Pages & Guard
import ProtectedRoute from './components/admin/ProtectedRoute';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminProductForm from './pages/admin/AdminProductForm';
import AdminOrders from './pages/admin/AdminOrders';
import AdminOrderDetail from './pages/admin/AdminOrderDetail';
import AdminCategories from './pages/admin/AdminCategories';
import AdminBrands from './pages/admin/AdminBrands';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminSettings from './pages/admin/AdminSettings';

export default function App() {
  return (
    <Routes>
      {/* 1. Public Store Routes */}
      <Route element={<StoreLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:slug" element={<ProductDetailPage />} />
        <Route path="/category/:slug" element={<CategoryPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order-confirmation/:orderNumber" element={<OrderConfirmationPage />} />
        <Route path="/order-tracking" element={<OrderTrackingPage />} />
      </Route>

      {/* 2. Admin Login */}
      <Route path="/admin/login" element={<AdminLoginPage />} />

      {/* 3. Protected Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="products/new" element={<AdminProductForm />} />
        <Route path="products/edit/:id" element={<AdminProductForm />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="orders/:id" element={<AdminOrderDetail />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="brands" element={<AdminBrands />} />
        <Route path="customers" element={<AdminCustomers />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
