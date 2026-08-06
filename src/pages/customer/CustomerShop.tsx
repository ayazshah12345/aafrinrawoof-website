import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, Package, Heart, RefreshCw } from 'lucide-react';
import { api } from '../../api/client';
import { Product, Category } from '../../types';
import { ProductCard } from '../../components/ProductCard';
import { CardSkeleton } from '../../components/Skeleton';
import { CustomerNavbar } from '../../components/CustomerNavbar';
import { CustomerFooter } from '../../components/CustomerFooter';
import { useWishlist } from '../../context/WishlistContext';

export const CustomerShop: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { wishlist } = useWishlist();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [categoryId, setCategoryId] = useState<string>(searchParams.get('category') || '');
  const [sortBy, setSortBy] = useState<string>('latest');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const isWishlistMode = searchParams.get('wishlist') === 'true';

  useEffect(() => {
    const s = searchParams.get('search');
    if (s !== null) setSearch(s);
  }, [searchParams]);

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get('/categories')).data,
  });

  const categoryList: Category[] = Array.isArray(categoriesData)
    ? categoriesData
    : (categoriesData as any)?.items || [];

  // Fetch products
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['customer-shop-products', page, search, categoryId, minPrice, maxPrice, isWishlistMode],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '12');
      if (search) params.append('search', search);
      if (categoryId) params.append('category_id', categoryId);
      if (minPrice) params.append('min_price', minPrice);
      if (maxPrice) params.append('max_price', maxPrice);

      const res = await api.get(`/products?${params.toString()}`);
      return res.data;
    },
  });

  let products: Product[] = isWishlistMode ? wishlist : data?.items || [];

  // Sort products on client if needed
  if (sortBy === 'price_asc') {
    products = [...products].sort((a, b) => (a.discount_price || a.price) - (b.discount_price || b.price));
  } else if (sortBy === 'price_desc') {
    products = [...products].sort((a, b) => (b.discount_price || b.price) - (a.discount_price || a.price));
  } else if (sortBy === 'popular') {
    products = [...products].sort((a, b) => (b.is_bestseller ? 1 : 0) - (a.is_bestseller ? 1 : 0));
  }

  const handleResetFilters = () => {
    setSearch('');
    setCategoryId('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('latest');
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      <CustomerNavbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-black font-outfit tracking-tight">
              {isWishlistMode ? 'My Wishlist' : 'Shop Handmade Catalog'}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {isWishlistMode
                ? `Saved items in your wishlist (${wishlist.length} items)`
                : 'Browse our complete range of artisanal handcrafted products.'}
            </p>
          </div>

          {/* Reset Filters */}
          {(search || categoryId || minPrice || maxPrice || isWishlistMode) && (
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-amber-600 flex items-center gap-1.5 self-start md:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Clear Filters</span>
            </button>
          )}
        </div>

        {/* Filter & Sorting Controls Toolbar */}
        {!isWishlistMode && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                />
              </div>

              {/* Category Filter */}
              <div>
                <select
                  value={categoryId}
                  onChange={(e) => {
                    setCategoryId(e.target.value);
                    setPage(1);
                  }}
                  className="w-full py-2.5 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                >
                  <option value="">All Craft Categories</option>
                  {categoryList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Filter */}
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min ₹"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-1/2 py-2.5 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                />
                <span className="text-slate-400 text-xs">-</span>
                <input
                  type="number"
                  placeholder="Max ₹"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-1/2 py-2.5 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                />
              </div>

              {/* Sort By */}
              <div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full py-2.5 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white font-medium"
                >
                  <option value="latest">Sort by Latest Arrivals</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="popular">Popular & Bestsellers</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Product Catalog Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-16 text-center space-y-3">
            {isWishlistMode ? (
              <Heart className="w-12 h-12 text-slate-300 mx-auto" />
            ) : (
              <Package className="w-12 h-12 text-slate-300 mx-auto" />
            )}
            <h3 className="text-lg font-bold font-outfit text-slate-900 dark:text-white">
              {isWishlistMode ? 'Your Wishlist is Empty' : 'No Products Found'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {isWishlistMode
                ? 'Click the heart icon on any product to save it here for later.'
                : 'Try clearing your search terms or filters to view more products.'}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Pagination Controls */}
            {!isWishlistMode && data?.total_pages > 1 && (
              <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-800">
                <span className="text-xs text-slate-500 font-medium">
                  Page {data.page} of {data.total_pages} ({data.total} products)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                    className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    disabled={page >= data.total_pages}
                    onClick={() => setPage(page + 1)}
                    className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <CustomerFooter />
    </div>
  );
};
