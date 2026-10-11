import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppLayout } from './layouts/AppLayout';

// Auth Pages
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';

// Main Application Pages
import { DashboardPage } from './pages/DashboardPage';
import { PatientsPage } from './pages/PatientsPage';
import { DoctorsPage } from './pages/DoctorsPage';
import { DepartmentsPage } from './pages/DepartmentsPage';
import { AppointmentsPage } from './pages/AppointmentsPage';
import { AdmissionsPage } from './pages/AdmissionsPage';
import { DiagnosesPage } from './pages/DiagnosesPage';
import { BillingPage } from './pages/BillingPage';
import { WarehousePage } from './pages/WarehousePage';
import { EtlPage } from './pages/EtlPage';
import { ClusteringPage } from './pages/ClusteringPage';
import { PredictionPage } from './pages/PredictionPage';
import { AssociationRulesPage } from './pages/AssociationRulesPage';
import { DecisionTreePage } from './pages/DecisionTreePage';
import { ModelComparisonPage } from './pages/ModelComparisonPage';
import { ReportsPage } from './pages/ReportsPage';
import { DatasetsPage } from './pages/DatasetsPage';
import { UsersPage } from './pages/UsersPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AboutPage } from './pages/AboutPage';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Protected Main Layout Routes */}
          <Route path="/" element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="patients" element={<PatientsPage />} />
            <Route path="doctors" element={<DoctorsPage />} />
            <Route path="departments" element={<DepartmentsPage />} />
            <Route path="appointments" element={<AppointmentsPage />} />
            <Route path="admissions" element={<AdmissionsPage />} />
            <Route path="diagnoses" element={<DiagnosesPage />} />
            <Route path="billing" element={<BillingPage />} />
            <Route path="warehouse" element={<WarehousePage />} />
            <Route path="etl" element={<EtlPage />} />
            <Route path="clustering" element={<ClusteringPage />} />
            <Route path="prediction" element={<PredictionPage />} />
            <Route path="association-rules" element={<AssociationRulesPage />} />
            <Route path="decision-tree" element={<DecisionTreePage />} />
            <Route path="model-comparison" element={<ModelComparisonPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="datasets" element={<DatasetsPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="audit" element={<AuditLogsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="about" element={<AboutPage />} />
          </Route>

          {/* Catch-all Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
