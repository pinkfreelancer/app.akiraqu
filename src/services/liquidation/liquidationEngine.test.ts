import { describe, it, expect } from 'vitest';
import { computeLiquidationHeatmap } from './liquidationEngine';
import { OHLCVCandle } from '../../types/crypto.types';

describe('Liquidation Engine (services/liquidation)', () => {
  const mockCandles: OHLCVCandle[] = [
    { time: 1000, open: 50000, high: 50500, low: 49500, close: 50200, volume: 100 },
    { time: 2000, open: 50200, high: 51200, low: 50100, close: 51000, volume: 150 },
    { time: 3000, open: 51000, high: 51500, low: 50800, close: 50900, volume: 120 },
    { time: 4000, open: 50900, high: 51100, low: 49800, close: 50000, volume: 200 },
    { time: 5000, open: 50000, high: 50300, low: 49200, close: 49800, volume: 180 },
    { time: 6000, open: 49800, high: 50600, low: 49700, close: 50400, volume: 140 },
    { time: 7000, open: 50400, high: 51000, low: 50200, close: 50500, volume: 160 },
  ];

  it('computes liquidation heatmap with realistic clusters for both longs and shorts', () => {
    const result = computeLiquidationHeatmap(mockCandles, 'BTC/USDT', 50500);

    expect(result.symbol).toBe('BTC/USDT');
    expect(result.currentPrice).toBe(50500);
    expect(result.clusters.length).toBeGreaterThan(0);
    expect(result.totalLongLiqUsd).toBeGreaterThan(0);
    expect(result.totalShortLiqUsd).toBeGreaterThan(0);

    // Short liquidations must lie above current price
    const shorts = result.clusters.filter((c) => c.type === 'SHORT_LIQUIDATION');
    expect(shorts.length).toBeGreaterThan(0);
    shorts.forEach((s) => {
      expect(s.price).toBeGreaterThan(50500);
    });

    // Long liquidations must lie below current price
    const longs = result.clusters.filter((c) => c.type === 'LONG_LIQUIDATION');
    expect(longs.length).toBeGreaterThan(0);
    longs.forEach((l) => {
      expect(l.price).toBeLessThan(50500);
    });
  });

  it('normalizes intensity between 10 and 100', () => {
    const result = computeLiquidationHeatmap(mockCandles, 'BTC/USDT', 50500);

    result.clusters.forEach((c) => {
      expect(c.intensity).toBeGreaterThanOrEqual(10);
      expect(c.intensity).toBeLessThanOrEqual(100);
    });
  });

  it('calculates long/short ratio summing to 100', () => {
    const result = computeLiquidationHeatmap(mockCandles, 'BTC/USDT', 50500);

    expect(result.longLiqRatio + result.shortLiqRatio).toBe(100);
    expect(['SHORT_SQUEEZE_RISK', 'LONG_SQUEEZE_RISK', 'BALANCED']).toContain(result.imbalanceBias);
    expect(result.squeezeProbability).toBeGreaterThanOrEqual(50);
    expect(result.squeezeProbability).toBeLessThanOrEqual(100);
  });

  it('identifies major short and long liquidity magnets', () => {
    const result = computeLiquidationHeatmap(mockCandles, 'BTC/USDT', 50500);

    if (result.majorShortMagnet) {
      expect(result.majorShortMagnet.type).toBe('SHORT_LIQUIDATION');
      expect(result.majorShortMagnet.isMajorMagnet).toBe(true);
    }

    if (result.majorLongMagnet) {
      expect(result.majorLongMagnet.type).toBe('LONG_LIQUIDATION');
      expect(result.majorLongMagnet.isMajorMagnet).toBe(true);
    }
  });

  it('handles empty candles safely without crashing', () => {
    const result = computeLiquidationHeatmap([], 'ETH/USDT', 3000);

    expect(result.symbol).toBe('ETH/USDT');
    expect(result.currentPrice).toBe(3000);
    expect(Array.isArray(result.clusters)).toBe(true);
  });
});
