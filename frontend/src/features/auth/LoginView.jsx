import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLoginMutation } from '../../store/api/authApi';
import { Building2, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export const LoginView = () => {
  const [loginApi, { isLoading }] = useLoginMutation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@invora.com');
  const [password, setPassword] = useState('SuperAdmin@2026!');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await loginApi({ email, password }).unwrap();
      toast.success('Welcome back to Invora Platform');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Login failed. Please check your credentials.');
    }
  };


  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ambient Pastel Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-200/50 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-200/50 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-sky-200/40 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-white/95 backdrop-blur-xl p-8 sm:p-10 rounded-3xl relative z-10 border border-slate-200 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/25">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 font-['Outfit']">Invora Enterprise</h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">Distribution, Inventory & Business Hierarchy Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Business Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition font-medium"
                placeholder="admin@invora.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition font-medium"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 mt-2 rounded-xl glow-btn text-white font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-50"
          >
            {isLoading ? 'Authenticating...' : 'Sign In to Portal'}
            <ArrowRight className="w-4 h-4" />
          </button>

        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center text-[11px] text-slate-500 font-medium flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          JWT Token Rotation & HTTP-Only Secure Auth
        </div>
      </div>
    </div>
  );
};
