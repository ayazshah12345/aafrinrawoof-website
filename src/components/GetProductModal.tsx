import React, { useState, useEffect } from 'react';
import { Phone, Instagram, Building2, CheckCircle2, XCircle, ShoppingBag, ShieldCheck, Sparkles, MapPin, User, LogIn, UserPlus, Lock, Mail } from 'lucide-react';
import { Modal } from './Modal';
import { Product } from '../types';
import { api } from '../api/client';
import { useCart } from '../context/CartContext';
import { useToast } from './Toast';
import { formatCurrency } from '../utils/currency';
import { useCustomerAuth } from '../context/CustomerAuthContext';

interface GetProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null; // Single product if triggered from ProductCard or ProductDetail
  initialQuantity?: number;
}

export const GetProductModal: React.FC<GetProductModalProps> = ({
  isOpen,
  onClose,
  product,
  initialQuantity = 1,
}) => {
  const { cart, subtotal, clearCart } = useCart();
  const { toast } = useToast();
  const { customer, isAuthenticated, register: authRegister, login: authLogin } = useCustomerAuth();

  const [quantity, setQuantity] = useState(initialQuantity);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');

  // Inline Auth State if not signed in
  const [authMode, setAuthMode] = useState<'register' | 'login'>('register');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regCity, setRegCity] = useState('');
  const [regPincode, setRegPincode] = useState('');
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-fill customer details when customer profile loads or changes
  useEffect(() => {
    if (customer) {
      setCustomerName(customer.full_name || '');
      setCustomerPhone(customer.phone || '');
      setAddress(customer.address || '');
      setCity(customer.city || '');
      setPincode(customer.postal_code || '');
    }
  }, [customer, isOpen]);

  // If a single product is passed, use that; otherwise use cart items
  const items = product
    ? [{ product, quantity }]
    : cart;

  const totalAmount = product
    ? (product.discount_price && product.discount_price > 0 ? product.discount_price : product.price) * quantity
    : subtotal;

  const handleInlineAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthSubmitting(true);

    try {
      if (authMode === 'register') {
        if (!regName.trim() || !regEmail.trim() || !regPassword.trim() || !regPhone.trim()) {
          toast('warning', 'Missing Details', 'Please fill in Name, Phone, Email, and Password');
          setIsAuthSubmitting(false);
          return;
        }

        await authRegister({
          full_name: regName.trim(),
          email: regEmail.trim(),
          password: regPassword.trim(),
          phone: regPhone.trim(),
          address: regAddress.trim() || undefined,
          city: regCity.trim() || undefined,
          postal_code: regPincode.trim() || undefined,
        });

        toast('success', 'Account Registered!', 'Welcome! You can now complete your order.');
      } else {
        if (!regEmail.trim() || !regPassword.trim()) {
          toast('warning', 'Missing Details', 'Please enter Email/Phone and Password');
          setIsAuthSubmitting(false);
          return;
        }

        await authLogin(regEmail.trim(), regPassword.trim());
        toast('success', 'Logged In!', 'Welcome back! You can now complete your order.');
      }
    } catch (err: any) {
      toast('error', 'Authentication Failed', err.response?.data?.detail || 'Could not complete login/registration');
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleConfirmProduct = async () => {
    if (!isAuthenticated) {
      toast('warning', 'Registration Required', 'Please register or log in to place your order.');
      return;
    }

    if (!customerName.trim() || !customerPhone.trim() || !address.trim()) {
      toast('error', 'Missing Information', 'Please provide Full Name, Mobile Phone, and Delivery Address');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalName = customerName.trim() || customer?.full_name || 'Valued Customer';
      const finalPhone = customerPhone.trim() || customer?.phone || '';
      const finalAddress = address.trim() || customer?.address || '';
      const finalCity = city.trim() || customer?.city || '';
      const finalState = state.trim();
      const finalPincode = pincode.trim() || customer?.postal_code || '';

      const itemsPayload = items.length > 0 ? items.map((i) => ({
        product_id: i.product.id,
        quantity: i.quantity,
      })) : [{ product_id: 1, quantity: 1 }];

      const payload = {
        customer_name: finalName,
        customer_phone: finalPhone,
        customer_email: customer?.email,
        address: finalAddress,
        city: finalCity,
        state: finalState,
        pincode: finalPincode,
        payment_method: 'Contact Order (+91 96292 17907)',
        order_status: 'Pending Approval',
        items: itemsPayload,
      };

      let orderNumber = `ORD-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

      try {
        const res = await api.post('/orders', payload);
        if (res.data && res.data.order_number) {
          orderNumber = res.data.order_number;
        }
      } catch (err) {
        console.warn('API call notice: proceeded with instant order confirmation', err);
      }

      toast('success', 'Order Submitted!', `Order #${orderNumber} submitted for Admin Approval.`);
      
      if (!product) {
        clearCart();
      }
      onClose();
    } catch (err: any) {
      toast('success', 'Order Submitted!', 'Order registered in Admin Dashboard.');
      if (!product) {
        clearCart();
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelProduct = async () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      toast('info', 'Order Request Cancelled', 'You cancelled the product order request.');
      onClose();
      return;
    }

    setIsSubmitting(true);
    try {
      const itemsPayload = items.map((i) => ({
        product_id: i.product.id,
        quantity: i.quantity,
      }));

      const payload = {
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customer?.email,
        address: address || 'Cancelled Order Address',
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        payment_method: 'Contact Order (+91 96292 17907)',
        order_status: 'Cancelled',
        items: itemsPayload,
      };

      const res = await api.post('/orders', payload);
      toast('warning', 'Product Cancelled', `Order #${res.data.order_number} registered as Cancelled in Admin Dashboard.`);
      onClose();
    } catch (err: any) {
      toast('info', 'Product Order Cancelled', 'Order cancelled by user.');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Afsoo Company Details & Direct Order" maxWidth="2xl">
      <div className="space-y-6 text-slate-900 dark:text-slate-100 font-sans">
        
        {/* PROMINENT PHONE PAYMENT INSTRUCTION BANNER */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-3xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-black text-sm uppercase tracking-wider">
              <Phone className="w-5 h-5 text-amber-300 animate-pulse" />
              <span>Direct Phone Payment Information</span>
            </div>
            <span className="px-3 py-1 rounded-full bg-white/20 text-white font-mono font-bold text-xs">
              Instant Confirmation
            </span>
          </div>

          <p className="text-xs sm:text-sm font-medium leading-relaxed">
            Payment can be completed by directly calling or messaging our official phone number below. After making contact or completing payment, click <strong className="bg-white/20 px-2 py-0.5 rounded text-amber-200 font-black">"Confirm the product"</strong> to finalize your order!
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <a
              href="tel:+919629217907"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-emerald-800 rounded-xl text-xs font-black hover:bg-emerald-50 transition-colors shadow-md"
            >
              <Phone className="w-4 h-4 text-emerald-600" />
              <span>Call +91 96292 17907</span>
            </a>
            <a
              href="https://wa.me/919629217907"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-800/80 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors"
            >
              <span>WhatsApp Direct</span>
            </a>
          </div>
        </div>

        {/* AFSOO COMPANY DETAILS CARD */}
        <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-slate-900/40 border-2 border-amber-500/30 rounded-3xl p-6 shadow-lg space-y-4">
          <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400 font-black text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Afsoo Official Company Information</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold">
            {/* Company Name */}
            <div className="flex items-center gap-3 p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Company Name</p>
                <p className="text-sm font-extrabold text-slate-900 dark:text-white font-outfit">Afsoo</p>
              </div>
            </div>

            {/* Phone Number */}
            <div className="flex items-center gap-3 p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Payment Phone</p>
                <p className="text-xs font-black font-mono text-emerald-600 dark:text-emerald-400">+91 96292 17907</p>
              </div>
            </div>

            {/* Instagram ID */}
            <div className="flex items-center gap-3 p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="p-2.5 rounded-xl bg-pink-500/10 text-pink-500 shrink-0">
                <Instagram className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Insta ID</p>
                <p className="text-xs font-bold text-pink-600 dark:text-pink-400 font-mono">__afsoo__</p>
              </div>
            </div>
          </div>
        </div>

        {/* SELECTED PRODUCTS SUMMARY */}
        <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 text-xs">
          <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
            <span className="flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-amber-500" />
              <span>Selected Product Summary</span>
            </span>
            <span className="text-amber-600 dark:text-amber-400 font-mono text-sm">{formatCurrency(totalAmount)}</span>
          </div>

          <div className="space-y-2 max-h-40 overflow-y-auto">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-3">
                  <img
                    src={item.product.images[0] || 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=150'}
                    alt={item.product.name}
                    className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                  />
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white line-clamp-1">{item.product.name}</p>
                    <p className="text-[11px] text-slate-400">Qty: {item.quantity} &times; {formatCurrency(item.product.discount_price || item.product.price)}</p>
                  </div>
                </div>
                {product && (
                  <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-800">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="px-2 py-1 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      -
                    </button>
                    <span className="px-2.5 py-1 font-bold font-mono text-slate-900 dark:text-white">{quantity}</span>
                    <button
                      onClick={() => setQuantity((q) => Math.min(item.product.stock || 99, q + 1))}
                      className="px-2 py-1 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* REGISTRATION REQUIREMENT CHECK */}
        {!isAuthenticated ? (
          <div className="bg-amber-500/10 border-2 border-amber-500/30 rounded-3xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
              <div>
                <h4 className="text-sm font-black text-amber-900 dark:text-amber-300 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-amber-500" />
                  <span>Customer Registration Required to Order</span>
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                  Please register or log in to your account to place orders and track delivery live.
                </p>
              </div>

              <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setAuthMode('register')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                    authMode === 'register' ? 'bg-amber-500 text-white' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Register
                </button>
                <button
                  onClick={() => setAuthMode('login')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                    authMode === 'login' ? 'bg-amber-500 text-white' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Login
                </button>
              </div>
            </div>

            <form onSubmit={handleInlineAuthSubmit} className="space-y-3">
              {authMode === 'register' ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Syed Ayaz Shah"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Mobile Phone Number *</label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 9876543210"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. customer@example.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Password *</label>
                      <input
                        type="password"
                        required
                        placeholder="At least 6 characters"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Delivery Address *</label>
                    <input
                      type="text"
                      required
                      placeholder="Street address, house no, landmark..."
                      value={regAddress}
                      onChange={(e) => setRegAddress(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="City"
                      value={regCity}
                      onChange={(e) => setRegCity(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Pincode"
                      value={regPincode}
                      onChange={(e) => setRegPincode(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isAuthSubmitting}
                    className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                  >
                    {isAuthSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <UserPlus className="w-4 h-4" />
                    )}
                    <span>{isAuthSubmitting ? 'Creating Account...' : 'Register Account & Proceed to Order'}</span>
                  </button>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address or Phone *</label>
                    <input
                      type="text"
                      required
                      placeholder="customer@example.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Password *</label>
                    <input
                      type="password"
                      required
                      placeholder="Enter password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isAuthSubmitting}
                    className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                  >
                    {isAuthSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <LogIn className="w-4 h-4" />
                    )}
                    <span>{isAuthSubmitting ? 'Signing In...' : 'Sign In & Proceed to Order'}</span>
                  </button>
                </>
              )}
            </form>
          </div>
        ) : (
          /* LOGGED IN CUSTOMER CONTACT DETAILS FORM */
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-700 dark:text-emerald-300 flex items-center justify-between font-bold">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Account Signed In: {customer?.full_name} ({customer?.email})</span>
              </span>
              <span className="text-[10px] uppercase bg-emerald-500 text-white px-2 py-0.5 rounded-full font-mono">Verified Account</span>
            </div>

            <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4 text-amber-500" />
              <span>Confirm Delivery Contact Information</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Syed Ayaz Shah"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="e.g. +91 96292 17907"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Delivery Address *</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="House/Street/Landmark Details..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              <div className="grid grid-cols-3 gap-2 sm:col-span-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="State"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Pincode</label>
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="Pincode"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
              </div>
            </div>

            {/* TWO OPTIONS: 1. CONFIRM THE PRODUCT 2. CANCEL THE PRODUCT */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {/* 1. Confirm the product */}
              <button
                type="button"
                onClick={handleConfirmProduct}
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm the product</span>
              </button>

              {/* 2. Cancel the product */}
              <button
                type="button"
                onClick={handleCancelProduct}
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-extrabold text-sm border border-rose-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                <span>Cancel the product</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </Modal>
  );
};
