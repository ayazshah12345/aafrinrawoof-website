import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Trash2, ArrowLeft, ArrowRight, ShoppingBag, ShieldCheck, Tag } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../utils/currency';
import { CustomerNavbar } from '../../components/CustomerNavbar';
import { CustomerFooter } from '../../components/CustomerFooter';
import { GetProductModal } from '../../components/GetProductModal';
import { api } from '../../api/client';
import { useToast } from '../../components/Toast';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateQuantity, clearCart, subtotal } = useCart();
  const { toast } = useToast();

  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch Store Settings for shipping charge
  const { data: settings } = useQuery({
    queryKey: ['settings-public'],
    queryFn: async () => (await api.get('/settings')).data,
  });

  const shippingCharge = settings?.shipping_charge || 15.0;
  const taxPercentage = settings?.tax_percentage || 8.5;

  const taxAmount = (subtotal - appliedDiscount) * (taxPercentage / 100);
  const grandTotal = Math.max(0, subtotal - appliedDiscount + shippingCharge + taxAmount);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    try {
      const res = await api.get(`/coupons/validate/${couponCode.trim().toUpperCase()}?subtotal=${subtotal}`);
      if (res.data.valid) {
        setAppliedDiscount(res.data.discount);
        toast('success', 'Coupon Applied', `Discount of ${formatCurrency(res.data.discount)} applied!`);
      }
    } catch (err: any) {
      toast('error', 'Invalid Coupon', err.response?.data?.detail || 'Coupon code is invalid or expired');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      <CustomerNavbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-black font-outfit tracking-tight">Shopping Cart</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Review your selected handmade treasures before proceeding to checkout.
            </p>
          </div>

          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs font-bold text-rose-500 hover:underline flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Cart</span>
            </button>
          )}
        </div>

        {cart.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-16 text-center space-y-4">
            <ShoppingBag className="w-16 h-16 text-slate-300 mx-auto" />
            <h2 className="text-xl font-bold font-outfit text-slate-900 dark:text-white">Your Cart is Empty</h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Explore our artisanal catalog and add unique handmade crafts to your cart.
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-500/20"
            >
              <span>Explore Shop Catalog</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Cart Items List */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm divide-y divide-slate-100 dark:divide-slate-800">
                {cart.map((item) => {
                  const p = item.product;
                  const price = p.discount_price && p.discount_price > 0 ? p.discount_price : p.price;
                  return (
                    <div key={p.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={p.images[0] || 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=150'}
                          alt={p.name}
                          className="w-16 h-16 rounded-2xl object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
                        />
                        <div>
                          <Link to={`/product/${p.id}`} className="font-bold text-slate-900 dark:text-white font-outfit text-sm hover:text-amber-600">
                            {p.name}
                          </Link>
                          <p className="text-xs text-slate-500 mt-0.5">{formatCurrency(price)} each</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between w-full sm:w-auto gap-6 self-end sm:self-center">
                        {/* Quantity controls */}
                        <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 overflow-hidden">
                          <button
                            onClick={() => updateQuantity(p.id, item.quantity - 1)}
                            className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                          >
                            -
                          </button>
                          <span className="px-3 py-1.5 text-xs font-bold font-mono dark:text-white">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(p.id, item.quantity + 1)}
                            className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                          >
                            +
                          </button>
                        </div>

                        {/* Total price for line item */}
                        <span className="font-bold text-slate-900 dark:text-white font-mono text-sm">
                          {formatCurrency(price * item.quantity)}
                        </span>

                        {/* Remove */}
                        <button
                          onClick={() => removeFromCart(p.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Link to="/shop" className="inline-flex items-center gap-2 text-xs font-bold text-amber-600 hover:underline pt-2">
                <ArrowLeft className="w-4 h-4" />
                <span>Continue Shopping</span>
              </Link>
            </div>

            {/* Order Summary Sidebar */}
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
                <h3 className="text-base font-bold font-outfit text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                  Order Summary
                </h3>

                {/* Coupon Code Input */}
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Coupon Code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white font-mono uppercase"
                    />
                  </div>
                  <button type="submit" className="px-4 py-2 bg-slate-900 text-white dark:bg-slate-800 text-xs font-bold rounded-xl hover:bg-slate-800">
                    Apply
                  </button>
                </form>

                {/* Breakdown */}
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Subtotal</span>
                    <span className="font-mono font-semibold">{formatCurrency(subtotal)}</span>
                  </div>
                  {appliedDiscount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Coupon Discount</span>
                      <span className="font-mono">-{formatCurrency(appliedDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold text-slate-900 dark:text-white pt-3 border-t border-slate-100 dark:border-slate-800 font-outfit">
                    <span>Total Payable Amount</span>
                    <span className="text-amber-600 dark:text-amber-400 font-mono text-lg">{formatCurrency(subtotal - appliedDiscount)}</span>
                  </div>
                </div>

                <button
                  onClick={() => setIsModalOpen(true)}
                  className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-sm shadow-xl shadow-amber-500/25 transition-all flex items-center justify-center gap-2"
                >
                  <span>Get Products via Contact</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 shrink-0" />
                <span>Direct contact order with Afsoo company details & fast delivery</span>
              </div>
            </div>
          </div>
        )}

        <GetProductModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </main>

      <CustomerFooter />
    </div>
  );
};
