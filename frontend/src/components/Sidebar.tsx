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
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white z-50 flex flex-col justify-between border-r border-slate-200 select-none shadow-xs">
      <div className="flex flex-col">
        {/* Brand header */}
        <div className="h-16 px-6 flex items-center border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600 shadow-2xs">
              <span className="material-symbols-outlined text-[20px]">shield</span>
            </div>
            <div className="flex flex-col">
              <span className="text-base text-slate-900 font-bold tracking-tight leading-none">PromptShield</span>
              <span className="text-[11px] text-cyan-700 font-mono mt-1 font-medium">AI Threat Defense</span>
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
                    ? 'bg-cyan-50 text-cyan-800 font-semibold shadow-xs border border-cyan-200/90'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className={`material-symbols-outlined text-[18px] ${isActive ? 'text-cyan-700' : 'text-slate-400'}`}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Analyst profile */}
      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
          <div className="w-8 h-8 rounded-full bg-cyan-100 border border-cyan-200 flex items-center justify-center text-cyan-800 font-semibold text-xs">
            SC
          </div>
          <div className="flex flex-col truncate">
            <span className="text-xs text-slate-800 truncate font-semibold">Sarah Chen</span>
            <span className="text-[10px] text-slate-500 font-mono truncate">SecOps Lead // L3</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
