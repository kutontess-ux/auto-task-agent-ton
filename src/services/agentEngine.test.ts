import { describe, expect, it } from 'vitest';
import { SimulationEngine } from './agentEngine';

describe('SimulationEngine', () => {
  it('initializes with 1 Manager and 4 specialist agents', () => {
    const engine = new SimulationEngine();
    const snap = engine.getSnapshot();
    expect(snap.agents).toHaveLength(5);
    expect(snap.agents.filter((a) => a.role === 'manager')).toHaveLength(1);
    expect(snap.agents.filter((a) => a.role !== 'manager')).toHaveLength(4);
  });

  it('delegates a quest through Manager to workers and completes it with XP rewards', () => {
    const engine = new SimulationEngine();
    const quest = engine.submitQuest('Build Pixel Dashboard', 'Create a game-style agent dashboard');
    expect(quest.status).toBe('planning');

    // Advance simulation for ~25 seconds in 0.2s steps
    for (let i = 0; i < 125; i++) {
      engine.tick(0.2);
    }

    const snap = engine.getSnapshot();
    const updatedQuest = snap.quests.find((q) => q.id === quest.id)!;
    expect(updatedQuest.status).toBe('completed');
    expect(updatedQuest.subtasks).toHaveLength(4);
    expect(updatedQuest.subtasks.every((s) => s.status === 'completed')).toBe(true);
    expect(updatedQuest.finalOutput).toContain('Build Pixel Dashboard');

    // Manager and workers should have gained tasksDone
    const manager = snap.agents.find((a) => a.role === 'manager')!;
    expect(manager.tasksDone).toBeGreaterThan(4);
  });

  it('allows hiring a custom agent and assigns them a desk', () => {
    const engine = new SimulationEngine();
    const hired = engine.hireAgent({
      name: 'Sora',
      roleLabel: 'UI Designer',
      specialty: 'Pixel art UI',
      color: '#ec4899',
    });

    expect(hired).not.toBeNull();
    expect(engine.getSnapshot().agents).toHaveLength(6);
  });
});
