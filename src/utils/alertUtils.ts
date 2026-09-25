import { MarketAlertItem } from '../types/alert.types';
import { getCryptoPrecision } from './formatters';

export const BENCHMARK_COIN_PRICES: Record<string, number> = {
  'BTC/USDT': 87450,
  'ETH/USDT': 2780,
  'SOL/USDT': 188.5,
  'SUI/USDT': 3.42,
  'AVAX/USDT': 34.20,
  'PEPE/USDT': 0.00001085,
  'NEAR/USDT': 5.65,
  'DOGE/USDT': 0.185,
  'RENDER/USDT': 6.45,
  'APT/USDT': 9.20,
  'ARB/USDT': 0.74,
  'XRP/USDT': 1.45,
  'BNB/USDT': 640.0,
};

export function getBenchmarkPriceForSymbol(sym?: string): number {
  if (!sym) return 87450;
  const upper = sym.toUpperCase();
  if (BENCHMARK_COIN_PRICES[upper]) return BENCHMARK_COIN_PRICES[upper];

  if (upper.includes('PEPE')) return 0.00001085;
  if (upper.includes('SHIB')) return 0.0000185;
  if (upper.includes('DOGE')) return 0.185;
  if (upper.includes('SOL')) return 188.5;
  if (upper.includes('ETH')) return 2780;
  if (upper.includes('BTC')) return 87450;
  if (upper.includes('AVAX')) return 34.20;
  if (upper.includes('SUI')) return 3.42;
  if (upper.includes('NEAR')) return 5.65;
  if (upper.includes('RENDER')) return 6.45;
  if (upper.includes('APT')) return 9.20;
  if (upper.includes('ARB')) return 0.74;

  return 10.0;
}

export interface ResolvedSignalMetrics {
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  direction: 'LONG' | 'SHORT';
  timeframe: string;
  riskRewardRatio: number;
}

/**
 * Resolves complete and mathematically valid Entry, TP1, and SL metrics
 * for any signal alert item, even if historical/unhydrated payload lacked them.
 */
export function resolveSignalMetrics(alert: Partial<MarketAlertItem>): ResolvedSignalMetrics {
  const data = alert.data || {};
  const isLong = data.direction !== 'SHORT';
  const direction: 'LONG' | 'SHORT' = data.direction || (isLong ? 'LONG' : 'SHORT');
  const timeframe = data.timeframe || '15m';

  const basePrice = getBenchmarkPriceForSymbol(alert.symbol);
  const precision = getCryptoPrecision(basePrice);

  let entryPrice = typeof data.entryPrice === 'number' && data.entryPrice > 0 ? data.entryPrice : basePrice;

  // Derive Take Profit 1 & Stop Loss if missing
  let targetPrice = data.targetPrice;
  let stopLoss = data.stopLoss;

  if (typeof targetPrice !== 'number' || targetPrice <= 0) {
    const tpRatio = isLong ? 1.045 : 0.955;
    targetPrice = Number((entryPrice * tpRatio).toFixed(precision));
  }

  if (typeof stopLoss !== 'number' || stopLoss <= 0) {
    const slRatio = isLong ? 0.978 : 1.022;
    stopLoss = Number((entryPrice * slRatio).toFixed(precision));
  }

  // Calculate Risk-Reward Ratio
  const risk = Math.abs(entryPrice - stopLoss);
  const reward = Math.abs(targetPrice - entryPrice);
  const riskRewardRatio = risk > 0 ? Number((reward / risk).toFixed(2)) : 2.05;

  return {
    entryPrice,
    targetPrice,
    stopLoss,
    direction,
    timeframe,
    riskRewardRatio,
  };
}
