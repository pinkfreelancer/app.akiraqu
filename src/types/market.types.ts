// Market Primitives and Exchange Contracts

export type Timeframe = '1m' | '5m' | '15m' | '1H' | '4H' | '1D' | '1W';

export type StageId =
  // 1. PASAR & SCREENING
  | 'ticker'
  | 'signal'
  | 'market_heatmap'
  | 'gainers_losers'
  | 'screening'
  | 'scanner'
  | 'watchlist'
  // 2. DATA MAKRO & KONTEKS
  | 'btc_dominance'
  | 'onchain_data'
  | 'economic_calendar'
  | 'sentiment'
  // 3. INDIKATOR & SCREENING TEKNIKAL
  | 'indicators'
  | 'confluence'
  | 'mtf_screener'
  | 'orderflow'
  | 'volatility_scanner'
  | 'correlation_beta'
  // 4. RISET & STRATEGI
  | 'risk'
  | 'backtest'
  | 'return_distribution'
  | 'output'
  // 5. EKSEKUSI AKTIF
  | 'active_orders'
  | 'manual_trading'
  | 'trading'
  | 'bot'
  | 'position_sizing'
  // 6. KONEKSI & ALERT
  | 'multi_exchange'
  | 'alerts'
  | 'portfolio'
  // 7. EVALUASI & RIWAYAT
  | 'journal'
  | 'reports'
  // 8. SISTEM
  | 'settings';

export type NavCategory = 'ALL' | 'MARKET' | 'ANALYSIS' | 'EXECUTION';

export type SupportedExchange = 'BINANCE' | 'OKX' | 'BYBIT' | 'KUCOIN' | 'BITGET' | 'CRYPTO_COM' | 'BITUNIX';
export type MarketType = 'SPOT' | 'FUTURES';

export interface ExchangeOptionInfo {
  id: SupportedExchange;
  name: string;
  shortName: string;
  tag: string;
  brandColor: string;
  borderColor: string;
  bgColor: string;
  hasSpot: boolean;
  hasFutures: boolean;
  description: string;
}

export type MarketBias =
  | 'Strong Bullish'
  | 'Bullish'
  | 'Neutral'
  | 'Bearish'
  | 'Strong Bearish';

export type SignalType = 'BULLISH' | 'BEARISH' | 'NEUTRAL';

export interface OHLCVCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type CryptoCategory =
  | 'Layer 1'
  | 'Layer 2'
  | 'DeFi'
  | 'AI / Data'
  | 'Meme'
  | 'Infrastructure'
  | 'RWA / Infra'
  | 'Gaming'
  | string;

export interface CryptoSymbolInfo {
  symbol: string;
  name: string;
  category: CryptoCategory;
  basePrice: number;
  change24h: number;
  volume24h: string;
  volatility: number;
}

export interface LiveOrderBookLevel {
  price: number;
  amount: number;
  total: number;
}

export interface LiveTradeTick {
  id: string | number;
  time: string;
  timestamp: number; // Server event timestamp (E)
  price: number;
  amount: number;
  isBuy: boolean;
}

export interface WebSocketSyncMetrics {
  serverEventTime: number; // Binance/OKX Event Timestamp 'E'
  clientReceivedTime: number;
  deltaLatencyMs: number;
  streamProtocol: string; // e.g. '@aggTrade' | '@depth@100ms' | 'OKX-v5'
  fpsRenderRate: number; // UI Raf Throttled render FPS
  droppedTicksSaved: number;
  isFuturesAligned: boolean;
}

export interface ExchangeApiCredential {
  id: string;
  name: string;
  exchange: SupportedExchange;
  marketType: MarketType; // 'SPOT' | 'FUTURES'
  apiKey: string;
  apiSecret: string;
  passphrase?: string; // Optional passphrase for OKX/KuCoin/Bitget
  isTestnet: boolean;
  isDemo?: boolean; // Demo account / Paper Trading Sandbox
  status: 'CONNECTED' | 'UNTESTED' | 'ERROR' | 'TESTING';
  permissions: {
    readOnly: boolean;
    spotTrading: boolean;
    futuresTrading: boolean;
    withdrawEnabled: boolean; // Enforced disabled
  };
  lastTestedAt?: number;
  latencyMs?: number;
  accountBalanceUsd?: number;
  initialDemoBalanceUsd?: number;
  createdTime: number;

  // Encrypted Vault Properties (Server-Side AES-256-GCM)
  isEncrypted?: boolean;
  maskedKey?: string;
  cipherBlob?: string;
  iv?: string;
  tag?: string;
  version?: number;
}
