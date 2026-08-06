import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Printer, Eye, Download } from 'lucide-react';
import { api } from '../api/client';
import { TableSkeleton } from '../components/Skeleton';
import { InvoiceModal } from './InvoiceModal';
import { Order } from '../types';
import { formatCurrency } from '../utils/currency';
import { formatISTDateTime } from '../utils/date';

export const Invoices: React.FC = () => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => (await api.get('/invoices')).data,
  });

  const handleViewInvoice = async (orderId: number) => {
    const res = await api.get(`/orders/${orderId}`);
    setSelectedOrder(res.data);
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white font-outfit tracking-tight">
          Invoices Directory
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review, print, and download generated customer receipts & tax invoices.
        </p>
      </div>

      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : (!invoices || (Array.isArray(invoices) ? invoices.length : invoices?.items?.length) === 0) ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center">
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No invoices yet</h3>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-6">Invoice #</th>
                <th className="py-4 px-4">Order #</th>
                <th className="py-4 px-4">Customer Name</th>
                <th className="py-4 px-4">Issued Date</th>
                <th className="py-4 px-4">Amount</th>
                <th className="py-4 px-4">Payment Method</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
              {(Array.isArray(invoices) ? invoices : invoices?.items || []).map((inv: any) => (
                <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-4 px-6 font-mono font-bold text-amber-600 dark:text-amber-400">
                    {inv.invoice_number}
                  </td>
                  <td className="py-4 px-4 font-mono font-medium text-slate-700 dark:text-slate-300">
                    #{inv.order_number}
                  </td>
                  <td className="py-4 px-4 font-semibold text-slate-900 dark:text-white">
                    {inv.customer_name}
                  </td>
                  <td className="py-4 px-4 text-slate-500 font-mono text-[11px]">
                    {formatISTDateTime(inv.issued_date)}
                  </td>
                  <td className="py-4 px-4 font-bold text-slate-900 dark:text-white">
                    {formatCurrency(inv.amount)}
                  </td>
                  <td className="py-4 px-4 text-slate-600 dark:text-slate-300">
                    {inv.payment_method}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => handleViewInvoice(inv.order_id)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold text-xs hover:bg-amber-500/20 inline-flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View & Print</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <InvoiceModal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        order={selectedOrder}
      />
    </div>
  );
};
