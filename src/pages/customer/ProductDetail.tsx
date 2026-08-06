import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ShoppingBag,
  Zap,
  Heart,
  Star,
  CheckCircle,
  ShieldCheck,
  Truck,
  ArrowLeft,
  Share2,
  Sparkles
} from 'lucide-react';
import { api } from '../../api/client';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { formatCurrency } from '../../utils/currency';
import { CustomerNavbar } from '../../components/CustomerNavbar';
import { CustomerFooter } from '../../components/CustomerFooter';
import { ProductCard } from '../../components/ProductCard';
import { GetProductModal } from '../../components/GetProductModal';
import { useToast } from '../../components/Toast';

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { toast } = useToast();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch product details
  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ['customer-product-detail', id],
    queryFn: async () => (await api.get(`/products/${id}`)).data,
  });

  // Fetch related products
  const { data: relatedData } = useQuery({
    queryKey: ['related-products', product?.category_id],
    queryFn: async () => (await api.get(`/products?limit=4`)).data,
    enabled: !!product,
  });

  if (isLoading || !product) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans">
        <CustomerNavbar />
        <div className="flex-1 flex items-center justify-center p-12">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <CustomerFooter />
      </div>
    );
  }

  const isLiked = isInWishlist(product.id);
  const images = product.images?.length ? product.images : ['https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800'];
  const activeImage = images[selectedImageIndex] || images[0];

  const hasDiscount = product.discount_price && product.discount_price > 0 && product.discount_price < product.price;
  const currentPrice = hasDiscount ? product.discount_price : product.price;
  const originalPrice = hasDiscount ? product.price : null;

  const handleBuyNow = () => {
    addToCart(product, quantity);
    navigate('/payment');
  };

  const handleAddToCart = () => {
    addToCart(product, quantity);
    toast('success', 'Added to Cart', `${quantity}x ${product.name} added`);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      <CustomerNavbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-16">
        {/* Back Link */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-amber-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Catalog</span>
        </button>

        {/* Main Product Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left Column: Image Gallery */}
          <div className="space-y-4">
            {/* Active Main Image */}
            <div className="relative aspect-square rounded-3xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
              <img
                src={activeImage}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {hasDiscount && (
                <span className="absolute top-4 left-4 px-3 py-1 bg-rose-500 text-white font-black text-xs uppercase tracking-wider rounded-full shadow-lg">
                  SALE
                </span>
              )}
            </div>

            {/* Thumbnail Selectors */}
            {images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all shrink-0 ${
                      selectedImageIndex === idx
                        ? 'border-amber-500 scale-105 shadow-md'
                        : 'border-slate-200 dark:border-slate-800 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Product Details & Buying Actions */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2">
                <Sparkles className="w-4 h-4" />
                <span>{product.category?.name || 'Afsoo Handmade Collection'}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold font-outfit text-slate-900 dark:text-white tracking-tight">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-2 mt-3">
                <div className="flex items-center text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-500" />
                  ))}
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-white">4.9 / 5.0</span>
                <span className="text-xs text-slate-400 font-medium">(28 Artisan Verified Reviews)</span>
              </div>
            </div>

            {/* Price Box */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-black font-outfit text-slate-900 dark:text-white">
                  {formatCurrency(currentPrice)}
                </span>
                {originalPrice && (
                  <span className="text-base text-slate-400 line-through font-mono">
                    {formatCurrency(originalPrice)}
                  </span>
                )}
              </div>
              <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1 pt-1">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Inclusive of all taxes & doorstep delivery options</span>
              </p>
            </div>

            {/* Stock Status */}
            <div>
              <p className="text-xs font-semibold">
                Availability Status:{' '}
                {product.stock > 0 ? (
                  <span className={product.stock <= 5 ? 'text-rose-500 font-bold' : 'text-emerald-600 font-bold'}>
                    {product.stock <= 5 ? `Low Stock Alert (${product.stock} units left)` : 'In Stock & Ready to Ship'}
                  </span>
                ) : (
                  <span className="text-slate-400 font-bold">Out of Stock</span>
                )}
              </p>
            </div>

            {/* Quantity Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Select Quantity
              </label>
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 overflow-hidden">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-4 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    -
                  </button>
                  <span className="px-5 py-2.5 text-sm font-bold text-slate-900 dark:text-white font-mono">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stock || 99, q + 1))}
                    className="px-4 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => toggleWishlist(product)}
                  className={`p-3 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors ${
                    isLiked ? 'bg-rose-500 text-white border-rose-500' : 'bg-white dark:bg-slate-900 text-slate-600 hover:text-rose-500'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isLiked ? 'fill-white' : ''}`} />
                </button>
              </div>
            </div>

            {/* Action Buttons: 1. Get the product 2. Add to cart */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <button
                onClick={() => setIsModalOpen(true)}
                disabled={product.stock <= 0}
                className="py-4 px-6 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-sm shadow-xl shadow-amber-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <Sparkles className="w-4 h-4" />
                <span>Get the product</span>
              </button>

              <button
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                className="py-4 px-6 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-extrabold text-sm transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-40"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Cart</span>
              </button>
            </div>

            {/* Get Product Modal */}
            <GetProductModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              product={product}
              initialQuantity={quantity}
            />

            {/* Value Guarantees */}
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-200 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>100% Quality Checked</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Truck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Express Pan-India Delivery</span>
              </div>
            </div>

            {/* Description Tab */}
            <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-outfit">
                Craftsmanship & Product Story
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                {product.description ||
                  'This exquisite handmade piece is crafted by local Indian artisans using traditional techniques passed down through generations. Made from premium eco-friendly materials, each item possesses unique subtle variations that celebrate its authentic hand-built origin.'}
              </p>
            </div>
          </div>
        </div>

        {/* RELATED PRODUCTS */}
        {relatedData?.items?.length > 0 && (
          <div className="space-y-6 pt-12 border-t border-slate-200 dark:border-slate-800">
            <h2 className="text-2xl font-extrabold font-outfit text-slate-900 dark:text-white">
              You Might Also Love
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedData.items.slice(0, 4).map((p: Product) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </main>

      <CustomerFooter />
    </div>
  );
};
