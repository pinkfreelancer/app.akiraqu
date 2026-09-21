import { OHLCVCandle, Timeframe, MarketType } from '../../types/crypto.types';

export interface ExchangeTicker {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: string;
  high24h?: number;
  low24h?: number;
  timestamp?: number;
}

export interface ExchangeOrderBook {
  symbol: string;
  bids: [number, number][]; // [price, amount]
  asks: [number, number][];
  timestamp?: number;
}

export interface IExchangeAdapter {
  readonly exchangeId: string;
  readonly name: string;

  fetchTicker(symbol: string, marketType?: MarketType): Promise<ExchangeTicker>;
  fetchTickers(symbols?: string[], marketType?: MarketType): Promise<ExchangeTicker[]>;
  fetchOHLCV(symbol: string, timeframe: Timeframe, limit?: number, marketType?: MarketType): Promise<OHLCVCandle[]>;
  fetchOrderBook(symbol: string, limit?: number, marketType?: MarketType): Promise<ExchangeOrderBook>;
  testCredentials?(apiKey: string, apiSecret: string, passphrase?: string): Promise<{ success: boolean; message?: string }>;
}
