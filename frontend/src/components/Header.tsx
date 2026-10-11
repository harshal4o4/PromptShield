import React, { useEffect, useState } from 'react';
import { api } from '../api/client';

interface Props {
  activeScreenTitle: string;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const Header: React.FC<Props> = ({ activeScreenTitle, sidebarOpen, onToggleSidebar }) => {
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error'>('checking');

  useEffect(() => {
    api.getHealth()
      .then(res => setDbStatus(res.database === 'connected' ? 'connected' : 'error'))
      .catch(() => setDbStatus('error'));
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 z-50 flex items-center justify-between px-4 sm:px-6 shadow-xs select-none">
      {/* Top-Left: Three-line Hamburger Button (☰), Brand Identity, and Breadcrumbs */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Three-line hamburger menu button (☰) in top-left corner */}
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-cyan-500/20 active:scale-95"
          title={sidebarOpen ? "Collapse sidebar navigation (☰)" : "Expand sidebar navigation (☰)"}
          aria-label="Toggle navigation sidebar"
          id="sidebar-toggle-btn"
        >
          <svg
            className="w-5 h-5 text-slate-700"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Brand Identity */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600 shadow-2xs">
            <span className="material-symbols-outlined text-[20px]">shield</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-none">
              PromptShield
            </span>
            <span className="text-[10px] font-mono text-cyan-700 font-medium hidden sm:inline leading-tight mt-0.5">
              AI Threat Defense
            </span>
          </div>
        </div>

        {/* Breadcrumbs */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-mono border-l border-slate-200 pl-3 sm:pl-4">
          <span className="text-slate-400">Console</span>
          <span className="text-slate-300">/</span>
          <span className="text-cyan-800 font-semibold">{activeScreenTitle}</span>
        </div>
      </div>

      {/* Top-Right: API Health & Runtime Profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-mono">
          <span
            className={`w-2 h-2 rounded-full ${
              dbStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : dbStatus === 'checking' ? 'bg-amber-500' : 'bg-red-500'
            }`}
          ></span>
          <span className="text-slate-700 font-medium text-[11px]">
            {dbStatus === 'connected' ? 'API Online' : dbStatus === 'checking' ? 'Connecting...' : 'API Offline'}
          </span>
        </div>

        <div className="text-[11px] font-mono text-slate-500 border-l border-slate-200 pl-3 sm:pl-4 hidden md:block">
          Profile: <span className="text-slate-800 font-semibold">Production-US-East</span>
        </div>
      </div>
    </header>
  );
};
