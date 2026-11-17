import React, { useEffect, useRef } from 'react';
import { Award, Terminal, Zap } from 'lucide-react';
import { Agent } from '../types/agent';

interface AgentInspectorProps {
  agents: Agent[];
  selectedAgentId: string | null;
  onSelectAgent: (id: string) => void;
}

const STATUS_LABEL: Record<Agent['status'], { text: string; color: string }> = {
  idle: { text: 'Đang rảnh (Idle)', color: '#94a3b8' },
  walking: { text: 'Đang di chuyển...', color: '#fbbf24' },
  thinking: { text: 'Đang phân tích...', color: '#f59e0b' },
  working: { text: 'Đang thực thi task', color: '#38bdf8' },
  reporting: { text: 'Đang báo cáo Manager', color: '#c084fc' },
  done: { text: 'Hoàn thành!', color: '#4ade80' },
};

export const AgentInspector: React.FC<AgentInspectorProps> = ({
  agents,
  selectedAgentId,
  onSelectAgent,
}) => {
  const selected = agents.find((a) => a.id === selectedAgentId) ?? agents[0];
  const logEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selected?.logs.length, selected?.id]);

  if (!selected) return null;

  const xpPercent = Math.min(100, Math.round((selected.xp / selected.xpToNext) * 100));
  const statusInfo = STATUS_LABEL[selected.status];

  return (
    <aside
      style={{
        width: '340px',
        background: '#161b22',
        borderLeft: '2px solid #303a4d',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        flexShrink: 0,
      }}
    >
      {/* Quick Team Roster Tabs */}
      <div
        style={{
          padding: '10px 12px',
          borderBottom: '1px solid #303a4d',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
        }}
      >
        {agents.map((a) => {
          const active = a.id === selected.id;
          return (
            <button
              key={a.id}
              onClick={() => onSelectAgent(a.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 8px',
                borderRadius: '5px',
                border: active ? '1px solid #fbbf24' : '1px solid #303a4d',
                background: active ? '#283244' : '#0d1117',
                color: active ? '#fff' : '#94a3b8',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '2px',
                  background: a.color,
                  display: 'inline-block',
                }}
              />
              {a.name}
            </button>
          );
        })}
      </div>

      {/* Selected Agent Stats */}
      <div style={{ padding: '14px', borderBottom: '1px solid #303a4d' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '8px',
              background: '#0d1117',
              border: `2px solid ${selected.color}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              fontWeight: 700,
              color: selected.color,
            }}
          >
            {selected.role === 'manager' ? '👑' : selected.name.slice(0, 1).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: '15px', color: '#f8fafc' }}>{selected.name}</span>
              <span
                className="font-pixel"
                style={{
                  fontSize: '10px',
                  color: '#fbbf24',
                  background: '#451a03',
                  padding: '3px 6px',
                  borderRadius: '4px',
                }}
              >
                LV.{selected.level}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: selected.color, fontWeight: 600, marginTop: '2px' }}>
              {selected.roleLabel}
            </div>
            <div style={{ fontSize: '11px', color: statusInfo.color, marginTop: '2px' }}>
              ● {statusInfo.text}
            </div>
          </div>
        </div>

        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '10px', lineHeight: 1.4 }}>
          {selected.specialty}
        </div>

        {/* XP & Tasks Done */}
        <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div style={{ background: '#0d1117', padding: '8px', borderRadius: '6px', border: '1px solid #283244' }}>
            <div style={{ fontSize: '11px', color: '#8b949e', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Zap size={12} color="#fbbf24" /> XP Progress
            </div>
            <div style={{ fontSize: '12px', fontWeight: 600, marginTop: '3px', color: '#fde68a' }}>
              {selected.xp} / {selected.xpToNext}
            </div>
            <div style={{ marginTop: '5px', height: '5px', background: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${xpPercent}%`, height: '100%', background: '#fbbf24' }} />
            </div>
          </div>

          <div style={{ background: '#0d1117', padding: '8px', borderRadius: '6px', border: '1px solid #283244' }}>
            <div style={{ fontSize: '11px', color: '#8b949e', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Award size={12} color="#22c55e" /> Tasks Done
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, marginTop: '3px', color: '#4ade80' }}>
              {selected.tasksDone}
            </div>
          </div>
        </div>
      </div>

      {/* Terminal / Activity Log */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div
          style={{
            padding: '8px 14px',
            background: '#0d1117',
            borderBottom: '1px solid #303a4d',
            fontSize: '11px',
            fontWeight: 600,
            color: '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Terminal size={13} color="#38bdf8" />
          <span>AGENT TERMINAL LOG</span>
        </div>

        <div
          className="font-mono"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '10px 12px',
            background: '#090d13',
            fontSize: '11px',
            lineHeight: 1.55,
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          {selected.logs.map((log) => {
            const color =
              log.level === 'success'
                ? '#4ade80'
                : log.level === 'action'
                  ? '#38bdf8'
                  : log.level === 'system'
                    ? '#fbbf24'
                    : '#cbd5e1';
            return (
              <div key={log.id} style={{ color }}>
                <span style={{ color: '#475569', marginRight: '6px' }}>[{log.timestamp}]</span>
                <span>{log.message}</span>
              </div>
            );
          })}
          <div ref={logEndRef} />
        </div>
      </div>
    </aside>
  );
};
