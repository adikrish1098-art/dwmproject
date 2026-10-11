import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  Building2,
  Calendar,
  BedDouble,
  Receipt,
  RotateCcw,
  Clock,
  DollarSign,
  TrendingUp,
  Filter,
  RefreshCw,
  Database,
  CheckCircle2
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { StatCard } from '../components/StatCard';
import { api } from '../services/api';
import { DashboardOverview } from '../types';
import { useAuth } from '../context/AuthContext';

const PIE_COLORS = ['#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#64748b'];

export const DashboardPage: React.FC = () => {
  const { user, role } = useAuth();
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchDashboard = async (deptId?: string) => {
    try {
      setRefreshing(true);
      const res = await api.getDashboard(deptId || undefined);
      setData(res);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    api.getDepartments().then(setDepartments).catch(() => {});
    fetchDashboard(selectedDept);
  }, [selectedDept]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500 font-medium">Aggregating Hospital Warehousing Metrics...</p>
      </div>
    );
  }

  const kpis = data?.kpis;
  const charts = data?.charts;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Welcome back, {user?.full_name}
            </h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
              {role} View
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time Operational & Analytical Intelligence Dashboard • SQLite Star Schema
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Department Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="text-xs font-medium px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Hospital Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => fetchDashboard(selectedDept)}
            disabled={refreshing}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-teal-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Registered Patients"
          value={kpis?.total_patients?.toLocaleString() || 0}
          icon={Users}
          color="teal"
          subtext="Unique clinical patient identifiers"
        />
        <StatCard
          title="Active Doctors"
          value={kpis?.total_doctors || 0}
          icon={UserCheck}
          color="blue"
          subtext="Across 8 medical specialties"
        />
        <StatCard
          title="Scheduled Appointments"
          value={kpis?.total_appointments?.toLocaleString() || 0}
          icon={Calendar}
          color="indigo"
          subtext="Outpatient & specialty clinic visits"
        />
        <StatCard
          title="Total Inpatient Admissions"
          value={kpis?.total_admissions?.toLocaleString() || 0}
          icon={BedDouble}
          color="amber"
          subtext={`${kpis?.discharged_count} discharged to date`}
        />
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="30-Day Readmissions"
          value={`${kpis?.readmission_count} (${kpis?.readmission_rate_pct}%)`}
          icon={RotateCcw}
          color={Number(kpis?.readmission_rate_pct || 0) > 15 ? 'rose' : 'teal'}
          subtext="Consecutive admission <= 30 days"
        />
        <StatCard
          title="Avg Length of Stay"
          value={`${kpis?.avg_length_of_stay} days`}
          icon={Clock}
          color="blue"
          subtext="Inpatient admission duration"
        />
        <StatCard
          title="Total Billed Revenue"
          value={`$${kpis?.total_billed?.toLocaleString() || 0}`}
          icon={DollarSign}
          color="emerald"
          subtext={`Collected: $${kpis?.total_paid?.toLocaleString() || 0}`}
        />
        <StatCard
          title="Outstanding Balances"
          value={`$${kpis?.total_outstanding?.toLocaleString() || 0}`}
          icon={Receipt}
          color="rose"
          subtext="Pending payer & self-pay balance"
        />
      </div>

      {/* Interactive Charts Section 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Admissions Trend */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Monthly Inpatient Admissions</h3>
              <p className="text-[11px] text-slate-500">Historical admission volumes across past 12 months</p>
            </div>
            <TrendingUp className="w-4 h-4 text-teal-500" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts?.monthly_admissions || []}>
                <defs>
                  <linearGradient id="admGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                <XAxis dataKey="period" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="admissions" stroke="#14b8a6" strokeWidth={2.5} fillOpacity={1} fill="url(#admGradient)" name="Admissions" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department-wise Patient Distribution */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Department Admission Workload</h3>
              <p className="text-[11px] text-slate-500">Admissions distributed across clinical departments</p>
            </div>
            <Building2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.department_distribution || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                <XAxis dataKey="department" stroke="#64748b" fontSize={10} tickFormatter={(v) => v.slice(0, 10)} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Admissions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Interactive Charts Section 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Most Common Diagnoses */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">Common Diagnosis Categories</h3>
          <p className="text-[11px] text-slate-500 mb-4">ICD-10 clinical diagnoses frequency</p>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.top_diagnoses || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                <XAxis type="number" stroke="#64748b" fontSize={10} />
                <YAxis type="category" dataKey="category" stroke="#64748b" fontSize={10} width={100} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }} />
                <Bar dataKey="count" fill="#06b6d4" radius={[0, 6, 6, 0]} name="Occurrences" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Billing vs Collections Trend */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">Monthly Billing & Collections</h3>
          <p className="text-[11px] text-slate-500 mb-4">Comparison of invoiced revenue vs cash collections</p>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts?.billing_trends || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                <XAxis dataKey="period" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="billed" stroke="#f59e0b" strokeWidth={2} name="Billed ($)" />
                <Line type="monotone" dataKey="paid" stroke="#10b981" strokeWidth={2} name="Collected ($)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Age Group Distribution */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">Patient Age Demographics</h3>
          <p className="text-[11px] text-slate-500 mb-4">Cohort distribution across age brackets</p>
          <div className="h-60 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts?.age_groups || []}
                  dataKey="count"
                  nameKey="age_group"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  innerRadius={45}
                  paddingAngle={3}
                >
                  {(charts?.age_groups || []).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Appointments & System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Appointments */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Recent Appointments</h3>
            <span className="text-xs text-teal-600 dark:text-teal-400 font-semibold">Latest Bookings</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Patient</th>
                  <th className="py-2.5 px-3">Doctor</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {(data?.recent_appointments || []).map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-medium">{a.patient_name}</td>
                    <td className="py-2.5 px-3">{a.doctor_name}</td>
                    <td className="py-2.5 px-3">{a.department_name}</td>
                    <td className="py-2.5 px-3">{a.date}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        a.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500' :
                        a.status === 'Confirmed' ? 'bg-blue-500/10 text-blue-500' :
                        a.status === 'Cancelled' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'
                      }`}>
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Data Warehouse & ETL Health Panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Database className="w-5 h-5 text-teal-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Data Warehouse Status</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              OLAP Star Schema synchronized with operational transactions. Fact and dimension tables refreshed via ETL pipeline.
            </p>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800">
                <span className="text-slate-500">Pipeline Status:</span>
                <span className="flex items-center gap-1.5 font-bold text-emerald-500">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {data?.etl_freshness?.last_status || 'HEALTHY'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800">
                <span className="text-slate-500">Last Refresh:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {data?.etl_freshness?.last_refresh || 'Real-time'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800">
                <span className="text-slate-500">Warehouse Fact Records:</span>
                <span className="font-semibold text-teal-600 dark:text-teal-400">
                  {data?.etl_freshness?.records_loaded?.toLocaleString() || 4370} rows
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-400 block leading-tight">
              Educational notice: System utilizes synthetic clinical data generated with ground-truth mathematical relationships.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
