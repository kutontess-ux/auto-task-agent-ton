export type LLMProvider = 'simulation' | 'gemini' | 'openai' | 'openrouter' | 'custom';

export interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export const DEFAULT_MODELS: Record<LLMProvider, string> = {
  simulation: 'mock-sim-v1',
  gemini: 'gemini-3.5-flash-lite',
  openai: 'gpt-4o-mini',
  openrouter: 'google/gemini-3.5-flash-lite',
  custom: 'llama3.2',
};

export const DEFAULT_LLM_CONFIG: LLMConfig = {
  provider: 'simulation',
  apiKey: '',
  model: DEFAULT_MODELS.simulation,
  baseUrl: 'http://localhost:11434/v1',
};
