import React from 'react';
import {
  Users,
  BedDouble,
  DollarSign,
  TrendingDown,
  Clock,
  Building2,
  Calendar,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  CreditCard,
  ShieldAlert,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { OverviewData } from '../types';

interface OverviewTabProps {
  data: OverviewData | null;
  loading: boolean;
  onRefresh: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ data, loading }) => {
  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-14 h-14 border-4 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin" />
        <p className="text-slate-400 font-mono text-sm tracking-wide animate-pulse">
          Aggregating multidimensional operational data warehouse metrics...
        </p>
      </div>
    );
  }

  const { kpis, monthly_admissions, monthly_revenue, departments, demographics, top_diagnoses } = data;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 glass-panel-glow border border-emerald-500/30">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-gradient-to-br from-emerald-500/10 via-cyan-500/10 to-indigo-500/0 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Data Warehouse Synchronized • Star Schema Online</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              Executive Clinical & Warehouse Intelligence
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
              Real-time monitoring of operational healthcare throughput, multi-dimensional OLAP summaries, clinical utilization patterns, and 30-day readmission vulnerability.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-right">
              <div className="text-xs text-slate-400">Warehouse Grain</div>
              <div className="text-sm font-bold font-mono text-emerald-400">Atomic Encounter</div>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-right">
              <div className="text-xs text-slate-400">Hospital Bed Capacity</div>
              <div className="text-sm font-bold font-mono text-cyan-400">
                {kpis.occupancy_rate}% <span className="text-xs text-slate-400 font-normal">({kpis.bed_capacity} beds)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Primary KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-5">
        
        {/* Card 1: Patients */}
        <div className="glass-panel p-5 rounded-2xl hover:border-emerald-500/40 transition-all duration-300 hover:-translate-y-1 group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Total Patients</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
            {kpis.total_patients.toLocaleString()}
          </div>
          <div className="mt-2 flex items-center text-xs text-emerald-400 space-x-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Active Cohort</span>
            <span className="text-slate-500 ml-auto">{kpis.total_departments} Depts</span>
          </div>
        </div>

        {/* Card 2: Encounters */}
        <div className="glass-panel p-5 rounded-2xl hover:border-cyan-500/40 transition-all duration-300 hover:-translate-y-1 group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Clinical Encounters</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition-transform">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
            {kpis.total_encounters.toLocaleString()}
          </div>
          <div className="mt-2 flex items-center text-xs text-cyan-400 space-x-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>In & Outpatient</span>
            <span className="text-slate-500 ml-auto">{kpis.total_doctors} MDs</span>
          </div>
        </div>

        {/* Card 3: Admissions */}
        <div className="glass-panel p-5 rounded-2xl hover:border-indigo-500/40 transition-all duration-300 hover:-translate-y-1 group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Inpatient Stays</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition-transform">
              <BedDouble className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
            {kpis.total_admissions.toLocaleString()}
          </div>
          <div className="mt-2 flex items-center text-xs text-indigo-400 space-x-1">
            <span>Occupancy {kpis.occupancy_rate}%</span>
          </div>
        </div>

        {/* Card 4: Readmission Rate */}
        <div className="glass-panel p-5 rounded-2xl hover:border-rose-500/40 transition-all duration-300 hover:-translate-y-1 group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">30D Readmissions</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 group-hover:scale-110 transition-transform">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-300 font-mono tracking-tight">
            {kpis.readmission_rate}%
          </div>
          <div className="mt-2 flex items-center text-xs text-rose-400 space-x-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{kpis.readmission_count} patients (Target &lt; 15%)</span>
          </div>
        </div>

        {/* Card 5: Revenue */}
        <div className="glass-panel p-5 rounded-2xl hover:border-emerald-500/40 transition-all duration-300 hover:-translate-y-1 group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Revenue Billed</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono tracking-tight">
            ${(kpis.total_billed / 1000000).toFixed(2)}M
          </div>
          <div className="mt-2 flex items-center text-xs text-emerald-300 space-x-1">
            <CreditCard className="w-3.5 h-3.5" />
            <span>{kpis.collection_rate}% Collected</span>
          </div>
        </div>

        {/* Card 6: ALOS */}
        <div className="glass-panel p-5 rounded-2xl hover:border-amber-500/40 transition-all duration-300 hover:-translate-y-1 group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Avg Length of Stay</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-mono tracking-tight">
            {kpis.avg_los} <span className="text-sm font-normal text-slate-400">Days</span>
          </div>
          <div className="mt-2 flex items-center text-xs text-amber-400 space-x-1">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Acute Care Benchmark</span>
          </div>
        </div>

      </div>

      {/* Main Charts Row 1: Admissions Timeline & Revenue Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Admissions Stream Chart */}
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <BedDouble className="w-4 h-4 text-emerald-400" />
                <span>Monthly Inpatient Admissions Breakdown</span>
              </h2>
              <p className="text-xs text-slate-400">Acuity categories: Emergency, Elective, Urgent</p>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
              TimeSeries
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthly_admissions} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEmergency" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorElective" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorUrgent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="emergency" name="Emergency" stroke="#f43f5e" fillOpacity={1} fill="url(#colorEmergency)" />
                <Area type="monotone" dataKey="elective" name="Elective" stroke="#10b981" fillOpacity={1} fill="url(#colorElective)" />
                <Area type="monotone" dataKey="urgent" name="Urgent" stroke="#f59e0b" fillOpacity={1} fill="url(#colorUrgent)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Cycle Chart */}
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-cyan-400" />
                <span>Revenue Cycle & Collection Velocity</span>
              </h2>
              <p className="text-xs text-slate-400">Total billed charges vs real-time collections</p>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
              USD ($)
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly_revenue} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val: any) => [`$${Number(val).toLocaleString()}`, '']}
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="billed" name="Billed Amount" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                <Bar dataKey="collected" name="Collected Payments" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Row 2: Department Performance & Demographics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Department Table & Acuity Matrix (2 cols) */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <span>Department Operational & Acuity Matrix</span>
              </h2>
              <p className="text-xs text-slate-400">Admissions, length of stay, revenue contribution and readmission incidence</p>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              8 Specialized Units
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                  <th className="py-3 px-3">Department</th>
                  <th className="py-3 px-3">Admissions</th>
                  <th className="py-3 px-3">Encounters</th>
                  <th className="py-3 px-3">Avg LOS</th>
                  <th className="py-3 px-3">Revenue ($)</th>
                  <th className="py-3 px-3">Readmissions</th>
                  <th className="py-3 px-3">Risk Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {departments.map((dept) => (
                  <tr key={dept.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-3 font-semibold text-white flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span>{dept.department}</span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-200">{dept.admissions}</td>
                    <td className="py-3 px-3 font-mono text-slate-400">{dept.encounters}</td>
                    <td className="py-3 px-3 font-mono text-amber-300 font-medium">{dept.avg_los} d</td>
                    <td className="py-3 px-3 font-mono text-emerald-400 font-semibold">
                      ${dept.revenue.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 font-mono text-rose-300">{dept.readmissions}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              dept.readmission_rate > 15
                                ? 'bg-rose-500'
                                : dept.readmission_rate > 8
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, dept.readmission_rate * 4)}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] text-slate-300">{dept.readmission_rate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Demographics / Age Distribution (1 col) */}
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <span>Patient Demographics</span>
              </h2>
              <p className="text-xs text-slate-400">Distribution across age groups & sex</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={demographics} layout="vertical" margin={{ top: 5, right: 10, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis dataKey="age_group" type="category" stroke="#64748b" fontSize={10} tickLine={false} width={80} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '5px' }} />
                <Bar dataKey="Male" name="Male" fill="#06b6d4" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Female" name="Female" fill="#a855f7" stackId="a" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-2 border-t border-slate-800 text-xs text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Primary Senior Cohort (65+):</span>
              <span className="font-mono text-emerald-400 font-semibold">
                {demographics.find((d) => d.age_group.includes('65+'))?.total || 0} Patients
              </span>
            </div>
            <div className="flex justify-between">
              <span>Working Adult Cohort (36-50):</span>
              <span className="font-mono text-cyan-400 font-semibold">
                {demographics.find((d) => d.age_group.includes('36-50'))?.total || 0} Patients
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Row 3: Top Diagnoses and Readmission Risk */}
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Top Diagnostic Categories & Readmission Vulnerability</span>
            </h2>
            <p className="text-xs text-slate-400">Clinical clusters with highest post-discharge readmission likelihood</p>
          </div>
          <span className="text-xs font-mono px-3 py-1 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20">
            High Acuity Surveillance
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {top_diagnoses.map((diag, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all">
              <div className="flex items-start justify-between">
                <span className="text-xs font-bold text-slate-200 line-clamp-1">{diag.category}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                  {diag.count} Cases
                </span>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <div>
                  <div className="text-lg font-extrabold text-white font-mono">{diag.readmissions}</div>
                  <div className="text-[10px] text-slate-400">Readmitted</div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-bold font-mono ${
                    diag.readmission_pct > 20 ? 'text-rose-400' : 'text-amber-400'
                  }`}>
                    {diag.readmission_pct}%
                  </div>
                  <div className="text-[10px] text-slate-400">Rate</div>
                </div>
              </div>
              <div className="mt-2 w-full bg-slate-800 rounded-full h-1">
                <div
                  className={`h-full rounded-full ${
                    diag.readmission_pct > 20 ? 'bg-rose-500' : 'bg-amber-400'
                  }`}
                  style={{ width: `${Math.min(100, diag.readmission_pct * 3)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
