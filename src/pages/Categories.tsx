import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Layers, UploadCloud, Check } from 'lucide-react';
import { api } from '../api/client';
import { Category } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { TableSkeleton } from '../components/Skeleton';
import { Modal } from '../components/Modal';
import { useToast } from '../components/Toast';

export const Categories: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [sortOrder, setSortOrder] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch categories
  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => (await api.get('/categories')).data,
  });

  const openCreateModal = () => {
    setEditingCategory(null);
    setName('');
    setDescription('');
    setImageUrl('');
    setSortOrder((categories?.length || 0) + 1);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setDescription(cat.description || '');
    setImageUrl(cat.image_url || '');
    setSortOrder(cat.sort_order);
    setIsActive(cat.is_active);
    setIsModalOpen(true);
  };

  // Image Upload handler
  const handleImageUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    setIsUploading(true);
    try {
      const res = await api.post('/categories/upload-image', formData);
      setImageUrl(res.data.url);
      toast('success', 'Image Uploaded', 'Category image updated');
    } catch {
      toast('error', 'Upload Failed', 'Failed to upload category image');
    } finally {
      setIsUploading(false);
    }
  };

  // Save Category mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name,
        description,
        image_url: imageUrl,
        sort_order: Number(sortOrder),
        is_active: isActive,
      };
      if (editingCategory) {
        return (await api.put(`/categories/${editingCategory.id}`, payload)).data;
      } else {
        return (await api.post('/categories', payload)).data;
      }
    },
    onSuccess: () => {
      toast('success', 'Success', `Category ${editingCategory ? 'updated' : 'created'} successfully`);
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (err: any) => {
      toast('error', 'Error', err.response?.data?.detail || 'Failed to save category');
    },
  });

  // Delete Category mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => (await api.delete(`/categories/${id}`)).data,
    onSuccess: () => {
      toast('success', 'Deleted', 'Category removed successfully');
      setDeleteCategory(null);
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white font-outfit tracking-tight">
            Craft Categories
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Organize handmade items into dynamic craft categories.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm shadow-md shadow-amber-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Categories Table */}
      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : categories?.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center">
          <Layers className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No categories found</h3>
          <p className="text-xs text-slate-500 mt-1">Create your first craft category</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-6">Category</th>
                <th className="py-4 px-4">Slug</th>
                <th className="py-4 px-4">Sort Order</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
              {categories?.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <img
                        src={c.image_url || 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=150'}
                        alt={c.name}
                        className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                      />
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{c.name}</p>
                        <p className="text-[10px] text-slate-400 line-clamp-1">{c.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 font-mono text-slate-500">{c.slug}</td>
                  <td className="py-4 px-4 font-semibold text-slate-700 dark:text-slate-300">#{c.sort_order}</td>
                  <td className="py-4 px-4">
                    <StatusBadge status={c.is_active ? 'Active' : 'Inactive'} />
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(c)}
                        className="p-2 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteCategory(c)}
                        className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
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
      )}

      {/* Add / Edit Category Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Create New Category'}
        maxWidth="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Category Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ceramic Pottery"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description of this craft line..."
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Sort Order
              </label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Category Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                className="w-full text-xs text-slate-500 file:mr-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-500/10 file:text-amber-600"
              />
            </div>
          </div>

          {imageUrl && (
            <div className="flex items-center gap-3 pt-2">
              <img src={imageUrl} alt="Category Preview" className="w-12 h-12 rounded-xl object-cover" />
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Image Attached
              </span>
            </div>
          )}

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500"
              />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Active Category</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saveMutation.isPending || isUploading}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shadow-md shadow-amber-500/20"
            >
              {saveMutation.isPending ? 'Saving...' : 'Save Category'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={!!deleteCategory}
        onClose={() => setDeleteCategory(null)}
        title="Delete Category"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Are you sure you want to delete category <strong className="text-slate-900 dark:text-white">{deleteCategory?.name}</strong>?
          </p>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setDeleteCategory(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400"
            >
              Cancel
            </button>
            <button
              onClick={() => deleteCategory && deleteMutation.mutate(deleteCategory.id)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 text-white"
            >
              Confirm Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
