import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/Toast';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { CustomerAuthProvider } from './context/CustomerAuthContext';

import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';

// Admin Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { ProductForm } from './pages/ProductForm';
import { Categories } from './pages/Categories';
import { Orders } from './pages/Orders';
import { Invoices } from './pages/Invoices';
import { Customers } from './pages/Customers';
import { Coupons } from './pages/Coupons';
import { Reviews } from './pages/Reviews';
import { SalesAnalytics } from './pages/SalesAnalytics';
import { Settings } from './pages/Settings';
import { ActivityLogs } from './pages/ActivityLogs';

// Customer Pages
import { CustomerHome } from './pages/customer/CustomerHome';
import { CustomerShop } from './pages/customer/CustomerShop';
import { ProductDetail } from './pages/customer/ProductDetail';
import { CartPage } from './pages/customer/CartPage';
import { CheckoutPage } from './pages/customer/CheckoutPage';
import { PaymentPage } from './pages/customer/PaymentPage';
import { OrderConfirmationPage } from './pages/customer/OrderConfirmationPage';
import { OrderStatusPage } from './pages/customer/OrderStatusPage';
import { CustomerLogin } from './pages/customer/CustomerLogin';
import { CustomerRegister } from './pages/customer/CustomerRegister';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

// Protected Admin Layout Component
const AdminLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-900 text-white">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <CustomerAuthProvider>
            <CartProvider>
              <WishlistProvider>
                <ToastProvider>
                  <BrowserRouter>
                    <Routes>
                      {/* CUSTOMER WEBSITE ROUTES */}
                      <Route path="/" element={<CustomerHome />} />
                      <Route path="/shop" element={<CustomerShop />} />
                      <Route path="/product/:id" element={<ProductDetail />} />
                      <Route path="/cart" element={<CartPage />} />
                      <Route path="/checkout" element={<CheckoutPage />} />
                      <Route path="/payment" element={<PaymentPage />} />
                      <Route path="/order-confirmation/:orderNumber" element={<OrderConfirmationPage />} />
                      <Route path="/my-orders" element={<OrderStatusPage />} />
                      <Route path="/customer/login" element={<CustomerLogin />} />
                      <Route path="/customer/register" element={<CustomerRegister />} />

                      {/* ADMIN AUTH & DASHBOARD ROUTES */}
                      <Route path="/admin/login" element={<Login />} />
                      <Route path="/admin" element={<AdminLayout />}>
                        <Route index element={<Dashboard />} />
                        <Route path="products" element={<Products />} />
                        <Route path="products/new" element={<ProductForm />} />
                        <Route path="products/edit/:id" element={<ProductForm />} />
                        <Route path="categories" element={<Categories />} />
                        <Route path="orders" element={<Orders />} />
                        <Route path="invoices" element={<Invoices />} />
                        <Route path="customers" element={<Customers />} />
                        <Route path="coupons" element={<Coupons />} />
                        <Route path="reviews" element={<Reviews />} />
                        <Route path="sales" element={<SalesAnalytics />} />
                        <Route path="settings" element={<Settings />} />
                        <Route path="activity-logs" element={<ActivityLogs />} />
                      </Route>

                      {/* Fallback Root Redirection */}
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </BrowserRouter>
                </ToastProvider>
              </WishlistProvider>
            </CartProvider>
          </CustomerAuthProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
