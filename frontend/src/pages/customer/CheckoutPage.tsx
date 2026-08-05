import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, ArrowRight, ShieldCheck, MapPin, User, Phone, Mail, FileText } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../utils/currency';
import { CustomerNavbar } from '../../components/CustomerNavbar';
import { CustomerFooter } from '../../components/CustomerFooter';

const checkoutSchema = z.object({
  customer_name: z.string().optional(),
  customer_phone: z.string().optional(),
  customer_email: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  notes: z.string().optional(),
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;

import { useCustomerAuth } from '../../context/CustomerAuthContext';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { cart, subtotal } = useCart();
  const { customer, isAuthenticated } = useCustomerAuth();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: () => {
      try {
        const saved = sessionStorage.getItem('afsoo_checkout_info');
        if (saved) return JSON.parse(saved);
        if (customer) {
          return {
            customer_name: customer.full_name,
            customer_phone: customer.phone || '',
            customer_email: customer.email,
            address: customer.address || '',
            city: customer.city || '',
            pincode: customer.postal_code || '',
          };
        }
        return {};
      } catch {
        return {};
      }
    },
  });

  React.useEffect(() => {
    if (customer) {
      setValue('customer_name', customer.full_name);
      setValue('customer_email', customer.email);
      if (customer.phone) setValue('customer_phone', customer.phone);
      if (customer.address) setValue('address', customer.address);
      if (customer.city) setValue('city', customer.city);
      if (customer.postal_code) setValue('pincode', customer.postal_code);
    }
  }, [customer, setValue]);

  if (cart.length === 0) {
    navigate('/cart');
    return null;
  }

  const onSubmit = (data: CheckoutFormData) => {
    const finalData = {
      customer_name: data.customer_name?.trim() || 'Valued Customer',
      customer_phone: data.customer_phone?.trim() || '',
      customer_email: data.customer_email?.trim() || '',
      address: data.address?.trim() || '',
      city: data.city?.trim() || '',
      state: data.state?.trim() || '',
      pincode: data.pincode?.trim() || '',
      notes: data.notes?.trim() || '',
    };
    sessionStorage.setItem('afsoo_checkout_info', JSON.stringify(finalData));
    navigate('/payment');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      <CustomerNavbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
        <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <button
            onClick={() => navigate('/cart')}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-black font-outfit tracking-tight">Delivery & Shipping Address</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Enter your contact details and shipping address to proceed to UPI QR & Phone Payment.
            </p>
          </div>
        </div>

        {/* PROMINENT DIRECT PHONE PAYMENT NOTICE BANNER */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-3xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-black text-sm uppercase tracking-wider">
              <Phone className="w-5 h-5 text-amber-300 animate-pulse" />
              <span>Direct Phone Payment Information</span>
            </div>
            <span className="px-3 py-1 rounded-full bg-white/20 text-white font-mono font-bold text-xs">
              +91 7395 853 660
            </span>
          </div>

          <p className="text-xs sm:text-sm font-medium leading-relaxed">
            Payment can be done by contacting our phone number <strong className="bg-white/20 px-2 py-0.5 rounded text-amber-200 font-black">+91 7395 853 660</strong>. Enter your delivery address below and proceed to confirm your order!
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Input Fields Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
              <h2 className="text-base font-bold font-outfit text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-amber-500" />
                <span>Customer Contact Info</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    {...register('customer_name')}
                    placeholder="e.g. Ayaz Shah"
                    className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                  {errors.customer_name && <p className="text-xs text-rose-500 mt-1">{errors.customer_name.message}</p>}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Mobile Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      {...register('customer_phone')}
                      placeholder="e.g. 9876543210"
                      className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                  {errors.customer_phone && <p className="text-xs text-rose-500 mt-1">{errors.customer_phone.message}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Email Address (Optional)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      {...register('customer_email')}
                      placeholder="e.g. ayaz@example.com"
                      className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
              <h2 className="text-base font-bold font-outfit text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-500" />
                <span>Shipping Address</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Address Street */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Complete Street Address & Landmark *
                  </label>
                  <input
                    type="text"
                    {...register('address')}
                    placeholder="House/Flat No., Building, Street Name"
                    className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                  {errors.address && <p className="text-xs text-rose-500 mt-1">{errors.address.message}</p>}
                </div>

                {/* City */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    City *
                  </label>
                  <input
                    type="text"
                    {...register('city')}
                    placeholder="Enter city"
                    className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                  {errors.city && <p className="text-xs text-rose-500 mt-1">{errors.city.message}</p>}
                </div>

                {/* State */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    State *
                  </label>
                  <input
                    type="text"
                    {...register('state')}
                    placeholder="Enter state"
                    className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                  {errors.state && <p className="text-xs text-rose-500 mt-1">{errors.state.message}</p>}
                </div>

                {/* Pincode */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Pincode *
                  </label>
                  <input
                    type="text"
                    {...register('pincode')}
                    placeholder="Enter pincode"
                    className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white focus:ring-2 focus:ring-amber-500 outline-none font-mono"
                  />
                  {errors.pincode && <p className="text-xs text-rose-500 mt-1">{errors.pincode.message}</p>}
                </div>

                {/* Notes */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Order / Delivery Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    {...register('notes')}
                    placeholder="Special instructions for delivery..."
                    className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Order Summary */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold font-outfit text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                Items in Order ({cart.length})
              </h3>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-60 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div key={item.product.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="truncate max-w-[180px]">
                      <p className="font-semibold text-slate-900 dark:text-white truncate">{item.product.name}</p>
                      <p className="text-slate-400">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-bold font-mono text-slate-900 dark:text-white">
                      {formatCurrency((item.product.discount_price || item.product.price) * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-sm font-bold">
                <span>Subtotal Amount</span>
                <span className="text-amber-600 dark:text-amber-400 font-mono text-base">{formatCurrency(subtotal)}</span>
              </div>

              <button
                type="submit"
                className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-sm shadow-xl shadow-amber-500/25 transition-all flex items-center justify-center gap-2"
              >
                <span>Proceed to UPI Payment</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      </main>

      <CustomerFooter />
    </div>
  );
};
