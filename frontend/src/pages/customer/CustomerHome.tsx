import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowRight, Sparkles, ShieldCheck, Heart, Eye, CheckCircle2, Truck, Award, Clock } from 'lucide-react';
import { api } from '../../api/client';
import { Product } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { CustomerNavbar } from '../../components/CustomerNavbar';
import { CustomerFooter } from '../../components/CustomerFooter';
import { ProductCard } from '../../components/ProductCard';
import { useToast } from '../../components/Toast';

export const CustomerHome: React.FC = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { toast } = useToast();

  // Fetch Bestsellers / Active Products
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['customer-home-products'],
    queryFn: async () => {
      const res = await api.get('/products?limit=8');
      return res.data;
    },
  });

  const products: Product[] = productsData?.items || [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      <CustomerNavbar />

      {/* HERO BANNER SECTION */}
      <section className="relative overflow-hidden bg-slate-900 text-white pt-16 pb-24 border-b border-amber-500/20">
        {/* Glowing Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/40 opacity-90" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Hero Left Content */}
            <div className="space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                <span>Authentic Indian Artisanal Heritage</span>
              </div>

              <h1 className="text-4xl sm:text-5xl xl:text-6xl font-black font-outfit tracking-tight leading-tight">
                Handcrafted With <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500">Love & Passion</span>
              </h1>

              <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
                Discover exquisite handmade crochet creations, handloom textiles, and sustainable organic crafts studio products directly from traditional Indian artisans into your home.
              </p>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  to="/shop"
                  className="px-8 py-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-sm shadow-xl shadow-amber-500/25 transition-all flex items-center gap-2"
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span>Explore Shop Catalog</span>
                </Link>

                <Link
                  to="/my-orders"
                  className="px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-bold text-sm border border-white/20 transition-all flex items-center gap-2"
                >
                  <Clock className="w-5 h-5 text-amber-300" />
                  <span>Track Order Status</span>
                </Link>
              </div>
            </div>

            {/* Hero Right Visual Banner */}
            <div className="relative">
              <div className="relative mx-auto max-w-md rounded-3xl overflow-hidden shadow-2xl border-2 border-amber-500/30 bg-slate-800 p-2">
                <img
                  src="/logo.png"
                  alt="Afsoo Handcrafted Collection"
                  className="w-full h-80 object-cover rounded-2xl bg-white/90 p-4"
                />
                <div className="p-4 space-y-1">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">AFSOO CRAFTS STUDIO</span>
                  <h3 className="text-lg font-bold font-outfit text-white">Authentic Handcrafted Masterpieces</h3>
                  <p className="text-xs text-slate-300">100% Eco-Friendly • Organic Materials • Skilled Artisans</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRACK ORDER PROMINENT BANNER SECTION */}
      <section className="bg-gradient-to-r from-amber-500 to-amber-600 text-white py-6 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-base font-extrabold font-outfit">Already Placed an Order?</h3>
              <p className="text-xs text-amber-100 font-medium">Check real-time fulfillment status updated live by Admin.</p>
            </div>
          </div>

          <Link
            to="/my-orders"
            className="px-6 py-3 bg-white text-amber-900 font-black text-xs rounded-xl hover:bg-amber-50 transition-colors shadow-md flex items-center gap-2"
          >
            <span>Go to Order Status Page</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* CRAFT CATEGORIES SECTION */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Curated Collections</span>
          <h2 className="text-3xl font-black font-outfit text-slate-900 dark:text-white">Shop By Craft Category</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { title: 'Handmade Crochet', desc: 'Custom tops, bags & accessories', cat: 'crochet', bg: 'from-amber-500/20 to-orange-500/20' },
            { title: 'Handloom Textiles', desc: 'Woven sarees, dupattas & fabrics', cat: 'handloom', bg: 'from-emerald-500/20 to-teal-500/20' },
            { title: 'Ceramic Artware', desc: 'Hand-painted pottery & tableware', cat: 'ceramic', bg: 'from-sky-500/20 to-blue-500/20' },
            { title: 'Organic Home Decor', desc: 'Eco-friendly sustainable crafts', cat: 'decor', bg: 'from-purple-500/20 to-pink-500/20' },
          ].map((c) => (
            <Link
              key={c.cat}
              to={`/shop?category=${c.cat}`}
              className={`p-6 rounded-3xl bg-gradient-to-br ${c.bg} border border-slate-200 dark:border-slate-800 hover:border-amber-500 transition-all hover:scale-[1.02] shadow-sm space-y-3 group`}
            >
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center font-bold text-amber-600 dark:text-amber-400 shadow-md">
                <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              </div>
              <h3 className="text-lg font-bold font-outfit text-slate-900 dark:text-white">{c.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{c.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED BESTSELLERS GRID */}
      <section className="py-12 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Featured Products</span>
              <h2 className="text-3xl font-black font-outfit text-slate-900 dark:text-white">Artisanal Bestsellers</h2>
            </div>

            <Link
              to="/shop"
              className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
            >
              <span>View All Products</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-80 bg-slate-100 dark:bg-slate-800 rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {products.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* TRUST BADGES SECTION */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-2">
            <ShieldCheck className="w-8 h-8 text-amber-500 mx-auto" />
            <h4 className="font-bold text-slate-900 dark:text-white">100% Eco-Friendly Materials</h4>
            <p className="text-xs text-slate-500">Every product is handcrafted using sustainable organic cotton & threads.</p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-2">
            <Award className="w-8 h-8 text-amber-500 mx-auto" />
            <h4 className="font-bold text-slate-900 dark:text-white">Direct Indian Artisans</h4>
            <p className="text-xs text-slate-500">Empowering skilled weavers & crochet craftswomen directly across India.</p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-2">
            <Truck className="w-8 h-8 text-amber-500 mx-auto" />
            <h4 className="font-bold text-slate-900 dark:text-white">Express Nationwide Shipping</h4>
            <p className="text-xs text-slate-500">Fast delivery across all Indian pincodes with live order status tracking.</p>
          </div>
        </div>
      </section>

      <CustomerFooter />
    </div>
  );
};
