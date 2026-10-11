import React, { useState, useEffect } from 'react';
import { Building2, Plus, Users, Calendar, BedDouble, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { Department } from '../types';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';

export const DepartmentsPage: React.FC = () => {
  const { role } = useAuth();
  const isAdmin = role === 'Administrator';

  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    id: '',
    name: '',
    description: '',
  });

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const data = await api.getDepartments();
      setDepartments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.createDepartment(form);
      setModalOpen(false);
      setForm({ id: '', name: '', description: '' });
      fetchDepartments();
    } catch (err: any) {
      setError(err.message || 'Failed to create department');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-teal-500" />
            Clinical Hospital Departments
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Multidisciplinary medical divisions supporting dimensional cubes and OLAP hierarchy.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-teal-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Department</span>
          </button>
        )}
      </div>

      {/* Department Cards Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {departments.map((dept) => (
            <div
              key={dept.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:border-teal-500/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                    {dept.id}
                  </span>
                  <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    Active Unit
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-3">{dept.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {dept.description || 'General inpatient & outpatient care division.'}
                </p>
              </div>

              {/* Department Statistics */}
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center justify-center text-teal-500 mb-1">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <span className="block text-sm font-bold text-slate-800 dark:text-slate-200">
                    {dept.doctor_count ?? 0}
                  </span>
                  <span className="text-[9px] text-slate-400 uppercase font-semibold">Doctors</span>
                </div>

                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center justify-center text-cyan-500 mb-1">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <span className="block text-sm font-bold text-slate-800 dark:text-slate-200">
                    {dept.appointment_count ?? 0}
                  </span>
                  <span className="text-[9px] text-slate-400 uppercase font-semibold">Appts</span>
                </div>

                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center justify-center text-indigo-500 mb-1">
                    <BedDouble className="w-3.5 h-3.5" />
                  </div>
                  <span className="block text-sm font-bold text-slate-800 dark:text-slate-200">
                    {dept.admission_count ?? 0}
                  </span>
                  <span className="text-[9px] text-slate-400 uppercase font-semibold">Admissions</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for adding department */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create Clinical Department">
        <form onSubmit={handleCreateDepartment} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Department Code / ID</label>
            <input
              type="text"
              required
              value={form.id}
              onChange={(e) => setForm({ ...form, id: e.target.value.toUpperCase() })}
              placeholder="DEP-DER (Dermatology)"
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Department Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Dermatology & Cutaneous Surgery"
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Clinical scope, diagnostic capabilities, and specialized equipment."
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
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
              {submitting ? 'Creating...' : 'Save Department'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
