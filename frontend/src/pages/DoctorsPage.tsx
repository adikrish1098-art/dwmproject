import React, { useState, useEffect } from 'react';
import { UserCheck, Search, Plus, Building2, Phone, Mail, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { Doctor, Department } from '../types';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';

export const DoctorsPage: React.FC = () => {
  const { role } = useAuth();
  const isAdmin = role === 'Administrator';

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    specialty: '',
    department_id: '',
    contact_number: '+1-555-0155',
    email: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [docs, depts] = await Promise.all([
        api.getDoctors(selectedDept),
        api.getDepartments(),
      ]);
      setDoctors(docs);
      setDepartments(depts);
      if (depts.length > 0 && !form.department_id) {
        setForm((prev) => ({ ...prev, department_id: depts[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDept]);

  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.createDoctor(form);
      setModalOpen(false);
      setForm({ name: '', specialty: '', department_id: departments[0]?.id || '', contact_number: '+1-555-0155', email: '' });
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to register doctor');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredDoctors = doctors.filter((d) =>
    search ? d.name.toLowerCase().includes(search.toLowerCase()) || d.specialty.toLowerCase().includes(search.toLowerCase()) : true
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-teal-500" />
            Medical Staff & Doctor Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track clinical specialties, department assignments, and appointment workloads.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-teal-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Doctor</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by doctor name or clinical specialty..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="All">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      {/* Doctor Cards Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <UserCheck className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No doctors found</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your department filter or search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDoctors.map((doc) => (
            <div
              key={doc.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:border-teal-500/40 transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                    {doc.id}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1.5">{doc.name}</h3>
                  <p className="text-xs text-teal-600 dark:text-teal-400 font-medium">{doc.specialty}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {doc.is_available ? (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="w-3 h-3" /> Available
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] text-slate-500 font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                      <XCircle className="w-3 h-3" /> Busy
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>{doc.department_name}</span>
                </div>
                {doc.contact_number && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{doc.contact_number}</span>
                  </div>
                )}
                {doc.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{doc.email}</span>
                  </div>
                )}
              </div>

              {/* Workload Stats */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                <div>
                  <span>Appointments: </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{doc.appointment_count ?? 0}</span>
                </div>
                <div>
                  <span>Admissions: </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{doc.admission_count ?? 0}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for creating doctor */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Register New Doctor">
        <form onSubmit={handleCreateDoctor} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Doctor Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Dr. Gregory House"
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Specialty</label>
            <input
              type="text"
              required
              value={form.specialty}
              onChange={(e) => setForm({ ...form, specialty: e.target.value })}
              placeholder="Interventional Cardiology"
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Department</label>
            <select
              value={form.department_id}
              onChange={(e) => setForm({ ...form, department_id: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name} ({d.id})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Phone</label>
              <input
                type="text"
                value={form.contact_number}
                onChange={(e) => setForm({ ...form, contact_number: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="doctor@hospital.org"
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-teal-500/20 disabled:opacity-50"
            >
              {submitting ? 'Registering...' : 'Register Doctor'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
