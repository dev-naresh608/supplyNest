import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useLogoutMutation } from '../store/api/authApi';
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
  Menu,
  X,
  Building2,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const DashboardLayout = () => {
  const { user } = useSelector((state) => state.auth);
  const [logoutApi] = useLogoutMutation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logoutApi().unwrap();
      toast.success('Logged out successfully');
    } catch (e) {
      // Ignored
    } finally {
      navigate('/login');
    }
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
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col md:flex-row antialiased selection:bg-indigo-100 selection:text-indigo-900">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-72 bg-white border-r border-slate-200/90 p-5 sticky top-0 h-screen z-30 shrink-0 shadow-[2px_0_12px_-4px_rgba(15,23,42,0.03)]">
        {/* Brand */}
        <div className="flex items-center gap-3 px-2 py-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center shadow-md shadow-indigo-500/25">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight text-slate-900 font-['Outfit']">INVORA</h1>
            <p className="text-[10px] uppercase font-bold tracking-wider text-indigo-600">Enterprise Platform</p>
          </div>
        </div>

        {/* User Profile Summary Card */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 mb-6 flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0">
            {user?.firstName?.[0] || 'U'}
            {user?.lastName?.[0] || ''}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold truncate text-slate-900">{user?.fullName || `${user?.firstName} ${user?.lastName}`}</h4>
            <span className="inline-block px-2 py-0.5 text-[10px] font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80">
              {user?.userType}
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/25 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/90'
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
          className="flex items-center gap-3 px-3.5 py-2.5 mt-auto rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-all duration-200 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </aside>

      {/* Mobile Top Nav */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Building2 className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg text-slate-900 font-['Outfit']">INVORA</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Backdrop & Menu Drawer */}
      {mobileMenuOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="md:hidden fixed top-16 left-0 right-0 bg-white border-b border-slate-200 p-4 space-y-1.5 z-50 shadow-xl">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                      isActive ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3.5 py-2.5 w-full text-left rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar (Desktop & Tablet) */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/90 px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search products, hierarchy nodes, SKU..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-600 transition cursor-pointer">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse"></span>
            </button>
            <div className="h-5 w-[1px] bg-slate-200"></div>
            <div className="text-right">
              <div className="text-xs font-semibold text-slate-900">{user?.email}</div>
              <div className="text-[10px] font-medium text-slate-500">Level {user?.hierarchyLevel ?? 0} Node</div>
            </div>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto bg-[#f8fafc]">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
