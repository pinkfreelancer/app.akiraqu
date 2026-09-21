import { describe, it, expect } from 'vitest';
import { calculateRiskPlan, getPricePrecision } from './riskCalculator';
import { MarketBias } from '../../types/crypto.types';

describe('Financial Risk Management Engine (services/risk)', () => {
  describe('getPricePrecision', () => {
    it('returns appropriate decimal precision based on asset magnitude', () => {
      expect(getPricePrecision(65000)).toBe(2);
      expect(getPricePrecision(1.2345)).toBe(4);
      expect(getPricePrecision(0.00045678)).toBe(8);
    });
  });

  describe('Long Setup Risk Calculations', () => {
    it('correctly sets stop-loss below structural support with buffer', () => {
      const plan = calculateRiskPlan({
        currentPrice: 50000,
        bias: 'Bullish',
        keySupport: 49000,
        keyResistance: 53000,
        accountBalance: 10000,
        riskPercentage: 1.0,
      });

      expect(plan.entryPrice).toBe(50000);
      expect(plan.stopLoss).toBeLessThan(50000);
      expect(plan.takeProfit1).toBeGreaterThan(plan.entryPrice);
      expect(plan.takeProfit2).toBeGreaterThan(plan.takeProfit1);
      expect(plan.takeProfit3).toBeGreaterThan(plan.takeProfit2);
      expect(plan.riskRewardRatio).toBeGreaterThan(1.5);
    });

    it('calculates exact capital at risk and position size according to risk percentage', () => {
      const balance = 20000;
      const riskPct = 2.0; // 2% of $20,000 = $400
      const plan = calculateRiskPlan({
        currentPrice: 100,
        bias: 'Strong Bullish',
        keySupport: 98,
        keyResistance: 110,
        accountBalance: balance,
        riskPercentage: riskPct,
      });

      expect(plan.maxCapitalAtRisk).toBe(400);
      expect(plan.suggestedPositionUsd).toBeGreaterThan(0);
      expect(plan.suggestedPositionUnits).toBeCloseTo(plan.suggestedPositionUsd / 100, 2);
    });

    it('recommends safe leverage with buffer against liquidation', () => {
      const plan = calculateRiskPlan({
        currentPrice: 60000,
        bias: 'Bullish',
        keySupport: 58500,
        keyResistance: 64000,
        accountBalance: 10000,
        riskPercentage: 1.5,
      });

      expect(plan.recommendedLeverage).toBeGreaterThanOrEqual(1);
      expect(plan.recommendedLeverage).toBeLessThanOrEqual(10);
      expect(plan.estimatedLiquidationPrice).toBeLessThan(plan.stopLoss);
    });
  });

  describe('Short Setup Risk Calculations', () => {
    it('places stop-loss above structural resistance for bearish market bias', () => {
      const plan = calculateRiskPlan({
        currentPrice: 3000,
        bias: 'Bearish',
        keySupport: 2700,
        keyResistance: 3080,
        accountBalance: 5000,
        riskPercentage: 1.5,
      });

      expect(plan.entryPrice).toBe(3000);
      expect(plan.stopLoss).toBeGreaterThan(3000);
      expect(plan.takeProfit1).toBeLessThan(3000);
      expect(plan.takeProfit2).toBeLessThan(plan.takeProfit1);
      expect(plan.takeProfit3).toBeLessThan(plan.takeProfit2);
      expect(plan.estimatedLiquidationPrice).toBeGreaterThan(plan.stopLoss);
    });
  });

  describe('Neutral / Consolidation Plan', () => {
    it('sets a WAIT / NO_TRADE invalidation advice during chop to prevent forced entries', () => {
      const plan = calculateRiskPlan({
        currentPrice: 45000,
        bias: 'Neutral',
        keySupport: 44000,
        keyResistance: 46000,
        accountBalance: 10000,
        riskPercentage: 1.0,
      });

      expect(plan.invalidationTrigger).toContain('WAIT / NO_TRADE');
    });
  });
});
