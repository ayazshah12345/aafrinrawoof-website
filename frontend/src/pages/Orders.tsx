import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Filter, ShoppingBag, Eye, FileText, ChevronRight, Trash2 } from 'lucide-react';
import { api } from '../api/client';
import { Order } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { TableSkeleton } from '../components/Skeleton';
import { InvoiceModal } from './InvoiceModal';
import { Modal } from '../components/Modal';
import { useToast } from '../components/Toast';
import { formatCurrency } from '../utils/currency';

const STATUS_WORKFLOW = ['Completed', 'Pending Approval', 'Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled'];

export const Orders: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);

  // Fetch paginated orders
  const { data, isLoading } = useQuery({
    queryKey: ['orders', page, search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '8');
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);

      const res = await api.get(`/orders?${params.toString()}`);
      return res.data;
    },
  });

  // Order status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, newStatus }: { id: number; newStatus: string }) => {
      const payload: any = { order_status: newStatus };
      if (newStatus === 'Delivered') payload.payment_status = 'Paid';
      return (await api.patch(`/orders/${id}/status`, payload)).data;
    },
    onSuccess: (updated: Order) => {
      toast('success', 'Order Status Updated', `Order #${updated.order_number} status set to ${updated.order_status}`);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-summary'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-recent'] });
    },
  });

  // Delete Order mutation
  const deleteOrderMutation = useMutation({
    mutationFn: async (orderId: number) => {
      return (await api.delete(`/orders/${orderId}`)).data;
    },
    onSuccess: (data) => {
      toast('success', 'Order Deleted', data.message || 'Order deleted successfully');
      setSelectedOrder(null);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-summary'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-recent'] });
    },
    onError: (err: any) => {
      toast('error', 'Delete Failed', err.response?.data?.detail || 'Failed to delete order');
    },
  });

  const handleDeleteOrder = (orderId: number, orderNumber: string) => {
    if (window.confirm(`Are you sure you want to delete Order #${orderNumber}? This action cannot be undone.`)) {
      deleteOrderMutation.mutate(orderId);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white font-outfit tracking-tight">
            Orders Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track order fulfillment, update status workflow, and generate customer invoices.
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          <button
            onClick={() => { setStatusFilter(''); setPage(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              statusFilter === ''
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            All Orders
          </button>
          {STATUS_WORKFLOW.map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === s
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search order #, customer..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 dark:text-white"
          />
        </div>
      </div>

      {/* Orders Table */}
      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : data?.items?.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center">
          <ShoppingBag className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No orders found</h3>
          <p className="text-xs text-slate-500 mt-1">There are no orders matching your current filter.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Order ID</th>
                  <th className="py-4 px-4">Customer</th>
                  <th className="py-4 px-4">Date</th>
                  <th className="py-4 px-4">Amount</th>
                  <th className="py-4 px-4">Payment Method</th>
                  <th className="py-4 px-4">Payment Status</th>
                  <th className="py-4 px-4">Order Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                {data?.items?.map((o: Order) => (
                  <tr key={o.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-slate-900 dark:text-white">
                      #{o.order_number}
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-bold text-slate-900 dark:text-white">{o.customer?.full_name || 'Customer'}</p>
                      <p className="text-[11px] font-mono text-amber-600 dark:text-amber-400 font-semibold">{o.phone || o.customer?.phone}</p>
                      <p className="text-[10px] text-slate-400 line-clamp-1">{o.shipping_address}</p>
                    </td>
                    <td className="py-4 px-4 text-slate-500 dark:text-slate-400">
                      {new Date(o.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4 font-bold text-slate-900 dark:text-white">
                      {formatCurrency(o.total_amount)}
                    </td>
                    <td className="py-4 px-4 text-slate-600 dark:text-slate-300">
                      {o.payment_method}
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge status={o.payment_status} type="payment" />
                    </td>
                    <td className="py-4 px-4">
                      <select
                        value={o.order_status}
                        onChange={(e) => updateStatusMutation.mutate({ id: o.id, newStatus: e.target.value })}
                        className="px-2.5 py-1 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                      >
                        {STATUS_WORKFLOW.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {(o.order_status === 'Pending Approval' || o.order_status === 'Pending') && (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => updateStatusMutation.mutate({ id: o.id, newStatus: 'Confirmed' })}
                              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 transition-all"
                              title="Approve Order"
                            >
                              Approve Order
                            </button>
                            <button
                              onClick={() => updateStatusMutation.mutate({ id: o.id, newStatus: 'Cancelled' })}
                              className="px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs shadow-md shadow-rose-500/20 transition-all"
                              title="Cancel Order"
                            >
                              Cancel Order
                            </button>
                          </div>
                        )}
                        <button
                          onClick={() => setSelectedOrder(o)}
                          className="p-2 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                          title="View Order Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setInvoiceOrder(o)}
                          className="p-2 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/30"
                          title="View & Print Invoice"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteOrder(o.id, o.order_number)}
                          className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                          title="Delete Order"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500">Page {data?.page} of {data?.total_pages}</span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold text-slate-600 dark:text-slate-300 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= (data?.total_pages || 1)}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold text-slate-600 dark:text-slate-300 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Drawer Modal */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Order Details #${selectedOrder?.order_number}`}
        maxWidth="2xl"
      >
        {selectedOrder && (
          <div className="space-y-6 text-xs">
            <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
              <div>
                <p className="text-slate-400 uppercase font-semibold">Customer</p>
                <p className="font-bold text-sm text-slate-900 dark:text-white">{selectedOrder.customer?.full_name || 'Valued Customer'}</p>
                <p className="text-slate-500">{selectedOrder.customer?.email || 'customer@afsoo.com'}</p>
                <p className="text-slate-500">{selectedOrder.phone || selectedOrder.customer?.phone}</p>
              </div>
              <div>
                <p className="text-slate-400 uppercase font-semibold">Shipping Address & Payment</p>
                <p className="font-medium text-slate-800 dark:text-slate-200">{selectedOrder.shipping_address}</p>
                <p className="text-slate-400 mt-1 font-mono">Method: {selectedOrder.payment_method}</p>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">Purchased Items</h4>
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                {selectedOrder.order_items.map((item) => (
                  <div key={item.id} className="p-3 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{item.product_name}</p>
                      <p className="text-slate-400">Qty: {item.quantity} &times; {formatCurrency(item.price)}</p>
                    </div>
                    <p className="font-bold text-slate-900 dark:text-white">{formatCurrency(item.total)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800 pt-4">
              <div className="flex items-center gap-2 flex-wrap">
                {(selectedOrder.order_status === 'Pending Approval' || selectedOrder.order_status === 'Pending') && (
                  <>
                    <button
                      onClick={() => {
                        updateStatusMutation.mutate({ id: selectedOrder.id, newStatus: 'Confirmed' });
                        setSelectedOrder(null);
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md transition-all"
                    >
                      Approve Order
                    </button>
                    <button
                      onClick={() => {
                        updateStatusMutation.mutate({ id: selectedOrder.id, newStatus: 'Cancelled' });
                        setSelectedOrder(null);
                      }}
                      className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-md transition-all"
                    >
                      Cancel Order
                    </button>
                  </>
                )}

                <button
                  onClick={() => {
                    setInvoiceOrder(selectedOrder);
                    setSelectedOrder(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold flex items-center gap-2 transition-all shadow-md shadow-amber-500/20"
                >
                  <FileText className="w-4 h-4" />
                  <span>Generate Invoice</span>
                </button>

                <button
                  onClick={() => handleDeleteOrder(selectedOrder.id, selectedOrder.order_number)}
                  className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white border border-rose-500/30 font-semibold flex items-center gap-2 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Order</span>
                </button>
              </div>

              <div className="text-right">
                <p className="text-slate-500 font-medium">Total Amount Paid</p>
                <p className="text-xl font-bold font-outfit text-slate-900 dark:text-white">{formatCurrency(selectedOrder.total_amount)}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Printable Invoice Modal */}
      <InvoiceModal
        isOpen={!!invoiceOrder}
        onClose={() => setInvoiceOrder(null)}
        order={invoiceOrder}
      />
    </div>
  );
};
