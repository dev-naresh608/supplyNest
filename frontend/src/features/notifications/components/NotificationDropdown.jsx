import React, { useState, useRef, useEffect } from 'react';
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
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
} from '../../../store/api/notificationApi';

// Helper for human-readable relative time
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
  return past.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

// Helper for severity and type styling
const getNotificationVisuals = (item) => {
  const { type, severity } = item;

  if (type === 'STOCK_ASSIGNMENT' || type === 'STOCK_ADJUSTMENT_APPROVED' || severity === 'SUCCESS') {
    return {
      icon: CheckCircle2,
      bg: 'bg-emerald-50 text-emerald-600 border-emerald-200/80',
      badge: 'bg-emerald-100 text-emerald-800',
    };
  }

  if (type === 'STOCK_ADJUSTMENT_REQUEST' || type === 'LOW_STOCK_ALERT' || severity === 'WARNING') {
    return {
      icon: AlertTriangle,
      bg: 'bg-amber-50 text-amber-600 border-amber-200/80',
      badge: 'bg-amber-100 text-amber-800',
    };
  }

  if (type === 'STOCK_ADJUSTMENT_REJECTED' || severity === 'DANGER') {
    return {
      icon: XCircle,
      bg: 'bg-rose-50 text-rose-600 border-rose-200/80',
      badge: 'bg-rose-100 text-rose-800',
    };
  }

  if (type === 'CHILD_NODE_CREATED' || type === 'NODE_TRANSFERRED' || item.category === 'HIERARCHY') {
    return {
      icon: GitFork,
      bg: 'bg-indigo-50 text-indigo-600 border-indigo-200/80',
      badge: 'bg-indigo-100 text-indigo-800',
    };
  }

  if (severity === 'SECURITY' || type === 'SECURITY_ALERT') {
    return {
      icon: ShieldAlert,
      bg: 'bg-purple-50 text-purple-600 border-purple-200/80',
      badge: 'bg-purple-100 text-purple-800',
    };
  }

  return {
    icon: Boxes,
    bg: 'bg-slate-50 text-slate-600 border-slate-200/80',
    badge: 'bg-slate-100 text-slate-700',
  };
};

export const NotificationDropdown = ({ isMobile = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'UNREAD' | 'INVENTORY' | 'APPROVALS'
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Fast polling unread count query (polls every 15 seconds)
  const { data: unreadCount = 0 } = useGetUnreadCountQuery(undefined, {
    pollingInterval: 15000,
  });

  // Query notifications with active tab filter (dropdown shows max 3 items)
  const filterParams = {
    limit: 3,
    ...(activeTab === 'UNREAD' ? { isRead: 'false' } : {}),
    ...(activeTab === 'INVENTORY' ? { category: 'INVENTORY' } : {}),
    ...(activeTab === 'APPROVALS' ? { category: 'APPROVALS' } : {}),
  };

  const { data: notificationsData, isFetching } = useGetNotificationsQuery(filterParams, {
    skip: !isOpen,
    pollingInterval: isOpen ? 15000 : 0,
  });

  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead, { isLoading: isMarkingAll }] = useMarkAllAsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();

  const notifications = (notificationsData?.items || []).slice(0, 3);

  // Close dropdown when clicked outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    try {
      await markAllAsRead().unwrap();
      toast.success('All marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const handleItemClick = async (item) => {
    if (!item.isRead) {
      try {
        await markAsRead(item._id).unwrap();
      } catch {
        // Continue navigation regardless
      }
    }
    setIsOpen(false);
    if (item.link) {
      navigate(item.link);
    }
  };

  const handleQuickMarkRead = async (e, id) => {
    e.stopPropagation();
    try {
      await markAsRead(id).unwrap();
      toast.success('Marked as read');
    } catch {
      toast.error('Could not mark as read');
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await deleteNotification(id).unwrap();
      toast.success('Notification removed');
    } catch {
      toast.error('Could not delete notification');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        id="notification-bell-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`relative p-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
          isOpen
            ? 'bg-indigo-50 text-indigo-600 ring-2 ring-indigo-500/20'
            : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
        }`}
        aria-label="Notifications"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <>
            <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white animate-in zoom-in duration-200">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
            <span className="absolute -top-1 -right-1 h-5 min-w-5 rounded-full bg-rose-500 animate-ping opacity-30"></span>
          </>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className={`absolute ${
            isMobile ? 'right-0 w-[calc(100vw-2rem)] max-w-sm' : 'right-0 w-96'
          } mt-2 z-50 bg-white border border-slate-200/90 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col max-h-[calc(100vh-5.5rem)]`}
        >
          {/* Header */}
          <div className="p-3.5 px-4 bg-gradient-to-r from-slate-50 to-indigo-50/40 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-slate-900 font-['Outfit']">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-100 text-indigo-700">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  disabled={isMarkingAll}
                  className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter Pills */}
          <div className="px-3 pt-2 pb-2 bg-white border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto text-xs scrollbar-none">
            {[
              { key: 'ALL', label: 'All' },
              { key: 'UNREAD', label: `Unread (${unreadCount})` },
              { key: 'INVENTORY', label: 'Inventory' },
              { key: 'APPROVALS', label: 'Approvals' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Notifications List */}
          <div className="max-h-[290px] overflow-y-auto divide-y divide-slate-100 flex-1">
            {isFetching && notifications.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs">Loading notifications...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 px-4 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mb-3">
                  <Sparkles className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-800">All caught up!</p>
                <p className="text-xs text-slate-500 mt-1 max-w-[220px]">
                  {activeTab === 'UNREAD'
                    ? 'You have no unread notifications.'
                    : 'No notifications found in this category.'}
                </p>
              </div>
            ) : (
              notifications.map((item) => {
                const visual = getNotificationVisuals(item);
                const VisualIcon = visual.icon;

                return (
                  <div
                    key={item._id}
                    onClick={() => handleItemClick(item)}
                    className={`group p-3 px-4 flex items-start gap-3 transition cursor-pointer hover:bg-slate-50/80 relative ${
                      !item.isRead ? 'bg-indigo-50/25' : 'bg-white'
                    }`}
                  >
                    {/* Visual Icon Badge */}
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${visual.bg} shadow-xs mt-0.5`}
                    >
                      <VisualIcon className="w-4 h-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-12">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <h4
                          className={`text-xs truncate ${
                            !item.isRead ? 'font-bold text-slate-900' : 'font-medium text-slate-700'
                          }`}
                        >
                          {item.title}
                        </h4>
                        {!item.isRead && (
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0"></span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {item.message}
                      </p>

                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] text-slate-400 font-medium">
                          {formatRelativeTime(item.createdAt)}
                        </span>
                        {item.link && (
                          <span className="text-[10px] text-indigo-600 font-semibold flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
                            Action <ArrowRight className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Floating Actions on Hover */}
                    <div className="absolute right-3 top-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!item.isRead && (
                        <button
                          type="button"
                          onClick={(e) => handleQuickMarkRead(e, item._id)}
                          className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                          title="Mark as read"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, item._id)}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Delete notification"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 px-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-500">Real-time sync active</span>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate('/notifications');
              }}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 transition cursor-pointer"
            >
              <span>View All Center</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
