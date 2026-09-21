// Trading Signals, Screening & Watchlist Data Contracts

import { Timeframe, SupportedExchange, CryptoCategory } from './market.types';

export type SignalDirection = 'LONG' | 'SHORT';
export type SignalGrade = 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';

// AKIRAQU Institutional Signal Taxonomy & Lifecycle Spec
export type SignalModelCategory = 'ALPHA' | 'GAMMA' | 'CLASSIC' | 'INV';
export type SignalStrength = 'NORMAL' | 'STRONG';
export type SignalResolution = '1H' | '4H' | '8H' | '12H' | '1D' | '1W';

export type SignalLifecycleStatus =
  | 'PENDING'
  | 'R1'
  | 'R2'
  | 'R3'
  | 'R4'
  | 'R5'
  | 'R6'
  | 'R7'
  | 'R8'
  | 'TRAILING'
  | 'TAKEPROFIT'
  | 'STOPLOSS'
  | 'EXPIRED';

// Legacy compatibility
export type SignalStatus = 'ACTIVE' | 'TP1_HIT' | 'TP2_HIT' | 'TP3_HIT' | 'SL_HIT' | 'EXPIRED' | SignalLifecycleStatus;

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

export interface SignalPriceLevels {
  entry: number;
  r1: number;
  r2: number;
  r3: number;
  r4: number;
  r5: number;
  r6: number;
  r7: number;
  r8: number;
  s1: number;
  s2: number;
  s3: number;
  s4: number;
  trailingStop?: number;
  isTrailingActive?: boolean;
}

export interface CryptoTradingSignal {
  id: string;
  symbol: string;
  name: string;
  category: string;
  exchange: SupportedExchange;
  direction: SignalDirection;
  grade: SignalGrade;
  timeframe: Timeframe | SignalResolution;
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
  
  // AKIRAQU 4-Dimensional Taxonomy & Level Framework
  modelCategory?: SignalModelCategory;
  strength?: SignalStrength;
  resolution?: SignalResolution;
  lifecycleStatus?: SignalLifecycleStatus;
  priceLevels?: SignalPriceLevels;
  highestRReached?: number; // 0 to 8
  isTrailingActive?: boolean;
  trailingStopPrice?: number;
  realizedPnlPct?: number;
  outcomeResult?: 'WIN' | 'LOSS' | 'EXPIRED' | 'IN_PROGRESS';

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
