import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HeartPulse, Lock, User, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('admin');
  const [password, setPassword] = useState('AdminPassword123!');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login({ username_or_email: identifier, password });
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  // Quick 1-click Demo Fillers for Viva Examiner / Student Demonstration
  const setDemoCredentials = (u: string, p: string) => {
    setIdentifier(u);
    setPassword(p);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6 text-slate-100">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 items-center justify-center text-white shadow-xl shadow-teal-500/20 mb-4">
            <HeartPulse className="w-8 h-8 stroke-[2.5]" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Hospital Data Warehouse</h2>
          <p className="text-xs text-slate-400 mt-1">Clinical Intelligence & Data Mining Platform</p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <h3 className="text-lg font-bold text-white mb-2">Sign in to your account</h3>
          <p className="text-xs text-slate-400 mb-6">Enter your authorized medical or analytical credentials</p>

          {error && (
            <div className="mb-6 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Username or Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  placeholder="admin or user@hospital.org"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">Password</label>
                <Link to="/forgot-password" className="text-xs text-teal-400 hover:text-teal-300 font-medium">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 disabled:opacity-50 transition-all cursor-pointer mt-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Buttons */}
          <div className="mt-6 pt-6 border-t border-slate-800">
            <p className="text-[11px] font-semibold text-slate-400 mb-2.5 uppercase tracking-wider text-center">
              Quick Demo Logins (Viva Presets)
            </p>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => setDemoCredentials('admin', 'AdminPassword123!')}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700/80 text-left text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                <div className="font-bold text-teal-400">Administrator</div>
                <div className="text-[10px] text-slate-400">admin</div>
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials('dr.robert', 'DoctorPassword123!')}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700/80 text-left text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                <div className="font-bold text-blue-400">Doctor</div>
                <div className="text-[10px] text-slate-400">dr.robert</div>
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials('reception', 'ReceptionPassword123!')}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700/80 text-left text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                <div className="font-bold text-amber-400">Receptionist</div>
                <div className="text-[10px] text-slate-400">reception</div>
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials('analyst', 'AnalystPassword123!')}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700/80 text-left text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                <div className="font-bold text-purple-400">Data Analyst</div>
                <div className="text-[10px] text-slate-400">analyst</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-500 mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-teal-400 hover:text-teal-300 font-semibold">
            Create public account
          </Link>
        </p>
      </div>
    </div>
  );
};
