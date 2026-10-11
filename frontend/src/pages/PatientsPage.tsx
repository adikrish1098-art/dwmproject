import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Filter,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { Patient } from '../types';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';

export const PatientsPage: React.FC = () => {
  const { role } = useAuth();
  const canEdit = ['Administrator', 'Doctor', 'Receptionist'].includes(role || '');

  const [patients, setPatients] = useState<Patient[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [search, setSearch] = useState<string>('');
  const [sexFilter, setSexFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedPatientProfile, setSelectedPatientProfile] = useState<any | null>(null);

  // Create Form State
  const [newPatient, setNewPatient] = useState({
    full_name: '',
    date_of_birth: '1985-05-15',
    age: 41,
    sex: 'Female',
    phone_number: '+1-555-0188',
    email: 'new.patient@example.com',
    address: '124 Healthcare Blvd, Metro',
    emergency_contact: 'Emergency Contact (+1-555-0999)',
  });

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        skip: String((page - 1) * 20),
        limit: '20',
        ...(search ? { search } : {}),
        ...(sexFilter ? { sex: sexFilter } : {}),
      }).toString();
      const res = await api.getPatients(query);
      setPatients(res.patients);
      setTotal(res.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [page, sexFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPatients();
  };

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      await api.createPatient(newPatient);
      setCreateModalOpen(false);
      fetchPatients();
    } catch (err: any) {
      setFormError(err.message || 'Error registering patient');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewProfile = async (id: string) => {
    try {
      const res = await api.getPatient(id);
      setSelectedPatientProfile(res);
      setProfileModalOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (window.confirm(`Are you sure you want to deactivate patient record ${id}?`)) {
      try {
        await api.deactivatePatient(id);
        fetchPatients();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-500" />
            Patient Registry
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Complete demographic and medical history database ({total} total records)
          </p>
        </div>

        {canEdit && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-bold rounded-xl text-xs shadow-md shadow-teal-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Register Patient
          </button>
        )}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearch} className="flex items-center gap-2 w-full md:w-96">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, name, or phone..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sexFilter}
              onChange={(e) => setSexFilter(e.target.value)}
              className="text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Sexes</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Patient ID</th>
                <th className="py-3 px-4">Full Name</th>
                <th className="py-3 px-4">Age / Sex</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    Loading patient records...
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    No matching patient records found.
                  </td>
                </tr>
              ) : (
                patients.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-teal-600 dark:text-teal-400">{p.id}</td>
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">{p.full_name}</td>
                    <td className="py-3 px-4">{p.age} yrs • {p.sex}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{p.phone_number || 'N/A'}</td>
                    <td className="py-3 px-4">
                      {p.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-500">
                          <CheckCircle className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-500">
                          <XCircle className="w-3 h-3" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleViewProfile(p.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-teal-500 hover:bg-teal-500/10 transition-colors"
                        title="View Patient Profile & History"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {canEdit && (
                        <button
                          onClick={() => handleDeactivate(p.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                          title="Deactivate Patient"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, total)} of {total} records
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              disabled={page * 20 >= total}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Patient Profile Modal */}
      <Modal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        title="Clinical Patient Profile & History"
        maxWidth="max-w-2xl"
      >
        {selectedPatientProfile && (
          <div className="space-y-5 text-xs">
            {/* Demographics Card */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-slate-400 block text-[10px]">PATIENT ID</span>
                <span className="font-bold font-mono text-teal-600 dark:text-teal-400">
                  {selectedPatientProfile.patient.id}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">FULL NAME</span>
                <span className="font-semibold">{selectedPatientProfile.patient.full_name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">AGE / SEX</span>
                <span>{selectedPatientProfile.patient.age} yrs • {selectedPatientProfile.patient.sex}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">PHONE</span>
                <span className="font-mono">{selectedPatientProfile.patient.phone_number || 'N/A'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block text-[10px]">ADDRESS</span>
                <span>{selectedPatientProfile.patient.address || 'N/A'}</span>
              </div>
            </div>

            {/* Inpatient Admissions History */}
            <div>
              <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-teal-500" />
                Inpatient Admission Timeline ({selectedPatientProfile.admissions?.length || 0})
              </h4>
              {selectedPatientProfile.admissions?.length === 0 ? (
                <p className="text-slate-400 italic">No inpatient admissions on file.</p>
              ) : (
                <div className="space-y-2">
                  {selectedPatientProfile.admissions.map((adm: any) => (
                    <div key={adm.id} className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold font-mono text-slate-800 dark:text-slate-200">{adm.id}</span>
                          <span className="text-slate-500">LOS: {adm.length_of_stay} days</span>
                          {adm.is_readmission_30d && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                              30-Day Readmission
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">Admitted: {adm.admission_date}</p>
                      </div>
                      <span className="font-semibold text-slate-600 dark:text-slate-300">{adm.admission_type}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Register Patient Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Register New Patient"
      >
        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}
        <form onSubmit={handleCreatePatient} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold mb-1">Full Name</label>
            <input
              type="text"
              required
              value={newPatient.full_name}
              onChange={(e) => setNewPatient({ ...newPatient, full_name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              placeholder="e.g. Jordan Miller"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Date of Birth</label>
              <input
                type="date"
                required
                value={newPatient.date_of_birth}
                onChange={(e) => setNewPatient({ ...newPatient, date_of_birth: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Age</label>
              <input
                type="number"
                required
                value={newPatient.age}
                onChange={(e) => setNewPatient({ ...newPatient, age: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>
          <div>
            <label className="block font-semibold mb-1">Sex</label>
            <select
              value={newPatient.sex}
              onChange={(e) => setNewPatient({ ...newPatient, sex: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold mb-1">Phone Number</label>
            <input
              type="tel"
              value={newPatient.phone_number}
              onChange={(e) => setNewPatient({ ...newPatient, phone_number: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>
          <div className="pt-3">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold rounded-xl cursor-pointer"
            >
              {submitting ? 'Registering...' : 'Save Patient Record'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
