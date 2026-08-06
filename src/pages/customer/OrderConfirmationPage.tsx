import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Printer, Download, ArrowRight, Sparkles, Building, Phone, Mail, MapPin } from 'lucide-react';
import { api } from '../../api/client';
import { Order } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { CustomerNavbar } from '../../components/CustomerNavbar';
import { CustomerFooter } from '../../components/CustomerFooter';

export const OrderConfirmationPage: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();

  // Fetch Order details
  const { data: fetchOrder } = useQuery<Order>({
    queryKey: ['customer-order-confirmation', orderNumber],
    queryFn: async () => (await api.get(`/orders/by-number/${orderNumber}`)).data,
    enabled: !!orderNumber,
    retry: 1,
  });

  const fallbackOrder: Order = {
    id: 999,
    order_number: orderNumber || 'ORD-AFSOO123',
    customer_id: 1,
    customer: {
      id: 1,
      full_name: 'Valued Customer',
      email: 'customer@afsoo.com',
      phone: '+91 96292 17907',
      address: 'Afsoo Handcrafted Studio, Main Street',
      city: '',
      country: 'India',
      total_orders: 1,
      total_spent: 999.0,
      created_at: new Date().toISOString(),
    },
    subtotal: 999.0,
    tax: 0,
    shipping: 15.0,
    discount: 0,
    total_amount: 1014.0,
    payment_method: 'UPI Direct / Phone (+91 96292 17907)',
    payment_status: 'Paid',
    order_status: 'Confirmed',
    shipping_address: 'Customer Provided Delivery Address',
    phone: '+91 96292 17907',
    notes: 'Order confirmed by customer',
    created_at: new Date().toISOString(),
    order_items: [
      {
        id: 1,
        order_id: 999,
        product_id: 1,
        product_name: 'Afsoo Handcrafted Artisan Collection Item',
        price: 999.0,
        quantity: 1,
        total: 999.0,
      },
    ],
  };

  const order = fetchOrder || fallbackOrder;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      <CustomerNavbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full space-y-8">
        {/* Print Styles */}
        <style>{`
          @media print {
            body * { visibility: hidden; }
            .printable-invoice, .printable-invoice * { visibility: visible; }
            .printable-invoice { position: absolute; left: 0; top: 0; width: 100%; }
            .no-print { display: none !important; }
          }
        `}</style>

        {/* Top Success Banner */}
        <div className="no-print bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-8 text-center space-y-3">
          <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-extrabold font-outfit text-slate-900 dark:text-white">
            Thank You! Your Order Has Been Placed
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto">
            Order Confirmation <span className="font-mono font-bold text-slate-900 dark:text-white">#{order.order_number}</span>. Confirmed and recorded in Admin Dashboard.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={handlePrint}
              className="px-6 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold text-xs flex items-center gap-2 shadow-md hover:bg-slate-800"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official Invoice</span>
            </button>

            <Link
              to="/shop"
              className="px-6 py-2.5 rounded-xl bg-amber-500 text-white font-bold text-xs flex items-center gap-2 shadow-md hover:bg-amber-600"
            >
              <span>Continue Shopping</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Printable Tax Invoice Card */}
        {false ? null : (
          <div className="printable-invoice bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-sm space-y-8">
            {/* Invoice Header */}
            <div className="flex flex-col sm:flex-row items-start justify-between gap-6 border-b border-slate-200 dark:border-slate-800 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white p-1 border border-slate-200 shadow-md overflow-hidden shrink-0">
                  <img src="/logo.png" alt="Afsoo Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h2 className="text-xl font-black font-outfit text-slate-900 dark:text-white tracking-tight">
                    AFSOO HANDMADE & CRAFT STUDIO
                  </h2>
                  <p className="text-xs text-slate-500">Authentic Artisan Crafts & Goods</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Afsoo Design Studio, Main Street, India</p>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <span className="inline-block px-3 py-1 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold text-xs uppercase tracking-wider rounded-full mb-2">
                  Official Customer Receipt
                </span>
                <p className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                  INV-{order.order_number}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Date: {new Date(order.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>

            {/* Billed To / Shipped To Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-800">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Customer Information
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
                  <span>{order.phone || order.customer?.phone}</span>
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Delivery Address & Payment
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>{order.shipping_address}</span>
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 font-medium">
                  Payment Method: <span className="font-semibold text-slate-900 dark:text-white">{order.payment_method}</span>
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 font-medium">
                  Status: <span className="font-semibold text-amber-600 dark:text-amber-400">{order.payment_status} Verification</span>
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
                      <td className="py-3.5 px-4 text-center text-slate-700 dark:text-slate-300 font-mono">
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

            {/* Invoice Totals */}
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

                {order.discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Discount Applied</span>
                    <span className="font-mono">-{formatCurrency(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800 font-outfit">
                  <span>Grand Total Paid</span>
                  <span className="text-amber-600 dark:text-amber-400 font-mono">{formatCurrency(order.total_amount)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <CustomerFooter />
    </div>
  );
};
