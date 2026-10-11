import React from 'react';

export type ScreenId = 'prompt-inspector' | 'overview' | 'evaluation-lab' | 'event-log' | 'policies' | 'settings';

interface Props {
  activeScreen: ScreenId;
  onSelectScreen: (screen: ScreenId) => void;
  isOpen: boolean;
}

export const Sidebar: React.FC<Props> = ({ activeScreen, onSelectScreen, isOpen }) => {
  const navItems: { id: ScreenId; label: string; icon: string }[] = [
    { id: 'prompt-inspector', label: 'Prompt Inspector', icon: 'manage_search' },
    { id: 'overview', label: 'Security Overview', icon: 'dashboard' },
    { id: 'evaluation-lab', label: 'Evaluation Lab', icon: 'science' },
    { id: 'event-log', label: 'Event Log', icon: 'receipt_long' },
    { id: 'policies', label: 'Policies', icon: 'shield' },
    { id: 'settings', label: 'Settings', icon: 'tune' },
  ];

  return (
    <aside
      className={`fixed top-16 left-0 bottom-0 w-64 bg-white z-40 flex flex-col justify-between border-r border-slate-200 select-none shadow-sm transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
      aria-label="Sidebar navigation"
    >
      <div className="flex flex-col flex-1 overflow-y-auto">
        <div className="px-4 pt-4 pb-2 text-[11px] font-mono font-semibold uppercase text-slate-400 tracking-wider">
          Navigation
        </div>

        {/* Navigation Tabs - Prompt Inspector prioritized at top */}
        <nav className="flex flex-col gap-1 px-3">
          {navItems.map((item) => {
            const isActive = activeScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectScreen(item.id)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm transition-all duration-150 text-left ${
                  isActive
                    ? 'bg-cyan-50 text-cyan-900 font-semibold shadow-2xs border border-cyan-200'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className={`material-symbols-outlined text-[19px] ${isActive ? 'text-cyan-700' : 'text-slate-400'}`}>
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
                {item.id === 'prompt-inspector' && (
                  <span className="ml-auto text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-800 font-bold border border-cyan-200">
                    Main
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Analyst profile card at bottom */}
      <div className="p-3 border-t border-slate-200 bg-white">
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
