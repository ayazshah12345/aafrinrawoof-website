import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Heart, Search, Moon, Sun, Menu, X, ShieldCheck, Clock, User, LogOut, LogIn, UserPlus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useTheme } from '../context/ThemeContext';
import { useCustomerAuth } from '../context/CustomerAuthContext';

export const CustomerNavbar: React.FC = () => {
  const navigate = useNavigate();
  const { totalItems } = useCart();
  const { totalWishlistItems } = useWishlist();
  const { theme, toggleTheme } = useTheme();
  const { customer, isAuthenticated, logout } = useCustomerAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      {/* Top Banner Announcement */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-white text-[11px] font-semibold py-1.5 px-4 text-center tracking-wide flex items-center justify-center gap-2 shadow-inner">
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>100% Authentic Indian Artisanal Craftsmanship | Free Express Shipping Across India</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo & Name */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-800 p-1 shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
              <img src="/logo.png" alt="Afsoo Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-xl font-black font-outfit text-slate-900 dark:text-white tracking-tight">
                AFSOO
              </span>
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 -mt-1">
                Crafts Studio
              </p>
            </div>
          </Link>

          {/* Desktop Main Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 font-outfit">
            <Link to="/" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
              Home
            </Link>
            <Link to="/shop" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
              Shop Catalog
            </Link>
            <Link to="/my-orders" className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 hover:text-amber-700 font-black transition-colors bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded-xl border border-amber-500/20">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Order Status</span>
            </Link>
          </nav>

          {/* Search Bar & Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Real-time Search */}
            <form onSubmit={handleSearch} className="hidden lg:relative lg:block w-56">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full focus:outline-none focus:ring-2 focus:ring-amber-500/50 dark:text-white"
              />
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </form>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2.5 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Wishlist Button */}
            <Link
              to="/shop?wishlist=true"
              className="relative p-2.5 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="My Wishlist"
            >
              <Heart className="w-5 h-5" />
              {totalWishlistItems > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {totalWishlistItems}
                </span>
              )}
            </Link>

            {/* Shopping Cart Button */}
            <Link
              to="/cart"
              className="relative p-2.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20 transition-all flex items-center justify-center"
              title="View Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-slate-900 text-white rounded-full text-[11px] font-bold flex items-center justify-center border-2 border-white dark:border-slate-900">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* CUSTOMER AUTH USER BUTTON */}
            {isAuthenticated && customer ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-xs font-bold text-slate-900 dark:text-white"
                >
                  <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-[11px]">
                    {customer.full_name.charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-[100px] truncate hidden sm:inline">{customer.full_name.split(' ')[0]}</span>
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl py-2 z-50 text-xs font-sans">
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                      <p className="font-bold text-slate-900 dark:text-white truncate">{customer.full_name}</p>
                      <p className="text-slate-400 text-[10px] truncate">{customer.email}</p>
                    </div>
                    <Link
                      to="/my-orders"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-slate-700 dark:text-slate-200"
                    >
                      <Clock className="w-4 h-4 text-amber-500" />
                      <span>My Order Status</span>
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left flex items-center gap-2 px-4 py-2.5 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 font-semibold"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  to="/customer/login"
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5 text-amber-500" />
                  <span>Login</span>
                </Link>
                <Link
                  to="/customer/register"
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register</span>
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 dark:text-slate-300"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 pt-2 pb-6 space-y-3 font-outfit">
          <form onSubmit={handleSearch} className="relative w-full mb-3">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
            />
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </form>

          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-semibold text-slate-800 dark:text-white"
          >
            Home Page
          </Link>
          <Link
            to="/shop"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-semibold text-slate-800 dark:text-white"
          >
            Shop Catalog
          </Link>
          <Link
            to="/my-orders"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-bold text-amber-600 dark:text-amber-400"
          >
            Order Status & Tracking
          </Link>

          {!isAuthenticated ? (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex gap-2">
              <Link
                to="/customer/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 py-2.5 text-center text-xs font-bold bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white"
              >
                Log In
              </Link>
              <Link
                to="/customer/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 py-2.5 text-center text-xs font-bold bg-amber-500 text-white rounded-xl"
              >
                Register
              </Link>
            </div>
          ) : (
            <button
              onClick={() => {
                logout();
                setMobileMenuOpen(false);
              }}
              className="w-full text-left py-2 text-xs font-bold text-rose-600"
            >
              Sign Out ({customer?.full_name})
            </button>
          )}
        </div>
      )}
    </header>
  );
};
