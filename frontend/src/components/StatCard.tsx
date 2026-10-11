import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  color?: 'teal' | 'blue' | 'indigo' | 'amber' | 'emerald' | 'rose';
  trend?: string;
  trendPositive?: boolean;
}

const colorStyles = {
  teal: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
  blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  indigo: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
  amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtext,
  icon: Icon,
  color = 'teal',
  trend,
  trendPositive = true,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${colorStyles[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="flex items-baseline justify-between">
        <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {value}
        </h3>
        {trend && (
          <span className={`text-[11px] font-semibold ${trendPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {trend}
          </span>
        )}
      </div>
      {subtext && (
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
          {subtext}
        </p>
      )}
    </div>
  );
};
