import { SupportedExchange, MarketType } from './market.types';

export type ManualOrderSide = 'BUY' | 'SELL' | 'LONG' | 'SHORT';
export type ManualOrderType = 'LIMIT' | 'MARKET' | 'STOP_LIMIT' | 'TRAILING_STOP' | 'OCO';
export type PositionMarginMode = 'ISOLATED' | 'CROSS';
export type TimeInForce = 'GTC' | 'IOC' | 'FOK';

export interface OpenPosition {
  id: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  size: number;
  sizeUsd: number;
  entryPrice: number;
  markPrice: number;
  liquidationPrice: number;
  margin: number;
  leverage: number;
  marginMode: PositionMarginMode;
  unrealizedPnl: number;
  unrealizedPnlPct: number;
  stopLoss?: number;
  takeProfit?: number;
  exchange: SupportedExchange;
  marketType: MarketType;
  timestamp: number;
}

export interface ActiveOrder {
  id: string;
  symbol: string;
  side: ManualOrderSide;
  type: ManualOrderType;
  price: number;
  triggerPrice?: number;
  amount: number;
  totalUsd: number;
  filled: number;
  status: 'NEW' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELED';
  timestamp: number;
  exchange: SupportedExchange;
}

export interface PortfolioAsset {
  asset: string;
  name: string;
  total: number;
  available: number;
  inOrders: number;
  avgBuyPrice: number;
  currentPrice: number;
  valueUsd: number;
  pnl24h: number;
  pnl24hPct: number;
  unrealizedPnl: number;
  unrealizedPnlPct: number;
  allocationPct: number;
}

export interface ExchangeBalance {
  exchange: SupportedExchange;
  name: string;
  totalUsd: number;
  spotUsd: number;
  futuresUsd: number;
  unrealizedPnlUsd: number;
  connected: boolean;
}

export interface TradingReportSummary {
  netProfitUsd: number;
  netProfitPct: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  profitFactor: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  maxDrawdownUsd: number;
  avgWinUsd: number;
  avgLossUsd: number;
  avgRiskReward: number;
  avgTradeDuration: string;
  totalVolumeUsd: number;
  totalFeesPaid: number;
  longWinRate: number;
  shortWinRate: number;
  monthlyPnl: { month: string; pnl: number; trades: number; winRate: number }[];
  dailyHeatmap: { date: string; pnl: number; count: number }[];
}

export type TradingHubTab = 'manual' | 'bot' | 'journal' | 'portfolio' | 'report';
