import { IExchangeAdapter, ExchangeTicker, ExchangeOrderBook } from './IExchangeAdapter';
import { OHLCVCandle, Timeframe } from '../../types/crypto.types';
import { generateDeterministicCandles } from '../ccxtService';

export class MockExchangeAdapter implements IExchangeAdapter {
  readonly exchangeId = 'mock';
  readonly name = 'Mock Paper Exchange';

  async fetchTicker(symbol: string): Promise<ExchangeTicker> {
    return {
      symbol,
      price: 65000,
      change24h: 2.5,
      volume24h: '$500M',
      high24h: 66000,
      low24h: 64000,
      timestamp: Date.now(),
    };
  }

  async fetchTickers(symbols: string[] = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT']): Promise<ExchangeTicker[]> {
    return symbols.map((sym) => ({
      symbol: sym,
      price: sym.startsWith('BTC') ? 65000 : sym.startsWith('ETH') ? 3500 : 180,
      change24h: 1.5,
      volume24h: '$250M',
      timestamp: Date.now(),
    }));
  }

  async fetchOHLCV(symbol: string, timeframe: Timeframe, limit: number = 85): Promise<OHLCVCandle[]> {
    return generateDeterministicCandles(symbol, timeframe, limit);
  }

  async fetchOrderBook(symbol: string): Promise<ExchangeOrderBook> {
    return {
      symbol,
      bids: [[64950, 2.5], [64900, 4.0]],
      asks: [[65050, 1.8], [65100, 3.2]],
      timestamp: Date.now(),
    };
  }
}
