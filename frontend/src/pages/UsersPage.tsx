import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, UserPlus, CheckCircle2, XCircle, AlertCircle, Shield } from 'lucide-react';
import { api } from '../services/api';
import { User, UserRole } from '../types';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';

export const UsersPage: React.FC = () => {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<UserRole>('Receptionist');

  const [form, setForm] = useState({
    username: '',
    email: '',
    full_name: '',
    password: 'DemoPassword123!',
    role: 'Receptionist' as UserRole,
    phone_number: '+1-555-0199',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        ...(search ? { search } : {}),
        ...(roleFilter ? { role: roleFilter } : {}),
      }).toString();
      const res = await api.getUsers(q);
      setUsers(res.users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.createUser(form);
      setCreateModalOpen(false);
      setForm({ username: '', email: '', full_name: '', password: 'DemoPassword123!', role: 'Receptionist', phone_number: '+1-555-0199' });
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to create user account');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.updateUserRole(selectedUser.id, newRole);
      setRoleModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to update user role');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    if (user.id === currentAdmin?.id) {
      alert('You cannot deactivate your own administrator account.');
      return;
    }
    try {
      await api.toggleUserStatus(user.id, !user.is_active);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Error toggling account status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-teal-500" />
            User Management & Role-Based Access Control
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Enforce role policies: Administrator, Doctor, Receptionist, and Data Analyst.
          </p>
        </div>

        <button
          onClick={() => {
            setError(null);
            setCreateModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-teal-500/20 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>Provision User</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by full name, username, or email..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">All Roles</option>
          <option value="Administrator">Administrator</option>
          <option value="Doctor">Doctor</option>
          <option value="Receptionist">Receptionist</option>
          <option value="Data Analyst">Data Analyst</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16">
            <Shield className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Assigned Role</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Last Login</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white">
                      <div className="font-semibold">{u.full_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">@{u.username}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          u.role === 'Administrator'
                            ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                            : u.role === 'Doctor'
                            ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
                            : u.role === 'Data Analyst'
                            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      <div>{u.email}</div>
                      {u.phone_number && <div className="text-[10px] text-slate-400">{u.phone_number}</div>}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {u.last_login ? new Date(u.last_login).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Never'}
                    </td>
                    <td className="py-3.5 px-4">
                      {u.is_active ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
                          <XCircle className="w-3 h-3" /> Deactivated
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setSelectedUser(u);
                          setNewRole(u.role);
                          setRoleModalOpen(true);
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-[11px] font-semibold transition-colors"
                      >
                        Change Role
                      </button>

                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                          u.is_active
                            ? 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                            : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                        }`}
                      >
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Provision User Modal */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Provision New User Account">
        <form onSubmit={handleCreateUser} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder="Dr. Gregory House"
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Username</label>
              <input
                type="text"
                required
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="ghouse"
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="Administrator">Administrator</option>
                <option value="Doctor">Doctor</option>
                <option value="Receptionist">Receptionist</option>
                <option value="Data Analyst">Data Analyst</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="ghouse@hospital.org"
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Temporary Password</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-teal-500/20 disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Provision User'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Change Role Modal */}
      <Modal isOpen={roleModalOpen} onClose={() => setRoleModalOpen(false)} title={`Change Role for ${selectedUser?.username}`}>
        <form onSubmit={handleUpdateRole} className="space-y-4">
          <p className="text-xs text-slate-400">
            Select the new permission tier for <strong className="text-white">{selectedUser?.full_name}</strong>.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">New Role</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as UserRole)}
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="Administrator">Administrator (Full Access)</option>
              <option value="Doctor">Doctor (Clinical Inpatient / Analytics)</option>
              <option value="Receptionist">Receptionist (Appointments / Registration)</option>
              <option value="Data Analyst">Data Analyst (ETL / De-identified Mining)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setRoleModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-teal-500/20 disabled:opacity-50"
            >
              {submitting ? 'Updating...' : 'Save Role'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
