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
    <header className="fixed top-0 left-64 right-0 h-16 bg-[#0B132B] border-b border-slate-800 z-40 flex items-center justify-between px-8">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
        <span className="text-slate-500">Platform</span>
        <span className="text-slate-600">/</span>
        <span className="text-slate-400">Console</span>
        <span className="text-slate-600">/</span>
        <span className="text-cyan-400 font-medium">{activeScreenTitle}</span>
      </div>

      {/* Runtime health & Profile */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono">
          <span className={`w-2 h-2 rounded-full ${dbStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : dbStatus === 'checking' ? 'bg-amber-400' : 'bg-red-400'}`}></span>
          <span className="text-slate-400 text-[11px]">
            {dbStatus === 'connected' ? 'API Online' : dbStatus === 'checking' ? 'Connecting...' : 'API Offline'}
          </span>
        </div>

        <div className="text-[11px] font-mono text-slate-400 border-l border-slate-800 pl-4">
          Profile: <span className="text-slate-200">Production-US-East</span>
        </div>
      </div>
    </header>
  );
};
