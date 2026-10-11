import React, { useState, useEffect } from 'react';
import { Binary, Play, GitFork } from 'lucide-react';
import { api } from '../services/api';
import { DecisionTreeData } from '../types';

export const DecisionTreePage: React.FC = () => {
  const [maxDepth, setMaxDepth] = useState<number>(4);
  const [criterion, setCriterion] = useState<string>('gini');
  const [minSplit, setMinSplit] = useState<number>(10);
  const [minLeaf, setMinLeaf] = useState<number>(5);

  const [data, setData] = useState<DecisionTreeData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [training, setTraining] = useState<boolean>(false);

  const fetchTree = async () => {
    setLoading(true);
    try {
      const res = await api.getDecisionTree(maxDepth, criterion);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTree();
  }, []);

  const handleTrain = async () => {
    setTraining(true);
    try {
      const res = await api.trainDecisionTree({
        max_depth: maxDepth,
        criterion,
        min_samples_split: minSplit,
        min_samples_leaf: minLeaf,
      });
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setTraining(false);
    }
  };

  const metrics = data?.metrics;
  const overfitting = data?.overfitting_analysis;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Binary className="w-6 h-6 text-emerald-500" />
            Interpretable Decision Tree Classifier
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            White-box classification tree predicting 30-day readmissions with human-readable decision logic.
          </p>
        </div>

        <button
          onClick={handleTrain}
          disabled={training}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all"
        >
          <Play className={`w-3.5 h-3.5 ${training ? 'animate-spin' : ''}`} />
          <span>{training ? 'Re-building Tree...' : 'Train Decision Tree'}</span>
        </button>
      </div>

      {/* Hyperparameters Controls Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <GitFork className="w-4 h-4 text-emerald-500" />
          Tree Pruning & Splitting Controls
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Max Depth ({maxDepth})</label>
            <input
              type="range"
              min="2"
              max="7"
              value={maxDepth}
              onChange={(e) => setMaxDepth(parseInt(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-400">Restricts tree height to prevent overfitting</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Impurity Criterion</label>
            <select
              value={criterion}
              onChange={(e) => setCriterion(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
            >
              <option value="gini">Gini Impurity</option>
              <option value="entropy">Information Gain (Entropy)</option>
            </select>
            <span className="text-[10px] text-slate-400">Mathematical split objective</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Min Samples Split ({minSplit})</label>
            <input
              type="range"
              min="2"
              max="30"
              value={minSplit}
              onChange={(e) => setMinSplit(parseInt(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-400">Min samples required to split a node</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Min Samples Leaf ({minLeaf})</label>
            <input
              type="range"
              min="1"
              max="20"
              value={minLeaf}
              onChange={(e) => setMinLeaf(parseInt(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-400">Min samples required at leaf terminal node</span>
          </div>
        </div>
      </div>

      {/* Metrics & Overfitting Analysis */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm text-center">
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Test Accuracy</span>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {metrics ? (metrics.test_accuracy * 100).toFixed(1) : 0}%
            </p>
            <span className="text-[10px] text-slate-400">Holdout evaluation</span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm text-center">
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Test Recall</span>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {metrics ? (metrics.test_recall * 100).toFixed(1) : 0}%
            </p>
            <span className="text-[10px] text-slate-400">Sensitivity (caught readmissions)</span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm text-center">
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Test ROC-AUC</span>
            <p className="text-xl font-bold text-teal-600 dark:text-teal-400 mt-1">
              {metrics ? metrics.test_roc_auc.toFixed(3) : 0}
            </p>
            <span className="text-[10px] text-slate-400">Area under ROC curve</span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm text-center">
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Overfitting Gap</span>
            <p className="text-xl font-bold text-indigo-500 mt-1">
              {overfitting ? `${overfitting.accuracy_gap.toFixed(1)}%` : '0%'}
            </p>
            <span className="text-[10px] text-slate-400">{overfitting?.verdict || 'Well Regularized'}</span>
          </div>
        </div>
      )}

      {/* Decision Tree Paths & Rules Text Box */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <GitFork className="w-4 h-4 text-emerald-500" />
            Decision Tree Rules & Hierarchical Path Visualizer
          </h3>
          <span className="text-xs text-slate-400 font-mono">depth={maxDepth} • crit={criterion}</span>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Traceable IF-THEN clinical rules generated directly by Scikit-Learn tree export:
        </p>

        <div className="bg-slate-950 text-emerald-400 p-4 rounded-xl font-mono text-[11px] overflow-x-auto border border-slate-800 leading-relaxed max-h-96">
          <pre>{data?.tree_rules_text || 'Loading decision tree rules...'}</pre>
        </div>
      </div>

      {/* Feature Importance List */}
      {data?.feature_importances && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Feature Importances (Tree Splitting Weight)
          </h3>
          <div className="space-y-2.5">
            {data.feature_importances.slice(0, 6).map((f) => (
              <div key={f.feature} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-700 dark:text-slate-300">{f.feature}</span>
                  <span className="font-mono text-emerald-500 font-semibold">{(f.importance * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${f.importance * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed pt-2 border-t border-slate-100 dark:border-slate-800">
            <strong>Viva Note:</strong> While features such as length of stay and prior admissions rank high in Gini importance, this indicates statistical correlation for risk stratification rather than causal clinical mechanisms.
          </p>
        </div>
      )}
    </div>
  );
};
