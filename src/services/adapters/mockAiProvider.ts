import { IAiProvider, AiSynthesisOptions, AiSynthesisResult } from './IAiProvider';

export class MockAiProvider implements IAiProvider {
  readonly id = 'mock';
  readonly name = 'Mock Quantitative AI Engine';

  isConfigured(): boolean {
    return true;
  }

  async generateSynthesis(prompt: string, _options?: AiSynthesisOptions): Promise<AiSynthesisResult | null> {
    return {
      text: `[Deterministic Mock Synthesis]\nPrompt length: ${prompt.length} chars.\nMarket is consolidating in Golden Pocket. Key invalidation strictly respected.`,
      providerName: 'Mock Quantitative Engine v1.0',
      model: 'mock-flash',
      latencyMs: 5,
      usedFallback: false,
    };
  }
}
