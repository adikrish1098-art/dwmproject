import React, { useState, useEffect } from 'react';
import { History, Search } from 'lucide-react';
import { api } from '../services/api';
import { AuditLog } from '../types';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [actionFilter, setActionFilter] = useState<string>('');
  const [userFilter, setUserFilter] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        ...(actionFilter ? { action: actionFilter } : {}),
        ...(userFilter ? { username: userFilter } : {}),
      }).toString();
      const res = await api.getAuditLogs(q);
      setLogs(res.logs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, userFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-6 h-6 text-teal-500" />
            Security Audit Trail & Compliance Logs
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Immutable tracking of logins, role updates, patient modifications, ETL runs, and model training.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            placeholder="Filter by acting username (e.g. admin, dr.robert)..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">All Action Types</option>
          <option value="LOGIN">Authentication Events</option>
          <option value="USER">User & Role Management</option>
          <option value="PATIENT">Patient Operations</option>
          <option value="ETL">ETL Pipeline Jobs</option>
          <option value="ML">Machine Learning & Mining</option>
          <option value="REPORT">Report Exports</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16">
            <History className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No audit events found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Timestamp (UTC)</th>
                  <th className="py-3 px-4">Acting User</th>
                  <th className="py-3 px-4">Action Event</th>
                  <th className="py-3 px-4">Target Resource</th>
                  <th className="py-3 px-4">Event Details</th>
                  <th className="py-3 px-4">Client IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap text-[11px]">
                      {new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}
                    </td>
                    <td className="py-3 px-4 font-sans font-semibold text-slate-800 dark:text-slate-200">
                      @{log.username}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-teal-600 dark:text-teal-400 border border-slate-200 dark:border-slate-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 uppercase text-[10px]">
                      {log.resource}
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-600 dark:text-slate-300 max-w-sm truncate text-[11px]">
                      {log.details || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {log.ip_address || '127.0.0.1'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
