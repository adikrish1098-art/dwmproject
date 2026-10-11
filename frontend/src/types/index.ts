// ─── Auth & User Types ───────────────────────────────────────────────
export type UserRole = 'Administrator' | 'Doctor' | 'Receptionist' | 'Data Analyst';

export interface User {
  id: string | number;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone_number?: string;
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user?: User;
  role?: string;
  username?: string;
  full_name?: string;
}

// ─── Clinical Entities ──────────────────────────────────────────────
export interface Patient {
  id: string;
  full_name: string;
  date_of_birth: string | null;
  age: number;
  sex: string;
  phone_number: string;
  email?: string;
  address?: string;
  emergency_contact?: string;
  is_active: boolean;
  created_at?: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  department_id: string;
  department_name?: string;
  contact_number?: string;
  email?: string;
  is_available: boolean;
  is_active: boolean;
  appointment_count?: number;
  admission_count?: number;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  doctor_count?: number;
  appointment_count?: number;
  admission_count?: number;
}

export interface Appointment {
  id: string;
  patient_id: string;
  patient_name?: string;
  doctor_id: string;
  doctor_name?: string;
  department_id: string;
  department_name?: string;
  appointment_date: string;
  reason?: string;
  status: string;
}

export interface Admission {
  id: string;
  patient_id: string;
  patient_name?: string;
  doctor_id: string;
  doctor_name?: string;
  department_id: string;
  department_name?: string;
  admission_date: string;
  discharge_date?: string | null;
  length_of_stay: number;
  admission_type: string;
  discharge_status: string;
  is_readmission_30d: boolean;
  prior_admission_id?: string | null;
}

export interface EncounterDiagnosis {
  id: number;
  code: string;
  category: string;
  description: string;
  is_primary: boolean;
}

export interface EncounterTreatment {
  id: number;
  procedure_name: string;
  category: string;
  cost: number;
  performed_date: string;
}

export interface Encounter {
  id: string;
  patient_id: string;
  patient_name?: string;
  doctor_id: string;
  doctor_name?: string;
  department_id: string;
  department_name?: string;
  encounter_date: string;
  encounter_type: string;
  notes?: string;
  diagnoses: EncounterDiagnosis[];
  treatments: EncounterTreatment[];
}

export interface Invoice {
  id: string;
  patient_id: string;
  patient_name?: string;
  department_id: string;
  service_category: string;
  invoice_date: string;
  amount_billed: number;
  amount_paid: number;
  outstanding_balance: number;
  payment_status: string;
}

export interface BillingSummary {
  total_billed: number;
  total_paid: number;
  total_outstanding: number;
  collection_rate_pct: number;
}

export interface AuditLog {
  id: number;
  user_id?: number | null;
  username: string;
  action: string;
  resource: string;
  details?: string | null;
  ip_address?: string | null;
  timestamp: string;
}

export interface DatasetFileInfo {
  filename: string;
  record_count: number;
  size_kb: number;
}

// ─── Overview / KPI Types (for tab-based OverviewTab) ───────────────
export interface OverviewKPIs {
  total_patients: number;
  total_encounters: number;
  total_admissions: number;
  readmission_count: number;
  readmission_rate: number;
  avg_los: number;
  total_billed: number;
  total_paid: number;
  collection_rate: number;
  total_doctors: number;
  total_departments: number;
  bed_capacity: number;
  occupancy_rate: number;
}

export interface MonthlyAdmission {
  month: string;
  admissions: number;
  readmissions: number;
  readmission_rate: number;
  emergency: number;
  elective: number;
  urgent: number;
}

export interface MonthlyRevenue {
  month: string;
  billed: number;
  collected: number;
}

export interface DepartmentMetric {
  id: string;
  department: string;
  admissions: number;
  encounters: number;
  avg_los: number;
  revenue: number;
  readmissions: number;
  readmission_rate: number;
}

export interface DemographicGroup {
  age_group: string;
  Male: number;
  Female: number;
  Other?: number;
  total: number;
}

export interface DiagnosisCategory {
  category: string;
  count: number;
  readmissions: number;
  readmission_pct: number;
}

export interface OverviewData {
  kpis: OverviewKPIs;
  monthly_admissions: MonthlyAdmission[];
  monthly_revenue: MonthlyRevenue[];
  departments: DepartmentMetric[];
  demographics: DemographicGroup[];
  top_diagnoses: DiagnosisCategory[];
}

// ─── Dashboard Page Types (for sidebar-based DashboardPage) ─────────
export interface DashboardKPIs {
  total_patients: number;
  total_doctors: number;
  total_departments: number;
  total_appointments: number;
  total_admissions: number;
  discharged_count: number;
  readmission_count: number;
  readmission_rate_pct: number;
  avg_length_of_stay: number;
  total_billed: number;
  total_paid: number;
  total_outstanding: number;
}

export interface DashboardCharts {
  monthly_admissions: { period: string; admissions: number }[];
  department_distribution: { department: string; count: number }[];
  top_diagnoses: { category: string; count: number }[];
  appointment_status?: { status: string; count: number }[];
  billing_trends: { period: string; billed: number; paid: number }[];
  age_groups: { age_group: string; count: number }[];
}

export interface DashboardAppointment {
  id: string;
  patient_name: string;
  doctor_name: string;
  department_name: string;
  date: string;
  status: string;
}

export interface DashboardEtlFreshness {
  last_status: string;
  last_refresh: string;
  records_loaded: number;
}

export interface DashboardOverview {
  kpis: DashboardKPIs;
  charts: DashboardCharts;
  recent_appointments: DashboardAppointment[];
  etl_freshness: DashboardEtlFreshness;
}

// ─── OLAP Types ─────────────────────────────────────────────────────
export interface FactTableMeta {
  table_name: string;
  description: string;
  grain: string;
  foreign_keys: string[];
  measures: string[];
}

export interface DimensionTableMeta {
  table_name: string;
  primary_key: string;
  hierarchy: string;
  fields: string[];
}

export interface OlapSchemaData {
  architecture: string;
  fact_tables: FactTableMeta[];
  dimension_tables: DimensionTableMeta[];
  olap_operations: { operation: string; description: string }[];
}

export interface OlapCubeData {
  granularity: string;
  metric: string;
  filters: { department: string; age_group: string };
  time_slices: string[];
  departments: string[];
  pivot_data: Record<string, any>[];
}

// ─── ETL Types ──────────────────────────────────────────────────────
export interface EtlJobRecord {
  id: number;
  job_name: string;
  status: string;
  start_time: string;
  end_time: string;
  records_extracted: number;
  records_loaded: number;
  error?: string | null;
  execution_seconds?: number;
}

export interface EtlStatusData {
  current_status: string;
  last_job: EtlJobRecord | null;
  pipeline_stages: { stage: string; description: string; status: string }[];
  history: EtlJobRecord[];
}

// ─── Clustering Types ───────────────────────────────────────────────
export interface ClusterProfile {
  cluster_id: number;
  segment_label: string;
  patient_count: number;
  percentage: number;
  mean_age: number;
  mean_visits: number;
  mean_admissions: number;
  mean_avg_los: number;
  mean_billed_amount: number;
}

export interface ClusterScatterPoint {
  patient_id: string;
  cluster: number;
  pca_x: number;
  pca_y: number;
  age: number;
  visits: number;
  billed: number;
}

export interface ElbowCurvePoint {
  k: number;
  inertia: number;
  silhouette_score: number;
}

export interface ClusteringData {
  status: string;
  k: number;
  features_used: string[];
  total_patients: number;
  overall_silhouette_score: number;
  elbow_curve: ElbowCurvePoint[];
  cluster_profiles: ClusterProfile[];
  pca_variance_ratio: number[];
  scatter_points: ClusterScatterPoint[];
  educational_note: string;
}

// ─── Association Rule Mining (Apriori) ──────────────────────────────
export interface AssociationRule {
  id: number;
  antecedent: string;
  consequent: string;
  support: number;
  confidence: number;
  lift: number;
  supporting_encounters: number;
}

export interface AprioriData {
  status: string;
  min_support: number;
  min_confidence: number;
  min_lift: number;
  total_encounters: number;
  frequent_itemsets_count?: number;
  rules: AssociationRule[];
  message?: string;
}

// ─── ML: Readmission Prediction ─────────────────────────────────────
export interface ModelMetric {
  model_name: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  roc_auc: number;
  confusion_matrix: { tn: number; fp: number; fn: number; tp: number };
}

export interface ReadmissionModelsData {
  status: string;
  dataset_summary: {
    total_admissions: number;
    train_samples: number;
    test_samples: number;
    readmission_cases_test: number;
    negative_cases_test: number;
  };
  model_results: Record<string, ModelMetric>;
  roc_curves: Record<string, { fpr: number; tpr: number }[]>;
  feature_importances: { feature: string; importance: number }[];
  educational_note: string;
}

export interface DecisionTreeData {
  status?: string;
  train_accuracy?: number;
  test_accuracy?: number;
  test_auc?: number;
  tree_depth?: number;
  leaf_count?: number;
  rules_text?: string;
  feature_importances?: { feature: string; importance: number }[];
  confusion_matrix?: { tn: number; fp: number; fn: number; tp: number };
  tree_rules_text?: string;
  metrics?: {
    train_accuracy: number;
    test_accuracy: number;
    test_precision: number;
    test_recall: number;
    test_f1_score: number;
    test_roc_auc: number;
    confusion_matrix: { tn: number; fp: number; fn: number; tp: number };
  };
  overfitting_analysis?: {
    accuracy_gap: number;
    verdict: string;
  };
}

export interface PredictionResult {
  prediction: number;
  readmission_risk_percentage: number;
  risk_level: "Low" | "Moderate" | "High" | "Critical";
  key_risk_factors: string[];
  model_used: string;
  disclaimer: string;
}

export interface ModelComparisonItem {
  model_key: string;
  name: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  roc_auc: number;
  confusion_matrix: { tn: number; fp: number; fn: number; tp: number };
  type: string;
}

export interface ModelComparisonResponse {
  status: string;
  comparison_table: ModelComparisonItem[];
  roc_curves: Record<string, { fpr: number; tpr: number }[]>;
  feature_importances: { feature: string; importance: number }[];
  overfitting_analysis: { accuracy_gap: number; verdict: string };
  educational_guidance: string;
}

// ─── Data Browser ───────────────────────────────────────────────────
export interface BrowseDataResponse {
  table: string;
  page: number;
  limit: number;
  total_records: number;
  total_pages: number;
  columns: string[];
  rows: Record<string, any>[];
}
