import React, { useState, useEffect } from 'react';
import { Activity, Search, Plus, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { Encounter, Department, Doctor } from '../types';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';

export const DiagnosesPage: React.FC = () => {
  const { role } = useAuth();
  const canCreate = ['Administrator', 'Doctor'].includes(role || '');

  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [categories, setCategories] = useState<{ category: string; count: number }[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Encounter modal
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    patient_id: 'PAT-1001',
    doctor_id: '',
    department_id: '',
    encounter_type: 'Outpatient',
    notes: 'Clinical routine evaluation.',
    diag_code: 'I10',
    diag_category: 'Cardiovascular',
    diag_desc: 'Essential (primary) hypertension',
    procedure_name: 'Electrocardiogram (ECG)',
    procedure_category: 'Cardiology Diagnostics',
    procedure_cost: 150.0,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [encRes, catRes, depts, docs] = await Promise.all([
        api.getEncounters(),
        api.getDiagnosisCategories(),
        api.getDepartments(),
        api.getDoctors(),
      ]);

      setEncounters(encRes.encounters);
      setCategories(catRes);
      setDepartments(depts);
      setDoctors(docs);

      if (depts.length > 0 && !form.department_id) {
        setForm((prev) => ({
          ...prev,
          department_id: depts[0].id,
          doctor_id: docs[0]?.id || '',
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateEncounter = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.createEncounter({
        patient_id: form.patient_id,
        doctor_id: form.doctor_id,
        department_id: form.department_id,
        encounter_type: form.encounter_type,
        notes: form.notes,
        diagnoses: [
          {
            code: form.diag_code,
            category: form.diag_category,
            description: form.diag_desc,
            is_primary: true,
          },
        ],
        treatments: [
          {
            procedure_name: form.procedure_name,
            category: form.procedure_category,
            cost: form.procedure_cost,
          },
        ],
      });
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to create encounter');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredEncounters = encounters.filter((enc) => {
    const matchesSearch = search
      ? enc.id.toLowerCase().includes(search.toLowerCase()) ||
        enc.patient_id.toLowerCase().includes(search.toLowerCase()) ||
        enc.diagnoses.some((d) => d.category.toLowerCase().includes(search.toLowerCase()) || d.description.toLowerCase().includes(search.toLowerCase()))
      : true;

    const matchesCat =
      selectedCategory === 'All'
        ? true
        : enc.diagnoses.some((d) => d.category === selectedCategory);

    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-teal-500" />
            Clinical Diagnoses & Treatment Records
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Encounter-level ICD-10 diagnostic codes, procedural treatments, and co-occurrence logs.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => {
              setError(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-teal-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Clinical Encounter</span>
          </button>
        )}
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        <button
          onClick={() => setSelectedCategory('All')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            selectedCategory === 'All'
              ? 'bg-teal-600 text-white shadow-md shadow-teal-500/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          All Diagnoses
        </button>
        {categories.map((c) => (
          <button
            key={c.category}
            onClick={() => setSelectedCategory(c.category)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              selectedCategory === c.category
                ? 'bg-teal-600 text-white shadow-md shadow-teal-500/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>{c.category}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 font-mono">
              {c.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by encounter ID, patient ID, diagnosis code, or condition..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Encounters List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredEncounters.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Activity className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No clinical encounters match</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEncounters.map((enc) => (
            <div
              key={enc.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:border-teal-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-teal-600 dark:text-teal-400">{enc.id}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {enc.encounter_type}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(enc.encounter_date).toLocaleDateString()}
                  </span>
                </div>

                <div className="text-xs font-semibold text-slate-900 dark:text-white">
                  Patient: {enc.patient_name} <span className="text-slate-400 font-normal">({enc.patient_id})</span> • Doctor: {enc.doctor_name}
                </div>

                {enc.notes && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                    "{enc.notes}"
                  </p>
                )}
              </div>

              {/* Diagnoses & Procedures Badges */}
              <div className="flex flex-wrap items-center gap-2 md:max-w-md md:justify-end">
                {enc.diagnoses.map((d) => (
                  <span
                    key={d.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800"
                    title={d.description}
                  >
                    <span className="font-mono text-[10px] text-teal-500">{d.code}</span>
                    <span>{d.category}</span>
                  </span>
                ))}

                {enc.treatments.map((t) => (
                  <span
                    key={t.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                  >
                    <span>{t.procedure_name}</span>
                    <span className="text-[10px] text-indigo-400 font-mono">${t.cost.toFixed(0)}</span>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal to Create Clinical Encounter */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Record Clinical Encounter">
        <form onSubmit={handleCreateEncounter} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Patient ID</label>
              <input
                type="text"
                required
                value={form.patient_id}
                onChange={(e) => setForm({ ...form, patient_id: e.target.value.toUpperCase() })}
                placeholder="PAT-1001"
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Encounter Type</label>
              <select
                value={form.encounter_type}
                onChange={(e) => setForm({ ...form, encounter_type: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="Outpatient">Outpatient</option>
                <option value="Inpatient">Inpatient</option>
                <option value="Emergency">Emergency</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Department</label>
              <select
                value={form.department_id}
                onChange={(e) => setForm({ ...form, department_id: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Doctor</label>
              <select
                value={form.doctor_id}
                onChange={(e) => setForm({ ...form, doctor_id: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Primary Diagnosis */}
          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-3">
            <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider">Primary Diagnosis (ICD-10)</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Code</label>
                <input
                  type="text"
                  required
                  value={form.diag_code}
                  onChange={(e) => setForm({ ...form, diag_code: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Category</label>
                <input
                  type="text"
                  required
                  value={form.diag_category}
                  onChange={(e) => setForm({ ...form, diag_category: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Description</label>
              <input
                type="text"
                required
                value={form.diag_desc}
                onChange={(e) => setForm({ ...form, diag_desc: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
              />
            </div>
          </div>

          {/* Treatment */}
          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-3">
            <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Associated Procedure / Treatment</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Procedure Name</label>
                <input
                  type="text"
                  required
                  value={form.procedure_name}
                  onChange={(e) => setForm({ ...form, procedure_name: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Cost ($)</label>
                <input
                  type="number"
                  required
                  value={form.procedure_cost}
                  onChange={(e) => setForm({ ...form, procedure_cost: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono"
                />
              </div>
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
              {submitting ? 'Saving...' : 'Record Encounter'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
