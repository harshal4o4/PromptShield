import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { EventItem, EventDetail } from '../types/api';
import { DecisionBadge } from '../components/DecisionBadge';
import { SeverityBadge } from '../components/SeverityBadge';

export const EventLog: React.FC = () => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [decisionFilter, setDecisionFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('all');

  // Selected event detail drawer
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<EventDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getEvents({
        search: searchTerm || undefined,
        decision: decisionFilter !== 'ALL' ? decisionFilter : undefined,
        risk_level: riskFilter !== 'all' ? riskFilter : undefined,
        page,
        page_size: 15,
      });
      setEvents(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err: any) {
      setError(err.message || 'Failed to load audit events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [page, decisionFilter, riskFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchEvents();
  };

  const handleSelectRow = async (eventId: string) => {
    setSelectedEventId(eventId);
    try {
      setLoadingDetail(true);
      const detail = await api.getEventDetail(eventId);
      setSelectedDetail(detail);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-100 tracking-tight">Security Event Log</h1>
        <p className="text-sm text-slate-400 mt-1">
          Immutable audit trail of prompt inspections, mitigation decisions, and policy signals.
        </p>
      </div>

      {/* Filters Bar */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-500 text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by summary or excerpt..."
              className="w-full bg-[#090D16] border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono text-slate-200 rounded-lg transition"
          >
            Search
          </button>
        </form>

        {/* Decision & Risk Filters */}
        <div className="flex items-center gap-3">
          <select
            value={decisionFilter}
            onChange={(e) => { setDecisionFilter(e.target.value); setPage(1); }}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-cyan-400"
          >
            <option value="ALL">All Decisions</option>
            <option value="ALLOW">ALLOW Only</option>
            <option value="BLOCK">BLOCK Only</option>
            <option value="SANITIZE">SANITIZE Only</option>
            <option value="ESCALATE">ESCALATE Only</option>
          </select>

          <select
            value={riskFilter}
            onChange={(e) => { setRiskFilter(e.target.value); setPage(1); }}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-cyan-400"
          >
            <option value="all">All Risk Levels</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <button
            onClick={fetchEvents}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition"
            title="Refresh"
          >
            <span className="material-symbols-outlined text-[16px]">sync</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/30 border border-red-500/40 rounded-xl text-xs font-mono text-red-300">
          Error: {error}
        </div>
      )}

      {/* Main Table & Drawer View */}
      <div className="relative">
        <div className="bg-[#0F172A] border border-slate-800 rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs font-mono text-slate-400 flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
              <span>Querying audit event records...</span>
            </div>
          ) : events.length === 0 ? (
            <div className="p-12 text-center text-xs font-mono text-slate-500">
              No matching audit events found. Try adjusting filters or search term.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Decision</th>
                    <th className="py-3 px-4">Risk</th>
                    <th className="py-3 px-4">Source</th>
                    <th className="py-3 px-4">Primary Rule</th>
                    <th className="py-3 px-4">Payload Excerpt</th>
                    <th className="py-3 px-4 text-center">Signals</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {events.map((ev) => (
                    <tr
                      key={ev.id}
                      onClick={() => handleSelectRow(ev.id)}
                      className={`cursor-pointer transition hover:bg-slate-800/40 ${selectedEventId === ev.id ? 'bg-cyan-500/10 border-l-2 border-l-cyan-400' : ''}`}
                    >
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                        {new Date(ev.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="py-3 px-4">
                        <DecisionBadge decision={ev.decision} size="sm" />
                      </td>
                      <td className="py-3 px-4">
                        <SeverityBadge severity={ev.risk_level} />
                      </td>
                      <td className="py-3 px-4 text-slate-300 capitalize">{ev.source_type}</td>
                      <td className="py-3 px-4 text-slate-400">
                        {ev.primary_rule ? (
                          <span className="text-cyan-400 text-[10px] bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-500/20">
                            {ev.primary_rule}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-300 truncate max-w-xs" title={ev.redacted_excerpt}>
                        {ev.redacted_excerpt}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${ev.signals_count > 0 ? 'bg-red-500/20 text-red-300' : 'bg-slate-800 text-slate-400'}`}>
                          {ev.signals_count}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-cyan-400">
                        <span className="material-symbols-outlined text-[16px]">visibility</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Footer */}
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>
              Showing {events.length} of {total} events (Page {page} of {totalPages})
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1 bg-slate-900 border border-slate-700 rounded disabled:opacity-40 text-slate-300"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1 bg-slate-900 border border-slate-700 rounded disabled:opacity-40 text-slate-300"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Right Slide-over Detail Drawer */}
        {selectedEventId && (
          <div className="fixed inset-y-0 right-0 w-full max-w-md bg-[#0B132B] border-l border-slate-800 shadow-2xl z-50 p-6 flex flex-col gap-5 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-cyan-400 text-[20px]">description</span>
                <h3 className="text-sm font-bold font-mono text-slate-100">Audit Record Detail</h3>
              </div>
              <button
                onClick={() => { setSelectedEventId(null); setSelectedDetail(null); }}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {loadingDetail || !selectedDetail ? (
              <div className="py-12 text-center text-xs font-mono text-slate-500">
                Loading audit event...
              </div>
            ) : (
              <div className="flex flex-col gap-4 text-xs font-mono">
                {/* Meta Header */}
                <div className="flex items-center justify-between bg-slate-900 p-3 rounded-lg border border-slate-800">
                  <DecisionBadge decision={selectedDetail.decision} size="md" />
                  <SeverityBadge severity={selectedDetail.risk_level} />
                </div>

                <div>
                  <span className="text-[10px] uppercase text-slate-500 block">Event UUID</span>
                  <span className="text-slate-200 break-all select-all">{selectedDetail.id}</span>
                </div>

                <div>
                  <span className="text-[10px] uppercase text-slate-500 block">Timestamp</span>
                  <span className="text-slate-300">{new Date(selectedDetail.timestamp).toISOString()}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                  <div>
                    <span className="text-[10px] uppercase text-slate-500 block">Source</span>
                    <span className="text-slate-200 capitalize">{selectedDetail.source_type}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-500 block">Trust Level</span>
                    <span className="text-slate-200 capitalize">{selectedDetail.trust_level}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase text-slate-500 block">Policy Rationale</span>
                  <p className="text-slate-200 bg-slate-900 p-3 rounded-lg border border-slate-800 leading-relaxed font-sans text-xs">
                    {selectedDetail.summary}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] uppercase text-slate-500 block mb-1">Bounded Input Excerpt</span>
                  <div className="p-3 bg-[#090D16] border border-slate-800 rounded-lg text-slate-300 max-h-32 overflow-y-auto select-all">
                    {selectedDetail.redacted_excerpt}
                  </div>
                </div>

                {selectedDetail.sanitized_text && (
                  <div>
                    <span className="text-[10px] uppercase text-amber-400 block mb-1">Sanitized Result</span>
                    <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-lg text-slate-200">
                      {selectedDetail.sanitized_text}
                    </div>
                  </div>
                )}

                <div>
                  <span className="text-[10px] uppercase text-slate-500 block mb-1">
                    Fired Signals ({selectedDetail.signals.length})
                  </span>
                  {selectedDetail.signals.length === 0 ? (
                    <span className="text-slate-500 italic">None</span>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {selectedDetail.signals.map((s, idx) => (
                        <div key={idx} className="p-2.5 bg-slate-900 rounded border border-slate-800 flex flex-col gap-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-cyan-300">{s.rule_id}</span>
                            <SeverityBadge severity={s.severity} />
                          </div>
                          <span className="text-slate-300">{s.label}</span>
                          <span className="text-red-300/80 text-[10px] bg-red-950/30 p-1.5 rounded">{s.evidence}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
                  <span>Detector: {selectedDetail.detector_version}</span>
                  <span>Policy: v{selectedDetail.policy_version}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
