// Backtesting and AI Pattern Learning Contracts
import { Timeframe } from './market.types';
import { IndicatorKey } from './indicators.types';

export interface BacktestConfig {
  initialCapital: number;
  riskPerTradePercent: number;
  takeProfitRRR: number;
  stopLossPercent: number;
  feePercent: number;
  slippagePercent?: number;
  allowShorting: boolean;
  usePartialTakeProfit?: boolean;
  useTrailingStop?: boolean;
}

export type BacktestDataSourceType = 'api' | 'offline_preset' | 'custom_upload';

export type OfflinePresetId =
  | 'bull_breakout'
  | 'flash_crash_recovery'
  | 'range_chop'
  | 'bear_waterfall'
  | 'alt_momentum';

export interface OfflinePresetScenario {
  id: OfflinePresetId;
  name: string;
  nameId: string;
  description: string;
  descriptionId: string;
  symbol: string;
  timeframe: Timeframe;
  regime: 'Bullish Trend' | 'High Volatility' | 'Range-Bound' | 'Bearish Downtrend' | 'Altcoin Momentum';
  candleCount: number;
}

export interface BacktestTrade {
  id: string;
  entryBar: number;
  entryTime: number;
  entryPrice: number;
  direction: 'LONG' | 'SHORT';
  exitBar: number;
  exitTime: number;
  exitPrice: number;
  pnlUsd: number;
  pnlPercent: number;
  result: 'WIN' | 'LOSS' | 'BREAKEVEN';
  exitReason: 'TAKE_PROFIT' | 'STOP_LOSS' | 'SIGNAL_REVERSAL' | 'END_OF_DATA' | 'PARTIAL_TP';
  holdingBars: number;
  indicatorSignal: string;
  slippageDeductionUsd?: number;
  feeDeductionUsd?: number;
  confluenceScoreAtEntry?: number;
}

export interface EquityPoint {
  time: number;
  date: string;
  equity: number;
  drawdownPercent: number;
  tradeIndex?: number;
}

export interface AIPatternLearnedRule {
  id: string;
  title: string;
  condition: string;
  action: string;
  confidence: number;
  winRateImpact: string;
  type: 'ENTRY_FILTER' | 'EXIT_TIMING' | 'RISK_CONTAINMENT';
}

export interface AISynergyItem {
  indicators: string;
  winRate: number;
  tradesCount: number;
  status: 'EXCELLENT' | 'GOOD' | 'NEUTRAL' | 'POOR';
  profitFactor: number;
}

export interface AIPatternInsight {
  summary: string;
  marketRegimeDetected: string;
  learnedRules: AIPatternLearnedRule[];
  edgeDiscovery: string[];
  riskLeaks: string[];
  synergyMatrix: AISynergyItem[];
  optimizedParameters: {
    recommendedIndicator: IndicatorKey;
    stopLossPercent: number;
    takeProfitRRR: number;
    slippagePercent?: number;
    minConfluenceScore?: number;
    explanation: string;
  };
  aiEngine: string;
  generatedAt: string;
}

export interface BacktestResult {
  symbol: string;
  timeframe: Timeframe;
  indicatorKey: IndicatorKey;
  indicatorName: string;
  dataSource: BacktestDataSourceType;
  totalCandles: number;
  initialBalance: number;
  finalBalance: number;
  netProfitUsd: number;
  netProfitPercent: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakevenTrades?: number;
  winRate: number;
  profitFactor: number;
  maxDrawdownPercent: number;
  maxDrawdownUsd: number;
  sharpeRatio: number;
  sortinoRatio?: number;
  calmarRatio?: number;
  expectancyUsd?: number;
  expectancyR?: number;
  maxConsecutiveWins?: number;
  maxConsecutiveLosses?: number;
  averageTradePnlPercent: number;
  averageWinPercent: number;
  averageLossPercent: number;
  trades: BacktestTrade[];
  equityCurve: EquityPoint[];
  parametersUsed: Record<string, any>;
  isVerifiedDefault: boolean;
  aiInsights?: AIPatternInsight;
}
