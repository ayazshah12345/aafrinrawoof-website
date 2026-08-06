import React from 'react';

export const CardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm animate-pulse space-y-4">
    <div className="flex items-center justify-between">
      <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded-md" />
      <div className="h-10 w-10 bg-slate-200 dark:bg-slate-800 rounded-xl" />
    </div>
    <div className="h-8 w-36 bg-slate-200 dark:bg-slate-800 rounded-lg" />
    <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded-md" />
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm animate-pulse">
    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
      <div className="h-6 w-40 bg-slate-200 dark:bg-slate-800 rounded-md" />
      <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg" />
    </div>
    <div className="divide-y divide-slate-100 dark:divide-slate-800">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 flex items-center justify-between gap-4">
          <div className="h-4 w-1/4 bg-slate-200 dark:bg-slate-800 rounded-md" />
          <div className="h-4 w-1/6 bg-slate-200 dark:bg-slate-800 rounded-md" />
          <div className="h-4 w-1/6 bg-slate-200 dark:bg-slate-800 rounded-md" />
          <div className="h-4 w-1/8 bg-slate-200 dark:bg-slate-800 rounded-md" />
        </div>
      ))}
    </div>
  </div>
);
