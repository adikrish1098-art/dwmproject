import React, { useState, useEffect } from 'react';
import {
  Layers,
  Database,
  ArrowRight,
  Filter,
  SlidersHorizontal,
  Table as TableIcon,
  CheckCircle,
} from 'lucide-react';
import { OlapSchemaData, OlapCubeData } from '../types';
import { api } from '../services/api';

interface OlapTabProps {
  schemaData: OlapSchemaData | null;
}

export const OlapTab: React.FC<OlapTabProps> = ({ schemaData }) => {
  const [granularity, setGranularity] = useState<'year' | 'quarter' | 'month'>('quarter');
  const [metric, setMetric] = useState<'admissions' | 'revenue' | 'readmissions' | 'avg_los'>('admissions');
  const [department, setDepartment] = useState<string>('All');
  const [ageGroup, setAgeGroup] = useState<string>('All');
  const [selectedTable, setSelectedTable] = useState<string>('fact_admission');
  const [cubeData, setCubeData] = useState<OlapCubeData | null>(null);
  const [cubeLoading, setCubeLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    setCubeLoading(true);
    api.getOlapCube(granularity, metric, department, ageGroup)
      .then((res) => {
        if (active) {
          setCubeData(res);
          setCubeLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error fetching OLAP cube:', err);
        if (active) setCubeLoading(false);
      });
    return () => { active = false; };
  }, [granularity, metric, department, ageGroup]);

  const departmentsList = [
    'All', 'Cardiology', 'Endocrinology', 'Gastroenterology', 'General Medicine',
    'Neurology', 'Oncology', 'Orthopedics', 'Pulmonology'
  ];

  const ageGroupsList = [
    'All', '0-18 (Pediatric)', '19-35 (Young Adult)', '36-50 (Adult)', '51-65 (Middle Aged)', '65+ (Senior/Geriatric)'
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 glass-panel-glow border border-cyan-500/30">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-gradient-to-br from-cyan-500/10 via-indigo-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
              <Layers className="w-3.5 h-3.5" />
              <span>Multidimensional Data Warehouse Architecture</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              Star Schema & OLAP Cube Explorer
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl">
              Perform interactive Roll-up, Drill-down, Slicing, Dicing, and Pivoting across Kimball star schema dimensions (Date, Patient, Doctor, Department, Diagnosis).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
              Surrogate Keys Enabled
            </span>
            <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-cyan-950/40 text-cyan-300 border border-cyan-500/30">
              SCD Type 1
            </span>
          </div>
        </div>
      </div>

      {/* Star Schema Interactive Topology Diagram */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Database className="w-5 h-5 text-cyan-400" />
              <span>Interactive Star Schema Entity Relational Visualizer</span>
            </h2>
            <p className="text-xs text-slate-400">Click any dimension or fact table to inspect attributes, surrogate keys, and measures</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400">Selected Node:</span>
            <span className="text-xs font-mono font-bold text-cyan-400 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800">
              {selectedTable}
            </span>
          </div>
        </div>

        {/* Visual Topology Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80">
          
          {/* Fact Tables Column */}
          <div className="space-y-3">
            <div className="text-xs font-mono uppercase font-bold text-emerald-400 tracking-wider flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Central Fact Tables</span>
            </div>
            {schemaData?.fact_tables.map((fact) => (
              <div
                key={fact.table_name}
                onClick={() => setSelectedTable(fact.table_name)}
                className={`p-3.5 rounded-xl cursor-pointer transition-all border ${
                  selectedTable === fact.table_name
                    ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-glow-emerald'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold font-mono text-emerald-300">{fact.table_name}</div>
                <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{fact.grain}</div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {fact.measures.slice(0, 2).map((m, i) => (
                    <span key={i} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Dimension Tables Columns (3 cols) */}
          <div className="md:col-span-3 space-y-3">
            <div className="text-xs font-mono uppercase font-bold text-cyan-400 tracking-wider flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>Surrounding Dimension Tables (SCD 1)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {schemaData?.dimension_tables.map((dim) => (
                <div
                  key={dim.table_name}
                  onClick={() => setSelectedTable(dim.table_name)}
                  className={`p-3.5 rounded-xl cursor-pointer transition-all border ${
                    selectedTable === dim.table_name
                      ? 'bg-cyan-950/40 border-cyan-500 text-white shadow-glow-cyan'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold font-mono text-cyan-300">{dim.table_name}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">PK: {dim.primary_key}</div>
                  <div className="text-[10px] text-slate-400 mt-1 line-clamp-1">Hierarchy: {dim.hierarchy}</div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {dim.fields.slice(0, 3).map((f, i) => (
                      <span key={i} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Selected Table Metadata Drawer */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 text-xs space-y-2">
          <div className="flex items-center space-x-2 text-white font-bold">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Table Inspector: <span className="font-mono text-emerald-300">{selectedTable}</span></span>
          </div>
          <p className="text-slate-300">
            {selectedTable.startsWith('fact_')
              ? `Grain: Atomic transaction level with surrogate keys linking to all dimension tables. Computes duration, readmission, and revenue measures.`
              : `Dimension level storing non-volatile analytical attributes for aggregation, slicing, and hierarchical roll-ups.`}
          </p>
        </div>

      </div>

      {/* Multidimensional OLAP Cube Slicing & Dicing Controls */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <SlidersHorizontal className="w-5 h-5 text-emerald-400" />
              <span>OLAP Cube Slicing, Dicing & Cross-Tabulation Matrix</span>
            </h2>
            <p className="text-xs text-slate-400">Dynamically aggregate facts across temporal and organizational dimensions</p>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          
          {/* Granularity (Roll-up / Drill-down) */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center space-x-1">
              <span>Time Granularity</span>
              <span className="text-[10px] text-cyan-400 font-mono">(Roll-up / Drill-down)</span>
            </label>
            <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {(['year', 'quarter', 'month'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setGranularity(g)}
                  className={`py-1 text-xs font-mono font-medium rounded-lg capitalize transition-colors ${
                    granularity === g ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Metric Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center space-x-1">
              <span>Measure Metric</span>
              <span className="text-[10px] text-emerald-400 font-mono">(Aggregation)</span>
            </label>
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value as any)}
              className="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono"
            >
              <option value="admissions">Inpatient Admissions</option>
              <option value="revenue">Billed Revenue ($)</option>
              <option value="readmissions">30D Readmissions</option>
              <option value="avg_los">Average Stay (ALOS Days)</option>
            </select>
          </div>

          {/* Slicing by Department */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center space-x-1">
              <Filter className="w-3 h-3 text-slate-400" />
              <span>Slice: Department</span>
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono"
            >
              {departmentsList.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Dicing by Age Group */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center space-x-1">
              <Filter className="w-3 h-3 text-slate-400" />
              <span>Dice: Age Group</span>
            </label>
            <select
              value={ageGroup}
              onChange={(e) => setAgeGroup(e.target.value)}
              className="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono"
            >
              {ageGroupsList.map((ag) => (
                <option key={ag} value={ag}>{ag}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Pivot Matrix Display */}
        {cubeLoading ? (
          <div className="h-64 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin" />
            <p className="text-xs font-mono text-slate-400">Computing OLAP multi-dimensional cross-tabulation...</p>
          </div>
        ) : cubeData && cubeData.pivot_data.length > 0 ? (
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase">
                    <th className="py-3 px-4">Time Slice</th>
                    {cubeData.departments.map((dept) => (
                      <th key={dept} className="py-3 px-3 text-right">{dept}</th>
                    ))}
                    <th className="py-3 px-4 text-right text-emerald-400">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {cubeData.pivot_data.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-white flex items-center space-x-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        <span>{row.time_slice}</span>
                      </td>
                      {cubeData.departments.map((dept) => {
                        const val = row[dept] || 0;
                        return (
                          <td key={dept} className="py-3 px-3 text-right">
                            <span className={`px-2 py-0.5 rounded ${
                              val > 0 ? 'bg-cyan-500/10 text-cyan-200' : 'text-slate-600'
                            }`}>
                              {metric === 'revenue' ? `$${Number(val).toLocaleString()}` : val}
                            </span>
                          </td>
                        );
                      })}
                      <td className="py-3 px-4 text-right font-bold text-emerald-300">
                        {metric === 'revenue' ? `$${Number(row.total).toLocaleString()}` : row.total}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center space-x-2">
                <TableIcon className="w-4 h-4 text-emerald-400" />
                <span>Showing {cubeData.pivot_data.length} time slices across {cubeData.departments.length} departments</span>
              </div>
              <div className="font-mono text-emerald-400">
                Live Kimball Star Schema Query
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400">
            No records match the current multi-dimensional filter combination.
          </div>
        )}

      </div>

      {/* The 5 Kimball OLAP Core Concepts Guide */}
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <ArrowRight className="w-4 h-4 text-emerald-400" />
          <span>Kimball Data Warehousing Dimensional Operations Guide</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {schemaData?.olap_operations.map((op, i) => (
            <div key={i} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
              <div className="text-xs font-bold font-mono text-emerald-300">{op.operation}</div>
              <p className="text-[11px] text-slate-400 leading-relaxed">{op.description}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
