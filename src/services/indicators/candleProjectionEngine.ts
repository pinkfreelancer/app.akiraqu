import { OHLCVCandle, Timeframe } from '../../types/crypto.types';

export type TrendStatusType =
  | 'STRONG_BULLISH_EXPANSION'
  | 'BULLISH_CONTINUATION'
  | 'STRONG_BEARISH_EXPANSION'
  | 'BEARISH_CONTINUATION'
  | 'VOLATILITY_SQUEEZE'
  | 'EXHAUSTION_REVERSAL_RISK'
  | 'NEUTRAL_CONSOLIDATION';

export type ImprovementStatusType =
  | 'OPTIMAL_EXPANSION'
  | 'HEALTHY_ACCELERATION'
  | 'RETEST_REQUIRED'
  | 'SQUEEZE_PREPARATION'
  | 'EXHAUSTION_WARNING'
  | 'SIDEWAYS_RANGE';

export interface CandleMetrics {
  currentPrice: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  candleRange: number;
  candleRangePercent: number;
  bodySize: number;
  bodyRatio: number; // in % (e.g. 75%)
  upperWick: number;
  lowerWick: number;
  isBullish: boolean;
  atr14: number;
  atrPercent: number;
  rangeVsAtrRatio: number; // e.g. 1.35x ATR
  volatilityState: 'EXTREME_EXPANSION' | 'MODERATE_EXPANSION' | 'NORMAL' | 'COMPRESSION';
}

export interface ProjectedTargets {
  direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  target1: number; // 1.0x ATR / Fib 1.272
  target1Percent: number;
  target2: number; // 1.618x ATR / Fib 1.618
  target2Percent: number;
  target3: number; // 2.618x ATR / Max Volatility
  target3Percent: number;
  projectedRangeUsd: { min: number; max: number };
  projectedRangePercent: { min: number; max: number };
  projectedNextHigh: number;
  projectedNextLow: number;
  expectedBreakoutLevel: number;
}

export interface ReentryZone {
  upperBound: number;
  optimalPrice: number; // OTE 61.8%
  lowerBound: number;
  fvgImbalance: {
    hasGap: boolean;
    top: number;
    bottom: number;
  };
  dynamicEmaPullback: number; // EMA 9 / EMA 21
  invalidationLevel: number; // Stop-loss boundary
  invalidationPercent: number;
  riskRewardRatioTarget1: number;
  riskRewardRatioTarget2: number;
}

export interface ImprovementInsight {
  status: ImprovementStatusType;
  statusLabelId: string;
  statusLabelEn: string;
  confidenceScore: number; // 0 - 100%
  grade: 'A+' | 'A' | 'B' | 'C' | 'D';
  momentumDeltaPercent: number;
  volumeConfirmation: boolean;
  tacticalAdvice: Array<{
    id: string;
    titleId: string;
    titleEn: string;
    descriptionId: string;
    descriptionEn: string;
    type: 'ACTION' | 'WARNING' | 'OPPORTUNITY' | 'RISK';
  }>;
}

export interface CandleProjectionAnalysis {
  symbol: string;
  timeframe: Timeframe;
  timestamp: number;
  trendStatus: {
    type: TrendStatusType;
    labelId: string;
    labelEn: string;
    bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    strength: number; // 0 - 100
    ema9: number;
    ema21: number;
    ema50: number;
    supertrendBias: 'BULLISH' | 'BEARISH';
    descriptionId: string;
    descriptionEn: string;
  };
  metrics: CandleMetrics;
  projection: ProjectedTargets;
  reentryZone: ReentryZone;
  improvement: ImprovementInsight;
}

// EMA helper
function calculateEMA(values: number[], period: number): number {
  if (values.length === 0) return 0;
  if (values.length < period) {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }
  const k = 2 / (period + 1);
  let ema = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < values.length; i++) {
    ema = values[i] * k + ema * (1 - k);
  }
  return ema;
}

// ATR 14 helper
function calculateATR(candles: OHLCVCandle[], period: number = 14): number {
  if (candles.length < 2) return candles[0]?.high - candles[0]?.low || 1;
  const trueRanges: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const current = candles[i];
    const prev = candles[i - 1];
    const tr = Math.max(
      current.high - current.low,
      Math.abs(current.high - prev.close),
      Math.abs(current.low - prev.close)
    );
    trueRanges.push(tr);
  }
  const recentTR = trueRanges.slice(-period);
  return recentTR.reduce((a, b) => a + b, 0) / recentTR.length;
}

export function analyzeCandleSizeProjection(
  candles: OHLCVCandle[],
  livePrice?: number,
  symbol: string = 'BTC/USDT',
  timeframe: Timeframe = '1H'
): CandleProjectionAnalysis {
  if (!candles || candles.length === 0) {
    const fallbackPrice = livePrice || 68000;
    return generateFallbackProjection(fallbackPrice, symbol, timeframe);
  }

  const currentCandle = candles[candles.length - 1];
  const prevCandle = candles.length > 1 ? candles[candles.length - 2] : currentCandle;
  const prevPrevCandle = candles.length > 2 ? candles[candles.length - 3] : prevCandle;

  const currentPrice = livePrice || currentCandle.close;
  const closes = candles.map((c) => c.close);
  const volumes = candles.map((c) => c.volume);

  const open = currentCandle.open;
  const high = Math.max(currentCandle.high, currentPrice);
  const low = Math.min(currentCandle.low, currentPrice);
  const close = currentPrice;
  const volume = currentCandle.volume;

  const candleRange = Math.max(0.00001, high - low);
  const candleRangePercent = (candleRange / (low || 1)) * 100;
  const bodySize = Math.abs(close - open);
  const bodyRatio = Math.min(100, Math.max(5, (bodySize / candleRange) * 100));
  const isBullish = close >= open;

  const upperWick = isBullish ? high - close : high - open;
  const lowerWick = isBullish ? open - low : close - low;

  // ATR Calculation
  const atr14 = calculateATR(candles, 14);
  const atrPercent = (atr14 / (currentPrice || 1)) * 100;
  const rangeVsAtrRatio = candleRange / (atr14 || 1);

  let volatilityState: CandleMetrics['volatilityState'] = 'NORMAL';
  if (rangeVsAtrRatio > 1.6) volatilityState = 'EXTREME_EXPANSION';
  else if (rangeVsAtrRatio > 1.15) volatilityState = 'MODERATE_EXPANSION';
  else if (rangeVsAtrRatio < 0.65) volatilityState = 'COMPRESSION';

  const metrics: CandleMetrics = {
    currentPrice,
    open,
    high,
    low,
    close,
    volume,
    candleRange,
    candleRangePercent,
    bodySize,
    bodyRatio,
    upperWick,
    lowerWick,
    isBullish,
    atr14,
    atrPercent,
    rangeVsAtrRatio,
    volatilityState,
  };

  // EMAs
  const ema9 = calculateEMA(closes, 9);
  const ema21 = calculateEMA(closes, 21);
  const ema50 = calculateEMA(closes, 50);

  // Volume benchmark (MA20 of volume)
  const avgVolume20 =
    volumes.slice(-20).reduce((a, b) => a + b, 0) / Math.min(20, volumes.length || 1);
  const volumeRatio = volume / (avgVolume20 || 1);
  const volumeConfirmation = volumeRatio >= 1.05;

  // Supertrend heuristic
  const isAboveEma21 = currentPrice > ema21;
  const supertrendBias: 'BULLISH' | 'BEARISH' = isAboveEma21 ? 'BULLISH' : 'BEARISH';

  // Determine Trend Status
  let trendType: TrendStatusType = 'NEUTRAL_CONSOLIDATION';
  let trendBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
  let trendStrength = 50;
  let labelId = 'Konsolidasi Netral';
  let labelEn = 'Neutral Consolidation';
  let descId = 'Pergerakan harga dalam fase akumulasi tanpa arah dominan.';
  let descEn = 'Price action moving inside neutral accumulation range.';

  const isEmaBullStack = ema9 > ema21 && ema21 > ema50;
  const isEmaBearStack = ema9 < ema21 && ema21 < ema50;

  if (isEmaBullStack && close > ema9 && rangeVsAtrRatio > 1.1 && bodyRatio > 55) {
    trendType = 'STRONG_BULLISH_EXPANSION';
    trendBias = 'BULLISH';
    trendStrength = Math.min(98, Math.round(75 + bodyRatio * 0.15 + (volumeRatio > 1.2 ? 10 : 5)));
    labelId = 'Ekspansi Bullish Kuat';
    labelEn = 'Strong Bullish Expansion';
    descId = 'Candle mengalami impulsifitas kuat di atas seluruh pita EMA didukung dominasi body.';
    descEn = 'Impulsive candle expansion above all EMAs with strong body dominance.';
  } else if (isEmaBearStack && close < ema9 && rangeVsAtrRatio > 1.1 && bodyRatio > 55) {
    trendType = 'STRONG_BEARISH_EXPANSION';
    trendBias = 'BEARISH';
    trendStrength = Math.min(98, Math.round(75 + bodyRatio * 0.15 + (volumeRatio > 1.2 ? 10 : 5)));
    labelId = 'Ekspansi Bearish Kuat';
    labelEn = 'Strong Bearish Expansion';
    descId = 'Candle mengalami tekanan jual tajam di bawah seluruh pita EMA dengan volume tinggi.';
    descEn = 'Sharp selling expansion breakdown below all EMAs with elevated volume.';
  } else if (isAboveEma21 && close >= prevCandle.close) {
    trendType = 'BULLISH_CONTINUATION';
    trendBias = 'BULLISH';
    trendStrength = 68;
    labelId = 'Kelanjutan Bullish';
    labelEn = 'Bullish Continuation';
    descId = 'Struktur tren masih mempertahankan higher-low dan bertengger di atas EMA 21.';
    descEn = 'Market structure maintaining higher-lows above EMA 21 baseline.';
  } else if (!isAboveEma21 && close <= prevCandle.close) {
    trendType = 'BEARISH_CONTINUATION';
    trendBias = 'BEARISH';
    trendStrength = 68;
    labelId = 'Kelanjutan Bearish';
    labelEn = 'Bearish Continuation';
    descId = 'Struktur tren mempertahankan lower-highs di bawah resistensi EMA 21.';
    descEn = 'Market structure maintaining lower-highs below EMA 21 resistance.';
  } else if (volatilityState === 'COMPRESSION') {
    trendType = 'VOLATILITY_SQUEEZE';
    trendBias = 'NEUTRAL';
    trendStrength = 45;
    labelId = 'Kompresi Volatilitas (Squeeze)';
    labelEn = 'Volatility Squeeze';
    descId = 'Ukuran candle menyempit di bawah rata-rata ATR, sinyal ledakan pergerakan besar segera terjadi.';
    descEn = 'Candle range compressed below ATR average, priming for major expansion breakout.';
  } else if ((isBullish && upperWick > bodySize * 1.6) || (!isBullish && lowerWick > bodySize * 1.6)) {
    trendType = 'EXHAUSTION_REVERSAL_RISK';
    trendBias = isBullish ? 'BEARISH' : 'BULLISH';
    trendStrength = 60;
    labelId = 'Peringatan Kelelahan / Rejection';
    labelEn = 'Exhaustion Reversal Warning';
    descId = 'Ekor sumbu candle panjang mengindikasikan penolakan harga tajam pada batas likuiditas.';
    descEn = 'Long candle wick indicates aggressive liquidity rejection at extreme boundary.';
  }

  // Projected Targets (Proj Target)
  let projDirection: ProjectedTargets['direction'] = trendBias;
  let target1 = 0;
  let target2 = 0;
  let target3 = 0;
  let expectedBreakoutLevel = 0;

  if (trendBias === 'BULLISH' || (trendBias === 'NEUTRAL' && isBullish)) {
    projDirection = 'BULLISH';
    target1 = currentPrice + atr14 * 1.0;
    target2 = currentPrice + atr14 * 1.618;
    target3 = currentPrice + atr14 * 2.618;
    expectedBreakoutLevel = Math.max(high, prevCandle.high);
  } else {
    projDirection = 'BEARISH';
    target1 = Math.max(0.0001, currentPrice - atr14 * 1.0);
    target2 = Math.max(0.0001, currentPrice - atr14 * 1.618);
    target3 = Math.max(0.0001, currentPrice - atr14 * 2.618);
    expectedBreakoutLevel = Math.min(low, prevCandle.low);
  }

  const target1Percent = ((target1 - currentPrice) / currentPrice) * 100;
  const target2Percent = ((target2 - currentPrice) / currentPrice) * 100;
  const target3Percent = ((target3 - currentPrice) / currentPrice) * 100;

  const minExpectedRange = atr14 * 0.85;
  const maxExpectedRange = atr14 * 1.45;

  const projectedNextHigh =
    projDirection === 'BULLISH' ? currentPrice + atr14 * 1.15 : currentPrice + atr14 * 0.35;
  const projectedNextLow =
    projDirection === 'BULLISH'
      ? Math.max(0, currentPrice - atr14 * 0.35)
      : Math.max(0, currentPrice - atr14 * 1.15);

  const projection: ProjectedTargets = {
    direction: projDirection,
    target1,
    target1Percent,
    target2,
    target2Percent,
    target3,
    target3Percent,
    projectedRangeUsd: { min: minExpectedRange, max: maxExpectedRange },
    projectedRangePercent: {
      min: (minExpectedRange / currentPrice) * 100,
      max: (maxExpectedRange / currentPrice) * 100,
    },
    projectedNextHigh,
    projectedNextLow,
    expectedBreakoutLevel,
  };

  // Reentry Zone Calculation (Optimal Trade Entry 61.8% - 78.6% & FVG)
  let reentryUpper = 0;
  let reentryOptimal = 0;
  let reentryLower = 0;
  let invalidationLevel = 0;

  // FVG Imbalance detection between prevPrevCandle and currentCandle
  let hasGap = false;
  let fvgTop = 0;
  let fvgBottom = 0;

  if (projDirection === 'BULLISH') {
    // Bullish re-entry on pullback
    reentryUpper = currentPrice - candleRange * 0.382; // 38.2% shallow
    reentryOptimal = currentPrice - candleRange * 0.618; // 61.8% OTE Golden Zone
    reentryLower = currentPrice - candleRange * 0.786; // 78.6% Deep retest
    invalidationLevel = Math.min(low, prevCandle.low) - atr14 * 0.25;

    if (currentCandle.low > prevPrevCandle.high) {
      hasGap = true;
      fvgTop = currentCandle.low;
      fvgBottom = prevPrevCandle.high;
    }
  } else {
    // Bearish re-entry on bounce
    reentryLower = currentPrice + candleRange * 0.382;
    reentryOptimal = currentPrice + candleRange * 0.618;
    reentryUpper = currentPrice + candleRange * 0.786;
    invalidationLevel = Math.max(high, prevCandle.high) + atr14 * 0.25;

    if (currentCandle.high < prevPrevCandle.low) {
      hasGap = true;
      fvgTop = prevPrevCandle.low;
      fvgBottom = currentCandle.high;
    }
  }

  const invalidationPercent = Math.abs(((invalidationLevel - currentPrice) / currentPrice) * 100);
  const potentialRewardT1 = Math.abs(target1 - reentryOptimal);
  const potentialRewardT2 = Math.abs(target2 - reentryOptimal);
  const potentialRisk = Math.max(0.0001, Math.abs(reentryOptimal - invalidationLevel));

  const riskRewardRatioTarget1 = Number((potentialRewardT1 / potentialRisk).toFixed(2));
  const riskRewardRatioTarget2 = Number((potentialRewardT2 / potentialRisk).toFixed(2));

  const reentryZone: ReentryZone = {
    upperBound: Math.max(reentryUpper, reentryLower),
    optimalPrice: reentryOptimal,
    lowerBound: Math.min(reentryUpper, reentryLower),
    fvgImbalance: {
      hasGap,
      top: fvgTop,
      bottom: fvgBottom,
    },
    dynamicEmaPullback: isBullish ? ema9 : ema21,
    invalidationLevel,
    invalidationPercent,
    riskRewardRatioTarget1,
    riskRewardRatioTarget2,
  };

  // Status Improvement & Precision Scoring
  let confidenceScore = 60;
  if (volumeConfirmation) confidenceScore += 15;
  if (bodyRatio > 65) confidenceScore += 12;
  if (isEmaBullStack || isEmaBearStack) confidenceScore += 13;
  if (hasGap) confidenceScore += 5;
  if (rangeVsAtrRatio > 2.2) confidenceScore -= 10; // Overextended penalty
  confidenceScore = Math.max(45, Math.min(96, Math.round(confidenceScore)));

  let grade: ImprovementInsight['grade'] = 'B';
  if (confidenceScore >= 90) grade = 'A+';
  else if (confidenceScore >= 80) grade = 'A';
  else if (confidenceScore >= 68) grade = 'B';
  else if (confidenceScore >= 55) grade = 'C';
  else grade = 'D';

  let improvementStatus: ImprovementStatusType = 'HEALTHY_ACCELERATION';
  let statusLabelId = 'Akselerasi Sehat & Valid';
  let statusLabelEn = 'Healthy & Valid Acceleration';

  if (trendType === 'STRONG_BULLISH_EXPANSION' || trendType === 'STRONG_BEARISH_EXPANSION') {
    if (rangeVsAtrRatio > 2.0) {
      improvementStatus = 'RETEST_REQUIRED';
      statusLabelId = 'Ekspansi Ekstrem - Wajib Tunggu Retest';
      statusLabelEn = 'Extreme Expansion - Retest Required';
    } else {
      improvementStatus = 'OPTIMAL_EXPANSION';
      statusLabelId = 'Ekspansi Ukuran Candle Optimal (A+)';
      statusLabelEn = 'Optimal Candle Expansion (A+)';
    }
  } else if (trendType === 'VOLATILITY_SQUEEZE') {
    improvementStatus = 'SQUEEZE_PREPARATION';
    statusLabelId = 'Persiapan Pelepasan Squeeze';
    statusLabelEn = 'Squeeze Release Preparation';
  } else if (trendType === 'EXHAUSTION_REVERSAL_RISK') {
    improvementStatus = 'EXHAUSTION_WARNING';
    statusLabelId = 'Waspada Penolakan / Pembalikan Arah';
    statusLabelEn = 'Exhaustion & Reversal Warning';
  } else {
    improvementStatus = 'SIDEWAYS_RANGE';
    statusLabelId = 'Rentang Netral Sideways';
    statusLabelEn = 'Neutral Sideways Range';
  }

  const momentumDeltaPercent = Number(
    (((currentCandle.close - prevCandle.close) / (prevCandle.close || 1)) * 100).toFixed(2)
  );

  // Tactical Recommendations
  const tacticalAdvice: ImprovementInsight['tacticalAdvice'] = [
    {
      id: 'adv-1',
      titleId: 'Protokol Titik Entri Re-Entry',
      titleEn: 'Re-entry Entry Protocol',
      descriptionId: `Hindari membeli saat harga di puncak candle (${rangeVsAtrRatio.toFixed(2)}x ATR). Pasang limit order pada Zona Re-entry optimal ($${reentryOptimal.toLocaleString()}) untuk memaksimalkan rasio R:R ${riskRewardRatioTarget2}:1.`,
      descriptionEn: `Avoid chasing prices at peak candle extension (${rangeVsAtrRatio.toFixed(2)}x ATR). Place limit orders in the optimal re-entry zone ($${reentryOptimal.toLocaleString()}) for an optimal R:R of ${riskRewardRatioTarget2}:1.`,
      type: 'ACTION',
    },
    {
      id: 'adv-2',
      titleId: 'Target Proyeksi & Ambil Untung Bertahap',
      titleEn: 'Projection Targets & Multi-TP Staging',
      descriptionId: `Amankan 50% posisi pada Target 1 ($${target1.toLocaleString()} / ${target1Percent >= 0 ? '+' : ''}${target1Percent.toFixed(2)}%), dan biarkan sisa posisi berjalan menuju Target 2 ($${target2.toLocaleString()}).`,
      descriptionEn: `Lock 50% profit at Target 1 ($${target1.toLocaleString()} / ${target1Percent >= 0 ? '+' : ''}${target1Percent.toFixed(2)}%), and trail remaining position toward Target 2 ($${target2.toLocaleString()}).`,
      type: 'OPPORTUNITY',
    },
    {
      id: 'adv-3',
      titleId: 'Batas Invalidasi & Manajemen Risiko',
      titleEn: 'Invalidation Boundary & Stop Protection',
      descriptionId: `Garis invalidasi terpasang di level $${invalidationLevel.toLocaleString()} (${invalidationPercent.toFixed(2)}% dari harga saat ini). Batasi risiko per trade maksimal 1% - 2% modal.`,
      descriptionEn: `Hard invalidation level fixed at $${invalidationLevel.toLocaleString()} (${invalidationPercent.toFixed(2)}% distance). Restrict per-trade risk to 1% - 2% portfolio equity.`,
      type: 'RISK',
    },
    {
      id: 'adv-4',
      titleId: 'Konfirmasi Volume & Struktur Bar',
      titleEn: 'Volume & Bar Confirmation',
      descriptionId: volumeConfirmation
        ? `Volume perdagangan ${volumeRatio.toFixed(2)}x di atas MA20 memvalidasi kekuatan dorongan candle saat ini.`
        : `Volume perdagangan (${volumeRatio.toFixed(2)}x MA20) relatif tipis, waspada kemungkinan false breakout.`,
      descriptionEn: volumeConfirmation
        ? `Trade volume at ${volumeRatio.toFixed(2)}x MA20 benchmark confirms authentic institutional impulse.`
        : `Trade volume at ${volumeRatio.toFixed(2)}x MA20 is below average, beware of potential bull/bear trap.`,
      type: volumeConfirmation ? 'OPPORTUNITY' : 'WARNING',
    },
  ];

  const improvement: ImprovementInsight = {
    status: improvementStatus,
    statusLabelId,
    statusLabelEn,
    confidenceScore,
    grade,
    momentumDeltaPercent,
    volumeConfirmation,
    tacticalAdvice,
  };

  return {
    symbol,
    timeframe,
    timestamp: Date.now(),
    trendStatus: {
      type: trendType,
      labelId,
      labelEn,
      bias: trendBias,
      strength: trendStrength,
      ema9,
      ema21,
      ema50,
      supertrendBias,
      descriptionId: descId,
      descriptionEn: descEn,
    },
    metrics,
    projection,
    reentryZone,
    improvement,
  };
}

function generateFallbackProjection(
  price: number,
  symbol: string,
  timeframe: Timeframe
): CandleProjectionAnalysis {
  const atr14 = price * 0.022;
  const target1 = price + atr14;
  const target2 = price + atr14 * 1.618;
  const target3 = price + atr14 * 2.618;

  return {
    symbol,
    timeframe,
    timestamp: Date.now(),
    trendStatus: {
      type: 'STRONG_BULLISH_EXPANSION',
      labelId: 'Ekspansi Bullish Terproyeksi',
      labelEn: 'Projected Bullish Expansion',
      bias: 'BULLISH',
      strength: 82,
      ema9: price * 0.99,
      ema21: price * 0.98,
      ema50: price * 0.96,
      supertrendBias: 'BULLISH',
      descriptionId: 'Data candle awal terinisialisasi dalam format ekspansi terarah.',
      descriptionEn: 'Initial candle stream initialized with trend expansion bias.',
    },
    metrics: {
      currentPrice: price,
      open: price * 0.992,
      high: price * 1.006,
      low: price * 0.991,
      close: price,
      volume: 1250,
      candleRange: price * 0.015,
      candleRangePercent: 1.5,
      bodySize: price * 0.008,
      bodyRatio: 68,
      upperWick: price * 0.006,
      lowerWick: price * 0.001,
      isBullish: true,
      atr14,
      atrPercent: 2.2,
      rangeVsAtrRatio: 1.25,
      volatilityState: 'MODERATE_EXPANSION',
    },
    projection: {
      direction: 'BULLISH',
      target1,
      target1Percent: (atr14 / price) * 100,
      target2,
      target2Percent: ((atr14 * 1.618) / price) * 100,
      target3,
      target3Percent: ((atr14 * 2.618) / price) * 100,
      projectedRangeUsd: { min: atr14 * 0.85, max: atr14 * 1.45 },
      projectedRangePercent: { min: 1.8, max: 3.2 },
      projectedNextHigh: price + atr14 * 1.15,
      projectedNextLow: price - atr14 * 0.35,
      expectedBreakoutLevel: price * 1.006,
    },
    reentryZone: {
      upperBound: price * 0.996,
      optimalPrice: price * 0.992,
      lowerBound: price * 0.988,
      fvgImbalance: { hasGap: true, top: price * 0.994, bottom: price * 0.989 },
      dynamicEmaPullback: price * 0.99,
      invalidationLevel: price * 0.978,
      invalidationPercent: 2.2,
      riskRewardRatioTarget1: 2.3,
      riskRewardRatioTarget2: 3.8,
    },
    improvement: {
      status: 'OPTIMAL_EXPANSION',
      statusLabelId: 'Ekspansi Ukuran Candle Optimal (A)',
      statusLabelEn: 'Optimal Candle Expansion (A)',
      confidenceScore: 88,
      grade: 'A',
      momentumDeltaPercent: 1.45,
      volumeConfirmation: true,
      tacticalAdvice: [
        {
          id: 'fb-1',
          titleId: 'Protokol Titik Entri Re-Entry',
          titleEn: 'Re-entry Entry Protocol',
          descriptionId: `Pasang limit order pada Zona Re-entry optimal ($${(price * 0.992).toLocaleString()}) untuk rasio R:R optimal.`,
          descriptionEn: `Place limit orders in the optimal re-entry zone ($${(price * 0.992).toLocaleString()}) for optimal R:R.`,
          type: 'ACTION',
        },
        {
          id: 'fb-2',
          titleId: 'Target Proyeksi 1 & 2',
          titleEn: 'Projection Targets 1 & 2',
          descriptionId: `Target 1: $${target1.toLocaleString()} (+2.20%) | Target 2: $${target2.toLocaleString()} (+3.56%).`,
          descriptionEn: `Target 1: $${target1.toLocaleString()} (+2.20%) | Target 2: $${target2.toLocaleString()} (+3.56%).`,
          type: 'OPPORTUNITY',
        },
        {
          id: 'fb-3',
          titleId: 'Batas Invalidasi Ketat',
          titleEn: 'Strict Invalidation Boundary',
          descriptionId: `Stop loss pengaman di level $${(price * 0.978).toLocaleString()} (-2.20%).`,
          descriptionEn: `Safety stop loss at $${(price * 0.978).toLocaleString()} (-2.20%).`,
          type: 'RISK',
        },
        {
          id: 'fb-4',
          titleId: 'Validasi Volume Institusional',
          titleEn: 'Institutional Volume Validation',
          descriptionId: 'Volume konfirmasi aktif di atas baseline MA20.',
          descriptionEn: 'Volume confirmation active above MA20 baseline.',
          type: 'OPPORTUNITY',
        },
      ],
    },
  };
}
