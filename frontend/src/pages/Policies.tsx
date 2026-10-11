import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { PolicyConfig, Decision } from '../types/api';
import { SeverityBadge } from '../components/SeverityBadge';

export const Policies: React.FC = () => {
  const [policy, setPolicy] = useState<PolicyConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const fetchPolicy = async () => {
    try {
      setLoading(true);
      const data = await api.getPolicies();
      setPolicy(data);
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to fetch policy configuration', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicy();
  }, []);

  const handleToggleRule = (ruleId: string) => {
    if (!policy) return;
    setPolicy({
      ...policy,
      rules: {
        ...policy.rules,
        [ruleId]: {
          ...policy.rules[ruleId],
          enabled: !policy.rules[ruleId].enabled
        }
      }
    });
  };

  const handleRuleActionChange = (ruleId: string, action: Decision) => {
    if (!policy) return;
    setPolicy({
      ...policy,
      rules: {
        ...policy.rules,
        [ruleId]: {
          ...policy.rules[ruleId],
          action
        }
      }
    });
  };

  const handleSeverityActionChange = (severity: string, action: Decision) => {
    if (!policy) return;
    setPolicy({
      ...policy,
      severity_actions: {
        ...policy.severity_actions,
        [severity]: action
      }
    });
  };

  const handleSave = async () => {
    if (!policy) return;
    try {
      setSaving(true);
      setMessage(null);
      const updated = await api.updatePolicies(policy);
      setPolicy(updated);
      setMessage({ text: `Policy v${updated.version} successfully saved and activated.`, type: 'success' });
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to save policies', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      setSaving(true);
      setShowResetConfirm(false);
      setMessage(null);
      const res = await api.resetPolicies();
      setPolicy(res);
      setMessage({ text: 'Policies successfully reset to documented baseline defaults.', type: 'success' });
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to reset policies', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm font-mono text-slate-400">Loading active security policy...</span>
      </div>
    );
  }

  if (!policy) return null;

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      {/* Top Command Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider font-semibold">
              Active Profile // Production-US-East
            </span>
            <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block animate-pulse"></span>
            <span className="text-[11px] font-mono text-slate-400">v{policy.version}</span>
          </div>
          <h1 className="text-2xl font-semibold text-slate-100 tracking-tight">Security Policies</h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure detection rules, automatic security decisions, and data protection settings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-lg text-xs font-mono text-slate-300 transition"
          >
            <span className="material-symbols-outlined text-[16px]">history</span>
            <span>Reset to Defaults</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-semibold rounded-lg text-sm shadow-lg shadow-cyan-500/10 transition"
          >
            {saving ? (
              <span>Saving...</span>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Toast Message */}
      {message && (
        <div className={`p-4 rounded-xl text-xs font-mono flex items-center gap-2 ${message.type === 'success' ? 'bg-emerald-950/30 border border-emerald-500/40 text-emerald-300' : 'bg-red-950/30 border border-red-500/40 text-red-300'}`}>
          <span className="material-symbols-outlined text-[18px]">
            {message.type === 'success' ? 'verified' : 'error'}
          </span>
          <span>{message.text}</span>
        </div>
      )}

      {/* Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-slate-700 rounded-xl p-6 max-w-md w-full flex flex-col gap-4">
            <h3 className="text-base font-bold text-slate-100">Reset Policies to Baseline?</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-mono">
              This will restore all detection rules, severity action thresholds, and protection options to factory defaults. Custom configurations will be overwritten.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-mono"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-mono font-bold"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Section 1: Detection Rules */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-slate-800">
          <h3 className="text-base font-semibold text-slate-100">1. Detection Rules</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Enable or disable individual inspection modules and adjust target enforcement actions.
          </p>
        </div>

        <div className="divide-y divide-slate-800/60 font-mono text-xs">
          {Object.entries(policy.rules).map(([ruleId, rule]) => (
            <div key={ruleId} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-800/20 transition">
              <div className="flex items-start gap-4">
                {/* Switch */}
                <button
                  type="button"
                  onClick={() => handleToggleRule(ruleId)}
                  className={`w-10 h-5 mt-0.5 rounded-full transition-colors relative flex items-center px-0.5 ${rule.enabled ? 'bg-cyan-500' : 'bg-slate-700'}`}
                >
                  <span className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${rule.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200">{rule.name}</span>
                    <span className="text-slate-500 text-[10px]">({ruleId})</span>
                    <SeverityBadge severity={rule.severity} />
                  </div>
                  <p className="text-slate-400 font-sans text-xs">{rule.description}</p>
                </div>
              </div>

              {/* Action Dropdown */}
              <div className="flex items-center gap-2 self-start md:self-auto">
                <span className="text-[11px] text-slate-500">Action:</span>
                <select
                  value={rule.action}
                  disabled={!rule.enabled}
                  onChange={(e) => handleRuleActionChange(ruleId, e.target.value as Decision)}
                  className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 disabled:opacity-40"
                >
                  <option value="BLOCK">BLOCK</option>
                  <option value="SANITIZE">SANITIZE</option>
                  <option value="ESCALATE">ESCALATE</option>
                  <option value="ALLOW">ALLOW</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Security Decisions Mapping */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-5">
        <h3 className="text-base font-semibold text-slate-100 mb-1">2. Severity Action Precedence</h3>
        <p className="text-xs text-slate-400 mb-4">
          Default action mapped to the highest severity signal detected when individual rule actions agree.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
          {Object.entries(policy.severity_actions).map(([sev, act]) => (
            <div key={sev} className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex flex-col gap-2">
              <span className="text-[10px] uppercase text-slate-400">{sev} Severity</span>
              <select
                value={act}
                onChange={(e) => handleSeverityActionChange(sev, e.target.value as Decision)}
                className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
              >
                <option value="BLOCK">BLOCK</option>
                <option value="SANITIZE">SANITIZE</option>
                <option value="ESCALATE">ESCALATE</option>
                <option value="ALLOW">ALLOW</option>
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Data Protection & Sanitization Options */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-5 flex flex-col gap-4 font-mono text-xs">
        <h3 className="text-base font-semibold text-slate-100 font-sans">3. Data Protection & Fallbacks</h3>

        <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-800">
          <div>
            <span className="font-bold text-slate-200 block">Enable Defensible Sanitization</span>
            <span className="text-slate-400 font-sans text-xs block">
              Allow stripping of bounded hidden tags and control characters when safely excisable.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setPolicy({ ...policy, sanitization_enabled: !policy.sanitization_enabled })}
            className={`w-10 h-5 rounded-full transition-colors relative flex items-center px-0.5 ${policy.sanitization_enabled ? 'bg-cyan-500' : 'bg-slate-700'}`}
          >
            <span className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${policy.sanitization_enabled ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-800">
          <div>
            <span className="font-bold text-slate-200 block">Escalate Ambiguous Risk Vectors</span>
            <span className="text-slate-400 font-sans text-xs block">
              Route conflicting or multi-vector anomalous payloads to ESCALATE for human triage rather than silent allowance.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setPolicy({ ...policy, ambiguous_escalation: !policy.ambiguous_escalation })}
            className={`w-10 h-5 rounded-full transition-colors relative flex items-center px-0.5 ${policy.ambiguous_escalation ? 'bg-cyan-500' : 'bg-slate-700'}`}
          >
            <span className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${policy.ambiguous_escalation ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>
    </div>
  );
};
