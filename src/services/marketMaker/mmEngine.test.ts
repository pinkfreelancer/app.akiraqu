import { describe, it, expect } from 'vitest';
import {
  computeOrderBookDepthAndDelta,
  computeDerivativesMetrics,
  computeAnchoredVWAPs,
  analyzeMarketMakerPlaybook,
} from './mmEngine';
import { OHLCVCandle, LiveOrderBookLevel } from '../../types/crypto.types';

describe('Market Maker Algorithmic Playbook Engine (services/marketMaker)', () => {
  const baseTime = 1710000000000;
  const sampleCandles: OHLCVCandle[] = [
    { time: baseTime + 1000, open: 60000, high: 60400, low: 59800, close: 60200, volume: 50 },
    { time: baseTime + 2000, open: 60200, high: 60800, low: 60100, close: 60700, volume: 80 },
    { time: baseTime + 3000, open: 60700, high: 61200, low: 60500, close: 61100, volume: 120 },
    { time: baseTime + 4000, open: 61100, high: 61300, low: 60200, close: 60300, volume: 150 },
    { time: baseTime + 5000, open: 60300, high: 60500, low: 59600, close: 59700, volume: 110 },
    { time: baseTime + 6000, open: 59700, high: 60100, low: 59500, close: 60000, volume: 90 },
  ];

  describe('computeOrderBookDepthAndDelta', () => {
    it('computes cumulative volume delta (CVD) series and realistic depth walls with estimated flag', () => {
      const depth = computeOrderBookDepthAndDelta(sampleCandles, 60000, 'BTC/USDT');

      expect(depth.cvdSeries.length).toBe(sampleCandles.length);
      expect(depth.bidWalls.length).toBeGreaterThan(0);
      expect(depth.askWalls.length).toBeGreaterThan(0);
      expect(depth.bidPercent + depth.askPercent).toBeCloseTo(100, 1);
      expect(depth.imbalanceRatio).toBeGreaterThan(0);
      expect(depth.institutionalAggressionScore).toBeGreaterThanOrEqual(0);
      expect(depth.isEstimated).toBe(true);
      expect(depth.dataSourceLabel).toContain('Estimasi');

      // Verify bid walls are below current price and ask walls are above
      depth.bidWalls.forEach((w) => {
        expect(w.price).toBeLessThan(60000);
      });
      depth.askWalls.forEach((w) => {
        expect(w.price).toBeGreaterThan(60000);
      });
    });

    it('integrates genuine Level 2 orderbook data when provided', () => {
      const realBids: LiveOrderBookLevel[] = [
        { price: 59950, amount: 2.5, total: 2.5 },
        { price: 59900, amount: 5.0, total: 7.5 },
      ];
      const realAsks: LiveOrderBookLevel[] = [
        { price: 60050, amount: 1.5, total: 1.5 },
        { price: 60100, amount: 3.0, total: 4.5 },
      ];

      const depth = computeOrderBookDepthAndDelta(sampleCandles, 60000, 'BTC/USDT', realBids, realAsks);

      expect(depth.isEstimated).toBe(false);
      expect(depth.dataSourceLabel).toContain('Bursa');
      expect(depth.bidVolumeTotal).toBe(7.5);
      expect(depth.askVolumeTotal).toBe(4.5);
      expect(depth.bidWalls[0].price).toBe(59950);
      expect(depth.askWalls[0].price).toBe(60050);
    });

    it('handles empty candles gracefully', () => {
      const depth = computeOrderBookDepthAndDelta([], 50000, 'BTC/USDT');
      expect(depth.cvdSeries).toEqual([]);
      expect(depth.bidVolumeTotal).toBeGreaterThanOrEqual(0);
    });
  });

  describe('computeDerivativesMetrics', () => {
    it('calculates open interest, funding rate, and OI divergence with transparent estimation label', () => {
      const deriv = computeDerivativesMetrics(sampleCandles, 60000, 'BTC/USDT');

      expect(deriv.openInterestUsd).toBeGreaterThan(0);
      expect(deriv.fundingRate8h).toBeDefined();
      expect(deriv.fundingRateAnnualized).toBeDefined();
      expect(deriv.predictedNextFunding).toBeDefined();
      expect(deriv.oiPriceDivergence).toBeDefined();
      expect(deriv.oiPriceDivergence.type).toBeTruthy();
      expect(deriv.isEstimated).toBe(true);
    });

    it('correctly categorizes EXTREME_BEARISH_HEAVY when funding rate is below -0.0450', () => {
      const deriv = computeDerivativesMetrics(sampleCandles, 60000, 'BTC/USDT', {
        fundingRate8h: -0.0520,
      });

      expect(deriv.fundingSentiment).toBe('EXTREME_BEARISH_HEAVY');
    });

    it('correctly categorizes SHORT_SQUEEZE_FUEL when funding rate is between -0.0450 and -0.0200', () => {
      const deriv = computeDerivativesMetrics(sampleCandles, 60000, 'BTC/USDT', {
        fundingRate8h: -0.0300,
      });

      expect(deriv.fundingSentiment).toBe('SHORT_SQUEEZE_FUEL');
    });
  });

  describe('computeAnchoredVWAPs', () => {
    it('computes session and swing anchored VWAPs with standard deviation bands', () => {
      const vwap = computeAnchoredVWAPs(sampleCandles, 60000);

      expect(vwap.sessionVWAP).toBeDefined();
      expect(vwap.sessionVWAP.vwap).toBeGreaterThan(0);
      expect(vwap.sessionVWAP.upperBand1).toBeGreaterThan(vwap.sessionVWAP.vwap);
      expect(vwap.sessionVWAP.lowerBand1).toBeLessThan(vwap.sessionVWAP.vwap);
      expect(vwap.swingHighAVWAP).toBeDefined();
      expect(vwap.swingLowAVWAP).toBeDefined();
      expect(['ABOVE_ALL_ANCHORS', 'BETWEEN_ANCHORS', 'BELOW_ALL_ANCHORS']).toContain(vwap.currentZone);
    });
  });

  describe('analyzeMarketMakerPlaybook', () => {
    it('evaluates Trap & Spike, Absorption, and Flush Liquidity Sweep patterns with dynamic confidence', () => {
      const playbook = analyzeMarketMakerPlaybook(sampleCandles, 60000, 'BTC/USDT', '15m');

      expect(playbook.symbol).toBe('BTC/USDT');
      expect(playbook.timeframe).toBe('15m');
      expect([
        'LIQUIDITY_HUNT',
        'AGGRESSIVE_ACCUMULATION',
        'PREDATORY_DISTRIBUTION',
        'RANGE_HARVESTING',
        'BALANCED_EQUILIBRIUM',
      ]).toContain(playbook.regime);

      // Playbook patterns structure
      expect(playbook.trapAndSpike).toBeDefined();
      expect(typeof playbook.trapAndSpike.isDetected).toBe('boolean');
      expect(playbook.absorptionPhase).toBeDefined();
      expect(typeof playbook.absorptionPhase.isDetected).toBe('boolean');
      expect(playbook.liquiditySweep).toBeDefined();
      expect(typeof playbook.liquiditySweep.isDetected).toBe('boolean');

      expect(playbook.dominantMMBotAction).toBeTruthy();
      expect(playbook.retailCautionAlert).toBeTruthy();
      expect(playbook.institutionalEntryWindow).toBeTruthy();
    });

    it('safely handles minimal/insufficient candle history', () => {
      const playbook = analyzeMarketMakerPlaybook([], 100, 'SOL/USDT', '1H');
      expect(playbook.regime).toBe('BALANCED_EQUILIBRIUM');
      expect(playbook.trapAndSpike.isDetected).toBe(false);
      expect(playbook.absorptionPhase.isDetected).toBe(false);
      expect(playbook.liquiditySweep.isDetected).toBe(false);
    });
  });
});
