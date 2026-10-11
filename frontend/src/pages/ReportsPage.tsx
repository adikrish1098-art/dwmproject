import React, { useState, useEffect } from 'react';
import {
  FileBarChart, Download, Printer, BarChart3, Building2,
  TrendingUp, Receipt, BedDouble, Network, Boxes, Cpu, GitBranch,
  Filter
} from 'lucide-react';
import { api } from '../services/api';

type ReportTab =
  | 'overview'
  | 'departments'
  | 'monthly'
  | 'billing'
  | 'readmissions'
  | 'clustering'
  | 'rules'
  | 'ml'
  | 'etl';

export const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ReportTab>('overview');
  const [tabData, setTabData] = useState<any | null>(null);
  const [tabLoading, setTabLoading] = useState<boolean>(false);
  const [selectedDept, setSelectedDept] = useState<string>('');

  const loadTabData = async (tab: ReportTab) => {
    setTabLoading(true);
    try {
      if (tab === 'overview') {
        const res = await api.getHospitalKpiReport(selectedDept || undefined);
        setTabData(res);
      } else if (tab === 'departments') {
        const res = await api.getDepartmentPerformanceReport();
        setTabData(res);
      } else if (tab === 'monthly') {
        const res = await api.getMonthlyAdmissionsReport();
        setTabData(res);
      } else if (tab === 'billing') {
        const res = await api.getBillingCollectionReport();
        setTabData(res);
      } else if (tab === 'readmissions') {
        const res = await api.getReadmissionAnalysisReport();
        setTabData(res);
      } else if (tab === 'clustering') {
        const res = await api.getClusteringReport();
        setTabData(res);
      } else if (tab === 'rules') {
        const res = await api.getAssociationRulesReport();
        setTabData(res);
      } else if (tab === 'ml') {
        const res = await api.getModelEvaluationReport();
        setTabData(res);
      } else if (tab === 'etl') {
        const res = await api.getEtlQualityReport();
        setTabData(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTabLoading(false);
    }
  };

  useEffect(() => {
    loadTabData(activeTab);
  }, [activeTab, selectedDept]);

  const handlePrint = () => {
    window.print();
  };

  const tabs: { id: ReportTab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Hospital KPIs', icon: BarChart3 },
    { id: 'departments', label: 'Departments', icon: Building2 },
    { id: 'monthly', label: 'Monthly Admissions', icon: TrendingUp },
    { id: 'billing', label: 'Billing & Collections', icon: Receipt },
    { id: 'readmissions', label: 'Readmission Risk', icon: BedDouble },
    { id: 'clustering', label: 'Patient Clusters', icon: Network },
    { id: 'rules', label: 'Association Rules', icon: Boxes },
    { id: 'ml', label: 'Model Evaluation', icon: Cpu },
    { id: 'etl', label: 'ETL Quality', icon: GitBranch },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileBarChart className="w-6 h-6 text-teal-500" />
            Executive Reports & Certified Exports
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Official college demonstration analytical reports, multidimensional breakdowns, and de-identified CSV exports.
          </p>
        </div>

        <div className="flex items-center gap-2 print:hidden">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* CSV Export Downloads Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 print:hidden">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Download className="w-4 h-4 text-teal-500" />
          Authorized Analytical CSV Dataset Downloads
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          De-identified RFC-4180 compliant CSV exports generated directly from warehouse conformed dimensions and fact tables.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">FactAdmission</p>
              <p className="text-[10px] text-slate-400">Readmissions & LOS</p>
            </div>
            <a
              href={api.getAdmissionsCsvUrl()}
              download
              className="flex items-center gap-1 px-2.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <Download className="w-3 h-3" />
              <span>CSV</span>
            </a>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">FactBilling</p>
              <p className="text-[10px] text-slate-400">Revenue cycle facts</p>
            </div>
            <a
              href={api.getBillingCsvUrl()}
              download
              className="flex items-center gap-1 px-2.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <Download className="w-3 h-3" />
              <span>CSV</span>
            </a>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">DimPatient De-ID</p>
              <p className="text-[10px] text-slate-400">De-identified cohort</p>
            </div>
            <a
              href={api.getPatientsCsvUrl()}
              download
              className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <Download className="w-3 h-3" />
              <span>CSV</span>
            </a>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">Apriori Rules</p>
              <p className="text-[10px] text-slate-400">Co-occurrence pairs</p>
            </div>
            <a
              href={api.getRulesCsvUrl()}
              download
              className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <Download className="w-3 h-3" />
              <span>CSV</span>
            </a>
          </div>
        </div>
      </div>

      {/* Navigation Tabs for All 9 Report Types */}
      <div className="border-b border-slate-200 dark:border-slate-800 print:hidden overflow-x-auto flex gap-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'border-teal-500 text-teal-600 dark:text-teal-400 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Report Sheet */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 print:border-none print:shadow-none print:p-0">
        {/* Printable Header */}
        <div className="border-b border-slate-200 dark:border-slate-800 pb-5 flex flex-col sm:flex-row justify-between sm:items-end gap-3">
          <div>
            <span className="text-[10px] font-mono uppercase font-bold text-teal-600 dark:text-teal-400 tracking-wider">
              College Mini Project Official Report Pack
            </span>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {tabData?.report_type || 'Hospital Intelligence Report'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Dataset: Synthetic Hospital Warehouse Demonstration v1.0 (Seed: 42)
            </p>
          </div>
          <div className="text-left sm:text-right text-[11px] text-slate-400 font-mono">
            <p>Timestamp: {new Date(tabData?.generated_at || Date.now()).toLocaleString()}</p>
            <p>Framework: MedPulse Healthcare Warehouse Analytics</p>
          </div>
        </div>

        {tabLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div>
            {/* 1. Overview & Hospital KPIs Tab */}
            {activeTab === 'overview' && tabData?.metrics && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 print:hidden">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Department Filter:</label>
                  <select
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="">All Departments</option>
                    <option value="DEP-CAR">Cardiology</option>
                    <option value="DEP-PUL">Pulmonology</option>
                    <option value="DEP-NEU">Neurology</option>
                    <option value="DEP-ORT">Orthopedics</option>
                    <option value="DEP-GAS">Gastroenterology</option>
                    <option value="DEP-ONC">Oncology</option>
                    <option value="DEP-END">Endocrinology</option>
                    <option value="DEP-GEN">General Medicine</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-semibold text-slate-400">Total Admissions</span>
                    <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{tabData.metrics.total_admissions}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-semibold text-slate-400">30-Day Readmissions</span>
                    <p className="text-xl font-bold text-rose-500 mt-1">{tabData.metrics.readmissions_30d} ({tabData.metrics.readmission_rate_pct}%)</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-semibold text-slate-400">Avg Length of Stay</span>
                    <p className="text-xl font-bold text-teal-600 dark:text-teal-400 mt-1">{tabData.metrics.average_length_of_stay} days</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-semibold text-slate-400">Collection Rate</span>
                    <p className="text-xl font-bold text-emerald-500 mt-1">{tabData.metrics.collection_efficiency_pct}%</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400">Total Billed</span>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">${tabData.metrics.total_billed.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400">Total Collected</span>
                    <p className="text-sm font-bold text-emerald-500">${tabData.metrics.total_collected.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400">Outstanding Balance</span>
                    <p className="text-sm font-bold text-amber-500">${tabData.metrics.total_outstanding.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Department Performance */}
            {activeTab === 'departments' && tabData?.departments && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold text-slate-600 dark:text-slate-300">Department Name</th>
                      <th className="py-2.5 px-4 font-semibold text-slate-600 dark:text-slate-300 text-center">Total Admissions</th>
                      <th className="py-2.5 px-4 font-semibold text-slate-600 dark:text-slate-300 text-center">Avg LOS (Days)</th>
                      <th className="py-2.5 px-4 font-semibold text-slate-600 dark:text-slate-300 text-center">Readmissions</th>
                      <th className="py-2.5 px-4 font-semibold text-slate-600 dark:text-slate-300 text-center">Readmission Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {tabData.departments.map((d: any) => (
                      <tr key={d.department}>
                        <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white">{d.department}</td>
                        <td className="py-2.5 px-4 text-center font-mono">{d.admissions}</td>
                        <td className="py-2.5 px-4 text-center font-mono">{d.avg_los}</td>
                        <td className="py-2.5 px-4 text-center font-mono text-rose-500">{d.readmissions}</td>
                        <td className="py-2.5 px-4 text-center font-mono font-semibold">{d.readmission_rate_pct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 3. Monthly Admissions */}
            {activeTab === 'monthly' && tabData?.monthly_data && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold text-slate-600 dark:text-slate-300">Year-Month Period</th>
                      <th className="py-2.5 px-4 font-semibold text-slate-600 dark:text-slate-300 text-center">Admissions</th>
                      <th className="py-2.5 px-4 font-semibold text-slate-600 dark:text-slate-300 text-center">30-Day Readmissions</th>
                      <th className="py-2.5 px-4 font-semibold text-slate-600 dark:text-slate-300 text-center">Average LOS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {tabData.monthly_data.map((m: any) => (
                      <tr key={m.period}>
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-900 dark:text-white">{m.period}</td>
                        <td className="py-2.5 px-4 text-center font-mono">{m.admissions}</td>
                        <td className="py-2.5 px-4 text-center font-mono text-rose-500">{m.readmissions}</td>
                        <td className="py-2.5 px-4 text-center font-mono">{m.avg_los} days</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 4. Billing & Collections */}
            {activeTab === 'billing' && tabData?.department_billing && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold text-slate-600 dark:text-slate-300">Department</th>
                      <th className="py-2.5 px-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Billed Amount</th>
                      <th className="py-2.5 px-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Collected Amount</th>
                      <th className="py-2.5 px-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Outstanding</th>
                      <th className="py-2.5 px-4 font-semibold text-slate-600 dark:text-slate-300 text-center">Collection %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {tabData.department_billing.map((b: any) => (
                      <tr key={b.department}>
                        <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white">{b.department}</td>
                        <td className="py-2.5 px-4 text-right font-mono">${b.billed.toLocaleString()}</td>
                        <td className="py-2.5 px-4 text-right font-mono text-emerald-500">${b.collected.toLocaleString()}</td>
                        <td className="py-2.5 px-4 text-right font-mono text-amber-500">${b.outstanding.toLocaleString()}</td>
                        <td className="py-2.5 px-4 text-center font-mono font-semibold">{b.collection_rate_pct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 5. Readmissions Breakdown */}
            {activeTab === 'readmissions' && tabData?.age_group_analysis && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold text-slate-600 dark:text-slate-300">Patient Age Cohort</th>
                      <th className="py-2.5 px-4 font-semibold text-slate-600 dark:text-slate-300 text-center">Total Admissions</th>
                      <th className="py-2.5 px-4 font-semibold text-slate-600 dark:text-slate-300 text-center">Readmissions (30d)</th>
                      <th className="py-2.5 px-4 font-semibold text-slate-600 dark:text-slate-300 text-center">Readmission Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {tabData.age_group_analysis.map((ag: any) => (
                      <tr key={ag.age_group}>
                        <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white">{ag.age_group}</td>
                        <td className="py-2.5 px-4 text-center font-mono">{ag.admissions}</td>
                        <td className="py-2.5 px-4 text-center font-mono text-rose-500">{ag.readmissions}</td>
                        <td className="py-2.5 px-4 text-center font-mono font-semibold">{ag.readmission_rate_pct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 6. Patient Clusters */}
            {activeTab === 'clustering' && tabData?.cluster_profiles && (
              <div className="space-y-4">
                <p className="text-xs text-slate-500">Overall Silhouette Coefficient: <span className="font-mono font-bold text-teal-600 dark:text-teal-400">{tabData.silhouette_score}</span></p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {tabData.cluster_profiles.map((c: any) => (
                    <div key={c.cluster_id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                      <p className="font-bold text-slate-900 dark:text-white">Cluster {c.cluster_id}: {c.segment_label}</p>
                      <p className="text-slate-500 text-[11px]">Size: {c.patient_count} patients ({c.percentage}%)</p>
                      <div className="pt-1 text-[11px] font-mono space-y-0.5 text-slate-600 dark:text-slate-300">
                        <p>Mean Age: {c.mean_age} yrs</p>
                        <p>Mean Visits: {c.mean_visits}</p>
                        <p>Mean Admissions: {c.mean_admissions}</p>
                        <p>Mean Billed: ${c.mean_billed_amount.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 7. Association Rules */}
            {activeTab === 'rules' && tabData?.top_rules && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold text-slate-600 dark:text-slate-300">Antecedent (If)</th>
                      <th className="py-2.5 px-4 font-semibold text-slate-600 dark:text-slate-300">Consequent (Then)</th>
                      <th className="py-2.5 px-4 font-semibold text-slate-600 dark:text-slate-300 text-center">Support</th>
                      <th className="py-2.5 px-4 font-semibold text-slate-600 dark:text-slate-300 text-center">Confidence</th>
                      <th className="py-2.5 px-4 font-semibold text-slate-600 dark:text-slate-300 text-center">Lift</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                    {tabData.top_rules.map((r: any) => (
                      <tr key={r.id}>
                        <td className="py-2.5 px-4 text-slate-900 dark:text-white">{r.antecedent}</td>
                        <td className="py-2.5 px-4 text-teal-600 dark:text-teal-400">{r.consequent}</td>
                        <td className="py-2.5 px-4 text-center">{r.support}</td>
                        <td className="py-2.5 px-4 text-center">{r.confidence}</td>
                        <td className="py-2.5 px-4 text-center font-bold text-emerald-500">{r.lift}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 8. Model Evaluation */}
            {activeTab === 'ml' && tabData?.models && (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-2.5 px-4 font-semibold text-slate-600 dark:text-slate-300">Model Name</th>
                        <th className="py-2.5 px-4 font-semibold text-slate-600 dark:text-slate-300 text-center">Accuracy</th>
                        <th className="py-2.5 px-4 font-semibold text-slate-600 dark:text-slate-300 text-center">Precision</th>
                        <th className="py-2.5 px-4 font-semibold text-slate-600 dark:text-slate-300 text-center">Recall</th>
                        <th className="py-2.5 px-4 font-semibold text-slate-600 dark:text-slate-300 text-center">F1-Score</th>
                        <th className="py-2.5 px-4 font-semibold text-slate-600 dark:text-slate-300 text-center">ROC-AUC</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                      {Object.entries(tabData.models).map(([k, m]: [string, any]) => (
                        <tr key={k}>
                          <td className="py-2.5 px-4 font-sans font-bold text-slate-900 dark:text-white">{m.model_name}</td>
                          <td className="py-2.5 px-4 text-center">{m.accuracy}</td>
                          <td className="py-2.5 px-4 text-center">{m.precision}</td>
                          <td className="py-2.5 px-4 text-center">{m.recall}</td>
                          <td className="py-2.5 px-4 text-center">{m.f1_score}</td>
                          <td className="py-2.5 px-4 text-center font-bold text-teal-600 dark:text-teal-400">{m.roc_auc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 9. ETL Quality */}
            {activeTab === 'etl' && tabData?.warehouse_tables && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 uppercase">DimPatient Count</span>
                    <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{tabData.warehouse_tables.DimPatient}</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 uppercase">FactAdmission Count</span>
                    <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{tabData.warehouse_tables.FactAdmission}</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 uppercase">FactBilling Count</span>
                    <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{tabData.warehouse_tables.FactBilling}</p>
                  </div>
                </div>

                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Recent ETL Execution Runs</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 font-mono text-[10px]">
                      <tr>
                        <th className="py-2 px-3">Job ID</th>
                        <th className="py-2 px-3">Status</th>
                        <th className="py-2 px-3 text-center">Extracted</th>
                        <th className="py-2 px-3 text-center">Loaded</th>
                        <th className="py-2 px-3 text-center">Errors</th>
                        <th className="py-2 px-3 text-center">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                      {(tabData.recent_jobs || []).map((j: any) => (
                        <tr key={j.id}>
                          <td className="py-2 px-3">#{j.id}</td>
                          <td className="py-2 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                              {j.status}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center">{j.records_extracted}</td>
                          <td className="py-2 px-3 text-center font-bold text-teal-600 dark:text-teal-400">{j.records_loaded}</td>
                          <td className="py-2 px-3 text-center">{j.error_count}</td>
                          <td className="py-2 px-3 text-center">{j.duration_seconds}s</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Report Footer & Ethics Disclosure */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 space-y-1">
          <p className="font-semibold text-slate-600 dark:text-slate-300">Academic & Ethics Disclosure:</p>
          <p>
            This document is generated dynamically from a local SQLite operational and star schema analytical repository using synthetic hospital demonstration records. All patient names and clinical identifiers are fictional. Predictive and clustering analyses are intended for curriculum data mining evaluation and do not represent clinically validated decision support.
          </p>
        </div>
      </div>
    </div>
  );
};
