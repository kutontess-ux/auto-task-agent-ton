import React from 'react';
import { FastForward, Pause, Play, Plus, ScrollText, Users } from 'lucide-react';
import { Agent } from '../types/agent';
import { Quest } from '../types/quest';

interface TopHudProps {
  agents: Agent[];
  quests: Quest[];
  speed: number;
  onSetSpeed: (speed: number) => void;
  onOpenHireModal: () => void;
  canHireMore: boolean;
}

export const TopHud: React.FC<TopHudProps> = ({
  agents,
  quests,
  speed,
  onSetSpeed,
  onOpenHireModal,
  canHireMore,
}) => {
  const activeQuests = quests.filter((q) => q.status !== 'completed').length;
  const completedQuests = quests.filter((q) => q.status === 'completed').length;
  const workingAgents = agents.filter((a) => a.status !== 'idle').length;

  return (
    <header
      style={{
        height: '58px',
        background: '#111827',
        borderBottom: '2px solid #303a4d',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 18px',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div
          className="font-pixel"
          style={{
            fontSize: '13px',
            color: '#fbbf24',
            textShadow: '0 2px 0 #78350f',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>🏰</span>
          <span>PIXEL AGENT HQ</span>
        </div>

        <span
          style={{
            fontSize: '11px',
            padding: '3px 8px',
            borderRadius: '999px',
            background: '#1e293b',
            border: '1px solid #334155',
            color: '#38bdf8',
          }}
        >
          Simulation Mode
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: '#cbd5e1' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Users size={14} color="#38bdf8" />
            <strong>{workingAgents}</strong>/{agents.length} đang làm
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <ScrollText size={14} color="#f59e0b" />
            <strong>{activeQuests}</strong> đang chạy · <strong>{completedQuests}</strong> xong
          </span>
        </div>

        {/* Speed controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '6px',
            overflow: 'hidden',
          }}
        >
          <button
            onClick={() => onSetSpeed(0)}
            title="Tạm dừng"
            style={{
              padding: '5px 9px',
              background: speed === 0 ? '#ef4444' : 'transparent',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Pause size={13} />
          </button>
          <button
            onClick={() => onSetSpeed(1)}
            title="Tốc độ 1x"
            style={{
              padding: '5px 9px',
              background: speed === 1 ? '#2563eb' : 'transparent',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
            }}
          >
            <Play size={12} /> 1x
          </button>
          <button
            onClick={() => onSetSpeed(2)}
            title="Tốc độ 2x"
            style={{
              padding: '5px 9px',
              background: speed === 2 ? '#2563eb' : 'transparent',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
            }}
          >
            <FastForward size={12} /> 2x
          </button>
        </div>

        {/* Hire Agent */}
        <button
          className="pixel-btn pixel-btn-gold"
          onClick={onOpenHireModal}
          disabled={!canHireMore}
          title={canHireMore ? 'Tuyển thêm Agent mới vào văn phòng' : 'Văn phòng đã đầy bàn'}
        >
          <Plus size={14} />
          Tuyển Agent
        </button>
      </div>
    </header>
  );
};
