import { describe, it, expect } from 'vitest';
import { evaluateConfluence } from './confluenceEngine';
import { IndicatorsSnapshot, RiskManagementPlan } from '../../types/crypto.types';

const mockRiskPlan: RiskManagementPlan = {
  currentPrice: 65000,
  entryPrice: 65000,
  stopLoss: 63500,
  takeProfit1: 67250,
  takeProfit2: 68750,
  takeProfit3: 71000,
  riskRewardRatio: 2.5,
  accountBalance: 10000,
  riskPercentage: 1.5,
  maxCapitalAtRisk: 150,
  suggestedPositionUsd: 6500,
  suggestedPositionUnits: 0.1,
  recommendedLeverage: 3,
  estimatedLiquidationPrice: 45000,
  invalidationTrigger: 'Batalkan posisi jika candle 1H ditutup di bawah $63,500.',
};

function createMockIndicators(signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL', confidence: number): IndicatorsSnapshot {
  const summary = `${signal} signal with ${confidence}% confidence`;
  return {
    priceAction: {
      keySupport: 63000,
      keyResistance: 67000,
      swingHigh: 68000,
      swingLow: 62000,
      candlestickPattern: 'Bullish Engulfing',
      signal,
      confidence,
      summary,
    },
    smc: {
      orderBlock: { high: 64500, low: 64000, type: 'BULLISH_OB' },
      structure: 'BULLISH_BOS',
      signal,
      confidence,
      summary,
    },
    orderFlow: {
      cvd: 1200000,
      cvdDirection: 'ACCUMULATING_BULLISH',
      deltaRatio: 1.45,
      buyVolumePercent: 62,
      sellVolumePercent: 38,
      institutionalAggression: 'HIGH_BUY',
      absorptionZone: null,
      signal,
      confidence,
      summary,
    },
    ict: {
      sessionLiquidity: 'LONDON_EXPANSION',
      currentKillzone: 'LONDON_OPEN',
      marketStructureShift: true,
      signal,
      confidence,
      summary,
    },
    optionFlow: {
      putCallRatio: 0.65,
      pcrSentiment: 'BULLISH_CALL_HEAVY',
      maxPainPrice: 64000,
      maxPainDistancePct: 1.5,
      openInterestNotional: '$1.2B',
      impliedVolatility: 54,
      gammaExposure: 'POSITIVE_GAMMA_STABILIZING',
      unusualOptionsActivity: [],
      signal,
      confidence,
      summary,
    },
    rsi: {
      rsi14: 58,
      condition: 'BULLISH_MOMENTUM',
      divergence: 'NONE',
      signal,
      confidence,
      summary,
    },
    vwap: {
      vwap: 64800,
      upperBand1: 65500,
      upperBand2: 66200,
      lowerBand1: 64100,
      lowerBand2: 63400,
      relation: 'ABOVE_VWAP',
      signal,
      confidence,
      summary,
    },
    fibonacci: {
      goldenPocket: { min: 63800, max: 64200 },
      nearestLevel: '0.618 Fib ($64,000)',
      signal,
      confidence,
      summary,
    },
    macd: {
      macdLine: 120,
      signalLine: 80,
      histogram: 40,
      crossover: 'BULLISH_CROSS',
      signal,
      confidence,
      summary,
    },
    ichimoku: {
      tenkanSen: 65100,
      kijunSen: 64800,
      senkouSpanA: 64600,
      senkouSpanB: 64200,
      tkCross: 'BULLISH_CROSS',
      signal,
      confidence,
      summary,
    },
    tdSequential: {
      setupCount: 7,
      countdownCount: 4,
      signal,
      confidence,
      summary,
    },
    elliottWave: {
      currentWave: 'Wave 3 of (5) Motive Impulse',
      invalidationLevel: 63200,
      signal,
      confidence,
      summary,
    },
  };
}

describe('Quantitative Confluence Evaluation Engine (services/confluence)', () => {
  it('computes Strong Bullish bias and high score when all modular indicators align bullishly', async () => {
    const indicators = createMockIndicators('BULLISH', 90);
    const evaluation = await evaluateConfluence({
      symbol: 'BTC/USDT',
      timeframe: '1H',
      indicators,
      riskPlan: mockRiskPlan,
      idempotencyKey: 'test-confluence-bullish-key',
      useAI: false,
      language: 'id',
    });

    expect(evaluation.confluenceScore).toBeGreaterThanOrEqual(75);
    expect(evaluation.marketBias).toBe('Strong Bullish');
    expect(evaluation.bullishCount).toBe(12);
  });

  it('computes Strong Bearish bias when all modular indicators align bearishly', async () => {
    const indicators = createMockIndicators('BEARISH', 88);
    const evaluation = await evaluateConfluence({
      symbol: 'ETH/USDT',
      timeframe: '4H',
      indicators,
      riskPlan: {
        ...mockRiskPlan,
        entryPrice: 3450,
        stopLoss: 3580,
        takeProfit1: 3300,
      },
      idempotencyKey: 'test-confluence-bearish-key',
      useAI: false,
      language: 'id',
    });

    expect(evaluation.confluenceScore).toBeLessThanOrEqual(35);
    expect(evaluation.marketBias).toBe('Strong Bearish');
    expect(evaluation.bearishCount).toBe(12);
  });
});
