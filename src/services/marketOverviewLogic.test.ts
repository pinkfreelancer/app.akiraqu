import { describe, expect, it } from 'vitest';
import {
  classifyFearGreed,
  computeProportionalTreemap,
  generateMarketConclusion,
} from './marketOverviewLogic';

describe('marketOverviewLogic — Fear & Greed Classification', () => {
  it('maps 0..100 values to accurate zones, action advice, and ranges', () => {
    // 0–25: Extreme Fear -> Wait & See
    const ef0 = classifyFearGreed(0);
    expect(ef0.zone).toBe('EXTREME_FEAR');
    expect(ef0.labelId).toBe('Extreme Fear');
    expect(ef0.actionId).toBe('Wait & See');
    expect(ef0.rangeLabel).toBe('0–25');

    const ef25 = classifyFearGreed(25);
    expect(ef25.zone).toBe('EXTREME_FEAR');
    expect(ef25.actionId).toBe('Wait & See');

    // 26–45: Fear -> DCA
    const f26 = classifyFearGreed(26);
    expect(f26.zone).toBe('FEAR');
    expect(f26.labelId).toBe('Fear');
    expect(f26.actionId).toBe('DCA');
    expect(f26.rangeLabel).toBe('26–45');

    const f45 = classifyFearGreed(45);
    expect(f45.zone).toBe('FEAR');
    expect(f45.actionId).toBe('DCA');

    // 46–55: Neutral -> Good Entry
    const n46 = classifyFearGreed(46);
    expect(n46.zone).toBe('NEUTRAL');
    expect(n46.labelId).toBe('Neutral');
    expect(n46.actionId).toBe('Good Entry');
    expect(n46.rangeLabel).toBe('46–55');

    const n55 = classifyFearGreed(55);
    expect(n55.zone).toBe('NEUTRAL');
    expect(n55.actionId).toBe('Good Entry');

    // 56–75: Greed -> Warning
    const g56 = classifyFearGreed(56);
    expect(g56.zone).toBe('GREED');
    expect(g56.labelId).toBe('Greed');
    expect(g56.actionId).toBe('Warning');
    expect(g56.rangeLabel).toBe('56–75');

    const g75 = classifyFearGreed(75);
    expect(g75.zone).toBe('GREED');
    expect(g75.actionId).toBe('Warning');

    // 76–100: Ext. Greed -> Don't FOMO
    const eg76 = classifyFearGreed(76);
    expect(eg76.zone).toBe('EXTREME_GREED');
    expect(eg76.labelId).toBe('Ext. Greed');
    expect(eg76.actionId).toBe("Don't FOMO");
    expect(eg76.rangeLabel).toBe('76–100');

    const eg100 = classifyFearGreed(100);
    expect(eg100.zone).toBe('EXTREME_GREED');
    expect(eg100.actionId).toBe("Don't FOMO");

    // Null/undefined fallback
    expect(classifyFearGreed(null).labelId).toBe('Belum Tersedia');
  });
});

describe('marketOverviewLogic — Deterministic Plain-Language Market Summary', () => {
  it('generates bearish Indonesian summary when BTC, market cap, and breadth are negative', () => {
    const res = generateMarketConclusion({
      btcChange24h: -3.25,
      marketCapChange24hPct: -2.8,
      btcDominancePct: 59.4,
      advancingCount: 42,
      decliningCount: 198,
      fearGreedValue: 26,
      averageFundingPct: -0.012,
    });

    expect(res.regime).toBe('BEARISH');
    expect(res.summaryId).toContain('melemah');
    expect(res.summaryId).toContain('-3,25%');
    expect(res.summaryId).toContain('zona merah');
    expect(res.summaryId).toContain('short squeeze');
  });

  it('generates bullish Indonesian summary when market cap and breadth advance strongly', () => {
    const res = generateMarketConclusion({
      btcChange24h: 4.1,
      marketCapChange24hPct: 3.6,
      btcDominancePct: 53.2,
      advancingCount: 185,
      decliningCount: 55,
      fearGreedValue: 69,
      averageFundingPct: 0.01,
    });

    expect(res.regime).toBe('BULLISH');
    expect(res.summaryId).toContain('menguat');
    expect(res.summaryId).toContain('+4,10%');
    expect(res.summaryId).toContain('menghijau');
  });
});

describe('marketOverviewLogic — Proportional Treemap Layout', () => {
  it('allocates strictly larger areas to higher market-cap coins and fills 100x100% canvas', () => {
    const sample = [
      { symbol: 'BTC/USDT', mcap: 1_600_000_000_000 },
      { symbol: 'ETH/USDT', mcap: 300_000_000_000 },
      { symbol: 'SOL/USDT', mcap: 80_000_000_000 },
      { symbol: 'DOGE/USDT', mcap: 25_000_000_000 },
      { symbol: 'SUI/USDT', mcap: 9_000_000_000 },
    ];

    const rects = computeProportionalTreemap(sample, (i) => i.mcap);
    expect(rects).toHaveLength(5);

    const areas = rects.map((r) => ({ symbol: r.item.symbol, area: r.w * r.h }));
    const totalArea = areas.reduce((acc, a) => acc + a.area, 0);

    expect(totalArea).toBeCloseTo(10_000, 1); // 100 * 100 = 10,000
    expect(areas[0].symbol).toBe('BTC/USDT');
    expect(areas[0].area).toBeGreaterThan(areas[1].area);
    expect(areas[1].area).toBeGreaterThan(areas[2].area);
    expect(areas[2].area).toBeGreaterThan(areas[3].area);
    expect(areas[3].area).toBeGreaterThan(areas[4].area);
  });

  it('computes robust proportional treemap for 100 assets without degenerate or NaN tiles', () => {
    // Generate 100 sample assets from rank 1 ($1.8T) down to rank 100 ($300M)
    const top100 = Array.from({ length: 100 }, (_, idx) => {
      const rank = idx + 1;
      const mcap = Math.round(1_800_000_000_000 / Math.pow(rank, 1.25));
      return {
        symbol: `COIN${rank}/USDT`,
        baseAsset: `COIN${rank}`,
        mcap,
      };
    });

    const rects = computeProportionalTreemap(top100, (i) => i.mcap, 1.8);
    expect(rects).toHaveLength(100);

    for (const r of rects) {
      expect(Number.isFinite(r.x)).toBe(true);
      expect(Number.isFinite(r.y)).toBe(true);
      expect(Number.isFinite(r.w)).toBe(true);
      expect(Number.isFinite(r.h)).toBe(true);
      expect(r.w).toBeGreaterThan(0);
      expect(r.h).toBeGreaterThan(0);
      expect(r.x + r.w).toBeLessThanOrEqual(100.01);
      expect(r.y + r.h).toBeLessThanOrEqual(100.01);
    }

    const btcRect = rects.find((r) => r.item.symbol === 'COIN1/USDT')!;
    const rank100Rect = rects.find((r) => r.item.symbol === 'COIN100/USDT')!;
    expect(btcRect.w * btcRect.h).toBeGreaterThan(rank100Rect.w * rank100Rect.h);
  });
});
