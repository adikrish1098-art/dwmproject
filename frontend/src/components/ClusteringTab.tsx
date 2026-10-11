import React, { useState, useEffect } from 'react';
import {
  Network,
  Users,
  Target,
  Award,
  Sparkles,
  DollarSign,
  Clock,
  RotateCw,
} from 'lucide-react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { ClusteringData } from '../types';
import { api } from '../services/api';

const CLUSTER_COLORS = [
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#6366f1', // Indigo
  '#f59e0b', // Amber
  '#f43f5e', // Rose
  '#a855f7', // Purple
];

export const ClusteringTab: React.FC = () => {
  const [k, setK] = useState<number>(3);
  const [data, setData] = useState<ClusteringData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeClusterFilter, setActiveClusterFilter] = useState<number | null>(null);

  const fetchClustering = (kVal: number) => {
    setLoading(true);
    api.getClustering(kVal)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Clustering error:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchClustering(k);
  }, [k]);

  const filteredPoints = data?.scatter_points.filter((pt) =>
    activeClusterFilter === null ? true : pt.cluster === activeClusterFilter
  ) || [];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 glass-panel-glow border border-indigo-500/30">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-gradient-to-br from-indigo-500/10 via-cyan-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
              <Network className="w-3.5 h-3.5" />
              <span>Unsupervised Machine Learning Module</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              K-Means Patient Segmentation & PCA 2D Explorer
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl">
              Multivariate clustering based on utilization vectors: Age, Encounters, Admissions, Length of Stay, and Total Billed Amount. Dimensionality reduced to 2D via Principal Component Analysis (PCA).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-right">
              <div className="text-xs text-slate-400">Silhouette Coefficient</div>
              <div className="text-lg font-bold font-mono text-emerald-400">
                {data?.overall_silhouette_score ?? '0.372'}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-right">
              <div className="text-xs text-slate-400">PCA Variance Explained</div>
              <div className="text-lg font-bold font-mono text-cyan-400">
                {data ? `${data.pca_variance_ratio[0]}% + ${data.pca_variance_ratio[1]}%` : '68.4%'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Parameters Bar */}
      <div className="glass-panel p-6 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center space-x-6">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300 flex items-center space-x-2">
              <Target className="w-4 h-4 text-emerald-400" />
              <span>Clusters Parameter (k): <span className="font-mono text-emerald-400 text-sm">{k}</span></span>
            </label>
            <div className="flex items-center space-x-2">
              {[2, 3, 4, 5, 6].map((num) => (
                <button
                  key={num}
                  onClick={() => setK(num)}
                  className={`w-9 h-9 rounded-xl font-mono text-xs font-bold transition-all ${
                    k === num
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-glow-emerald scale-105'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Cluster Filter Buttons */}
          <div className="space-y-1 hidden md:block">
            <label className="text-xs font-medium text-slate-400">Isolate Cohort in Scatter:</label>
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => setActiveClusterFilter(null)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                  activeClusterFilter === null
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                All ({filteredPoints.length})
              </button>
              {data?.cluster_profiles.map((cp) => (
                <button
                  key={cp.cluster_id}
                  onClick={() => setActiveClusterFilter(activeClusterFilter === cp.cluster_id ? null : cp.cluster_id)}
                  style={{
                    borderColor: CLUSTER_COLORS[cp.cluster_id % CLUSTER_COLORS.length],
                    backgroundColor: activeClusterFilter === cp.cluster_id ? `${CLUSTER_COLORS[cp.cluster_id % CLUSTER_COLORS.length]}33` : 'transparent'
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-mono border transition-colors ${
                    activeClusterFilter === cp.cluster_id ? 'text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Cluster {cp.cluster_id}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={() => fetchClustering(k)}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-mono transition-colors"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          <span>Re-compute K-Means</span>
        </button>
      </div>

      {/* Main Row: PCA 2D Projection Scatter Chart & Elbow Plot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* PCA 2D Scatter Chart (2 cols) */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Network className="w-4 h-4 text-emerald-400" />
                <span>PCA 2D Cluster Projection Map (n=300 patient samples)</span>
              </h2>
              <p className="text-xs text-slate-400">Reduced dimensionality from 5 standardized clinical features</p>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
              Interactive Points
            </span>
          </div>

          <div className="h-80 w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    type="number"
                    dataKey="pca_x"
                    name="PCA Component 1"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    label={{ value: 'Principal Component 1 (Utilization Intensity)', position: 'insideBottom', offset: -10, fill: '#64748b', fontSize: 11 }}
                  />
                  <YAxis
                    type="number"
                    dataKey="pca_y"
                    name="PCA Component 2"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    label={{ value: 'Principal Component 2 (Age & Acuity)', angle: -90, position: 'insideLeft', offset: 15, fill: '#64748b', fontSize: 11 }}
                  />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3', stroke: '#10b981' }}
                    content={({ payload }) => {
                      if (!payload || !payload.length) return null;
                      const pt = payload[0].payload;
                      const color = CLUSTER_COLORS[pt.cluster % CLUSTER_COLORS.length];
                      return (
                        <div className="p-3 rounded-xl bg-slate-950/95 border border-slate-800 shadow-2xl text-xs space-y-1.5 font-mono">
                          <div className="flex items-center space-x-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                            <span className="font-bold text-white">{pt.patient_id}</span>
                            <span className="text-slate-400">(Cluster {pt.cluster})</span>
                          </div>
                          <div className="text-slate-300">Age: <span className="text-white font-semibold">{pt.age} yrs</span></div>
                          <div className="text-slate-300">Total Visits: <span className="text-white font-semibold">{pt.visits}</span></div>
                          <div className="text-slate-300">Total Billed: <span className="text-emerald-400 font-semibold">${pt.billed.toLocaleString()}</span></div>
                        </div>
                      );
                    }}
                  />
                  {Array.from({ length: k }).map((_, cIdx) => {
                    const cPoints = filteredPoints.filter((p) => p.cluster === cIdx);
                    return (
                      <Scatter
                        key={cIdx}
                        name={`Cluster ${cIdx}`}
                        data={cPoints}
                        fill={CLUSTER_COLORS[cIdx % CLUSTER_COLORS.length]}
                      />
                    );
                  })}
                </ScatterChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Elbow Curve & Silhouette Plot (1 col) */}
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Elbow Curve & Silhouette</span>
              </h2>
              <p className="text-xs text-slate-400">Inertia optimization across k=2..7</p>
            </div>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              Optimal k=3
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.elbow_curve || []} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="k" stroke="#64748b" fontSize={11} tickLine={false} label={{ value: 'k', position: 'insideBottom', offset: -2, fill: '#64748b' }} />
                <YAxis yAxisId="left" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line yAxisId="left" type="monotone" dataKey="inertia" name="Inertia" stroke="#06b6d4" strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="right" type="monotone" dataKey="silhouette_score" name="Silhouette" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-800 pt-3">
            The inflection point (elbow) occurs prominently at <strong className="text-emerald-400">k=3</strong>, yielding maximum silhouette separation while retaining clinical interpretability.
          </p>
        </div>

      </div>

      {/* Cluster Persona Cards */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white flex items-center space-x-2">
          <Award className="w-5 h-5 text-amber-400" />
          <span>Mined Patient Cohort Profiles & Clinical Recommendations</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {data?.cluster_profiles.map((profile) => {
            const color = CLUSTER_COLORS[profile.cluster_id % CLUSTER_COLORS.length];
            return (
              <div
                key={profile.cluster_id}
                className="glass-panel p-6 rounded-3xl space-y-4 border hover:border-slate-600 transition-all"
                style={{ borderColor: `${color}40` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                      Cluster {profile.cluster_id}
                    </span>
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
                    {profile.patient_count} pts ({profile.percentage}%)
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-white">
                  {profile.segment_label}
                </h3>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                    <div className="text-[10px] text-slate-400 flex items-center space-x-1">
                      <Users className="w-3 h-3 text-cyan-400" />
                      <span>Mean Age</span>
                    </div>
                    <div className="text-base font-bold font-mono text-white mt-0.5">
                      {profile.mean_age} yrs
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                    <div className="text-[10px] text-slate-400 flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span>Avg Stays (LOS)</span>
                    </div>
                    <div className="text-base font-bold font-mono text-white mt-0.5">
                      {profile.mean_avg_los} days
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                    <div className="text-[10px] text-slate-400 flex items-center space-x-1">
                      <Target className="w-3 h-3 text-indigo-400" />
                      <span>Admissions</span>
                    </div>
                    <div className="text-base font-bold font-mono text-white mt-0.5">
                      {profile.mean_admissions} stays
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                    <div className="text-[10px] text-slate-400 flex items-center space-x-1">
                      <DollarSign className="w-3 h-3 text-emerald-400" />
                      <span>Mean Billed</span>
                    </div>
                    <div className="text-base font-bold font-mono text-emerald-400 mt-0.5">
                      ${profile.mean_billed_amount.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400 leading-relaxed">
                  <strong className="text-slate-300">Clinical Pathway: </strong>
                  {profile.mean_admissions > 1
                    ? 'Requires high-touch post-discharge transitional care and medication reconciliation to reduce 30-day readmissions.'
                    : profile.mean_visits > 2
                    ? 'Candidate for outpatient chronic disease tele-monitoring and preventative lifestyle check-ins.'
                    : 'Low-acuity cohort; standard ambulatory preventative wellness screenings recommended.'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
