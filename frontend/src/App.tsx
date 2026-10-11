import React, { useState } from 'react';
import { Sidebar, type ScreenId } from './components/Sidebar';
import { Header } from './components/Header';
import { Overview } from './pages/Overview';
import { PromptInspector } from './pages/PromptInspector';
import { EvaluationLab } from './pages/EvaluationLab';
import { EventLog } from './pages/EventLog';
import { Policies } from './pages/Policies';
import { SettingsSupport } from './pages/SettingsSupport';

export const App: React.FC = () => {
  // Prompt Inspector is prioritized as the primary & default screen
  const [activeScreen, setActiveScreen] = useState<ScreenId>('prompt-inspector');
  // Collapsible sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const screenTitles: Record<ScreenId, string> = {
    'prompt-inspector': 'Prompt Inspector',
    'overview': 'Security Overview',
    'evaluation-lab': 'Evaluation Lab',
    'event-log': 'Event Log',
    'policies': 'Policies',
    'settings': 'Settings & Support',
  };

  const handleSelectScreen = (screen: ScreenId) => {
    setActiveScreen(screen);
    // On mobile screens, auto-close sidebar on item selection
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col antialiased">
      {/* Fixed Full-Width Top Header with Top-Left 3-Line Hamburger Menu (☰) */}
      <Header
        activeScreenTitle={screenTitles[activeScreen]}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
      />

      {/* Mobile Backdrop overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 top-16 bg-slate-900/30 backdrop-blur-xs z-30 lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Collapsible Left Sidebar */}
      <Sidebar
        activeScreen={activeScreen}
        onSelectScreen={handleSelectScreen}
        isOpen={sidebarOpen}
      />

      {/* Main View Area with Smooth Transition when sidebar toggles */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'pl-0 lg:pl-64' : 'pl-0'
        }`}
      >
        {/* Dynamic Content Body */}
        <main className="pt-20 px-4 sm:px-6 lg:px-8 pb-16 flex-1 max-w-[1600px] w-full mx-auto">
          {activeScreen === 'prompt-inspector' && <PromptInspector />}

          {activeScreen === 'overview' && (
            <Overview
              onNavigateToInspector={() => setActiveScreen('prompt-inspector')}
              onNavigateToEventLog={() => setActiveScreen('event-log')}
            />
          )}

          {activeScreen === 'evaluation-lab' && <EvaluationLab />}

          {activeScreen === 'event-log' && <EventLog />}

          {activeScreen === 'policies' && <Policies />}

          {activeScreen === 'settings' && <SettingsSupport />}
        </main>
      </div>
    </div>
  );
};

export default App;
