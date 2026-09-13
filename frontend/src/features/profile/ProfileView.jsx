import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
} from '../../store/api/authApi';
import {
  User,
  Shield,
  KeyRound,
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
  Sparkles,
  Lock,
  ExternalLink,
  Calendar,
  Layers,
  ShieldCheck,
  Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

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

const LANGUAGES = [
  { value: 'en', label: 'English (US/UK)' },
  { value: 'hi', label: 'Hindi (हिन्दी)' },
  { value: 'es', label: 'Spanish (Español)' },
  { value: 'fr', label: 'French (Français)' },
  { value: 'de', label: 'German (Deutsch)' },
];

export const ProfileView = () => {
  const { user: authUser } = useSelector((state) => state.auth);
  const { data: profileUser, isLoading: isFetching, refetch } = useGetProfileQuery();
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();
  const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation();

  const user = profileUser || authUser;

  const [activeTab, setActiveTab] = useState('personal'); // 'personal' | 'security' | 'organization'

  // Personal Profile Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',
    timezone: 'UTC',
    language: 'en',
  });

  const [isFormDirty, setIsFormDirty] = useState(false);

  // Initialize form when user data is available
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        country: user.country || 'India',
        pincode: user.pincode || '',
        timezone: user.timezone || 'UTC',
        language: user.language || 'en',
      });
      setIsFormDirty(false);
    }
  }, [user]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      setIsFormDirty(true);
      return next;
    });
  };

  const handleResetForm = () => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        country: user.country || 'India',
        pincode: user.pincode || '',
        timezone: user.timezone || 'UTC',
        language: user.language || 'en',
      });
      setIsFormDirty(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!formData.firstName.trim()) {
      return toast.error('First Name is required');
    }
    if (!formData.lastName.trim()) {
      return toast.error('Last Name is required');
    }

    try {
      await updateProfile(formData).unwrap();
      toast.success('Profile details updated successfully');
      setIsFormDirty(false);
      refetch();
    } catch (err) {
      const msg = err?.data?.message || err?.message || 'Failed to update profile';
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
      toast.success('Password changed successfully');
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

  if (isFetching && !user) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-56 bg-slate-200/80 rounded-3xl" />
        <div className="h-12 bg-slate-200/60 rounded-2xl w-96" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-80 bg-slate-200/60 rounded-3xl lg:col-span-2" />
          <div className="h-80 bg-slate-200/60 rounded-3xl" />
        </div>
      </div>
    );
  }

  const roleName = user?.role?.roleName || user?.userType?.replace('_', ' ') || 'Enterprise User';

  return (
    <div className="space-y-6 pb-12">
      {/* Hero Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl border border-slate-800">
        {/* Decorative background glow rings */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-purple-500/15 blur-3xl pointer-events-none" />

        {/* Cover pattern accent */}
        <div className="h-32 bg-gradient-to-r from-indigo-600/30 via-purple-600/20 to-transparent border-b border-white/5 relative">
          <div className="absolute top-4 right-6 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {user?.status || 'ACTIVE'}
            </span>
          </div>
        </div>

        {/* Profile Identity Bar */}
        <div className="px-6 pb-6 pt-0 sm:px-8 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-16 sm:-mt-14 mb-6">
            <div className="flex items-end gap-5">
              {/* Avatar circle */}
              <div className="relative group">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 p-1 shadow-2xl ring-4 ring-slate-900 flex items-center justify-center text-white font-bold text-3xl sm:text-4xl uppercase tracking-wider select-none shrink-0 overflow-hidden">
                  {user?.profilePhoto ? (
                    <img
                      src={user.profilePhoto}
                      alt={user.fullName || 'User Avatar'}
                      className="w-full h-full object-cover rounded-[22px]"
                    />
                  ) : (
                    <span>
                      {user?.firstName?.[0] || 'U'}
                      {user?.lastName?.[0] || ''}
                    </span>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                </div>
              </div>

              {/* Title & metadata */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-['Outfit'] text-white">
                    {user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Invora User'}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                    {roleName}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-indigo-400" />
                    {user?.email}
                  </span>
                  {user?.phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-indigo-400" />
                      {user.phone}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    Hierarchy Level {user?.hierarchyLevel ?? 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick action button */}
            <div className="flex items-center gap-3 self-stretch sm:self-auto">
              <Link
                to="/sessions"
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white border border-white/10 transition backdrop-blur-sm cursor-pointer shadow-xs"
              >
                <Lock className="w-3.5 h-3.5 text-indigo-300" />
                <span>Active Sessions</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </Link>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/10 text-xs">
            <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
              <span className="text-slate-400 block text-[11px] mb-1 font-medium">Account Role</span>
              <span className="font-semibold text-white truncate block">{roleName}</span>
            </div>
            <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
              <span className="text-slate-400 block text-[11px] mb-1 font-medium">Business Node</span>
              <span className="font-semibold text-white truncate block">
                {user?.hierarchyLevel === 0 ? 'Enterprise HQ' : `Level ${user?.hierarchyLevel} Node`}
              </span>
            </div>
            <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
              <span className="text-slate-400 block text-[11px] mb-1 font-medium">Member Since</span>
              <span className="font-semibold text-white truncate block">{formatDate(user?.createdAt)}</span>
            </div>
            <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
              <span className="text-slate-400 block text-[11px] mb-1 font-medium">Last Login</span>
              <span className="font-semibold text-white truncate block">{formatDate(user?.lastLogin)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('personal')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'personal'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Personal & Contact</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'security'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Security & Password</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('organization')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'organization'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Role & Hierarchy</span>
        </button>
      </div>

      {/* TAB 1: Personal & Contact Details */}
      {activeTab === 'personal' && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 cols: Basic Information & Address */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Profile Info Card */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900">Personal Details</h3>
                      <p className="text-xs text-slate-500">Update your public name and primary contact details</p>
                    </div>
                  </div>
                  {isFormDirty && (
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
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
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
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
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
                    <p className="text-[11px] text-slate-400 mt-1">To change email address, contact system administration.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Phone Number</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Address & Geographical Info Card */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-5">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">Address & Dispatch Location</h3>
                    <p className="text-xs text-slate-500">Operational hub address for inventory and billing documents</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Street Address</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="e.g. Unit 402, Enterprise Industrial Park, Phase 1"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">City</label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        placeholder="e.g. Mumbai"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">State / Province</label>
                      <input
                        type="text"
                        value={formData.state}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        placeholder="e.g. Maharashtra"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">Postal / PIN Code</label>
                      <input
                        type="text"
                        value={formData.pincode}
                        onChange={(e) => handleInputChange('pincode', e.target.value)}
                        placeholder="e.g. 400001"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">Country</label>
                      <input
                        type="text"
                        value={formData.country}
                        onChange={(e) => handleInputChange('country', e.target.value)}
                        placeholder="India"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 1 col: Regional Preferences & Form Submit Card */}
            <div className="space-y-6">
              {/* Regional Preferences Card */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-5">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">Preferences</h3>
                    <p className="text-xs text-slate-500">Localization and timezone</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Timezone
                      </span>
                    </label>
                    <select
                      value={formData.timezone}
                      onChange={(e) => handleInputChange('timezone', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition cursor-pointer"
                    >
                      {TIMEZONES.map((tz) => (
                        <option key={tz.value} value={tz.value}>
                          {tz.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-slate-400" />
                        Platform Language
                      </span>
                    </label>
                    <select
                      value={formData.language}
                      onChange={(e) => handleInputChange('language', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition cursor-pointer"
                    >
                      {LANGUAGES.map((lang) => (
                        <option key={lang.value} value={lang.value}>
                          {lang.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Action Buttons Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-3">
                <button
                  type="submit"
                  disabled={isUpdating || !isFormDirty}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-white transition shadow-sm cursor-pointer ${
                    isUpdating || !isFormDirty
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/25'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  <span>{isUpdating ? 'Saving Updates...' : 'Save Profile Changes'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetForm}
                  disabled={!isFormDirty || isUpdating}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/70 border border-slate-200 bg-white transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Discard Changes</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: Security & Password Management */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Change Password Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Change Account Password</h3>
                  <p className="text-xs text-slate-500">Ensure your account is using a strong, unique password</p>
                </div>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4">
                {/* Current Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Current Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      placeholder="Enter your current password"
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

                {/* New Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    New Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      placeholder="Enter minimum 6 characters"
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
                        <span className="text-slate-500">Password Strength:</span>
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

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Confirm New Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      placeholder="Re-enter your new password"
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
                    <span>{isChangingPassword ? 'Updating Password...' : 'Update Password'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right 1 col: Security Policies & Audit Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 text-slate-900 font-bold text-sm">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <span>Security Guidelines</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Must be at least 6 characters long (10+ recommended).</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Include upper & lowercase letters, numbers, and symbols.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Account locks for 15 minutes after 5 failed login attempts.</span>
                </li>
              </ul>
            </div>

            <div className="bg-indigo-50/70 border border-indigo-100 rounded-3xl p-6 space-y-3">
              <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Device & Session Auditing</span>
              </div>
              <p className="text-xs text-indigo-700/90 leading-relaxed">
                Invora tracks all active browser and device sessions with IP addresses and user agents. You can revoke any unknown session in one click.
              </p>
              <Link
                to="/sessions"
                className="inline-flex items-center gap-2 text-xs font-bold text-indigo-700 hover:text-indigo-900 transition pt-1 cursor-pointer"
              >
                <span>Manage Device Sessions</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Role & Hierarchy Matrix */}
      {activeTab === 'organization' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Role Details & Permissions */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">System Role & Privileges</h3>
                <p className="text-xs text-slate-500">Permissions granted based on dynamic role assignment</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Assigned Role
                  </span>
                  <span className="font-bold text-sm text-slate-900">{roleName}</span>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                  {user?.userType}
                </span>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-700 block mb-2.5">Configured Permissions</span>
                {user?.role?.permissions && user.role.permissions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {user.role.permissions.map((perm, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                        {perm}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-500 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-slate-400" />
                    <span>
                      {user?.userType === 'SUPER_ADMIN'
                        ? 'Super Admin has unconditional access across all enterprise resources.'
                        : 'Inherited default baseline permissions.'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Business Hierarchy Placement */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Hierarchy Node Position</h3>
                <p className="text-xs text-slate-500">Placement in the materialized business organization tree</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Hierarchy Level
                  </span>
                  <span className="font-bold text-base text-indigo-600">
                    Level {user?.hierarchyLevel ?? 0}
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Node Category
                  </span>
                  <span className="font-bold text-sm text-slate-900">
                    {user?.hierarchyLevel === 0 ? 'Enterprise HQ' : 'Regional / Franchise'}
                  </span>
                </div>
              </div>

              {user?.parentUser && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                    Parent Business Supervisor
                  </span>
                  <div className="font-semibold text-sm text-slate-900">
                    {user.parentUser.firstName} {user.parentUser.lastName}
                  </div>
                  <div className="text-xs text-slate-500">{user.parentUser.email}</div>
                </div>
              )}

              {user?.ancestorPath && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                    Materialized Ancestor Path
                  </span>
                  <code className="text-[11px] text-slate-700 bg-white px-2 py-1 rounded-md border border-slate-200 block truncate font-mono">
                    {user.ancestorPath}
                  </code>
                </div>
              )}

              <div className="pt-2">
                <Link
                  to="/hierarchy"
                  className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                >
                  <span>Explore Full Hierarchy Tree</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileView;
