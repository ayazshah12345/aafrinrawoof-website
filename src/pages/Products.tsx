import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Package,
  AlertTriangle
} from 'lucide-react';
import { api } from '../api/client';
import { Product } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { TableSkeleton } from '../components/Skeleton';
import { Modal } from '../components/Modal';
import { QuickBuyModal } from '../components/QuickBuyModal';
import { useToast } from '../components/Toast';
import { formatCurrency } from '../utils/currency';
import { ShoppingBag } from 'lucide-react';

export const Products: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [lowStock, setLowStock] = useState(false);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [quickBuyProduct, setQuickBuyProduct] = useState<Product | null>(null);

  // Fetch paginated products
  const { data, isLoading } = useQuery({
    queryKey: ['products', page, search, lowStock],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '8');
      if (search) params.append('search', search);
      if (lowStock) params.append('low_stock', 'true');

      const res = await api.get(`/products?${params.toString()}`);
      return res.data;
    },
  });

  // Toggle Status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async (id: number) => (await api.patch(`/products/${id}/status`)).data,
    onSuccess: (updatedProduct: Product) => {
      toast('success', 'Status Updated', `${updatedProduct.name} is now ${updatedProduct.is_active ? 'Active' : 'Inactive'}`);
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  // Delete Product mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => (await api.delete(`/products/${id}`)).data,
    onSuccess: () => {
      toast('success', 'Product Deleted', 'Product was removed successfully');
      setDeleteProduct(null);
      queryClient.invalidateQueries();
    },
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white font-outfit tracking-tight">
            Products Catalog
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your handmade product inventory, pricing, stock levels, and media.
          </p>
        </div>
        <Link
          to="/admin/products/new"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm shadow-md shadow-amber-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search product by name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Low Stock Toggle */}
          <button
            onClick={() => {
              setLowStock(!lowStock);
              setPage(1);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all ${
              lowStock
                ? 'bg-rose-500/10 text-rose-600 border-rose-500/30 dark:bg-rose-950/60 dark:text-rose-300'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Low Stock Only</span>
          </button>
        </div>
      </div>

      {/* Products Table */}
      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : data?.items?.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center">
          <Package className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white font-outfit">No products found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Click Add Product to upload your first item</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Product Name</th>
                  <th className="py-4 px-4">Price (₹)</th>
                  <th className="py-4 px-4">Stock</th>
                  <th className="py-4 px-4">Badges</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                {data?.items?.map((p: Product) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.images[0] || 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=150'}
                          alt={p.name}
                          className="w-12 h-12 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                        />
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white line-clamp-1">{p.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">ID: #{p.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-bold text-slate-900 dark:text-white">
                      {formatCurrency(p.price)}
                      {p.discount_price ? (
                        <span className="ml-1 text-[10px] text-emerald-600 font-semibold line-through">
                          {formatCurrency(p.discount_price)}
                        </span>
                      ) : null}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`font-semibold ${
                          p.stock <= 5 ? 'text-rose-600 font-bold' : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {p.stock} units
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1">
                        {p.is_featured && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-semibold">
                            Featured
                          </span>
                        )}
                        {p.is_bestseller && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 font-semibold">
                            Bestseller
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => toggleStatusMutation.mutate(p.id)}
                        className="flex items-center gap-1.5 focus:outline-none"
                      >
                        {p.is_active ? (
                          <ToggleRight className="w-6 h-6 text-emerald-500" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-slate-400" />
                        )}
                        <StatusBadge status={p.is_active ? 'Active' : 'Inactive'} />
                      </button>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/admin/products/edit/${p.id}`}
                          className="p-2 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
                          title="Edit Product"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setDeleteProduct(p)}
                          className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Page {data?.page} of {data?.total_pages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= (data?.total_pages || 1)}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteProduct}
        onClose={() => setDeleteProduct(null)}
        title="Confirm Delete"
      >
        {deleteProduct && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <p>Are you sure you want to delete <strong>{deleteProduct.name}</strong>? This action cannot be undone.</p>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteProduct(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteProduct.id)}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700"
              >
                Delete Product
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Quick Buy & GPay QR Code Modal */}
      <QuickBuyModal
        product={quickBuyProduct}
        isOpen={!!quickBuyProduct}
        onClose={() => setQuickBuyProduct(null)}
      />
    </div>
  );
};
