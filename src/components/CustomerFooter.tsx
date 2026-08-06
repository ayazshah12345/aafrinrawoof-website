import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Heart, ShieldCheck, Truck, RefreshCw, Phone, Mail, MapPin } from 'lucide-react';

export const CustomerFooter: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 font-sans border-t border-slate-800 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Trust Value Propositions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-12 border-b border-slate-800">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-800/40 border border-slate-800">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white font-outfit">100% Handmade</h4>
              <p className="text-xs text-slate-400">Crafted by master artisans</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-800/40 border border-slate-800">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white font-outfit">Pan-India Express</h4>
              <p className="text-xs text-slate-400">Fast doorstep delivery</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-800/40 border border-slate-800">
            <div className="p-3 rounded-xl bg-sky-500/10 text-sky-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white font-outfit">Secure UPI Pay</h4>
              <p className="text-xs text-slate-400">Instant QR Code payment</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-800/40 border border-slate-800">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white font-outfit">Quality Verified</h4>
              <p className="text-xs text-slate-400">Authentic materials guaranteed</p>
            </div>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white p-1 overflow-hidden shrink-0">
                <img src="/logo.png" alt="Afsoo Logo" className="w-full h-full object-contain" />
              </div>
              <span className="text-xl font-extrabold font-outfit text-white tracking-tight">AFSOO</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Afsoo Crafts Studio is dedicated to bringing authentic, eco-friendly, and beautifully handcrafted treasures into your home. Each creation carries the passion and tradition of skilled Indian artisans.
            </p>
          </div>

          {/* Navigation Links */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider font-outfit mb-4">Quick Links</h4>
            <ul className="space-y-2.5 text-xs text-slate-400 font-medium">
              <li><Link to="/" className="hover:text-amber-400 transition-colors">Home Page</Link></li>
              <li><Link to="/shop" className="hover:text-amber-400 transition-colors">Shop Catalog</Link></li>
              <li><Link to="/my-orders" className="hover:text-amber-400 font-bold transition-colors">Track Order Status</Link></li>
              <li><Link to="/customer/login" className="hover:text-amber-400 transition-colors">Customer Login / Register</Link></li>
              <li><Link to="/admin/login" className="hover:text-amber-400 transition-colors">Admin Portal</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider font-outfit mb-4">Craft Categories</h4>
            <ul className="space-y-2.5 text-xs text-slate-400 font-medium">
              <li><Link to="/shop?category=crochet" className="hover:text-amber-400 transition-colors">Handmade Crochet</Link></li>
              <li><Link to="/shop?category=handloom" className="hover:text-amber-400 transition-colors">Handloom Textiles</Link></li>
              <li><Link to="/shop?category=pottery" className="hover:text-amber-400 transition-colors">Artisan Pottery</Link></li>
              <li><Link to="/shop?category=jewelry" className="hover:text-amber-400 transition-colors">Beaded Jewelry</Link></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider font-outfit mb-4">Contact Studio</h4>
            <ul className="space-y-3 text-xs text-slate-400 font-medium">
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-mono font-bold text-white">+91 96292 17907</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                <span>support@afsoo.com</span>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>Afsoo Design Studio, Insta: @__afsoo__</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 border-t border-slate-800 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} AFSOO Crafts Studio. All rights reserved.</p>
          <div className="flex items-center gap-1 text-slate-400">
            <span>Handcrafted with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>for authentic craft lovers</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
