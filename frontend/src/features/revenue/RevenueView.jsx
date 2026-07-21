import React, { useEffect, useState } from 'react';
import { api } from '../../config/axios';
import { TrendingUp, DollarSign, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const RevenueView = () => {
  const [data, setData] = useState({ items: [], totalRevenue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRevenue = async () => {
      try {
        const res = await api.get('/revenue');
        setData(res.data || { items: [], totalRevenue: 0 });
      } catch (err) {
        toast.error('Failed to load revenue sharing log');
      } finally {
        setLoading(false);
      }
    };
    loadRevenue();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white font-['Outfit']">Revenue Sharing & Margin Engine</h2>
          <p className="text-xs text-slate-400">Hierarchical revenue distributions and profit margins</p>
        </div>
      </div>

      {/* KPI Card */}
      <div className="glass-card p-6 rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 max-w-md">
        <span className="text-xs text-slate-400 font-medium">Total Earned Revenue Share</span>
        <div className="text-3xl font-bold text-emerald-400 mt-2 font-['Outfit']">
          ₹{data.totalRevenue.toLocaleString()}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800/80 overflow-x-auto">
        <h3 className="text-sm font-semibold text-slate-200 mb-4">Settled Margin Ledger</h3>
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/60 text-slate-400 uppercase text-[10px]">
            <tr>
              <th className="p-3">Source Downline</th>
              <th className="p-3">Product</th>
              <th className="p-3">Margin Rate</th>
              <th className="p-3">Revenue Earned</th>
              <th className="p-3">Status</th>
              <th className="p-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {data.items.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-4 text-center text-slate-500">
                  No revenue transactions logged yet.
                </td>
              </tr>
            ) : (
              data.items.map((tx) => (
                <tr key={tx._id} className="hover:bg-slate-800/30">
                  <td className="p-3 font-semibold text-slate-200">
                    {tx.sourceUserId?.firstName} {tx.sourceUserId?.lastName}
                  </td>
                  <td className="p-3 text-slate-400">{tx.productId?.productName}</td>
                  <td className="p-3">{tx.marginRate}%</td>
                  <td className="p-3 font-bold text-emerald-400">₹{tx.amount}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px]">
                      {tx.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500">{new Date(tx.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
