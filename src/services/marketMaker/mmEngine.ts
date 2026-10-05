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
  LiveOrderBookLevel,
} from '../../types/crypto.types';
import { getCryptoPrecision } from '../../utils/formatters';

/**
 * Calculates Order Book Depth & Cumulative Volume Delta (CVD).
 * Integrates true exchange Level 2 orderbook if provided via WebSocket,
 * or applies heuristic order flow modeling with explicit transparency labels.
 */
export function computeOrderBookDepthAndDelta(
  candles: OHLCVCandle[],
  currentPrice: number,
  symbol: string,
  realOrderBookBids?: LiveOrderBookLevel[],
  realOrderBookAsks?: LiveOrderBookLevel[]
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

    // Use true exchange taker buy volume if available, otherwise compute aggressor fraction from candle body/range
    let buyVolume: number;
    let sellVolume: number;
    if (typeof c.takerBuyVolume === 'number' && c.takerBuyVolume >= 0) {
      buyVolume = c.takerBuyVolume;
      sellVolume = Math.max(0, c.volume - buyVolume);
    } else {
      const buyFraction = Math.max(0.08, Math.min(0.92, 0.5 + 0.5 * (body / range)));
      buyVolume = c.volume * buyFraction;
      sellVolume = c.volume * (1 - buyFraction);
    }
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

  const lastCvdTrend = runningCvd > 0
    ? (runningCvd > 5000 ? 'STRONG_ACCUMULATION' : 'MILD_ACCUMULATION')
    : (runningCvd < -5000 ? 'STRONG_DISTRIBUTION' : 'MILD_DISTRIBUTION');

  // Check if genuine live L2 order book data is available
  const hasRealBook = Array.isArray(realOrderBookBids) && realOrderBookBids.length > 0 &&
                      Array.isArray(realOrderBookAsks) && realOrderBookAsks.length > 0;

  let totalBidVol = 0;
  let totalAskVol = 0;
  let bidPercent = 50;
  let askPercent = 50;
  let imbalanceRatio = 1.0;
  const bidWalls: OrderBookWall[] = [];
  const askWalls: OrderBookWall[] = [];
  let isEstimated = true;
  let dataSourceLabel = 'Estimasi Profil Kedalaman (Model Volume CVD)';

  if (hasRealBook) {
    isEstimated = false;
    dataSourceLabel = 'Buku Order L2 Bursa (Live WebSocket)';

    // Compute volume from real bids/asks
    totalBidVol = realOrderBookBids.reduce((acc, b) => acc + (b.amount || 0), 0);
    totalAskVol = realOrderBookAsks.reduce((acc, a) => acc + (a.amount || 0), 0);
    const combinedTotal = totalBidVol + totalAskVol || 1;

    bidPercent = Number(((totalBidVol / combinedTotal) * 100).toFixed(1));
    askPercent = Number((100 - bidPercent).toFixed(1));
    imbalanceRatio = Number((totalBidVol / (totalAskVol || 1)).toFixed(2));

    // Map top 8 real order book bids
    realOrderBookBids.slice(0, 8).forEach((b) => {
      const distPct = safePrice > 0 ? Math.abs(((safePrice - b.price) / safePrice) * 100) : 0;
      bidWalls.push({
        price: b.price,
        amount: b.amount,
        volumeUsd: Math.round(b.price * b.amount),
        distancePct: Number(distPct.toFixed(2)),
        isSpoofSuspicion: false,
        type: 'BID',
      });
    });

    // Map top 8 real order book asks
    realOrderBookAsks.slice(0, 8).forEach((a) => {
      const distPct = safePrice > 0 ? Math.abs(((a.price - safePrice) / safePrice) * 100) : 0;
      askWalls.push({
        price: a.price,
        amount: a.amount,
        volumeUsd: Math.round(a.price * a.amount),
        distancePct: Number(distPct.toFixed(2)),
        isSpoofSuspicion: false,
        type: 'ASK',
      });
    });
  } else {
    // Baseline imbalance biased by current CVD trajectory (Heuristic Depth Model)
    const baseBidBias = runningCvd >= 0
      ? 0.54 + Math.min(0.25, Math.abs(runningCvd) / 20000)
      : 0.46 - Math.min(0.25, Math.abs(runningCvd) / 20000);
    bidPercent = Number((Math.min(82, Math.max(18, baseBidBias * 100))).toFixed(1));
    askPercent = Number((100 - bidPercent).toFixed(1));
    imbalanceRatio = Number((bidPercent / (askPercent || 1)).toFixed(2));

    const baseAssetMult = safePrice > 10000 ? 1.5 : safePrice > 100 ? 25 : 500;

    for (let i = 1; i <= 8; i++) {
      const distPct = 0.25 * i;
      const bidPrice = Number((safePrice * (1 - distPct / 100)).toFixed(dec));
      const depthCurve = Math.max(0.8, 2.5 - Math.log(i + 1) * 0.7);
      const harmonicBid = 1 + Math.sin(i * 1.84 + Math.abs(runningCvd % 10)) * 0.25;
      const bidAmount = Number(((depthCurve * harmonicBid + 1.2) * baseAssetMult).toFixed(2));
      const bidVolUsd = Math.round(bidPrice * bidAmount);
      totalBidVol += bidAmount;

      bidWalls.push({
        price: bidPrice,
        amount: bidAmount,
        volumeUsd: bidVolUsd,
        distancePct: Number(distPct.toFixed(2)),
        isSpoofSuspicion: false,
        type: 'BID',
      });

      const askPrice = Number((safePrice * (1 + distPct / 100)).toFixed(dec));
      const harmonicAsk = 1 + Math.cos(i * 1.84 + Math.abs(runningCvd % 10)) * 0.25;
      const askAmount = Number(((depthCurve * harmonicAsk + 1.2) * baseAssetMult).toFixed(2));
      const askVolUsd = Math.round(askPrice * askAmount);
      totalAskVol += askAmount;

      askWalls.push({
        price: askPrice,
        amount: askAmount,
        volumeUsd: askVolUsd,
        distancePct: Number(distPct.toFixed(2)),
        isSpoofSuspicion: false,
        type: 'ASK',
      });
    }
  }

  // Institutional aggression score (0 to 100)
  const institutionalAggressionScore = Math.min(
    96,
    Math.max(22, Math.round(Math.abs(bidPercent - 50) * 2.2 + Math.min(30, Math.abs(runningCvd) / 300)))
  );

  let spoofAlert: string | null = null;
  if (imbalanceRatio >= 2.2) {
    spoofAlert = hasRealBook
      ? `Tekanan beli agresif terdeteksi pada buku order live (Imbalance ${imbalanceRatio}x Bids dominan).`
      : `Tekanan order flow dominan beli terdeteksi pada estimasi profil CVD (${imbalanceRatio}x).`;
  } else if (imbalanceRatio <= 0.45) {
    spoofAlert = hasRealBook
      ? `Tekanan jual agresif terdeteksi pada buku order live (Imbalance ${(1 / imbalanceRatio).toFixed(1)}x Asks dominan).`
      : `Tekanan order flow dominan jual terdeteksi pada estimasi profil CVD.`;
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
    isEstimated,
    dataSourceLabel,
  };
}

/**
 * Calculates Open Interest (OI), Funding Rate, and OI-Price Divergence Patterns.
 * Uses true 24-hour timestamp lookback and explicit estimation labeling.
 */
export function computeDerivativesMetrics(
  candles: OHLCVCandle[],
  currentPrice: number,
  symbol: string,
  realDerivatives?: Partial<DerivativesMetrics>
): DerivativesMetrics {
  const safeCandles = Array.isArray(candles) ? candles : [];
  const safePrice = currentPrice > 0 ? currentPrice : (safeCandles.length > 0 ? safeCandles[safeCandles.length - 1].close : 100);

  // 1. Calculate true 24-hour price change from candle timestamps
  const lastTime = safeCandles.length > 0 ? safeCandles[safeCandles.length - 1].time : Date.now();
  const oneDayAgo = lastTime - 24 * 60 * 60 * 1000;
  const candle24h = safeCandles.find((c) => c.time >= oneDayAgo) || safeCandles[0];
  const firstPrice = candle24h ? candle24h.open : safePrice;
  const priceChange24hPct = firstPrice > 0 ? ((safePrice - firstPrice) / firstPrice) * 100 : 0;

  // Base Notional Scale based on token capitalization
  let baseNotionalUsd = 1450000000; // $1.45B default
  if (symbol.includes('BTC')) baseNotionalUsd = 19450000000; // $19.45B
  else if (symbol.includes('ETH')) baseNotionalUsd = 8820000000; // $8.82B
  else if (symbol.includes('SOL') || symbol.includes('BNB')) baseNotionalUsd = 2650000000; // $2.65B
  else if (safePrice < 1) baseNotionalUsd = 420000000;

  // Estimated OI Changes correlated to price and volatility
  const oiChange24hPct = realDerivatives?.oiChange24hPct !== undefined
    ? realDerivatives.oiChange24hPct
    : Number((priceChange24hPct * 0.72 + (Math.sin(safePrice) * 2.8)).toFixed(2));

  const oiChange4hPct = Number((oiChange24hPct * 0.35 + 0.4).toFixed(2));
  const oiChange1hPct = Number((oiChange4hPct * 0.28).toFixed(2));

  const openInterestUsd = realDerivatives?.openInterestUsd !== undefined
    ? realDerivatives.openInterestUsd
    : Math.round(baseNotionalUsd * (1 + oiChange24hPct / 100));

  const openInterestToken = Math.round(openInterestUsd / (safePrice || 1));

  // Funding rate calculation (8-hour standard)
  let fundingRate8h = 0.0100;
  if (realDerivatives?.fundingRate8h !== undefined) {
    fundingRate8h = realDerivatives.fundingRate8h;
  } else if (priceChange24hPct > 4) {
    fundingRate8h = Number((0.0100 + (priceChange24hPct - 4) * 0.0035).toFixed(4));
  } else if (priceChange24hPct < -4) {
    fundingRate8h = Number((0.0100 + (priceChange24hPct + 4) * 0.0045).toFixed(4));
  } else {
    fundingRate8h = Number((0.0075 + (Math.cos(safePrice) * 0.004)).toFixed(4));
  }
  fundingRate8h = Math.max(-0.0750, Math.min(0.0850, fundingRate8h));

  const fundingRateAnnualized = Number((fundingRate8h * 3 * 365).toFixed(2));
  const predictedNextFunding = Number((fundingRate8h * 1.05).toFixed(4));

  // Fix: Check extreme negative thresholds in descending severity order
  let fundingSentiment: 'OVERHEATED_LONGS' | 'HEALTHY_BULLISH' | 'NEUTRAL' | 'SHORT_SQUEEZE_FUEL' | 'EXTREME_BEARISH_HEAVY' = 'NEUTRAL';
  if (fundingRate8h > 0.0350) {
    fundingSentiment = 'OVERHEATED_LONGS';
  } else if (fundingRate8h > 0.0050) {
    fundingSentiment = 'HEALTHY_BULLISH';
  } else if (fundingRate8h < -0.0450) {
    // Extreme bearish short overcrowding
    fundingSentiment = 'EXTREME_BEARISH_HEAVY';
  } else if (fundingRate8h < -0.0200) {
    fundingSentiment = 'SHORT_SQUEEZE_FUEL';
  }

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

  // OI-Price Divergence Logic
  let divergenceType: OIDivergenceType = 'CONSOLIDATION';
  let significance: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
  let explanation = '';
  let actionImplication = '';

  if (priceChange24hPct > 1.5 && oiChange24hPct > 2.0) {
    divergenceType = 'RALLY_WITH_NEW_CAPITAL';
    significance = 'HIGH';
    explanation = 'Harga NAIK + Open Interest NAIK: Validasi inflow modal baru. Tren bullish memiliki struktur ekspansi yang kuat.';
    actionImplication = 'Fokus pada buy-on-dips di Order Block / Golden Pocket Fib.';
  } else if (priceChange24hPct > 1.5 && oiChange24hPct < -1.5) {
    divergenceType = 'SHORT_COVERING_PUMP';
    significance = 'HIGH';
    explanation = 'Harga NAIK + Open Interest TURUN: Kenaikan didorong penutupan paksa posisi Short (Short Squeeze), bukan modal ekspansi baru.';
    actionImplication = 'Hindari FOMO Buy di pucuk; pasang Trailing Stop ketat.';
  } else if (priceChange24hPct < -1.5 && oiChange24hPct > 2.0) {
    divergenceType = 'AGGRESSIVE_SHORTING';
    significance = 'HIGH';
    explanation = 'Harga TURUN + Open Interest NAIK: Posisi Short baru dibuka secara agresif di pasar derivatif. Tekanan jual berlanjut.';
    actionImplication = 'Tunggu sweep likuiditas di support sebelum mencari setup reversal.';
  } else if (priceChange24hPct < -1.5 && oiChange24hPct < -1.5) {
    divergenceType = 'LONG_UNWINDING_DUMP';
    significance = 'HIGH';
    explanation = 'Harga TURUN + Open Interest TURUN: Likuidasi berantai posisi Long (Capitulation). Potensi terbentuknya zona absorpsi pasif.';
    actionImplication = 'Pantau tanda-tanda silent absorption di CVD untuk potensi reversal spring.';
  } else {
    divergenceType = 'CONSOLIDATION';
    significance = 'LOW';
    explanation = 'Harga & Open Interest bergerak seimbang dalam rentang konsolidasi wajar.';
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
    isEstimated: true,
    dataSourceLabel: 'Estimasi Derivatif (Model Volatilitas & Harga)',
    oiPriceDivergence: {
      type: divergenceType,
      significance,
      explanation,
      actionImplication,
    },
  };
}

/**
 * Calculates Multi-Anchor Anchored VWAP.
 * Anchors Session VWAP dynamically to 00:00 UTC, Weekly VWAP to Monday 00:00 UTC,
 * and tracks genuine swing high/low pivots.
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
      sessionVWAP: fallbackAnchor('Daily Session VWAP (00:00 UTC)'),
      weeklyVWAP: fallbackAnchor('Weekly Anchored VWAP (Senin 00:00 UTC)'),
      swingHighAVWAP: fallbackAnchor('AVWAP dari Swing High (Resistance)'),
      swingLowAVWAP: fallbackAnchor('AVWAP dari Swing Low (Support)'),
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
    const series: { index: number; vwap: number }[] = [];

    for (let i = 0; i < subCandles.length; i++) {
      const c = subCandles[i];
      if (!c) continue;
      const tp = (c.high + c.low + c.close) / 3;
      tps.push(tp);
      cumTPV += tp * c.volume;
      cumV += c.volume;
      const curVwap = cumTPV / (cumV || 1);
      series.push({
        index: startIndex + i,
        vwap: Number(curVwap.toFixed(dec)),
      });
    }

    const vwap = cumTPV / (cumV || 1);

    // Standard deviation calculation
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
      startIndex,
      series,
    };
  };

  // 1. Session VWAP: Find candle at UTC date change (00:00 UTC)
  const lastCandle = safeCandles[safeCandles.length - 1];
  const lastDateStr = new Date(lastCandle.time).toISOString().slice(0, 10);
  let sessionIndex = 0;
  for (let i = safeCandles.length - 1; i >= 0; i--) {
    const dStr = new Date(safeCandles[i].time).toISOString().slice(0, 10);
    if (dStr !== lastDateStr) {
      sessionIndex = i + 1;
      break;
    }
  }
  sessionIndex = Math.min(sessionIndex, Math.max(0, safeCandles.length - 1));
  const sessionVWAP = calculateAnchor(sessionIndex, 'Daily Session VWAP (00:00 UTC)', safeCandles[sessionIndex]?.open || safePrice);

  // 2. Weekly VWAP: Find candle at Monday 00:00 UTC
  let weeklyIndex = 0;
  const currentWeekStart = new Date(lastCandle.time);
  const day = currentWeekStart.getUTCDay();
  const diffToMonday = (day + 6) % 7; // days since Monday
  currentWeekStart.setUTCDate(currentWeekStart.getUTCDate() - diffToMonday);
  currentWeekStart.setUTCHours(0, 0, 0, 0);
  const mondayMidnight = currentWeekStart.getTime();

  for (let i = 0; i < safeCandles.length; i++) {
    if (safeCandles[i].time >= mondayMidnight) {
      weeklyIndex = i;
      break;
    }
  }
  const weeklyVWAP = calculateAnchor(weeklyIndex, 'Weekly Anchored VWAP (Senin 00:00 UTC)', safeCandles[weeklyIndex]?.open || safePrice);

  // 3. Swing High & Swing Low Anchored VWAP
  let highestHigh = -Infinity;
  let highestIndex = 0;
  let lowestLow = Infinity;
  let lowestIndex = 0;

  safeCandles.forEach((c, idx) => {
    if (idx >= Math.max(0, safeCandles.length - 60)) {
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

  const swingHighAVWAP = calculateAnchor(highestIndex, 'AVWAP dari Swing High (Resistance)', highestHigh);
  const swingLowAVWAP = calculateAnchor(lowestIndex, 'AVWAP dari Swing Low (Support)', lowestLow);

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

  const dominantAnchor = safePrice >= sessionVWAP.vwap
    ? `Daily Session VWAP ($${sessionVWAP.vwap})`
    : `Swing High AVWAP ($${swingHighAVWAP.vwap})`;

  return {
    sessionVWAP,
    weeklyVWAP,
    swingHighAVWAP,
    swingLowAVWAP,
    currentZone,
    dominantAnchor,
    bias,
    confluenceSummary: `Harga berada ${currentZone.replace(/_/g, ' ')}. Dynamic Support di $${swingLowAVWAP.vwap} dan Resistance di $${swingHighAVWAP.vwap}.`,
  };
}

/**
 * Quantitative Detection of the Market Maker Playbook:
 * 1. The Trap & Spike
 * 2. Absorption Phase
 * 3. The Flush / Liquidity Sweep
 * 
 * Computes dynamic confidence scores and targets grounded in true market structure.
 */
export function analyzeMarketMakerPlaybook(
  candles: OHLCVCandle[],
  currentPrice: number,
  symbol: string,
  timeframe: Timeframe,
  realOrderBookBids?: LiveOrderBookLevel[],
  realOrderBookAsks?: LiveOrderBookLevel[]
): MMPlaybookAnalysis {
  const safeCandles = Array.isArray(candles) ? candles : [];
  const safePrice = currentPrice > 0 ? currentPrice : (safeCandles.length > 0 ? safeCandles[safeCandles.length - 1].close : 100);
  const dec = getCryptoPrecision(safePrice);
  const orderBookDepth = computeOrderBookDepthAndDelta(safeCandles, safePrice, symbol, realOrderBookBids, realOrderBookAsks);
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
        mmObjective: 'Memerlukan riwayat candle untuk mengevaluasi pola manipulasi.',
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
  const avgVol = lookback.reduce((acc, c) => acc + c.volume, 0) / (lookback.length || 1);

  const swingHigh = Math.max(...lookback.map((c) => c.high));
  const swingLow = Math.min(...lookback.map((c) => c.low));
  const swingRange = (swingHigh - swingLow) || (safePrice * 0.02);

  // -------------------------------------------------------------
  // 1. ANATOMI POLA 1: THE TRAP & SPIKE (Penciptaan Volatilitas Palsu)
  // -------------------------------------------------------------
  const lastUpperWick = last.high - Math.max(last.open, last.close);
  const lastLowerWick = Math.min(last.open, last.close) - last.low;
  const lastBody = Math.abs(last.close - last.open) || (safePrice * 0.0005);

  // Robust criteria: Long upper wick rejecting swing high with negative CVD delta
  const isBullTrapSpike = (last.high >= swingHigh * 0.998 || prev.high >= swingHigh * 0.998) &&
    (lastUpperWick > lastBody * 2.0 && last.close < last.high - lastUpperWick * 0.6) &&
    (orderBookDepth.currentCvd < 0 || derivatives.oiPriceDivergence.type === 'SHORT_COVERING_PUMP');

  // Robust criteria: Long lower wick rejecting swing low with positive CVD delta
  const isBearTrapSpring = (last.low <= swingLow * 1.002 || prev.low <= swingLow * 1.002) &&
    (lastLowerWick > lastBody * 2.0 && last.close > last.low + lastLowerWick * 0.6) &&
    (orderBookDepth.currentCvd > 0 || derivatives.oiPriceDivergence.type === 'LONG_UNWINDING_DUMP');

  let trapAndSpike: TheTrapAndSpikePattern;

  if (isBullTrapSpike) {
    // Dynamic confidence based on wick ratio and volume surge
    const dynamicConfidence = Math.min(95, Math.max(65, Math.round(55 + (lastUpperWick / lastBody) * 8 + Math.min(20, (last.volume / (avgVol || 1)) * 6))));
    const dynamicTarget = Number((safePrice - swingRange * 0.45).toFixed(dec));

    trapAndSpike = {
      isDetected: true,
      trapType: 'BULL_TRAP_SPOOF',
      confidence: dynamicConfidence,
      triggerPrice: Number(swingHigh.toFixed(dec)),
      spikePrice: Number(Math.max(last.high, prev.high).toFixed(dec)),
      reversalTarget: dynamicTarget,
      status: 'CONFIRMED_TRAP',
      retailTrapVolumeUsd: Math.round(safePrice * (last.volume * 0.45)),
      mmObjective: 'Memancing breakout buyer ritel & mengeksekusi stop-loss short di atas resistance sebelum menolak harga kembali ke value area.',
      actionPlan: 'Jangan kejar breakout hijau. Cari konfirmasi entry SHORT saat harga re-enter di bawah resistance dengan stop-loss di atas spike high.',
      characteristics: [
        `Spike sumbu atas tajam (${(lastUpperWick / lastBody).toFixed(1)}x body) menembus resistance`,
        `Delta CVD negatif (${orderBookDepth.currentCvd}) mengonfirmasi ketiadaan agresi beli institusi`,
        `Target mitigasi kembali ke zona support terdekat di $${dynamicTarget}`,
      ],
    };
  } else if (isBearTrapSpring) {
    const dynamicConfidence = Math.min(95, Math.max(65, Math.round(55 + (lastLowerWick / lastBody) * 8 + Math.min(20, (last.volume / (avgVol || 1)) * 6))));
    const dynamicTarget = Number((safePrice + swingRange * 0.45).toFixed(dec));

    trapAndSpike = {
      isDetected: true,
      trapType: 'BEAR_TRAP_SPRING',
      confidence: dynamicConfidence,
      triggerPrice: Number(swingLow.toFixed(dec)),
      spikePrice: Number(Math.min(last.low, prev.low).toFixed(dec)),
      reversalTarget: dynamicTarget,
      status: 'CONFIRMED_TRAP',
      retailTrapVolumeUsd: Math.round(safePrice * (last.volume * 0.45)),
      mmObjective: 'Memicu panic sell dan likuidasi Long ritel di bawah support untuk mengisi kuota beli institusi dengan harga diskon (Spring).',
      actionPlan: 'Konfirmasi entry LONG saat candle menutup kembali (reclaim) di atas support level kunci.',
      characteristics: [
        `Spike sumbu bawah panjang (${(lastLowerWick / lastBody).toFixed(1)}x body) menyapu stop loss ritel`,
        `Delta CVD positif (${orderBookDepth.currentCvd}) mengonfirmasi akumulasi pasca sapuan`,
        `Target pemulihan harga ke zona resistance di $${dynamicTarget}`,
      ],
    };
  } else {
    trapAndSpike = {
      isDetected: false,
      trapType: 'NONE',
      confidence: 25,
      triggerPrice: Number(swingHigh.toFixed(dec)),
      spikePrice: Number(swingHigh.toFixed(dec)),
      reversalTarget: Number(safePrice.toFixed(dec)),
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
  const isHighVolumeCompression = last.volume > avgVol * 1.3 && lastBody < (last.high - last.low) * 0.35;
  const isAbsorptionBottom = isHighVolumeCompression && safePrice <= (swingLow * 1.015) && orderBookDepth.imbalanceRatio >= 1.25;
  const isAbsorptionTop = isHighVolumeCompression && safePrice >= (swingHigh * 0.985) && orderBookDepth.imbalanceRatio <= 0.8;

  let absorptionPhase: AbsorptionPhasePattern;

  if (isAbsorptionBottom) {
    const dynamicConfidence = Math.min(96, Math.max(70, Math.round(60 + (last.volume / (avgVol || 1)) * 12 + orderBookDepth.imbalanceRatio * 8)));
    const dynamicRatio = Number(Math.max(1.5, Math.min(3.5, orderBookDepth.imbalanceRatio * 1.2)).toFixed(2));

    absorptionPhase = {
      isDetected: true,
      absorptionType: 'SILENT_ACCUMULATION_BOTTOM',
      confidence: dynamicConfidence,
      defenseLevel: Number(swingLow.toFixed(dec)),
      deltaDivergenceRatio: dynamicRatio,
      passiveVolumeAbsorbedUsd: Math.round(avgVol * safePrice * 1.8),
      breakoutImminentDirection: 'UP',
      status: 'ACTIVE_ABSORPTION',
      mmObjective: 'Bot Market Maker menyerap seluruh market selling ritel menggunakan passive limit orders di support tanpa membiarkan harga breakdown.',
      actionPlan: 'Akumulasi Long secara bertahap di dekat defense level dengan invalidasi jika support tertembus penutupan candle.',
      characteristics: [
        `Volume transaksi tinggi (${(last.volume / avgVol).toFixed(1)}x avg) tetapi pergerakan harga tertahan`,
        `Delta jual diserap oleh passive limit buy orders (Divergensi ${dynamicRatio}x)`,
        `Buku order menunjukkan rasio imbalance beli ${orderBookDepth.imbalanceRatio}x`,
      ],
    };
  } else if (isAbsorptionTop) {
    const dynamicConfidence = Math.min(96, Math.max(70, Math.round(60 + (last.volume / (avgVol || 1)) * 12 + (1 / (orderBookDepth.imbalanceRatio || 1)) * 8)));
    const dynamicRatio = Number(Math.max(1.5, Math.min(3.5, (1 / (orderBookDepth.imbalanceRatio || 1)) * 1.2)).toFixed(2));

    absorptionPhase = {
      isDetected: true,
      absorptionType: 'SILENT_DISTRIBUTION_TOP',
      confidence: dynamicConfidence,
      defenseLevel: Number(swingHigh.toFixed(dec)),
      deltaDivergenceRatio: dynamicRatio,
      passiveVolumeAbsorbedUsd: Math.round(avgVol * safePrice * 1.6),
      breakoutImminentDirection: 'DOWN',
      status: 'ACTIVE_ABSORPTION',
      mmObjective: 'Bot Market Maker melepas inventaris (distribusi) secara pasif ke pasar retail yang sedang agresif membeli di resistance.',
      actionPlan: 'Ambil profit posisi Long dan bersiap mengambil setup Short saat pelemahan momentum terkonfirmasi.',
      characteristics: [
        `Market buying agresif gagal mencetak Higher High baru (Delta Divergence)`,
        `Terdapat supply limit jual pasif yang menyerap agresi beli ritel`,
        `Rasio order book menunjukkan dominasi penawaran jual`,
      ],
    };
  } else {
    absorptionPhase = {
      isDetected: false,
      absorptionType: 'NONE',
      confidence: 30,
      defenseLevel: Number(safePrice.toFixed(dec)),
      deltaDivergenceRatio: 1.0,
      passiveVolumeAbsorbedUsd: 0,
      breakoutImminentDirection: 'PENDING',
      status: 'INACTIVE',
      mmObjective: 'Aliran order mengalir normal sesuai likuiditas wajar.',
      actionPlan: 'Ikuti tren umum berdasarkan indikator teknikal utama.',
      characteristics: ['Tidak terdeteksi penyerapan limit pasif signifikan'],
    };
  }

  // -------------------------------------------------------------
  // 3. ANATOMI POLA 3: THE FLUSH / LIQUIDITY SWEEP (Pengurasan Likuiditas)
  // -------------------------------------------------------------
  const eqhSwept = last.high > swingHigh && last.close < swingHigh;
  const eqlSwept = last.low < swingLow && last.close > swingLow;

  let liquiditySweep: TheFlushLiquiditySweepPattern;

  if (eqlSwept || (prev.low < swingLow && last.close > swingLow)) {
    const sweepDepth = Math.max(0.1, ((swingLow - last.low) / (swingLow || 1)) * 100);
    const dynamicConfidence = Math.min(96, Math.max(72, Math.round(65 + Math.min(25, sweepDepth * 15))));

    liquiditySweep = {
      isDetected: true,
      sweepType: 'EQL_SELL_SIDE_SWEEP',
      confidence: dynamicConfidence,
      sweptLevel: Number(swingLow.toFixed(dec)),
      sweepDepthPct: Number(sweepDepth.toFixed(2)),
      displacementVelocity: 'ULTRA_FAST',
      reclaimLevel: Number((swingLow * 1.004).toFixed(dec)),
      status: 'SWEEP_CONFIRMED_REVERSING',
      mmObjective: 'Menyapu pool Sell-Side Liquidity (Stop-loss Long + Breakout Sellers) di bawah Equal Lows untuk mengisi order beli institusi.',
      actionPlan: 'Entry LONG setelah candle penutupan reclaim di atas swept level. Targetkan Buy-Side Liquidity di swing high.',
      characteristics: [
        `Equal Lows disapu sedalam ${sweepDepth.toFixed(2)}% sebelum memantul tajam`,
        `Displacement candle merebut kembali level kunci di atas $${swingLow.toFixed(dec)}`,
        `Likuidasi stop loss ritel terserap menjadi bahan bakar pembalikan arah`,
      ],
    };
  } else if (eqhSwept || (prev.high > swingHigh && last.close < swingHigh)) {
    const sweepDepth = Math.max(0.1, ((last.high - swingHigh) / (swingHigh || 1)) * 100);
    const dynamicConfidence = Math.min(96, Math.max(72, Math.round(65 + Math.min(25, sweepDepth * 15))));

    liquiditySweep = {
      isDetected: true,
      sweepType: 'EQH_BUY_SIDE_SWEEP',
      confidence: dynamicConfidence,
      sweptLevel: Number(swingHigh.toFixed(dec)),
      sweepDepthPct: Number(sweepDepth.toFixed(2)),
      displacementVelocity: 'ULTRA_FAST',
      reclaimLevel: Number((swingHigh * 0.996).toFixed(dec)),
      status: 'SWEEP_CONFIRMED_REVERSING',
      mmObjective: 'Menyapu pool Buy-Side Liquidity di atas Equal Highs untuk mengeksekusi order jual institusi skala besar.',
      actionPlan: 'Entry SHORT saat harga terkonfirmasi ditolak kembali ke dalam range. Targetkan Sell-Side Liquidity di swing low.',
      characteristics: [
        `Equal Highs disapu sedalam ${sweepDepth.toFixed(2)}% menjebak breakout buyers`,
        `Displacement candle merah langsung menembus kembali ke dalam range`,
        `Penyusutan agresi beli setelah pool likuiditas terpicu`,
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
      reclaimLevel: Number(safePrice.toFixed(dec)),
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

  let dominantMMBotAction = 'Algoritma MM memelihara spread likuiditas 2 arah (Two-sided market making).';
  let retailCautionAlert = 'Waspadai order flow normal.';
  let institutionalEntryWindow = 'Peluang entry netral.';

  if (regime === 'LIQUIDITY_HUNT') {
    dominantMMBotAction = 'Algoritma HFT aktif memburu pool stop loss di batas ekstrim support/resistance.';
    retailCautionAlert = 'JANGAN pasang stop-loss tepat di angka bulat atau swing low/high yang terlalu jelas.';
    institutionalEntryWindow = 'Eksekusi Limit Order pada zone Reclaim setelah sweep terjadi.';
  } else if (regime === 'AGGRESSIVE_ACCUMULATION') {
    dominantMMBotAction = 'Algoritma Iceberg Buy menyerap order jual pasar di zona diskon secara senyap.';
    retailCautionAlert = 'Hindari panic selling saat melihat candle merah volume tinggi tertahan di support.';
    institutionalEntryWindow = 'Ikuti jejak akumulasi dengan entri Long bertahap.';
  } else if (regime === 'PREDATORY_DISTRIBUTION') {
    dominantMMBotAction = 'Algoritma Iceberg Sell mendistribusikan token ke buyer ritel yang sedang FOMO.';
    retailCautionAlert = 'Hindari membeli koin saat funding rate terlalu panas dan delta CVD melemah.';
    institutionalEntryWindow = 'Pertimbangkan Take Profit atau pasang hedge posisi Short.';
  }

  return {
    symbol,
    timeframe,
    currentPrice: safePrice,
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
