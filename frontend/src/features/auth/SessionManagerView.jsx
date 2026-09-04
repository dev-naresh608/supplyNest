import React from 'react';
import {
  useGetSessionsQuery,
  useRevokeSessionMutation,
  useLogoutAllMutation,
} from '../../store/api/authApi';
import { Monitor, Smartphone, LogOut, Clock, ShieldAlert, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const SessionManagerView = () => {
  const { data: sessions = [], isLoading, isError } = useGetSessionsQuery();
  const [revokeSessionApi, { isLoading: isRevoking }] = useRevokeSessionMutation();
  const [logoutAllApi, { isLoading: isLoggingOutAll }] = useLogoutAllMutation();

  const handleRevokeSingle = async (sessionId, deviceName) => {
    try {
      await revokeSessionApi(sessionId).unwrap();
      toast.success(`Session on "${deviceName}" revoked`);
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Failed to revoke session');
    }
  };

  const handleLogoutAll = async () => {
    if (!window.confirm('Are you sure you want to revoke all other active sessions across devices?')) {
      return;
    }
    try {
      await logoutAllApi().unwrap();
      toast.success('Logged out from all other devices successfully');
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Failed to revoke all sessions');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-['Outfit']">Active Sessions & Security</h2>
          <p className="text-xs text-slate-500 font-medium">Manage connected devices and JWT refresh tokens</p>
        </div>

        <button
          onClick={handleLogoutAll}
          disabled={isLoggingOutAll}
          className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-2xs disabled:opacity-50"
        >
          <LogOut className="w-3.5 h-3.5" />
          {isLoggingOutAll ? 'Revoking...' : 'Revoke All Other Sessions'}
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 animate-pulse h-32" />
          ))}
        </div>
      ) : isError ? (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center text-rose-700 text-xs font-semibold flex items-center justify-center gap-2">
          <ShieldAlert className="w-4 h-4" />
          Failed to load active sessions. Please try refreshing.
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-xs font-medium bg-white rounded-3xl border border-slate-200">
          No other active sessions detected.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {sessions.map((session) => (
            <div
              key={session._id}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 flex items-start gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                {session.deviceName?.toLowerCase().includes('mobile') ||
                session.browser?.toLowerCase().includes('mobile') ? (
                  <Smartphone className="w-6 h-6" />
                ) : (
                  <Monitor className="w-6 h-6" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-bold text-slate-900 truncate">{session.deviceName}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-semibold">
                      Active
                    </span>
                    <button
                      onClick={() => handleRevokeSingle(session._id, session.deviceName)}
                      disabled={isRevoking}
                      title="Revoke this session"
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-500 font-medium">{session.browser}</p>
                <div className="mt-3.5 flex items-center gap-4 text-[11px] text-slate-500 font-medium pt-3 border-t border-slate-100">
                  <span>
                    IP: <strong className="text-slate-700">{session.ipAddress || '127.0.0.1'}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {new Date(session.lastActive).toLocaleDateString()} {new Date(session.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

