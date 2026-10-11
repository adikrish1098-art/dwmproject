import React, { useState, useEffect } from 'react';
import { Calendar, Plus, AlertCircle, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';
import { Appointment, Doctor } from '../types';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';

export const AppointmentsPage: React.FC = () => {
  const { role } = useAuth();
  const canSchedule = ['Administrator', 'Doctor', 'Receptionist'].includes(role || '');

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  const [form, setForm] = useState({
    patient_id: 'PAT-1001',
    doctor_id: '',
    department_id: '',
    appointment_date: '2026-11-20T10:00',
    reason: 'Routine outpatient consultation and evaluation.',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        ...(statusFilter ? { status_filter: statusFilter } : {}),
        ...(dateFilter ? { date_str: dateFilter } : {}),
      }).toString();

      const [res, docs] = await Promise.all([
        api.getAppointments(query),
        api.getDoctors(),
      ]);

      setAppointments(res.appointments);
      setDoctors(docs);

      if (docs.length > 0 && !form.doctor_id) {
        setForm((prev) => ({
          ...prev,
          doctor_id: docs[0].id,
          department_id: docs[0].department_id,
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
  }, [statusFilter, dateFilter]);

  const handleDoctorChange = (docId: string) => {
    const doc = doctors.find((d) => d.id === docId);
    setForm((prev) => ({
      ...prev,
      doctor_id: docId,
      department_id: doc ? doc.department_id : prev.department_id,
    }));
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setConflictWarning(null);

    // Format ISO datetime string: YYYY-MM-DDTHH:MM:SS
    const formattedDate = form.appointment_date.length === 16 ? `${form.appointment_date}:00` : form.appointment_date;

    try {
      await api.createAppointment({
        ...form,
        appointment_date: formattedDate,
      });
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      if (err.message && err.message.includes('conflict')) {
        setConflictWarning(err.message);
      } else {
        setError(err.message || 'Failed to book appointment');
      }
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
            <Calendar className="w-6 h-6 text-teal-500" />
            Appointment Scheduling
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time outpatient calendar with transactional doctor conflict prevention.
          </p>
        </div>

        {canSchedule && (
          <button
            onClick={() => {
              setError(null);
              setConflictWarning(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-teal-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Book Appointment</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex-1">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">All Statuses</option>
          <option value="Scheduled">Scheduled</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
          <option value="No-Show">No-Show</option>
        </select>

        {(dateFilter || statusFilter) && (
          <button
            onClick={() => {
              setDateFilter('');
              setStatusFilter('');
            }}
            className="px-3.5 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No appointments found</p>
            <p className="text-xs text-slate-400 mt-1">Try resetting the date filter or booking a new appointment.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Attending Doctor</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {appointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-teal-600 dark:text-teal-400">{apt.id}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white">
                      <div>{apt.patient_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{apt.patient_id}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">{apt.doctor_name}</td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">{apt.department_name}</td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {new Date(apt.appointment_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 max-w-xs truncate">{apt.reason || 'General'}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          apt.status === 'Confirmed' || apt.status === 'Completed'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : apt.status === 'Scheduled'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                        }`}
                      >
                        {apt.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Book Appointment Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Schedule Patient Appointment">
        <form onSubmit={handleBookAppointment} className="space-y-4">
          {conflictWarning && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Doctor Scheduling Conflict!</p>
                <p className="mt-0.5 text-[11px] leading-relaxed">{conflictWarning}</p>
              </div>
            </div>
          )}

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
              value={form.patient_id}
              onChange={(e) => setForm({ ...form, patient_id: e.target.value.toUpperCase() })}
              placeholder="PAT-1001"
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Attending Doctor</label>
            <select
              value={form.doctor_id}
              onChange={(e) => handleDoctorChange(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} — {d.specialty} ({d.department_name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Appointment Slot (Date & Time)</label>
            <input
              type="datetime-local"
              required
              value={form.appointment_date}
              onChange={(e) => setForm({ ...form, appointment_date: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Reason for Visit</label>
            <textarea
              rows={2}
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
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
              {submitting ? 'Checking Conflict & Booking...' : 'Confirm Appointment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
