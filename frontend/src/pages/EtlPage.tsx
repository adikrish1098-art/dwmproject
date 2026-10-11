import React from 'react';
import { GitBranch } from 'lucide-react';
import { EtlTabWrapper } from '../components/EtlTabWrapper';

export const EtlPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <GitBranch className="w-6 h-6 text-teal-500" />
          ETL Pipeline Orchestration
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Automated Extraction, Cleansing, SCD Type 1 Transformation, and Atomic Loading into the Star Schema.
        </p>
      </div>

      <EtlTabWrapper />
    </div>
  );
};
