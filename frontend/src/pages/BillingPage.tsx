import React, { useState, useEffect } from 'react';
import { Receipt, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { Invoice, BillingSummary } from '../types';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';

export const BillingPage: React.FC = () => {
  const { role } = useAuth();
  const canPay = ['Administrator', 'Receptionist'].includes(role || '');

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Payment Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<string>('Credit Card');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const q = statusFilter ? `status_filter=${statusFilter}` : '';
      const res = await api.getInvoices(q);
      setInvoices(res.invoices);
      setSummary(res.summary);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.recordPayment({
        invoice_id: selectedInvoice.id,
        amount: Number(payAmount),
        payment_method: payMethod,
      });
      setModalOpen(false);
      fetchInvoices();
    } catch (err: any) {
      setError(err.message || 'Payment processing failed');
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
            <Receipt className="w-6 h-6 text-teal-500" />
            Revenue Cycle & Educational Billing
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track patient service invoices, collections, and outstanding financial balances.
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Billed</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            ${summary ? summary.total_billed.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Aggregated hospital invoices</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Total Collected</p>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            ${summary ? summary.total_paid.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Verified received payments</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <p className="text-[11px] font-semibold text-rose-500 uppercase tracking-wider">Outstanding Balance</p>
          <p className="text-xl font-bold text-rose-500 mt-1">
            ${summary ? summary.total_outstanding.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Pending insurance & self-pay</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <p className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wider">Collection Rate</p>
          <p className="text-xl font-bold text-teal-600 dark:text-teal-400 mt-1">
            {summary?.collection_rate_pct ?? 0}%
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Collected ÷ Total Billed</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">All Payment Statuses</option>
          <option value="Paid">Paid in Full</option>
          <option value="Partial">Partial Payment</option>
          <option value="Unpaid">Unpaid / Outstanding</option>
        </select>
      </div>

      {/* Invoices Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-16">
            <Receipt className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No invoices found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Invoice ID</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Service Category</th>
                  <th className="py-3 px-4">Invoice Date</th>
                  <th className="py-3 px-4 text-right">Amount Billed</th>
                  <th className="py-3 px-4 text-right">Paid</th>
                  <th className="py-3 px-4 text-right">Outstanding</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-teal-600 dark:text-teal-400">{inv.id}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white">
                      <div>{inv.patient_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{inv.patient_id}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">{inv.service_category}</td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {new Date(inv.invoice_date).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                      ${inv.amount_billed.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400">
                      ${inv.amount_paid.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-rose-500 font-semibold">
                      ${inv.outstanding_balance.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          inv.payment_status === 'Paid'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : inv.payment_status === 'Partial'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                        }`}
                      >
                        {inv.payment_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {inv.outstanding_balance > 0.01 && canPay && (
                        <button
                          onClick={() => {
                            setSelectedInvoice(inv);
                            setPayAmount(inv.outstanding_balance);
                            setError(null);
                            setModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 rounded-lg text-[11px] font-semibold transition-colors"
                        >
                          Record Pay
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

      {/* Record Payment Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={`Record Payment for ${selectedInvoice?.id}`}>
        <form onSubmit={handleRecordPayment} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 space-y-1 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Patient:</span>
              <span className="text-white font-medium">{selectedInvoice?.patient_name}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Amount Billed:</span>
              <span className="text-white font-medium">${selectedInvoice?.amount_billed.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Current Outstanding:</span>
              <span className="text-rose-400 font-bold">${selectedInvoice?.outstanding_balance.toFixed(2)}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Amount ($)</label>
            <input
              type="number"
              step="0.01"
              required
              max={selectedInvoice?.outstanding_balance}
              value={payAmount}
              onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Method</label>
            <select
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="Credit Card">Credit Card</option>
              <option value="Debit Card">Debit Card</option>
              <option value="Insurance Reimbursement">Insurance Direct Reimbursement</option>
              <option value="Cash / Cheque">Cash / Cheque</option>
            </select>
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
              {submitting ? 'Recording...' : 'Confirm Payment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
