import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, LogIn, ArrowLeft, ShieldCheck, UserCheck } from 'lucide-react';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { CustomerNavbar } from '../../components/CustomerNavbar';
import { CustomerFooter } from '../../components/CustomerFooter';
import { useToast } from '../../components/Toast';

export const CustomerLogin: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useCustomerAuth();
  const { toast } = useToast();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      toast('error', 'Required Fields', 'Please enter your email/phone and password');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(identifier.trim(), password);
      toast('success', 'Welcome Back!', 'Logged into your Afsoo Customer Account successfully.');
      navigate('/my-orders');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Login failed. Please check your credentials.';
      toast('error', 'Login Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      <CustomerNavbar />

      <main className="flex-1 max-w-md mx-auto px-4 py-12 w-full flex flex-col justify-center">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-2">
              <UserCheck className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black font-outfit tracking-tight text-slate-900 dark:text-white">
              Customer Account Login
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sign in to manage your orders, track live status, and shop faster.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider text-[11px]">
                Email Address or Phone Number
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. customer@example.com or 9876543210"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider text-[11px]">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-sm shadow-xl shadow-amber-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              <span>{isSubmitting ? 'Signing In...' : 'Sign In to My Account'}</span>
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500 space-y-2">
            <div>
              Don't have an account yet?{' '}
              <Link to="/customer/register" className="font-bold text-amber-600 dark:text-amber-400 hover:underline">
                Create a New Account
              </Link>
            </div>
            <div className="pt-2">
              <Link to="/admin/login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-amber-500 transition-colors">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Store Owner or Staff? Sign into Admin Portal</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <CustomerFooter />
    </div>
  );
};
