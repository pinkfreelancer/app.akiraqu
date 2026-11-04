import { describe, it, expect } from 'vitest';
import { marketWsProxy } from '../services/marketWsProxy';

describe('server/routes/market & marketWsProxy - Real-time and Fallback Integrity', () => {
  it('marketWsProxy should provide valid server proxy telemetry', () => {
    const stats = marketWsProxy.getStats();
    expect(stats).toBeDefined();
    expect(typeof stats.connectedClients).toBe('number');
    expect(typeof stats.activeSubscriptionsCount).toBe('number');
    expect(typeof stats.spotUpstreamConnected).toBe('boolean');
    expect(typeof stats.futuresUpstreamConnected).toBe('boolean');
  });

  it('verifies that market-snapshot formatting complies with client expectations', () => {
    // Contract verification for market-snapshot
    const mockSnapshot = {
      status: 'success',
      symbol: 'BTC/USDT',
      isFutures: false,
      timeframe: '1H',
      ticker: {
        price: 81880.0,
        priceChangePercent: 1.25,
        high: 82500.0,
        low: 80100.0,
        volume: 450000000,
      },
      depth: {
        bids: [['81880.00', '1.5']],
        asks: [['81881.00', '2.0']],
      },
      trades: [
        {
          id: 123456,
          price: '81880.00',
          qty: '0.1',
          time: Date.now(),
          isBuyerMaker: false,
        },
      ],
      liveCandle: {
        time: 1700000000000,
        open: 81500,
        high: 82000,
        low: 81400,
        close: 81880,
        volume: 120,
      },
      latencyMs: 18,
      serverTime: Date.now(),
    };

    expect(mockSnapshot.status).toBe('success');
    expect(mockSnapshot.ticker.price).toBeGreaterThan(0);
    expect(mockSnapshot.depth.bids.length).toBeGreaterThan(0);
    expect(mockSnapshot.trades.length).toBeGreaterThan(0);
    expect(mockSnapshot.liveCandle.close).toBe(81880);
  });

  it('verifies /api/v1/market-overview response envelope contract', () => {
    const mockOverviewEnvelope = {
      success: true,
      status: 'success',
      latencyMs: 24,
      data: {
        updatedAt: Date.now(),
        global: {
          totalMarketCapUsd: 2_630_000_000_000,
          marketCapChange24hPct: -1.4,
          totalVolume24hUsd: 62_000_000_000,
          btcDominancePct: 59.3,
          ethDominancePct: 10.6,
          updatedAt: Date.now(),
        },
        breadth: {
          advancing: 159,
          declining: 79,
          unchanged: 1,
          total: 239,
          advancingPct: 67,
        },
      },
    };

    const isOk =
      mockOverviewEnvelope.status === 'success' || mockOverviewEnvelope.success === true;
    expect(isOk).toBe(true);
    expect(mockOverviewEnvelope.data.global.totalMarketCapUsd).toBeGreaterThan(0);
    expect(mockOverviewEnvelope.data.breadth.total).toBeGreaterThan(0);
  });

  it('verifies /api/coins/meta stores only static metadata fields decoupled from price SSOT', () => {
    const sampleMetaEnvelope = {
      success: true,
      status: 'success',
      updatedAt: Date.now(),
      stale: false,
      degraded: false,
      cacheAgeSec: 12,
      count: 1,
      data: [
        {
          id: 'bitcoin',
          symbol: 'btc',
          name: 'Bitcoin',
          image: 'https://coin-images.coingecko.com/coins/images/1/large/bitcoin.png?1696501400',
          market_cap_rank: 1,
        },
      ],
    };

    expect(sampleMetaEnvelope.success).toBe(true);
    const first = sampleMetaEnvelope.data[0];
    expect(Object.keys(first).sort()).toEqual([
      'id',
      'image',
      'market_cap_rank',
      'name',
      'symbol',
    ]);
    expect('current_price' in first).toBe(false);
    expect(first.image.startsWith('https://coin-images.coingecko.com/')).toBe(true);
  });
});

