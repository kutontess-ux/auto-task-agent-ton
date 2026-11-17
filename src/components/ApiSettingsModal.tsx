import React, { useState } from 'react';
import { CheckCircle2, KeyRound, Loader2, RefreshCw, Save, X } from 'lucide-react';
import { callLLM, fetchGeminiModels } from '../services/llmClient';
import { DEFAULT_MODELS, LLMConfig, LLMProvider } from '../types/llm';

interface ApiSettingsModalProps {
  currentConfig: LLMConfig;
  onClose: () => void;
  onSave: (config: LLMConfig) => void;
}

const PROVIDERS: Array<{ id: LLMProvider; label: string; hint: string }> = [
  { id: 'simulation', label: 'Simulation (Giả lập)', hint: 'Không tốn phí API, chạy nhanh để test giao diện' },
  { id: 'gemini', label: 'Google Gemini', hint: 'Lấy key miễn phí tại aistudio.google.com' },
  { id: 'openai', label: 'OpenAI (ChatGPT)', hint: 'Dùng key từ platform.openai.com' },
  { id: 'openrouter', label: 'OpenRouter', hint: '1 key dùng nhiều model (Claude, Gemini, Llama...)' },
  { id: 'custom', label: 'Custom / Ollama', hint: 'Endpoint chuẩn OpenAI (VD: http://localhost:11434/v1)' },
];

const GEMINI_PRESETS = ['gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-2.5-flash'];

export const ApiSettingsModal: React.FC<ApiSettingsModalProps> = ({
  currentConfig,
  onClose,
  onSave,
}) => {
  const [provider, setProvider] = useState<LLMProvider>(currentConfig.provider);
  const [apiKey, setApiKey] = useState<string>(currentConfig.apiKey);
  const [model, setModel] = useState<string>(currentConfig.model);
  const [baseUrl, setBaseUrl] = useState<string>(currentConfig.baseUrl || 'http://localhost:11434/v1');
  const [geminiModels, setGeminiModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState<boolean>(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'ok' | 'error'>('idle');
  const [testMsg, setTestMsg] = useState<string>('');

  const handleProviderChange = (next: LLMProvider) => {
    setProvider(next);
    setModel(DEFAULT_MODELS[next]);
    setTestStatus('idle');
    setTestMsg('');
  };

  const handleLoadGeminiModels = async () => {
    setLoadingModels(true);
    setTestStatus('idle');
    setTestMsg('');
    try {
      const list = await fetchGeminiModels(apiKey);
      setGeminiModels(list);
      if (list.length > 0 && !list.includes(model)) {
        const preferred =
          list.find((m) => m.includes('flash-lite')) ||
          list.find((m) => m.includes('flash')) ||
          list[0];
        setModel(preferred);
      }
      setTestStatus('ok');
      setTestMsg(`Tìm thấy ${list.length} model khả dụng từ API Key của bạn.`);
    } catch (err) {
      setTestStatus('error');
      setTestMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingModels(false);
    }
  };

  const handleTest = async () => {
    if (provider === 'simulation') {
      setTestStatus('ok');
      setTestMsg('Chế độ Simulation sẵn sàng!');
      return;
    }
    setTestStatus('testing');
    setTestMsg('');
    try {
      const reply = await callLLM(
        { provider, apiKey, model, baseUrl },
        'You are a helpful assistant.',
        'Trả lời ngắn gọn đúng 1 câu: "Kết nối API thành công!"'
      );
      setTestStatus('ok');
      setTestMsg(reply.slice(0, 120));
    } catch (err) {
      const rawMsg = err instanceof Error ? err.message : String(err);
      if (provider === 'gemini' && rawMsg.includes('(404)')) {
        setTestMsg(
          `Lỗi 404: Model "${model}" không khả dụng trên key này (Google đã giới hạn 2.5 với key mới). Hãy bấm "Lấy model từ Key" hoặc chọn gemini-3.5-flash-lite / gemini-3.8-flash.`
        );
      } else {
        setTestMsg(rawMsg);
      }
      setTestStatus('error');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ provider, apiKey, model, baseUrl });
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.74)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 60,
      }}
    >
      <div className="pixel-panel" style={{ width: 'min(480px, 94vw)', maxHeight: '90vh', overflowY: 'auto', padding: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div className="font-pixel" style={{ fontSize: '12px', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <KeyRound size={15} />
            <span>CÀI ĐẶT AI API (BYOK)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px' }}>
              Nhà cung cấp (Provider)
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {PROVIDERS.map((p) => {
                const active = provider === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleProviderChange(p.id)}
                    style={{
                      textAlign: 'left',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: active ? '2px solid #38bdf8' : '1px solid #303a4d',
                      background: active ? '#1e293b' : '#0d1117',
                      color: '#f8fafc',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>{p.label}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{p.hint}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {provider !== 'simulation' && (
            <>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>
                  API Key {provider === 'custom' ? '(tuỳ chọn với Ollama)' : ''}
                </label>
                <input
                  type="password"
                  placeholder="Dán API Key của bạn vào đây..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    background: '#0d1117',
                    border: '1px solid #303a4d',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '13px',
                  }}
                />
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                  🔒 Key chỉ lưu trên trình duyệt (`localStorage`) và gọi trực tiếp tới API bạn chọn.
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '12px', color: '#cbd5e1' }}>Model</label>
                  {provider === 'gemini' && (
                    <button
                      type="button"
                      onClick={handleLoadGeminiModels}
                      disabled={loadingModels}
                      style={{
                        fontSize: '11px',
                        padding: '3px 8px',
                        borderRadius: '5px',
                        background: '#1e293b',
                        border: '1px solid #38bdf8',
                        color: '#38bdf8',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <RefreshCw size={11} />
                      {loadingModels ? 'Đang tải...' : 'Lấy model từ Key'}
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    background: '#0d1117',
                    border: '1px solid #303a4d',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '13px',
                  }}
                />

                {provider === 'gemini' && (
                  <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    {(geminiModels.length > 0 ? geminiModels.slice(0, 8) : GEMINI_PRESETS).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setModel(m)}
                        style={{
                          fontSize: '11px',
                          padding: '3px 7px',
                          borderRadius: '4px',
                          border: model === m ? '1px solid #38bdf8' : '1px solid #303a4d',
                          background: model === m ? '#1e3a8a' : '#0d1117',
                          color: model === m ? '#fff' : '#94a3b8',
                          cursor: 'pointer',
                        }}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {provider === 'custom' && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>
                    Base URL
                  </label>
                  <input
                    type="text"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: '#0d1117',
                      border: '1px solid #303a4d',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '13px',
                    }}
                  />
                </div>
              )}
            </>
          )}

          {testStatus !== 'idle' && (
            <div
              style={{
                padding: '8px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                background: testStatus === 'ok' ? '#14532d' : testStatus === 'error' ? '#4c0519' : '#1e293b',
                color: testStatus === 'ok' ? '#86efac' : testStatus === 'error' ? '#fda4af' : '#cbd5e1',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                lineHeight: 1.45,
              }}
            >
              {testStatus === 'testing' && <Loader2 size={14} />}
              {testStatus === 'ok' && <CheckCircle2 size={14} />}
              <span>{testStatus === 'testing' ? 'Đang kiểm tra kết nối...' : testMsg}</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
            <button type="button" className="pixel-btn" onClick={handleTest} disabled={testStatus === 'testing'}>
              Test kết nối
            </button>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" className="pixel-btn" onClick={onClose}>
                Hủy
              </button>
              <button type="submit" className="pixel-btn pixel-btn-primary">
                <Save size={14} />
                Lưu cấu hình
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
