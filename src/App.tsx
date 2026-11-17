import React, { useEffect, useMemo, useState } from 'react';
import { OfficeCanvas } from './canvas/OfficeCanvas';
import { WORKER_DESKS } from './canvas/officeMap';
import { AgentInspector } from './components/AgentInspector';
import { HireAgentModal } from './components/HireAgentModal';
import { QuestPanel } from './components/QuestPanel';
import { TopHud } from './components/TopHud';
import { EngineSnapshot, SimulationEngine } from './services/agentEngine';
import { HireAgentInput } from './types/agent';

export const App: React.FC = () => {
  const engine = useMemo(() => new SimulationEngine(), []);
  const [snapshot, setSnapshot] = useState<EngineSnapshot>(() => engine.getSnapshot());
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>('agent-manager');
  const [speed, setSpeed] = useState<number>(1);
  const [showHireModal, setShowHireModal] = useState<boolean>(false);

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

  const workersCount = snapshot.agents.filter((a) => a.role !== 'manager').length;
  const canHireMore = workersCount < WORKER_DESKS.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <TopHud
        agents={snapshot.agents}
        quests={snapshot.quests}
        speed={speed}
        onSetSpeed={setSpeed}
        onOpenHireModal={() => setShowHireModal(true)}
        canHireMore={canHireMore}
      />

      <main style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
        <QuestPanel quests={snapshot.quests} onSubmitQuest={handleSubmitQuest} />

        <div style={{ flex: 1, minWidth: 0, height: '100%' }}>
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
    </div>
  );
};

export default App;
