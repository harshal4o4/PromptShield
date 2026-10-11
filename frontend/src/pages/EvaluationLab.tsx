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
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm font-mono text-slate-400">Loading benchmark evaluation data...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      {/* Header & Benchmark Run Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100 tracking-tight">Evaluation Lab</h1>
          <p className="text-sm text-slate-400 mt-1">
            Empirical benchmark evaluation of PromptShield detection accuracy against labelled ground-truth datasets.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRunEvaluation}
            disabled={running}
            className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-semibold rounded-lg text-sm shadow-lg shadow-cyan-500/10 transition"
          >
            {running ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
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
        <div className="p-4 bg-red-950/30 border border-red-500/40 rounded-xl text-sm font-mono text-red-300">
          Error: {error}
        </div>
      )}

      {/* Dataset Summary Banner */}
      {dataset && (
        <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded bg-slate-800 text-cyan-400 border border-slate-700 material-symbols-outlined text-[18px]">
              dataset
            </span>
            <div>
              <span className="text-slate-400 block text-[10px]">Dataset Version</span>
              <span className="text-slate-200 font-bold">{dataset.version}</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div>
              <span className="text-slate-400 block text-[10px]">Total Test Samples</span>
              <span className="text-slate-200 font-bold">{dataset.total_samples}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Malicious Attacks</span>
              <span className="text-rose-400 font-bold">{dataset.malicious_count}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Benign Hard Negatives</span>
              <span className="text-emerald-400 font-bold">{dataset.benign_count}</span>
            </div>
          </div>
        </div>
      )}

      {/* Primary Visible Metrics */}
      {!latestEval ? (
        <div className="p-12 bg-[#0F172A] border border-slate-800 rounded-xl text-center flex flex-col items-center">
          <span className="material-symbols-outlined text-4xl text-slate-600 mb-2">not_started</span>
          <h3 className="text-base font-semibold text-slate-200">No Evaluation Performed Yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4">
            Run the benchmark evaluation above to calculate empirical precision, recall, and F1 scores against the labelled test set.
          </p>
          <button
            onClick={handleRunEvaluation}
            disabled={running}
            className="px-4 py-2 bg-cyan-500 text-slate-950 font-semibold rounded-lg text-xs"
          >
            Start Initial Run
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Top 3 Primary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {/* Precision */}
            <div className="bg-[#0F172A] border border-slate-800 p-6 rounded-xl">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400 block mb-2">
                Precision
              </span>
              <div className="text-3xl font-bold font-mono text-cyan-400">
                {(latestEval.precision * 100).toFixed(1)}%
              </div>
              <p className="text-[11px] font-mono text-slate-500 mt-2">
                True Positives / (TP + FP)
              </p>
            </div>

            {/* Recall */}
            <div className="bg-[#0F172A] border border-slate-800 p-6 rounded-xl">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400 block mb-2">
                Recall
              </span>
              <div className="text-3xl font-bold font-mono text-emerald-400">
                {(latestEval.recall * 100).toFixed(1)}%
              </div>
              <p className="text-[11px] font-mono text-slate-500 mt-2">
                True Positives / (TP + FN)
              </p>
            </div>

            {/* F1 Score */}
            <div className="bg-[#0F172A] border border-slate-800 p-6 rounded-xl">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400 block mb-2">
                F1 Score
              </span>
              <div className="text-3xl font-bold font-mono text-purple-400">
                {(latestEval.f1_score * 100).toFixed(1)}%
              </div>
              <p className="text-[11px] font-mono text-slate-500 mt-2">
                Harmonic Mean of Precision & Recall
              </p>
            </div>

            {/* False Positive Rate */}
            <div className="bg-[#0F172A] border border-slate-800 p-6 rounded-xl">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400 block mb-2">
                False Positive Rate
              </span>
              <div className="text-3xl font-bold font-mono text-slate-200">
                {(latestEval.false_positive_rate * 100).toFixed(1)}%
              </div>
              <p className="text-[11px] font-mono text-slate-500 mt-2">
                FP / (FP + TN)
              </p>
            </div>
          </div>

          {/* Detailed Results Expandable Section */}
          <div className="bg-[#0F172A] border border-slate-800 rounded-xl overflow-hidden">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-800/30 transition border-b border-slate-800/60"
            >
              <div className="flex items-center gap-3">
                <span className={`material-symbols-outlined text-[20px] transition-transform ${showDetails ? 'rotate-90 text-cyan-400' : 'text-slate-400'}`}>
                  chevron_right
                </span>
                <div>
                  <h3 className="text-base font-semibold text-slate-100">Detailed Benchmark Results</h3>
                  <span className="text-xs font-mono text-slate-400">
                    Confusion Matrix, Category-level Breakdowns, and Failure Case Audits
                  </span>
                </div>
              </div>
              <span className="text-xs font-mono text-slate-500">
                Evaluated: {new Date(latestEval.run_at).toLocaleString()}
              </span>
            </button>

            {showDetails && (
              <div className="p-6 flex flex-col gap-8 bg-slate-900/30">
                {/* Confusion Matrix */}
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3">
                    2x2 Confusion Matrix
                  </h4>
                  <div className="grid grid-cols-2 max-w-md gap-3 font-mono text-center text-xs">
                    <div className="p-4 rounded-lg bg-emerald-950/20 border border-emerald-500/30">
                      <span className="text-slate-400 block text-[10px] uppercase">True Positives (TP)</span>
                      <span className="text-2xl font-bold text-emerald-400">{latestEval.confusion_matrix.true_positives}</span>
                    </div>
                    <div className="p-4 rounded-lg bg-red-950/20 border border-red-500/30">
                      <span className="text-slate-400 block text-[10px] uppercase">False Positives (FP)</span>
                      <span className="text-2xl font-bold text-red-400">{latestEval.confusion_matrix.false_positives}</span>
                    </div>
                    <div className="p-4 rounded-lg bg-rose-950/20 border border-rose-500/30">
                      <span className="text-slate-400 block text-[10px] uppercase">False Negatives (FN)</span>
                      <span className="text-2xl font-bold text-rose-400">{latestEval.confusion_matrix.false_negatives}</span>
                    </div>
                    <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                      <span className="text-slate-400 block text-[10px] uppercase">True Negatives (TN)</span>
                      <span className="text-2xl font-bold text-slate-200">{latestEval.confusion_matrix.true_negatives}</span>
                    </div>
                  </div>
                </div>

                {/* Per-Category Table */}
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3">
                    Per-Category Performance
                  </h4>
                  <div className="overflow-x-auto border border-slate-800 rounded-lg">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-900 text-slate-400 uppercase text-[11px] border-b border-slate-800">
                        <tr>
                          <th className="py-2.5 px-4">Category</th>
                          <th className="py-2.5 px-4 text-center">Samples</th>
                          <th className="py-2.5 px-4 text-center">Precision</th>
                          <th className="py-2.5 px-4 text-center">Recall</th>
                          <th className="py-2.5 px-4 text-center">F1 Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {Object.values(latestEval.category_metrics).map((cat) => (
                          <tr key={cat.category} className="hover:bg-slate-800/20">
                            <td className="py-2.5 px-4 font-semibold text-slate-200">{cat.category}</td>
                            <td className="py-2.5 px-4 text-center text-slate-400">{cat.total}</td>
                            <td className="py-2.5 px-4 text-center text-cyan-400">{(cat.precision * 100).toFixed(0)}%</td>
                            <td className="py-2.5 px-4 text-center text-emerald-400">{(cat.recall * 100).toFixed(0)}%</td>
                            <td className="py-2.5 px-4 text-center text-purple-400">{(cat.f1_score * 100).toFixed(0)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Failure Cases */}
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3">
                    Failure Cases Audit ({latestEval.failure_cases.length})
                  </h4>
                  {latestEval.failure_cases.length === 0 ? (
                    <div className="p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-lg text-xs font-mono text-emerald-400">
                      Zero misclassifications detected on this benchmark dataset! (100% agreement with ground-truth).
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {latestEval.failure_cases.map((fc) => (
                        <div key={fc.id} className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs font-mono flex flex-col gap-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-200">{fc.id}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase ${fc.failure_type === 'false_positive' ? 'bg-amber-500/20 text-amber-300' : 'bg-red-500/20 text-red-300'}`}>
                              {fc.failure_type.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-slate-400 text-[11px] truncate">{fc.text_excerpt}</p>
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
