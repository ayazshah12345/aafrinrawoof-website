import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Heart, Star, Sparkles } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { formatCurrency } from '../utils/currency';
import { GetProductModal } from './GetProductModal';
import { useToast } from './Toast';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const isLiked = isInWishlist(product.id);

  const hasDiscount = product.discount_price && product.discount_price > 0 && product.discount_price < product.price;
  const currentPrice = hasDiscount ? product.discount_price : product.price;
  const originalPrice = hasDiscount ? product.price : null;

  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discount_price!) / product.price) * 100)
    : null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart(product, 1);
    toast('success', 'Added to Cart', `1x ${product.name} added to cart`);
  };

  const handleGetProduct = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="group bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
        <div>
          {/* Product Image Box */}
          <div className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-slate-800">
            <Link to={`/product/${product.id}`}>
              <img
                src={product.images[0] || 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=600&auto=format&fit=crop&q=80'}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </Link>

            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
              {discountPercent && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-500 text-white uppercase tracking-wider shadow-md">
                  {discountPercent}% OFF
                </span>
              )}
              {product.is_featured && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500 text-white uppercase tracking-wider shadow-md">
                  Featured
                </span>
              )}
              {product.is_bestseller && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-600 text-white uppercase tracking-wider shadow-md">
                  Bestseller
                </span>
              )}
            </div>

            {/* Wishlist Button */}
            <button
              onClick={() => toggleWishlist(product)}
              className={`absolute top-3 right-3 p-2.5 rounded-full backdrop-blur-md shadow-md transition-transform active:scale-95 ${
                isLiked
                  ? 'bg-rose-500 text-white'
                  : 'bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-200 hover:bg-rose-500 hover:text-white'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-white' : ''}`} />
            </button>
          </div>

          {/* Info Content */}
          <div className="p-5 space-y-2">
            {/* Rating */}
            <div className="flex items-center gap-1 text-amber-500 text-xs">
              <Star className="w-3.5 h-3.5 fill-amber-500" />
              <span className="font-bold text-slate-900 dark:text-white">4.9</span>
              <span className="text-[10px] text-slate-400 font-normal">(Artisan Verified)</span>
            </div>

            {/* Title */}
            <Link to={`/product/${product.id}`} className="block">
              <h3 className="font-bold font-outfit text-slate-900 dark:text-white text-base line-clamp-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                {product.name}
              </h3>
            </Link>

            {/* Stock Status */}
            <p className="text-[11px] font-semibold">
              {product.stock > 0 ? (
                <span className={product.stock <= 5 ? 'text-rose-500 font-bold' : 'text-emerald-600'}>
                  {product.stock <= 5 ? `Low Stock (${product.stock} left)` : 'In Stock'}
                </span>
              ) : (
                <span className="text-slate-400">Out of Stock</span>
              )}
            </p>

            {/* Price */}
            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-lg font-extrabold text-slate-900 dark:text-white font-outfit">
                {formatCurrency(currentPrice)}
              </span>
              {originalPrice && (
                <span className="text-xs text-slate-400 line-through font-mono">
                  {formatCurrency(originalPrice)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons: 1. Get the product 2. Add to cart */}
        <div className="p-5 pt-0 grid grid-cols-2 gap-2">
          <button
            onClick={handleGetProduct}
            disabled={product.stock <= 0}
            className="py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-md shadow-amber-500/20 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Get the product</span>
          </button>

          <button
            onClick={handleAddToCart}
            disabled={product.stock <= 0}
            className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Add to cart</span>
          </button>
        </div>
      </div>

      {/* Get Product Modal */}
      <GetProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={product}
        initialQuantity={1}
      />
    </>
  );
};
