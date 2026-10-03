// Confluence, Risk, Scanner, and Journal Contracts
import { Timeframe, MarketBias, SupportedExchange } from './market.types';
import { IndicatorsSnapshot } from './indicators.types';

export interface RiskManagementPlan {
  currentPrice: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  takeProfit3: number;
  riskRewardRatio: number;
  accountBalance: number;
  riskPercentage: number;
  maxCapitalAtRisk: number;
  suggestedPositionUsd: number;
  suggestedPositionUnits: number;
  recommendedLeverage: number;
  estimatedLiquidationPrice: number;
  invalidationTrigger: string;
}

export interface ConfluenceEvaluation {
  symbol: string;
  timeframe: Timeframe;
  evaluatedAt: string;
  confluenceScore: number; // 0 - 100
  marketBias: MarketBias;
  bullishCount: number;
  bearishCount: number;
  neutralCount: number;
  indicators: IndicatorsSnapshot;
  riskPlan: RiskManagementPlan;
  executiveNarrative: string;
  machinePayloadJson: string;
  idempotencyKey: string;
  latencyMs: number;
  aiEngine: string;
  userEmail?: string;
  userUid?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  symbol: string;
  timeframe: string;
  confluenceScore: number;
  bias: string;
  latencyMs: number;
  ipHash: string;
  userEmail?: string;
  userUid?: string;
}

export interface BullishCriteriaVerification {
  trend4h: boolean;
  rsi: boolean;
  funding: boolean;
  ema4tf: boolean;
  volume: boolean;
  chart1d: boolean;
  macd: boolean;
  obv: boolean;
  riskReward: boolean;
  criteriaMetCount: number;
  totalCriteria: number;
  calculatedRRR: number;
  isFullyQualified: boolean;
}

export interface MarketScannerItem {
  symbol: string;
  name: string;
  category: string;
  price: number;
  change24h: number;
  volume24hUsd: number;
  high24h: number;
  low24h: number;
  confluenceScore: number;
  bias: MarketBias;
  rsi: number;
  cvdDelta: number;
  fundingRate: number;
  openInterestDeltaPct: number;
  detectedPattern?: string;
  exchange: SupportedExchange;
  isHot?: boolean;
  bullishCriteria?: BullishCriteriaVerification;
}

export interface NewsSentimentItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  url?: string;
  publishedAt: string;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  score: number;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  relevantSymbols: string[];
  aiInsight: string;
}

export interface MacroSentimentMetrics {
  fearGreedIndex: number;
  fearGreedClassification: string;
  btcDominancePct: number;
  btcDominanceChange24h: number;
  totalMarketCapUsd: number;
  totalMarketCapChange24h: number;
  stablecoinInflow24hUsd: number;
  aggregateOiChange24h: number;
  aiMarketConsensus: string;
}

export interface JournalTradeEntry {
  id: string;
  timestamp: number;
  symbol: string;
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  exitPrice?: number;
  stopLoss: number;
  takeProfit: number;
  sizeUsd: number;
  leverage: number;
  status: 'OPEN' | 'CLOSED_WIN' | 'CLOSED_LOSS' | 'CANCELLED';
  pnlUsd?: number;
  pnlPct?: number;
  setupRationale: string;
  confluenceScoreAtEntry: number;
  exchange: SupportedExchange;
  notes?: string;
  closedAt?: number;
}
