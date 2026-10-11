import React, { useEffect, useState } from 'react';
import { api } from '../api/client';

interface Props {
  activeScreenTitle: string;
}

export const Header: React.FC<Props> = ({ activeScreenTitle }) => {
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error'>('checking');

  useEffect(() => {
    api.getHealth()
      .then(res => setDbStatus(res.database === 'connected' ? 'connected' : 'error'))
      .catch(() => setDbStatus('error'));
  }, []);

  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-white/95 backdrop-blur border-b border-slate-200 z-40 flex items-center justify-between px-8 shadow-xs">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
        <span className="text-slate-400">Platform</span>
        <span className="text-slate-300">/</span>
        <span className="text-slate-500">Console</span>
        <span className="text-slate-300">/</span>
        <span className="text-cyan-700 font-semibold">{activeScreenTitle}</span>
      </div>

      {/* Runtime health & Profile */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-mono">
          <span className={`w-2 h-2 rounded-full ${dbStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : dbStatus === 'checking' ? 'bg-amber-500' : 'bg-red-500'}`}></span>
          <span className="text-slate-700 font-medium text-[11px]">
            {dbStatus === 'connected' ? 'API Online' : dbStatus === 'checking' ? 'Connecting...' : 'API Offline'}
          </span>
        </div>

        <div className="text-[11px] font-mono text-slate-500 border-l border-slate-200 pl-4">
          Profile: <span className="text-slate-800 font-semibold">Production-US-East</span>
        </div>
      </div>
    </header>
  );
};
