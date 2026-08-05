import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Package, Clock, CheckCircle2, Truck, AlertCircle, FileText, ArrowRight, UserCheck, RefreshCw, ShoppingBag } from 'lucide-react';
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
  const { customer, isAuthenticated } = useCustomerAuth();
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
      if (q.toUpperCase().startsWith('ORD-')) {
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
          return res.data || [];
        } catch {
          return [];
        }
      }

      // Check if phone query
      try {
        const res = await api.get(`/orders/by-phone/${encodeURIComponent(q)}`);
        return res.data || [];
      } catch {
        return [];
      }
    },
    enabled: !!searchQuery,
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

        {/* Account Info Banner if logged in */}
        {isAuthenticated && customer && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 rounded-2xl p-4 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
                {customer.full_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white">Logged in as {customer.full_name}</p>
                <p className="text-slate-500 font-mono">{customer.email} • {customer.phone || 'No phone'}</p>
              </div>
            </div>
            <span className="hidden sm:inline-block px-3 py-1 bg-amber-500 text-white rounded-full font-bold text-[10px] uppercase">
              Auto Syncing Orders
            </span>
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
                        Placed on {new Date(order.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
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
                      <span>This order has been marked as Cancelled by Admin support. If you have questions, contact support at +91 7395 853 660.</span>
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
                      {order.order_items.map((item, i) => (
                        <div key={i} className="p-3 flex items-center justify-between text-xs">
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{item.product_name}</p>
                            <p className="text-slate-400">Qty: {item.quantity} &times; {formatCurrency(item.price)}</p>
                          </div>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            {formatCurrency(item.price * item.quantity)}
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
