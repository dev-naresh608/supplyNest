import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  GitFork,
  ShieldCheck,
  Package,
  Boxes,
  TrendingUp,
  Monitor,
  LogOut,
  Bell,
  Search,
  ChevronDown,
  Menu,
  X,
  Building2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Business Hierarchy', path: '/hierarchy', icon: GitFork },
    { label: 'Dynamic Roles', path: '/roles', icon: ShieldCheck },
    { label: 'Master Products', path: '/products', icon: Package },
    { label: 'Inventory Ledger', path: '/inventory', icon: Boxes },
    { label: 'Revenue Engine', path: '/revenue', icon: TrendingUp },
    { label: 'Sessions & Security', path: '/sessions', icon: Monitor },
  ];

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-72 glass-panel border-r border-slate-800/80 p-5 sticky top-0 h-screen z-20">
        {/* Brand */}
        <div className="flex items-center gap-3 px-2 py-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight text-white font-['Outfit']">INVORA</h1>
            <p className="text-[10px] uppercase font-semibold tracking-wider text-indigo-400">Enterprise Platform</p>
          </div>
        </div>

        {/* User Card */}
        <div className="glass-card rounded-xl p-3.5 mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
            {user?.firstName?.[0]}
            {user?.lastName?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold truncate text-slate-200">{user?.fullName}</h4>
            <span className="inline-block px-2 py-0.5 text-[10px] font-medium rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {user?.userType}
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto pr-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3.5 py-2.5 mt-auto rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 glass-panel border-b border-slate-800/80 px-6 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search products, hierarchy nodes, SKU..."
                className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 transition"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-slate-300 transition">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            </button>
            <div className="h-4 w-[1px] bg-slate-800"></div>
            <div className="text-right">
              <div className="text-xs font-semibold text-slate-200">{user?.email}</div>
              <div className="text-[10px] text-slate-400">Level {user?.hierarchyLevel ?? 0} Node</div>
            </div>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
