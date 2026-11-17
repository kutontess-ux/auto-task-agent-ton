import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Code2,
  Copy,
  Download,
  Eye,
  FileText,
  Globe,
  KeyRound,
  Monitor,
  RotateCcw,
  Send,
  Smartphone,
  Sparkles,
  X,
} from 'lucide-react';
import { Quest } from '../types/quest';
import {
  copyTextReliable,
  extractHtmlFromQuest,
  stripHtmlCodeBlocks,
  triggerFileDownload,
} from '../utils/htmlDeliverable';

interface QuestPanelProps {
  quests: Quest[];
  isSimulationMode?: boolean;
  onOpenApiSettings?: () => void;
  onSubmitQuest: (title: string, description: string) => void;
  onReviseQuest: (questId: string, feedback: string) => void;
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

export const QuestPanel: React.FC<QuestPanelProps> = ({
  quests,
  isSimulationMode = false,
  onOpenApiSettings,
  onSubmitQuest,
  onReviseQuest,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [expandedQuestId, setExpandedQuestId] = useState<string | null>(null);
  const [viewingQuestId, setViewingQuestId] = useState<string | null>(null);
  const [modalTab, setModalTab] = useState<'preview' | 'code' | 'report'>('preview');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState('');

  const viewingQuest = quests.find((q) => q.id === viewingQuestId) ?? null;
  const viewingHtml = viewingQuest ? extractHtmlFromQuest(viewingQuest) : null;

  const openResultModal = (quest: Quest, tab?: 'preview' | 'code' | 'report') => {
    setViewingQuestId(quest.id);
    setExportNotice(null);
    setPreviewDevice('desktop');
    const hasHtml = Boolean(extractHtmlFromQuest(quest));
    setModalTab(tab ?? (hasHtml ? 'preview' : 'report'));
  };

  const handleReviseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingQuest || !feedbackText.trim()) return;
    onReviseQuest(viewingQuest.id, feedbackText);
    setFeedbackText('');
    setViewingQuestId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmitQuest(title, description || title);
    setTitle('');
    setDescription('');
  };

  const handleCopy = async (id: string, text: string) => {
    const ok = await copyTextReliable(text);
    setCopiedId(ok ? id : 'failed');
    setExportNotice(
      ok
        ? '✅ Đã copy vào bộ nhớ tạm (Clipboard).'
        : '⚠️ Trình duyệt chặn copy tự động — hãy bấm Ctrl+A rồi Ctrl+C trong khung mã nguồn.'
    );
    setTimeout(() => setCopiedId((prev) => (prev === id || prev === 'failed' ? null : prev)), 1800);
  };

  const handleDownloadMd = (quest: Quest) => {
    const md = buildFullMarkdown(quest);
    const filename = `${quest.title.toLowerCase().replace(/[^a-z0-9]+/gi, '-') || 'quest-result'}.md`;
    const ok = triggerFileDownload(filename, md, 'text/markdown;charset=utf-8');
    const inIframe = typeof window !== 'undefined' && window.self !== window.top;
    setExportNotice(
      ok && !inIframe
        ? `✅ Đang tải file ${filename}`
        : '💡 Nếu khung preview chặn tải file tự động, hãy bấm "Copy" hoặc mở tab Mã nguồn / Báo cáo.'
    );
  };

  const handleDownloadHtml = (quest: Quest, htmlCode: string) => {
    const filename = `${quest.title.toLowerCase().replace(/[^a-z0-9]+/gi, '-') || 'landing-page'}-v${quest.revision}.html`;
    const ok = triggerFileDownload(filename, htmlCode, 'text/html;charset=utf-8');
    const inIframe = typeof window !== 'undefined' && window.self !== window.top;
    if (!viewingQuestId) {
      openResultModal(quest, 'code');
    }
    setExportNotice(
      ok && !inIframe
        ? `✅ Đang tải file ${filename}`
        : '⚠️ Khung preview sandbox có thể chặn tải file tự động — bạn hãy bấm "📋 Copy HTML" ở tab Mã nguồn hoặc tải bằng link "Lưu thủ công".'
    );
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
              const questHtml = quest.status === 'completed' ? extractHtmlFromQuest(quest) : null;

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
                    <div style={{ fontWeight: 600, fontSize: '13px', color: '#f1f5f9' }}>
                      {quest.title}{' '}
                      {quest.revision > 1 && (
                        <span style={{ fontSize: '10px', color: '#fbbf24', marginLeft: '4px' }}>
                          (v{quest.revision})
                        </span>
                      )}
                    </div>
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
                  {quest.finalOutput && quest.status === 'completed' && (
                    <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="pixel-btn pixel-btn-primary"
                          onClick={() => openResultModal(quest)}
                          style={{ flex: 1, justifyContent: 'center', fontSize: '11px', padding: '6px 8px' }}
                        >
                          {questHtml ? <Eye size={12} /> : <FileText size={12} />}
                          {questHtml ? 'Mở Web & Code' : 'Mở kết quả'}
                        </button>
                        {questHtml && (
                          <button
                            type="button"
                            className="pixel-btn"
                            onClick={() => openResultModal(quest, 'code')}
                            title="Xem & copy mã nguồn HTML"
                            style={{ fontSize: '11px', padding: '6px 8px' }}
                          >
                            <Code2 size={12} />
                            Code
                          </button>
                        )}
                        <button
                          type="button"
                          className="pixel-btn pixel-btn-gold"
                          onClick={() =>
                            questHtml ? handleDownloadHtml(quest, questHtml) : handleDownloadMd(quest)
                          }
                          title={questHtml ? 'Tải file HTML (.html)' : 'Tải báo cáo (.md)'}
                          style={{ fontSize: '11px', padding: '6px 8px' }}
                        >
                          <Download size={12} />
                          {questHtml ? '.html' : '.md'}
                        </button>
                      </div>
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
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 70,
            padding: '14px',
          }}
        >
          <div
            className="pixel-panel"
            style={{
              width: 'min(920px, 96vw)',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '12px 18px',
                borderBottom: '1px solid #303a4d',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              <div>
                <div className="font-pixel" style={{ fontSize: '11px', color: '#4ade80' }}>
                  🏆 KẾT QUẢ QUEST HOÀN THÀNH (v{viewingQuest.revision})
                </div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc', marginTop: '4px' }}>
                  {viewingQuest.title}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {viewingHtml && (
                  <button
                    type="button"
                    className="pixel-btn pixel-btn-gold"
                    onClick={() => handleDownloadHtml(viewingQuest, viewingHtml)}
                  >
                    <Globe size={13} />
                    Tải .html
                  </button>
                )}
                <button
                  type="button"
                  className="pixel-btn"
                  onClick={() => handleCopy('modal', viewingHtml || buildFullMarkdown(viewingQuest))}
                >
                  <Copy size={13} />
                  {copiedId === 'modal' ? 'Đã copy!' : viewingHtml ? 'Copy HTML' : 'Copy tất cả'}
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

            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {exportNotice && (
                <div
                  style={{
                    padding: '8px 12px',
                    background: 'rgba(56, 189, 248, 0.12)',
                    border: '1px solid rgba(56, 189, 248, 0.45)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#bae6fd',
                  }}
                >
                  {exportNotice}
                </div>
              )}

              {isSimulationMode && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '10px',
                    flexWrap: 'wrap',
                    padding: '9px 12px',
                    background: 'rgba(245, 158, 11, 0.12)',
                    border: '1px solid rgba(245, 158, 11, 0.45)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#fde68a',
                  }}
                >
                  <span>
                    ⚡ Đang chạy <strong>Simulation Mode</strong> (mẫu giả lập). Cài API Key thật để AI tự viết code &amp; nội dung theo yêu cầu!
                  </span>
                  {onOpenApiSettings && (
                    <button
                      type="button"
                      className="pixel-btn pixel-btn-gold"
                      style={{ fontSize: '11px', padding: '4px 10px' }}
                      onClick={() => {
                        setViewingQuestId(null);
                        onOpenApiSettings();
                      }}
                    >
                      <KeyRound size={12} />
                      Cài API Key
                    </button>
                  )}
                </div>
              )}

              {viewingHtml && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '8px',
                    flexWrap: 'wrap',
                    borderBottom: '1px solid #303a4d',
                    paddingBottom: '8px',
                  }}
                >
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className={`pixel-btn ${modalTab === 'preview' ? 'pixel-btn-primary' : ''}`}
                      style={{ fontSize: '12px', padding: '6px 12px' }}
                      onClick={() => setModalTab('preview')}
                    >
                      <Eye size={13} />
                      Xem trước Web
                    </button>
                    <button
                      type="button"
                      className={`pixel-btn ${modalTab === 'code' ? 'pixel-btn-primary' : ''}`}
                      style={{ fontSize: '12px', padding: '6px 12px' }}
                      onClick={() => setModalTab('code')}
                    >
                      <Code2 size={13} />
                      Mã nguồn HTML
                    </button>
                    <button
                      type="button"
                      className={`pixel-btn ${modalTab === 'report' ? 'pixel-btn-primary' : ''}`}
                      style={{ fontSize: '12px', padding: '6px 12px' }}
                      onClick={() => setModalTab('report')}
                    >
                      <FileText size={13} />
                      Báo cáo Team
                    </button>
                  </div>

                  {modalTab === 'preview' && (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        className={`pixel-btn ${previewDevice === 'desktop' ? 'pixel-btn-gold' : ''}`}
                        style={{ fontSize: '11px', padding: '4px 9px' }}
                        onClick={() => setPreviewDevice('desktop')}
                      >
                        <Monitor size={12} />
                        Desktop
                      </button>
                      <button
                        type="button"
                        className={`pixel-btn ${previewDevice === 'mobile' ? 'pixel-btn-gold' : ''}`}
                        style={{ fontSize: '11px', padding: '4px 9px' }}
                        onClick={() => setPreviewDevice('mobile')}
                      >
                        <Smartphone size={12} />
                        Mobile
                      </button>
                    </div>
                  )}
                </div>
              )}

              {viewingHtml && modalTab === 'preview' ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <iframe
                    title={`HTML Preview - ${viewingQuest.title}`}
                    srcDoc={viewingHtml}
                    sandbox="allow-scripts"
                    style={{
                      width: previewDevice === 'mobile' ? '390px' : '100%',
                      maxWidth: '100%',
                      height: '420px',
                      border: '1px solid #303a4d',
                      borderRadius: '8px',
                      background: '#ffffff',
                      transition: 'width 0.2s ease',
                    }}
                  />
                </div>
              ) : viewingHtml && modalTab === 'code' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                      File HTML hoàn chỉnh ({viewingHtml.length.toLocaleString()} ký tự) — có thể copy dán thành file <code>index.html</code>:
                    </span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <a
                        href={`data:text/html;charset=utf-8,${encodeURIComponent(viewingHtml)}`}
                        download={`${viewingQuest.title.toLowerCase().replace(/[^a-z0-9]+/gi, '-') || 'landing-page'}-v${viewingQuest.revision}.html`}
                        style={{ fontSize: '11px', color: '#38bdf8', textDecoration: 'underline' }}
                      >
                        Lưu thủ công (Save Link As)
                      </a>
                      <button
                        type="button"
                        className="pixel-btn pixel-btn-primary"
                        style={{ fontSize: '11px', padding: '5px 10px' }}
                        onClick={() => handleCopy('code-tab', viewingHtml)}
                      >
                        <Copy size={12} />
                        {copiedId === 'code-tab' ? 'Đã copy!' : 'Copy toàn bộ HTML'}
                      </button>
                    </div>
                  </div>
                  <textarea
                    readOnly
                    value={viewingHtml}
                    onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                    className="font-mono"
                    style={{
                      width: '100%',
                      height: '380px',
                      padding: '12px',
                      background: '#0d1117',
                      border: '1px solid #303a4d',
                      borderRadius: '8px',
                      color: '#86efac',
                      fontSize: '12px',
                      lineHeight: 1.5,
                      resize: 'vertical',
                    }}
                  />
                </div>
              ) : (
                <>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#fbbf24', marginBottom: '6px' }}>
                      👑 Báo cáo tổng hợp từ Manager (v{viewingQuest.revision})
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
                      {viewingHtml ? stripHtmlCodeBlocks(viewingQuest.finalOutput) : viewingQuest.finalOutput}
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
                            {(viewingHtml ? stripHtmlCodeBlocks(sub.output) : sub.output) || '(Không có đầu ra)'}
                          </pre>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Feedback / Revision Bar */}
            <form
              onSubmit={handleReviseSubmit}
              style={{
                padding: '12px 18px',
                borderTop: '1px solid #303a4d',
                background: '#0d1117',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#fbbf24' }}>
                💬 Chưa hài lòng? Nhập góp ý để Manager Alex & team làm lại (v{viewingQuest.revision + 1}):
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="VD: Viết ngắn gọn hơn, thêm ví dụ code cụ thể, đổi giọng văn..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    background: '#161b22',
                    border: '1px solid #303a4d',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <button type="submit" className="pixel-btn pixel-btn-gold" disabled={!feedbackText.trim()}>
                  <RotateCcw size={13} />
                  Yêu cầu làm lại
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
