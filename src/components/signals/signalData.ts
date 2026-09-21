import { CryptoTradingSignal, SignalPriceLevels } from '../../types/signal.types';

// Helper to compute standard 8 take-profit resistance levels and 4 stop support levels
export function generatePriceLevels(
  entry: number,
  direction: 'LONG' | 'SHORT',
  atrStepPct: number = 0.015
): SignalPriceLevels {
  const isLong = direction === 'LONG';
  const sign = isLong ? 1 : -1;

  // r1..r8 (Long moves up, Short moves down)
  const r1 = +(entry * (1 + sign * atrStepPct * 1.0)).toFixed(4);
  const r2 = +(entry * (1 + sign * atrStepPct * 1.8)).toFixed(4);
  const r3 = +(entry * (1 + sign * atrStepPct * 2.8)).toFixed(4);
  const r4 = +(entry * (1 + sign * atrStepPct * 4.0)).toFixed(4);
  const r5 = +(entry * (1 + sign * atrStepPct * 5.5)).toFixed(4);
  const r6 = +(entry * (1 + sign * atrStepPct * 7.2)).toFixed(4);
  const r7 = +(entry * (1 + sign * atrStepPct * 9.2)).toFixed(4);
  const r8 = +(entry * (1 + sign * atrStepPct * 12.0)).toFixed(4);

  // s1..s4 (Support / stop levels: Long moves down, Short moves up)
  const s1 = +(entry * (1 - sign * atrStepPct * 1.2)).toFixed(4);
  const s2 = +(entry * (1 - sign * atrStepPct * 2.0)).toFixed(4);
  const s3 = +(entry * (1 - sign * atrStepPct * 3.0)).toFixed(4);
  const s4 = +(entry * (1 - sign * atrStepPct * 4.2)).toFixed(4);

  return {
    entry,
    r1,
    r2,
    r3,
    r4,
    r5,
    r6,
    r7,
    r8,
    s1,
    s2,
    s3,
    s4,
    trailingStop: undefined,
    isTrailingActive: false,
  };
}

export const INITIAL_INSTITUTIONAL_SIGNALS: CryptoTradingSignal[] = [
  {
    id: 'SIG-BTC-9401',
    symbol: 'BTC/USDT',
    name: 'Bitcoin',
    category: 'Layer 1',
    exchange: 'BINANCE',
    direction: 'LONG',
    grade: 'STRONG_BUY',
    timeframe: '1H',
    resolution: '1H',
    modelCategory: 'ALPHA',
    strength: 'STRONG',
    lifecycleStatus: 'R2',
    strategyName: 'Alpha Model: Institutional FVG Sweep & MSS',
    strategyCategory: 'SMC',
    confluenceScore: 94,
    winRateProbability: 84.5,
    entryPrice: 88450.0,
    currentPrice: 91920.0,
    targetPrice1: 89750.0,
    targetPrice2: 91800.0,
    targetPrice3: 94500.0,
    stopLoss: 87100.0,
    riskRewardRatio: 3.42,
    leverageRec: 10,
    status: 'TP2_HIT',
    highestRReached: 2,
    isTrailingActive: true,
    trailingStopPrice: 90200.0,
    pnlPctCurrent: 3.92,
    realizedPnlPct: 3.92,
    outcomeResult: 'IN_PROGRESS',
    createdAt: '42 menit yang lalu',
    expiresAt: 'dalam 5 jam',
    indicatorsSummary: [
      'Alpha Engine: FVG Rebound $88.2k',
      'RSI 42 Momentum Expansion',
      'Whale CVD Inflow +$58M',
      'SuperTrend Bullish Shift',
      'Trailing Stop Dikunci di r1 ($89,750)',
    ],
    notes:
      'Sinyal model ALPHA dengan konfirmasi candle 1H di atas EMA 20. Target r1 dan r2 telah tercapai; Trailing Stop kini aktif di atas entry untuk mengunci profit.',
    pipelineStage: 'TRACKING',
    triggerType: 'FVG_SWEEP',
    triggerDetails: 'Alpha Model: Bullish Fair Value Gap sweep $88,200 disertai anomali CVD beli institusional +$58M.',
    fundingRate: -0.008,
    fundingBias: 'NEGATIVE',
    liquidationDeltaUsd: 42500000,
    hasStopLoss: true,
    isRiskRewardValid: true,
    riskStatus: 'PASSED',
    officialTimestamp: '2026-09-20 01:14:02 UTC',
    verificationHash: '0x9401a8ef3b9c714d2e8b61c5a019e5d4',
    highestPnlReached: 4.15,
    priceLevels: {
      entry: 88450.0,
      r1: 89750.0,
      r2: 91800.0,
      r3: 93200.0,
      r4: 94500.0,
      r5: 96000.0,
      r6: 97800.0,
      r7: 99500.0,
      r8: 102000.0,
      s1: 87100.0,
      s2: 86000.0,
      s3: 84800.0,
      s4: 83200.0,
      trailingStop: 90200.0,
      isTrailingActive: true,
    },
    auditTrail: [
      { timestamp: '01:14:02 UTC', event: 'Sinyal Alpha dipublikasikan dengan r1-r8 & s1-s4 resmi', price: 88450.0, pnlPct: 0.0 },
      { timestamp: '01:18:40 UTC', event: 'Entry terisi penuh di $88,450', price: 88450.0, pnlPct: 0.0 },
      { timestamp: '01:32:10 UTC', event: 'Target r1 $89,750 TERCAPAI (+1.47%) - Trailing Stop Aktif', price: 89750.0, pnlPct: 1.47 },
      { timestamp: '01:52:30 UTC', event: 'Target r2 $91,800 TERCAPAI (+3.78%) - Trailing dinaikkan ke $90,200', price: 91800.0, pnlPct: 3.78 },
    ],
  },
  {
    id: 'SIG-SOL-9102',
    symbol: 'SOL/USDT',
    name: 'Solana',
    category: 'Layer 1',
    exchange: 'OKX',
    direction: 'LONG',
    grade: 'STRONG_BUY',
    timeframe: '4H',
    resolution: '4H',
    modelCategory: 'ALPHA',
    strength: 'STRONG',
    lifecycleStatus: 'TAKEPROFIT',
    strategyName: 'Alpha Model: VWAP Breakout + Whale CVD Divergence',
    strategyCategory: 'ORDERFLOW',
    confluenceScore: 91,
    winRateProbability: 81.0,
    entryPrice: 184.2,
    currentPrice: 201.5,
    targetPrice1: 192.0,
    targetPrice2: 199.5,
    targetPrice3: 212.0,
    stopLoss: 178.5,
    riskRewardRatio: 3.12,
    leverageRec: 15,
    status: 'TP2_HIT',
    highestRReached: 4,
    isTrailingActive: true,
    trailingStopPrice: 199.5,
    pnlPctCurrent: 9.39,
    realizedPnlPct: 9.39,
    outcomeResult: 'WIN',
    createdAt: '3 jam yang lalu',
    expiresAt: 'Selesai',
    closedAt: '2026-09-20 03:40:00 UTC',
    exitPrice: 201.5,
    indicatorsSummary: [
      'VWAP Upper Band Breach',
      'Short Squeeze Funding Rate -0.012%',
      'CVD Spot Whale Inflow',
      'Target r1-r4 Diselesaikan Sempurna',
    ],
    notes:
      'Sinyal ALPHA berhasil diselesaikan dengan hasil TAKEPROFIT. Posisi ditutup pada target r4 dengan profit realisasi +9.39%.',
    pipelineStage: 'PUBLISHED',
    triggerType: 'VOLUME_ANOMALY',
    triggerDetails: 'Alpha Model: Volume anomali +340% di atas VWAP +2σ disertai short squeeze funding.',
    fundingRate: -0.012,
    fundingBias: 'EXTREME_NEGATIVE',
    liquidationDeltaUsd: 18400000,
    hasStopLoss: true,
    isRiskRewardValid: true,
    riskStatus: 'PASSED',
    officialTimestamp: '2026-09-20 00:41:18 UTC',
    verificationHash: '0x9102c4b78912e931fa7d82e1c905b821',
    highestPnlReached: 9.65,
    priceLevels: {
      entry: 184.2,
      r1: 188.5,
      r2: 192.8,
      r3: 197.0,
      r4: 201.5,
      r5: 206.0,
      r6: 211.0,
      r7: 216.5,
      r8: 223.0,
      s1: 178.5,
      s2: 174.0,
      s3: 169.5,
      s4: 164.0,
      trailingStop: 199.5,
      isTrailingActive: true,
    },
    auditTrail: [
      { timestamp: '00:41:18 UTC', event: 'Sinyal Alpha Long dipublikasikan', price: 184.2, pnlPct: 0.0 },
      { timestamp: '01:18:45 UTC', event: 'Target r1 $188.5 tercapai', price: 188.5, pnlPct: 2.33 },
      { timestamp: '02:05:10 UTC', event: 'Target r2 $192.8 tercapai', price: 192.8, pnlPct: 4.66 },
      { timestamp: '03:12:00 UTC', event: 'Target r3 $197.0 tercapai', price: 197.0, pnlPct: 6.94 },
      { timestamp: '03:40:00 UTC', event: 'TAKEPROFIT Tercapai di r4 $201.5 (+9.39%) - Sinyal Sukses Ditutup', price: 201.5, pnlPct: 9.39 },
    ],
  },
  {
    id: 'SIG-ETH-8703',
    symbol: 'ETH/USDT',
    name: 'Ethereum',
    category: 'Layer 1',
    exchange: 'BYBIT',
    direction: 'SHORT',
    grade: 'SELL',
    timeframe: '1H',
    resolution: '1H',
    modelCategory: 'GAMMA',
    strength: 'NORMAL',
    lifecycleStatus: 'R1',
    strategyName: 'Gamma Model: Bearish OB Reject & RSI Divergence',
    strategyCategory: 'DIVERGENCE',
    confluenceScore: 86,
    winRateProbability: 74.2,
    entryPrice: 3420.0,
    currentPrice: 3375.0,
    targetPrice1: 3365.0,
    targetPrice2: 3290.0,
    targetPrice3: 3180.0,
    stopLoss: 3465.0,
    riskRewardRatio: 2.95,
    leverageRec: 12,
    status: 'TP1_HIT',
    highestRReached: 1,
    isTrailingActive: true,
    trailingStopPrice: 3410.0,
    pnlPctCurrent: 1.31,
    outcomeResult: 'IN_PROGRESS',
    createdAt: '18 menit yang lalu',
    expiresAt: 'dalam 4 jam',
    indicatorsSummary: [
      'Gamma Model: Rejection Bearish OB $3,430',
      'RSI 1H Regular Bearish Divergence',
      'Volume Climax Spike',
      'Target r1 $3,365 Berhasil Ditembus',
    ],
    notes:
      'Sinyal pola sekunder kuat (GAMMA). Penolakan keras di resistance Order Block $3,430. Target r1 telah tercapai dan bergerak menuju r2.',
    pipelineStage: 'PUBLISHED',
    triggerType: 'ORDER_BLOCK_RETEST',
    triggerDetails: 'Gamma Model: Retest Bearish Order Block di $3,430 dengan candle pinbar rejection.',
    fundingRate: 0.015,
    fundingBias: 'POSITIVE',
    liquidationDeltaUsd: 12600000,
    hasStopLoss: true,
    isRiskRewardValid: true,
    riskStatus: 'PASSED',
    officialTimestamp: '2026-09-20 01:08:44 UTC',
    verificationHash: '0x8703e218bfa93198de742c19a84f0912',
    highestPnlReached: 1.45,
    priceLevels: {
      entry: 3420.0,
      r1: 3365.0,
      r2: 3310.0,
      r3: 3255.0,
      r4: 3195.0,
      r5: 3130.0,
      r6: 3060.0,
      r7: 2980.0,
      r8: 2890.0,
      s1: 3465.0,
      s2: 3510.0,
      s3: 3560.0,
      s4: 3620.0,
      trailingStop: 3410.0,
      isTrailingActive: true,
    },
    auditTrail: [
      { timestamp: '01:08:44 UTC', event: 'Sinyal Gamma Short dipublikasikan', price: 3420.0, pnlPct: 0.0 },
      { timestamp: '01:11:30 UTC', event: 'Entry Short tereksekusi di $3,420.0', price: 3420.0, pnlPct: 0.0 },
      { timestamp: '01:21:05 UTC', event: 'Target r1 $3,365.0 tercapai (+1.60%) - Trailing stop aktif di $3,410', price: 3365.0, pnlPct: 1.6 },
    ],
  },
  {
    id: 'SIG-SUI-8904',
    symbol: 'SUI/USDT',
    name: 'Sui Network',
    category: 'Layer 1',
    exchange: 'BINANCE',
    direction: 'LONG',
    grade: 'BUY',
    timeframe: '8H',
    resolution: '8H',
    modelCategory: 'CLASSIC',
    strength: 'STRONG',
    lifecycleStatus: 'TRAILING',
    strategyName: 'Classic Model: Core Pattern Market Structure Shift (MSS)',
    strategyCategory: 'TREND',
    confluenceScore: 89,
    winRateProbability: 78.6,
    entryPrice: 3.42,
    currentPrice: 3.84,
    targetPrice1: 3.65,
    targetPrice2: 3.88,
    targetPrice3: 4.20,
    stopLoss: 3.25,
    riskRewardRatio: 3.25,
    leverageRec: 8,
    status: 'TP2_HIT',
    highestRReached: 3,
    isTrailingActive: true,
    trailingStopPrice: 3.75,
    pnlPctCurrent: 12.28,
    outcomeResult: 'IN_PROGRESS',
    createdAt: '2 jam yang lalu',
    expiresAt: 'dalam 14 jam',
    indicatorsSummary: [
      'Classic Pattern: Breakout Higher High',
      'ADX 38 Strong Trend Directional',
      'EMA 20/50 Ribbon Confirmation',
      'Trailing Stop Terkunci di $3.75 (+9.6%)',
    ],
    notes:
      'Sinyal metodologi inti CLASSIC. Setelah mencapai r1, r2, dan r3, harga mengalami sedikit retracement. Trailing stop aktif menjaga profit minimal +9.6%.',
    pipelineStage: 'TRACKING',
    triggerType: 'MSS',
    triggerDetails: 'Classic Pattern Recognition: MSS Bullish 8H mematahkan struktur lower-high resistensi.',
    fundingRate: -0.005,
    fundingBias: 'NEUTRAL',
    liquidationDeltaUsd: 8900000,
    hasStopLoss: true,
    isRiskRewardValid: true,
    riskStatus: 'PASSED',
    officialTimestamp: '2026-09-19 23:25:00 UTC',
    verificationHash: '0x8904f123bc89104fa218e904b78c91a3',
    highestPnlReached: 14.62,
    priceLevels: {
      entry: 3.42,
      r1: 3.55,
      r2: 3.70,
      r3: 3.88,
      r4: 4.08,
      r5: 4.30,
      r6: 4.55,
      r7: 4.85,
      r8: 5.20,
      s1: 3.25,
      s2: 3.10,
      s3: 2.95,
      s4: 2.78,
      trailingStop: 3.75,
      isTrailingActive: true,
    },
    auditTrail: [
      { timestamp: '23:25:00 UTC', event: 'Sinyal Classic 8H dipublikasikan', price: 3.42, pnlPct: 0.0 },
      { timestamp: '00:15:30 UTC', event: 'Target r1 $3.55 Tercapai (+3.8%)', price: 3.55, pnlPct: 3.8 },
      { timestamp: '00:42:00 UTC', event: 'Target r2 $3.70 Tercapai (+8.18%)', price: 3.70, pnlPct: 8.18 },
      { timestamp: '01:05:15 UTC', event: 'Target r3 $3.88 Tercapai (+13.45%)', price: 3.88, pnlPct: 13.45 },
      { timestamp: '01:30:00 UTC', event: 'Trailing Stop Aktif di $3.75 untuk proteksi profit', price: 3.84, pnlPct: 12.28 },
    ],
  },
  {
    id: 'SIG-NEAR-8506',
    symbol: 'NEAR/USDT',
    name: 'NEAR Protocol',
    category: 'AI & Big Data',
    exchange: 'BINANCE',
    direction: 'SHORT',
    grade: 'SELL',
    timeframe: '12H',
    resolution: '12H',
    modelCategory: 'INV',
    strength: 'STRONG',
    lifecycleStatus: 'PENDING',
    strategyName: 'INV Model: Counter-Trend Exhaustion Sweep',
    strategyCategory: 'DIVERGENCE',
    confluenceScore: 88,
    winRateProbability: 79.2,
    entryPrice: 6.95,
    currentPrice: 6.94,
    targetPrice1: 6.72,
    targetPrice2: 6.45,
    targetPrice3: 6.10,
    stopLoss: 7.22,
    riskRewardRatio: 3.15,
    leverageRec: 8,
    status: 'ACTIVE',
    highestRReached: 0,
    isTrailingActive: false,
    pnlPctCurrent: 0.14,
    outcomeResult: 'IN_PROGRESS',
    createdAt: '8 menit yang lalu',
    expiresAt: 'dalam 18 jam',
    indicatorsSummary: [
      'INV Model: Counter-Trend Sweep',
      'Overbought RSI 12H 78.4',
      'Bearish Volume Divergence',
      'Orderbook Heavy Ask Wall di $7.00',
    ],
    notes:
      'Sinyal model INV (Inverse/Kebalikan). Pola counter-trend mendeteksi kelelahan pembeli lokal di resistensi major $7.00. Status PENDING (menunggu momentum dorongan).',
    pipelineStage: 'PUBLISHED',
    triggerType: 'PATTERN_COMPLETION',
    triggerDetails: 'INV Model: Exhaustion candle 12H dengan sweep resistensi likuiditas.',
    fundingRate: 0.024,
    fundingBias: 'EXTREME_POSITIVE',
    liquidationDeltaUsd: 14200000,
    hasStopLoss: true,
    isRiskRewardValid: true,
    riskStatus: 'PASSED',
    officialTimestamp: '2026-09-20 01:40:00 UTC',
    verificationHash: '0x8506e9812fabc38719284fa90b81297e',
    highestPnlReached: 0.2,
    priceLevels: {
      entry: 6.95,
      r1: 6.72,
      r2: 6.50,
      r3: 6.25,
      r4: 5.98,
      r5: 5.70,
      r6: 5.40,
      r7: 5.05,
      r8: 4.65,
      s1: 7.22,
      s2: 7.45,
      s3: 7.70,
      s4: 8.05,
      trailingStop: undefined,
      isTrailingActive: false,
    },
    auditTrail: [
      { timestamp: '01:40:00 UTC', event: 'Sinyal INV Counter-Trend dipublikasikan', price: 6.95, pnlPct: 0.0 },
      { timestamp: '01:43:10 UTC', event: 'Limit Entry Short terisi di $6.95', price: 6.95, pnlPct: 0.0 },
    ],
  },
  {
    id: 'SIG-ARB-7808',
    symbol: 'ARB/USDT',
    name: 'Arbitrum',
    category: 'Layer 2',
    exchange: 'BINANCE',
    direction: 'LONG',
    grade: 'BUY',
    timeframe: '1D',
    resolution: '1D',
    modelCategory: 'CLASSIC',
    strength: 'NORMAL',
    lifecycleStatus: 'STOPLOSS',
    strategyName: 'Classic Model: Breakout Retest Failure',
    strategyCategory: 'TREND',
    confluenceScore: 79,
    winRateProbability: 68.0,
    entryPrice: 0.88,
    currentPrice: 0.84,
    targetPrice1: 0.94,
    targetPrice2: 0.99,
    targetPrice3: 1.08,
    stopLoss: 0.85,
    riskRewardRatio: 2.0,
    leverageRec: 5,
    status: 'SL_HIT',
    highestRReached: 0,
    isTrailingActive: false,
    pnlPctCurrent: -3.41,
    realizedPnlPct: -3.41,
    outcomeResult: 'LOSS',
    createdAt: 'Kemarin',
    expiresAt: 'Selesai',
    closedAt: '2026-09-19 21:30:00 UTC',
    exitPrice: 0.85,
    indicatorsSummary: [
      'Stop Loss Support (s1) Tersentuh di $0.85',
      'Risiko Terbatasi di 3.41%',
      'Sinyal Ditutup Sebagai Loss Sesuai Aturan',
    ],
    notes:
      'Harga menyentuh s1 ($0.85) sebelum mencapai r1 mana pun. Sinyal ditutup dengan status STOPLOSS (-3.41%). Dihitung secara transparan sebagai kerugian (loss).',
    pipelineStage: 'PUBLISHED',
    triggerType: 'BREAKOUT',
    triggerDetails: 'False breakout yang dihentikan oleh level support stop s1.',
    fundingRate: 0.012,
    fundingBias: 'POSITIVE',
    liquidationDeltaUsd: 3200000,
    hasStopLoss: true,
    isRiskRewardValid: true,
    riskStatus: 'PASSED',
    officialTimestamp: '2026-09-19 20:15:00 UTC',
    verificationHash: '0x7808c1a938feb90128374a0129c94812',
    highestPnlReached: 1.2,
    priceLevels: {
      entry: 0.88,
      r1: 0.92,
      r2: 0.96,
      r3: 1.01,
      r4: 1.07,
      r5: 1.14,
      r6: 1.22,
      r7: 1.31,
      r8: 1.42,
      s1: 0.85,
      s2: 0.82,
      s3: 0.79,
      s4: 0.75,
      trailingStop: undefined,
      isTrailingActive: false,
    },
    auditTrail: [
      { timestamp: '20:15:00 UTC', event: 'Sinyal dirilis dengan batas risiko stop s1 di $0.85', price: 0.88, pnlPct: 0.0 },
      { timestamp: '20:20:00 UTC', event: 'Entry terisi di $0.88', price: 0.88, pnlPct: 0.0 },
      { timestamp: '21:30:00 UTC', event: 'Harga mencapai s1 $0.85 - STOPLOSS Tereksekusi (Loss Ditutup)', price: 0.85, pnlPct: -3.41 },
    ],
  },
  {
    id: 'SIG-DOGE-7607',
    symbol: 'DOGE/USDT',
    name: 'Dogecoin',
    category: 'Meme',
    exchange: 'BINANCE',
    direction: 'LONG',
    grade: 'NEUTRAL',
    timeframe: '1W',
    resolution: '1W',
    modelCategory: 'GAMMA',
    strength: 'NORMAL',
    lifecycleStatus: 'EXPIRED',
    strategyName: 'Gamma Model: Weekly Range Consolidation',
    strategyCategory: 'VOLATILITY',
    confluenceScore: 76,
    winRateProbability: 65.0,
    entryPrice: 0.38,
    currentPrice: 0.382,
    targetPrice1: 0.44,
    targetPrice2: 0.52,
    targetPrice3: 0.65,
    stopLoss: 0.34,
    riskRewardRatio: 2.2,
    leverageRec: 3,
    status: 'EXPIRED',
    highestRReached: 0,
    isTrailingActive: false,
    pnlPctCurrent: 0.52,
    realizedPnlPct: 0.52,
    outcomeResult: 'EXPIRED',
    createdAt: '7 hari yang lalu',
    expiresAt: 'Kedaluwarsa',
    closedAt: '2026-09-19 18:00:00 UTC',
    exitPrice: 0.382,
    indicatorsSummary: [
      'Durasi 7 Hari Terlampaui',
      'Tidak Menyentuh s1 Maupun r1',
      'Dikecualikan Dari Perhitungan Win/Loss Rate',
    ],
    notes:
      'Sinyal melampaui batas durasi (expired) tanpa menyentuh stop s1 atau target r1. Sesuai metodologi AKIRAQU, sinyal expired dilaporkan terpisah dan tidak masuk perhitungan win rate.',
    pipelineStage: 'PUBLISHED',
    triggerType: 'PATTERN_COMPLETION',
    triggerDetails: 'Weekly range consolidation pattern yang kedaluwarsa setelah batas waktu tercapai.',
    fundingRate: 0.005,
    fundingBias: 'NEUTRAL',
    liquidationDeltaUsd: 4100000,
    hasStopLoss: true,
    isRiskRewardValid: true,
    riskStatus: 'PASSED',
    officialTimestamp: '2026-09-12 18:00:00 UTC',
    verificationHash: '0x7607a8291fbc34091287e091b4029acb',
    priceLevels: {
      entry: 0.38,
      r1: 0.41,
      r2: 0.45,
      r3: 0.50,
      r4: 0.56,
      r5: 0.63,
      r6: 0.71,
      r7: 0.80,
      r8: 0.92,
      s1: 0.34,
      s2: 0.31,
      s3: 0.28,
      s4: 0.24,
    },
    auditTrail: [
      { timestamp: '12 Sep 18:00', event: 'Sinyal 1W dipublikasikan', price: 0.38, pnlPct: 0.0 },
      { timestamp: '19 Sep 18:00', event: 'Batas durasi 7 hari tercapai -> Status EXPIRED', price: 0.382, pnlPct: 0.52 },
    ],
  },
];

// Precision performance audit calculations strictly matching AKIRAQU specification
export interface SignalPerformanceMetrics {
  totalSignals: number;
  completedSignals: number; // Win + Loss only (Excludes Expired)
  wins: number;
  losses: number;
  expiredCount: number;
  inProgressCount: number;
  winRate: number; // Wins / (Wins + Losses) * 100
  totalCompletedPnlPct: number; // Sum of P/L from closed Win/Loss signals
  inProgressPnlPct: number; // Sum of floating P/L from active/trailing signals
  avgWinPnlPct: number;
  avgLossPnlPct: number;
  profitFactor: number;
  categoryBreakdown: Record<
    string,
    { total: number; wins: number; losses: number; winRate: number; pnlPct: number }
  >;
  timeframeBreakdown: Record<
    string,
    { total: number; wins: number; losses: number; winRate: number; pnlPct: number }
  >;
}

export function computeInstitutionalPerformance(
  signals: CryptoTradingSignal[]
): SignalPerformanceMetrics {
  let wins = 0;
  let losses = 0;
  let expiredCount = 0;
  let inProgressCount = 0;
  let totalCompletedPnl = 0;
  let totalWinPnl = 0;
  let totalLossPnl = 0;
  let inProgressPnl = 0;

  const categoryMap: Record<
    string,
    { total: number; wins: number; losses: number; winRate: number; pnlPct: number }
  > = {
    ALPHA: { total: 0, wins: 0, losses: 0, winRate: 0, pnlPct: 0 },
    GAMMA: { total: 0, wins: 0, losses: 0, winRate: 0, pnlPct: 0 },
    CLASSIC: { total: 0, wins: 0, losses: 0, winRate: 0, pnlPct: 0 },
    INV: { total: 0, wins: 0, losses: 0, winRate: 0, pnlPct: 0 },
  };

  const tfMap: Record<
    string,
    { total: number; wins: number; losses: number; winRate: number; pnlPct: number }
  > = {
    '1H': { total: 0, wins: 0, losses: 0, winRate: 0, pnlPct: 0 },
    '4H': { total: 0, wins: 0, losses: 0, winRate: 0, pnlPct: 0 },
    '8H': { total: 0, wins: 0, losses: 0, winRate: 0, pnlPct: 0 },
    '12H': { total: 0, wins: 0, losses: 0, winRate: 0, pnlPct: 0 },
    '1D': { total: 0, wins: 0, losses: 0, winRate: 0, pnlPct: 0 },
    '1W': { total: 0, wins: 0, losses: 0, winRate: 0, pnlPct: 0 },
  };

  signals.forEach((sig) => {
    const isWin =
      sig.outcomeResult === 'WIN' ||
      sig.lifecycleStatus === 'TAKEPROFIT' ||
      (sig.status === 'TAKEPROFIT' || (sig.status.includes('TP') && sig.closedAt !== undefined));
    const isLoss =
      sig.outcomeResult === 'LOSS' ||
      sig.lifecycleStatus === 'STOPLOSS' ||
      sig.status === 'SL_HIT';
    const isExpired =
      sig.outcomeResult === 'EXPIRED' ||
      sig.lifecycleStatus === 'EXPIRED' ||
      sig.status === 'EXPIRED';

    const pnl = sig.realizedPnlPct !== undefined ? sig.realizedPnlPct : sig.pnlPctCurrent || 0;
    const cat = sig.modelCategory || 'CLASSIC';
    const tf = sig.resolution || sig.timeframe || '1H';

    if (categoryMap[cat]) categoryMap[cat].total += 1;
    if (tfMap[tf]) tfMap[tf].total += 1;

    if (isExpired) {
      expiredCount += 1;
    } else if (isWin) {
      wins += 1;
      totalCompletedPnl += pnl;
      totalWinPnl += Math.abs(pnl);
      if (categoryMap[cat]) {
        categoryMap[cat].wins += 1;
        categoryMap[cat].pnlPct += pnl;
      }
      if (tfMap[tf]) {
        tfMap[tf].wins += 1;
        tfMap[tf].pnlPct += pnl;
      }
    } else if (isLoss) {
      losses += 1;
      totalCompletedPnl += pnl;
      totalLossPnl += Math.abs(pnl);
      if (categoryMap[cat]) {
        categoryMap[cat].losses += 1;
        categoryMap[cat].pnlPct += pnl;
      }
      if (tfMap[tf]) {
        tfMap[tf].losses += 1;
        tfMap[tf].pnlPct += pnl;
      }
    } else {
      // In-Progress (Pending, R1-R8, Trailing)
      inProgressCount += 1;
      inProgressPnl += sig.pnlPctCurrent || 0;
    }
  });

  const completedSignals = wins + losses;
  const winRate = completedSignals > 0 ? Math.round((wins / completedSignals) * 100) : 0;
  const avgWinPnlPct = wins > 0 ? +(totalWinPnl / wins).toFixed(2) : 0;
  const avgLossPnlPct = losses > 0 ? +(totalLossPnl / losses).toFixed(2) : 0;
  const profitFactor = totalLossPnl > 0 ? +(totalWinPnl / totalLossPnl).toFixed(2) : totalWinPnl > 0 ? 99.9 : 0;

  // Compute sub-win rates
  Object.keys(categoryMap).forEach((k) => {
    const totalFinished = categoryMap[k].wins + categoryMap[k].losses;
    categoryMap[k].winRate = totalFinished > 0 ? Math.round((categoryMap[k].wins / totalFinished) * 100) : 0;
    categoryMap[k].pnlPct = +categoryMap[k].pnlPct.toFixed(2);
  });

  Object.keys(tfMap).forEach((k) => {
    const totalFinished = tfMap[k].wins + tfMap[k].losses;
    tfMap[k].winRate = totalFinished > 0 ? Math.round((tfMap[k].wins / totalFinished) * 100) : 0;
    tfMap[k].pnlPct = +tfMap[k].pnlPct.toFixed(2);
  });

  return {
    totalSignals: signals.length,
    completedSignals,
    wins,
    losses,
    expiredCount,
    inProgressCount,
    winRate,
    totalCompletedPnlPct: +totalCompletedPnl.toFixed(2),
    inProgressPnlPct: +inProgressPnl.toFixed(2),
    avgWinPnlPct,
    avgLossPnlPct,
    profitFactor,
    categoryBreakdown: categoryMap,
    timeframeBreakdown: tfMap,
  };
}
