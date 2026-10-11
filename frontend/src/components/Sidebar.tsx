import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Building2,
  Calendar,
  BedDouble,
  Receipt,
  Database,
  GitBranch,
  Network,
  Cpu,
  Boxes,
  Binary,
  Layers,
  FileBarChart,
  ServerCog,
  ShieldCheck,
  History,
  Settings,
  HelpCircle,
  Activity,
  HeartPulse
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  roles: UserRole[];
  category: 'Overview' | 'Clinical Operations' | 'Warehouse & Mining' | 'Administration';
}

const NAV_ITEMS: NavItem[] = [
  // Overview
  { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['Administrator', 'Doctor', 'Receptionist', 'Data Analyst'], category: 'Overview' },
  
  // Clinical Operations
  { name: 'Patients', path: '/patients', icon: Users, roles: ['Administrator', 'Doctor', 'Receptionist', 'Data Analyst'], category: 'Clinical Operations' },
  { name: 'Doctors', path: '/doctors', icon: UserCheck, roles: ['Administrator', 'Doctor', 'Receptionist', 'Data Analyst'], category: 'Clinical Operations' },
  { name: 'Departments', path: '/departments', icon: Building2, roles: ['Administrator', 'Doctor', 'Receptionist', 'Data Analyst'], category: 'Clinical Operations' },
  { name: 'Appointments', path: '/appointments', icon: Calendar, roles: ['Administrator', 'Doctor', 'Receptionist'], category: 'Clinical Operations' },
  { name: 'Admissions', path: '/admissions', icon: BedDouble, roles: ['Administrator', 'Doctor', 'Receptionist'], category: 'Clinical Operations' },
  { name: 'Diagnoses & Treatments', path: '/diagnoses', icon: Activity, roles: ['Administrator', 'Doctor', 'Data Analyst'], category: 'Clinical Operations' },
  { name: 'Billing', path: '/billing', icon: Receipt, roles: ['Administrator', 'Receptionist', 'Data Analyst'], category: 'Clinical Operations' },

  // Warehouse & Mining
  { name: 'Data Warehouse', path: '/warehouse', icon: Database, roles: ['Administrator', 'Data Analyst'], category: 'Warehouse & Mining' },
  { name: 'ETL Pipeline', path: '/etl', icon: GitBranch, roles: ['Administrator', 'Data Analyst'], category: 'Warehouse & Mining' },
  { name: 'Patient Clustering', path: '/clustering', icon: Network, roles: ['Administrator', 'Data Analyst'], category: 'Warehouse & Mining' },
  { name: 'Prediction Model', path: '/prediction', icon: Cpu, roles: ['Administrator', 'Doctor', 'Data Analyst'], category: 'Warehouse & Mining' },
  { name: 'Association Rules', path: '/association-rules', icon: Boxes, roles: ['Administrator', 'Data Analyst'], category: 'Warehouse & Mining' },
  { name: 'Decision Tree', path: '/decision-tree', icon: Binary, roles: ['Administrator', 'Data Analyst'], category: 'Warehouse & Mining' },
  { name: 'Model Comparison', path: '/model-comparison', icon: Layers, roles: ['Administrator', 'Doctor', 'Data Analyst'], category: 'Warehouse & Mining' },
  { name: 'Reports', path: '/reports', icon: FileBarChart, roles: ['Administrator', 'Doctor', 'Data Analyst'], category: 'Warehouse & Mining' },

  // Administration
  { name: 'Dataset Management', path: '/datasets', icon: ServerCog, roles: ['Administrator', 'Data Analyst'], category: 'Administration' },
  { name: 'User Management', path: '/users', icon: ShieldCheck, roles: ['Administrator'], category: 'Administration' },
  { name: 'Audit Logs', path: '/audit', icon: History, roles: ['Administrator'], category: 'Administration' },
  { name: 'Settings', path: '/settings', icon: Settings, roles: ['Administrator', 'Doctor', 'Receptionist', 'Data Analyst'], category: 'Administration' },
  { name: 'Help & About', path: '/about', icon: HelpCircle, roles: ['Administrator', 'Doctor', 'Receptionist', 'Data Analyst'], category: 'Administration' },
];

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const currentRole = user?.role || 'Receptionist';

  // Filter items by current user's role
  const allowedItems = NAV_ITEMS.filter((item) => item.roles.includes(currentRole));

  // Group by category
  const categories = ['Overview', 'Clinical Operations', 'Warehouse & Mining', 'Administration'] as const;

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen border-r border-slate-800 shrink-0 select-none">
      {/* Brand Logo Header */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-800 bg-slate-950/40">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
          <HeartPulse className="w-5 h-5 stroke-[2.5]" />
        </div>
        <div>
          <h1 className="font-bold text-sm tracking-tight text-white leading-tight">MedAnalytics</h1>
          <p className="text-[10px] text-teal-400 font-medium tracking-wider uppercase">DWM Intelligence</p>
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {categories.map((cat) => {
          const itemsInCat = allowedItems.filter((i) => i.category === cat);
          if (itemsInCat.length === 0) return null;

          return (
            <div key={cat} className="space-y-1">
              <p className="px-3 text-[10px] font-semibold text-slate-300 uppercase tracking-wider mb-2">
                {cat}
              </p>
              {itemsInCat.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-teal-500/15 text-teal-400 font-semibold border-l-2 border-teal-500'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </NavLink>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Role Indicator Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2 truncate">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          <span className="text-[11px] font-medium text-slate-300 truncate">{user?.full_name || 'Guest'}</span>
        </div>
        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-teal-500/10 text-teal-300 border border-teal-500/20 uppercase tracking-wider">
          {currentRole}
        </span>
      </div>
    </aside>
  );
};
