// Automated Trading Bot and Paper Execution Contracts
import { SupportedExchange, MarketType } from './market.types';

export type BotStrategyType =
  | 'GRID_BOT'
  | 'QFL_BOT'
  | 'DCA_BOT'
  | 'BTD_BOT'
  | 'LOOP_BOT'
  | 'CONFLUENCE_TREND'
  | 'LIQUIDITY_SWEEP_REVERSAL'
  | 'GRID_SCALPER'
  | 'VWAP_MEAN_REVERSION';

export interface GridBotParams {
  gridType: 'ARITHMETIC' | 'GEOMETRIC';
  direction: 'NEUTRAL' | 'LONG' | 'SHORT';
  lowerPrice: number;
  upperPrice: number;
  gridQuantity: number;
  profitPerGridPct: number;
  gridSpacingPct: number;
  trailingUp: boolean;
  trailingDown: boolean;
  stopLossPrice?: number;
  takeProfitPrice?: number;
  triggerPrice?: number;
}

export interface QflBotParams {
  baseTimeframe: '15m' | '1h' | '4h' | '1d';
  basePrice: number;
  crackPct: number;
  reboundTargetPct: number;
  stopLossPct: number;
  minVolumeSpikeRatio: number;
  layerCount: number;
  maxHoldingHours: number;
}

export interface DcaBotParams {
  baseOrderSizeUsd: number;
  safetyOrderSizeUsd: number;
  priceDeviationPct: number;
  maxSafetyOrders: number;
  volumeMultiplier: number;
  stepMultiplier: number;
  targetTakeProfitPct: number;
  trailingTakeProfitPct?: number;
  stopLossPct?: number;
}

export interface BtdBotParams {
  dipTriggerPct: number;
  dipTimeframeMinutes: number;
  rsiMaxThreshold: number;
  requireLiquidationSpike: boolean;
  minLiquidationUsd: number;
  ladderTranches: { step: number; dropPct: number; allocationPct: number }[];
  takeProfitPct: number;
  trailingStopPct?: number;
}

export interface LoopBotParams {
  cycleDirection: 'AUTO_TREND' | 'LONG_ONLY' | 'SHORT_ONLY' | 'REVERSE_ON_CLOSE';
  profitPerCyclePct: number;
  cycleCooldownSeconds: number;
  autoCompoundPct: number;
  maxCycles: number;
  completedCycles: number;
  cycleStopLossPct: number;
}

export interface TradingBotConfig {
  id: string;
  name: string;
  type: BotStrategyType;
  isActive: boolean;
  mode: 'PAPER_SIMULATION' | 'WEBHOOK_ALERTS' | 'EXCHANGE_API';
  allocatedCapitalUsd: number;
  riskPerTradePct: number;
  maxDailyLossPct: number;
  targetSymbols: string[];
  minConfluenceScore: number;
  minRiskRewardRatio: number;
  leverage: number;
  exchange: SupportedExchange;
  marketType: MarketType;
  emergencyKillSwitch: boolean;
  gridParams?: GridBotParams;
  qflParams?: QflBotParams;
  dcaParams?: DcaBotParams;
  btdParams?: BtdBotParams;
  loopParams?: LoopBotParams;
}

export interface BotExecutionLog {
  id: string;
  botId: string;
  timestamp: number;
  symbol: string;
  action: 'BUY_LONG' | 'SELL_SHORT' | 'CLOSE_TAKE_PROFIT' | 'CLOSE_STOP_LOSS' | 'SIGNAL_ALERT' | 'SAFETY_HALT';
  price: number;
  qty: number;
  pnl?: number;
  reason: string;
  executionStatus: 'SUCCESS' | 'SIMULATED' | 'FAILED';
}

export interface BotTradeRecord {
  id: string;
  botId: string;
  botName: string;
  strategyType: BotStrategyType;
  symbol: string;
  side: 'LONG' | 'SHORT';
  marketType: MarketType;
  exchange: SupportedExchange;
  isDemo: boolean;
  entryTime: number;
  exitTime: number;
  entryPrice: number;
  exitPrice: number;
  qty: number;
  sizeUsd: number;
  leverage: number;
  pnlUsd: number;
  pnlPct: number;
  status: 'WIN' | 'LOSS' | 'OPEN';
  confluenceScore: number;
  durationMinutes: number;
  exitReason: 'TAKE_PROFIT' | 'STOP_LOSS' | 'TRAILING_STOP' | 'SIGNAL_FLIP' | 'MANUAL_HALT';
  feeUsd: number;
}

export interface BotPerformanceMetric {
  botId: string;
  botName: string;
  strategyType: string;
  marketType: MarketType;
  isDemo: boolean;
  totalTrades: number;
  winCount: number;
  lossCount: number;
  winRatePct: number;
  netPnlUsd: number;
  netPnlPct: number;
  profitFactor: number;
  maxDrawdownPct: number;
  avgPnlPerTradeUsd: number;
  bestTradeUsd: number;
  worstTradeUsd: number;
}

export interface DailyPnlBar {
  date: string;
  dayLabel: string;
  pnlUsd: number;
  tradesCount: number;
  winRate: number;
}

export interface EquityCurvePoint {
  timestamp: number;
  dateLabel: string;
  equityUsd: number;
  pnlUsd: number;
  drawdownPct: number;
}
