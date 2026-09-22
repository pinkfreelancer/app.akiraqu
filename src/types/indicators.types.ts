// Quantitative Technical Indicator Contracts
import { SignalType } from './market.types';

// 1. Price Action
export interface PriceActionIndicator {
  keySupport: number;
  keyResistance: number;
  swingHigh: number;
  swingLow: number;
  candlestickPattern: string;
  signal: SignalType;
  confidence: number;
  summary: string;
}

// 2. VWAP
export interface VWAPIndicator {
  vwap: number;
  upperBand1: number;
  upperBand2: number;
  lowerBand1: number;
  lowerBand2: number;
  relation: 'ABOVE_VWAP' | 'BELOW_VWAP' | 'AT_VWAP';
  signal: SignalType;
  confidence: number;
  summary: string;
}

// 3. RSI
export interface RSIIndicator {
  rsi14: number;
  condition: 'OVERBOUGHT' | 'OVERSOLD' | 'BULLISH_MOMENTUM' | 'BEARISH_MOMENTUM' | 'NEUTRAL';
  divergence: 'BULLISH_DIVERGENCE' | 'BEARISH_DIVERGENCE' | 'NONE';
  signal: SignalType;
  confidence: number;
  summary: string;
}

// 4. Ichimoku Cloud
export interface IchimokuIndicator {
  tenkanSen: number;
  kijunSen: number;
  senkouSpanA: number;
  senkouSpanB: number;
  chikouSpan?: number;
  cloudColor?: 'GREEN' | 'RED' | 'BULLISH_GREEN' | 'BEARISH_RED';
  relation?: 'ABOVE_CLOUD' | 'BELOW_CLOUD' | 'INSIDE_CLOUD';
  tkCross?: 'BULLISH_CROSS' | 'BEARISH_CROSS' | 'NEUTRAL';
  signal: SignalType;
  confidence: number;
  summary: string;
}

// 5. Fibonacci Retracement & Extension
export interface FibonacciLevels {
  level0: number;
  level236: number;
  level382: number;
  level500: number;
  level618: number;
  level786: number;
  level1000: number;
  level1618: number;
}

export interface FibonacciIndicator {
  swingHigh?: number;
  swingLow?: number;
  levels?: FibonacciLevels;
  goldenPocket: {
    min: number;
    max: number;
    low?: number;
    high?: number;
  };
  nearestLevel: string;
  nearestLevelPrice?: number;
  distancePct?: number;
  signal: SignalType;
  confidence: number;
  summary: string;
}

// 6. MACD
export interface MACDIndicator {
  macdLine: number;
  signalLine: number;
  histogram: number;
  status?: 'BULLISH_EXPANSION' | 'BEARISH_EXPANSION' | 'BULLISH_CROSS' | 'BEARISH_CROSS' | 'CONVERGING';
  trend?: 'EXPANDING_BULLISH' | 'CONTRACTING_BULLISH' | 'EXPANDING_BEARISH' | 'CONTRACTING_BEARISH';
  crossover?: 'BULLISH_CROSS' | 'BEARISH_CROSS' | 'NEUTRAL';
  signal: SignalType;
  confidence: number;
  summary: string;
}

// 7. SMC (Smart Money Concepts)
export interface SMCOrderBlock {
  type: 'BULLISH_OB' | 'BEARISH_OB';
  high: number;
  low: number;
  tested?: boolean;
}

export interface SMCFairValueGap {
  type: 'BULLISH_FVG' | 'BEARISH_FVG';
  high: number;
  low: number;
  mitigated?: boolean;
}

export interface SMCIndicator {
  structure?: 'BULLISH_BOS' | 'BEARISH_BOS' | 'BULLISH_CHOCH' | 'BEARISH_CHOCH' | 'RANGE';
  orderBlock?: { high: number; low: number; type: 'BULLISH_OB' | 'BEARISH_OB' };
  orderBlocks?: SMCOrderBlock[];
  fvg?: { high: number; low: number; type: 'BULLISH_FVG' | 'BEARISH_FVG' };
  fairValueGaps?: SMCFairValueGap[];
  breakOfStructure?: 'BOS_BULLISH' | 'BOS_BEARISH' | 'CHoCH_BULLISH' | 'CHoCH_BEARISH' | 'NONE';
  liquiditySwept?: boolean;
  signal: SignalType;
  confidence: number;
  summary: string;
}

// 8. ICT (Inner Circle Trader)
export interface ICTIndicator {
  sessionLiquidity?: 'ASIAN_HIGH_SWEPT' | 'ASIAN_LOW_SWEPT' | 'LONDON_EXPANSION' | 'NY_KILLZONE';
  judasSwing?: boolean;
  optimalTradeEntry?: { top: number; bottom: number };
  currentKillzone?: 'LONDON_OPEN' | 'NEW_YORK_AM' | 'NEW_YORK_PM' | 'ASIAN_RANGE' | 'OFF_HOURS';
  oteLevel?: { min: number; max: number };
  marketStructureShift?: boolean;
  buySideLiquidity?: number;
  sellSideLiquidity?: number;
  premiumDiscountZone?: 'PREMIUM' | 'DISCOUNT' | 'EQUILIBRIUM';
  signal: SignalType;
  confidence: number;
  summary: string;
}

// 9. Elliott Wave Theory
export interface ElliottWaveIndicator {
  currentWave: string; // e.g. "Wave 3 of (5) Motive Impulse"
  waveDegree?: 'Minor' | 'Intermediate' | 'Primary';
  structure?: 'IMPULSE_12345' | 'CORRECTION_ABC' | string;
  invalidationLevel: number;
  projectedTarget?: number;
  nextProjection?: number;
  signal: SignalType;
  confidence: number;
  summary: string;
}

// 10. TD Sequential
export interface TDSequentialIndicator {
  setupCount: number;
  setupDirection?: 'BUY_SETUP' | 'SELL_SETUP' | 'NONE';
  countdownCount: number;
  direction?: 'BUY_SETUP' | 'SELL_SETUP';
  isPerfection?: boolean;
  isPerfected9?: boolean;
  isCompleted13?: boolean;
  signal: SignalType;
  confidence: number;
  summary: string;
}

// 11. Order Flow (CVD & Volume Delta)
export interface OrderFlowIndicator {
  cvd: number;
  cvdDirection: 'ACCUMULATING_BULLISH' | 'DISTRIBUTING_BEARISH' | 'ABSORPTION_NEUTRAL';
  deltaRatio: number;
  buyVolumePercent: number;
  sellVolumePercent: number;
  institutionalAggression: 'HIGH_BUY' | 'HIGH_SELL' | 'BALANCED';
  absorptionZone: { price: number; type: 'BULLISH_ABSORPTION' | 'BEARISH_ABSORPTION' } | null;
  signal: SignalType;
  confidence: number;
  summary: string;
}

// 12. Option Flow (Derivatives & Open Interest)
export interface OptionFlowIndicator {
  putCallRatio: number;
  pcrSentiment: 'BULLISH_CALL_HEAVY' | 'BEARISH_PUT_HEAVY' | 'NEUTRAL';
  maxPainPrice: number;
  maxPainDistancePct: number;
  openInterestNotional: string;
  impliedVolatility: number;
  gammaExposure: 'POSITIVE_GAMMA_STABILIZING' | 'NEGATIVE_GAMMA_VOLATILE';
  unusualOptionsActivity: Array<{
    type: 'CALL_BLOCK' | 'PUT_BLOCK';
    strike: number;
    expiry: string;
    premium: string;
    sentiment: 'BULLISH' | 'BEARISH';
  }>;
  signal: SignalType;
  confidence: number;
  summary: string;
}

export interface IndicatorsSnapshot {
  priceAction: PriceActionIndicator;
  vwap: VWAPIndicator;
  rsi: RSIIndicator;
  ichimoku: IchimokuIndicator;
  fibonacci: FibonacciIndicator;
  macd: MACDIndicator;
  smc: SMCIndicator;
  ict: ICTIndicator;
  elliottWave: ElliottWaveIndicator;
  tdSequential: TDSequentialIndicator;
  orderFlow: OrderFlowIndicator;
  optionFlow: OptionFlowIndicator;
}

export type IndicatorKey =
  | 'confluence'
  | 'priceAction'
  | 'vwap'
  | 'rsi'
  | 'ichimoku'
  | 'fibonacci'
  | 'macd'
  | 'smc'
  | 'ict'
  | 'elliottWave'
  | 'tdSequential'
  | 'orderFlow'
  | 'optionFlow';

export interface VerifiedParameters {
  priceAction: {
    swingLookback: number;
    pinBarRatio: number;
  };
  vwap: {
    band1StdDev: number;
    band2StdDev: number;
  };
  rsi: {
    period: number;
    overbought: number;
    oversold: number;
    divergenceLookback: number;
  };
  ichimoku: {
    tenkan: number;
    kijun: number;
    senkouB: number;
  };
  fibonacci: {
    swingLookback: number;
    goldenPocketMin: number;
    goldenPocketMax: number;
  };
  macd: {
    fastPeriod: number;
    slowPeriod: number;
    signalPeriod: number;
  };
  smc: {
    orderBlockLookback: number;
    minFvgGapPct: number;
  };
  ict: {
    oteMin: number;
    oteMax: number;
    discountThreshold: number;
  };
  elliottWave: {
    wave3MinExtension: number;
    trendLookback: number;
  };
  tdSequential: {
    setupLength: number;
  };
  orderFlow: {
    cvdLookback: number;
    deltaThresholdRatio: number;
  };
  optionFlow: {
    pcrBullishThreshold: number;
    pcrBearishThreshold: number;
  };
  confluence: {
    minScoreThreshold: number;
    minAgreedIndicators: number;
    strategyMode?: 'weighted' | 'majority_vote';
  };
}
