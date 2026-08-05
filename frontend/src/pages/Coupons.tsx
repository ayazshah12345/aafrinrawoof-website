import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Ticket, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { api } from '../api/client';
import { Coupon } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { TableSkeleton } from '../components/Skeleton';
import { Modal } from '../components/Modal';
import { useToast } from '../components/Toast';
import { formatCurrency } from '../utils/currency';

export const Coupons: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState(10);
  const [minPurchase, setMinPurchase] = useState(50);
  const [maxUsage, setMaxUsage] = useState(100);
  const [isActive, setIsActive] = useState(true);

  const { data: coupons, isLoading } = useQuery<Coupon[]>({
    queryKey: ['coupons'],
    queryFn: async () => (await api.get('/coupons')).data,
  });

  const openCreate = () => {
    setEditingCoupon(null);
    setCode('');
    setDiscountType('percentage');
    setDiscountValue(10);
    setMinPurchase(50);
    setMaxUsage(100);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEdit = (cpn: Coupon) => {
    setEditingCoupon(cpn);
    setCode(cpn.code);
    setDiscountType(cpn.discount_type);
    setDiscountValue(cpn.discount_value);
    setMinPurchase(cpn.min_purchase);
    setMaxUsage(cpn.max_usage);
    setIsActive(cpn.is_active);
    setIsModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        code,
        discount_type: discountType,
        discount_value: Number(discountValue),
        min_purchase: Number(minPurchase),
        max_usage: Number(maxUsage),
        is_active: isActive,
      };
      if (editingCoupon) {
        return (await api.put(`/coupons/${editingCoupon.id}`, payload)).data;
      } else {
        return (await api.post('/coupons', payload)).data;
      }
    },
    onSuccess: () => {
      toast('success', 'Coupon Saved', `Coupon code ${code.toUpperCase()} stored successfully`);
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
    },
    onError: (err: any) => {
      toast('error', 'Error', err.response?.data?.detail || 'Failed to save coupon');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (id: number) => (await api.patch(`/coupons/${id}/toggle`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => (await api.delete(`/coupons/${id}`)).data,
    onSuccess: () => {
      toast('success', 'Deleted', 'Coupon deleted');
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
    },
  });

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white font-outfit tracking-tight">
            Coupons & Promotional Discounts
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Create discount codes, set minimum cart amounts, and limit usage counts.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm shadow-md shadow-amber-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Create Coupon</span>
        </button>
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-6">Coupon Code</th>
                <th className="py-4 px-4">Discount</th>
                <th className="py-4 px-4">Min Purchase</th>
                <th className="py-4 px-4">Usage</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
              {coupons?.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-4 px-6 font-mono font-bold text-amber-600 dark:text-amber-400 text-sm">
                    {c.code}
                  </td>
                  <td className="py-4 px-4 font-bold text-slate-900 dark:text-white">
                    {c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `₹${c.discount_value} OFF`}
                  </td>
                  <td className="py-4 px-4 text-slate-600 dark:text-slate-300">
                    {formatCurrency(c.min_purchase)}
                  </td>
                  <td className="py-4 px-4 font-medium text-slate-700 dark:text-slate-300">
                    {c.used_count} / {c.max_usage} used
                  </td>
                  <td className="py-4 px-4">
                    <button onClick={() => toggleMutation.mutate(c.id)} className="flex items-center gap-1.5">
                      {c.is_active ? <ToggleRight className="w-6 h-6 text-emerald-500" /> : <ToggleLeft className="w-6 h-6 text-slate-400" />}
                      <StatusBadge status={c.is_active ? 'Active' : 'Disabled'} />
                    </button>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(c)} className="p-2 text-slate-400 hover:text-amber-600">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteMutation.mutate(c.id)} className="p-2 text-slate-400 hover:text-rose-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Coupon Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCoupon ? 'Edit Coupon' : 'Create Coupon'} maxWidth="md">
        <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Coupon Code *
            </label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. WELCOME10"
              className="w-full px-3.5 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Discount Type
              </label>
              <select
                value={discountType}
                onChange={(e: any) => setDiscountType(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Discount Value *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={discountValue}
                onChange={(e) => setDiscountValue(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Minimum Cart Purchase (₹)
              </label>
              <input
                type="number"
                value={minPurchase}
                onChange={(e) => setMinPurchase(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Maximum Redemptions
              </label>
              <input
                type="number"
                value={maxUsage}
                onChange={(e) => setMaxUsage(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-amber-500 rounded"
              />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Enable Coupon</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-500">
              Cancel
            </button>
            <button type="submit" className="px-5 py-2 rounded-xl bg-amber-500 text-white font-semibold text-xs shadow-md">
              Save Coupon
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
