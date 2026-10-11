import React, { useState } from 'react';
import {
  GitBranch,
  Play,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { EtlStatusData } from '../types';
import { api } from '../services/api';

interface EtlTabProps {
  statusData: EtlStatusData | null;
  onRefresh: () => void;
}

export const EtlTab: React.FC<EtlTabProps> = ({ statusData, onRefresh }) => {
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [runResult, setRunResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleTriggerEtl = async () => {
    setIsRunning(true);
    setErrorMsg(null);
    setRunResult(null);
    try {
      const res = await api.runEtl();
      setRunResult(res);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'ETL execution failed');
    } finally {
      setIsRunning(false);
    }
  };

  const stages = [
    {
      num: 1,
      title: 'Extract (OLTP)',
      desc: 'Capture CDC records from operational encounters, admissions, and billing tables.',
      tech: 'SQLite Foreign Key Checked',
    },
    {
      num: 2,
      title: 'Cleanse & Validate',
      desc: 'Verify referential integrity, coalesce null values, enforce date range boundaries.',
      tech: 'Data Quality Engine',
    },
    {
      num: 3,
      title: 'Transform & SCD',
      desc: 'Map SCD Type 1 dimensions, compute YYYYMMDD date keys, generate surrogate keys.',
      tech: 'Kimball Dimensional Model',
    },
    {
      num: 4,
      title: 'Load (Star Schema)',
      desc: 'Bulk atomic insert into DimDate, DimPatient, DimDoctor, and Fact tables.',
      tech: 'Analytical Warehouse Engine',
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 glass-panel-glow border border-emerald-500/30">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              <GitBranch className="w-3.5 h-3.5" />
              <span>Automated Data Pipeline Engine</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              Hospital ETL Control Center & Warehouse Sync
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl">
              Extract, transform, and load clinical transactions from the OLTP Operational Store into Kimball Star Schema analytical dimension and fact tables.
            </p>
          </div>

          <div>
            <button
              onClick={handleTriggerEtl}
              disabled={isRunning}
              className={`flex items-center space-x-2.5 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all duration-300 shadow-lg ${
                isRunning
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-glow-emerald hover:scale-105 active:scale-95'
              }`}
            >
              {isRunning ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin text-emerald-400" />
                  <span>Executing Pipeline...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Trigger Full ETL Sync</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Execution Feedback Banner */}
      {runResult && (
        <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-white">ETL Pipeline Completed Successfully!</div>
              <div className="text-xs text-emerald-400 font-mono">
                Duration: {runResult.execution_duration_seconds}s • Status: {runResult.status}
              </div>
            </div>
          </div>
          <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30">
            Star Schema Refreshed
          </span>
        </div>
      )}

      {errorMsg && (
        <div className="p-5 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-300 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-rose-400" />
          <span className="text-xs font-mono">{errorMsg}</span>
        </div>
      )}

      {/* Visual Pipeline Flowchart */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <span>ETL Data Pipeline Flowchart</span>
            </h2>
            <p className="text-xs text-slate-400">Sequential transformation lifecycle from Operational database to Star Schema warehouse</p>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
            Automated Architecture
          </span>
        </div>

        {/* 4 Pipeline Stages Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          {stages.map((stage, idx) => (
            <div
              key={stage.num}
              className="relative p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-emerald-500/40 transition-all space-y-3 group"
            >
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-mono font-bold text-xs">
                  0{stage.num}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                  {stage.tech}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                {stage.title}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {stage.desc}
              </p>
              {idx < 3 && (
                <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-slate-950 border border-slate-800 items-center justify-center text-slate-500">
                  <ArrowRight className="w-3 h-3 text-emerald-400" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Historical Job Execution Log Table */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Clock className="w-5 h-5 text-cyan-400" />
              <span>ETL Job Execution Audit Log (Warehouse Table: etl_jobs)</span>
            </h2>
            <p className="text-xs text-slate-400">Chronological history of incremental extraction runs, record counts and latency</p>
          </div>
          <button
            onClick={onRefresh}
            className="flex items-center space-x-1.5 text-xs font-mono text-slate-400 hover:text-white px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase">
                <th className="py-3 px-4">Job ID</th>
                <th className="py-3 px-4">Pipeline Name</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Start Time</th>
                <th className="py-3 px-4">End Time</th>
                <th className="py-3 px-4 text-right">Extracted</th>
                <th className="py-3 px-4 text-right">Loaded</th>
                <th className="py-3 px-4 text-right">Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {statusData?.history && statusData.history.length > 0 ? (
                statusData.history.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-white">#{job.id}</td>
                    <td className="py-3 px-4 text-slate-300 font-sans font-medium">{job.job_name}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{job.status}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">{job.start_time?.slice(0, 19)}</td>
                    <td className="py-3 px-4 text-slate-400">{job.end_time?.slice(0, 19)}</td>
                    <td className="py-3 px-4 text-right text-cyan-300 font-bold">{job.records_extracted.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-emerald-300 font-bold">{job.records_loaded.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-amber-300">{job.execution_seconds ?? '0.12'}s</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-500">
                    No ETL jobs recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
