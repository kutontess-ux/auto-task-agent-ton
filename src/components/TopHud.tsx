import React from 'react';
import { FastForward, KeyRound, Pause, Play, Plus, ScrollText, Users } from 'lucide-react';
import { Agent } from '../types/agent';
import { LLMConfig } from '../types/llm';
import { Quest } from '../types/quest';

interface TopHudProps {
  agents: Agent[];
  quests: Quest[];
  llmConfig: LLMConfig;
  speed: number;
  onSetSpeed: (speed: number) => void;
  onOpenHireModal: () => void;
  onOpenApiSettings: () => void;
  canHireMore: boolean;
}

export const TopHud: React.FC<TopHudProps> = ({
  agents,
  quests,
  llmConfig,
  speed,
  onSetSpeed,
  onOpenHireModal,
  onOpenApiSettings,
  canHireMore,
}) => {
  const activeQuests = quests.filter((q) => q.status !== 'completed').length;
  const completedQuests = quests.filter((q) => q.status === 'completed').length;
  const workingAgents = agents.filter((a) => a.status !== 'idle').length;
  const isRealAI =
    llmConfig.provider !== 'simulation' &&
    (llmConfig.provider === 'custom' || Boolean(llmConfig.apiKey.trim()));

  return (
    <header
      style={{
        minHeight: '54px',
        background: '#111827',
        borderBottom: '2px solid #303a4d',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
        padding: '8px 14px',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <div
          className="font-pixel"
          style={{
            fontSize: '12px',
            color: '#fbbf24',
            textShadow: '0 2px 0 #78350f',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span>🏰</span>
          <span>PIXEL AGENT HQ</span>
        </div>

        <button
          type="button"
          onClick={onOpenApiSettings}
          title="Nhấn để cài đặt AI API Key"
          style={{
            fontSize: '11px',
            padding: '4px 10px',
            borderRadius: '999px',
            background: isRealAI ? '#14532d' : '#1e293b',
            border: isRealAI ? '1px solid #22c55e' : '1px solid #334155',
            color: isRealAI ? '#86efac' : '#38bdf8',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontWeight: 600,
          }}
        >
          <KeyRound size={12} />
          {isRealAI ? `AI: ${llmConfig.provider.toUpperCase()} (${llmConfig.model})` : 'Simulation Mode'}
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        {/* Stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: '#cbd5e1' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Users size={14} color="#38bdf8" />
            <strong>{workingAgents}</strong>/{agents.length} làm
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ScrollText size={14} color="#f59e0b" />
            <strong>{activeQuests}</strong> chạy · <strong>{completedQuests}</strong> xong
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
            type="button"
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
            type="button"
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
            type="button"
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
          type="button"
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
