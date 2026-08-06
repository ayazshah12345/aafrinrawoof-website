import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, UploadCloud, X, CheckCircle2 } from 'lucide-react';
import { api } from '../api/client';
import { Product } from '../types';
import { useToast } from '../components/Toast';

const DEFAULT_PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=600&auto=format&fit=crop&q=80";

const productSchema = z.object({
  name: z.string().min(1, 'Product Name is required'),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Price must be 0 or greater'),
  discount_price: z.coerce.number().optional().default(0),
  stock: z.coerce.number().int().min(0, 'Stock cannot be negative'),
  is_featured: z.boolean().default(false),
  is_new_arrival: z.boolean().default(false),
  is_bestseller: z.boolean().default(false),
  is_active: z.boolean().default(true),
});

type ProductFormData = z.infer<typeof productSchema>;

export const ProductForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      is_active: true,
      is_featured: false,
      is_new_arrival: false,
      is_bestseller: false,
      stock: 10,
      price: 499,
      discount_price: 0,
    },
  });

  // Fetch existing product if edit mode
  useEffect(() => {
    if (isEdit) {
      api.get(`/products/${id}`).then((res) => {
        const p: Product = res.data;
        reset({
          name: p.name,
          description: p.description || '',
          price: p.price,
          discount_price: p.discount_price || 0,
          stock: p.stock,
          is_featured: p.is_featured,
          is_new_arrival: p.is_new_arrival,
          is_bestseller: p.is_bestseller,
          is_active: p.is_active,
        });
        setImages(p.images || []);
      });
    }
  }, [id, isEdit, reset]);

  // Instant Drag & Drop / File select upload with exact Base64 Data URL preservation
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);

    try {
      const readAsDataURL = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(file);
        });
      };

      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const url = await readAsDataURL(files[i]);
        newUrls.push(url);
      }

      setImages((prev) => [...prev, ...newUrls]);
      toast('success', 'Images Attached', `${newUrls.length} image(s) uploaded successfully`);
    } catch (e) {
      console.error('Image upload failed:', e);
      toast('error', 'Upload Failed', 'Could not process selected image files');
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);
    try {
      // Use uploaded images or fallback to default placeholder
      const finalImages = images.length > 0 ? images : [DEFAULT_PLACEHOLDER_IMAGE];
      const payload = { ...data, images: finalImages };

      if (isEdit) {
        await api.put(`/products/${id}`, payload);
        toast('success', 'Product Updated', `${data.name} was updated successfully`);
      } else {
        await api.post('/products', payload);
        toast('success', 'Product Published', `${data.name} published immediately`);
      }

      // Invalidate queries so catalog & dashboard update in real-time
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-summary'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-recent'] });

      navigate('/admin/products');
    } catch (err: any) {
      let msg = 'Failed to save product';
      if (typeof err.response?.data?.detail === 'string') {
        msg = err.response.data.detail;
      } else if (Array.isArray(err.response?.data?.detail)) {
        msg = err.response.data.detail.map((e: any) => `${e.loc?.slice(-1)[0] || 'field'}: ${e.msg}`).join(', ');
      }
      toast('error', 'Error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/products')}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white font-outfit tracking-tight">
            {isEdit ? 'Edit Product' : 'Quick Add Product'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Fill in details to publish immediately to Afsoo.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
          <h2 className="text-base font-bold text-slate-900 dark:text-white font-outfit border-b border-slate-100 dark:border-slate-800 pb-3">
            Product Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product Name */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Product Name *
              </label>
              <input
                type="text"
                {...register('name')}
                placeholder="e.g. Handmade Crochet Bag"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-amber-500/50 outline-none font-medium"
              />
              {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name.message}</p>}
            </div>

            {/* Price */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Price (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                {...register('price')}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-amber-500/50 outline-none font-medium"
              />
              {errors.price && <p className="text-xs text-rose-500 mt-1">{errors.price.message}</p>}
            </div>

            {/* Discount Price */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Discount Price (₹)
              </label>
              <input
                type="number"
                step="0.01"
                {...register('discount_price')}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-amber-500/50 outline-none font-medium"
              />
            </div>

            {/* Stock */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Stock Quantity *
              </label>
              <input
                type="number"
                {...register('stock')}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-amber-500/50 outline-none font-medium"
              />
              {errors.stock && <p className="text-xs text-rose-500 mt-1">{errors.stock.message}</p>}
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Description (Optional)
              </label>
              <textarea
                rows={3}
                {...register('description')}
                placeholder="Product specifications..."
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-amber-500/50 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Media & Images Upload */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white font-outfit border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
            <span>Product Images (Optional)</span>
            <span className="text-xs text-slate-400 font-normal">Instant Upload & Preview</span>
          </h2>

          {/* Drag & Drop Box */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleFileUpload(e.dataTransfer.files);
            }}
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-500 rounded-2xl p-6 text-center bg-slate-50/50 dark:bg-slate-800/30 transition-colors cursor-pointer"
          >
            <input
              type="file"
              multiple
              accept="image/*"
              id="image-upload"
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
            />
            <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center">
              <UploadCloud className="w-8 h-8 text-amber-500 mb-1" />
              <p className="text-xs font-bold text-slate-800 dark:text-white">
                Drag & Drop images or <span className="text-amber-600 underline">browse</span>
              </p>
            </label>
          </div>

          {/* Image Previews */}
          {images.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 pt-2">
              {images.map((url, i) => (
                <div key={i} className="relative group rounded-xl overflow-hidden ring-1 ring-slate-200 dark:ring-slate-700">
                  <img src={url} alt={`Upload ${i}`} className="w-full h-20 object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Toggles & Visibility */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" {...register('is_featured')} className="w-4 h-4 text-amber-500 rounded" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Featured</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" {...register('is_new_arrival')} className="w-4 h-4 text-amber-500 rounded" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">New Arrival</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" {...register('is_bestseller')} className="w-4 h-4 text-amber-500 rounded" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Bestseller</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" {...register('is_active')} className="w-4 h-4 text-amber-500 rounded" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Active</span>
            </label>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-4 pt-2">
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>{isSubmitting ? 'Saving...' : isEdit ? 'Update Product' : 'Publish Product'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
