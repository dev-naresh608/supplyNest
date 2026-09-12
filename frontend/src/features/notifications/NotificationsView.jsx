import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Package,
  AlertTriangle,
  Boxes,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ShieldAlert,
  GitFork,
  Search,
  Filter,
  RefreshCw,
  SlidersHorizontal,
  ExternalLink,
  Layers,
  Inbox,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ListSkeleton } from '../../components/common/Skeletons';
import {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
  useClearReadNotificationsMutation,
} from '../../store/api/notificationApi';

const formatRelativeTime = (timestamp) => {
  if (!timestamp) return '';
  const now = new Date();
  const past = new Date(timestamp);
  const diffInSeconds = Math.floor((now - past) / 1000);

  if (diffInSeconds < 30) return 'Just now';
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return past.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const getNotificationVisuals = (item) => {
  const { type, severity } = item;

  if (type === 'STOCK_ASSIGNMENT' || type === 'STOCK_ADJUSTMENT_APPROVED' || severity === 'SUCCESS') {
    return {
      icon: CheckCircle2,
      border: 'border-emerald-200',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      iconBg: 'bg-emerald-50 text-emerald-600',
    };
  }

  if (type === 'STOCK_ADJUSTMENT_REQUEST' || type === 'LOW_STOCK_ALERT' || severity === 'WARNING') {
    return {
      icon: AlertTriangle,
      border: 'border-amber-200',
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
      iconBg: 'bg-amber-50 text-amber-600',
    };
  }

  if (type === 'STOCK_ADJUSTMENT_REJECTED' || severity === 'DANGER') {
    return {
      icon: XCircle,
      border: 'border-rose-200',
      badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
      iconBg: 'bg-rose-50 text-rose-600',
    };
  }

  if (type === 'CHILD_NODE_CREATED' || type === 'NODE_TRANSFERRED' || item.category === 'HIERARCHY') {
    return {
      icon: GitFork,
      border: 'border-indigo-200',
      badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      iconBg: 'bg-indigo-50 text-indigo-600',
    };
  }

  if (severity === 'SECURITY' || type === 'SECURITY_ALERT') {
    return {
      icon: ShieldAlert,
      border: 'border-purple-200',
      badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
      iconBg: 'bg-purple-50 text-purple-600',
    };
  }

  return {
    icon: Boxes,
    border: 'border-slate-200',
    badgeBg: 'bg-slate-50 text-slate-700 border-slate-200',
    iconBg: 'bg-slate-50 text-slate-600',
  };
};

export const NotificationsView = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [readFilter, setReadFilter] = useState('ALL'); // 'ALL' | 'UNREAD' | 'READ'
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Unread badge count query
  const { data: unreadCount = 0 } = useGetUnreadCountQuery();

  const queryParams = {
    page: currentPage,
    limit: 15,
    ...(activeCategory !== 'ALL' ? { category: activeCategory } : {}),
    ...(readFilter === 'UNREAD' ? { isRead: 'false' } : {}),
    ...(readFilter === 'READ' ? { isRead: 'true' } : {}),
    ...(severityFilter !== 'ALL' ? { severity: severityFilter } : {}),
    ...(searchQuery.trim() ? { search: searchQuery.trim() } : {}),
  };

  const { data, isLoading, isFetching, refetch } = useGetNotificationsQuery(queryParams);

  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead, { isLoading: isMarkingAll }] = useMarkAllAsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();
  const [clearReadNotifications, { isLoading: isClearingRead }] = useClearReadNotificationsMutation();

  const notifications = data?.items || [];
  const meta = data?.meta || {};

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead(activeCategory !== 'ALL' ? { category: activeCategory } : {}).unwrap();
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const handleClearRead = async () => {
    try {
      const res = await clearReadNotifications().unwrap();
      toast.success(res?.message || 'Read notifications cleared');
    } catch {
      toast.error('Failed to clear read notifications');
    }
  };

  const handleMarkSingleRead = async (id) => {
    try {
      await markAsRead(id).unwrap();
      toast.success('Marked as read');
    } catch {
      toast.error('Could not mark as read');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id).unwrap();
      toast.success('Notification removed');
    } catch {
      toast.error('Failed to delete notification');
    }
  };

  const handleActionClick = async (item) => {
    if (!item.isRead) {
      try {
        await markAsRead(item._id).unwrap();
      } catch {}
    }
    if (item.link) {
      navigate(item.link);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-600">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 font-['Outfit']">Notification Center</h1>
              <p className="text-xs text-slate-500">
                Live enterprise log of stock transfers, adjustment authorizations, and security alerts.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer"
            title="Refresh Feed"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={isMarkingAll}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm shadow-indigo-600/20 transition cursor-pointer"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Mark All Read</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleClearRead}
            disabled={isClearingRead}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 text-slate-600 text-xs font-semibold transition cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear Read</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Logged</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2 font-['Outfit']">{meta.total ?? notifications.length}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Unread Alerts</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
              <Bell className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-rose-600 mt-2 font-['Outfit']">{unreadCount}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Current Page</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Inbox className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2 font-['Outfit']">
            {meta.page || 1} <span className="text-sm font-normal text-slate-400">/ {meta.totalPages || 1}</span>
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search notifications by title, SKU, or notes..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
            />
          </div>

          {/* Status & Severity Filter Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Read / Unread Filter */}
            <select
              value={readFilter}
              onChange={(e) => {
                setReadFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="UNREAD">Unread Only</option>
              <option value="READ">Read Only</option>
            </select>

            {/* Severity Filter */}
            <select
              value={severityFilter}
              onChange={(e) => {
                setSeverityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Severities</option>
              <option value="INFO">Info</option>
              <option value="SUCCESS">Success</option>
              <option value="WARNING">Warning</option>
              <option value="DANGER">Danger</option>
            </select>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100 scrollbar-none">
          {[
            { key: 'ALL', label: 'All Modules' },
            { key: 'INVENTORY', label: 'Inventory Allocations' },
            { key: 'APPROVALS', label: 'Adjustment Approvals' },
            { key: 'HIERARCHY', label: 'Hierarchy & Downline' },
            { key: 'SECURITY', label: 'Security & Sessions' },
          ].map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => {
                setActiveCategory(cat.key);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                activeCategory === cat.key
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications Feed */}
      <div className="space-y-3">
        {isLoading ? (
          <ListSkeleton count={5} />
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-16 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
              <Inbox className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 font-['Outfit']">No notifications found</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              There are no notifications matching your current filters. Clear filters or check back later.
            </p>
          </div>
        ) : (
          notifications.map((item) => {
            const visual = getNotificationVisuals(item);
            const VisualIcon = visual.icon;

            return (
              <div
                key={item._id}
                className={`bg-white rounded-2xl border transition-all duration-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs ${
                  !item.isRead
                    ? 'border-indigo-200/90 bg-gradient-to-r from-white via-indigo-50/20 to-white ring-1 ring-indigo-500/10'
                    : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                {/* Left Visual & Body */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${visual.badgeBg} shadow-xs mt-0.5`}
                  >
                    <VisualIcon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-slate-900 tracking-tight">{item.title}</h4>
                      {!item.isRead && (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                          NEW
                        </span>
                      )}
                      <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        {item.category}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">{item.message}</p>

                    <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400 font-medium flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {formatRelativeTime(item.createdAt)}
                      </span>

                      {item.sender && (
                        <span className="text-slate-500">
                          From: {item.sender.firstName} {item.sender.lastName} ({item.sender.userType})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {item.link && (
                    <button
                      type="button"
                      onClick={() => handleActionClick(item)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 text-xs font-semibold transition cursor-pointer"
                    >
                      <span>Go to action</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}

                  {!item.isRead && (
                    <button
                      type="button"
                      onClick={() => handleMarkSingleRead(item._id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDelete(item._id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    title="Delete notification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Controls */}
      {meta.totalPages > 1 && (
        <div className="bg-white p-3.5 px-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Showing Page {meta.page} of {meta.totalPages} ({meta.total} total)
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition cursor-pointer"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={currentPage >= meta.totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
