import React, { useEffect, useState } from 'react';
import { api } from '../../config/axios';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  Package,
  Boxes,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  GitFork,
  ShieldCheck,
  Building,
} from 'lucide-react';

export const DashboardView = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [statsRes, alertsRes] = await Promise.all([
          api.get('/hierarchy/stats'),
          api.get('/inventory/alerts'),
        ]);
        setStats(statsRes.data);
        setAlerts(alertsRes.data || []);
      } catch (err) {
        // Fallback
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  const kpis = [
    {
      label: 'Direct Children',
      value: stats?.directChildren ?? 0,
      icon: Building,
      gradient: 'from-blue-500/20 to-indigo-500/20',
      border: 'border-blue-500/30',
      iconColor: 'text-blue-400',
    },
    {
      label: 'Total Downline Network',
      value: stats?.totalDescendants ?? 0,
      icon: GitFork,
      gradient: 'from-purple-500/20 to-indigo-500/20',
      border: 'border-purple-500/30',
      iconColor: 'text-purple-400',
    },
    {
      label: 'Active Network Branches',
      value: stats?.activeDescendants ?? 0,
      icon: Users,
      gradient: 'from-emerald-500/20 to-teal-500/20',
      border: 'border-emerald-500/30',
      iconColor: 'text-emerald-400',
    },
    {
      label: 'Current Depth Level',
      value: `Level ${user?.hierarchyLevel ?? 0}`,
      icon: ShieldCheck,
      gradient: 'from-amber-500/20 to-orange-500/20',
      border: 'border-amber-500/30',
      iconColor: 'text-amber-400',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="glass-panel p-6 rounded-3xl relative overflow-hidden border border-slate-800/80">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white font-['Outfit']">
              Welcome back, {user?.firstName}!
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Invora Distribution Network • Logged in as{' '}
              <span className="text-indigo-400 font-semibold">{user?.userType}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Live Node Active
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className={`glass-card p-5 rounded-2xl border ${kpi.border} bg-gradient-to-br ${kpi.gradient}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">{kpi.label}</span>
                <div className={`p-2.5 rounded-xl bg-slate-900/50 ${kpi.iconColor}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-bold text-white mt-3 font-['Outfit']">{kpi.value}</div>
            </div>
          );
        })}
      </div>

      {/* Low Stock Alert Section */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800/80">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white font-['Outfit']">Stock Reorder Alerts</h3>
          </div>
          <span className="text-xs text-slate-400">{alerts.length} Items Below Threshold</span>
        </div>

        {alerts.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            All inventory levels are optimal. No low stock warnings.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {alerts.map((item) => (
              <div key={item._id} className="py-3 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-slate-200">{item.productId?.productName}</h4>
                  <p className="text-xs text-slate-500">SKU: {item.productId?.sku}</p>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold">
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
