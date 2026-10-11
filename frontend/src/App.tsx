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
  const [activeScreen, setActiveScreen] = useState<ScreenId>('overview');

  const screenTitles: Record<ScreenId, string> = {
    'overview': 'Security Overview',
    'prompt-inspector': 'Prompt Inspector',
    'evaluation-lab': 'Evaluation Lab',
    'event-log': 'Event Log',
    'policies': 'Policies',
    'settings': 'Settings & Support',
  };

  return (
    <div className="min-h-screen bg-[#0B1326] text-[#DAE2FD] flex">
      {/* Fixed Left Sidebar */}
      <Sidebar activeScreen={activeScreen} onSelectScreen={setActiveScreen} />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col pl-64">
        {/* Fixed Top Header */}
        <Header activeScreenTitle={screenTitles[activeScreen]} />

        {/* Dynamic Content Body */}
        <main className="pt-24 px-8 pb-16 flex-1 max-w-[1600px] w-full mx-auto">
          {activeScreen === 'overview' && (
            <Overview
              onNavigateToInspector={() => setActiveScreen('prompt-inspector')}
              onNavigateToEventLog={() => setActiveScreen('event-log')}
            />
          )}

          {activeScreen === 'prompt-inspector' && <PromptInspector />}

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
