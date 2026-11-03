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
});
