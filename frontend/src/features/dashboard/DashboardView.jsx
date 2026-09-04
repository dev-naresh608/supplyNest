import React from 'react';
import { useSelector } from 'react-redux';
import { useGetHierarchyStatsQuery } from '../../store/api/hierarchyApi';
import { useGetLowStockAlertsQuery } from '../../store/api/inventoryApi';
import {
  Users,
  GitFork,
  ShieldCheck,
  Building,
  AlertTriangle,
} from 'lucide-react';

export const DashboardView = () => {
  const { user } = useSelector((state) => state.auth);
  const { data: stats, isLoading: isStatsLoading } = useGetHierarchyStatsQuery();
  const { data: alerts = [], isLoading: isAlertsLoading } = useGetLowStockAlertsQuery();


  const kpis = [
    {
      label: 'Direct Children',
      value: stats?.directChildren ?? 0,
      icon: Building,
      badgeBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-100',
    },
    {
      label: 'Total Downline Network',
      value: stats?.totalDescendants ?? 0,
      icon: GitFork,
      badgeBg: 'bg-purple-50',
      iconColor: 'text-purple-600',
      borderColor: 'border-purple-100',
    },
    {
      label: 'Active Network Branches',
      value: stats?.activeDescendants ?? 0,
      icon: Users,
      badgeBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      borderColor: 'border-emerald-100',
    },
    {
      label: 'Current Depth Level',
      value: `Level ${user?.hierarchyLevel ?? 0}`,
      icon: ShieldCheck,
      badgeBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      borderColor: 'border-amber-100',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl relative overflow-hidden border border-slate-200/90 shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-['Outfit']">
              Welcome back, {user?.firstName}!
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
              Invora Distribution Network • Logged in as{' '}
              <span className="text-indigo-600 font-semibold">{user?.userType}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              Live Node Active
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-semibold">{kpi.label}</span>
                <div className={`p-2.5 rounded-xl ${kpi.badgeBg} ${kpi.iconColor}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-900 mt-4 font-['Outfit']">{kpi.value}</div>
            </div>
          );
        })}
      </div>

      {/* Low Stock Alert Section */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 font-['Outfit']">Stock Reorder Alerts</h3>
              <p className="text-xs text-slate-500">Items nearing critical threshold</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
            {alerts.length} Items Below Threshold
          </span>
        </div>

        {alerts.length === 0 ? (
          <div className="text-center py-10 text-xs font-medium text-slate-500 bg-slate-50 rounded-2xl border border-slate-100">
            All inventory levels are optimal. No low stock warnings.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {alerts.map((item) => (
              <div key={item._id} className="py-3.5 flex items-center justify-between hover:bg-slate-50/50 px-2 rounded-lg transition">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">{item.productId?.productName}</h4>
                  <p className="text-xs text-slate-500 font-medium">SKU: {item.productId?.sku}</p>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 text-xs font-semibold">
                    {item.availableQty} Units Left
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
