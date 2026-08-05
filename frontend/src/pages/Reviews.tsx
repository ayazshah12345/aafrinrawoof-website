import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, Check, X, Trash2, MessageSquare } from 'lucide-react';
import { api } from '../api/client';
import { Review } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { TableSkeleton } from '../components/Skeleton';
import { Modal } from '../components/Modal';
import { useToast } from '../components/Toast';

export const Reviews: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [statusFilter, setStatusFilter] = useState('');
  const [replyReview, setReplyReview] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState('');

  const { data: reviews, isLoading } = useQuery<Review[]>({
    queryKey: ['reviews', statusFilter],
    queryFn: async () => {
      const url = statusFilter ? `/reviews?status=${statusFilter}` : '/reviews';
      return (await api.get(url)).data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, admin_reply }: { id: number; status: string; admin_reply?: string }) => {
      return (await api.patch(`/reviews/${id}/status`, { status, admin_reply })).data;
    },
    onSuccess: () => {
      toast('success', 'Review Moderated', 'Review status updated');
      setReplyReview(null);
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => (await api.delete(`/reviews/${id}`)).data,
    onSuccess: () => {
      toast('success', 'Review Deleted', 'Review removed');
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white font-outfit tracking-tight">
            Customer Reviews & Moderation
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Approve, reject, reply to, or delete customer product reviews.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {['', 'pending', 'approved', 'rejected'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize ${
                statusFilter === st
                  ? 'bg-amber-500 text-white'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {st === '' ? 'All Reviews' : st}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : (
        <div className="space-y-4">
          {reviews?.map((r) => (
            <div key={r.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">{r.customer_name}</span>
                    <span className="text-xs text-slate-400">({r.customer_email})</span>
                  </div>
                  <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
                    Product: {r.product?.name || `ID #${r.product_id}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={r.status} type="review" />
                  <div className="flex items-center text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < r.rating ? 'fill-current' : 'text-slate-300 dark:text-slate-700'}`} />
                    ))}
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl">
                "{r.comment}"
              </p>

              {r.admin_reply && (
                <div className="pl-4 border-l-2 border-amber-500 text-xs text-slate-600 dark:text-slate-400">
                  <span className="font-bold text-amber-600 dark:text-amber-400">Admin Reply:</span> {r.admin_reply}
                </div>
              )}

              <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3 text-xs">
                <span className="text-slate-400">{new Date(r.created_at).toLocaleDateString()}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateStatusMutation.mutate({ id: r.id, status: 'approved' })}
                    className="px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 font-semibold hover:bg-emerald-500/20 flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button
                    onClick={() => updateStatusMutation.mutate({ id: r.id, status: 'rejected' })}
                    className="px-3 py-1 rounded-xl bg-rose-500/10 text-rose-600 font-semibold hover:bg-rose-500/20 flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" /> Reject
                  </button>
                  <button
                    onClick={() => { setReplyReview(r); setReplyText(r.admin_reply || ''); }}
                    className="px-3 py-1 rounded-xl bg-sky-500/10 text-sky-600 font-semibold hover:bg-sky-500/20 flex items-center gap-1"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Reply
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(r.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply Modal */}
      <Modal isOpen={!!replyReview} onClose={() => setReplyReview(null)} title="Reply to Customer Review" maxWidth="md">
        <div className="space-y-4">
          <textarea
            rows={4}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write official store response..."
            className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
          />
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setReplyReview(null)} className="px-4 py-2 text-xs font-semibold text-slate-500">Cancel</button>
            <button
              onClick={() => replyReview && updateStatusMutation.mutate({ id: replyReview.id, status: replyReview.status, admin_reply: replyText })}
              className="px-4 py-2 rounded-xl bg-amber-500 text-white font-semibold text-xs shadow-md"
            >
              Post Reply
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
