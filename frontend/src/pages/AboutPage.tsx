import React from 'react';
import { HelpCircle, Database, Network, Boxes, Binary, Sparkles, BookOpen } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-teal-500" />
          About Project & Data Warehouse Viva Guide
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Hospital Data Warehouse and Patient Analysis Using Data Mining Techniques — College Mini Project Documentation.
        </p>
      </div>

      {/* Overview Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Curriculum Subject: Data Warehousing & Data Mining (DWM)</span>
        </div>

        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          System Overview & Core Objectives
        </h2>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          This full-stack educational system integrates operational hospital management (OLTP) with analytical business intelligence and machine learning (OLAP/Data Mining). It illustrates how high-throughput transactional clinical databases (patients, doctors, admissions, appointments, invoices) are extracted, transformed, and loaded into an optimized <strong>Kimball Star Schema Data Warehouse</strong> to support multidimensional OLAP slicing, K-Means patient clustering, Apriori co-occurrence association mining, and 30-day readmission predictive modeling.
        </p>

        {/* Core Architectural Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-bold text-xs uppercase tracking-wide">
              <Database className="w-4 h-4" />
              <span>1. Kimball Star Schema (OLAP)</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Separated logical warehouse with <strong>DimPatient</strong>, <strong>DimDoctor</strong>, <strong>DimDepartment</strong>, <strong>DimDiagnosis</strong>, <strong>DimDate</strong>, and <strong>DimEncounter</strong> conformed dimensions surrounding granular <strong>FactAdmission</strong>, <strong>FactPatientVisit</strong>, and <strong>FactBilling</strong> tables.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wide">
              <Network className="w-4 h-4" />
              <span>2. K-Means Patient Clustering</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Unsupervised clustering using Scikit-Learn on age, length of stay, historical visits, prior admissions, and billing amounts. Features 2D PCA projection scatter plots, elbow inertia curve, and silhouette score evaluation.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wide">
              <Boxes className="w-4 h-4" />
              <span>3. Apriori Association Rule Mining</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Market basket analysis applied to clinical encounters. Mines frequent co-occurring ICD-10 diagnostic codes and treatment procedures with Support, Confidence, and Lift calculations.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wide">
              <Binary className="w-4 h-4" />
              <span>4. Readmission ML & Decision Tree</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Supervised classification predicting chronological 30-day readmissions. Benchmarks DummyClassifier baseline, Logistic Regression, Random Forest, and white-box Decision Tree with overfitting analysis.
            </p>
          </div>
        </div>
      </div>

      {/* Top Viva Questions Accordion / Preview */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <BookOpen className="w-5 h-5 text-teal-500" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Quick Viva Q&A Reference (Data Warehousing & Data Mining)
          </h3>
        </div>

        <div className="space-y-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
            <p className="font-bold text-slate-900 dark:text-white">
              Q1: What is the difference between OLTP and OLAP in this project?
            </p>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              OLTP (Online Transaction Processing) handles day-to-day operations (patient admissions, booking appointments, payments) normalized to 3NF to avoid update anomalies. OLAP (Online Analytical Processing) uses a de-normalized Star Schema to compute complex aggregation queries, roll-ups, and readmission trends without locking operational tables.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
            <p className="font-bold text-slate-900 dark:text-white">
              Q2: How does the ETL pipeline prevent duplicate records and enforce idempotency?
            </p>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              The pipeline uses source watermarking and natural surrogate key lookups. On rerun, existing records in dimensions are updated via SCD Type 1, and fact tables verify source encounter/admission IDs so re-executing ETL produces 0 duplicate rows.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
            <p className="font-bold text-slate-900 dark:text-white">
              Q3: Why is Recall prioritized over Accuracy in hospital readmission prediction?
            </p>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Because false negatives (failing to identify a patient who will be readmitted within 30 days) carries severe clinical risk and potential complications. A high-recall model minimizes false negatives so care teams can proactively intervene.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
            <p className="font-bold text-slate-900 dark:text-white">
              Q4: What is the significance of Lift &gt; 1 in Apriori Association Rules?
            </p>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Lift measures the ratio of observed co-occurrence frequency to expected independent frequency. A Lift greater than 1 indicates that the antecedent and consequent occur together significantly more often than random chance, signaling clinical co-occurrence.
            </p>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 text-center pt-2">
          For full documentation, comprehensive ER diagrams, star schema schemas, and 25+ viva questions, inspect the files in <code className="font-mono text-teal-400">documentation/</code>.
        </p>
      </div>
    </div>
  );
};
