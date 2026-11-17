import React, { useEffect, useMemo, useState } from 'react';
import { OfficeCanvas } from './canvas/OfficeCanvas';
import { WORKER_DESKS } from './canvas/officeMap';
import { AgentInspector } from './components/AgentInspector';
import { ApiSettingsModal } from './components/ApiSettingsModal';
import { HireAgentModal } from './components/HireAgentModal';
import { QuestPanel } from './components/QuestPanel';
import { TopHud } from './components/TopHud';
import { EngineSnapshot, SimulationEngine } from './services/agentEngine';
import { HireAgentInput } from './types/agent';
import { DEFAULT_LLM_CONFIG, LLMConfig } from './types/llm';

const STORAGE_KEY = 'pixel_agent_hq_llm_config';

function loadSavedConfig(): LLMConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_LLM_CONFIG, ...JSON.parse(raw) };
    }
  } catch {
    // ignore storage errors
  }
  return { ...DEFAULT_LLM_CONFIG };
}

export const App: React.FC = () => {
  const engine = useMemo(() => new SimulationEngine(loadSavedConfig()), []);
  const [snapshot, setSnapshot] = useState<EngineSnapshot>(() => engine.getSnapshot());
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>('agent-manager');
  const [speed, setSpeed] = useState<number>(1);
  const [showHireModal, setShowHireModal] = useState<boolean>(false);
  const [showApiModal, setShowApiModal] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = engine.subscribe(setSnapshot);
    return unsubscribe;
  }, [engine]);

  useEffect(() => {
    if (speed === 0) return;
    let last = performance.now();
    const interval = setInterval(() => {
      const now = performance.now();
      const dt = Math.min(0.2, (now - last) / 1000) * speed;
      last = now;
      engine.tick(dt);
    }, 50);
    return () => clearInterval(interval);
  }, [engine, speed]);

  const handleSubmitQuest = (title: string, description: string) => {
    engine.submitQuest(title, description);
  };

  const handleHireAgent = (input: HireAgentInput) => {
    const hired = engine.hireAgent(input);
    if (hired) {
      setSelectedAgentId(hired.id);
    }
  };

  const handleSaveApiConfig = (config: LLMConfig) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch {
      // ignore storage errors
    }
    engine.setLLMConfig(config);
  };

  const workersCount = snapshot.agents.filter((a) => a.role !== 'manager').length;
  const canHireMore = workersCount < WORKER_DESKS.length;

  return (
    <div
      className="app-shell"
      style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%', overflow: 'hidden' }}
    >
      <TopHud
        agents={snapshot.agents}
        quests={snapshot.quests}
        llmConfig={snapshot.llmConfig}
        speed={speed}
        onSetSpeed={setSpeed}
        onOpenHireModal={() => setShowHireModal(true)}
        onOpenApiSettings={() => setShowApiModal(true)}
        canHireMore={canHireMore}
      />

      <main className="app-main" style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
        <QuestPanel quests={snapshot.quests} onSubmitQuest={handleSubmitQuest} />

        <div className="panel-canvas" style={{ flex: 1, minWidth: 0, height: '100%' }}>
          <OfficeCanvas
            agents={snapshot.agents}
            selectedAgentId={selectedAgentId}
            onSelectAgent={setSelectedAgentId}
          />
        </div>

        <AgentInspector
          agents={snapshot.agents}
          selectedAgentId={selectedAgentId}
          onSelectAgent={setSelectedAgentId}
        />
      </main>

      {showHireModal && (
        <HireAgentModal onClose={() => setShowHireModal(false)} onHire={handleHireAgent} />
      )}

      {showApiModal && (
        <ApiSettingsModal
          currentConfig={snapshot.llmConfig}
          onClose={() => setShowApiModal(false)}
          onSave={handleSaveApiConfig}
        />
      )}
    </div>
  );
};

export default App;
