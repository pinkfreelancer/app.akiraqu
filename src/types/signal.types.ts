// Trading Signals, Screening & Watchlist Data Contracts

import { Timeframe, SupportedExchange, CryptoCategory } from './market.types';

export type SignalDirection = 'LONG' | 'SHORT';
export type SignalGrade = 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';
export type SignalStatus = 'ACTIVE' | 'TP1_HIT' | 'TP2_HIT' | 'TP3_HIT' | 'SL_HIT' | 'EXPIRED';

export type SignalPipelineStage =
  | 'INGEST'
  | 'INSTITUTIONAL_LOGIC'
  | 'RISK_FILTER'
  | 'PUBLISHED'
  | 'TRACKING';

export type SignalTriggerType =
  | 'VOLUME_ANOMALY'
  | 'BREAKOUT'
  | 'MSS'
  | 'ORDER_BLOCK_RETEST'
  | 'FVG_SWEEP'
  | 'PATTERN_COMPLETION';

export interface AuditTrailItem {
  timestamp: string;
  event: string;
  price: number;
  pnlPct: number;
}

export interface CryptoTradingSignal {
  id: string;
  symbol: string;
  name: string;
  category: string;
  exchange: SupportedExchange;
  direction: SignalDirection;
  grade: SignalGrade;
  timeframe: Timeframe;
  strategyName: string;
  strategyCategory: 'SMC' | 'TREND' | 'DIVERGENCE' | 'ORDERFLOW' | 'AI_CONFLUENCE' | 'VOLATILITY';
  confluenceScore: number;
  winRateProbability: number;
  entryPrice: number;
  currentPrice: number;
  targetPrice1: number;
  targetPrice2: number;
  targetPrice3: number;
  stopLoss: number;
  riskRewardRatio: number;
  leverageRec: number;
  status: SignalStatus;
  pnlPctCurrent: number;
  createdAt: string;
  expiresAt: string;
  indicatorsSummary: string[];
  notes: string;
  // Workflow Pipeline & MarketOwl Spec
  pipelineStage?: SignalPipelineStage;
  triggerType?: SignalTriggerType;
  triggerDetails?: string;
  fundingRate?: number;
  fundingBias?: FundingRateBias;
  liquidationDeltaUsd?: number;
  hasStopLoss?: boolean;
  isRiskRewardValid?: boolean;
  riskStatus?: 'PASSED' | 'WARNING' | 'REJECTED';
  riskWarningMessage?: string;
  officialTimestamp?: string;
  verificationHash?: string;
  highestPnlReached?: number;
  auditTrail?: AuditTrailItem[];
  closedAt?: string;
  exitPrice?: number;
  realizedPnlPct?: number;
}

export type MacdStatus = 'BULLISH_CROSS' | 'BEARISH_CROSS' | 'BULLISH' | 'BEARISH' | 'NEUTRAL';
export type SuperTrendStatus = 'BULLISH' | 'BEARISH';
export type FundingRateBias = 'EXTREME_NEGATIVE' | 'NEGATIVE' | 'NEUTRAL' | 'POSITIVE' | 'EXTREME_POSITIVE';

export interface CryptoScreenerCoin {
  symbol: string;
  name: string;
  category: CryptoCategory;
  price: number;
  change24h: number;
  change7d: number;
  volume24hUsd: number;
  marketCapUsd: number;
  rsi14: number;
  macdStatus: MacdStatus;
  supertrend: SuperTrendStatus;
  fundingRate8h: number;
  fundingBias: FundingRateBias;
  openInterestChange24h: number;
  volatilityAtrPct: number;
  confluenceScore: number;
  sparkline: number[];
  signalGrade: SignalGrade;
}

export interface ScreenerFilterState {
  search: string;
  category: string;
  marketCapTier: 'ALL' | 'LARGE' | 'MID' | 'SMALL' | 'MICRO';
  rsiRange: 'ALL' | 'OVERSOLD' | 'NORMAL' | 'OVERBOUGHT';
  macdFilter: 'ALL' | 'BULLISH' | 'BEARISH' | 'CROSS_ONLY';
  supertrendFilter: 'ALL' | 'BULLISH' | 'BEARISH';
  fundingFilter: 'ALL' | 'NEGATIVE_SQUEEZE' | 'POSITIVE' | 'NEUTRAL';
  minConfluence: number;
  sortBy: 'confluenceScore' | 'change24h' | 'volume24hUsd' | 'rsi14' | 'marketCapUsd';
  sortOrder: 'asc' | 'desc';
}

export interface WatchlistFolder {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
}

export interface WatchlistItem {
  id: string;
  folderId: string;
  symbol: string;
  name: string;
  category: string;
  currentPrice: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  marketCap: number;
  confluenceScore: number;
  sparkline: number[];
  alertPriceHigh?: number;
  alertPriceLow?: number;
  notes?: string;
  addedAt: string;
}
