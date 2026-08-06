import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, ArrowRight, Sparkles, ShieldCheck, Heart, Eye, CheckCircle2, 
  Truck, Award, Clock, Star, Gift, ChevronLeft, ChevronRight, Zap, Mail, RefreshCw, Headphones
} from 'lucide-react';
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
  const [emailSub, setEmailSub] = useState('');

  // Fetch Products
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['customer-home-products'],
    queryFn: async () => {
      const res = await api.get('/products?limit=12');
      return res.data;
    },
  });

  const products: Product[] = productsData?.items || [];
  const featuredProducts = products.slice(0, 4);
  const newArrivals = products.slice(4, 8);
  const trendingProducts = products.slice(8, 12);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailSub.trim()) {
      toast('success', 'Subscribed!', 'Thank you for subscribing to Afsoo exclusive offers.');
      setEmailSub('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      <CustomerNavbar />

      {/* PROMO BANNER STRIP */}
      <div className="bg-rose-50 dark:bg-rose-950/40 border-b border-rose-100 dark:border-rose-900/30 py-2 px-4 text-center">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-xs font-bold text-rose-600 dark:text-rose-400">
          <Sparkles className="w-4 h-4 animate-spin text-rose-500" />
          <span>IT'S SALE TIME! Get Up To 40% Off Handcrafted Items & Free Shipping Nationwide</span>
          <Sparkles className="w-4 h-4 text-rose-500 hidden sm:inline" />
        </div>
      </div>

      {/* 1. ASYMMETRIC HERO BANNER SECTION (Inspired by Reference) */}
      <section className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Hero Card (Left - 8 cols) */}
          <div className="lg:col-span-7 relative rounded-3xl overflow-hidden bg-gradient-to-br from-rose-100 via-rose-50 to-amber-50 dark:from-slate-900 dark:via-slate-800 dark:to-rose-950/40 border border-rose-200/60 dark:border-slate-800 p-8 sm:p-12 flex flex-col justify-between min-h-[380px] shadow-sm">
            <div className="space-y-4 max-w-md relative z-10">
              <span className="inline-block px-3 py-1 rounded-full bg-rose-500 text-white text-[11px] font-black uppercase tracking-wider shadow-sm">
                CRAFT & BEAUTY SPECIAL
              </span>
              <h1 className="text-3xl sm:text-5xl font-black font-outfit text-slate-900 dark:text-white tracking-tight leading-none">
                Surprises <br />
                <span className="text-rose-600 dark:text-rose-400 font-extrabold text-2xl sm:text-4xl">
                  Handcrafted gifts for your special ones
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
                100% authentic Indian handloom, organic crochet, & sustainable artisanal home crafts.
              </p>
              <div className="pt-2">
                <Link
                  to="/shop"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-rose-500/25 transition-all hover:scale-105"
                >
                  <span>Shop Now</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Decorative Image Container */}
            <div className="absolute right-4 bottom-4 w-44 sm:w-64 h-44 sm:h-64 rounded-full bg-rose-200/40 dark:bg-rose-900/20 blur-2xl pointer-events-none" />
            <img
              src="/logo.png"
              alt="Handcrafted Gift Box"
              className="absolute -right-4 -bottom-4 w-48 sm:w-64 h-48 sm:h-64 object-contain opacity-90 transition-transform hover:scale-105"
            />

            {/* Slider Dots/Arrows */}
            <div className="relative z-10 flex items-center gap-2 pt-6">
              <button aria-label="Previous slide" className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors shadow-sm">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button aria-label="Next slide" className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors shadow-sm">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Secondary Hero Card (Right - 5 cols) */}
          <div className="lg:col-span-5 relative rounded-3xl overflow-hidden bg-gradient-to-br from-amber-50 via-amber-100/50 to-orange-100/40 dark:from-slate-900 dark:via-slate-800 dark:to-amber-950/30 border border-amber-200/60 dark:border-slate-800 p-8 flex flex-col justify-between min-h-[380px] shadow-sm">
            <div className="space-y-3 max-w-xs relative z-10">
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest">
                Artisanal Apparel
              </span>
              <h2 className="text-2xl sm:text-3xl font-black font-outfit text-slate-900 dark:text-white leading-tight">
                Women Fashion & Handlooms
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                Unique crochet tops, handloom dupattas & custom crafted accessories.
              </p>
              <div className="pt-2">
                <Link
                  to="/shop?category=handloom"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-bold text-xs uppercase tracking-wider shadow-md transition-all"
                >
                  <span>Explore Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <div className="self-end relative z-10 pt-4">
              <div className="w-20 h-20 rounded-full bg-rose-500 text-white flex flex-col items-center justify-center shadow-lg shadow-rose-500/30 font-outfit cursor-pointer hover:scale-110 transition-transform">
                <span className="text-[10px] font-bold uppercase">Save Up To</span>
                <span className="text-lg font-black leading-none">40%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CIRCULAR CATEGORY PILLS (Reference Match) */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-black font-outfit text-slate-900 dark:text-white tracking-tight">
            Shop by Category
          </h2>
          <Link to="/shop" className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1">
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 sm:gap-6 text-center">
          {[
            { label: 'Gifts', cat: 'gifts', icon: Gift, color: 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400' },
            { label: 'Crochet Tops', cat: 'crochet', icon: Sparkles, color: 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400' },
            { label: 'Under ₹500', cat: 'budget', icon: Zap, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400' },
            { label: 'Jewelry', cat: 'jewelry', icon: Heart, color: 'bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400' },
            { label: 'Handloom', cat: 'handloom', icon: ShieldCheck, color: 'bg-sky-100 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400' },
            { label: 'Home Decor', cat: 'decor', icon: Award, color: 'bg-orange-100 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400' },
          ].map((item) => {
            const IconComp = item.icon;
            return (
              <Link
                key={item.cat}
                to={`/shop?category=${item.cat}`}
                className="group flex flex-col items-center gap-2.5 p-2 transition-transform hover:-translate-y-1"
              >
                <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full ${item.color} flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all border border-slate-200/50 dark:border-slate-800`}>
                  <IconComp className="w-8 h-8 sm:w-10 sm:h-10 group-hover:rotate-12 transition-transform" />
                </div>
                <span className="text-xs font-bold font-outfit text-slate-800 dark:text-slate-200 group-hover:text-rose-500 transition-colors">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 3. POPULAR PRODUCTS GRID */}
      <section className="py-10 bg-white dark:bg-slate-900 border-y border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-rose-500">Trending Now</span>
              <h2 className="text-2xl sm:text-3xl font-black font-outfit text-slate-900 dark:text-white">
                Popular Products
              </h2>
            </div>
            <Link
              to="/shop"
              className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1"
            >
              <span>See All Products</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-80 bg-slate-100 dark:bg-slate-800 rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4. OUR FEATURED OFFERS GRID (Inspired by Reference Round Image Cards) */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-6">
        <div className="text-center space-y-1">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-rose-500">Exclusive Deals</span>
          <h2 className="text-2xl sm:text-3xl font-black font-outfit text-slate-900 dark:text-white">
            Our Featured Offers
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { title: 'Save up to ₹500 on plushies & handmade crafts', cat: 'crochet', img: '/logo.png', bg: 'bg-amber-50 dark:bg-amber-950/30' },
            { title: 'Save up to ₹300 on artisanal fashion items', cat: 'handloom', img: '/logo.png', bg: 'bg-rose-50 dark:bg-rose-950/30' },
            { title: 'Save up to 20% on handcrafted home decor', cat: 'decor', img: '/logo.png', bg: 'bg-purple-50 dark:bg-purple-950/30' },
          ].map((offer, idx) => (
            <div
              key={idx}
              className={`p-8 rounded-3xl ${offer.bg} border border-slate-200/80 dark:border-slate-800 flex flex-col items-center text-center space-y-4 shadow-sm hover:shadow-md transition-all hover:-translate-y-1`}
            >
              <div className="w-36 h-36 rounded-full bg-white dark:bg-slate-800 p-4 shadow-md overflow-hidden flex items-center justify-center">
                <img src={offer.img} alt={offer.title} className="w-full h-full object-contain" />
              </div>
              <h3 className="text-base font-bold font-outfit text-slate-900 dark:text-white max-w-xs">
                {offer.title}
              </h3>
              <Link
                to={`/shop?category=${offer.cat}`}
                className="px-6 py-2.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-colors"
              >
                Buy Now
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* 5. MID-PAGE PROMOTIONAL RIBBON */}
      <section className="bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 text-white py-8 text-center shadow-inner">
        <div className="max-w-4xl mx-auto px-4 space-y-2">
          <span className="text-xs font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">
            DELICIOUS & SPECIAL GIFTS
          </span>
          <h2 className="text-2xl sm:text-4xl font-black font-outfit">
            Make Every Moment Special
          </h2>
          <p className="text-xs sm:text-sm text-rose-100 font-medium max-w-xl mx-auto">
            Explore authentic handloom sarees, customized crochet apparel, and eco-friendly home accents.
          </p>
          <div className="pt-2">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-white text-rose-600 font-black text-xs uppercase tracking-wider shadow-lg hover:bg-rose-50 transition-all"
            >
              <span>Explore Full Collection</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 6. NEW ARRIVALS GRID */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-rose-500">Fresh Additions</span>
            <h2 className="text-2xl sm:text-3xl font-black font-outfit text-slate-900 dark:text-white">
              New Arrivals
            </h2>
          </div>
          <Link to="/shop?sort=newest" className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1">
            <span>View All New</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-80 bg-slate-100 dark:bg-slate-800 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 7. VALUE PROPOSITION FEATURE CARDS */}
      <section className="py-12 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400 flex items-center justify-center mx-auto mb-2">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm font-outfit">Money Back Guarantee</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">100% satisfaction guaranteed or full refund.</p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400 flex items-center justify-center mx-auto mb-2">
                <Truck className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm font-outfit">Free Fast Shipping</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Free delivery on orders over ₹499 nationwide.</p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2">
                <Headphones className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm font-outfit">24/7 Customer Assistance</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Dedicated support team available anytime.</p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-400 flex items-center justify-center mx-auto mb-2">
                <Award className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm font-outfit">100% Authentic Indian Craft</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Directly sourced from verified traditional artisans.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. NEWSLETTER SUBSCRIPTION BOX */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="rounded-3xl bg-slate-900 text-white p-8 sm:p-12 text-center space-y-4 relative overflow-hidden shadow-2xl border border-slate-800">
          <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <span className="text-xs font-bold uppercase tracking-widest text-rose-400">Stay Connected</span>
          <h2 className="text-2xl sm:text-4xl font-black font-outfit">
            Get Exclusive Offers & Updates
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
            Subscribe to receive direct updates on handcrafted releases, festive coupon drops, & sales.
          </p>

          <form onSubmit={handleSubscribe} className="max-w-md mx-auto flex flex-col sm:flex-row gap-2 pt-2">
            <input
              type="email"
              required
              placeholder="Enter your email address..."
              value={emailSub}
              onChange={(e) => setEmailSub(e.target.value)}
              className="flex-1 px-5 py-3.5 rounded-full bg-slate-800 border border-slate-700 text-white text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <button
              type="submit"
              className="px-8 py-3.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-rose-500/25 transition-colors"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>

      <CustomerFooter />
    </div>
  );
};
