import React from 'react';

export type ScreenId = 'overview' | 'prompt-inspector' | 'evaluation-lab' | 'event-log' | 'policies' | 'settings';

interface Props {
  activeScreen: ScreenId;
  onSelectScreen: (screen: ScreenId) => void;
}

export const Sidebar: React.FC<Props> = ({ activeScreen, onSelectScreen }) => {
  const navItems: { id: ScreenId; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: 'dashboard' },
    { id: 'prompt-inspector', label: 'Prompt Inspector', icon: 'manage_search' },
    { id: 'evaluation-lab', label: 'Evaluation Lab', icon: 'science' },
    { id: 'event-log', label: 'Event Log', icon: 'receipt_long' },
    { id: 'policies', label: 'Policies', icon: 'shield' },
    { id: 'settings', label: 'Settings', icon: 'tune' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#0B132B] z-50 flex flex-col justify-between border-r border-slate-800 select-none">
      <div className="flex flex-col">
        {/* Brand header */}
        <div className="h-16 px-6 flex items-center border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <span className="material-symbols-outlined text-[20px]">shield</span>
            </div>
            <div className="flex flex-col">
              <span className="text-base text-slate-100 font-semibold tracking-tight leading-none">PromptShield</span>
              <span className="text-[11px] text-cyan-400/80 font-mono mt-1">AI Threat Defense</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 p-3 mt-2">
          {navItems.map((item) => {
            const isActive = activeScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectScreen(item.id)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-150 text-left ${
                  isActive
                    ? 'bg-slate-800/90 text-cyan-400 font-semibold shadow-sm border border-slate-700/60'
                    : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                }`}
              >
                <span className={`material-symbols-outlined text-[18px] ${isActive ? 'text-cyan-400' : 'text-slate-400'}`}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Analyst profile */}
      <div className="p-4 border-t border-slate-800/80">
        <div className="flex items-center gap-3 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
          <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-semibold text-xs">
            SC
          </div>
          <div className="flex flex-col truncate">
            <span className="text-xs text-slate-200 truncate font-medium">Sarah Chen</span>
            <span className="text-[10px] text-slate-400 font-mono truncate">SecOps Lead // L3</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
