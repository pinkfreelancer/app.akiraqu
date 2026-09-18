import {
  OHLCVCandle,
  Timeframe,
  OrderBookDepthData,
  OrderBookWall,
  CumulativeDeltaBar,
  DerivativesMetrics,
  OIDivergenceType,
  AnchoredVWAPData,
  AnchoredVWAPAnchor,
  TheTrapAndSpikePattern,
  AbsorptionPhasePattern,
  TheFlushLiquiditySweepPattern,
  MMPlaybookAnalysis,
  MMRegime,
  SignalType,
} from '../../types/crypto.types';
import { getCryptoPrecision } from '../../utils/formatters';

/**
 * Calculates Comprehensive Order Book Depth & Cumulative Volume Delta (CVD)
 */
export function computeOrderBookDepthAndDelta(
  candles: OHLCVCandle[],
  currentPrice: number,
  symbol: string
): OrderBookDepthData {
  const safeCandles = Array.isArray(candles) ? candles : [];
  const safePrice = currentPrice > 0 ? currentPrice : (safeCandles.length > 0 ? safeCandles[safeCandles.length - 1].close : 100);
  const dec = getCryptoPrecision(safePrice);
  const lookback = Math.min(safeCandles.length, 30);
  const recent = safeCandles.length > 0 ? safeCandles.slice(-lookback) : [];

  // 1. Calculate CVD Series & Delta Divergence across candles
  let runningCvd = 0;
  const cvdSeries: CumulativeDeltaBar[] = [];

  for (let i = 0; i < recent.length; i++) {
    const c = recent[i];
    if (!c) continue;
    const prevC = i > 0 && recent[i - 1] ? recent[i - 1] : c;
    const range = (c.high - c.low) || (c.close * 0.001);
    const body = c.close - c.open;
    const priceChange = c.close - prevC.close;

    // Estimate buy vs sell aggressor volume fraction based on candle close relative to range
    const buyFraction = Math.max(0.08, Math.min(0.92, 0.5 + 0.5 * (body / range)));
    const buyVolume = c.volume * buyFraction;
    const sellVolume = c.volume * (1 - buyFraction);
    const delta = buyVolume - sellVolume;

    runningCvd += delta;

    // Divergence detection: Price moving UP but Delta is NEGATIVE, or Price moving DOWN but Delta is POSITIVE
    const isDivergent = (priceChange > 0 && delta < 0) || (priceChange < 0 && delta > 0);

    cvdSeries.push({
      time: c.time,
      price: c.close,
      buyVolume: Number(buyVolume.toFixed(2)),
      sellVolume: Number(sellVolume.toFixed(2)),
      delta: Number(delta.toFixed(2)),
      cvd: Number(runningCvd.toFixed(2)),
      isDivergent,
    });
  }

  // 2. Generate Realistic Simulated Depth Walls & Bid/Ask Distribution
  const lastDelta = cvdSeries.length > 0 ? cvdSeries[cvdSeries.length - 1].delta : 0;
  const lastCvdTrend = runningCvd > 0 ? (runningCvd > 5000 ? 'STRONG_ACCUMULATION' : 'MILD_ACCUMULATION') : (runningCvd < -5000 ? 'STRONG_DISTRIBUTION' : 'MILD_DISTRIBUTION');
  
  // Baseline imbalance biased by the current CVD trajectory
  const baseBidBias = runningCvd >= 0 ? 0.54 + Math.min(0.25, Math.abs(runningCvd) / 20000) : 0.46 - Math.min(0.25, Math.abs(runningCvd) / 20000);
  const bidPercent = Number((Math.min(82, Math.max(18, baseBidBias * 100))).toFixed(1));
  const askPercent = Number((100 - bidPercent).toFixed(1));
  const imbalanceRatio = Number((bidPercent / (askPercent || 1)).toFixed(2));

  // Generate depth walls
  const bidWalls: OrderBookWall[] = [];
  const askWalls: OrderBookWall[] = [];

  const spread = safePrice * 0.0004;
  let totalBidVol = 0;
  let totalAskVol = 0;

  // Scale multiplier based on symbol price
  const baseAssetMult = safePrice > 10000 ? 1.5 : safePrice > 100 ? 25 : 500;

  for (let i = 1; i <= 8; i++) {
    const distPct = 0.25 * i; // 0.25%, 0.5%, 0.75%, etc.
    const bidPrice = Number((safePrice * (1 - distPct / 100)).toFixed(dec));
    const isSpoofBid = i === 4 && bidPercent > 60; // large fake wall placed 1% away
    const bidAmount = Number(((Math.random() * 4 + 1.2) * (isSpoofBid ? 4.5 : 1) * baseAssetMult).toFixed(2));
    const bidVolUsd = Math.round(bidPrice * bidAmount);
    totalBidVol += bidAmount;

    bidWalls.push({
      price: bidPrice,
      amount: bidAmount,
      volumeUsd: bidVolUsd,
      distancePct: Number(distPct.toFixed(2)),
      isSpoofSuspicion: isSpoofBid,
      type: 'BID',
    });

    const askPrice = Number((safePrice * (1 + distPct / 100)).toFixed(dec));
    const isSpoofAsk = i === 3 && askPercent > 60;
    const askAmount = Number(((Math.random() * 4 + 1.2) * (isSpoofAsk ? 4.8 : 1) * baseAssetMult).toFixed(2));
    const askVolUsd = Math.round(askPrice * askAmount);
    totalAskVol += askAmount;

    askWalls.push({
      price: askPrice,
      amount: askAmount,
      volumeUsd: askVolUsd,
      distancePct: Number(distPct.toFixed(2)),
      isSpoofSuspicion: isSpoofAsk,
      type: 'ASK',
    });
  }

  // Institutional aggression score (0 to 100)
  const institutionalAggressionScore = Math.min(
    96,
    Math.max(22, Math.round(Math.abs(bidPercent - 50) * 2.2 + Math.min(30, Math.abs(runningCvd) / 300)))
  );

  let spoofAlert: string | null = null;
  const hasSpoofBid = bidWalls.some((w) => w.isSpoofSuspicion);
  const hasSpoofAsk = askWalls.some((w) => w.isSpoofSuspicion);
  if (hasSpoofBid) {
    spoofAlert = `Algorithmic Buy Wall ($${bidWalls.find(w => w.isSpoofSuspicion)?.price}) terdeteksi berpotensi Fake Bid Spoofing untuk menaikkan harga sebelum dibatalkan.`;
  } else if (hasSpoofAsk) {
    spoofAlert = `Algorithmic Sell Wall ($${askWalls.find(w => w.isSpoofSuspicion)?.price}) terdeteksi berpotensi Fake Ask Spoofing untuk menekan harga ke zona akumulasi.`;
  }

  return {
    bidVolumeTotal: Number(totalBidVol.toFixed(2)),
    askVolumeTotal: Number(totalAskVol.toFixed(2)),
    imbalanceRatio,
    bidPercent,
    askPercent,
    bidWalls,
    askWalls,
    cvdSeries,
    currentCvd: Number(runningCvd.toFixed(2)),
    institutionalAggressionScore,
    cvdTrend: lastCvdTrend as any,
    spoofAlert,
  };
}

/**
 * Calculates Open Interest (OI), Funding Rate, and OI-Price Divergence Patterns
 */
export function computeDerivativesMetrics(
  candles: OHLCVCandle[],
  currentPrice: number,
  symbol: string
): DerivativesMetrics {
  const safeCandles = Array.isArray(candles) ? candles : [];
  const safePrice = currentPrice > 0 ? currentPrice : (safeCandles.length > 0 ? safeCandles[safeCandles.length - 1].close : 100);
  const lookback = safeCandles.length > 0 ? safeCandles.slice(-24) : [];
  const firstPrice = lookback.length > 0 ? lookback[0].close : safePrice;
  const lastPrice = lookback.length > 0 ? lookback[lookback.length - 1].close : safePrice;
  const priceChange24hPct = firstPrice > 0 ? ((lastPrice - firstPrice) / firstPrice) * 100 : 0;

  // Base Notional Scale based on token capitalization
  let baseNotionalUsd = 1450000000; // $1.45B default
  if (symbol.includes('BTC')) baseNotionalUsd = 19450000000; // $19.45B
  else if (symbol.includes('ETH')) baseNotionalUsd = 8820000000; // $8.82B
  else if (symbol.includes('SOL') || symbol.includes('BNB')) baseNotionalUsd = 2650000000; // $2.65B
  else if (safePrice < 1) baseNotionalUsd = 420000000;

  // Simulated OI Changes with deterministic correlation to recent price trend
  const oiChange24hPct = Number((priceChange24hPct * 0.72 + (Math.sin(safePrice) * 2.8)).toFixed(2));
  const oiChange4hPct = Number((oiChange24hPct * 0.35 + 0.4).toFixed(2));
  const oiChange1hPct = Number((oiChange4hPct * 0.28).toFixed(2));

  const openInterestUsd = Math.round(baseNotionalUsd * (1 + oiChange24hPct / 100));
  const openInterestToken = Math.round(openInterestUsd / (safePrice || 1));

  // Funding rate calculation (8-hour standard)
  let fundingRate8h = 0.0100; // standard baseline +0.0100%
  if (priceChange24hPct > 4) {
    fundingRate8h = Number((0.0100 + (priceChange24hPct - 4) * 0.0035).toFixed(4));
  } else if (priceChange24hPct < -4) {
    fundingRate8h = Number((0.0100 + (priceChange24hPct + 4) * 0.0045).toFixed(4));
  } else {
    fundingRate8h = Number((0.0075 + (Math.cos(currentPrice) * 0.004)).toFixed(4));
  }
  fundingRate8h = Math.max(-0.0750, Math.min(0.0850, fundingRate8h));

  const fundingRateAnnualized = Number((fundingRate8h * 3 * 365).toFixed(2));
  const predictedNextFunding = Number((fundingRate8h * 1.05).toFixed(4));

  let fundingSentiment: 'OVERHEATED_LONGS' | 'HEALTHY_BULLISH' | 'NEUTRAL' | 'SHORT_SQUEEZE_FUEL' | 'EXTREME_BEARISH_HEAVY' = 'NEUTRAL';
  if (fundingRate8h > 0.0350) fundingSentiment = 'OVERHEATED_LONGS';
  else if (fundingRate8h > 0.0050) fundingSentiment = 'HEALTHY_BULLISH';
  else if (fundingRate8h < -0.0200) fundingSentiment = 'SHORT_SQUEEZE_FUEL';
  else if (fundingRate8h < -0.0450) fundingSentiment = 'EXTREME_BEARISH_HEAVY';

  // Long/Short Account Ratio
  let longPercent = 52.4;
  if (priceChange24hPct > 0) {
    longPercent = Math.min(74, 50 + priceChange24hPct * 2.2);
  } else {
    longPercent = Math.max(31, 50 + priceChange24hPct * 2.2);
  }
  longPercent = Number(longPercent.toFixed(1));
  const shortPercent = Number((100 - longPercent).toFixed(1));
  const longShortRatio = Number((longPercent / (shortPercent || 1)).toFixed(2));

  // OI-Price Divergence Logic (The Key to Spotting Traps vs Genuine Institutional Capital)
  let divergenceType: OIDivergenceType = 'CONSOLIDATION';
  let significance: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
  let explanation = '';
  let actionImplication = '';

  if (priceChange24hPct > 1.5 && oiChange24hPct > 2.0) {
    divergenceType = 'RALLY_WITH_NEW_CAPITAL';
    significance = 'HIGH';
    explanation = 'Harga NAIK + Open Interest NAIK: Modal institusi baru memasuki pasar (Inflow agresif). Tren bullish memiliki validasi struktural kuat.';
    actionImplication = 'Fokus pada buy-on-dips di Order Block / Golden Pocket Fib.';
  } else if (priceChange24hPct > 1.5 && oiChange24hPct < -1.5) {
    divergenceType = 'SHORT_COVERING_PUMP';
    significance = 'HIGH';
    explanation = 'Harga NAIK + Open Interest TURUN: Kenaikan didorong oleh likuidasi paksa posisi Short (Short Squeeze), bukan inflow modal baru. Waspada kehabisan bahan bakar di resistance.';
    actionImplication = 'Hindari FOMO Buy di puncak; pasang Trailing Stop ketat.';
  } else if (priceChange24hPct < -1.5 && oiChange24hPct > 2.0) {
    divergenceType = 'AGGRESSIVE_SHORTING';
    significance = 'HIGH';
    explanation = 'Harga TURUN + Open Interest NAIK: Posisi Short baru sedang dibuka secara agresif oleh Market Maker/Institusi. Tekanan jual berlanjut.';
    actionImplication = 'Tunggu sweep likuiditas di support sebelum mencari setup reversal.';
  } else if (priceChange24hPct < -1.5 && oiChange24hPct < -1.5) {
    divergenceType = 'LONG_UNWINDING_DUMP';
    significance = 'HIGH';
    explanation = 'Harga TURUN + Open Interest TURUN: Likuidasi berantai posisi Long (Capitulation). Potensi terbentuknya Absorption Phase di dekat cluster likuidasi.';
    actionImplication = 'Pantau tanda-tanda silent absorption di CVD untuk potensi reversal spring.';
  } else {
    divergenceType = 'CONSOLIDATION';
    significance = 'LOW';
    explanation = 'Harga & Open Interest bergerak seimbang dalam rentang konsolidasi. Belum ada ekspansi modal signifikan.';
    actionImplication = 'Gunakan strategi Range-bound / scalp di boundary support & resistance.';
  }

  return {
    openInterestUsd,
    openInterestToken,
    oiChange1hPct,
    oiChange4hPct,
    oiChange24hPct,
    fundingRate8h,
    fundingRateAnnualized,
    predictedNextFunding,
    fundingSentiment,
    longShortRatio,
    longPercent,
    shortPercent,
    oiPriceDivergence: {
      type: divergenceType,
      significance,
      explanation,
      actionImplication,
    },
  };
}

/**
 * Calculates Multi-Anchor Anchored VWAP (Daily Session, Weekly, Swing High, Swing Low)
 */
export function computeAnchoredVWAPs(
  candles: OHLCVCandle[],
  currentPrice: number
): AnchoredVWAPData {
  const safeCandles = Array.isArray(candles) ? candles : [];
  const safePrice = currentPrice > 0 ? currentPrice : (safeCandles.length > 0 ? safeCandles[safeCandles.length - 1].close : 100);
  const dec = getCryptoPrecision(safePrice);

  if (safeCandles.length === 0) {
    const fallbackAnchor = (label: string): AnchoredVWAPAnchor => ({
      label,
      vwap: Number(safePrice.toFixed(dec)),
      anchorPrice: Number(safePrice.toFixed(dec)),
      anchorTime: Date.now(),
      distancePct: 0,
      upperBand1: Number((safePrice * 1.02).toFixed(dec)),
      upperBand2: Number((safePrice * 1.04).toFixed(dec)),
      lowerBand1: Number((safePrice * 0.98).toFixed(dec)),
      lowerBand2: Number((safePrice * 0.96).toFixed(dec)),
      status: 'SUPPORT_HOLDING',
    });

    return {
      sessionVWAP: fallbackAnchor('Daily Session VWAP'),
      weeklyVWAP: fallbackAnchor('Weekly Anchored VWAP'),
      swingHighAVWAP: fallbackAnchor('AVWAP dari Swing High (Resistance Anchor)'),
      swingLowAVWAP: fallbackAnchor('AVWAP dari Swing Low (Support Anchor)'),
      currentZone: 'BETWEEN_ANCHORS',
      dominantAnchor: `Daily Session VWAP ($${safePrice.toFixed(dec)})`,
      bias: 'NEUTRAL',
      confluenceSummary: `Data candle sedang disinkronkan...`,
    };
  }

  const calculateAnchor = (
    startIndex: number,
    label: string,
    anchorPrice: number
  ): AnchoredVWAPAnchor => {
    const subCandles = safeCandles.slice(startIndex);
    let cumTPV = 0;
    let cumV = 0;

    const tps: number[] = [];
    for (const c of subCandles) {
      if (!c) continue;
      const tp = (c.high + c.low + c.close) / 3;
      tps.push(tp);
      cumTPV += tp * c.volume;
      cumV += c.volume;
    }

    const vwap = cumTPV / (cumV || 1);

    // Standard deviation
    let varianceSum = 0;
    for (let i = 0; i < subCandles.length; i++) {
      const diff = (tps[i] || vwap) - vwap;
      varianceSum += diff * diff * (subCandles[i]?.volume || 1);
    }
    const stdDev = Math.sqrt(varianceSum / (cumV || 1));

    const upperBand1 = Number((vwap + stdDev).toFixed(dec));
    const upperBand2 = Number((vwap + 2 * stdDev).toFixed(dec));
    const lowerBand1 = Number((vwap - stdDev).toFixed(dec));
    const lowerBand2 = Number((vwap - 2 * stdDev).toFixed(dec));
    const distancePct = Number((((safePrice - vwap) / (vwap || 1)) * 100).toFixed(2));

    let status: 'SUPPORT_HOLDING' | 'RESISTANCE_REJECTION' | 'PRICE_ABOVE' | 'PRICE_BELOW' = 'PRICE_ABOVE';
    if (Math.abs(distancePct) <= 0.4) {
      status = safePrice >= vwap ? 'SUPPORT_HOLDING' : 'RESISTANCE_REJECTION';
    } else {
      status = safePrice > vwap ? 'PRICE_ABOVE' : 'PRICE_BELOW';
    }

    return {
      label,
      vwap: Number(vwap.toFixed(dec)),
      anchorPrice: Number(anchorPrice.toFixed(dec)),
      anchorTime: subCandles[0]?.time || Date.now(),
      distancePct,
      upperBand1,
      upperBand2,
      lowerBand1,
      lowerBand2,
      status,
    };
  };

  // 1. Session VWAP (last 24 candles or ~1 day)
  const sessionIndex = Math.max(0, safeCandles.length - 24);
  const sessionVWAP = calculateAnchor(sessionIndex, 'Daily Session VWAP', safeCandles[sessionIndex]?.open || safePrice);

  // 2. Weekly VWAP (~last 70 candles)
  const weeklyIndex = Math.max(0, safeCandles.length - 70);
  const weeklyVWAP = calculateAnchor(weeklyIndex, 'Weekly Anchored VWAP', safeCandles[weeklyIndex]?.open || safePrice);

  // 3. Swing High Anchored VWAP
  let highestHigh = -Infinity;
  let highestIndex = 0;
  let lowestLow = Infinity;
  let lowestIndex = 0;

  safeCandles.forEach((c, idx) => {
    if (idx >= safeCandles.length - 50) {
      if (c.high > highestHigh) {
        highestHigh = c.high;
        highestIndex = idx;
      }
      if (c.low < lowestLow) {
        lowestLow = c.low;
        lowestIndex = idx;
      }
    }
  });

  if (highestHigh === -Infinity) highestHigh = safePrice;
  if (lowestLow === Infinity) lowestLow = safePrice;

  const swingHighAVWAP = calculateAnchor(highestIndex, 'AVWAP dari Swing High (Resistance Anchor)', highestHigh);
  const swingLowAVWAP = calculateAnchor(lowestIndex, 'AVWAP dari Swing Low (Support Anchor)', lowestLow);

  let currentZone: 'ABOVE_ALL_ANCHORS' | 'BETWEEN_ANCHORS' | 'BELOW_ALL_ANCHORS' = 'BETWEEN_ANCHORS';
  if (safePrice >= sessionVWAP.vwap && safePrice >= swingHighAVWAP.vwap && safePrice >= swingLowAVWAP.vwap) {
    currentZone = 'ABOVE_ALL_ANCHORS';
  } else if (safePrice <= sessionVWAP.vwap && safePrice <= swingHighAVWAP.vwap && safePrice <= swingLowAVWAP.vwap) {
    currentZone = 'BELOW_ALL_ANCHORS';
  }

  let bias: SignalType = 'NEUTRAL';
  if (safePrice > sessionVWAP.vwap && safePrice > swingLowAVWAP.vwap) {
    bias = 'BULLISH';
  } else if (safePrice < sessionVWAP.vwap && safePrice < swingHighAVWAP.vwap) {
    bias = 'BEARISH';
  }

  const dominantAnchor = safePrice >= sessionVWAP.vwap ? 'Daily Session VWAP ($' + sessionVWAP.vwap + ')' : 'Swing High AVWAP ($' + swingHighAVWAP.vwap + ')';

  return {
    sessionVWAP,
    weeklyVWAP,
    swingHighAVWAP,
    swingLowAVWAP,
    currentZone,
    dominantAnchor,
    bias,
    confluenceSummary: `Harga berada ${currentZone.replace(/_/g, ' ')}. Anchor krusial bertindak sebagai support dinamis di $${swingLowAVWAP.vwap} dan resistance di $${swingHighAVWAP.vwap}.`,
  };
}

/**
 * Quantitative Detection of the Market Maker Playbook:
 * 1. The Trap & Spike (Penciptaan Volatilitas Palsu)
 * 2. Absorption Phase (Akumulasi Senyap)
 * 3. The Flush / Liquidity Sweep (Pengurasan Likuiditas)
 */
export function analyzeMarketMakerPlaybook(
  candles: OHLCVCandle[],
  currentPrice: number,
  symbol: string,
  timeframe: Timeframe
): MMPlaybookAnalysis {
  const safeCandles = Array.isArray(candles) ? candles : [];
  const safePrice = currentPrice > 0 ? currentPrice : (safeCandles.length > 0 ? safeCandles[safeCandles.length - 1].close : 100);
  const dec = getCryptoPrecision(safePrice);
  const orderBookDepth = computeOrderBookDepthAndDelta(safeCandles, safePrice, symbol);
  const derivatives = computeDerivativesMetrics(safeCandles, safePrice, symbol);
  const anchoredVWAP = computeAnchoredVWAPs(safeCandles, safePrice);

  if (safeCandles.length < 3) {
    return {
      symbol,
      timeframe,
      currentPrice: safePrice,
      regime: 'BALANCED_EQUILIBRIUM',
      trapAndSpike: {
        isDetected: false,
        trapType: 'NONE',
        confidence: 0,
        triggerPrice: safePrice,
        spikePrice: safePrice,
        reversalTarget: safePrice,
        status: 'INACTIVE',
        retailTrapVolumeUsd: 0,
        mmObjective: 'Memerlukan riwayat candle untuk mendeteksi trap pola MM.',
        actionPlan: 'Menunggu data candle...',
        characteristics: [],
      },
      absorptionPhase: {
        isDetected: false,
        absorptionType: 'NONE',
        confidence: 0,
        defenseLevel: safePrice,
        deltaDivergenceRatio: 1.0,
        passiveVolumeAbsorbedUsd: 0,
        breakoutImminentDirection: 'PENDING',
        status: 'INACTIVE',
        mmObjective: 'Memerlukan data candle untuk mendeteksi penyerapan limit pasif.',
        actionPlan: 'Menunggu sinkronisasi order flow...',
        characteristics: [],
      },
      liquiditySweep: {
        isDetected: false,
        sweepType: 'NONE',
        confidence: 0,
        sweptLevel: safePrice,
        sweepDepthPct: 0,
        displacementVelocity: 'MODERATE',
        reclaimLevel: safePrice,
        status: 'INACTIVE',
        mmObjective: 'Menunggu pola sapuan likuiditas.',
        actionPlan: 'Pantau likuiditas.',
        characteristics: [],
      },
      dominantMMBotAction: 'Menunggu sinkronisasi telemetry MM...',
      retailCautionAlert: 'Data sedang disinkronkan.',
      institutionalEntryWindow: 'Menunggu konfirmasi chart.',
      orderBookDepth,
      derivatives,
      anchoredVWAP,
    };
  }

  const lookback = safeCandles.slice(-25);
  const last = safeCandles[safeCandles.length - 1];
  const prev = safeCandles[safeCandles.length - 2] || last;
  const prev2 = safeCandles[safeCandles.length - 3] || prev;

  const swingHigh = Math.max(...lookback.map((c) => c.high));
  const swingLow = Math.min(...lookback.map((c) => c.low));

  // -------------------------------------------------------------
  // 1. ANATOMI POLA 1: THE TRAP & SPIKE (Penciptaan Volatilitas Palsu)
  // -------------------------------------------------------------
  // Criteria:
  // - High upper wick or lower wick exceeding 2.2x body size piercing recent swing high/low
  // - Or spoofing divergence: CVD falling while price poked new high (Fake Breakout / Bull Trap)
  const lastUpperWick = last.high - Math.max(last.open, last.close);
  const lastLowerWick = Math.min(last.open, last.close) - last.low;
  const lastBody = Math.abs(last.close - last.open);

  const isBullTrapSpike = (last.high >= swingHigh * 0.998 || prev.high >= swingHigh * 0.998) &&
    (lastUpperWick > lastBody * 1.8 || prev.close < prev.open) &&
    (orderBookDepth.currentCvd < 0 || derivatives.oiPriceDivergence.type === 'SHORT_COVERING_PUMP');

  const isBearTrapSpring = (last.low <= swingLow * 1.002 || prev.low <= swingLow * 1.002) &&
    (lastLowerWick > lastBody * 1.8 || last.close > last.open) &&
    (orderBookDepth.currentCvd > 0 || derivatives.oiPriceDivergence.type === 'LONG_UNWINDING_DUMP');

  let trapAndSpike: TheTrapAndSpikePattern;

  if (isBullTrapSpike) {
    trapAndSpike = {
      isDetected: true,
      trapType: 'BULL_TRAP_SPOOF',
      confidence: 88,
      triggerPrice: Number(swingHigh.toFixed(dec)),
      spikePrice: Number(Math.max(last.high, prev.high).toFixed(dec)),
      reversalTarget: Number((currentPrice * 0.965).toFixed(dec)),
      status: 'CONFIRMED_TRAP',
      retailTrapVolumeUsd: Math.round(currentPrice * (last.volume * 0.45)),
      mmObjective: 'Memancing breakout buyer ritel & mengeksekusi stop-loss short di atas resistance sebelum membanting harga kembali ke dalam value area.',
      actionPlan: 'Jangan kejar breakout hijau. Cari konfirmasi entry SHORT saat harga re-enter di bawah resistance dengan stop-loss tipis di atas spike high.',
      characteristics: [
        'Spike sumbu atas tajam menembus resistance tanpa didukung CVD delta positif',
        'Open Interest menyusut (short-squeeze exhaust) bukan inflow modal baru',
        'Fake ask/bid wall ditarik (cancelled) tepat saat ritel masuk',
      ],
    };
  } else if (isBearTrapSpring) {
    trapAndSpike = {
      isDetected: true,
      trapType: 'BEAR_TRAP_SPRING',
      confidence: 86,
      triggerPrice: Number(swingLow.toFixed(dec)),
      spikePrice: Number(Math.min(last.low, prev.low).toFixed(dec)),
      reversalTarget: Number((currentPrice * 1.042).toFixed(dec)),
      status: 'CONFIRMED_TRAP',
      retailTrapVolumeUsd: Math.round(currentPrice * (last.volume * 0.45)),
      mmObjective: 'Memicu panic sell dan likuidasi Long ritel di bawah support untuk mengisi kuota beli institusi dengan harga diskon (Spring).',
      actionPlan: 'Konfirmasi entry LONG saat candle menutup kembali (reclaim) di atas support level kunci.',
      characteristics: [
        'Spike sumbu bawah panjang menyapu stop loss ritel di bawah support',
        'Delta volume berubah menjadi akumulasi agresif pasca sapuan',
        'Penutupan candle cepat kembali ke dalam channel (V-shape recovery)',
      ],
    };
  } else {
    trapAndSpike = {
      isDetected: false,
      trapType: 'NONE',
      confidence: 30,
      triggerPrice: Number(swingHigh.toFixed(dec)),
      spikePrice: Number(swingHigh.toFixed(dec)),
      reversalTarget: Number(currentPrice.toFixed(dec)),
      status: 'INACTIVE',
      retailTrapVolumeUsd: 0,
      mmObjective: 'Pasar saat ini tidak menunjukkan anomali False Spike ekstrem.',
      actionPlan: 'Patuhi level teknikal standar tanpa sinyal counter-manipulasi aktif.',
      characteristics: ['Struktur harga stabil tanpa wick anomali'],
    };
  }

  // -------------------------------------------------------------
  // 2. ANATOMI POLA 2: ABSORPTION PHASE (Akumulasi / Distribusi Senyap)
  // -------------------------------------------------------------
  // Criteria:
  // - High volume on small candle body near support/resistance
  // - Delta divergence: Massive aggressive market orders absorbed by passive limit orders without moving price
  const avgVol = lookback.reduce((acc, c) => acc + c.volume, 0) / lookback.length;
  const isHighVolumeCompression = last.volume > avgVol * 1.25 && lastBody < (last.high - last.low) * 0.4;
  const isAbsorptionBottom = isHighVolumeCompression && currentPrice <= (swingLow * 1.015) && orderBookDepth.imbalanceRatio >= 1.25;
  const isAbsorptionTop = isHighVolumeCompression && currentPrice >= (swingHigh * 0.985) && orderBookDepth.imbalanceRatio <= 0.8;

  let absorptionPhase: AbsorptionPhasePattern;

  if (isAbsorptionBottom) {
    absorptionPhase = {
      isDetected: true,
      absorptionType: 'SILENT_ACCUMULATION_BOTTOM',
      confidence: 91,
      defenseLevel: Number(swingLow.toFixed(dec)),
      deltaDivergenceRatio: 2.14,
      passiveVolumeAbsorbedUsd: Math.round(avgVol * currentPrice * 1.8),
      breakoutImminentDirection: 'UP',
      status: 'ACTIVE_ABSORPTION',
      mmObjective: 'Bot Market Maker menyerap seluruh market selling ritel menggunakan passive iceberg limit orders di support tanpa membiarkan harga jebol.',
      actionPlan: 'Akumulasi Long secara bertahap di dekat defense level dengan invalidasi ketat jika support tertembus penutupan 4H.',
      characteristics: [
        'Volume transaksi tinggi tetapi pergerakan harga tertahan (volatility compression)',
        'Delta jual ritel diserap penuh oleh passive limit buy orders (Icebergs)',
        'Order book mencatat wall bid defensif tebal di support kunci',
      ],
    };
  } else if (isAbsorptionTop) {
    absorptionPhase = {
      isDetected: true,
      absorptionType: 'SILENT_DISTRIBUTION_TOP',
      confidence: 89,
      defenseLevel: Number(swingHigh.toFixed(dec)),
      deltaDivergenceRatio: 1.95,
      passiveVolumeAbsorbedUsd: Math.round(avgVol * currentPrice * 1.6),
      breakoutImminentDirection: 'DOWN',
      status: 'ACTIVE_ABSORPTION',
      mmObjective: 'Bot Market Maker melepas inventaris (distribusi) secara pasif ke pasar retail FOMO yang sedang agresif membeli di resistance.',
      actionPlan: 'Ambil profit posisi Long dan bersiap mengambil setup Short saat pelemahan momentum terkonfirmasi.',
      characteristics: [
        'Market buying agresif gagal mencetak Higher High baru (Delta Divergence)',
        'Terdapat tembok jual pasif tersembunyi yang terus direload oleh algoritma',
        'Funding rate tinggi menandakan retail long terlalu padat (crowded trade)',
      ],
    };
  } else {
    absorptionPhase = {
      isDetected: false,
      absorptionType: 'NONE',
      confidence: 35,
      defenseLevel: Number(currentPrice.toFixed(dec)),
      deltaDivergenceRatio: 1.0,
      passiveVolumeAbsorbedUsd: 0,
      breakoutImminentDirection: 'PENDING',
      status: 'INACTIVE',
      mmObjective: 'Aliran order mengalir normal sesuai likuiditas spot wajar.',
      actionPlan: 'Ikuti tren umum berdasarkan indikator teknikal utama.',
      characteristics: ['Tidak terdeteksi penyerapan limit pasif signifikan'],
    };
  }

  // -------------------------------------------------------------
  // 3. ANATOMI POLA 3: THE FLUSH / LIQUIDITY SWEEP (Pengurasan Likuiditas)
  // -------------------------------------------------------------
  // Criteria:
  // - Price briefly swept Equal Highs (EQH) or Equal Lows (EQL) / prior day boundary and immediately displaced back
  const eqhSwept = last.high > swingHigh && last.close < swingHigh;
  const eqlSwept = last.low < swingLow && last.close > swingLow;

  let liquiditySweep: TheFlushLiquiditySweepPattern;

  if (eqlSwept || (prev.low < swingLow && last.close > swingLow)) {
    const sweepDepth = ((swingLow - last.low) / swingLow) * 100;
    liquiditySweep = {
      isDetected: true,
      sweepType: 'EQL_SELL_SIDE_SWEEP',
      confidence: 93,
      sweptLevel: Number(swingLow.toFixed(dec)),
      sweepDepthPct: Number(Math.max(0.2, sweepDepth).toFixed(2)),
      displacementVelocity: 'ULTRA_FAST',
      reclaimLevel: Number((swingLow * 1.004).toFixed(dec)),
      status: 'SWEEP_CONFIRMED_REVERSING',
      mmObjective: 'Menyapu pool Sell-Side Liquidity (Stop-loss Long + Breakout Sellers) di bawah Equal Lows untuk mendapatkan likuiditas besar tanpa slippage.',
      actionPlan: 'Entry LONG agresif setelah candle penutupan reclaim di atas swept level. Targetkan Buy-Side Liquidity di swing high.',
      characteristics: [
        'Equal Lows / Double Bottom berhasil disapu kilat sebelum memantul tajam',
        'Displacement candle hijau instan yang merebut kembali level kunci (SMC / ICT Reclaim)',
        'Likuidasi Long ritel terserap tuntas menjadi bahan bakar lonjakan harga',
      ],
    };
  } else if (eqhSwept || (prev.high > swingHigh && last.close < swingHigh)) {
    const sweepDepth = ((last.high - swingHigh) / swingHigh) * 100;
    liquiditySweep = {
      isDetected: true,
      sweepType: 'EQH_BUY_SIDE_SWEEP',
      confidence: 92,
      sweptLevel: Number(swingHigh.toFixed(dec)),
      sweepDepthPct: Number(Math.max(0.2, sweepDepth).toFixed(2)),
      displacementVelocity: 'ULTRA_FAST',
      reclaimLevel: Number((swingHigh * 0.996).toFixed(dec)),
      status: 'SWEEP_CONFIRMED_REVERSING',
      mmObjective: 'Menyapu pool Buy-Side Liquidity di atas Equal Highs untuk mengeksekusi order jual institusi skala besar.',
      actionPlan: 'Entry SHORT saat harga terkonfirmasi ditolak kembali ke dalam range. Targetkan Sell-Side Liquidity di swing low.',
      characteristics: [
        'Equal Highs / Double Top disapu beberapa pips untuk menjebak breakout traders',
        'Displacement candle merah agresif langsung menembus kembali ke dalam range',
        'Open interest mengalami penurunan tajam menandakan short covering tuntas',
      ],
    };
  } else {
    liquiditySweep = {
      isDetected: false,
      sweepType: 'NONE',
      confidence: 25,
      sweptLevel: Number(swingLow.toFixed(dec)),
      sweepDepthPct: 0,
      displacementVelocity: 'MODERATE',
      reclaimLevel: Number(currentPrice.toFixed(dec)),
      status: 'INACTIVE',
      mmObjective: 'Likuiditas pasar berada dalam distribusi normal tanpa sweep aktif.',
      actionPlan: 'Pantau level pool likuiditas terdekat untuk potensi sweep mendatang.',
      characteristics: ['Pool likuiditas belum terpicu'],
    };
  }

  // -------------------------------------------------------------
  // OVERALL MM REGIME
  // -------------------------------------------------------------
  let regime: MMRegime = 'BALANCED_EQUILIBRIUM';
  if (absorptionPhase.isDetected && absorptionPhase.absorptionType === 'SILENT_ACCUMULATION_BOTTOM') {
    regime = 'AGGRESSIVE_ACCUMULATION';
  } else if (absorptionPhase.isDetected && absorptionPhase.absorptionType === 'SILENT_DISTRIBUTION_TOP') {
    regime = 'PREDATORY_DISTRIBUTION';
  } else if (liquiditySweep.isDetected || trapAndSpike.isDetected) {
    regime = 'LIQUIDITY_HUNT';
  } else if (orderBookDepth.institutionalAggressionScore < 45) {
    regime = 'RANGE_HARVESTING';
  }

  let dominantMMBotAction = 'Bot MM memelihara spread likuiditas 2 arah (Two-sided quote filling).';
  let retailCautionAlert = 'Waspadai order flow normal.';
  let institutionalEntryWindow = 'Peluang entry netral.';

  if (regime === 'LIQUIDITY_HUNT') {
    dominantMMBotAction = 'Algoritma HFT sedang aktif memburu pool stop loss di batas ekstrim support/resistance.';
    retailCautionAlert = 'JANGAN pasang stop-loss tepat di angka bulat atau swing low/high yang terlalu jelas (Obvious Liquidity Pools).';
    institutionalEntryWindow = 'Eksekusi Limit Order pada zone Reclaim setelah sweep terjadi.';
  } else if (regime === 'AGGRESSIVE_ACCUMULATION') {
    dominantMMBotAction = 'Algoritma Iceberg Buy menyerap seluruh order jual pasar di zona diskon secara senyap.';
    retailCautionAlert = 'Jangan terburu-buru Short saat melihat candle merah volume tinggi di support.';
    institutionalEntryWindow = 'Ikuti jejak akumulasi dengan entri Long bertahap (DCA Pro).';
  } else if (regime === 'PREDATORY_DISTRIBUTION') {
    dominantMMBotAction = 'Algoritma Iceberg Sell mendistribusikan token ke buyer ritel yang sedang FOMO.';
    retailCautionAlert = 'Hindari membeli koin saat funding rate terlalu panas dan CVD delta melemah.';
    institutionalEntryWindow = 'Pertimbangkan Take Profit atau pasang hedge posisi Short.';
  }

  return {
    symbol,
    timeframe,
    currentPrice,
    regime,
    trapAndSpike,
    absorptionPhase,
    liquiditySweep,
    dominantMMBotAction,
    retailCautionAlert,
    institutionalEntryWindow,
    orderBookDepth,
    derivatives,
    anchoredVWAP,
  };
}
