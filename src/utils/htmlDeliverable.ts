import { Quest } from '../types/quest';

const WEB_KEYWORDS =
  /\b(html|landing\s*page|landing|web|website|webapp|dashboard|portfolio|homepage|trang\s*chủ|trang\s*web|giao\s*diện|ui|form)\b/i;

export function isWebDeliverableQuest(title: string, description = ''): boolean {
  return WEB_KEYWORDS.test(`${title} ${description}`);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildSimulatedHtmlTemplate(quest: Quest): string {
  const safeTitle = escapeHtml(quest.title);
  const safeDesc = escapeHtml(
    quest.description || 'Trang giới thiệu sản phẩm hiện đại, tối ưu chuyển đổi và tương thích mọi thiết bị.'
  );
  const latestFeedback =
    quest.feedbackHistory.length > 0
      ? escapeHtml(quest.feedbackHistory[quest.feedbackHistory.length - 1])
      : null;

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle} (v${quest.revision})</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      background: #0b1120;
      color: #e2e8f0;
      line-height: 1.6;
    }
    .container { max-width: 1080px; margin: 0 auto; padding: 0 20px; }
    header {
      border-bottom: 1px solid #1e293b;
      padding: 18px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .logo { font-weight: 800; font-size: 18px; color: #38bdf8; letter-spacing: 0.5px; }
    .nav-cta {
      background: #38bdf8;
      color: #0f172a;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 700;
      text-decoration: none;
      font-size: 14px;
    }
    .hero {
      padding: 72px 0 56px;
      text-align: center;
      background: radial-gradient(circle at top, rgba(56, 189, 248, 0.16), transparent 60%);
    }
    .pill {
      display: inline-block;
      padding: 5px 12px;
      border-radius: 999px;
      background: rgba(251, 191, 36, 0.15);
      border: 1px solid rgba(251, 191, 36, 0.4);
      color: #fbbf24;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 16px;
    }
    h1 { font-size: clamp(28px, 5vw, 48px); line-height: 1.2; color: #f8fafc; margin-bottom: 16px; }
    .subtitle { max-width: 660px; margin: 0 auto 28px; color: #94a3b8; font-size: 17px; }
    .actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
    .btn-primary {
      background: linear-gradient(135deg, #38bdf8, #3b82f6);
      color: #fff;
      padding: 12px 24px;
      border-radius: 10px;
      font-weight: 700;
      text-decoration: none;
    }
    .btn-secondary {
      border: 1px solid #334155;
      color: #e2e8f0;
      padding: 12px 24px;
      border-radius: 10px;
      font-weight: 600;
      text-decoration: none;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 18px;
      padding: 40px 0 72px;
    }
    .card {
      background: #111827;
      border: 1px solid #1e293b;
      border-radius: 12px;
      padding: 22px;
    }
    .card h3 { color: #f8fafc; font-size: 17px; margin-bottom: 8px; }
    .card p { color: #94a3b8; font-size: 14px; }
    footer {
      border-top: 1px solid #1e293b;
      padding: 24px 0;
      text-align: center;
      color: #64748b;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="logo">⚡ ${safeTitle}</div>
      <a href="#features" class="nav-cta">Bắt đầu ngay</a>
    </header>

    <section class="hero">
      <div class="pill">Mẫu HTML Starter · Phiên bản v${quest.revision}${latestFeedback ? ` · Đã cập nhật: ${latestFeedback}` : ''}</div>
      <h1>${safeTitle}</h1>
      <p class="subtitle">${safeDesc}</p>
      <div class="actions">
        <a href="#features" class="btn-primary">Khám phá tính năng</a>
        <a href="#contact" class="btn-secondary">Liên hệ tư vấn</a>
      </div>
    </section>

    <section id="features" class="grid">
      <div class="card">
        <h3>🚀 Tốc độ &amp; Hiệu năng</h3>
        <p>Thiết kế gọn nhẹ, không phụ thuộc thư viện nặng, tải trang tức thì trên mọi trình duyệt.</p>
      </div>
      <div class="card">
        <h3>🎨 Giao diện Responsive</h3>
        <p>Tự động co giãn mượt mà trên cả máy tính, máy tính bảng và điện thoại di động.</p>
      </div>
      <div class="card">
        <h3>🔒 Sẵn sàng tùy biến</h3>
        <p>Cài API Key thật (Gemini/OpenAI/OpenRouter) để AI tự viết nội dung và thiết kế riêng cho dự án của bạn.</p>
      </div>
    </section>

    <footer id="contact">
      Được tạo bởi Pixel Agent HQ (Kai Coder · Lyra Writer · Vex Reviewer · Alex Manager)
    </footer>
  </div>
</body>
</html>`;
}

function normalizeHtmlCandidate(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/<!doctype\s+html|<html[\s>]/i.test(trimmed)) {
    return trimmed;
  }
  if (/<(body|section|main|header|div|style|h1)[\s>]/i.test(trimmed)) {
    return `<!DOCTYPE html>\n<html lang="vi">\n<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>\n<body>\n${trimmed}\n</body>\n</html>`;
  }
  return null;
}

export function extractHtmlFromText(text: string | null | undefined): string | null {
  if (!text) return null;

  // 1. Prefer fenced ```html ... ``` code blocks
  const htmlBlockRegex = /```html\s*([\s\S]*?)```/gi;
  let match: RegExpExecArray | null;
  while ((match = htmlBlockRegex.exec(text)) !== null) {
    const candidate = normalizeHtmlCandidate(match[1]);
    if (candidate) return candidate;
  }

  // 2. Fallback to generic fenced blocks containing full HTML document
  const genericBlockRegex = /```[a-z]*\s*([\s\S]*?)```/gi;
  while ((match = genericBlockRegex.exec(text)) !== null) {
    if (/<!doctype\s+html|<html[\s>]/i.test(match[1])) {
      const candidate = normalizeHtmlCandidate(match[1]);
      if (candidate) return candidate;
    }
  }

  // 3. Fallback to raw <!DOCTYPE html>...</html> or <html>...</html>
  const rawDocMatch = text.match(/(<!DOCTYPE\s+html[\s\S]*?<\/html>|<html[\s\S]*?<\/html>)/i);
  if (rawDocMatch) {
    return rawDocMatch[1].trim();
  }

  return null;
}

export function extractHtmlFromQuest(quest: Quest): string | null {
  const fromFinal = extractHtmlFromText(quest.finalOutput);
  if (fromFinal) return fromFinal;

  for (const sub of quest.subtasks) {
    const fromSub = extractHtmlFromText(sub.output);
    if (fromSub) return fromSub;
  }

  return null;
}
