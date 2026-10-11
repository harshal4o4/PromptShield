import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { EvaluationResult, DatasetSummary } from '../types/api';

export const EvaluationLab: React.FC = () => {
  const [dataset, setDataset] = useState<DatasetSummary | null>(null);
  const [latestEval, setLatestEval] = useState<EvaluationResult | null>(null);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [ds, ev] = await Promise.all([
        api.getEvaluationDataset(),
        api.getLatestEvaluation()
      ]);
      setDataset(ds);
      setLatestEval(ev);
    } catch (err: any) {
      setError(err.message || 'Failed to load evaluation data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRunEvaluation = async () => {
    try {
      setRunning(true);
      setError(null);
      const res = await api.runEvaluation();
      setLatestEval(res);
    } catch (err: any) {
      setError(err.message || 'Failed to run benchmark evaluation');
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-8 h-8 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm font-mono text-slate-500">Loading benchmark evaluation data...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      {/* Header & Benchmark Run Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Evaluation Lab</h1>
          <p className="text-sm text-slate-600 mt-1">
            Empirical benchmark evaluation of PromptShield detection accuracy against labelled ground-truth datasets.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRunEvaluation}
            disabled={running}
            className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold rounded-lg text-sm shadow-xs transition"
          >
            {running ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Evaluating Dataset...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                <span>Run Evaluation Benchmark</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm font-mono text-red-700">
          Error: {error}
        </div>
      )}

      {/* Dataset Summary Banner */}
      {dataset && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4 text-xs font-mono shadow-xs">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-cyan-50 text-cyan-700 border border-cyan-200 material-symbols-outlined text-[18px]">
              dataset
            </span>
            <div>
              <span className="text-slate-500 block text-[10px] font-semibold uppercase">Dataset Version</span>
              <span className="text-slate-900 font-bold">{dataset.version}</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div>
              <span className="text-slate-500 block text-[10px] font-semibold uppercase">Total Test Samples</span>
              <span className="text-slate-900 font-bold">{dataset.total_samples}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] font-semibold uppercase">Malicious Attacks</span>
              <span className="text-rose-600 font-bold">{dataset.malicious_count}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] font-semibold uppercase">Benign Hard Negatives</span>
              <span className="text-emerald-600 font-bold">{dataset.benign_count}</span>
            </div>
          </div>
        </div>
      )}

      {/* Primary Visible Metrics */}
      {!latestEval ? (
        <div className="p-12 bg-white border border-slate-200 rounded-xl text-center flex flex-col items-center shadow-xs">
          <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">not_started</span>
          <h3 className="text-base font-semibold text-slate-800">No Evaluation Performed Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
            Run the benchmark evaluation above to calculate empirical precision, recall, and F1 scores against the labelled test set.
          </p>
          <button
            onClick={handleRunEvaluation}
            disabled={running}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg text-xs"
          >
            Start Initial Run
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Top 3 Primary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {/* Precision */}
            <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs hover:border-cyan-400 transition">
              <span className="text-xs font-mono uppercase font-semibold tracking-wider text-slate-500 block mb-2">
                Precision
              </span>
              <div className="text-3xl font-bold font-mono text-cyan-700">
                {(latestEval.precision * 100).toFixed(1)}%
              </div>
              <p className="text-[11px] font-mono text-slate-500 mt-2">
                True Positives / (TP + FP)
              </p>
            </div>

            {/* Recall */}
            <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs hover:border-emerald-400 transition">
              <span className="text-xs font-mono uppercase font-semibold tracking-wider text-slate-500 block mb-2">
                Recall
              </span>
              <div className="text-3xl font-bold font-mono text-emerald-700">
                {(latestEval.recall * 100).toFixed(1)}%
              </div>
              <p className="text-[11px] font-mono text-slate-500 mt-2">
                True Positives / (TP + FN)
              </p>
            </div>

            {/* F1 Score */}
            <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs hover:border-purple-400 transition">
              <span className="text-xs font-mono uppercase font-semibold tracking-wider text-slate-500 block mb-2">
                F1 Score
              </span>
              <div className="text-3xl font-bold font-mono text-purple-700">
                {(latestEval.f1_score * 100).toFixed(1)}%
              </div>
              <p className="text-[11px] font-mono text-slate-500 mt-2">
                Harmonic Mean of Precision & Recall
              </p>
            </div>

            {/* False Positive Rate */}
            <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs hover:border-slate-400 transition">
              <span className="text-xs font-mono uppercase font-semibold tracking-wider text-slate-500 block mb-2">
                False Positive Rate
              </span>
              <div className="text-3xl font-bold font-mono text-slate-800">
                {(latestEval.false_positive_rate * 100).toFixed(1)}%
              </div>
              <p className="text-[11px] font-mono text-slate-500 mt-2">
                FP / (FP + TN)
              </p>
            </div>
          </div>

          {/* Detailed Results Expandable Section */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50 transition border-b border-slate-200"
            >
              <div className="flex items-center gap-3">
                <span className={`material-symbols-outlined text-[20px] transition-transform ${showDetails ? 'rotate-90 text-cyan-600' : 'text-slate-400'}`}>
                  chevron_right
                </span>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Detailed Benchmark Results</h3>
                  <span className="text-xs font-mono text-slate-500">
                    Confusion Matrix, Category-level Breakdowns, and Failure Case Audits
                  </span>
                </div>
              </div>
              <span className="text-xs font-mono text-slate-500">
                Evaluated: {new Date(latestEval.run_at).toLocaleString()}
              </span>
            </button>

            {showDetails && (
              <div className="p-6 flex flex-col gap-8 bg-slate-50/50">
                {/* Confusion Matrix */}
                <div>
                  <h4 className="text-xs font-mono uppercase font-semibold tracking-wider text-slate-600 mb-3">
                    2x2 Confusion Matrix
                  </h4>
                  <div className="grid grid-cols-2 max-w-md gap-3 font-mono text-center text-xs">
                    <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                      <span className="text-emerald-800 block text-[10px] font-semibold uppercase">True Positives (TP)</span>
                      <span className="text-2xl font-bold text-emerald-700">{latestEval.confusion_matrix.true_positives}</span>
                    </div>
                    <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                      <span className="text-red-800 block text-[10px] font-semibold uppercase">False Positives (FP)</span>
                      <span className="text-2xl font-bold text-red-700">{latestEval.confusion_matrix.false_positives}</span>
                    </div>
                    <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                      <span className="text-amber-800 block text-[10px] font-semibold uppercase">False Negatives (FN)</span>
                      <span className="text-2xl font-bold text-amber-700">{latestEval.confusion_matrix.false_negatives}</span>
                    </div>
                    <div className="p-4 rounded-lg bg-slate-100 border border-slate-200">
                      <span className="text-slate-700 block text-[10px] font-semibold uppercase">True Negatives (TN)</span>
                      <span className="text-2xl font-bold text-slate-800">{latestEval.confusion_matrix.true_negatives}</span>
                    </div>
                  </div>
                </div>

                {/* Per-Category Table */}
                <div>
                  <h4 className="text-xs font-mono uppercase font-semibold tracking-wider text-slate-600 mb-3">
                    Per-Category Performance
                  </h4>
                  <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white shadow-xs">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-4 font-semibold">Category</th>
                          <th className="py-2.5 px-4 text-center font-semibold">Samples</th>
                          <th className="py-2.5 px-4 text-center font-semibold">Precision</th>
                          <th className="py-2.5 px-4 text-center font-semibold">Recall</th>
                          <th className="py-2.5 px-4 text-center font-semibold">F1 Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {Object.values(latestEval.category_metrics).map((cat) => (
                          <tr key={cat.category} className="hover:bg-slate-50">
                            <td className="py-2.5 px-4 font-bold text-slate-900">{cat.category}</td>
                            <td className="py-2.5 px-4 text-center text-slate-600 font-medium">{cat.total}</td>
                            <td className="py-2.5 px-4 text-center text-cyan-700 font-bold">{(cat.precision * 100).toFixed(0)}%</td>
                            <td className="py-2.5 px-4 text-center text-emerald-700 font-bold">{(cat.recall * 100).toFixed(0)}%</td>
                            <td className="py-2.5 px-4 text-center text-purple-700 font-bold">{(cat.f1_score * 100).toFixed(0)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Failure Cases */}
                <div>
                  <h4 className="text-xs font-mono uppercase font-semibold tracking-wider text-slate-600 mb-3">
                    Failure Cases Audit ({latestEval.failure_cases.length})
                  </h4>
                  {latestEval.failure_cases.length === 0 ? (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-mono text-emerald-800">
                      Zero misclassifications detected on this benchmark dataset! (100% agreement with ground-truth).
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {latestEval.failure_cases.map((fc) => (
                        <div key={fc.id} className="p-3 bg-white rounded-lg border border-slate-200 text-xs font-mono flex flex-col gap-1 shadow-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{fc.id}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${fc.failure_type === 'false_positive' ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                              {fc.failure_type.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-slate-600 text-[11px] truncate">{fc.text_excerpt}</p>
                          <span className="text-slate-500 text-[11px]">{fc.rationale}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
