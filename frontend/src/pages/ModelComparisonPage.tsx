import React, { useState, useEffect } from 'react';
import { Layers, RefreshCw, Info } from 'lucide-react';
import { api } from '../services/api';
import { ModelComparisonResponse } from '../types';

export const ModelComparisonPage: React.FC = () => {
  const [data, setData] = useState<ModelComparisonResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchComparison = async () => {
    setLoading(true);
    try {
      const res = await api.getModelComparison();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComparison();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-indigo-500" />
            Machine Learning Model Comparison Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Comprehensive benchmarking of Dummy Baseline, Logistic Regression, Random Forest, and Decision Tree.
          </p>
        </div>

        <button
          onClick={fetchComparison}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Comparison</span>
        </button>
      </div>

      {/* Educational Guidance Banner */}
      <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-900 dark:text-indigo-300 text-xs flex items-start gap-3">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Academic & Clinical Metric Trade-Off:</strong> In 30-day hospital readmission prediction, optimizing for Recall (sensitivity) is prioritized over Accuracy alone. A false negative (missing a vulnerable discharging patient) carries a higher clinical cost than a false positive (providing unnecessary post-discharge follow-up). The Random Forest model demonstrates the highest ROC-AUC and balanced F1-score across our synthetic dataset.
        </div>
      </div>

      {/* Benchmark Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Model Evaluation Benchmarks Matrix
          </h3>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Model Architecture</th>
                  <th className="py-3 px-4">Paradigm</th>
                  <th className="py-3 px-4 text-center">Accuracy</th>
                  <th className="py-3 px-4 text-center">Precision</th>
                  <th className="py-3 px-4 text-center">Recall (Sensitivity)</th>
                  <th className="py-3 px-4 text-center">F1-Score</th>
                  <th className="py-3 px-4 text-center">ROC-AUC</th>
                  <th className="py-3 px-4 text-center">Confusion Matrix (TN/FP/FN/TP)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(data?.comparison_table || []).map((m) => {
                  const isTop = m.model_key === 'random_forest';
                  return (
                    <tr
                      key={m.model_key}
                      className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors ${
                        isTop ? 'bg-indigo-500/5 dark:bg-indigo-500/10' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {m.name}
                        {isTop && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/20 text-indigo-400 uppercase">
                            Recommended
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">{m.type}</td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                        {(m.accuracy * 100).toFixed(1)}%
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-cyan-600 dark:text-cyan-400">
                        {(m.precision * 100).toFixed(1)}%
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {(m.recall * 100).toFixed(1)}%
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-teal-600 dark:text-teal-400">
                        {m.f1_score.toFixed(3)}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-extrabold text-indigo-600 dark:text-indigo-400">
                        {m.roc_auc.toFixed(3)}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-[11px] text-slate-600 dark:text-slate-300">
                        {m.confusion_matrix.tn} / {m.confusion_matrix.fp} / {m.confusion_matrix.fn} / {m.confusion_matrix.tp}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Feature Importance Comparison */}
      {data?.feature_importances && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Primary Predictive Determinants Across Evaluated Models
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.feature_importances.map((f) => (
              <div key={f.feature} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{f.feature}</span>
                  <span className="font-mono text-indigo-500 font-bold">{(f.importance * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${f.importance * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
