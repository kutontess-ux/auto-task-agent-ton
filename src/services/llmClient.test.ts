import { describe, expect, it } from 'vitest';
import { parseJsonFromLLM } from './llmClient';

describe('parseJsonFromLLM', () => {
  it('parses JSON wrapped in markdown code fences', () => {
    const raw = '```json\n[{"assignedAgentId":"agent-coder","title":"Code UI"}]\n```';
    const parsed = parseJsonFromLLM<Array<{ assignedAgentId: string; title: string }>>(raw);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].assignedAgentId).toBe('agent-coder');
    expect(parsed[0].title).toBe('Code UI');
  });

  it('parses JSON even with leading prose', () => {
    const raw = 'Dưới đây là danh sách:\n[{"assignedAgentId":"agent-writer","title":"Viết docs"}]';
    const parsed = parseJsonFromLLM<Array<{ assignedAgentId: string; title: string }>>(raw);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].title).toBe('Viết docs');
  });
});
