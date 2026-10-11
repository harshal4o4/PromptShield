import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { AppSettings, RiskLevel } from '../types/api';

export const SettingsSupport: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [healthInfo, setHealthInfo] = useState<{ status: string; app: string; version: string; database: string } | null>(null);

  // Accordion open states
  const [openHelp, setOpenHelp] = useState<Record<string, boolean>>({
    decisions: true,
    vectors: false,
    limitations: false,
  });

  const loadSettingsAndHealth = async () => {
    try {
      setLoading(true);
      const [s, h] = await Promise.all([
        api.getSettings(),
        api.getHealth()
      ]);
      setSettings(s);
      setHealthInfo(h);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettingsAndHealth();
  }, []);

  const handleSaveSettings = async () => {
    if (!settings) return;
    try {
      setSaving(true);
      setSaveMessage(null);
      const updated = await api.updateSettings(settings);
      setSettings(updated);
      setSaveMessage('Preferences successfully saved to local system storage.');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const toggleHelp = (key: string) => {
    setOpenHelp(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm font-mono text-slate-400">Loading system settings & status...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-100 tracking-tight">Settings & Help</h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage local-first security preferences, review runtime telemetry status, and inspect operational guidance.
        </p>
      </div>

      {saveMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span>{saveMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Column: Preferences & Verified Status */}
        <div className="flex flex-col gap-6">
          {/* Section: Local Storage Preferences */}
          {settings && (
            <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-6 flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-semibold text-slate-100">Audit & Retention Preferences</h3>
                <button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold rounded text-xs transition"
                >
                  {saving ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>

              <div className="flex flex-col gap-4 font-mono text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Payload Retention Mode</label>
                  <select
                    value={settings.retention_mode}
                    onChange={(e) => setSettings({ ...settings, retention_mode: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-400"
                  >
                    <option value="redacted_excerpt">Bounded Redacted Excerpt (Default - Safe)</option>
                    <option value="hash_only">SHA-256 Hash Only (Zero Raw Text Retention)</option>
                    <option value="full_text_local_only">Full Raw Text (Local Debugging Only)</option>
                  </select>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    Defines how inspected prompts are recorded into the local SQLite audit log.
                  </span>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Alert Notification Threshold</label>
                  <select
                    value={settings.alert_threshold}
                    onChange={(e) => setSettings({ ...settings, alert_threshold: e.target.value as RiskLevel })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-400"
                  >
                    <option value="low">Low (Alert on all signals)</option>
                    <option value="medium">Medium</option>
                    <option value="high">High (Default)</option>
                    <option value="critical">Critical (Canaries & severe vectors only)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <div>
                    <span className="font-bold text-slate-200 block">Telemetry Event Recording</span>
                    <span className="text-slate-500 text-[11px] block">Record auditable events into SQLite table</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, telemetry_enabled: !settings.telemetry_enabled })}
                    className={`w-10 h-5 rounded-full transition-colors relative flex items-center px-0.5 ${settings.telemetry_enabled ? 'bg-cyan-500' : 'bg-slate-700'}`}
                  >
                    <span className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${settings.telemetry_enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Section: Verified System Status */}
          <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-6">
            <h3 className="text-base font-semibold text-slate-100 mb-4">Verified Runtime Status</h3>
            <div className="divide-y divide-slate-800 font-mono text-xs">
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-400">Core API Service</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Online ({healthInfo?.status})
                </span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-400">Persistence Engine</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span> SQLite ({healthInfo?.database})
                </span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-400">Application Version</span>
                <span className="text-slate-200 font-bold">v{healthInfo?.version || '1.0.0'}</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-400">Detector Engine</span>
                <span className="text-cyan-400">rules-v1 (Layered Heuristics + Canaries)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Expandable Help & Operational Guidance */}
        <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-6 flex flex-col gap-4">
          <h3 className="text-base font-semibold text-slate-100">Security Operations Reference</h3>
          <p className="text-xs text-slate-400">
            Standard operating procedures and taxonomy definitions for PromptShield triage.
          </p>

          <div className="flex flex-col gap-3 mt-2">
            {/* Accordion 1: Decision Semantics */}
            <div className="border border-slate-800 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleHelp('decisions')}
                className="w-full p-3.5 bg-slate-900 flex items-center justify-between text-left text-xs font-mono font-semibold text-slate-200"
              >
                <span>Understanding Security Decisions</span>
                <span className={`material-symbols-outlined text-[18px] transition-transform ${openHelp.decisions ? 'rotate-90 text-cyan-400' : 'text-slate-400'}`}>
                  chevron_right
                </span>
              </button>
              {openHelp.decisions && (
                <div className="p-4 bg-[#090D16] text-xs font-sans text-slate-300 leading-relaxed flex flex-col gap-2">
                  <p><strong className="text-emerald-400 font-mono">ALLOW</strong>: No policy-triggering risk or adversarial signal detected. Safe to forward to target LLM.</p>
                  <p><strong className="text-red-400 font-mono">BLOCK</strong>: High or critical threat pattern identified. Execution halted immediately.</p>
                  <p><strong className="text-amber-400 font-mono">SANITIZE</strong>: Bounded adversarial tokens or formatting anomalies (e.g. zero-width characters, metadata injection tags) were defensibly excised.</p>
                  <p><strong className="text-purple-400 font-mono">ESCALATE</strong>: Ambiguous multi-vector risk or anomalous payload flagged for mandatory human analyst review.</p>
                </div>
              )}
            </div>

            {/* Accordion 2: Threat Taxonomy */}
            <div className="border border-slate-800 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleHelp('vectors')}
                className="w-full p-3.5 bg-slate-900 flex items-center justify-between text-left text-xs font-mono font-semibold text-slate-200"
              >
                <span>Threat Vectors Covered</span>
                <span className={`material-symbols-outlined text-[18px] transition-transform ${openHelp.vectors ? 'rotate-90 text-cyan-400' : 'text-slate-400'}`}>
                  chevron_right
                </span>
              </button>
              {openHelp.vectors && (
                <div className="p-4 bg-[#090D16] text-xs font-sans text-slate-300 leading-relaxed flex flex-col gap-2">
                  <p><strong className="text-slate-200">Direct Instruction Override</strong>: Prompts commanding the model to ignore prior system guidelines or adopt unrestricted personas (DAN, Jailbreak).</p>
                  <p><strong className="text-slate-200">System Prompt Leakage</strong>: Inquiries attempting to trick the model into regurgitating confidential initial instructions verbatim.</p>
                  <p><strong className="text-slate-200">Synthetic Canary Extraction</strong>: Requests attempting to exfiltrate configured canary tokens (e.g. `PS_DEMO_SECRET_`).</p>
                  <p><strong className="text-slate-200">Indirect Injection</strong>: Adversarial prompts hidden inside untrusted third-party documents, resumes, or scraped web pages.</p>
                  <p><strong className="text-slate-200">Data Exfiltration Intent</strong>: Covert markdown image embeds or requests instructing the model to post data to attacker endpoints.</p>
                </div>
              )}
            </div>

            {/* Accordion 3: Architectural Guardrails & Limitations */}
            <div className="border border-slate-800 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleHelp('limitations')}
                className="w-full p-3.5 bg-slate-900 flex items-center justify-between text-left text-xs font-mono font-semibold text-slate-200"
              >
                <span>Architecture & Scope Guardrails</span>
                <span className={`material-symbols-outlined text-[18px] transition-transform ${openHelp.limitations ? 'rotate-90 text-cyan-400' : 'text-slate-400'}`}>
                  chevron_right
                </span>
              </button>
              {openHelp.limitations && (
                <div className="p-4 bg-[#090D16] text-xs font-sans text-slate-300 leading-relaxed flex flex-col gap-2">
                  <p>• PromptShield operates in a local-first security architecture with zero external LLM dependencies for its core detection decisions.</p>
                  <p>• Detection is evidence-based and imperfect. Defenses rely on multi-layered normalization, heuristics, canaries, and policy enforcement.</p>
                  <p>• PromptShield only mediates prompts explicitly passed through its inspection pipeline; it does not passively intercept arbitrary operating system network traffic without middleware integration.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
