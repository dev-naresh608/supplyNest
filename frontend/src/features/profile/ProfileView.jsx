import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useLogoutMutation,
  useLogoutAllMutation,
  useGetSessionsQuery,
  useRevokeSessionMutation,
} from '../../store/api/authApi';
import {
  User,
  Settings,
  LogOut,
  KeyRound,
  Shield,
  ShieldCheck,
  Building2,
  Mail,
  Phone,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
  Sparkles,
  Lock,
  Layers,
  Laptop,
  Smartphone,
  Trash2,
  Power,
  Check,
  AlertTriangle,
  ArrowLeft,
  Sliders,
  Menu,
  X,
  ChevronRight,
  Monitor,
  GitFork,
} from 'lucide-react';
import toast from 'react-hot-toast';

const TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST +5:30)' },
  { value: 'America/New_York', label: 'America/New_York (EST/EDT -5:00)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST/PDT -8:00)' },
  { value: 'Europe/London', label: 'Europe/London (GMT/BST +0:00)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (CET/CEST +1:00)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (GST +4:00)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT +8:00)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST +9:00)' },
];

export const ProfileView = () => {
  const navigate = useNavigate();
  const { user: authUser } = useSelector((state) => state.auth);
  const { data: profileUser, isLoading: isFetching, refetch } = useGetProfileQuery();
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();
  const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation();
  const [logoutApi, { isLoading: isLoggingOut }] = useLogoutMutation();
  const [logoutAllApi, { isLoading: isLoggingOutAll }] = useLogoutAllMutation();
  const { data: sessions = [], isLoading: isLoadingSessions } = useGetSessionsQuery();
  const [revokeSession, { isLoading: isRevoking }] = useRevokeSessionMutation();

  const user = profileUser || authUser;

  // Active Section controlled purely from the left navigation
  // 'personal' | 'settings' | 'security' | 'sessions' | 'hierarchy' | 'logout'
  const [activeNav, setActiveNav] = useState('personal');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Logout Modals
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showLogoutAllModal, setShowLogoutAllModal] = useState(false);

  // 1. Personal Details Form State
  const [personalData, setPersonalData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',
  });
  const [isPersonalDirty, setIsPersonalDirty] = useState(false);

  // 2. Settings & Preferences Form State
  const [settingsData, setSettingsData] = useState({
    timezone: 'UTC',
  });
  const [isSettingsDirty, setIsSettingsDirty] = useState(false);

  // Sync state with loaded user data
  useEffect(() => {
    if (user) {
      setPersonalData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        country: user.country || 'India',
        pincode: user.pincode || '',
      });
      setIsPersonalDirty(false);

      setSettingsData({
        timezone: user.timezone || 'UTC',
      });
      setIsSettingsDirty(false);
    }
  }, [user]);

  // Personal Handlers
  const handlePersonalChange = (field, value) => {
    setPersonalData((prev) => {
      const next = { ...prev, [field]: value };
      setIsPersonalDirty(true);
      return next;
    });
  };

  const handleResetPersonal = () => {
    if (user) {
      setPersonalData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        country: user.country || 'India',
        pincode: user.pincode || '',
      });
      setIsPersonalDirty(false);
      toast('Personal details reset to saved state', { icon: '🔄' });
    }
  };

  const handleSavePersonal = async (e) => {
    e.preventDefault();
    if (!personalData.firstName.trim()) {
      return toast.error('First Name is required');
    }
    if (!personalData.lastName.trim()) {
      return toast.error('Last Name is required');
    }

    try {
      await updateProfile(personalData).unwrap();
      toast.success('Personal details saved successfully');
      setIsPersonalDirty(false);
      refetch();
    } catch (err) {
      const msg = err?.data?.message || err?.message || 'Failed to update personal details';
      toast.error(msg);
    }
  };

  // Settings Handlers
  const handleSettingsChange = (field, value) => {
    setSettingsData((prev) => {
      const next = { ...prev, [field]: value };
      setIsSettingsDirty(true);
      return next;
    });
  };

  const handleResetSettings = () => {
    if (user) {
      setSettingsData({
        timezone: user.timezone || 'UTC',
      });
      setIsSettingsDirty(false);
      toast('Settings reset to saved state', { icon: '🔄' });
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await updateProfile(settingsData).unwrap();
      toast.success('Settings & preferences saved successfully');
      setIsSettingsDirty(false);
      refetch();
    } catch (err) {
      const msg = err?.data?.message || err?.message || 'Failed to save settings';
      toast.error(msg);
    }
  };

  // Password Change Form State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const calculatePasswordStrength = (pass) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 6) score += 25;
    if (pass.length >= 10) score += 25;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 25;
    if (/[0-9]/.test(pass) && /[^A-Za-z0-9]/.test(pass)) score += 25;
    return score;
  };

  const passwordStrength = calculatePasswordStrength(passwordData.newPassword);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!passwordData.currentPassword) {
      return toast.error('Current password is required');
    }
    if (passwordData.newPassword.length < 6) {
      return toast.error('New password must be at least 6 characters long');
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return toast.error('New password and confirm password do not match');
    }
    if (passwordData.currentPassword === passwordData.newPassword) {
      return toast.error('New password must be different from current password');
    }

    try {
      await changePassword(passwordData).unwrap();
      toast.success('Password updated successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      const msg = err?.data?.message || err?.message || 'Failed to change password';
      toast.error(msg);
    }
  };

  // Logout Handlers
  const handleLogoutCurrentDevice = async () => {
    try {
      await logoutApi().unwrap();
      toast.success('Signed out successfully');
      navigate('/login');
    } catch {
      navigate('/login');
    }
  };

  const handleLogoutAllDevices = async () => {
    try {
      await logoutAllApi().unwrap();
      toast.success('Signed out from all devices');
      setShowLogoutAllModal(false);
      navigate('/login');
    } catch (err) {
      const msg = err?.data?.message || err?.message || 'Failed to logout from all devices';
      toast.error(msg);
    }
  };

  const handleRevokeSingleSession = async (sessionId) => {
    try {
      await revokeSession(sessionId).unwrap();
      toast.success('Session revoked successfully');
    } catch (err) {
      const msg = err?.data?.message || err?.message || 'Failed to revoke session';
      toast.error(msg);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    try {
      return new Intl.DateTimeFormat('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(dateString));
    } catch {
      return dateString;
    }
  };

  const roleName = user?.role?.roleName || user?.userType?.replace('_', ' ') || 'Enterprise User';

  // Production-grade Left Navigation Groups
  const navigationGroups = [
    {
      groupTitle: 'Profile & Identity',
      items: [
        {
          id: 'personal',
          label: 'Personal Details',
          subLabel: 'Name, contact & dispatch hub',
          icon: User,
          isDirty: isPersonalDirty,
        },
      ],
    },
    {
      groupTitle: 'Preferences',
      items: [
        {
          id: 'settings',
          label: 'Settings & Preferences',
          subLabel: 'Platform timezone & save controls',
          icon: Sliders,
          isDirty: isSettingsDirty,
        },
      ],
    },
    {
      groupTitle: 'Security & Access',
      items: [
        {
          id: 'security',
          label: 'Password & Security',
          subLabel: 'Credentials & security policy',
          icon: KeyRound,
        },
        {
          id: 'sessions',
          label: 'Active Sessions',
          subLabel: 'Connected devices & tokens',
          icon: Monitor,
          badge: sessions?.length ? `${sessions.length} Active` : null,
        },
      ],
    },
    {
      groupTitle: 'Organization',
      items: [
        {
          id: 'hierarchy',
          label: 'Role & Hierarchy',
          subLabel: 'Permissions & node tree position',
          icon: GitFork,
        },
      ],
    },
    {
      groupTitle: 'Account Actions',
      items: [
        {
          id: 'logout',
          label: 'Logout & Sign Out',
          subLabel: 'Disconnect devices & exit account',
          icon: LogOut,
          isDanger: true,
        },
      ],
    },
  ];

  if (isFetching && !user) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-600">Loading Account Settings & Profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col md:flex-row antialiased selection:bg-indigo-100 selection:text-indigo-900">
      {/* ========================================================= */}
      {/* 1. PRODUCTION-GRADE LEFT NAVIGATION SIDEBAR (DESKTOP)     */}
      {/* ========================================================= */}
      <aside className="hidden md:flex flex-col w-80 bg-white border-r border-slate-200/90 p-5 sticky top-0 h-screen z-30 shrink-0 shadow-[2px_0_12px_-4px_rgba(15,23,42,0.03)]">
        {/* Return to Dashboard */}
        <Link
          to="/dashboard"
          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/80 border border-slate-200/80 hover:border-indigo-200 transition mb-5 group cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Main Dashboard</span>
        </Link>

        {/* Section Title */}
        <div className="flex items-center gap-3 px-2 py-2 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center shadow-md shadow-indigo-500/25 text-white">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-base tracking-tight text-slate-900 font-['Outfit']">Settings & Profile</h2>
            <p className="text-[10px] uppercase font-bold tracking-wider text-indigo-600">Enterprise Control Center</p>
          </div>
        </div>

        {/* User Mini Profile Badge */}
        <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-3 mb-5 flex items-center gap-3 shadow-2xs">
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-xs uppercase">
              {user?.firstName?.[0] || 'U'}
              {user?.lastName?.[0] || ''}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold truncate text-slate-900">
              {user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Invora User'}
            </h4>
            <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
            <span className="inline-block mt-0.5 px-2 py-0.5 text-[9px] font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80">
              {roleName}
            </span>
          </div>
        </div>

        {/* Grouped Left Navigation Items */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {navigationGroups.map((grp, gIdx) => (
            <div key={gIdx} className="space-y-1">
              <p className="px-2 text-[10px] uppercase tracking-wider font-bold text-slate-400">
                {grp.groupTitle}
              </p>
              {grp.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveNav(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all duration-150 cursor-pointer ${
                      isActive
                        ? item.isDanger
                          ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25 font-bold'
                          : 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/25 font-bold'
                        : item.isDanger
                        ? 'text-rose-600 hover:bg-rose-50 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : item.isDanger
                            ? 'bg-rose-50 text-rose-600'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs block truncate leading-tight">{item.label}</span>
                        <span
                          className={`text-[10px] block truncate leading-tight ${
                            isActive ? 'text-indigo-100' : 'text-slate-400'
                          }`}
                        >
                          {item.subLabel}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.isDirty && (
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="Unsaved changes" />
                      )}
                      {item.badge && (
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                            isActive ? 'bg-white/25 text-white' : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-300'}`} />
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Sidebar Footer Logout Action */}
        <div className="pt-3 border-t border-slate-100 mt-2">
          <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Power className="w-4 h-4" />
              <span>Sign Out Current Device</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-rose-400" />
          </button>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* 2. MOBILE TOP BAR & RESPONSIVE SELECTOR                   */}
      {/* ========================================================= */}
      <div className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 shadow-xs">
        <div className="flex items-center justify-between">
          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-indigo-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>

          <span className="text-xs font-bold text-slate-900 font-['Outfit']">Settings & Profile</span>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Horizontal Section Tabs */}
        <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-slate-100 overflow-x-auto pb-1 no-scrollbar">
          {navigationGroups.flatMap((g) => g.items).map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveNav(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? item.isDanger
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.isDirty && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. MAIN CONTENT CANVAS (DYNAMICALLY CONTROLLED BY LEFT NAV) */}
      {/* ========================================================= */}
      <main className="flex-1 p-4 sm:p-7 md:p-9 overflow-y-auto overflow-x-hidden">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header Banner Accent */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
                <Link to="/dashboard" className="hover:text-indigo-600 transition">
                  Dashboard
                </Link>
                <span>/</span>
                <span className="text-indigo-600 font-bold">Settings & Profile</span>
                <span>/</span>
                <span className="text-slate-700 capitalize">
                  {navigationGroups.flatMap((g) => g.items).find((i) => i.id === activeNav)?.label || activeNav}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight font-['Outfit']">
                {activeNav === 'personal' && 'Personal Profile & Contact Hub'}
                {activeNav === 'settings' && 'Platform Settings & Preferences'}
                {activeNav === 'security' && 'Password Management & Security'}
                {activeNav === 'sessions' && 'Active Devices & Session Tokens'}
                {activeNav === 'hierarchy' && 'Role Capabilities & Business Node'}
                {activeNav === 'logout' && 'Sign Out & Session Revocation'}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {user?.status || 'ACTIVE'}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                Level {user?.hierarchyLevel ?? 0}
              </span>
            </div>
          </div>

          {/* --------------------------------------------------------- */}
          {/* SECTION 1: Personal Details                               */}
          {/* --------------------------------------------------------- */}
          {activeNav === 'personal' && (
            <form onSubmit={handleSavePersonal} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {/* Personal Information Form */}
                  <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-xs space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-base text-slate-900">Personal Information</h3>
                          <p className="text-xs text-slate-500">Public profile identity and contact information</p>
                        </div>
                      </div>
                      {isPersonalDirty && (
                        <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/80 animate-pulse">
                          Unsaved Changes
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          First Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={personalData.firstName}
                          onChange={(e) => handlePersonalChange('firstName', e.target.value)}
                          placeholder="e.g. Rahul"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Last Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={personalData.lastName}
                          onChange={(e) => handlePersonalChange('lastName', e.target.value)}
                          placeholder="e.g. Sharma"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Email Address <span className="text-slate-400 font-normal">(Primary Identifier)</span>
                        </label>
                        <div className="relative">
                          <input
                            type="email"
                            value={user?.email || ''}
                            disabled
                            className="w-full pl-3.5 pr-24 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-500 cursor-not-allowed"
                          />
                          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Verified
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">To change email, contact enterprise admin.</p>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Phone Number</label>
                        <div className="relative">
                          <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="tel"
                            value={personalData.phone}
                            onChange={(e) => handlePersonalChange('phone', e.target.value)}
                            placeholder="+91 98765 43210"
                            className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dispatch Address */}
                  <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-xs space-y-5">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                      <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-slate-900">Address & Dispatch Hub</h3>
                        <p className="text-xs text-slate-500">Warehouse location for inventory dispatch and billing</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Street Address</label>
                        <input
                          type="text"
                          value={personalData.address}
                          onChange={(e) => handlePersonalChange('address', e.target.value)}
                          placeholder="e.g. Unit 402, Enterprise Industrial Park, Phase 1"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">City</label>
                          <input
                            type="text"
                            value={personalData.city}
                            onChange={(e) => handlePersonalChange('city', e.target.value)}
                            placeholder="e.g. Mumbai"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">State</label>
                          <input
                            type="text"
                            value={personalData.state}
                            onChange={(e) => handlePersonalChange('state', e.target.value)}
                            placeholder="e.g. Maharashtra"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">PIN Code</label>
                          <input
                            type="text"
                            value={personalData.pincode}
                            onChange={(e) => handlePersonalChange('pincode', e.target.value)}
                            placeholder="e.g. 400001"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Country</label>
                          <input
                            type="text"
                            value={personalData.country}
                            onChange={(e) => handlePersonalChange('country', e.target.value)}
                            placeholder="India"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right 1 Col: Save / Unsave Controls */}
                <div className="space-y-6">
                  <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span>Status:</span>
                      {isPersonalDirty ? (
                        <span className="text-amber-600 flex items-center gap-1 font-bold">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Unsaved Changes
                        </span>
                      ) : (
                        <span className="text-emerald-600 flex items-center gap-1 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Saved
                        </span>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isUpdating || !isPersonalDirty}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-white transition shadow-sm cursor-pointer ${
                        isUpdating || !isPersonalDirty
                          ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                          : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/25'
                      }`}
                    >
                      <Save className="w-4 h-4" />
                      <span>{isUpdating ? 'Saving...' : 'Save Personal Details'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleResetPersonal}
                      disabled={!isPersonalDirty || isUpdating}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/70 border border-slate-200 bg-white transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Discard / Unsave</span>
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* --------------------------------------------------------- */}
          {/* SECTION 2: Settings & Preferences                         */}
          {/* --------------------------------------------------------- */}
          {activeNav === 'settings' && (
            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-xs space-y-5">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                        <Sliders className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-slate-900">Platform Timezone & Regional Settings</h3>
                        <p className="text-xs text-slate-500">Configure your active timezone for logs, timestamps, and transactions</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            Platform Timezone
                          </span>
                        </label>
                        <select
                          value={settingsData.timezone}
                          onChange={(e) => handleSettingsChange('timezone', e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition cursor-pointer"
                        >
                          {TIMEZONES.map((tz) => (
                            <option key={tz.value} value={tz.value}>
                              {tz.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Save & Unsave Controls for Settings */}
                <div className="space-y-6">
                  <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span>Status:</span>
                      {isSettingsDirty ? (
                        <span className="text-amber-600 flex items-center gap-1 font-bold">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Unsaved Changes
                        </span>
                      ) : (
                        <span className="text-emerald-600 flex items-center gap-1 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Saved
                        </span>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isUpdating || !isSettingsDirty}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-white transition shadow-sm cursor-pointer ${
                        isUpdating || !isSettingsDirty
                          ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                          : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/25'
                      }`}
                    >
                      <Save className="w-4 h-4" />
                      <span>{isUpdating ? 'Saving...' : 'Save Settings'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleResetSettings}
                      disabled={!isSettingsDirty || isUpdating}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/70 border border-slate-200 bg-white transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Discard / Unsave</span>
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* --------------------------------------------------------- */}
          {/* SECTION 3: Password & Security                            */}
          {/* --------------------------------------------------------- */}
          {activeNav === 'security' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-xs space-y-6">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900">Change Password</h3>
                      <p className="text-xs text-slate-500">Update credentials to secure your session</p>
                    </div>
                  </div>

                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Current Password <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          placeholder="Enter current password"
                          className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        New Password <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          placeholder="Enter new password (min 6 chars)"
                          className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Password Strength Indicator */}
                      {passwordData.newPassword && (
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-500">Strength:</span>
                            <span
                              className={`font-semibold ${
                                passwordStrength >= 75
                                  ? 'text-emerald-600'
                                  : passwordStrength >= 50
                                  ? 'text-amber-600'
                                  : 'text-rose-600'
                              }`}
                            >
                              {passwordStrength >= 75 ? 'Strong' : passwordStrength >= 50 ? 'Moderate' : 'Weak'}
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                passwordStrength >= 75
                                  ? 'bg-emerald-500'
                                  : passwordStrength >= 50
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${passwordStrength}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Confirm New Password <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          placeholder="Re-enter new password"
                          className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isChangingPassword}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-md shadow-indigo-600/25 cursor-pointer disabled:opacity-50"
                      >
                        <KeyRound className="w-4 h-4" />
                        <span>{isChangingPassword ? 'Updating Password...' : 'Save New Password'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-xs space-y-3 text-xs text-slate-600">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                    <ShieldCheck className="w-5 h-5 text-indigo-600" />
                    <span>Security Guidelines</span>
                  </div>
                  <ul className="space-y-2 pl-1">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Minimum 6 characters (10+ recommended).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Include upper & lowercase letters, numbers, and symbols.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Account locks for 15 minutes upon 5 failed attempts.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* --------------------------------------------------------- */}
          {/* SECTION 4: Active Sessions                                */}
          {/* --------------------------------------------------------- */}
          {activeNav === 'sessions' && (
            <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Laptop className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">Connected Login Sessions</h3>
                    <p className="text-xs text-slate-500">Active browser and device credentials</p>
                  </div>
                </div>

                {sessions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setShowLogoutAllModal(true)}
                    className="inline-flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 transition cursor-pointer"
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>Revoke All Other Sessions</span>
                  </button>
                )}
              </div>

              {isLoadingSessions ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : sessions.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs">No active sessions found.</div>
              ) : (
                <div className="space-y-3">
                  {sessions.map((sess, idx) => {
                    const isMobile = sess.os?.toLowerCase().includes('android') || sess.os?.toLowerCase().includes('ios');
                    return (
                      <div
                        key={sess._id || idx}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 hover:bg-slate-50 gap-3 transition"
                      >
                        <div className="flex items-start gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-indigo-600 shrink-0 shadow-2xs mt-0.5">
                            {isMobile ? <Smartphone className="w-5 h-5" /> : <Laptop className="w-5 h-5" />}
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-slate-900">
                                {sess.deviceName || sess.browser || 'Web Browser'}
                              </span>
                              {idx === 0 && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-300">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  Current Session
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                              <span>{sess.browser}</span>
                              <span>•</span>
                              <span>OS: {sess.os || 'Unknown'}</span>
                              <span>•</span>
                              <span>IP: {sess.ipAddress || 'Protected'}</span>
                            </div>

                            <span className="text-[11px] text-slate-400 block">
                              Last Active: {formatDate(sess.lastActive || sess.createdAt)}
                            </span>
                          </div>
                        </div>

                        {idx !== 0 && (
                          <button
                            type="button"
                            onClick={() => handleRevokeSingleSession(sess._id)}
                            disabled={isRevoking}
                            className="self-end sm:self-center inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Revoke</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* --------------------------------------------------------- */}
          {/* SECTION 5: Role & Hierarchy                               */}
          {/* --------------------------------------------------------- */}
          {activeNav === 'hierarchy' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Role & Permissions */}
              <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">System Role & Permissions</h3>
                    <p className="text-xs text-slate-500">Configured privileges and access matrices</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Assigned Role</span>
                      <span className="font-bold text-sm text-slate-900">{roleName}</span>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                      {user?.userType}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-slate-700 block mb-2">Capabilities</span>
                    {user?.role?.permissions && user.role.permissions.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {user.role.permissions.map((p, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200"
                          >
                            <Check className="w-3.5 h-3.5 text-indigo-600" />
                            {p}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        {user?.userType === 'SUPER_ADMIN'
                          ? 'Super Admin has full access across all platform modules.'
                          : 'Inherited default baseline permissions.'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Hierarchy Tree Node */}
              <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">Organization Node Placement</h3>
                    <p className="text-xs text-slate-500">Business tree placement & hierarchy links</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Node Hierarchy</span>
                    <span className="font-bold text-indigo-600">
                      {user?.hierarchyLevel === 0 ? 'Enterprise HQ (Level 0)' : `Level ${user?.hierarchyLevel}`}
                    </span>
                  </div>

                  {user?.parentUser && (
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-[11px] text-slate-400 block mb-0.5">Supervisor Node</span>
                      <span className="font-bold text-slate-800 block">
                        {user.parentUser.firstName} {user.parentUser.lastName}
                      </span>
                      <span className="text-[11px] text-slate-500">{user.parentUser.email}</span>
                    </div>
                  )}

                  {user?.ancestorPath && (
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                      <span className="text-[11px] text-slate-400 block">Ancestor Path</span>
                      <code className="text-[11px] text-slate-700 bg-white px-2 py-1 rounded-md border border-slate-200 block truncate font-mono">
                        {user.ancestorPath}
                      </code>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* --------------------------------------------------------- */}
          {/* SECTION 6: Logout & Sign Out Actions                      */}
          {/* --------------------------------------------------------- */}
          {activeNav === 'logout' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Single Device Logout Card */}
              <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-xs space-y-4">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600">
                  <LogOut className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Sign Out This Device</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Clears your session cookies and authentication tokens on this current browser. Your other devices will stay logged in.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLogoutModal(true)}
                  disabled={isLoggingOut}
                  className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{isLoggingOut ? 'Signing out...' : 'Sign Out This Browser'}</span>
                </button>
              </div>

              {/* All Devices Logout Danger Card */}
              <div className="bg-white rounded-3xl p-5 sm:p-7 border border-rose-200/90 shadow-xs space-y-4 bg-gradient-to-br from-white via-white to-rose-50/30">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-700">
                  <Power className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-rose-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    Sign Out From All Devices
                  </h3>
                  <p className="text-xs text-rose-700/80 mt-1 leading-relaxed">
                    Invalidates every single session token across all phones, tablets, and computers. You will be prompted to log back in everywhere.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLogoutAllModal(true)}
                  disabled={isLoggingOutAll}
                  className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition cursor-pointer shadow-md shadow-rose-600/25"
                >
                  <Power className="w-4 h-4" />
                  <span>{isLoggingOutAll ? 'Revoking all...' : 'Sign Out Everywhere'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Confirmation Modals */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <LogOut className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="font-bold text-lg text-slate-900">Sign Out Confirmation</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to sign out from this device? You can log back in at any time.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogoutCurrentDevice}
                disabled={isLoggingOut}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isLoggingOut ? 'Signing out...' : 'Yes, Sign Out'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showLogoutAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="font-bold text-lg text-slate-900">Sign Out From All Devices?</h3>
              <p className="text-xs text-slate-500">
                This will immediately revoke all active sessions across all your devices. Re-login will be required everywhere.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutAllModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogoutAllDevices}
                disabled={isLoggingOutAll}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isLoggingOutAll ? 'Revoking...' : 'Sign Out Everywhere'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileView;
