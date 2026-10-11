import React, { useState, useEffect } from 'react';
import { Cpu, Play, Sparkles, HelpCircle, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { api } from '../services/api';
import { ReadmissionModelsData, PredictionResult } from '../types';

export const PredictionPage: React.FC = () => {
  const [modelsData, setModelsData] = useState<ReadmissionModelsData | null>(null);
  const [loadingModels, setLoadingModels] = useState<boolean>(true);
  const [training, setTraining] = useState<boolean>(false);

  // Live Prediction Form State
  const [patientInput, setPatientInput] = useState({
    age: 72,
    sex: 'Female',
    department_id: 'DEP-CAR',
    admission_type: 'Emergency',
    diagnosis_category: 'Heart Failure',
    length_of_stay: 8,
    prior_admissions: 2,
    prior_visits: 4,
  });

  const [predicting, setPredicting] = useState<boolean>(false);
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  const [predictError, setPredictError] = useState<string | null>(null);

  const fetchModels = async () => {
    setLoadingModels(true);
    try {
      const res = await api.getReadmissionModels();
      setModelsData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingModels(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const handleRetrain = async () => {
    setTraining(true);
    try {
      const res = await api.trainReadmissionModels();
      setModelsData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setTraining(false);
    }
  };

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setPredicting(true);
    setPredictError(null);
    try {
      const res = await api.predictReadmission(patientInput);
      setPredictionResult(res);
    } catch (err: any) {
      setPredictError(err.message || 'Inference error');
    } finally {
      setPredicting(false);
    }
  };

  // Prepare ROC curve data for charting
  const rocCurvePoints = (() => {
    if (!modelsData?.roc_curves) return [];
    const rfCurve = modelsData.roc_curves['random_forest'] || [];
    const lrCurve = modelsData.roc_curves['logistic_regression'] || [];
    const length = Math.max(rfCurve.length, lrCurve.length);
    const data = [];
    for (let i = 0; i < length; i++) {
      data.push({
        fpr: rfCurve[i]?.fpr ?? i / length,
        RandomForest_TPR: rfCurve[i]?.tpr ?? null,
        LogisticRegression_TPR: lrCurve[i]?.tpr ?? null,
        Baseline_TPR: rfCurve[i]?.fpr ?? i / length,
      });
    }
    return data;
  })();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Cpu className="w-6 h-6 text-indigo-500" />
            30-Day Hospital Readmission ML Engine
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Predictive modeling to identify patients vulnerable to readmission within 30 days of discharge.
          </p>
        </div>

        <button
          onClick={handleRetrain}
          disabled={training}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-all"
        >
          <Play className={`w-3.5 h-3.5 ${training ? 'animate-spin' : ''}`} />
          <span>{training ? 'Retraining...' : 'Retrain Pipeline'}</span>
        </button>
      </div>

      {/* Educational Notice Banner */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-3">
        <HelpCircle className="w-4 h-4 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Curriculum & Viva Notice:</strong> Readmission models are trained on chronological synthetic patient encounters. To prevent data leakage, patient identifiers are strictly split by patient group, and predictions only use features known at the discharge moment. These scores demonstrate ML classification methodology and are not clinically validated for live medical decisions.
        </div>
      </div>

      {/* Model Performance Comparison Cards */}
      {loadingModels ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : modelsData ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(modelsData.model_results).map(([key, m]) => (
            <div
              key={key}
              className={`p-5 rounded-2xl border transition-all ${
                key === 'random_forest'
                  ? 'bg-gradient-to-b from-indigo-500/10 to-transparent border-indigo-500/40 shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-900 dark:text-white">{m.model_name}</span>
                {key === 'random_forest' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 uppercase">
                    Best Model
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-center mb-4">
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Accuracy</span>
                  <p className="text-base font-bold text-slate-900 dark:text-white">{(m.accuracy * 100).toFixed(1)}%</p>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">ROC-AUC</span>
                  <p className="text-base font-bold text-indigo-600 dark:text-indigo-400">{m.roc_auc.toFixed(3)}</p>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Recall</span>
                  <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">{(m.recall * 100).toFixed(1)}%</p>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">F1-Score</span>
                  <p className="text-base font-bold text-teal-600 dark:text-teal-400">{m.f1_score.toFixed(3)}</p>
                </div>
              </div>

              {/* Mini Confusion Matrix */}
              <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 space-y-1 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/60">
                <div className="flex justify-between">
                  <span>TN (Correct Non-Readmit):</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{m.confusion_matrix.tn}</span>
                </div>
                <div className="flex justify-between">
                  <span>FP (False Alarm):</span>
                  <span className="font-bold text-amber-500">{m.confusion_matrix.fp}</span>
                </div>
                <div className="flex justify-between">
                  <span>FN (Missed Readmit):</span>
                  <span className="font-bold text-rose-500">{m.confusion_matrix.fn}</span>
                </div>
                <div className="flex justify-between">
                  <span>TP (Caught Readmit):</span>
                  <span className="font-bold text-emerald-500">{m.confusion_matrix.tp}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* Main Grid: Interactive Live Predictor & ROC Curves */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Predictor Form */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              Live Patient Readmission Risk Calculator
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Enter demonstration patient attributes at discharge to compute probabilistic risk.
            </p>
          </div>

          <form onSubmit={handlePredict} className="space-y-4">
            {predictError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{predictError}</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Age</label>
                <input
                  type="number"
                  min="0"
                  max="110"
                  value={patientInput.age}
                  onChange={(e) => setPatientInput({ ...patientInput, age: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Sex</label>
                <select
                  value={patientInput.sex}
                  onChange={(e) => setPatientInput({ ...patientInput, sex: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Department</label>
                <select
                  value={patientInput.department_id}
                  onChange={(e) => setPatientInput({ ...patientInput, department_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="DEP-CAR">Cardiology</option>
                  <option value="DEP-PUL">Pulmonology</option>
                  <option value="DEP-NEU">Neurology</option>
                  <option value="DEP-ORT">Orthopedics</option>
                  <option value="DEP-GAS">Gastroenterology</option>
                  <option value="DEP-ONC">Oncology</option>
                  <option value="DEP-END">Endocrinology</option>
                  <option value="DEP-GEN">General Medicine</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Admission Type</label>
                <select
                  value={patientInput.admission_type}
                  onChange={(e) => setPatientInput({ ...patientInput, admission_type: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Emergency">Emergency</option>
                  <option value="Elective">Elective</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Diagnosis Category</label>
              <select
                value={patientInput.diagnosis_category}
                onChange={(e) => setPatientInput({ ...patientInput, diagnosis_category: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Heart Failure">Heart Failure</option>
                <option value="Hypertension">Hypertension</option>
                <option value="COPD">COPD</option>
                <option value="Pneumonia">Pneumonia</option>
                <option value="Cerebrovascular Stroke">Cerebrovascular Stroke</option>
                <option value="Type 2 Diabetes">Type 2 Diabetes</option>
                <option value="Sepsis">Sepsis</option>
                <option value="Osteoarthritis">Osteoarthritis</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Length of Stay (days)</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={patientInput.length_of_stay}
                  onChange={(e) => setPatientInput({ ...patientInput, length_of_stay: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Prior Admissions</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={patientInput.prior_admissions}
                  onChange={(e) => setPatientInput({ ...patientInput, prior_admissions: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Prior Encounters</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={patientInput.prior_visits}
                  onChange={(e) => setPatientInput({ ...patientInput, prior_visits: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={predicting}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-all"
            >
              {predicting ? 'Calculating Risk Profile...' : 'Calculate Readmission Risk'}
            </button>
          </form>

          {/* Inference Output Card */}
          {predictionResult && (
            <div
              className={`p-4 rounded-xl border transition-all ${
                predictionResult.risk_level === 'High' || predictionResult.risk_level === 'Critical'
                  ? 'bg-rose-500/10 border-rose-500/30'
                  : predictionResult.risk_level === 'Moderate'
                  ? 'bg-amber-500/10 border-amber-500/30'
                  : 'bg-emerald-500/10 border-emerald-500/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Predicted Risk Level</span>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {predictionResult.risk_level} Risk
                  </h4>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                    {predictionResult.readmission_risk_percentage}%
                  </span>
                  <span className="block text-[10px] text-slate-400">Probability</span>
                </div>
              </div>

              {predictionResult.key_risk_factors.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Key Contributing Risk Factors:</p>
                  <ul className="text-xs text-slate-600 dark:text-slate-400 list-disc list-inside space-y-0.5">
                    {predictionResult.key_risk_factors.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Evaluation Visualizations (ROC Curve & Feature Importances) */}
        <div className="space-y-6">
          {/* ROC Curves */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Receiver Operating Characteristic (ROC) Comparison
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Random Forest vs Logistic Regression vs Random Baseline Classifier.
            </p>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rocCurvePoints}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                  <XAxis dataKey="fpr" tick={{ fontSize: 10 }} label={{ value: 'False Positive Rate', position: 'insideBottom', offset: -5, fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} label={{ value: 'True Positive Rate', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Line type="monotone" dataKey="RandomForest_TPR" stroke="#6366f1" strokeWidth={2} dot={false} name="Random Forest" />
                  <Line type="monotone" dataKey="LogisticRegression_TPR" stroke="#06b6d4" strokeWidth={1.5} dot={false} name="Logistic Regression" />
                  <Line type="monotone" dataKey="Baseline_TPR" stroke="#94a3b8" strokeDasharray="4 4" dot={false} name="Dummy Baseline" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Feature Importances List */}
          {modelsData?.feature_importances && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Top Gini Feature Importances (Random Forest)
              </h3>
              <div className="space-y-2">
                {modelsData.feature_importances.slice(0, 5).map((f) => (
                  <div key={f.feature} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{f.feature}</span>
                      <span className="font-mono text-indigo-500 font-semibold">{(f.importance * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${f.importance * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
