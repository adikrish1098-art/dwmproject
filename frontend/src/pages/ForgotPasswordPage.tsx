import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { HeartPulse, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.forgotPassword({ email });
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Error requesting password reset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6 text-slate-100">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 items-center justify-center text-white shadow-xl shadow-teal-500/20 mb-3">
            <HeartPulse className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Reset Password</h2>
          <p className="text-xs text-slate-400 mt-1">Hospital Data Warehouse Security Service</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {result ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">{result.message}</p>
                  <p className="text-[11px] text-emerald-400/80 mt-1">{result.note}</p>
                </div>
              </div>

              {result.demo_reset_link && (
                <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/20">
                  <p className="text-xs font-bold text-teal-300 mb-1">College Demo Reset Token Link:</p>
                  <Link
                    to={result.demo_reset_link}
                    className="text-xs font-mono text-teal-400 hover:underline break-all block"
                  >
                    Click here to reset your password directly
                  </Link>
                </div>
              )}

              <Link
                to="/login"
                className="block text-center text-xs text-teal-400 hover:text-teal-300 font-semibold pt-2"
              >
                Return to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Enter your registered hospital email address. In this college demo environment, a single-use expiring token link will be returned for interactive verification.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="admin@hospital.org"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Generating Reset Token...' : 'Generate Reset Link'}
              </button>

              <div className="text-center pt-2">
                <Link to="/login" className="text-xs text-slate-400 hover:text-slate-300 font-medium">
                  Remember your password? Return to login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
