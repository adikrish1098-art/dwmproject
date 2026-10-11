import React, { useState, useEffect } from 'react';
import { BedDouble, Plus, RotateCcw, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { Admission, Doctor, Department } from '../types';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';

export const AdmissionsPage: React.FC = () => {
  const { role } = useAuth();
  const canManage = ['Administrator', 'Doctor', 'Receptionist'].includes(role || '');

  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [deptFilter, setDeptFilter] = useState<string>('');
  const [readmFilter, setReadmFilter] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [admitModalOpen, setAdmitModalOpen] = useState(false);
  const [dischargeModalOpen, setDischargeModalOpen] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState<Admission | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Admit Form
  const [admitForm, setAdmitForm] = useState({
    patient_id: 'PAT-1001',
    department_id: '',
    doctor_id: '',
    admission_date: '2026-11-20T10:00',
    admission_type: 'Emergency',
  });

  // Discharge Form
  const [dischargeDate, setDischargeDate] = useState('2026-11-25T14:00');
  const [dischargeStatus, setDischargeStatus] = useState('Discharged');

  const fetchData = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        ...(deptFilter ? { department_id: deptFilter } : {}),
        ...(readmFilter !== '' ? { is_readmission: readmFilter } : {}),
      }).toString();

      const [res, depts, docs] = await Promise.all([
        api.getAdmissions(query),
        api.getDepartments(),
        api.getDoctors(),
      ]);

      setAdmissions(res.admissions);
      setDepartments(depts);
      setDoctors(docs);

      if (depts.length > 0 && !admitForm.department_id) {
        setAdmitForm((prev) => ({
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
  }, [deptFilter, readmFilter]);

  const handleRegisterAdmission = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const formattedDate = admitForm.admission_date.length === 16 ? `${admitForm.admission_date}:00` : admitForm.admission_date;
    try {
      await api.createAdmission({
        ...admitForm,
        admission_date: formattedDate,
      });
      setAdmitModalOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to register admission');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDischarge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmission) return;
    setSubmitting(true);
    setError(null);
    const formattedDate = dischargeDate.length === 16 ? `${dischargeDate}:00` : dischargeDate;
    try {
      await api.dischargePatient(selectedAdmission.id, {
        discharge_date: formattedDate,
        discharge_status: dischargeStatus,
      });
      setDischargeModalOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to discharge patient');
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
            <BedDouble className="w-6 h-6 text-teal-500" />
            Inpatient Admissions & Discharges
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Tracking patient hospital stays, length of stay (LOS), and chronological 30-day readmissions.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => {
              setError(null);
              setAdmitModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-teal-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Admit Patient</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="flex-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>

        <select
          value={readmFilter}
          onChange={(e) => setReadmFilter(e.target.value)}
          className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">All Admissions</option>
          <option value="true">30-Day Readmissions Only</option>
          <option value="false">Initial / Standard Admissions Only</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : admissions.length === 0 ? (
          <div className="text-center py-16">
            <BedDouble className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No admissions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Admission ID</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Department & Doctor</th>
                  <th className="py-3 px-4">Admission Date</th>
                  <th className="py-3 px-4">Discharge Date</th>
                  <th className="py-3 px-4">LOS</th>
                  <th className="py-3 px-4">Readmission Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {admissions.map((adm) => (
                  <tr key={adm.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-teal-600 dark:text-teal-400">{adm.id}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white">
                      <div>{adm.patient_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{adm.patient_id}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                      <div>{adm.department_name}</div>
                      <div className="text-[10px] text-slate-400">{adm.doctor_name}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {new Date(adm.admission_date).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {adm.discharge_date ? (
                        new Date(adm.discharge_date).toLocaleDateString()
                      ) : (
                        <span className="text-amber-500 font-semibold">Active Inpatient</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">
                      {adm.length_of_stay > 0 ? `${adm.length_of_stay} d` : '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      {adm.is_readmission_30d ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                          <RotateCcw className="w-3 h-3" /> 30-Day Readmission
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          Primary
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {!adm.discharge_date && canManage && (
                        <button
                          onClick={() => {
                            setSelectedAdmission(adm);
                            setDischargeModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 rounded-lg text-[11px] font-semibold transition-colors"
                        >
                          Discharge
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Admit Modal */}
      <Modal isOpen={admitModalOpen} onClose={() => setAdmitModalOpen(false)} title="Register Patient Admission">
        <form onSubmit={handleRegisterAdmission} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Patient ID</label>
            <input
              type="text"
              required
              value={admitForm.patient_id}
              onChange={(e) => setAdmitForm({ ...admitForm, patient_id: e.target.value.toUpperCase() })}
              placeholder="PAT-1001"
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Department</label>
              <select
                value={admitForm.department_id}
                onChange={(e) => setAdmitForm({ ...admitForm, department_id: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Attending Doctor</label>
              <select
                value={admitForm.doctor_id}
                onChange={(e) => setAdmitForm({ ...admitForm, doctor_id: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Admission Type</label>
              <select
                value={admitForm.admission_type}
                onChange={(e) => setAdmitForm({ ...admitForm, admission_type: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="Emergency">Emergency</option>
                <option value="Elective">Elective</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Admission Date & Time</label>
              <input
                type="datetime-local"
                required
                value={admitForm.admission_date}
                onChange={(e) => setAdmitForm({ ...admitForm, admission_date: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-300 text-[11px] leading-relaxed">
            <strong>Automatic 30-Day Readmission Detection:</strong> The backend checks prior discharge dates for this patient. If a previous discharge occurred within ≤ 30 days, the record is flagged as a 30-day readmission.
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setAdmitModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-teal-500/20 disabled:opacity-50"
            >
              {submitting ? 'Registering...' : 'Admit Patient'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Discharge Modal */}
      <Modal isOpen={dischargeModalOpen} onClose={() => setDischargeModalOpen(false)} title={`Discharge Patient (${selectedAdmission?.id})`}>
        <form onSubmit={handleDischarge} className="space-y-4">
          <p className="text-xs text-slate-400">
            Record discharge date and status. Length of stay (LOS) will be automatically computed in days.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Discharge Date & Time</label>
            <input
              type="datetime-local"
              required
              value={dischargeDate}
              onChange={(e) => setDischargeDate(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Discharge Status</label>
            <select
              value={dischargeStatus}
              onChange={(e) => setDischargeStatus(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="Discharged">Discharged Routine</option>
              <option value="Transferred">Transferred to Higher Facility</option>
              <option value="Against Medical Advice">Left Against Medical Advice (AMA)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setDischargeModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-teal-500/20 disabled:opacity-50"
            >
              {submitting ? 'Discharging...' : 'Confirm Discharge'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
