import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { OverviewResponse } from '../types/api';
import { DecisionBadge } from '../components/DecisionBadge';

interface Props {
  onNavigateToInspector: () => void;
  onNavigateToEventLog: () => void;
}

export const Overview: React.FC<Props> = ({ onNavigateToInspector, onNavigateToEventLog }) => {
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getOverview();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load overview data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-8 h-8 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm font-mono text-slate-500">Loading live telemetry metrics...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 bg-red-50 border border-red-200 rounded-xl max-w-xl mx-auto my-12 text-center shadow-sm">
        <span className="material-symbols-outlined text-red-500 text-4xl mb-2">error</span>
        <h3 className="text-lg font-semibold text-red-900">Failed to Connect to Security Core</h3>
        <p className="text-sm text-red-700/80 mt-1 mb-4">{error}</p>
        <button
          onClick={fetchOverview}
          className="px-4 py-2 bg-red-100 hover:bg-red-200 border border-red-300 text-red-800 rounded-lg text-sm font-semibold transition"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const { kpis, recent_events } = data;

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Security Overview</h1>
          <p className="text-sm text-slate-600 mt-1">
            Real-time prompt analysis, automated mitigation telemetry, and defense activity.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchOverview}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-mono font-medium text-slate-700 shadow-xs transition"
            title="Refresh metrics"
          >
            <span className="material-symbols-outlined text-[16px]">sync</span>
            <span>Refresh</span>
          </button>
          <button
            onClick={onNavigateToInspector}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg text-sm shadow-xs transition"
          >
            <span className="material-symbols-outlined text-[18px]">manage_search</span>
            <span>Analyze a Prompt</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* KPI 1 */}
        <div className="bg-white border border-slate-200 p-6 rounded-xl relative overflow-hidden shadow-xs hover:border-cyan-400 hover:shadow-sm transition">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-mono font-medium tracking-wider text-slate-500">Prompts Analyzed</span>
            <span className="p-2 rounded-lg bg-cyan-50 text-cyan-700 border border-cyan-200 material-symbols-outlined text-[20px]">
              monitoring
            </span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold font-mono text-slate-900">
              {kpis.prompts_analyzed.toLocaleString()}
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs font-mono text-slate-500">
              <span className="text-emerald-600 font-semibold flex items-center">
                <span className="material-symbols-outlined text-[14px]">check_circle</span> Live
              </span>
              <span>• Total inspected requests</span>
            </div>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white border border-slate-200 p-6 rounded-xl relative overflow-hidden shadow-xs hover:border-red-400 hover:shadow-sm transition">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-mono font-medium tracking-wider text-slate-500">Attacks Detected</span>
            <span className="p-2 rounded-lg bg-red-50 text-red-700 border border-red-200 material-symbols-outlined text-[20px]">
              gpp_maybe
            </span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold font-mono text-slate-900">
              {kpis.attacks_detected.toLocaleString()}
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs font-mono text-slate-500">
              <span className="text-rose-600 font-bold">{kpis.attack_rate_pct}%</span>
              <span>of total volume triggered rules</span>
            </div>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white border border-slate-200 p-6 rounded-xl relative overflow-hidden shadow-xs hover:border-purple-400 hover:shadow-sm transition">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-mono font-medium tracking-wider text-slate-500">Requests Blocked</span>
            <span className="p-2 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 material-symbols-outlined text-[20px]">
              shield_locked
            </span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold font-mono text-slate-900">
              {kpis.requests_blocked.toLocaleString()}
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs font-mono text-slate-500">
              <span className="text-cyan-700 font-bold">{kpis.block_rate_pct}%</span>
              <span>hard mitigation enforcement</span>
            </div>
          </div>
        </div>
      </div>


      {/* Recent Events Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Recent Security Audit Events</h3>
            <p className="text-xs text-slate-500 mt-0.5">Live event stream from PromptShield local log</p>
          </div>
          <button
            onClick={onNavigateToEventLog}
            className="text-xs font-mono text-cyan-700 hover:text-cyan-800 font-semibold flex items-center gap-1 transition"
          >
            <span>View Full Event Log</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        </div>

        {recent_events.length === 0 ? (
          <div className="p-12 text-center text-sm font-mono text-slate-500">
            No audit events recorded yet. Run a prompt analysis to generate telemetry.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Decision</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Primary Rule</th>
                  <th className="py-3 px-4">Payload Excerpt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {recent_events.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-3 px-4">
                      <DecisionBadge decision={ev.decision} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-slate-700 capitalize font-medium">{ev.source_type}</td>
                    <td className="py-3 px-4 text-slate-600">
                      {ev.primary_rule ? (
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] text-cyan-800 border border-slate-200 font-semibold">
                          {ev.primary_rule}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-700 truncate max-w-xs" title={ev.redacted_excerpt}>
                      {ev.redacted_excerpt}
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
