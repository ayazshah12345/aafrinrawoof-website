import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Package, Clock, CheckCircle2, Truck, AlertCircle, FileText, ArrowRight, UserCheck, RefreshCw, ShoppingBag, LogOut, User, Mail, Phone, MapPin } from 'lucide-react';
import { api } from '../../api/client';
import { Order } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { CustomerNavbar } from '../../components/CustomerNavbar';
import { CustomerFooter } from '../../components/CustomerFooter';
import { InvoiceModal } from '../InvoiceModal';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { Link } from 'react-router-dom';

const WORKFLOW_STEPS = [
  { id: 'Pending Approval', label: 'Waiting for Approval', icon: Clock },
  { id: 'Confirmed', label: 'Order Confirmed', icon: UserCheck },
  { id: 'Packed', label: 'Packed & Processing', icon: Package },
  { id: 'Shipped', label: 'Out for Delivery', icon: Truck },
  { id: 'Delivered', label: 'Delivered', icon: CheckCircle2 },
];

export const OrderStatusPage: React.FC = () => {
  const { customer, isAuthenticated, logout } = useCustomerAuth();
  const [searchInput, setSearchInput] = useState('');
  const [activeQuery, setActiveQuery] = useState<string>('');
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);

  // Auto query by customer email or phone if logged in and no search input
  const defaultQuery = customer?.phone || customer?.email || '';

  const searchQuery = activeQuery.trim() || defaultQuery;

  const { data: searchResults, isLoading, refetch, isFetching } = useQuery<Order[]>({
    queryKey: ['customer-order-status-tracking', searchQuery],
    queryFn: async () => {
      if (!searchQuery) return [];
      const q = searchQuery.trim();

      // Check if order number query
      if (q.toUpperCase().startsWith('ORD-') || q.toUpperCase().startsWith('AFS-')) {
        try {
          const res = await api.get(`/orders/by-number/${q.toUpperCase()}`);
          return res.data ? [res.data] : [];
        } catch {
          return [];
        }
      }

      // Check if email query
      if (q.includes('@')) {
        try {
          const res = await api.get(`/orders/by-email/${encodeURIComponent(q)}`);
          return Array.isArray(res.data) ? res.data : (res.data?.items || []);
        } catch {
          return [];
        }
      }

      // Check if phone query
      try {
        const res = await api.get(`/orders/by-phone/${encodeURIComponent(q)}`);
        return Array.isArray(res.data) ? res.data : (res.data?.items || []);
      } catch {
        return [];
      }
    },
    enabled: true,
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveQuery(searchInput.trim());
  };

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'Pending Approval':
      case 'Pending':
        return 0;
      case 'Confirmed':
        return 1;
      case 'Packed':
        return 2;
      case 'Shipped':
        return 3;
      case 'Delivered':
      case 'Completed':
        return 4;
      default:
        return 0;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      <CustomerNavbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <span className="inline-block px-3 py-1 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold text-xs uppercase tracking-wider rounded-full mb-2">
              Live Order Status Tracking
            </span>
            <h1 className="text-3xl font-black font-outfit tracking-tight">Track Your Order Status</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Enter your Order Number, Phone Number, or Email to view real-time fulfillment updates.
            </p>
          </div>

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="self-start md:self-auto px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 text-amber-500 ${isFetching ? 'animate-spin' : ''}`} />
            <span>{isFetching ? 'Refreshing...' : 'Refresh Status'}</span>
          </button>
        </div>

        {/* Customer Account Profile Header Card */}
        {isAuthenticated && customer ? (
          <div className="bg-white dark:bg-slate-900 border border-amber-500/30 dark:border-amber-500/20 rounded-3xl p-6 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-amber-500/20">
                  {(customer.full_name || customer.email || 'C').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-extrabold font-outfit text-slate-900 dark:text-white">
                      {customer.full_name || 'Afsoo Customer'}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] uppercase border border-emerald-500/20">
                      Verified Customer Account
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {customer.email} {customer.phone ? `• ${customer.phone}` : ''}
                  </p>
                </div>
              </div>

              <button
                onClick={logout}
                className="self-start sm:self-auto px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 text-xs font-bold transition-colors border border-rose-500/20 flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1">
                  <Mail className="w-3 h-3 text-amber-500" />
                  <span>Email Address</span>
                </div>
                <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{customer.email}</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1">
                  <Phone className="w-3 h-3 text-amber-500" />
                  <span>Mobile Contact</span>
                </div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">{customer.phone || 'Not provided'}</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1">
                  <MapPin className="w-3 h-3 text-amber-500" />
                  <span>Delivery Address / City</span>
                </div>
                <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {customer.address ? `${customer.address}${customer.city ? `, ${customer.city}` : ''}` : (customer.city || 'India')}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <UserCheck className="w-8 h-8 text-amber-500 shrink-0" />
              <div>
                <p className="font-extrabold text-slate-900 dark:text-white text-sm">Have a Customer Account?</p>
                <p className="text-slate-500">Sign in to view your profile details and automatically sync your order history.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-stretch sm:self-auto">
              <Link
                to="/customer/login"
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold transition-all shadow-md"
              >
                Log In
              </Link>
              <Link
                to="/customer/register"
                className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-bold border border-slate-200 dark:border-slate-800 hover:bg-slate-100"
              >
                Register
              </Link>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by Order # (e.g. ORD-DA27BF51), Mobile Phone, or Email..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
            >
              <span>Search Status</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Results Section */}
        {isLoading ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-3">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500">Checking latest status updates from Admin Dashboard...</p>
          </div>
        ) : searchResults && searchResults.length > 0 ? (
          <div className="space-y-6">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Showing {searchResults.length} Order(s) for "{searchQuery}"
            </p>

            {searchResults.map((order) => {
              const currentStepIndex = getStepIndex(order.order_status);
              const isCancelled = order.order_status === 'Cancelled';

              return (
                <div key={order.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                  {/* Order Top Summary Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-black font-mono text-slate-900 dark:text-white">
                          #{order.order_number}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                          isCancelled
                            ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                            : order.order_status === 'Delivered'
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                            : order.order_status === 'Pending Approval' || order.order_status === 'Pending'
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                            : 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                        }`}>
                          {order.order_status === 'Pending Approval' || order.order_status === 'Pending'
                            ? 'WAITING FOR APPROVAL'
                            : order.order_status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Placed on {new Date(order.created_at || Date.now()).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setInvoiceOrder(order)}
                        className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-white text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm"
                      >
                        <FileText className="w-4 h-4" />
                        <span>View Official Invoice</span>
                      </button>
                    </div>
                  </div>

                  {/* VISUAL STEP PROGRESS TRACKER */}
                  {!isCancelled ? (
                    <div className="py-4">
                      <div className="grid grid-cols-4 gap-2 relative">
                        {WORKFLOW_STEPS.map((step, idx) => {
                          const IconComponent = step.icon;
                          const isPassed = idx <= currentStepIndex;
                          const isCurrent = idx === currentStepIndex;

                          return (
                            <div key={step.id} className="flex flex-col items-center text-center space-y-2 relative">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                                isPassed
                                  ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                              } ${isCurrent ? 'ring-4 ring-amber-500/20 animate-pulse' : ''}`}>
                                <IconComponent className="w-5 h-5" />
                              </div>

                              <span className={`text-[11px] font-bold ${
                                isPassed ? 'text-slate-900 dark:text-white' : 'text-slate-400'
                              }`}>
                                {step.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      <span>This order has been marked as Cancelled by Admin support. If you have questions, contact support at +91 96292 17907.</span>
                    </div>
                  )}

                  {/* Order Details & Shipping */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800 text-xs">
                    <div>
                      <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Customer & Contact</p>
                      <p className="font-bold text-slate-900 dark:text-white mt-1">{order.customer?.full_name || 'Valued Customer'}</p>
                      <p className="text-slate-500 mt-0.5">{order.phone || order.customer?.phone}</p>
                      <p className="text-slate-500">{order.customer?.email}</p>
                    </div>

                    <div>
                      <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Delivery Shipping Address</p>
                      <p className="font-medium text-slate-800 dark:text-slate-200 mt-1">{order.shipping_address}</p>
                      <p className="text-slate-500 mt-1">Payment Method: <span className="font-bold text-slate-900 dark:text-white">{order.payment_method}</span></p>
                    </div>
                  </div>

                  {/* Purchased Items List */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Order Items</h4>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200/60 dark:border-slate-800 rounded-2xl overflow-hidden">
                      {(order.order_items || (order as any).items || []).map((item: any, i: number) => (
                        <div key={i} className="p-3 flex items-center justify-between text-xs">
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{item.product_name || item.name || 'Handmade Craft Item'}</p>
                            <p className="text-slate-400">Qty: {item.quantity || 1} &times; {formatCurrency(item.price || 0)}</p>
                          </div>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            {formatCurrency((item.price || 0) * (item.quantity || 1))}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800 text-sm font-bold">
                    <span className="text-slate-500">Total Paid Amount:</span>
                    <span className="text-amber-600 dark:text-amber-400 font-mono text-xl">{formatCurrency(order.total_amount)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : searchQuery ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-4">
            <Package className="w-12 h-12 text-slate-400 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Orders Found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No active orders matched "{searchQuery}". Check your Order Number or Phone Number and try searching again.
              </p>
            </div>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 text-white font-bold text-xs shadow-md hover:bg-amber-600"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Explore Shop Catalog</span>
            </Link>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-4">
            <Search className="w-12 h-12 text-amber-500 mx-auto opacity-80" />
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Search Your Order Status</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Log in to your Customer Account or enter your Order Number above to track real-time fulfillment status.
              </p>
            </div>
          </div>
        )}
      </main>

      <InvoiceModal
        isOpen={!!invoiceOrder}
        onClose={() => setInvoiceOrder(null)}
        order={invoiceOrder}
      />

      <CustomerFooter />
    </div>
  );
};
