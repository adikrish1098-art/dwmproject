import React, { useState, useEffect } from 'react';
import { Database, Layers, RefreshCw, Code } from 'lucide-react';
import { OlapTabWrapper } from '../components/OlapTabWrapper';
import { api } from '../services/api';

export const WarehousePage: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'cube' | 'schema' | 'sql_reports'>('cube');
  const [summary, setSummary] = useState<any | null>(null);
  const [sqlReports, setSqlReports] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);

  useEffect(() => {
    api.getWarehouseSummary().then(setSummary).catch(console.error);
  }, []);

  const handleLoadReports = async () => {
    setLoadingReports(true);
    try {
      const res = await api.getSqlReportsPack();
      setSqlReports(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'sql_reports' && sqlReports.length === 0) {
      handleLoadReports();
    }
  }, [activeSubTab]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Database className="w-6 h-6 text-cyan-500" />
            Hospital Data Warehouse (Kimball Star Schema)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Multidimensional OLAP analytical data store separated from operational OLTP tables.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
          <button
            onClick={() => setActiveSubTab('cube')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeSubTab === 'cube'
                ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            OLAP Cube Explorer
          </button>
          <button
            onClick={() => setActiveSubTab('schema')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeSubTab === 'schema'
                ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Star Schema Metadata
          </button>
          <button
            onClick={() => setActiveSubTab('sql_reports')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeSubTab === 'sql_reports'
                ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            10 SQL Analytical Reports
          </button>
        </div>
      </div>

      {/* Star Schema Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {Object.entries(summary.dimensions || {}).map(([dim, count]) => (
            <div key={dim} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 font-semibold uppercase">{dim}</span>
              <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{String(count)}</p>
              <span className="text-[9px] text-slate-400">Dimension</span>
            </div>
          ))}
          {Object.entries(summary.facts || {}).map(([fact, count]) => (
            <div key={fact} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-teal-500/30 text-center">
              <span className="text-[10px] font-mono text-teal-600 dark:text-teal-400 font-semibold uppercase">{fact}</span>
              <p className="text-lg font-bold text-teal-600 dark:text-teal-400 mt-0.5">{String(count)}</p>
              <span className="text-[9px] text-teal-500">Fact Table</span>
            </div>
          ))}
        </div>
      )}

      {/* Content Based on Tab */}
      {activeSubTab === 'cube' && <OlapTabWrapper />}

      {activeSubTab === 'schema' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-500" />
              Kimball Dimensional Design Principles
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              The analytical data warehouse follows Ralph Kimball's bottom-up dimensional modeling methodology. Operational records (OLTP) from hospital encounters, admissions, and billing invoices are de-normalized and loaded into surrogate-keyed dimension tables and granular fact tables. This architecture optimizes analytical SQL aggregations, roll-ups, and OLAP slice/dice cubes without degrading clinical transaction performance.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
                <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wide">Dimension Tables (Conformed)</span>
                <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-disc list-inside">
                  <li><strong>DimPatient:</strong> Surrogate key (patient_key), source ID, age group hierarchy, sex. SCD Type 1 updates.</li>
                  <li><strong>DimDoctor:</strong> Doctor key, department specialty hierarchy, source doctor ID.</li>
                  <li><strong>DimDepartment:</strong> Hospital organizational unit, conformed across all clinical facts.</li>
                  <li><strong>DimDate:</strong> Pre-populated calendar dimension (date_key = YYYYMMDD), quarter, month, weekday.</li>
                  <li><strong>DimDiagnosis:</strong> ICD-10 diagnostic category, clinical code, diagnosis description.</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
                <span className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wide">Fact Tables (Granular Measures)</span>
                <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-disc list-inside">
                  <li><strong>FactAdmission:</strong> Grain = 1 row per inpatient admission. Measures: length_of_stay, is_readmission_30d.</li>
                  <li><strong>FactPatientVisit:</strong> Grain = 1 row per clinical encounter. Measures: visit_count, encounter duration.</li>
                  <li><strong>FactBilling:</strong> Grain = 1 row per patient invoice. Measures: amount_billed, amount_paid, outstanding_amount.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'sql_reports' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Analytical Star Schema SQL Queries (10 Core Reports)
            </h3>
            <button
              onClick={handleLoadReports}
              disabled={loadingReports}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingReports ? 'animate-spin' : ''}`} />
              <span>Refresh Reports</span>
            </button>
          </div>

          {loadingReports ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : sqlReports.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <Code className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
              <p className="text-xs text-slate-400">Click Refresh to execute and view all 10 analytical warehouse queries.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sqlReports.map((rpt, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 font-semibold">
                        Query #{idx + 1}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">{rpt.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{rpt.description}</p>
                    </div>
                  </div>

                  {/* SQL Statement Display */}
                  <div className="bg-slate-950 text-slate-300 p-3 rounded-xl font-mono text-[11px] overflow-x-auto border border-slate-800">
                    <pre>{rpt.sql}</pre>
                  </div>

                  {/* Query Results Table */}
                  {rpt.rows && rpt.rows.length > 0 && (
                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                      <table className="w-full text-left text-[11px]">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-600 dark:text-slate-300">
                            {rpt.columns.map((col: string) => (
                              <th key={col} className="py-2 px-3">{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                          {rpt.rows.slice(0, 5).map((row: any, rIdx: number) => (
                            <tr key={rIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                              {rpt.columns.map((col: string) => (
                                <td key={col} className="py-1.5 px-3 text-slate-700 dark:text-slate-300">
                                  {String(row[col] ?? '')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
