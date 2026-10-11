import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { OverviewResponse } from '../types/api';
import { DecisionBadge } from '../components/DecisionBadge';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

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
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm font-mono text-slate-400">Loading live telemetry metrics...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 bg-red-950/20 border border-red-500/30 rounded-xl max-w-xl mx-auto my-12 text-center">
        <span className="material-symbols-outlined text-red-400 text-4xl mb-2">error</span>
        <h3 className="text-lg font-semibold text-red-200">Failed to Connect to Security Core</h3>
        <p className="text-sm text-red-300/80 mt-1 mb-4">{error}</p>
        <button
          onClick={fetchOverview}
          className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-200 rounded-lg text-sm font-medium transition"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const { kpis, activity, recent_events } = data;

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100 tracking-tight">Security Overview</h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time prompt analysis, automated mitigation telemetry, and defense activity.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchOverview}
            className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-700/80 hover:border-slate-600 rounded-lg text-xs font-mono text-slate-300 transition"
            title="Refresh metrics"
          >
            <span className="material-symbols-outlined text-[16px]">sync</span>
            <span>Refresh</span>
          </button>
          <button
            onClick={onNavigateToInspector}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold rounded-lg text-sm shadow-lg shadow-cyan-500/10 transition"
          >
            <span className="material-symbols-outlined text-[18px]">manage_search</span>
            <span>Analyze a Prompt</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* KPI 1 */}
        <div className="bg-[#0F172A] border border-slate-800 p-6 rounded-xl relative overflow-hidden group hover:border-cyan-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-mono tracking-wider text-slate-400">Prompts Analyzed</span>
            <span className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 material-symbols-outlined text-[20px]">
              monitoring
            </span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold font-mono text-slate-100">
              {kpis.prompts_analyzed.toLocaleString()}
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs font-mono text-slate-400">
              <span className="text-emerald-400 flex items-center">
                <span className="material-symbols-outlined text-[14px]">check_circle</span> Live
              </span>
              <span>• Total inspected requests</span>
            </div>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-[#0F172A] border border-slate-800 p-6 rounded-xl relative overflow-hidden group hover:border-red-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-mono tracking-wider text-slate-400">Attacks Detected</span>
            <span className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 material-symbols-outlined text-[20px]">
              gpp_maybe
            </span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold font-mono text-slate-100">
              {kpis.attacks_detected.toLocaleString()}
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs font-mono text-slate-400">
              <span className="text-rose-400 font-semibold">{kpis.attack_rate_pct}%</span>
              <span>of total volume triggered rules</span>
            </div>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-[#0F172A] border border-slate-800 p-6 rounded-xl relative overflow-hidden group hover:border-purple-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-mono tracking-wider text-slate-400">Requests Blocked</span>
            <span className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 material-symbols-outlined text-[20px]">
              shield_locked
            </span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold font-mono text-slate-100">
              {kpis.requests_blocked.toLocaleString()}
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs font-mono text-slate-400">
              <span className="text-cyan-400 font-semibold">{kpis.block_rate_pct}%</span>
              <span>hard mitigation enforcement</span>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Timeline Chart */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-semibold text-slate-100">7-Day Threat Activity Timeline</h3>
            <p className="text-xs text-slate-400 mt-0.5">Aggregated audit events from local SQLite database</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-cyan-500"></span>
              <span className="text-slate-300">Total Analyzed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-red-400"></span>
              <span className="text-slate-300">Attacks Detected</span>
            </div>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={activity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="attacksGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.5}/>
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
              <XAxis dataKey="label" stroke="#64748B" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748B" fontSize={11} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0B132B', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                itemStyle={{ color: '#F8FAFC' }}
              />
              <Area type="monotone" dataKey="total" stroke="#06B6D4" strokeWidth={2} fillOpacity={1} fill="url(#totalGrad)" name="Total Requests" />
              <Area type="monotone" dataKey="attacks" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#attacksGrad)" name="Attacks" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Events Table */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-100">Recent Security Audit Events</h3>
            <p className="text-xs text-slate-400 mt-0.5">Live event stream from PromptShield local log</p>
          </div>
          <button
            onClick={onNavigateToEventLog}
            className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition"
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
              <thead className="bg-slate-900/60 border-b border-slate-800 text-slate-400 font-mono uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Decision</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Primary Rule</th>
                  <th className="py-3 px-4">Payload Excerpt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {recent_events.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-3 px-4">
                      <DecisionBadge decision={ev.decision} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-slate-300 capitalize">{ev.source_type}</td>
                    <td className="py-3 px-4 text-slate-400">
                      {ev.primary_rule ? (
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-cyan-300 border border-slate-700">
                          {ev.primary_rule}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-300 truncate max-w-xs" title={ev.redacted_excerpt}>
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
