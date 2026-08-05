import React from 'react';
import { Printer, Download, Sparkles, Building, Phone, Mail, MapPin } from 'lucide-react';
import { Order } from '../types';
import { Modal } from '../components/Modal';
import { formatCurrency } from '../utils/currency';

interface InvoiceModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, isOpen, onClose }) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Invoice #${order.order_number}`} maxWidth="4xl">
      <div className="space-y-8 p-4 sm:p-6 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans printable-area">
        {/* Print specific styles */}
        <style>{`
          @media print {
            body * { visibility: hidden; }
            .printable-area, .printable-area * { visibility: visible; }
            .printable-area { position: absolute; left: 0; top: 0; width: 100%; }
            .no-print { display: none !important; }
          }
        `}</style>

        {/* Invoice Top Header */}
        <div className="flex flex-col sm:flex-row items-start justify-between gap-6 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 p-1 flex items-center justify-center shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0">
              <img src="/logo.png" alt="Afsoo Company Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className="text-xl font-black font-outfit text-slate-900 dark:text-white">
                AFSOO HANDMADE & CRAFT STUDIO
              </h2>
              <p className="text-xs text-slate-500">Authentic Artisan Crafts & Goods</p>
              <p className="text-[11px] text-slate-400 mt-1">Afsoo Design Studio, Main Street</p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="inline-block px-3 py-1 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold text-xs uppercase tracking-wider rounded-full mb-2">
              Official Tax Invoice
            </span>
            <p className="text-sm font-bold font-mono text-slate-900 dark:text-white">
              INV-{order.order_number}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Date: {new Date(order.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Billed To / Shipped To Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-800">
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Customer Details
            </h4>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              {order.customer?.full_name || 'Valued Customer'}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>{order.customer?.email}</span>
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>{order.phone || order.customer?.phone || 'N/A'}</span>
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Shipping & Payment
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span>{order.shipping_address || 'Standard Shipping Address'}</span>
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 font-medium">
              Payment Method: <span className="font-semibold text-slate-900 dark:text-white">{order.payment_method}</span>
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 font-medium">
              Payment Status: <span className="font-semibold text-emerald-600">{order.payment_status}</span>
            </p>
          </div>
        </div>

        {/* Items Table */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-800/80 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Item & Description</th>
                <th className="py-3 px-4 text-center">Qty</th>
                <th className="py-3 px-4 text-right">Unit Price</th>
                <th className="py-3 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {order.order_items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                    {item.product_name}
                  </td>
                  <td className="py-3.5 px-4 text-center text-slate-700 dark:text-slate-300">
                    {item.quantity}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-700 dark:text-slate-300">
                    {formatCurrency(item.price)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                    {formatCurrency(item.price * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Invoice Totals & Breakdown */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-t border-slate-200 dark:border-slate-800 pt-6">
          <div className="max-w-xs text-xs text-slate-500">
            <p className="font-bold text-slate-700 dark:text-slate-300 mb-1">Thank you for choosing Afsoo!</p>
            <p>All items are genuine, eco-friendly, and crafted by hand with organic materials.</p>
          </div>

          <div className="w-full sm:w-72 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Subtotal</span>
              <span className="font-mono">{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Shipping Fee</span>
              <span className="font-mono">{formatCurrency(order.shipping)}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Tax Rate</span>
              <span className="font-mono">{formatCurrency(order.tax)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Discount Applied</span>
                <span className="font-mono">-{formatCurrency(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800 font-outfit">
              <span>Grand Total</span>
              <span className="text-amber-600 dark:text-amber-400 font-mono">{formatCurrency(order.total_amount)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 no-print border-t border-slate-100 dark:border-slate-800 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold text-xs flex items-center gap-2 shadow-md"
          >
            <Printer className="w-4 h-4" />
            <span>Print Invoice</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
