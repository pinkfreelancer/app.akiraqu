import { describe, it, expect } from 'vitest';
import {
  normalizeSymbol,
  validatePriceTick,
  validateOrderBookPayload,
  computeReconnectDelayMs,
  computeFeedStatus,
} from './marketDataValidator';

describe('marketDataValidator', () => {
  describe('normalizeSymbol', () => {
    it('normalizes Binance, OKX, Bybit, and KuCoin symbol formats into BASE/QUOTE', () => {
      expect(normalizeSymbol('btcusdt')).toBe('BTC/USDT');
      expect(normalizeSymbol('BTC-USDT')).toBe('BTC/USDT');
      expect(normalizeSymbol('BTC-USDT-SWAP')).toBe('BTC/USDT');
      expect(normalizeSymbol('ETH_USDT_PERP')).toBe('ETH/USDT');
      expect(normalizeSymbol('SOL/USDT:USDT')).toBe('SOL/USDT');
      expect(normalizeSymbol('  pepeusdt  ')).toBe('PEPE/USDT');
    });
  });

  describe('validatePriceTick', () => {
    it('accepts initial valid price anchor when no reference exists', () => {
      const res = validatePriceTick({
        payloadSymbol: 'btcusdt',
        expectedSymbol: 'BTC/USDT',
        price: 80484.5,
      });
      expect(res.valid).toBe(true);
      expect(res.normalizedSymbol).toBe('BTC/USDT');
      expect(res.price).toBe(80484.5);
    });

    it('rejects non-finite or non-positive prices', () => {
      expect(validatePriceTick({ payloadSymbol: 'BTC/USDT', price: 0 }).valid).toBe(false);
      expect(validatePriceTick({ payloadSymbol: 'BTC/USDT', price: -12 }).valid).toBe(false);
      expect(validatePriceTick({ payloadSymbol: 'BTC/USDT', price: Number.NaN }).valid).toBe(false);
    });

    it('rejects payload when symbol does not match active expectedSymbol', () => {
      const res = validatePriceTick({
        payloadSymbol: 'KAS/USDT',
        expectedSymbol: 'BTC/USDT',
        price: 0.035,
      });
      expect(res.valid).toBe(false);
      expect(res.reason).toBe('SYMBOL_MISMATCH');
    });

    it('rejects anomalous price deviating > 5% from fresh reference price', () => {
      const now = 1_700_000_000_000;
      const badSpike = validatePriceTick({
        payloadSymbol: 'BTC/USDT',
        expectedSymbol: 'BTC/USDT',
        price: 88450, // >5% away from 80484 (~9.9% deviation)
        referencePrice: 80484,
        referenceUpdatedAt: now - 2000,
        now,
      });
      expect(badSpike.valid).toBe(false);
      expect(badSpike.reason).toBe('EXCESSIVE_DEVIATION');

      const normalMove = validatePriceTick({
        payloadSymbol: 'BTC/USDT',
        expectedSymbol: 'BTC/USDT',
        price: 80620, // ~0.17% move
        referencePrice: 80484,
        referenceUpdatedAt: now - 2000,
        now,
      });
      expect(normalMove.valid).toBe(true);
    });
  });

  describe('validateOrderBookPayload', () => {
    it('rejects $0.03 residual order book levels when active pair is BTC/USDT (~$80,484)', () => {
      const contaminated = validateOrderBookPayload({
        payloadSymbol: 'BTC/USDT',
        expectedSymbol: 'BTC/USDT',
        referencePrice: 80484,
        bids: [
          [0.0358, 1200],
          [0.0357, 2500],
        ],
        asks: [
          [0.0359, 1400],
          [0.036, 1800],
        ],
      });
      expect(contaminated.valid).toBe(false);
      expect(contaminated.reason).toBe('BEST_QUOTE_DEVIATION');
      expect(contaminated.bids).toHaveLength(0);
      expect(contaminated.asks).toHaveLength(0);
    });

    it('rejects order book when payloadSymbol differs from expectedSymbol', () => {
      const mismatch = validateOrderBookPayload({
        payloadSymbol: 'SAND/USDT',
        expectedSymbol: 'BTC/USDT',
        referencePrice: 80484,
        bids: [[0.036, 5000]],
        asks: [[0.0362, 5000]],
      });
      expect(mismatch.valid).toBe(false);
      expect(mismatch.reason).toBe('SYMBOL_MISMATCH');
    });

    it('filters out extreme outlier walls (>20% off reference) while keeping valid L2 levels', () => {
      const clean = validateOrderBookPayload({
        payloadSymbol: 'BTC/USDT',
        expectedSymbol: 'BTC/USDT',
        referencePrice: 80484,
        bids: [
          [80480, 1.5],
          [80450, 2.2],
          [0.03, 999999], // corrupted outlier level
        ],
        asks: [
          [80488, 1.1],
          [80510, 3.4],
          [250000, 50], // corrupted outlier level
        ],
      });
      expect(clean.valid).toBe(true);
      expect(clean.bids).toHaveLength(2);
      expect(clean.asks).toHaveLength(2);
      expect(clean.bestBid).toBe(80480);
      expect(clean.bestAsk).toBe(80488);
      expect(clean.spread).toBe(8);
    });

    it('rejects crossed order books where bestBid >= bestAsk', () => {
      const crossed = validateOrderBookPayload({
        payloadSymbol: 'ETH/USDT',
        expectedSymbol: 'ETH/USDT',
        bids: [[2510, 4]],
        asks: [[2505, 4]],
      });
      expect(crossed.valid).toBe(false);
      expect(crossed.reason).toBe('CROSSED_OR_INVALID_SPREAD');
    });
  });

  describe('computeReconnectDelayMs', () => {
    it('grows exponentially with jitter and caps at maxMs', () => {
      const d0 = computeReconnectDelayMs(0, 1000, 30000, () => 0.5); // jitter = 1.0
      const d1 = computeReconnectDelayMs(1, 1000, 30000, () => 0.5);
      const d2 = computeReconnectDelayMs(2, 1000, 30000, () => 0.5);
      const d10 = computeReconnectDelayMs(10, 1000, 30000, () => 1.0);

      expect(d0).toBe(1000);
      expect(d1).toBe(2000);
      expect(d2).toBe(4000);
      expect(d10).toBe(30000);

      // Verify jitter bounds [0.75x, 1.25x]
      expect(computeReconnectDelayMs(1, 1000, 30000, () => 0)).toBe(1500);
      expect(computeReconnectDelayMs(1, 1000, 30000, () => 1)).toBe(2500);
    });
  });

  describe('computeFeedStatus', () => {
    it('transitions accurately across LIVE -> DELAYED -> STALE -> OFFLINE and back to LIVE', () => {
      const t0 = 1_700_000_000_000;

      // 1. Fresh WS update (2s ago) -> LIVE ("2 dtk lalu")
      const live = computeFeedStatus({
        updatedAt: t0 - 2000,
        wsStatus: 'connected',
        isOnline: true,
        now: t0,
        lang: 'id',
      });
      expect(live.status).toBe('LIVE');
      expect(live.ageLabel).toBe('2 dtk lalu');

      // 2. Fallback polling active -> DELAYED
      const delayed = computeFeedStatus({
        updatedAt: t0 - 3000,
        wsStatus: 'fallback',
        fallbackPollingActive: true,
        isOnline: true,
        now: t0,
        lang: 'id',
      });
      expect(delayed.status).toBe('DELAYED');

      // 3. Data older than 15s even while socket appears open -> STALE
      const stale = computeFeedStatus({
        updatedAt: t0 - 20_000,
        wsStatus: 'connected',
        isOnline: true,
        now: t0,
        lang: 'id',
      });
      expect(stale.status).toBe('STALE');
      expect(stale.ageLabel).toBe('20 dtk lalu');

      // 4. Simulate 30s network disconnect -> OFFLINE
      const offline30s = computeFeedStatus({
        updatedAt: t0 - 30_000,
        wsStatus: 'disconnected',
        isOnline: false,
        now: t0,
        lang: 'id',
      });
      expect(offline30s.status).toBe('OFFLINE');
      expect(offline30s.ageLabel).toBe('30 dtk lalu');

      // 5. Network restored + fresh WS tick -> LIVE
      const recovered = computeFeedStatus({
        updatedAt: t0 + 30_500,
        wsStatus: 'connected',
        isOnline: true,
        now: t0 + 31_000,
        lang: 'id',
      });
      expect(recovered.status).toBe('LIVE');
      expect(recovered.ageLabel).toBe('baru saja');
    });
  });
});
