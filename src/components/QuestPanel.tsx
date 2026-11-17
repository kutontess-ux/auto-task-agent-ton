import React, { useState } from 'react';
import { CheckCircle2, Clock, Send, Sparkles } from 'lucide-react';
import { Quest } from '../types/quest';

interface QuestPanelProps {
  quests: Quest[];
  onSubmitQuest: (title: string, description: string) => void;
}

const SAMPLE_QUESTS = [
  {
    title: 'Xây dựng Landing Page Game',
    description: 'Nghiên cứu đối thủ, thiết kế cấu trúc, viết copywriting và review giao diện.',
  },
  {
    title: 'Phân tích thị trường AI Agent',
    description: 'Tổng hợp xu hướng 2026, đề xuất tính năng cốt lõi và lập báo cáo tóm tắt.',
  },
  {
    title: 'Tối ưu quy trình Onboarding',
    description: 'Thiết kế luồng hướng dẫn người dùng mới kiểu game RPG.',
  },
];

const STATUS_BADGE: Record<Quest['status'], { label: string; bg: string; color: string }> = {
  pending: { label: 'Đang chờ', bg: '#334155', color: '#cbd5e1' },
  planning: { label: 'Manager phân tích', bg: '#78350f', color: '#fde68a' },
  in_progress: { label: 'Team đang làm', bg: '#1e3a8a', color: '#93c5fd' },
  reviewing: { label: 'Đang tổng hợp', bg: '#581c87', color: '#e9d5ff' },
  completed: { label: 'Hoàn thành', bg: '#14532d', color: '#86efac' },
};

export const QuestPanel: React.FC<QuestPanelProps> = ({ quests, onSubmitQuest }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [expandedQuestId, setExpandedQuestId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmitQuest(title, description || title);
    setTitle('');
    setDescription('');
  };

  return (
    <aside
      style={{
        width: '320px',
        background: '#161b22',
        borderRight: '2px solid #303a4d',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        flexShrink: 0,
      }}
    >
      <div style={{ padding: '14px', borderBottom: '1px solid #303a4d' }}>
        <div
          className="font-pixel"
          style={{ fontSize: '11px', color: '#fbbf24', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <span>📜</span>
          <span>QUEST BOARD</span>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input
            type="text"
            placeholder="Tên nhiệm vụ (VD: Tạo trang Dashboard)..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px',
              background: '#0d1117',
              border: '1px solid #303a4d',
              borderRadius: '6px',
              color: '#e6edf3',
              fontSize: '13px',
            }}
          />
          <textarea
            rows={2}
            placeholder="Mô tả chi tiết yêu cầu cho Manager..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px',
              background: '#0d1117',
              border: '1px solid #303a4d',
              borderRadius: '6px',
              color: '#e6edf3',
              fontSize: '12px',
              resize: 'none',
            }}
          />
          <button type="submit" className="pixel-btn pixel-btn-primary" style={{ justifyContent: 'center' }}>
            <Send size={13} />
            Giao Quest cho Manager
          </button>
        </form>

        {/* Quick samples */}
        <div style={{ marginTop: '10px' }}>
          <div style={{ fontSize: '11px', color: '#8b949e', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Sparkles size={11} color="#fbbf24" /> Quest mẫu nhanh:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {SAMPLE_QUESTS.map((sq) => (
              <button
                key={sq.title}
                type="button"
                onClick={() => onSubmitQuest(sq.title, sq.description)}
                style={{
                  fontSize: '11px',
                  padding: '4px 7px',
                  background: '#1f2633',
                  border: '1px solid #303a4d',
                  borderRadius: '4px',
                  color: '#93c5fd',
                  cursor: 'pointer',
                }}
              >
                + {sq.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quest List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {quests.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#64748b', fontSize: '12px', marginTop: '30px', lineHeight: 1.6 }}>
            Chưa có Quest nào.
            <br />
            Hãy nhập nhiệm vụ hoặc chọn 1 Quest mẫu ở trên để xem Manager Alex điều phối team!
          </div>
        ) : (
          quests.map((quest) => {
            const badge = STATUS_BADGE[quest.status];
            const isExpanded = expandedQuestId === quest.id || quest.status !== 'completed';
            const totalSubs = quest.subtasks.length;
            const avgProgress =
              totalSubs > 0
                ? Math.round(quest.subtasks.reduce((acc, s) => acc + s.progress, 0) / totalSubs)
                : quest.status === 'completed'
                  ? 100
                  : 0;

            return (
              <div
                key={quest.id}
                style={{
                  background: '#1f2633',
                  border: '1px solid #303a4d',
                  borderRadius: '8px',
                  padding: '10px',
                }}
              >
                <div
                  onClick={() => setExpandedQuestId(isExpanded ? null : quest.id)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', cursor: 'pointer' }}
                >
                  <div style={{ fontWeight: 600, fontSize: '13px', color: '#f1f5f9' }}>{quest.title}</div>
                  <span
                    style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: badge.bg,
                      color: badge.color,
                      whiteSpace: 'nowrap',
                      fontWeight: 600,
                    }}
                  >
                    {badge.label}
                  </span>
                </div>

                {/* Overall progress bar */}
                <div style={{ marginTop: '8px', background: '#0d1117', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${avgProgress}%`,
                      height: '100%',
                      background: quest.status === 'completed' ? '#22c55e' : '#38bdf8',
                      transition: 'width 0.2s ease',
                    }}
                  />
                </div>

                {/* Subtasks */}
                {isExpanded && quest.subtasks.length > 0 && (
                  <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {quest.subtasks.map((sub) => (
                      <div
                        key={sub.id}
                        style={{
                          fontSize: '11px',
                          background: '#161b22',
                          padding: '6px 8px',
                          borderRadius: '5px',
                          border: '1px solid #283244',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1', marginBottom: '3px' }}>
                          <span>
                            <strong style={{ color: '#38bdf8' }}>{sub.assignedAgentName}</strong> ({sub.assignedRoleLabel})
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                            {sub.status === 'completed' ? (
                              <CheckCircle2 size={12} color="#22c55e" />
                            ) : (
                              <Clock size={12} color="#f59e0b" />
                            )}
                            {sub.progress}%
                          </span>
                        </div>
                        <div style={{ color: '#94a3b8' }}>{sub.title}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Final Output */}
                {quest.finalOutput && (
                  <pre
                    className="font-mono"
                    style={{
                      marginTop: '10px',
                      padding: '8px',
                      background: '#0d1117',
                      border: '1px solid #14532d',
                      borderRadius: '6px',
                      fontSize: '11px',
                      color: '#86efac',
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.45,
                    }}
                  >
                    {quest.finalOutput}
                  </pre>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
