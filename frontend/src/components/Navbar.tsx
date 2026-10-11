import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Bell,
  LogOut,
  User as UserIcon,
  ChevronRight,
  Calendar,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ROUTE_NAMES: Record<string, string> = {
  '/': 'Hospital Overview & KPIs',
  '/patients': 'Patient Registry & Records',
  '/doctors': 'Doctor Workload & Staffing',
  '/departments': 'Clinical Departments',
  '/appointments': 'Appointment Scheduling',
  '/admissions': 'Inpatient Admissions & Discharges',
  '/diagnoses': 'Clinical Encounters & Diagnoses',
  '/billing': 'Revenue Cycle & Billing',
  '/warehouse': 'Kimball Star Schema Data Warehouse',
  '/etl': 'ETL Processing Pipeline',
  '/clustering': 'K-Means Patient Segmentation',
  '/prediction': '30-Day Readmission ML Engine',
  '/association-rules': 'Apriori Co-occurrence Mining',
  '/decision-tree': 'Interpretable Decision Tree',
  '/model-comparison': 'Model Evaluation & Comparison',
  '/reports': 'Executive Reports & CSV Exports',
  '/datasets': 'Dataset Management & Lineage',
  '/users': 'Role-Based User Management',
  '/audit': 'Security & Compliance Audit Logs',
  '/settings': 'System & Profile Settings',
  '/about': 'Architecture & Viva Questions',
};

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const currentPath = location.pathname;
  const currentTitle = ROUTE_NAMES[currentPath] || 'Hospital Analytics';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between shrink-0 select-none shadow-sm z-30">
      {/* Breadcrumb / Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center text-xs font-medium text-slate-500 dark:text-slate-400">
          <Link to="/" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
            MedPulse DWM
          </Link>
          <ChevronRight className="w-3.5 h-3.5 mx-1.5 text-slate-400" />
          <span className="text-slate-900 dark:text-white font-semibold text-sm">
            {currentTitle}
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Warehouse Health Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-medium text-[11px]">Star Schema OLAP Online</span>
        </div>

        {/* Date Filter Indicator */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>Demo Cycle: 2024 - 2026</span>
        </div>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
            title="System Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-teal-500"></span>
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-3 px-4 z-50 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2 mb-2">
                <span className="font-semibold text-slate-900 dark:text-white">Audit & Warehouse Alerts</span>
                <span className="text-[10px] text-teal-600 dark:text-teal-400 font-mono">Live</span>
              </div>
              <div className="space-y-2 text-slate-600 dark:text-slate-300">
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50">
                  <p className="font-medium text-slate-800 dark:text-slate-200">ETL Refresh Completed</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Incremental sync from operational SQLite to Kimball star schema was successful.</p>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50">
                  <p className="font-medium text-slate-800 dark:text-slate-200">Synthetic Data Loaded</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">650 synthetic patients & 1,000+ admissions active for clinical mining.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-white text-xs font-bold shadow-sm">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[120px]">
                {user?.full_name || 'User'}
              </p>
              <p className="text-[10px] text-teal-600 dark:text-teal-400 font-medium">
                {user?.role || 'Guest'}
              </p>
            </div>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-2 z-50 text-xs">
              <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800">
                <p className="font-semibold text-slate-900 dark:text-white truncate">{user?.full_name}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20">
                  {user?.role}
                </span>
              </div>
              <div className="py-1">
                <Link
                  to="/settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <UserIcon className="w-4 h-4 text-slate-400" />
                  <span>Profile & Password</span>
                </Link>
                <Link
                  to="/about"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-slate-400" />
                  <span>Viva & Project Info</span>
                </Link>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-800 pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
