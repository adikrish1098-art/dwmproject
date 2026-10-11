import React, { useState, useEffect } from 'react';
import {
  ServerCog, RefreshCw, FileText, CheckCircle2, AlertCircle,
  Eye, Download, Upload, ShieldCheck, X, Database
} from 'lucide-react';
import { api } from '../services/api';
import { DatasetFileInfo } from '../types';
import { useAuth } from '../context/AuthContext';

export const DatasetsPage: React.FC = () => {
  const { role } = useAuth();
  const isAdmin = role === 'Administrator';

  const [datasetInfo, setDatasetInfo] = useState<{
    dataset_directory: string;
    files_count: number;
    files: DatasetFileInfo[];
    reproducible_seed: number;
    is_synthetic: boolean;
  } | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [patientCount, setPatientCount] = useState<number>(650);
  const [regenerating, setRegenerating] = useState<boolean>(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Preview state
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);

  // Upload validation state
  const [uploadTable, setUploadTable] = useState<string>('patients');
  const [uploadContent, setUploadContent] = useState<string>('');
  const [uploadResult, setUploadResult] = useState<any | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);

  // Lineage state
  const [lineage, setLineage] = useState<any | null>(null);

  const fetchDatasets = async () => {
    setLoading(true);
    try {
      const res = await api.getDatasets();
      setDatasetInfo(res);
      const lin = await api.getDatasetLineage();
      setLineage(lin);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const handleRegenerate = async () => {
    if (!isAdmin) return;
    setRegenerating(true);
    setMsg(null);
    setError(null);
    try {
      const res = await api.regenerateDataset(patientCount);
      setMsg(res.message);
      fetchDatasets();
    } catch (err: any) {
      setError(err.message || 'Failed to regenerate dataset');
    } finally {
      setRegenerating(false);
    }
  };

  const handlePreview = async (filename: string) => {
    setPreviewLoading(true);
    setPreviewData(null);
    try {
      const data = await api.previewDataset(filename);
      setPreviewData(data);
    } catch (err: any) {
      alert(`Preview failed: ${err.message || 'Could not load file'}`);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleValidateUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadContent.trim()) {
      setUploadError('Please provide CSV content to validate.');
      return;
    }
    setUploading(true);
    setUploadError(null);
    setUploadResult(null);
    try {
      const res = await api.uploadDataset(uploadTable, uploadContent);
      setUploadResult(res);
    } catch (err: any) {
      setUploadError(err.message || 'CSV schema validation failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ServerCog className="w-6 h-6 text-teal-500" />
            Synthetic Dataset Management & Lineage
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Reproducible generator engine producing 10 relational hospital data tables (Seed: 42).
          </p>
        </div>
      </div>

      {/* Generator Control Card */}
      {isAdmin && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Regenerate Synthetic Cohort
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Generate new coherent chronological patient records, appointments, admissions, diagnoses, and invoices.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Cohort Size: <span className="text-teal-600 dark:text-teal-400 font-bold">{patientCount} Patients</span>
              </span>
            </div>
          </div>

          {msg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{msg}</span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <input
              type="range"
              min="200"
              max="1500"
              step="50"
              value={patientCount}
              onChange={(e) => setPatientCount(parseInt(e.target.value))}
              className="flex-1 accent-teal-500 cursor-pointer w-full"
            />
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-teal-500/20 disabled:opacity-50 transition-all shrink-0 w-full sm:w-auto justify-center"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} />
              <span>{regenerating ? 'Synthesizing Records...' : 'Generate New Dataset'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Dataset Files Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-teal-500" />
            Relational CSV Tables ({datasetInfo?.files_count || 0} Files Available)
          </span>
          <span className="text-[10px] text-teal-600 dark:text-teal-400 font-mono font-semibold">
            Location: data/synthetic
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Filename</th>
                  <th className="py-3 px-4">Entity Description</th>
                  <th className="py-3 px-4 text-center">Row Count</th>
                  <th className="py-3 px-4 text-center">File Size</th>
                  <th className="py-3 px-4">Target Schema</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(datasetInfo?.files || []).map((f) => (
                  <tr key={f.filename} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-teal-500 shrink-0" />
                      <span>{f.filename}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                      {f.filename.includes('patient') && 'Demographics, calculated age groups, synthetic identifiers'}
                      {f.filename.includes('admission') && 'Inpatient hospitalization, discharge status, 30-day readmissions'}
                      {f.filename.includes('encounter') && 'Outpatient & inpatient clinical encounters'}
                      {f.filename.includes('diagnos') && 'ICD-10 clinical diagnoses codes and medical descriptions'}
                      {f.filename.includes('treatment') && 'Surgical procedures and clinical therapies performed'}
                      {f.filename.includes('doctor') && 'Attending physicians, clinical specialties'}
                      {f.filename.includes('department') && 'Hospital medical divisions (Cardiology, Neurology, etc.)'}
                      {f.filename.includes('appointment') && 'Outpatient clinic bookings and doctor slot schedules'}
                      {f.filename.includes('invoice') && 'Revenue cycle hospital charges and service billing'}
                      {f.filename.includes('payment') && 'Completed transactions and receipt records'}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                      {f.record_count.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-500 dark:text-slate-400">
                      {f.size_kb} KB
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[10px] text-teal-600 dark:text-teal-400 font-semibold">
                      {f.filename.includes('patient') && 'DimPatient / patients'}
                      {f.filename.includes('admission') && 'FactAdmission / admissions'}
                      {f.filename.includes('encounter') && 'FactPatientVisit / encounters'}
                      {f.filename.includes('diagnos') && 'DimDiagnosis / diagnoses'}
                      {f.filename.includes('treatment') && 'treatments'}
                      {f.filename.includes('doctor') && 'DimDoctor / doctors'}
                      {f.filename.includes('department') && 'DimDepartment / departments'}
                      {f.filename.includes('appointment') && 'appointments'}
                      {f.filename.includes('invoice') && 'FactBilling / invoices'}
                      {f.filename.includes('payment') && 'payments'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handlePreview(f.filename)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-[11px] font-medium transition-colors"
                          title="Preview dataset schema and rows"
                        >
                          <Eye className="w-3 h-3 text-teal-500" />
                          <span>Preview</span>
                        </button>
                        <a
                          href={api.downloadDatasetUrl(f.filename)}
                          download
                          className="flex items-center gap-1 px-2.5 py-1 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 dark:hover:bg-teal-900/40 text-teal-700 dark:text-teal-300 rounded text-[11px] font-medium transition-colors"
                          title="Download CSV"
                        >
                          <Download className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                          <span>CSV</span>
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dataset Preview Modal / Drawer */}
      {previewLoading && (
        <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-slate-500">Loading dataset preview and data quality inspection...</p>
        </div>
      )}

      {previewData && (
        <div className="bg-white dark:bg-slate-900 border border-teal-500/30 rounded-2xl p-6 shadow-sm space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-500" />
                Preview: {previewData.filename}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Total Rows: <span className="font-semibold text-slate-700 dark:text-slate-200">{previewData.total_rows.toLocaleString()}</span> | Columns: <span className="font-semibold text-slate-700 dark:text-slate-200">{previewData.total_columns}</span> | Duplicates: <span className="font-semibold text-slate-700 dark:text-slate-200">{previewData.duplicate_rows}</span>
              </p>
            </div>
            <button
              onClick={() => setPreviewData(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Data Quality Warnings */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Data Quality Checks:</span>
            <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-500 dark:text-slate-400 text-[11px]">
              {previewData.warnings.map((w: string, idx: number) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>

          {/* Schema and Columns Stats */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Column Schema & Missing-Value Statistics</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {previewData.schema.map((col: any) => (
                <div key={col.column} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-[11px]">
                  <p className="font-mono font-semibold text-slate-900 dark:text-white truncate">{col.column}</p>
                  <p className="text-[10px] text-slate-400">{col.data_type}</p>
                  <p className="text-[10px] text-teal-600 dark:text-teal-400 mt-1">Missing: {col.missing_count} ({col.missing_pct}%)</p>
                </div>
              ))}
            </div>
          </div>

          {/* Sample Rows Table */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Sample Records (First 20 Rows)</h4>
            <div className="overflow-x-auto max-h-64 border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 font-mono text-[10px]">
                  <tr>
                    {previewData.schema.map((col: any) => (
                      <th key={col.column} className="py-2 px-3 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">{col.column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {previewData.preview_data.map((row: any, rIdx: number) => (
                    <tr key={rIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 font-mono">
                      {previewData.schema.map((col: any) => (
                        <td key={col.column} className="py-1.5 px-3 whitespace-nowrap text-slate-700 dark:text-slate-300">
                          {String(row[col.column])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CSV Dataset Upload & Validation Module (Admin Only) */}
      {isAdmin && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-teal-500" />
                Upload & Validate CSV Dataset
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Upload raw CSV data to execute schema conformance, column mapping, and duplicate checks.
              </p>
            </div>
          </div>

          <form onSubmit={handleValidateUpload} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Entity Table
                </label>
                <select
                  value={uploadTable}
                  onChange={(e) => setUploadTable(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                >
                  <option value="patients">patients (id, full_name, date_of_birth, age, sex)</option>
                  <option value="doctors">doctors (id, name, specialty, department_id)</option>
                  <option value="departments">departments (id, name)</option>
                  <option value="appointments">appointments (id, patient_id, doctor_id, department_id, appointment_date)</option>
                  <option value="admissions">admissions (id, patient_id, department_id, doctor_id, admission_date)</option>
                  <option value="encounters">encounters (id, patient_id, doctor_id, department_id, encounter_date)</option>
                  <option value="diagnoses">diagnoses (id, encounter_id, patient_id, diagnosis_code, diagnosis_category)</option>
                  <option value="treatments">treatments (id, encounter_id, procedure_name, procedure_category)</option>
                  <option value="invoices">invoices (id, patient_id, department_id, service_category, amount_billed)</option>
                  <option value="payments">payments (id, invoice_id, patient_id, payment_date, amount)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Or Paste Raw CSV Data (Header + Records)
                </label>
                <textarea
                  rows={3}
                  value={uploadContent}
                  onChange={(e) => setUploadContent(e.target.value)}
                  placeholder="id,full_name,date_of_birth,age,sex&#10;PAT-9001,John Doe,1980-05-12,45,Male"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono text-[11px] text-slate-900 dark:text-white resize-none"
                />
              </div>
            </div>

            {uploadError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {uploadResult && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs space-y-1">
                <div className="flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{uploadResult.message}</span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono">
                  Validated {uploadResult.total_records_validated} rows | Duplicates: {uploadResult.duplicate_count} | Columns matched: {uploadResult.columns_matched.join(', ')}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={uploading}
              className="flex items-center gap-2 px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all disabled:opacity-50"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{uploading ? 'Validating CSV Schema...' : 'Validate Dataset Schema'}</span>
            </button>
          </form>
        </div>
      )}

      {/* Model-to-Dataset Lineage Card */}
      {lineage && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-500" />
                Model-to-Dataset Provenance & Lineage
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Version: <span className="font-mono text-teal-600 dark:text-teal-400 font-semibold">{lineage.dataset_version}</span> | Origin: {lineage.source_data_origin}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {lineage.models_lineage.map((m: any, idx: number) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                <p className="font-bold text-slate-900 dark:text-white">{m.model_name}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Target: <span className="text-slate-700 dark:text-slate-200 font-medium">{m.target_definition}</span></p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Leakage Mitigation: <span className="text-teal-600 dark:text-teal-400 font-medium">{m.leakage_prevention}</span></p>
                <div className="pt-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    {m.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
