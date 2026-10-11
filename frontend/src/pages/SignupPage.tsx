import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HeartPulse, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    username: '',
    password: '',
    confirm_password: '',
    phone_number: '',
    terms_acknowledged: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match.');
      return;
    }

    if (!formData.terms_acknowledged) {
      setError('You must acknowledge the terms and conditions.');
      return;
    }

    setLoading(true);
    try {
      await api.signup(formData);
      setSuccess('Account created successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6 text-slate-100">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 items-center justify-center text-white shadow-xl shadow-teal-500/20 mb-3">
            <HeartPulse className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Register Account</h2>
          <p className="text-xs text-slate-400 mt-1">Hospital Data Warehouse Access Registration</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <div className="mb-4 p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-300 text-[11px] leading-relaxed">
            <strong>Security Notice:</strong> Public signups automatically receive a restricted default role (Receptionist). High-privilege administrative accounts must be provisioned by the Hospital Administrator.
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Dr. Alex Morgan or Taylor Smith"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="asmith"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="asmith@hospital.org"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number (Optional)</label>
              <input
                type="tel"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="+1-555-0199"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="••••••••••••"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Confirm Password</label>
                <input
                  type="password"
                  required
                  value={formData.confirm_password}
                  onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="terms"
                required
                checked={formData.terms_acknowledged}
                onChange={(e) => setFormData({ ...formData, terms_acknowledged: e.target.checked })}
                className="rounded border-slate-700 text-teal-500 focus:ring-teal-500 bg-slate-800"
              />
              <label htmlFor="terms" className="text-xs text-slate-400">
                I agree to the college demonstration terms & privacy guidelines.
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-2.5 px-4 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Creating Account...' : 'Complete Registration'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-teal-400 hover:text-teal-300 font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
