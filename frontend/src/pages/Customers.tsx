import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Users, Mail, Phone, MapPin, ShoppingBag, Eye, UserPlus, LogIn, Clock, Calendar, ShieldCheck, Filter, RefreshCw } from 'lucide-react';
import { api } from '../api/client';
import { Customer, Order, ActivityLog } from '../types';
import { TableSkeleton } from '../components/Skeleton';
import { Modal } from '../components/Modal';
import { formatCurrency } from '../utils/currency';
import { useToast } from '../components/Toast';

export const Customers: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'directory' | 'activity' | 'register'>('directory');
  const [search, setSearch] = useState('');
  const [logSearch, setLogSearch] = useState('');
  const [logActionFilter, setLogActionFilter] = useState<'ALL' | 'CUSTOMER_REGISTER' | 'CUSTOMER_LOGIN'>('ALL');
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);

  // Register Customer Form State
  const [regForm, setRegForm] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    city: '',
    country: 'India',
    postal_code: '',
  });

  // Query Customers List (Live Polling every 5s)
  const { data: customerData, isLoading: loadingCustomers, refetch: refetchCustomers } = useQuery({
    queryKey: ['customers', search],
    queryFn: async () => {
      const res = await api.get(`/customers?search=${encodeURIComponent(search)}`);
      return res.data;
    },
    refetchInterval: 5000,
  });

  // Query Customer Details & Order History
  const { data: customerDetails } = useQuery({
    queryKey: ['customer-detail', selectedCustomerId],
    queryFn: async () => {
      if (!selectedCustomerId) return null;
      const res = await api.get(`/customers/${selectedCustomerId}`);
      return res.data;
    },
    enabled: !!selectedCustomerId,
  });

  // Query Customer Auth Logs via /activity-logs (Live Polling every 3s)
  const { data: authLogsData, isLoading: loadingLogs, refetch: refetchLogs } = useQuery({
    queryKey: ['customer-auth-logs', logSearch, logActionFilter],
    queryFn: async () => {
      const res = await api.get('/activity-logs');
      const allLogs: ActivityLog[] = res.data || [];
      
      const filtered = allLogs.filter((l) => {
        const isCustomerEvent =
          l.action.includes('CUSTOMER') ||
          l.action.includes('Customer') ||
          l.entity_type === 'Customer';

        if (!isCustomerEvent) return false;

        if (logActionFilter !== 'ALL' && l.action !== logActionFilter) {
          return false;
        }

        if (logSearch) {
          const s = logSearch.toLowerCase();
          return (
            (l.details && l.details.toLowerCase().includes(s)) ||
            l.action.toLowerCase().includes(s) ||
            (l.entity_id && l.entity_id.toLowerCase().includes(s))
          );
        }

        return true;
      });

      return { logs: filtered };
    },
    refetchInterval: 3000,
  });

  // Admin Register Customer Mutation
  const registerMutation = useMutation({
    mutationFn: async (payload: typeof regForm) => {
      const res = await api.post('/customers', payload);
      return res.data;
    },
    onSuccess: (data: Customer) => {
      toast('success', 'Customer Registered', `Successfully created customer account for ${data.full_name}`);
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer-auth-logs'] });
      setRegForm({
        full_name: '',
        email: '',
        password: '',
        phone: '',
        address: '',
        city: '',
        country: 'India',
        postal_code: '',
      });
      setActiveTab('directory');
    },
    onError: (err: any) => {
      toast('error', 'Registration Failed', err.response?.data?.detail || 'Could not register customer');
    },
  });

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regForm.full_name || !regForm.email || !regForm.password) {
      toast('warning', 'Missing Fields', 'Please fill in Name, Email, and Password');
      return;
    }
    registerMutation.mutate(regForm);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white font-outfit tracking-tight">
            Customers & Auth Logs
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track live customer logins, registration events, account activity, and order history.
          </p>
        </div>

        {/* Tab Navigation Buttons */}
        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1.5 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm self-start md:self-auto">
          <button
            onClick={() => setActiveTab('directory')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'directory'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Registered Customers</span>
            {customerData?.total !== undefined && (
              <span className="ml-1 px-2 py-0.5 text-[10px] rounded-full bg-white/20 font-mono">
                {customerData.total}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('activity')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'activity'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Logins & Registrations</span>
            {authLogsData?.logs?.length !== undefined && (
              <span className="ml-1 px-2 py-0.5 text-[10px] rounded-full bg-white/20 font-mono">
                {authLogsData.logs.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('register')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'register'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* TAB 1: REGISTERED CUSTOMERS DIRECTORY */}
      {activeTab === 'directory' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm flex items-center justify-between gap-4">
            <div className="relative max-w-md w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search registered customers by name, email, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 dark:text-white"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => refetchCustomers()}
                title="Refresh Customer Directory"
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Live Refresh Active</span>
              </div>
            </div>
          </div>

          {loadingCustomers ? (
            <TableSkeleton rows={6} />
          ) : customerData?.items?.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center">
              <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">No registered customers found</h3>
              <p className="text-xs text-slate-500 mt-1">Try clearing your search or add a new customer.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-4 px-6">Customer</th>
                    <th className="py-4 px-4">Phone / City</th>
                    <th className="py-4 px-4">Registration Date</th>
                    <th className="py-4 px-4">Last Login</th>
                    <th className="py-4 px-4">Orders & Spend</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                  {customerData?.items?.map((c: Customer) => (
                    <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-600 font-bold flex items-center justify-center text-sm shadow-sm">
                            {c.full_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{c.full_name}</p>
                            <p className="text-[11px] text-slate-400 font-mono">{c.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-600 dark:text-slate-300">
                        <p>{c.phone || 'N/A'}</p>
                        <p className="text-[10px] text-slate-400">{c.city ? `${c.city}, ${c.country}` : 'N/A'}</p>
                      </td>
                      <td className="py-4 px-4 text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>{new Date(c.created_at).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {c.last_login ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium text-[11px]">
                            <LogIn className="w-3 h-3" />
                            <span>{new Date(c.last_login).toLocaleString()}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Never logged in</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-semibold text-slate-900 dark:text-white">{c.total_orders} orders</p>
                        <p className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(c.total_spent)}</p>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => setSelectedCustomerId(c.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 font-semibold text-xs hover:bg-amber-500/20 inline-flex items-center gap-1.5 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View History</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LOGINS & REGISTRATIONS ACTIVITY LOG STREAM */}
      {activeTab === 'activity' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative max-w-md w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search activity by customer email, name..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => refetchLogs()}
                title="Refresh Activity Stream"
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  {(['ALL', 'CUSTOMER_REGISTER', 'CUSTOMER_LOGIN'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setLogActionFilter(filter)}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                        logActionFilter === filter
                          ? 'bg-amber-500 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {filter === 'ALL' ? 'All Events' : filter === 'CUSTOMER_REGISTER' ? 'Registrations' : 'Logins'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {loadingLogs ? (
            <TableSkeleton rows={8} />
          ) : authLogsData?.logs?.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center">
              <Clock className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">No customer login or registration logs found</h3>
              <p className="text-xs text-slate-500 mt-1">Activity logs update automatically every 3 seconds as customers sign in.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-4 px-6">Date & Time</th>
                    <th className="py-4 px-4">Event Type</th>
                    <th className="py-4 px-4">Target Entity</th>
                    <th className="py-4 px-6">Customer Log Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                  {authLogsData?.logs?.map((log: ActivityLog) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-6 text-slate-500 font-mono">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="py-4 px-4">
                        {log.action === 'CUSTOMER_REGISTER' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Customer Registered</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold text-xs">
                            <LogIn className="w-3.5 h-3.5" />
                            <span>Customer Logged In</span>
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 font-semibold text-slate-700 dark:text-slate-300">
                        {log.entity_id ? `Customer #${log.entity_id}` : 'Customer'}
                      </td>
                      <td className="py-4 px-6 text-slate-800 dark:text-slate-200 font-semibold">
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: REGISTER NEW CUSTOMER FORM */}
      {activeTab === 'register' && (
        <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 lg:p-8 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white font-outfit">
              Register Customer Account
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Create a new customer account directly from the Admin Panel.
            </p>
          </div>

          <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={regForm.full_name}
                  onChange={(e) => setRegForm({ ...regForm, full_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="rahul@example.com"
                  value={regForm.email}
                  onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Password *</label>
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={regForm.password}
                  onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="+91 9876543210"
                  value={regForm.phone}
                  onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Street Address</label>
              <input
                type="text"
                placeholder="Flat / House No., Building, Street"
                value={regForm.address}
                onChange={(e) => setRegForm({ ...regForm, address: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">City</label>
                <input
                  type="text"
                  placeholder="City"
                  value={regForm.city}
                  onChange={(e) => setRegForm({ ...regForm, city: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Postal Code</label>
                <input
                  type="text"
                  placeholder="Postal Code"
                  value={regForm.postal_code}
                  onChange={(e) => setRegForm({ ...regForm, postal_code: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Country</label>
                <input
                  type="text"
                  value={regForm.country}
                  onChange={(e) => setRegForm({ ...regForm, country: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 dark:text-white"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('directory')}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={registerMutation.isPending}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-md shadow-amber-500/20 disabled:opacity-50 transition-all"
              >
                {registerMutation.isPending ? 'Registering Account...' : 'Register Customer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Customer Purchase Details & Profile Modal */}
      <Modal
        isOpen={!!selectedCustomerId}
        onClose={() => setSelectedCustomerId(null)}
        title="Customer Profile & Activity Details"
        maxWidth="2xl"
      >
        {customerDetails && (
          <div className="space-y-6 text-xs">
            <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
              <div className="w-12 h-12 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center text-lg shadow-md">
                {customerDetails.customer.full_name.charAt(0)}
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {customerDetails.customer.full_name}
                </h3>
                <p className="text-slate-500">{customerDetails.customer.email}</p>
                <p className="text-slate-500">{customerDetails.customer.phone || 'No phone provided'}</p>
              </div>
              <div className="text-right text-[11px] text-slate-500">
                <p>Registered: {new Date(customerDetails.customer.created_at).toLocaleDateString()}</p>
                {customerDetails.customer.last_login && (
                  <p className="text-emerald-600 font-medium mt-0.5">
                    Last login: {new Date(customerDetails.customer.last_login).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <p className="text-slate-500 uppercase font-semibold text-[10px]">Total Orders</p>
                <p className="text-xl font-bold text-amber-600 font-outfit">{customerDetails.customer.total_orders}</p>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-slate-500 uppercase font-semibold text-[10px]">Total Amount Spent</p>
                <p className="text-xl font-bold text-emerald-600 font-outfit">{formatCurrency(customerDetails.customer.total_spent)}</p>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">Past Order History</h4>
              {customerDetails.orders?.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400">
                  No orders placed yet by this customer.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                  {customerDetails.orders.map((o: Order) => (
                    <div key={o.id} className="p-3.5 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">#{o.order_number}</p>
                        <p className="text-slate-400">{new Date(o.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900 dark:text-white">{formatCurrency(o.total_amount)}</p>
                        <span className="text-[10px] font-semibold text-emerald-600">{o.order_status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
