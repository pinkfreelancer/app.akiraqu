import { describe, it, expect } from 'vitest';
import { getUpcomingOptionExpiries, calculateAllIndicators } from './indicatorEngine';
import { OHLCVCandle } from '../../types/crypto.types';

describe('indicatorEngine - Option Flow & Dynamic Expiries', () => {
  it('calculates dynamic Friday option expiration dates into the future', () => {
    // Test with Oct 2, 2026 (Friday)
    const baseTimeOct2026 = new Date('2026-10-02T12:00:00Z').getTime();
    const expiries = getUpcomingOptionExpiries(baseTimeOct2026);

    expect(expiries.nearExpiry).toBeDefined();
    expect(expiries.nextExpiry).toBeDefined();
    // Near expiry should be last Friday of October 2026: 30-OCT-2026
    expect(expiries.nearExpiry).toBe('30-OCT-2026');
    // Next expiry should be last Friday of November 2026: 27-NOV-2026
    expect(expiries.nextExpiry).toBe('27-NOV-2026');
  });

  it('calculates dynamic Open Interest and live expiry dates on option flow indicator', () => {
    const candles: OHLCVCandle[] = [];
    const baseTimestamp = new Date('2026-10-02T00:00:00Z').getTime();

    for (let i = 0; i < 30; i++) {
      candles.push({
        time: baseTimestamp + i * 3600000,
        open: 65000 + i * 50,
        high: 65500 + i * 50,
        low: 64800 + i * 50,
        close: 65200 + i * 50,
        volume: 1200 + i * 20,
      });
    }

    const indicators = calculateAllIndicators(candles);
    const optionFlow = indicators.optionFlow;

    expect(optionFlow).toBeDefined();
    expect(optionFlow.openInterestNotional).toMatch(/^\$[0-9.]+[BM]$/);
    expect(optionFlow.unusualOptionsActivity.length).toBeGreaterThan(0);
    
    // Check that expiry is not the stale hardcoded 28-MAR-2026
    for (const block of optionFlow.unusualOptionsActivity) {
      expect(block.expiry).not.toBe('28-MAR-2026');
      expect(block.expiry).not.toBe('25-APR-2026');
      expect(block.expiry).toMatch(/^[0-9]{2}-[A-Z]{3}-20[0-9]{2}$/);
    }
  });
});
