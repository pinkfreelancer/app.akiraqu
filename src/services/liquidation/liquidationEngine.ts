import { OHLCVCandle, LiquidationCluster, LiquidationHeatmapSummary, LeverageTier } from '../../types/crypto.types';
import { getCryptoPrecision } from '../../utils/formatters';

const LEVERAGE_CONFIGS: { tier: LeverageTier; buffer: number; weight: number }[] = [
  { tier: '100x', buffer: 0.0085, weight: 1.4 }, // ~0.85% away from entry
  { tier: '50x', buffer: 0.0185, weight: 1.2 },  // ~1.85% away from entry
  { tier: '25x', buffer: 0.0385, weight: 1.0 },  // ~3.85% away from entry
  { tier: '10x', buffer: 0.0950, weight: 0.8 },  // ~9.50% away from entry
];

/**
 * Computes estimated liquidation clusters and squeeze probabilities from market structure and candle action.
 */
export function computeLiquidationHeatmap(
  candles: OHLCVCandle[],
  symbol: string,
  currentPriceOverride?: number
): LiquidationHeatmapSummary {
  if (!candles || candles.length === 0) {
    return {
      symbol,
      currentPrice: currentPriceOverride || 0,
      totalLongLiqUsd: 0,
      totalShortLiqUsd: 0,
      longLiqRatio: 50,
      shortLiqRatio: 50,
      imbalanceBias: 'BALANCED',
      squeezeProbability: 50,
      majorShortMagnet: null,
      majorLongMagnet: null,
      clusters: [],
    };
  }

  const currentPrice = currentPriceOverride || candles[candles.length - 1].close;
  const recentCandles = candles.slice(-75); // focus on recent 75 bars for active open interest
  const avgVolume = recentCandles.reduce((sum, c) => sum + c.volume, 0) / recentCandles.length || 1;

  // Base nominal volume scaler in $ millions based on symbol
  const baseVolumeMultiplier = symbol.includes('BTC') ? 22.5 : symbol.includes('ETH') ? 14.2 : symbol.includes('SOL') ? 7.8 : 3.5;

  const rawClusters: {
    price: number;
    type: 'LONG_LIQUIDATION' | 'SHORT_LIQUIDATION';
    tier: LeverageTier;
    volumeUsd: number;
    time: number;
  }[] = [];

  // Pivot detection lookback (local peaks and troughs)
  for (let i = 3; i < recentCandles.length - 3; i++) {
    const prev = recentCandles.slice(i - 3, i);
    const next = recentCandles.slice(i + 1, i + 4);
    const curr = recentCandles[i];
    const recencyWeight = 0.55 + 0.45 * (i / recentCandles.length); // recent pivots hold more open interest
    const volRatio = Math.min(3.0, Math.max(0.6, curr.volume / avgVolume));

    // Swing Low -> Long traders entered here -> Their liquidation is below this low
    const isSwingLow = prev.every((c) => c.low >= curr.low) && next.every((c) => c.low >= curr.low);
    if (isSwingLow) {
      for (const lev of LEVERAGE_CONFIGS) {
        const liqPrice = curr.low * (1 - lev.buffer);
        if (liqPrice < currentPrice) {
          const estimatedVol = Number((baseVolumeMultiplier * lev.weight * volRatio * recencyWeight).toFixed(2));
          rawClusters.push({
            price: liqPrice,
            type: 'LONG_LIQUIDATION',
            tier: lev.tier,
            volumeUsd: estimatedVol,
            time: curr.time,
          });
        }
      }
    }

    // Swing High -> Short traders entered here -> Their liquidation is above this high
    const isSwingHigh = prev.every((c) => c.high <= curr.high) && next.every((c) => c.high <= curr.high);
    if (isSwingHigh) {
      for (const lev of LEVERAGE_CONFIGS) {
        const liqPrice = curr.high * (1 + lev.buffer);
        if (liqPrice > currentPrice) {
          const estimatedVol = Number((baseVolumeMultiplier * lev.weight * volRatio * recencyWeight).toFixed(2));
          rawClusters.push({
            price: liqPrice,
            type: 'SHORT_LIQUIDATION',
            tier: lev.tier,
            volumeUsd: estimatedVol,
            time: curr.time,
          });
        }
      }
    }
  }

  // If few pivots found, generate micro-structure liquidity anchors from highs/lows of the session
  if (rawClusters.length < 6) {
    const sessionHigh = Math.max(...recentCandles.map((c) => c.high));
    const sessionLow = Math.min(...recentCandles.map((c) => c.low));

    for (const lev of LEVERAGE_CONFIGS) {
      const shortLiq = sessionHigh * (1 + lev.buffer);
      if (shortLiq > currentPrice) {
        rawClusters.push({
          price: shortLiq,
          type: 'SHORT_LIQUIDATION',
          tier: lev.tier,
          volumeUsd: Number((baseVolumeMultiplier * lev.weight * 1.3).toFixed(2)),
          time: Date.now(),
        });
      }

      const longLiq = sessionLow * (1 - lev.buffer);
      if (longLiq < currentPrice) {
        rawClusters.push({
          price: longLiq,
          type: 'LONG_LIQUIDATION',
          tier: lev.tier,
          volumeUsd: Number((baseVolumeMultiplier * lev.weight * 1.3).toFixed(2)),
          time: Date.now(),
        });
      }
    }
  }

  // Bucket and cluster close price points (within 0.35% range)
  const bucketStep = currentPrice * 0.0035;
  const bucketMap = new Map<string, {
    priceSum: number;
    count: number;
    type: 'LONG_LIQUIDATION' | 'SHORT_LIQUIDATION';
    tier: LeverageTier;
    volumeUsd: number;
  }>();

  for (const raw of rawClusters) {
    const bucketKey = `${raw.type}-${Math.round(raw.price / bucketStep)}`;
    const existing = bucketMap.get(bucketKey);
    if (existing) {
      existing.priceSum += raw.price;
      existing.count += 1;
      existing.volumeUsd += raw.volumeUsd;
    } else {
      bucketMap.set(bucketKey, {
        priceSum: raw.price,
        count: 1,
        type: raw.type,
        tier: raw.tier,
        volumeUsd: raw.volumeUsd,
      });
    }
  }

  const clusters: LiquidationCluster[] = [];
  let maxVolume = 0.1;

  bucketMap.forEach((val, key) => {
    const avgPrice = val.priceSum / val.count;
    const distancePct = Number((((avgPrice - currentPrice) / currentPrice) * 100).toFixed(2));
    if (val.volumeUsd > maxVolume) maxVolume = val.volumeUsd;

    const prec = getCryptoPrecision(avgPrice);
    clusters.push({
      id: key,
      price: Number(avgPrice.toFixed(prec)),
      type: val.type,
      leverageTier: val.tier,
      estimatedVolumeUsd: Number(val.volumeUsd.toFixed(1)),
      intensity: 0, // calculated next
      distancePct,
      isMajorMagnet: false,
    });
  });

  // Calculate normalized heatmap intensity (0 - 100)
  for (const c of clusters) {
    c.intensity = Math.min(100, Math.max(10, Math.round((c.estimatedVolumeUsd / maxVolume) * 100)));
  }

  // Sort clusters: Shorts ascending (closest to furthest above), Longs descending (closest to furthest below)
  const shortClusters = clusters.filter((c) => c.type === 'SHORT_LIQUIDATION').sort((a, b) => a.price - b.price);
  const longClusters = clusters.filter((c) => c.type === 'LONG_LIQUIDATION').sort((a, b) => b.price - a.price);

  // Identify Major Magnets (top volume in reasonable vicinity < 8%)
  const topShortMagnet = shortClusters.filter((c) => Math.abs(c.distancePct) <= 8).sort((a, b) => b.estimatedVolumeUsd - a.estimatedVolumeUsd)[0] || shortClusters[0] || null;
  const topLongMagnet = longClusters.filter((c) => Math.abs(c.distancePct) <= 8).sort((a, b) => b.estimatedVolumeUsd - a.estimatedVolumeUsd)[0] || longClusters[0] || null;

  if (topShortMagnet) topShortMagnet.isMajorMagnet = true;
  if (topLongMagnet) topLongMagnet.isMajorMagnet = true;

  // Aggregate totals
  const totalShortLiqUsd = Number(shortClusters.reduce((sum, c) => sum + c.estimatedVolumeUsd, 0).toFixed(1));
  const totalLongLiqUsd = Number(longClusters.reduce((sum, c) => sum + c.estimatedVolumeUsd, 0).toFixed(1));
  const totalPool = totalShortLiqUsd + totalLongLiqUsd || 1;

  const shortLiqRatio = Math.round((totalShortLiqUsd / totalPool) * 100);
  const longLiqRatio = 100 - shortLiqRatio;

  let imbalanceBias: 'SHORT_SQUEEZE_RISK' | 'LONG_SQUEEZE_RISK' | 'BALANCED' = 'BALANCED';
  let squeezeProbability = 50;

  if (shortLiqRatio >= 58) {
    imbalanceBias = 'SHORT_SQUEEZE_RISK';
    squeezeProbability = Math.min(94, Math.round(50 + (shortLiqRatio - 50) * 1.45));
  } else if (longLiqRatio >= 58) {
    imbalanceBias = 'LONG_SQUEEZE_RISK';
    squeezeProbability = Math.min(94, Math.round(50 + (longLiqRatio - 50) * 1.45));
  }

  // Combined sorted list for inspection
  const allSortedClusters = [...shortClusters, ...longClusters].sort((a, b) => b.price - a.price);

  return {
    symbol,
    currentPrice,
    totalLongLiqUsd,
    totalShortLiqUsd,
    longLiqRatio,
    shortLiqRatio,
    imbalanceBias,
    squeezeProbability,
    majorShortMagnet: topShortMagnet,
    majorLongMagnet: topLongMagnet,
    clusters: allSortedClusters,
  };
}
