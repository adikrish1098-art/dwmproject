import React, { useState, useEffect } from 'react';
import { Boxes, Play, Download, Sliders, Info } from 'lucide-react';
import { api } from '../services/api';
import { AprioriData } from '../types';

export const AssociationRulesPage: React.FC = () => {
  const [minSupport, setMinSupport] = useState<number>(0.02);
  const [minConfidence, setMinConfidence] = useState<number>(0.20);
  const [minLift, setMinLift] = useState<number>(1.2);

  const [data, setData] = useState<AprioriData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [sortBy, setSortBy] = useState<'lift' | 'confidence' | 'support'>('lift');

  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await api.getApriori(minSupport, minConfidence, minLift);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const sortedRules = [...(data?.rules || [])].sort((a, b) => b[sortBy] - a[sortBy]);

  const handleExportCsv = () => {
    if (!data?.rules || data.rules.length === 0) return;
    const headers = 'Antecedent,Consequent,Support,Confidence,Lift,Supporting_Encounters\n';
    const rows = data.rules
      .map(
        (r) =>
          `"${r.antecedent}","${r.consequent}",${r.support},${r.confidence},${r.lift},${r.supporting_encounters}`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'apriori_association_rules.csv';
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Boxes className="w-6 h-6 text-amber-500" />
            Apriori Association Rule Mining
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Mining frequent clinical itemsets and co-occurrence patterns across hospital encounters.
          </p>
        </div>

        {data?.rules && data.rules.length > 0 && (
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Rules CSV</span>
          </button>
        )}
      </div>

      {/* Threshold Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Sliders className="w-4 h-4 text-amber-500" />
          Apriori Mining Hyperparameters
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Min Support */}
          <div>
            <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              <span>Minimum Support:</span>
              <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{(minSupport * 100).toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min="0.005"
              max="0.10"
              step="0.005"
              value={minSupport}
              onChange={(e) => setMinSupport(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <p className="text-[10px] text-slate-400 mt-1">Fraction of all transactions containing both items.</p>
          </div>

          {/* Min Confidence */}
          <div>
            <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              <span>Minimum Confidence:</span>
              <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{(minConfidence * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.10"
              max="0.80"
              step="0.05"
              value={minConfidence}
              onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <p className="text-[10px] text-slate-400 mt-1">Probability of consequent given antecedent.</p>
          </div>

          {/* Min Lift */}
          <div>
            <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              <span>Minimum Lift:</span>
              <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{minLift.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="5.0"
              step="0.1"
              value={minLift}
              onChange={(e) => setMinLift(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <p className="text-[10px] text-slate-400 mt-1">Lift &gt; 1.0 indicates positive association above random chance.</p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={fetchRules}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all"
          >
            <Play className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Mining Frequent Itemsets...' : 'Run Apriori Mining'}</span>
          </button>
        </div>
      </div>

      {/* Educational Notice */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-3">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Statistical Co-occurrence Disclaimer:</strong> Association rules identify empirical item co-occurrence within synthetic hospital encounters (e.g., Hypertension co-occurring with Type 2 Diabetes or ECG diagnostics). They demonstrate market basket analysis principles and do not imply medical causation or direct clinical treatment guidelines.
        </div>
      </div>

      {/* Rules Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden space-y-3">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900 dark:text-white">
            Discovered Clinical Rules ({data?.rules?.length || 0})
          </span>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
            >
              <option value="lift">Lift (Descending)</option>
              <option value="confidence">Confidence (Descending)</option>
              <option value="support">Support (Descending)</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : sortedRules.length === 0 ? (
          <div className="text-center py-16">
            <Boxes className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No rules satisfy current thresholds</p>
            <p className="text-xs text-slate-400 mt-1">Try lowering the minimum support or minimum confidence slider.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Antecedent (If Patient Has)</th>
                  <th className="py-3 px-4">Consequent (Then Also Has)</th>
                  <th className="py-3 px-4 text-center">Support</th>
                  <th className="py-3 px-4 text-center">Confidence</th>
                  <th className="py-3 px-4 text-center">Lift Ratio</th>
                  <th className="py-3 px-4 text-center">Encounters</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sortedRules.map((rule, idx) => (
                  <tr key={rule.id || idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-400">{idx + 1}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        {rule.antecedent}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-amber-600 dark:text-amber-400">
                      <span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                        {rule.consequent}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-600 dark:text-slate-300">
                      {(rule.support * 100).toFixed(2)}%
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-teal-600 dark:text-teal-400">
                      {(rule.confidence * 100).toFixed(1)}%
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-amber-600 dark:text-amber-400">
                      {rule.lift.toFixed(2)}x
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-500 dark:text-slate-400">
                      {rule.supporting_encounters}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
