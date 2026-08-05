import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { History, Shield } from 'lucide-react';
import { api } from '../api/client';
import { ActivityLog } from '../types';
import { TableSkeleton } from '../components/Skeleton';

export const ActivityLogs: React.FC = () => {
  const { data: logs, isLoading } = useQuery<ActivityLog[]>({
    queryKey: ['activity-logs'],
    queryFn: async () => (await api.get('/activity-logs')).data,
  });

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white font-outfit tracking-tight">
          Admin Audit Logs
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Complete security audit trail of administrative actions and system updates.
        </p>
      </div>

      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-6">Timestamp</th>
                <th className="py-4 px-4">Action</th>
                <th className="py-4 px-4">Target Entity</th>
                <th className="py-4 px-6">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
              {logs?.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-4 px-6 text-slate-400 font-mono">
                    {new Date(l.created_at).toLocaleString()}
                  </td>
                  <td className="py-4 px-4 font-bold text-amber-600 dark:text-amber-400">
                    {l.action}
                  </td>
                  <td className="py-4 px-4 font-medium text-slate-700 dark:text-slate-300">
                    {l.entity_type} {l.entity_id ? `#${l.entity_id}` : ''}
                  </td>
                  <td className="py-4 px-6 text-slate-600 dark:text-slate-400">
                    {l.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
