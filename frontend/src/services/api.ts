import {
  OverviewData,
  OlapSchemaData,
  OlapCubeData,
  EtlStatusData,
  ClusteringData,
  AprioriData,
  ReadmissionModelsData,
  DecisionTreeData,
  PredictionResult,
  BrowseDataResponse,
  LoginResponse,
  User,
  DashboardOverview,
  Patient,
  Doctor,
  Department,
  Appointment,
  Admission,
  Encounter,
  Invoice,
  BillingSummary,
  AuditLog,
  DatasetFileInfo,
  ModelComparisonResponse,
} from '../types';

const BASE_URL = '/api/v1';
let inMemoryToken: string | null = null;

// ─── Token Management (In-Memory + Secure HttpOnly SameSite Cookie) ───
export function getAuthToken(): string | null {
  return inMemoryToken;
}

export function setAuthToken(token: string | null): void {
  inMemoryToken = token;
}

// ─── Core Fetch Utility ───────────────────────────────────────────
async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (options?.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${BASE_URL}${url}`, {
    ...options,
    credentials: 'include',
    headers,
  });
  if (!res.ok) {
    let detailMsg = `HTTP ${res.status}`;
    try {
      const errJson = await res.json();
      detailMsg = errJson.detail || errJson.message || JSON.stringify(errJson);
    } catch {
      const txt = await res.text().catch(() => '');
      if (txt) detailMsg = txt;
    }
    throw new Error(detailMsg);
  }
  return res.json() as Promise<T>;
}

// ─── API Methods ──────────────────────────────────────────────────
export const api = {
  // ── Auth ──────────────────────────────────────────────────────
  login: (credentials: { username_or_email: string; password: string }): Promise<LoginResponse> =>
    fetchJson<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  signup: (payload: {
    full_name: string;
    email: string;
    username: string;
    password: string;
    confirm_password: string;
    phone_number?: string;
    terms_acknowledged: boolean;
  }): Promise<{ message: string; username: string; role: string }> =>
    fetchJson('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  forgotPassword: (payload: { email: string }): Promise<{ message: string; demo_reset_token?: string; demo_reset_link?: string }> =>
    fetchJson('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  resetPassword: (payload: { token: string; new_password: string; confirm_password: string }): Promise<{ message: string }> =>
    fetchJson('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  changePassword: (payload: { current_password: string; new_password: string; confirm_password: string }): Promise<{ message: string }> =>
    fetchJson('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateProfile: (payload: { full_name?: string; phone_number?: string }): Promise<{ message: string }> =>
    fetchJson('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  logout: (): Promise<void> =>
    fetchJson<void>('/auth/logout', { method: 'POST' }).catch(() => {}),

  getMe: (): Promise<User> => fetchJson<User>('/auth/me'),

  // ── Dashboard ────────────────────────────────────────────────
  getDashboard: (departmentId?: string): Promise<DashboardOverview> => {
    const params = new URLSearchParams();
    if (departmentId && departmentId !== 'All') params.append('department_id', departmentId);
    const q = params.toString();
    return fetchJson<DashboardOverview>(`/dashboard/overview${q ? `?${q}` : ''}`);
  },

  getHealth: () => fetchJson<{ status: string; operational_db: any; warehouse_db: any }>('/health'),
  getOverview: (): Promise<OverviewData> => fetchJson<OverviewData>('/overview'),

  // ── Departments ──────────────────────────────────────────────
  getDepartments: (): Promise<Department[]> =>
    fetchJson<Department[]>('/departments/'),

  createDepartment: (payload: { id: string; name: string; description?: string }): Promise<{ message: string; id: string }> =>
    fetchJson('/departments/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // ── Doctors ──────────────────────────────────────────────────
  getDoctors: (departmentId?: string): Promise<Doctor[]> => {
    const params = new URLSearchParams();
    if (departmentId && departmentId !== 'All') params.append('department_id', departmentId);
    const q = params.toString();
    return fetchJson<Doctor[]>(`/doctors/${q ? `?${q}` : ''}`);
  },

  createDoctor: (payload: {
    name: string;
    specialty: string;
    department_id: string;
    contact_number?: string;
    email?: string;
  }): Promise<{ message: string; id: string }> =>
    fetchJson('/doctors/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // ── Patients ─────────────────────────────────────────────────
  getPatients: (queryString: string = ''): Promise<{ total: number; patients: Patient[] }> =>
    fetchJson<{ total: number; patients: Patient[] }>(`/patients/?${queryString}`),

  getPatient: (id: string): Promise<{ patient: Patient; encounters: any[]; admissions: any[] }> =>
    fetchJson(`/patients/${id}`),

  createPatient: (payload: any): Promise<{ message: string; patient_id: string }> =>
    fetchJson('/patients/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updatePatient: (id: string, payload: any): Promise<{ message: string }> =>
    fetchJson(`/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deactivatePatient: (id: string): Promise<{ message: string }> =>
    fetchJson(`/patients/${id}`, {
      method: 'DELETE',
    }),

  // ── Appointments ─────────────────────────────────────────────
  getAppointments: (queryString: string = ''): Promise<{ total: number; appointments: Appointment[] }> =>
    fetchJson<{ total: number; appointments: Appointment[] }>(`/appointments/?${queryString}`),

  createAppointment: (payload: {
    patient_id: string;
    doctor_id: string;
    department_id: string;
    appointment_date: string;
    reason?: string;
  }): Promise<{ message: string; appointment_id: string }> =>
    fetchJson('/appointments/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // ── Admissions ───────────────────────────────────────────────
  getAdmissions: (queryString: string = ''): Promise<{ total: number; admissions: Admission[] }> =>
    fetchJson<{ total: number; admissions: Admission[] }>(`/admissions/?${queryString}`),

  createAdmission: (payload: {
    patient_id: string;
    department_id: string;
    doctor_id: string;
    admission_date: string;
    admission_type: string;
  }): Promise<{ message: string; admission_id: string; is_readmission_30d: boolean; prior_admission_id?: string }> =>
    fetchJson('/admissions/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  dischargePatient: (admissionId: string, payload: { discharge_date?: string; discharge_status?: string }): Promise<{ message: string; length_of_stay: number }> =>
    fetchJson(`/admissions/${admissionId}/discharge`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  // ── Clinical Records (Encounters & Diagnoses) ────────────────
  getEncounters: (queryString: string = ''): Promise<{ total: number; encounters: Encounter[] }> =>
    fetchJson<{ total: number; encounters: Encounter[] }>(`/clinical-records/encounters?${queryString}`),

  getDiagnoses: (queryString: string = ''): Promise<{ total: number; diagnoses: any[] }> =>
    fetchJson<{ total: number; diagnoses: any[] }>(`/clinical-records/diagnoses?${queryString}`),

  getDiagnosisCategories: (): Promise<{ category: string; count: number }[]> =>
    fetchJson<{ category: string; count: number }[]>('/clinical-records/diagnoses/categories-summary'),

  getTreatments: (category?: string): Promise<{ total: number; treatments: any[] }> => {
    const q = category ? `?category=${category}` : '';
    return fetchJson<{ total: number; treatments: any[] }>(`/clinical-records/treatments${q}`);
  },

  createEncounter: (payload: any): Promise<{ message: string; encounter_id: string }> =>
    fetchJson('/clinical-records/encounters', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // ── Billing & Payments ───────────────────────────────────────
  getInvoices: (queryString: string = ''): Promise<{ summary: BillingSummary; total: number; invoices: Invoice[] }> =>
    fetchJson(`/billing/invoices?${queryString}`),

  recordPayment: (payload: { invoice_id: string; amount: number; payment_method: string }): Promise<{ message: string; payment_id: string; remaining_balance: number; new_status: string }> =>
    fetchJson('/billing/payments', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // ── Data Warehouse & OLAP ────────────────────────────────────
  getWarehouseSummary: (): Promise<any> => fetchJson('/warehouse/schema-summary'),
  getOlapRollup: (): Promise<any> => fetchJson('/warehouse/olap/rollup'),
  getOlapDrilldown: (year: number = 2025): Promise<any> => fetchJson(`/warehouse/olap/drilldown?year=${year}`),
  getOlapSlice: (department: string = 'Cardiology'): Promise<any> => fetchJson(`/warehouse/olap/slice?department=${department}`),
  getOlapDice: (ageGroup: string = '65+ (Senior/Geriatric)', department: string = 'Cardiology'): Promise<any> =>
    fetchJson(`/warehouse/olap/dice?age_group=${encodeURIComponent(ageGroup)}&department=${encodeURIComponent(department)}`),
  getOlapPivot: (): Promise<any> => fetchJson('/warehouse/olap/pivot'),
  getSqlReportsPack: (): Promise<any> => fetchJson('/warehouse/reports/sql-pack'),

  getOlapSchema: (): Promise<OlapSchemaData> => fetchJson<OlapSchemaData>('/olap/schema'),
  getOlapCube: (granularity: string, metric: string, department?: string, age_group?: string): Promise<OlapCubeData> => {
    const params = new URLSearchParams({ granularity, metric });
    if (department && department !== 'All') params.append('department', department);
    if (age_group && age_group !== 'All') params.append('age_group', age_group);
    return fetchJson<OlapCubeData>(`/olap/cube?${params.toString()}`);
  },

  // ── ETL Pipeline ─────────────────────────────────────────────
  getEtlStatus: (): Promise<EtlStatusData> => fetchJson<EtlStatusData>('/etl/status'),
  getEtlHistory: (): Promise<any[]> => fetchJson<any[]>('/warehouse/etl/history'),
  runEtl: (): Promise<any> => fetchJson('/warehouse/etl/run', { method: 'POST' }),

  // ── Data Mining ──────────────────────────────────────────────
  getClustering: (k: number = 3): Promise<ClusteringData> => fetchJson<ClusteringData>(`/mining/clustering?k=${k}`),
  runClustering: (k: number = 3, features?: string[]): Promise<ClusteringData> =>
    fetchJson<ClusteringData>('/mining/clustering/run', {
      method: 'POST',
      body: JSON.stringify({ k, features: features || ['age', 'length_of_stay', 'prior_visits', 'prior_admissions', 'total_billed'] }),
    }),

  getApriori: (minSupport: number = 0.008, minConfidence: number = 0.20, minLift: number = 1.1): Promise<AprioriData> =>
    fetchJson<AprioriData>(`/mining/apriori?min_support=${minSupport}&min_confidence=${minConfidence}&min_lift=${minLift}`),

  runApriori: (payload: { min_support: number; min_confidence: number; min_lift: number }): Promise<AprioriData> =>
    fetchJson<AprioriData>('/mining/apriori/run', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // ── Machine Learning ─────────────────────────────────────────
  getReadmissionModels: (): Promise<ReadmissionModelsData> => fetchJson<ReadmissionModelsData>('/ml/readmission/models'),
  trainReadmissionModels: (): Promise<ReadmissionModelsData> => fetchJson<ReadmissionModelsData>('/ml/readmission/train', { method: 'POST' }),

  getDecisionTree: (maxDepth: number = 4, criterion: string = 'gini'): Promise<DecisionTreeData> =>
    fetchJson<DecisionTreeData>(`/ml/readmission/decision-tree?max_depth=${maxDepth}&criterion=${criterion}`),

  trainDecisionTree: (payload: {
    max_depth: number;
    criterion: string;
    min_samples_split: number;
    min_samples_leaf: number;
  }): Promise<DecisionTreeData> =>
    fetchJson<DecisionTreeData>('/ml/decision-tree/train', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  predictReadmission: (payload: {
    age: number;
    sex: string;
    department_id: string;
    admission_type: string;
    diagnosis_category: string;
    length_of_stay: number;
    prior_admissions: number;
    prior_visits: number;
  }): Promise<PredictionResult> =>
    fetchJson<PredictionResult>('/ml/readmission/predict', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getModelComparison: (): Promise<ModelComparisonResponse> => fetchJson<ModelComparisonResponse>('/ml/comparison'),

  // ── Reports ──────────────────────────────────────────────────
  getReportsSummary: (): Promise<any> => fetchJson('/reports/summary'),
  getHospitalKpiReport: (deptId?: string): Promise<any> => fetchJson(`/reports/hospital-kpi${deptId ? `?department_id=${deptId}` : ''}`),
  getDepartmentPerformanceReport: (): Promise<any> => fetchJson('/reports/department-performance'),
  getMonthlyAdmissionsReport: (): Promise<any> => fetchJson('/reports/monthly-admissions'),
  getBillingCollectionReport: (): Promise<any> => fetchJson('/reports/billing-collection'),
  getReadmissionAnalysisReport: (): Promise<any> => fetchJson('/reports/readmission-analysis'),
  getClusteringReport: (): Promise<any> => fetchJson('/reports/clustering-summary'),
  getAssociationRulesReport: (): Promise<any> => fetchJson('/reports/association-rules-summary'),
  getModelEvaluationReport: (): Promise<any> => fetchJson('/reports/model-evaluation-summary'),
  getEtlQualityReport: (): Promise<any> => fetchJson('/reports/etl-quality'),
  getAdmissionsCsvUrl: (): string => `${BASE_URL}/reports/export/admissions-csv`,
  getBillingCsvUrl: (): string => `${BASE_URL}/reports/export/billing-csv`,
  getPatientsCsvUrl: (): string => `${BASE_URL}/reports/export/patients-csv`,
  getRulesCsvUrl: (): string => `${BASE_URL}/reports/export/rules-csv`,

  // ── Dataset Management ───────────────────────────────────────
  getDatasets: (): Promise<{ dataset_directory: string; files_count: number; files: DatasetFileInfo[]; reproducible_seed: number; is_synthetic: boolean }> =>
    fetchJson('/datasets/'),

  previewDataset: (filename: string): Promise<any> =>
    fetchJson(`/datasets/preview/${encodeURIComponent(filename)}`),

  downloadDatasetUrl: (filename: string): string =>
    `${BASE_URL}/datasets/download/${encodeURIComponent(filename)}`,

  uploadDataset: (tableName: string, csvContent: string): Promise<any> => {
    const formData = new FormData();
    formData.append('table_name', tableName);
    formData.append('csv_content', csvContent);
    return fetchJson('/datasets/upload', {
      method: 'POST',
      body: formData,
    });
  },

  getDatasetLineage: (): Promise<any> => fetchJson('/datasets/lineage'),

  regenerateDataset: (patientCount: number): Promise<{ message: string }> =>
    fetchJson('/datasets/regenerate', {
      method: 'POST',
      body: JSON.stringify({ patient_count: patientCount }),
    }),

  // ── User Management (Admin) ──────────────────────────────────
  getUsers: (queryString: string = ''): Promise<{ total: number; users: User[] }> =>
    fetchJson<{ total: number; users: User[] }>(`/users/?${queryString}`),

  createUser: (payload: any): Promise<{ message: string; user_id: number }> =>
    fetchJson('/users/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateUserRole: (userId: number | string, role: string): Promise<{ message: string }> =>
    fetchJson(`/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    }),

  toggleUserStatus: (userId: number | string, isActive: boolean): Promise<{ message: string }> =>
    fetchJson(`/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ is_active: isActive }),
    }),

  // ── Audit Logs (Admin) ───────────────────────────────────────
  getAuditLogs: (queryString: string = ''): Promise<{ total: number; logs: AuditLog[] }> =>
    fetchJson<{ total: number; logs: AuditLog[] }>(`/audit/logs?${queryString}`),

  // ── Table Data Explorer ──────────────────────────────────────
  browseData: (table: string, page: number = 1, limit: number = 15, search?: string): Promise<BrowseDataResponse> => {
    const params = new URLSearchParams({ table, page: String(page), limit: String(limit) });
    if (search) params.append('search', search);
    return fetchJson<BrowseDataResponse>(`/data/browse?${params.toString()}`);
  },
};
