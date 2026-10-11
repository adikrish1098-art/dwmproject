import React from 'react';
import { Network } from 'lucide-react';
import { ClusteringTab } from '../components/ClusteringTab';

export const ClusteringPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Network className="w-6 h-6 text-emerald-500" />
          Patient Clustering (K-Means & PCA Projection)
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Unsupervised patient segmentation based on historical utilization, length of stay, and hospital billing.
        </p>
      </div>

      <ClusteringTab />
    </div>
  );
};
