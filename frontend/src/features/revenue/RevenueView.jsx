import React from 'react';
import { useGetRevenueQuery } from '../../store/api/revenueApi';
import { TrendingUp } from 'lucide-react';
import { TableSkeleton } from '../../components/common/Skeletons';

export const RevenueView = () => {
  const { data = { items: [], totalRevenue: 0 }, isLoading } = useGetRevenueQuery();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-['Outfit']">Revenue Sharing & Margin Engine</h2>
          <p className="text-xs text-slate-500 font-medium">Hierarchical revenue distributions and profit margins</p>
        </div>
      </div>

      {/* KPI Card */}
      <div className="bg-emerald-50/60 p-6 sm:p-7 rounded-3xl border border-emerald-200/80 max-w-md shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs text-emerald-800 font-semibold uppercase tracking-wider">Total Earned Revenue Share</span>
          <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
        {isLoading ? (
          <div className="h-10 w-32 bg-emerald-100/70 rounded-xl shimmer-bg mt-3" />
        ) : (
          <div className="text-3xl sm:text-4xl font-bold text-emerald-700 mt-3 font-['Outfit']">
            ₹{data.totalRevenue.toLocaleString()}
          </div>
        )}
      </div>

      {/* Transactions Table - only shown when there are items */}
      {isLoading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : data?.items?.length > 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Settled Margin Ledger</h3>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {data.items.length} Transactions
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Source Downline</th>
                  <th className="p-3.5">Product</th>
                  <th className="p-3.5">Margin Rate</th>
                  <th className="p-3.5">Revenue Earned</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((tx) => (
                  <tr key={tx._id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3.5 font-semibold text-slate-900">
                      {tx.sourceUserId?.firstName} {tx.sourceUserId?.lastName}
                    </td>
                    <td className="p-3.5 text-slate-500 font-medium">{tx.productId?.productName}</td>
                    <td className="p-3.5 font-semibold text-slate-700">{tx.marginRate}%</td>
                    <td className="p-3.5 font-bold text-emerald-700 text-sm">₹{tx.amount}</td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-semibold">
                        {tx.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-500 font-medium">{new Date(tx.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
};
