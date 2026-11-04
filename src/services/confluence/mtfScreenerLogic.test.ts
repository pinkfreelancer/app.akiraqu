import { describe, expect, it } from 'vitest';
import { OHLCVCandle } from '../../types/crypto.types';
import { computeCandleConsensus } from './signalConsensus';
import {
  biasToActionSignal,
  computeMtfConfluence,
  DEFAULT_MTF_FILTERS,
  evaluateMtfTimeframeSignal,
  filterMtfRows,
  isStablecoinPair,
  MtfActionSignal,
  MtfScreenerRowModel,
  MtfTimeframeKey,
  parseMtfStateFromSearchParams,
  serializeMtfStateToSearchParams,
  sortMtfRows,
} from './mtfScreenerLogic';

function buildSyntheticCandles(
  mode: 'uptrend' | 'downtrend' | 'flat',
  count = 150
): OHLCVCandle[] {
  const candles: OHLCVCandle[] = [];
  let price = mode === 'downtrend' ? 300 : 100;
  const t0 = 1_700_000_000_000;

  for (let i = 0; i < count; i++) {
    let delta = 0;
    if (mode === 'uptrend') {
      delta = 0.8 + (i % 3 === 0 ? 0.4 : 0.15);
    } else if (mode === 'downtrend') {
      delta = -0.8 - (i % 3 === 0 ? 0.4 : 0.15);
    } else {
      delta = i % 2 === 0 ? 0.15 : -0.15;
    }

    const open = Math.max(5, price);
    const close = Math.max(5, open + delta);
    const high = Math.max(open, close) + 0.35;
    const low = Math.max(1, Math.min(open, close) - 0.35);
    const volume = 1000 + i * 10;
    const takerBuyVolume =
      mode === 'uptrend' ? volume * 0.72 : mode === 'downtrend' ? volume * 0.28 : volume * 0.5;

    candles.push({
      time: t0 + i * 60_000,
      open,
      high,
      low,
      close,
      volume,
      quoteVolume: volume * close,
      takerBuyVolume,
    });
    price = close;
  }

  return candles;
}

function makeMockRow(
  symbol: string,
  signals: Record<MtfTimeframeKey, MtfActionSignal | null>,
  overrides: Partial<MtfScreenerRowModel> = {}
): MtfScreenerRowModel {
  const baseAsset = symbol.split('/')[0];
  return {
    symbol,
    baseAsset,
    name: baseAsset,
    price: 100,
    change24h: 2.5,
    volume24h: 50_000_000,
    marketCap: 1_000_000_000,
    rsi14: 55,
    fundingRate: 0.01,
    signals,
    confluence: computeMtfConfluence(signals),
    hydratedCount: Object.values(signals).filter((v) => v !== null).length,
    updatedAt: 1_700_000_000_000,
    ...overrides,
  };
}

describe('mtfScreenerLogic — BUY / SELL / FLAT Determination & Main Chart Parity', () => {
  it('determines BUY on sustained bullish candles and matches Main Chart computeCandleConsensus', () => {
    const bullCandles = buildSyntheticCandles('uptrend', 150);
    const mtfEval = evaluateMtfTimeframeSignal(bullCandles);
    const mainChartEval = computeCandleConsensus(bullCandles);

    expect(mtfEval).not.toBeNull();
    expect(mainChartEval).not.toBeNull();
    expect(mtfEval!.signal).toBe('BUY');
    expect(mtfEval!.score).toBe(mainChartEval!.score);
    expect(mtfEval!.signal).toBe(biasToActionSignal(mainChartEval!.marketBias, mainChartEval!.score));
    expect(mtfEval!.ema20).toBeGreaterThan(mtfEval!.ema50);
  });

  it('determines SELL on sustained bearish candles and matches Main Chart computeCandleConsensus', () => {
    const bearCandles = buildSyntheticCandles('downtrend', 150);
    const mtfEval = evaluateMtfTimeframeSignal(bearCandles);
    const mainChartEval = computeCandleConsensus(bearCandles);

    expect(mtfEval).not.toBeNull();
    expect(mainChartEval).not.toBeNull();
    expect(mtfEval!.signal).toBe('SELL');
    expect(mtfEval!.score).toBe(mainChartEval!.score);
    expect(mtfEval!.signal).toBe(biasToActionSignal(mainChartEval!.marketBias, mainChartEval!.score));
    expect(mtfEval!.ema20).toBeLessThan(mtfEval!.ema50);
  });

  it('determines FLAT on balanced oscillating candles and returns null when < 20 candles', () => {
    const flatCandles = buildSyntheticCandles('flat', 150);
    const mtfEval = evaluateMtfTimeframeSignal(flatCandles);
    const mainChartEval = computeCandleConsensus(flatCandles);

    expect(mtfEval).not.toBeNull();
    expect(mtfEval!.signal).toBe('FLAT');
    expect(mtfEval!.signal).toBe(biasToActionSignal(mainChartEval!.marketBias, mainChartEval!.score));

    expect(evaluateMtfTimeframeSignal(flatCandles.slice(0, 10))).toBeNull();
  });
});

describe('mtfScreenerLogic — Confluence Scoring & Alignment Classification', () => {
  it('scores 6/6 Bullish (100%) and 6/6 Bearish (100%) accurately', () => {
    const allBull = computeMtfConfluence({
      '1m': 'BUY',
      '5m': 'BUY',
      '15m': 'BUY',
      '1H': 'BUY',
      '4H': 'BUY',
      '1D': 'BUY',
    });
    expect(allBull.isAllBull).toBe(true);
    expect(allBull.isGte5Bull).toBe(true);
    expect(allBull.isMixed).toBe(false);
    expect(allBull.alignmentPct).toBe(100);
    expect(allBull.confluenceRank).toBe(100);
    expect(allBull.labelId).toBe('6/6 Bullish (100%)');

    const allBear = computeMtfConfluence({
      '1m': 'SELL',
      '5m': 'SELL',
      '15m': 'SELL',
      '1H': 'SELL',
      '4H': 'SELL',
      '1D': 'SELL',
    });
    expect(allBear.isAllBear).toBe(true);
    expect(allBear.isGte5Bear).toBe(true);
    expect(allBear.isMixed).toBe(false);
    expect(allBear.confluenceRank).toBe(100);
    expect(allBear.labelId).toBe('6/6 Bearish (100%)');
  });

  it('classifies 5/6 Bullish and ranks 5 BUY + 1 FLAT higher than 5 BUY + 1 SELL', () => {
    const fiveBullFlat = computeMtfConfluence({
      '1m': 'FLAT',
      '5m': 'BUY',
      '15m': 'BUY',
      '1H': 'BUY',
      '4H': 'BUY',
      '1D': 'BUY',
    });
    const fiveBullOppose = computeMtfConfluence({
      '1m': 'SELL',
      '5m': 'BUY',
      '15m': 'BUY',
      '1H': 'BUY',
      '4H': 'BUY',
      '1D': 'BUY',
    });

    expect(fiveBullFlat.isAllBull).toBe(false);
    expect(fiveBullFlat.isGte5Bull).toBe(true);
    expect(fiveBullFlat.alignmentPct).toBe(83);
    expect(fiveBullFlat.confluenceRank).toBeGreaterThan(fiveBullOppose.confluenceRank);
  });

  it('classifies Mixed and unhydrated rows gracefully', () => {
    const mixed = computeMtfConfluence({
      '1m': 'BUY',
      '5m': 'BUY',
      '15m': 'SELL',
      '1H': 'SELL',
      '4H': 'FLAT',
      '1D': 'FLAT',
    });
    expect(mixed.isMixed).toBe(true);
    expect(mixed.isGte5Bull).toBe(false);
    expect(mixed.isGte5Bear).toBe(false);

    const empty = computeMtfConfluence({
      '1m': null,
      '5m': null,
      '15m': null,
      '1H': null,
      '4H': null,
      '1D': null,
    });
    expect(empty.evaluatedCount).toBe(0);
    expect(empty.confluenceRank).toBe(-1);
    expect(empty.labelId).toBe('—');
  });
});

describe('mtfScreenerLogic — Filtering, Sorting & URL Query Persistence', () => {
  const sampleRows: MtfScreenerRowModel[] = [
    makeMockRow(
      'BTC/USDT',
      { '1m': 'BUY', '5m': 'BUY', '15m': 'BUY', '1H': 'BUY', '4H': 'BUY', '1D': 'BUY' },
      { volume24h: 8_000_000_000, rsi14: 64, fundingRate: 0.01 }
    ),
    makeMockRow(
      'SOL/USDT',
      { '1m': 'FLAT', '5m': 'BUY', '15m': 'BUY', '1H': 'BUY', '4H': 'BUY', '1D': 'BUY' },
      { volume24h: 2_500_000_000, rsi14: 59, fundingRate: 0.015 }
    ),
    makeMockRow(
      'ETH/USDT',
      { '1m': 'SELL', '5m': 'SELL', '15m': 'SELL', '1H': 'SELL', '4H': 'SELL', '1D': 'SELL' },
      { volume24h: 5_000_000_000, rsi14: 34, fundingRate: -0.008 }
    ),
    makeMockRow(
      'USDC/USDT',
      { '1m': 'FLAT', '5m': 'FLAT', '15m': 'FLAT', '1H': 'FLAT', '4H': 'FLAT', '1D': 'FLAT' },
      { volume24h: 1_200_000_000, rsi14: 50, fundingRate: null }
    ),
  ];

  it('identifies stablecoin pairs accurately', () => {
    expect(isStablecoinPair('USDC/USDT')).toBe(true);
    expect(isStablecoinPair('FDUSD/USDT')).toBe(true);
    expect(isStablecoinPair('BTC/USDT')).toBe(false);
    expect(isStablecoinPair('1000PEPE/USDT')).toBe(false);
  });

  it('filters by quickTab, hideStablecoins, numeric ranges, and per-timeframe rules (4H=BUY & 1D=BUY)', () => {
    const gte5Bull = filterMtfRows(sampleRows, {
      ...DEFAULT_MTF_FILTERS,
      quickTab: 'BULL_GTE5',
    });
    expect(gte5Bull.map((r) => r.symbol)).toEqual(['BTC/USDT', 'SOL/USDT']);

    const tfCombo = filterMtfRows(sampleRows, {
      ...DEFAULT_MTF_FILTERS,
      hideStablecoins: true,
      rsiMin: 60,
      tfFilters: { '4H': 'BUY', '1D': 'BUY' },
    });
    expect(tfCombo.map((r) => r.symbol)).toEqual(['BTC/USDT']);
  });

  it('sorts default by Confluence DESC then Volume 24h DESC, pushing null metrics to bottom', () => {
    const sortedDefault = sortMtfRows(sampleRows, { column: 'confluence', direction: 'desc' });
    // BTC (6/6, $8B) first, ETH (6/6, $5B) second, SOL (5/6, $2.5B) third, USDC (0 directional) fourth
    expect(sortedDefault.map((r) => r.symbol)).toEqual([
      'BTC/USDT',
      'ETH/USDT',
      'SOL/USDT',
      'USDC/USDT',
    ]);

    const sortedFundingAsc = sortMtfRows(sampleRows, { column: 'fundingRate', direction: 'asc' });
    // ETH (-0.008) -> BTC (0.01) -> SOL (0.015) -> USDC (null pushed to bottom)
    expect(sortedFundingAsc.map((r) => r.symbol)).toEqual([
      'ETH/USDT',
      'BTC/USDT',
      'SOL/USDT',
      'USDC/USDT',
    ]);
  });

  it('serializes and restores filter & sort state via URLSearchParams', () => {
    const originalFilters = {
      ...DEFAULT_MTF_FILTERS,
      search: 'SOL',
      quickTab: 'BULL_GTE5' as const,
      volume24hMin: 10_000_000,
      rsiMin: 45,
      rsiMax: 75,
      fundingMin: -0.02,
      hideStablecoins: true,
      tfFilters: { '4H': 'BUY' as const, '1D': 'BUY' as const },
    };
    const originalSort = { column: 'volume24h' as const, direction: 'desc' as const };

    const params = serializeMtfStateToSearchParams(originalFilters, originalSort);
    const restored = parseMtfStateFromSearchParams(params.toString());

    expect(restored.filters).toEqual(originalFilters);
    expect(restored.sort).toEqual(originalSort);
  });

  it('filters and sorts 250 coins in well under 200ms', () => {
    const bulkRows: MtfScreenerRowModel[] = Array.from({ length: 250 }, (_, idx) => {
      const sig: MtfActionSignal = idx % 3 === 0 ? 'BUY' : idx % 3 === 1 ? 'SELL' : 'FLAT';
      return makeMockRow(
        `COIN${idx}/USDT`,
        { '1m': sig, '5m': sig, '15m': sig, '1H': 'BUY', '4H': 'BUY', '1D': sig },
        {
          volume24h: (250 - idx) * 1_500_000,
          rsi14: 25 + (idx % 60),
          fundingRate: -0.02 + (idx % 10) * 0.005,
        }
      );
    });

    const t0 = performance.now();
    const filtered = filterMtfRows(bulkRows, {
      ...DEFAULT_MTF_FILTERS,
      volume24hMin: 5_000_000,
      tfFilters: { '4H': 'BUY' },
    });
    const sorted = sortMtfRows(filtered, { column: 'confluence', direction: 'desc' });
    const elapsedMs = performance.now() - t0;

    expect(sorted.length).toBeGreaterThan(200);
    expect(elapsedMs).toBeLessThan(200);
  });
});
