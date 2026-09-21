import { IExchangeAdapter } from './IExchangeAdapter';
import { IAiProvider } from './IAiProvider';
import { CcxtExchangeAdapter } from './ccxtExchangeAdapter';
import { GeminiAiProvider } from './geminiAiProvider';
import { MockExchangeAdapter } from './mockExchangeAdapter';
import { MockAiProvider } from './mockAiProvider';

export * from './IExchangeAdapter';
export * from './IAiProvider';
export * from './ccxtExchangeAdapter';
export * from './geminiAiProvider';
export * from './mockExchangeAdapter';
export * from './mockAiProvider';

class AdapterRegistry {
  private defaultExchange: IExchangeAdapter = new CcxtExchangeAdapter('binance', 'Binance');
  private defaultAi: IAiProvider = new GeminiAiProvider();
  private mockExchange: IExchangeAdapter = new MockExchangeAdapter();
  private mockAi: IAiProvider = new MockAiProvider();

  getExchangeAdapter(useMock = false): IExchangeAdapter {
    return useMock ? this.mockExchange : this.defaultExchange;
  }

  getAiProvider(useMock = false): IAiProvider {
    return useMock ? this.mockAi : this.defaultAi;
  }
}

export const adapters = new AdapterRegistry();
