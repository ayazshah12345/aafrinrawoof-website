import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, TrendingUp, IndianRupee, ShoppingBag, Calendar, FileSpreadsheet, FileText } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { api } from '../api/client';
import { useToast } from '../components/Toast';
import { formatCurrency } from '../utils/currency';

export const SalesAnalytics: React.FC = () => {
  const { toast } = useToast();

  const { data: summary } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: async () => (await api.get('/sales/summary')).data,
  });

  const { data: charts } = useQuery({
    queryKey: ['analytics-charts'],
    queryFn: async () => (await api.get('/sales/charts')).data,
  });

  const handleExport = (format: 'csv' | 'excel') => {
    toast('info', 'Exporting Report', `Downloading sales report in ${format.toUpperCase()} format...`);
    window.open(`/api/v1/sales/export?format=${format}`, '_blank');
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white font-outfit tracking-tight">
            Sales & Revenue Analytics (INR)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Deep dive revenue trends, top performing products, and exportable financial reports in ₹.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleExport('csv')}
            className="px-4 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-slate-800 font-semibold text-xs flex items-center gap-2 hover:bg-slate-800 shadow-sm"
          >
            <FileText className="w-4 h-4 text-amber-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => handleExport('excel')}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-xs flex items-center gap-2 hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Revenue Breakdown Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today's Revenue</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white font-outfit mt-2">
            {formatCurrency(summary?.today_revenue)}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Monthly Revenue</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-outfit mt-2">
            {formatCurrency(summary?.monthly_revenue)}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completed Orders</p>
          <p className="text-2xl font-bold text-emerald-600 font-outfit mt-2">
            {summary?.completed_orders} orders
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">All-Time Revenue</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white font-outfit mt-2">
            {formatCurrency(summary?.total_revenue)}
          </p>
        </div>
      </div>

      {/* Monthly Sales Revenue Chart */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 dark:text-white font-outfit mb-4">
          Annual Monthly Sales Revenue Breakdown in ₹ (2026)
        </h2>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={charts?.monthly_trend || []}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#33415520" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} tickFormatter={(v) => `₹${v}`} />
              <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', color: '#fff' }} formatter={(v: any) => [`₹${v}`, 'Revenue']} />
              <Bar dataKey="revenue" fill="#F59E0B" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Selling Products List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 dark:text-white font-outfit mb-4">
          Top Selling Products by Quantity & Revenue
        </h2>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {(charts?.top_products || []).map((tp: any, idx: number) => (
            <div key={idx} className="py-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-600 font-bold flex items-center justify-center">
                  #{idx + 1}
                </span>
                <span className="font-semibold text-slate-900 dark:text-white">{tp.name}</span>
              </div>
              <div className="text-right">
                <p className="font-bold text-slate-900 dark:text-white">{formatCurrency(tp.revenue)}</p>
                <p className="text-[10px] text-slate-400">{tp.sold} units sold</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
