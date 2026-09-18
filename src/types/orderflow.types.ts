// Liquidation Heatmap, Orderbook Depth, and Market Maker Playbook Contracts
import { Timeframe, SignalType } from './market.types';

export type LeverageTier = '100x' | '50x' | '25x' | '10x';

export interface LiquidationCluster {
  id: string;
  price: number;
  type: 'LONG_LIQUIDATION' | 'SHORT_LIQUIDATION';
  leverageTier: LeverageTier;
  estimatedVolumeUsd: number; // in Millions USD
  intensity: number; // 0 - 100
  distancePct: number;
  isMajorMagnet: boolean;
  candleOriginTime?: number;
}

export interface LiquidationHeatmapSummary {
  symbol: string;
  currentPrice: number;
  totalLongLiqUsd: number;
  totalShortLiqUsd: number;
  longLiqRatio: number;
  shortLiqRatio: number;
  imbalanceBias: 'SHORT_SQUEEZE_RISK' | 'LONG_SQUEEZE_RISK' | 'BALANCED';
  squeezeProbability: number;
  majorShortMagnet: LiquidationCluster | null;
  majorLongMagnet: LiquidationCluster | null;
  clusters: LiquidationCluster[];
}

export interface OrderBookWall {
  price: number;
  amount: number;
  volumeUsd: number;
  distancePct: number;
  isSpoofSuspicion: boolean;
  type: 'BID' | 'ASK';
}

export interface CumulativeDeltaBar {
  time: number;
  price: number;
  buyVolume: number;
  sellVolume: number;
  delta: number;
  cvd: number;
  isDivergent: boolean;
}

export interface OrderBookDepthData {
  bidVolumeTotal: number;
  askVolumeTotal: number;
  imbalanceRatio: number;
  bidPercent: number;
  askPercent: number;
  bidWalls: OrderBookWall[];
  askWalls: OrderBookWall[];
  cvdSeries: CumulativeDeltaBar[];
  currentCvd: number;
  institutionalAggressionScore: number;
  cvdTrend: 'STRONG_ACCUMULATION' | 'MILD_ACCUMULATION' | 'NEUTRAL' | 'MILD_DISTRIBUTION' | 'STRONG_DISTRIBUTION';
  spoofAlert: string | null;
}

export type OIDivergenceType =
  | 'RALLY_WITH_NEW_CAPITAL'
  | 'SHORT_COVERING_PUMP'
  | 'AGGRESSIVE_SHORTING'
  | 'LONG_UNWINDING_DUMP'
  | 'CONSOLIDATION';

export interface DerivativesMetrics {
  openInterestUsd: number;
  openInterestToken: number;
  oiChange1hPct: number;
  oiChange4hPct: number;
  oiChange24hPct: number;
  fundingRate8h: number;
  fundingRateAnnualized: number;
  predictedNextFunding: number;
  fundingSentiment: 'OVERHEATED_LONGS' | 'HEALTHY_BULLISH' | 'NEUTRAL' | 'SHORT_SQUEEZE_FUEL' | 'EXTREME_BEARISH_HEAVY';
  longShortRatio: number;
  longPercent: number;
  shortPercent: number;
  oiPriceDivergence: {
    type: OIDivergenceType;
    significance: 'HIGH' | 'MEDIUM' | 'LOW';
    explanation: string;
    actionImplication: string;
  };
}

export interface AnchoredVWAPAnchor {
  label: string;
  vwap: number;
  anchorPrice: number;
  anchorTime: number;
  distancePct: number;
  upperBand1: number;
  upperBand2: number;
  lowerBand1: number;
  lowerBand2: number;
  status: 'SUPPORT_HOLDING' | 'RESISTANCE_REJECTION' | 'PRICE_ABOVE' | 'PRICE_BELOW';
}

export interface AnchoredVWAPData {
  sessionVWAP: AnchoredVWAPAnchor;
  weeklyVWAP: AnchoredVWAPAnchor;
  swingHighAVWAP: AnchoredVWAPAnchor;
  swingLowAVWAP: AnchoredVWAPAnchor;
  currentZone: 'ABOVE_ALL_ANCHORS' | 'BETWEEN_ANCHORS' | 'BELOW_ALL_ANCHORS';
  dominantAnchor: string;
  bias: SignalType;
  confluenceSummary: string;
}

export interface TheTrapAndSpikePattern {
  isDetected: boolean;
  trapType: 'BULL_TRAP_SPOOF' | 'BEAR_TRAP_SPRING' | 'STOP_HUNT_SPIKE' | 'NONE';
  confidence: number;
  triggerPrice: number;
  spikePrice: number;
  reversalTarget: number;
  status: 'CONFIRMED_TRAP' | 'FORMING_TRAP' | 'INVALIDATED' | 'INACTIVE';
  retailTrapVolumeUsd: number;
  mmObjective: string;
  actionPlan: string;
  characteristics: string[];
}

export interface AbsorptionPhasePattern {
  isDetected: boolean;
  absorptionType: 'SILENT_ACCUMULATION_BOTTOM' | 'SILENT_DISTRIBUTION_TOP' | 'NONE';
  confidence: number;
  defenseLevel: number;
  deltaDivergenceRatio: number;
  passiveVolumeAbsorbedUsd: number;
  breakoutImminentDirection: 'UP' | 'DOWN' | 'PENDING';
  status: 'ACTIVE_ABSORPTION' | 'COMPLETED_SPRING' | 'COMPLETED_UPTHRUST' | 'INACTIVE';
  mmObjective: string;
  actionPlan: string;
  characteristics: string[];
}

export interface TheFlushLiquiditySweepPattern {
  isDetected: boolean;
  sweepType: 'EQH_BUY_SIDE_SWEEP' | 'EQL_SELL_SIDE_SWEEP' | 'PRIOR_DAY_SWEEP' | 'NONE';
  confidence: number;
  sweptLevel: number;
  sweepDepthPct: number;
  displacementVelocity: 'ULTRA_FAST' | 'MODERATE' | 'SLOW';
  reclaimLevel: number;
  status: 'SWEEP_CONFIRMED_REVERSING' | 'SWEEP_IN_PROGRESS' | 'EXPANSION_CONTINUATION' | 'INACTIVE';
  mmObjective: string;
  actionPlan: string;
  characteristics: string[];
}

export type MMRegime =
  | 'AGGRESSIVE_ACCUMULATION'
  | 'PREDATORY_DISTRIBUTION'
  | 'LIQUIDITY_HUNT'
  | 'RANGE_HARVESTING'
  | 'BALANCED_EQUILIBRIUM';

export interface MMPlaybookAnalysis {
  symbol: string;
  timeframe: Timeframe;
  currentPrice: number;
  regime: MMRegime;
  trapAndSpike: TheTrapAndSpikePattern;
  absorptionPhase: AbsorptionPhasePattern;
  liquiditySweep: TheFlushLiquiditySweepPattern;
  dominantMMBotAction: string;
  retailCautionAlert: string;
  institutionalEntryWindow: string;
  orderBookDepth: OrderBookDepthData;
  derivatives: DerivativesMetrics;
  anchoredVWAP: AnchoredVWAPData;
}
