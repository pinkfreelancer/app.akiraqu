import { MarketBias, RiskManagementPlan } from '../../types/crypto.types';
import { getCryptoPrecision, formatCryptoPrice } from '../../utils/formatters';

export interface RiskCalculationParams {
  currentPrice: number;
  bias: MarketBias;
  keySupport: number;
  keyResistance: number;
  accountBalance?: number;
  riskPercentage?: number;
}

export function getPricePrecision(price: number): number {
  return getCryptoPrecision(price);
}

export function calculateRiskPlan(params: RiskCalculationParams): RiskManagementPlan {
  const {
    currentPrice,
    bias,
    keySupport,
    keyResistance,
    accountBalance = 10000,
    riskPercentage = 1.5,
  } = params;

  const precision = getPricePrecision(currentPrice);
  const isLong = bias === 'Bullish' || bias === 'Strong Bullish';
  const isShort = bias === 'Bearish' || bias === 'Strong Bearish';
  const isNeutral = !isLong && !isShort;

  let entryPrice = currentPrice;
  let stopLoss: number;
  let tp1: number;
  let tp2: number;
  let tp3: number;
  let invalidationTrigger = '';

  if (isNeutral) {
    // Honest Institutional Stance: Do not force a blind market trade in chop!
    // Setup conditional breakout triggers
    const slDist = currentPrice * 0.025; // 2.5% reference risk buffer
    stopLoss = Number((currentPrice - slDist).toFixed(precision));
    tp1 = Number((currentPrice + slDist * 1.5).toFixed(precision));
    tp2 = Number((currentPrice + slDist * 2.5).toFixed(precision));
    tp3 = Number((currentPrice + slDist * 4.0).toFixed(precision));
    invalidationTrigger = `STATUS: WAIT / NO_TRADE. Pasar sedang konsolidasi tanpa konfluensi arah yang jelas. Jangan eksekusi market order untuk menghindari kerugian/whipsaw. Tunggu konfirmasi breakout di atas $${formatCryptoPrice(keyResistance)} (Long) atau breakdown di bawah $${formatCryptoPrice(keySupport)} (Short).`;
  } else if (isLong) {
    // LONG SETUP:
    entryPrice = currentPrice;

    // Structural support validation
    let validSupport = keySupport;
    if (validSupport >= currentPrice || validSupport <= 0) {
      validSupport = currentPrice * 0.98;
    }

    // SL distance must respect crypto market volatility (min 1.5% to avoid wick stop-outs, max 4.5% to preserve capital)
    const rawSlDist = (currentPrice - validSupport) + currentPrice * 0.004; // 0.4% structural buffer below support
    const slDist = Math.max(currentPrice * 0.015, Math.min(currentPrice * 0.045, rawSlDist));
    
    stopLoss = Number((entryPrice - slDist).toFixed(precision));
    tp1 = Number((entryPrice + slDist * 1.5).toFixed(precision));
    tp2 = Number((entryPrice + slDist * 2.5).toFixed(precision));
    tp3 = Number((entryPrice + slDist * 4.0).toFixed(precision));
    invalidationTrigger = `Batalkan posisi (SL) jika candle 1H/4H ditutup di bawah support struktural $${formatCryptoPrice(stopLoss)}. Target TP1 (+1.5R), TP2 (+2.5R), TP3 (+4.0R).`;
  } else {
    // SHORT SETUP:
    entryPrice = currentPrice;

    let validResistance = keyResistance;
    if (validResistance <= currentPrice) {
      validResistance = currentPrice * 1.02;
    }

    const rawSlDist = (validResistance - currentPrice) + currentPrice * 0.004;
    const slDist = Math.max(currentPrice * 0.015, Math.min(currentPrice * 0.045, rawSlDist));

    stopLoss = Number((entryPrice + slDist).toFixed(precision));
    tp1 = Number((entryPrice - slDist * 1.5).toFixed(precision));
    tp2 = Number((entryPrice - slDist * 2.5).toFixed(precision));
    tp3 = Number((entryPrice - slDist * 4.0).toFixed(precision));
    invalidationTrigger = `Batalkan posisi (SL) jika candle 1H/4H ditutup di atas resistensi struktural $${formatCryptoPrice(stopLoss)}. Target TP1 (+1.5R), TP2 (+2.5R), TP3 (+4.0R).`;
  }

  const stopLossDistance = Math.abs(entryPrice - stopLoss);
  const stopLossPercent = Math.max(0.1, (stopLossDistance / entryPrice) * 100);
  const rawCapitalAtRisk = (accountBalance * riskPercentage) / 100;
  const maxCapitalAtRisk = rawCapitalAtRisk < 0.1
    ? Number(rawCapitalAtRisk.toFixed(4))
    : Number(rawCapitalAtRisk.toFixed(2));

  // Position sizing formula: Capital at Risk / SL%
  const positionSizeUsd = Number(((maxCapitalAtRisk / (stopLossPercent / 100))).toFixed(2));
  const rawUnits = positionSizeUsd / entryPrice;
  const suggestedPositionUnits = rawUnits < 0.0001
    ? Number(rawUnits.toFixed(8))
    : rawUnits < 0.01
    ? Number(rawUnits.toFixed(6))
    : rawUnits < 1
    ? Number(rawUnits.toFixed(4))
    : Number(rawUnits.toFixed(2));

  const averageReward = (Math.abs(tp1 - entryPrice) + Math.abs(tp2 - entryPrice) + Math.abs(tp3 - entryPrice)) / 3;
  const riskRewardRatio = Number((averageReward / (stopLossDistance || 0.00001)).toFixed(2));

  // Max safe leverage ensures liquidation is ALWAYS at least 1.6x further than Stop Loss
  const maxSafeLeverage = Math.max(1, Math.floor(0.75 / (stopLossPercent / 100)));
  const recommendedLeverage = Math.min(10, Math.max(1, maxSafeLeverage));

  // Estimated liquidation price under isolated margin
  const liquidationBuffer = (1 / recommendedLeverage) * 0.92;
  const estimatedLiquidationPrice = (isLong || isNeutral)
    ? Number(Math.max(0, entryPrice * (1 - liquidationBuffer)).toFixed(precision))
    : Number((entryPrice * (1 + liquidationBuffer)).toFixed(precision));

  return {
    currentPrice,
    entryPrice,
    stopLoss,
    takeProfit1: tp1,
    takeProfit2: tp2,
    takeProfit3: tp3,
    riskRewardRatio,
    accountBalance,
    riskPercentage,
    maxCapitalAtRisk,
    suggestedPositionUsd: positionSizeUsd,
    suggestedPositionUnits,
    recommendedLeverage,
    estimatedLiquidationPrice,
    invalidationTrigger,
  };
}
