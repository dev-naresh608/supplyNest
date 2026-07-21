import React, { useEffect, useState } from 'react';
import { api } from '../../config/axios';
import { Monitor, Smartphone, ShieldAlert, LogOut, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export const SessionManagerView = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    try {
      const res = await api.get('/auth/sessions');
      setSessions(res.data || []);
    } catch (err) {
      toast.error('Failed to load active sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleLogoutAll = async () => {
    try {
      await api.post('/auth/logout-all');
      toast.success('Logged out from all devices successfully');
      fetchSessions();
    } catch (err) {
      toast.error('Failed to logout from all devices');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white font-['Outfit']">Active Sessions & Security</h2>
          <p className="text-xs text-slate-400">Manage connected devices and JWT refresh tokens</p>
        </div>

        <button
          onClick={handleLogoutAll}
          className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          Revoke All Other Sessions
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sessions.map((session) => (
          <div key={session._id} className="glass-card rounded-2xl p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-indigo-400">
              {session.deviceName?.toLowerCase().includes('mobile') ? (
                <Smartphone className="w-5 h-5" />
              ) : (
                <Monitor className="w-5 h-5" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-semibold text-slate-200 truncate">{session.deviceName}</h4>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Active
                </span>
              </div>

              <p className="text-xs text-slate-400">{session.browser}</p>
              <div className="mt-3 flex items-center gap-4 text-[11px] text-slate-500">
                <span>IP: {session.ipAddress || '127.0.0.1'}</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(session.lastActive).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
