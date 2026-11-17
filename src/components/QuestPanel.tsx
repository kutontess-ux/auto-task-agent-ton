import React, { useState } from 'react';
import { CheckCircle2, Clock, Copy, Download, FileText, Send, Sparkles, X } from 'lucide-react';
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

function buildFullMarkdown(quest: Quest): string {
  const parts = [
    `# ${quest.title}`,
    quest.description ? `\n> ${quest.description}\n` : '',
    `## Kết quả tổng hợp từ Manager`,
    quest.finalOutput || '(Chưa có)',
    `\n## Chi tiết từng Agent`,
    ...quest.subtasks.map(
      (s, i) =>
        `### ${i + 1}. ${s.assignedAgentName} (${s.assignedRoleLabel}) — ${s.title}\n${
          s.output || '(Chưa hoàn thành)'
        }`
    ),
  ];
  return parts.join('\n\n');
}

export const QuestPanel: React.FC<QuestPanelProps> = ({ quests, onSubmitQuest }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [expandedQuestId, setExpandedQuestId] = useState<string | null>(null);
  const [viewingQuestId, setViewingQuestId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const viewingQuest = quests.find((q) => q.id === viewingQuestId) ?? null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmitQuest(title, description || title);
    setTitle('');
    setDescription('');
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1500);
  };

  const handleDownloadMd = (quest: Quest) => {
    const md = buildFullMarkdown(quest);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${quest.title.toLowerCase().replace(/[^a-z0-9]+/gi, '-') || 'quest-result'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <aside
        className="panel-left"
        style={{
          width: '290px',
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
            style={{
              fontSize: '11px',
              color: '#fbbf24',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
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
            <div
              style={{
                fontSize: '11px',
                color: '#8b949e',
                marginBottom: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
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
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
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
                    border: quest.status === 'completed' ? '1px solid #22c55e' : '1px solid #303a4d',
                    borderRadius: '8px',
                    padding: '10px',
                  }}
                >
                  <div
                    onClick={() => setExpandedQuestId(isExpanded ? null : quest.id)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '8px',
                      cursor: 'pointer',
                    }}
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
                  <div
                    style={{
                      marginTop: '8px',
                      background: '#0d1117',
                      height: '6px',
                      borderRadius: '3px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${avgProgress}%`,
                        height: '100%',
                        background: quest.status === 'completed' ? '#22c55e' : '#38bdf8',
                        transition: 'width 0.2s ease',
                      }}
                    />
                  </div>

                  {/* Action bar when completed */}
                  {quest.finalOutput && (
                    <div style={{ marginTop: '8px', display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        className="pixel-btn pixel-btn-primary"
                        onClick={() => setViewingQuestId(quest.id)}
                        style={{ flex: 1, justifyContent: 'center', fontSize: '11px', padding: '5px 8px' }}
                      >
                        <FileText size={12} />
                        Xem kết quả đầy đủ
                      </button>
                      <button
                        type="button"
                        className="pixel-btn"
                        onClick={() => handleDownloadMd(quest)}
                        title="Tải kết quả (.md)"
                        style={{ fontSize: '11px', padding: '5px 8px' }}
                      >
                        <Download size={12} />
                      </button>
                    </div>
                  )}

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
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              color: '#cbd5e1',
                              marginBottom: '3px',
                            }}
                          >
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

                  {/* Inline Final Output Preview */}
                  {quest.finalOutput && (
                    <div style={{ marginTop: '10px', position: 'relative' }}>
                      <button
                        type="button"
                        onClick={() => handleCopy(quest.id, quest.finalOutput || '')}
                        style={{
                          position: 'absolute',
                          top: '6px',
                          right: '6px',
                          fontSize: '10px',
                          padding: '3px 7px',
                          background: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '4px',
                          color: '#cbd5e1',
                          cursor: 'pointer',
                        }}
                      >
                        {copiedId === quest.id ? 'Đã copy!' : 'Copy'}
                      </button>
                      <pre
                        className="font-mono"
                        style={{
                          padding: '8px',
                          paddingTop: '26px',
                          background: '#0d1117',
                          border: '1px solid #14532d',
                          borderRadius: '6px',
                          fontSize: '11px',
                          color: '#86efac',
                          whiteSpace: 'pre-wrap',
                          lineHeight: 1.45,
                          maxHeight: '180px',
                          overflowY: 'auto',
                        }}
                      >
                        {quest.finalOutput}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* Full Quest Result Modal */}
      {viewingQuest && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.78)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 70,
            padding: '16px',
          }}
        >
          <div
            className="pixel-panel"
            style={{
              width: 'min(760px, 95vw)',
              maxHeight: '88vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '14px 18px',
                borderBottom: '1px solid #303a4d',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div>
                <div className="font-pixel" style={{ fontSize: '11px', color: '#4ade80' }}>
                  🏆 KẾT QUẢ QUEST HOÀN THÀNH
                </div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', marginTop: '4px' }}>
                  {viewingQuest.title}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  className="pixel-btn"
                  onClick={() => handleCopy('modal', buildFullMarkdown(viewingQuest))}
                >
                  <Copy size={13} />
                  {copiedId === 'modal' ? 'Đã copy!' : 'Copy tất cả'}
                </button>
                <button type="button" className="pixel-btn pixel-btn-primary" onClick={() => handleDownloadMd(viewingQuest)}>
                  <Download size={13} />
                  Tải .md
                </button>
                <button
                  type="button"
                  onClick={() => setViewingQuestId(null)}
                  style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#fbbf24', marginBottom: '6px' }}>
                  👑 Báo cáo tổng hợp từ Manager
                </div>
                <pre
                  className="font-mono"
                  style={{
                    padding: '12px',
                    background: '#0d1117',
                    border: '1px solid #14532d',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#86efac',
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.55,
                  }}
                >
                  {viewingQuest.finalOutput}
                </pre>
              </div>

              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', marginBottom: '8px' }}>
                  📋 Sản phẩm chi tiết của từng Agent
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {viewingQuest.subtasks.map((sub, idx) => (
                    <div
                      key={sub.id}
                      style={{
                        background: '#0d1117',
                        border: '1px solid #303a4d',
                        borderRadius: '8px',
                        padding: '10px 12px',
                      }}
                    >
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#e2e8f0', marginBottom: '4px' }}>
                        {idx + 1}. {sub.assignedAgentName} ({sub.assignedRoleLabel}) — {sub.title}
                      </div>
                      <pre
                        className="font-mono"
                        style={{
                          fontSize: '11.5px',
                          color: '#cbd5e1',
                          whiteSpace: 'pre-wrap',
                          lineHeight: 1.5,
                        }}
                      >
                        {sub.output || '(Không có đầu ra)'}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
