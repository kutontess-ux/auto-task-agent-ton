import { LLMConfig } from '../types/llm';

export async function callLLM(
  config: LLMConfig,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  if (config.provider === 'simulation') {
    throw new Error('Simulation mode does not call external LLM APIs.');
  }

  if (config.provider !== 'custom' && !config.apiKey.trim()) {
    throw new Error('Thiếu API Key. Vui lòng nhập API Key trong API Settings.');
  }

  if (config.provider === 'gemini') {
    const rawModel = config.model.trim() || 'gemini-3.5-flash-lite';
    const model = rawModel.replace(/^models\//, '');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model
    )}:generateContent?key=${encodeURIComponent(config.apiKey.trim())}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API (${res.status}): ${errText.slice(0, 200)}`);
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('Gemini API không trả về nội dung.');
    }
    return text;
  }

  // OpenAI, OpenRouter, or Custom OpenAI-compatible endpoint
  let endpoint = 'https://api.openai.com/v1/chat/completions';
  if (config.provider === 'openrouter') {
    endpoint = 'https://openrouter.ai/api/v1/chat/completions';
  } else if (config.provider === 'custom') {
    const base = (config.baseUrl || 'http://localhost:11434/v1').replace(/\/+$/, '');
    endpoint = `${base}/chat/completions`;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (config.apiKey.trim()) {
    headers['Authorization'] = `Bearer ${config.apiKey.trim()}`;
  }
  if (config.provider === 'openrouter') {
    headers['HTTP-Referer'] = window.location.origin;
    headers['X-Title'] = 'Pixel Agent HQ';
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: config.model.trim() || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`API (${res.status}): ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('LLM API không trả về nội dung.');
  }
  return content;
}

export function parseJsonFromLLM<T>(raw: string): T {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  const firstBracket = cleaned.indexOf('[');
  const firstBrace = cleaned.indexOf('{');
  let start = -1;
  if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
    start = firstBracket;
  } else if (firstBrace !== -1) {
    start = firstBrace;
  }

  if (start > 0) {
    return JSON.parse(cleaned.slice(start)) as T;
  }
  return JSON.parse(cleaned) as T;
}

export async function fetchGeminiModels(apiKey: string): Promise<string[]> {
  if (!apiKey.trim()) {
    throw new Error('Vui lòng nhập Gemini API Key trước.');
  }
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey.trim())}`
  );
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Không lấy được danh sách model (${res.status}): ${txt.slice(0, 150)}`);
  }
  const data = (await res.json()) as {
    models?: Array<{ name: string; supportedGenerationMethods?: string[] }>;
  };
  return (data.models || [])
    .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
    .map((m) => m.name.replace(/^models\//, ''));
}
