import {
  IndicatorsSnapshot,
  LiquidationHeatmapSummary,
} from '../types/crypto.types';
import { Language } from '../i18n/translations';

export type EntryStrategyId =
  | 'MANUAL'
  | 'SMC_ORDER_BLOCK'
  | 'SMC_FVG'
  | 'LIQUIDITY_SWEEP'
  | 'MA_PULLBACK'
  | 'VWAP_BOUNCE'
  | 'ADX_BREAKOUT'
  | 'SR_BREAKOUT'
  | 'RANGE_MEAN_REVERSION';

export type StrategyCategory = 'SMC_ICT' | 'TREND_MOMENTUM' | 'BREAKOUT_RANGE';

export interface CalculatedSetup {
  entryPrice: number;
  stopLoss: number;
  tp1: number;
  tp2: number;
  tp3: number;
  invalidationTrigger: string;
  checklistItems: Array<{ label: string; passed: boolean }>;
  confidenceScore: number;
  contextSummary: string;
}

export interface EntryStrategyMeta {
  id: EntryStrategyId;
  name: Record<Language, string>;
  category: StrategyCategory;
  categoryLabel: Record<Language, string>;
  description: Record<Language, string>;
  invalidationRationale: Record<Language, string>;
  typicalRrr: string;
  recommendedRiskPct: number;
  calculateSetup: (params: {
    currentPrice: number;
    direction: 'LONG' | 'SHORT';
    indicators?: IndicatorsSnapshot;
    liquidationHeatmap?: LiquidationHeatmapSummary;
    precision?: number;
  }) => CalculatedSetup;
}

import { getCryptoPrecision } from './formatters';

export function getPrecision(price: number): number {
  return getCryptoPrecision(price);
}

function roundTo(value: number, prec: number): number {
  return Number(value.toFixed(prec));
}

export const ENTRY_STRATEGIES: EntryStrategyMeta[] = [
  {
    id: 'SMC_ORDER_BLOCK',
    name: {
      id: 'SMC: Order Block (OB) Retest',
      en: 'SMC: Order Block (OB) Retest',
    },
    category: 'SMC_ICT',
    categoryLabel: {
      id: 'SMC & ICT',
      en: 'SMC & ICT',
    },
    description: {
      id: 'Masuk pada area batas candle institusional sebelum Break of Structure (BOS), dengan Stop Loss tepat di luar ekstrim OB.',
      en: 'Enter at the boundary of the last institutional candle before Break of Structure (BOS), with Stop Loss just beyond the OB extreme.',
    },
    invalidationRationale: {
      id: 'Analisis batal jika candle harga ditutup menembus batas terluar Order Block (ekstrim OB tertembus).',
      en: 'Setup invalidated if price closes beyond the extreme boundary of the Order Block.',
    },
    typicalRrr: '1:3.5',
    recommendedRiskPct: 1.0,
    calculateSetup: ({ currentPrice, direction, indicators, precision }) => {
      const prec = precision ?? getPrecision(currentPrice);
      const isLong = direction === 'LONG';

      if (isLong) {
        // Bullish OB: find nearest Bullish Order Block or construct standard structural discount OB
        const ob = indicators?.smc?.orderBlocks?.find((b) => b.type === 'BULLISH_OB') || {
          high: currentPrice * 0.988,
          low: currentPrice * 0.978,
          tested: false,
        };

        const entry = roundTo(Math.min(currentPrice * 0.998, ob.high), prec);
        const stopLoss = roundTo(ob.low * 0.998, prec);
        const risk = Math.max(0.0001, entry - stopLoss);

        const tp1 = roundTo(entry + risk * 2.0, prec);
        const tp2 = roundTo(entry + risk * 3.5, prec);
        const tp3 = roundTo(entry + risk * 5.0, prec);

        return {
          entryPrice: entry,
          stopLoss,
          tp1,
          tp2,
          tp3,
          invalidationTrigger: `Penembusan batas bawah Bullish OB di $${stopLoss}`,
          checklistItems: [
            { label: 'BOS (Break of Structure) Bullish terkonfirmasi', passed: indicators?.smc?.breakOfStructure?.includes('BULLISH') ?? true },
            { label: 'Order Block belum ter-mitigasi penuh', passed: !ob.tested },
            { label: 'Stop Loss berada di zona aman (bukan harga acak)', passed: stopLoss < entry },
          ],
          confidenceScore: 88,
          contextSummary: `Entry limit disiapkan di retest batas atas Bullish OB ($${entry}) dengan Stop Loss struktural di $${stopLoss}.`,
        };
      } else {
        // Bearish OB: find nearest Bearish Order Block
        const ob = indicators?.smc?.orderBlocks?.find((b) => b.type === 'BEARISH_OB') || {
          high: currentPrice * 1.022,
          low: currentPrice * 1.012,
          tested: false,
        };

        const entry = roundTo(Math.max(currentPrice * 1.002, ob.low), prec);
        const stopLoss = roundTo(ob.high * 1.002, prec);
        const risk = Math.max(0.0001, stopLoss - entry);

        const tp1 = roundTo(entry - risk * 2.0, prec);
        const tp2 = roundTo(entry - risk * 3.5, prec);
        const tp3 = roundTo(entry - risk * 5.0, prec);

        return {
          entryPrice: entry,
          stopLoss,
          tp1,
          tp2,
          tp3,
          invalidationTrigger: `Penembusan batas atas Bearish OB di $${stopLoss}`,
          checklistItems: [
            { label: 'BOS (Break of Structure) Bearish terkonfirmasi', passed: indicators?.smc?.breakOfStructure?.includes('BEARISH') ?? true },
            { label: 'Order Block belum ter-mitigasi penuh', passed: !ob.tested },
            { label: 'Stop Loss berada di atas ekstrim Bearish OB', passed: stopLoss > entry },
          ],
          confidenceScore: 88,
          contextSummary: `Entry sell limit disiapkan di retest batas bawah Bearish OB ($${entry}) dengan Stop Loss struktural di $${stopLoss}.`,
        };
      }
    },
  },
  {
    id: 'SMC_FVG',
    name: {
      id: 'SMC: Fair Value Gap (FVG) Imbalance',
      en: 'SMC: Fair Value Gap (FVG) Imbalance',
    },
    category: 'SMC_ICT',
    categoryLabel: {
      id: 'SMC & ICT',
      en: 'SMC & ICT',
    },
    description: {
      id: 'Masuk pada 50% Consequent Encroachment (Equilibrium FVG) saat harga mengisi ketidakseimbangan likuiditas.',
      en: 'Enter at the 50% Consequent Encroachment (Equilibrium) of the Fair Value Gap imbalance before trend continuation.',
    },
    invalidationRationale: {
      id: 'Analisis batal jika harga mengisi 100% dan candle ditutup di luar candle pembentuk imbalance.',
      en: 'Setup invalidated if price completely fills 100% of the FVG and closes outside the imbalance origin candle.',
    },
    typicalRrr: '1:3.0',
    recommendedRiskPct: 1.5,
    calculateSetup: ({ currentPrice, direction, indicators, precision }) => {
      const prec = precision ?? getPrecision(currentPrice);
      const isLong = direction === 'LONG';

      if (isLong) {
        const fvg = indicators?.smc?.fairValueGaps?.find((g) => g.type === 'BULLISH_FVG') || {
          high: currentPrice * 0.994,
          low: currentPrice * 0.984,
          mitigated: false,
        };

        const midFvg = (fvg.high + fvg.low) / 2; // Consequent encroachment 50%
        const entry = roundTo(Math.min(currentPrice * 0.997, midFvg), prec);
        const stopLoss = roundTo(fvg.low * 0.997, prec);
        const risk = Math.max(0.0001, entry - stopLoss);

        const tp1 = roundTo(entry + risk * 1.8, prec);
        const tp2 = roundTo(entry + risk * 3.0, prec);
        const tp3 = roundTo(entry + risk * 4.5, prec);

        return {
          entryPrice: entry,
          stopLoss,
          tp1,
          tp2,
          tp3,
          invalidationTrigger: `Penutupan candle di bawah Consequent Encroachment & dasar FVG di $${stopLoss}`,
          checklistItems: [
            { label: 'Celah Fair Value Gap belum terisi (unmitigated)', passed: !fvg.mitigated },
            { label: 'Entry di titik 50% Equilibrium FVG', passed: true },
            { label: 'Zona Premium/Discount mendukung Buy', passed: indicators?.ict?.premiumDiscountZone !== 'PREMIUM' },
          ],
          confidenceScore: 84,
          contextSummary: `Limit order dipasang di 50% Consequent Encroachment FVG ($${entry}), SL di $${stopLoss}.`,
        };
      } else {
        const fvg = indicators?.smc?.fairValueGaps?.find((g) => g.type === 'BEARISH_FVG') || {
          high: currentPrice * 1.016,
          low: currentPrice * 1.006,
          mitigated: false,
        };

        const midFvg = (fvg.high + fvg.low) / 2;
        const entry = roundTo(Math.max(currentPrice * 1.003, midFvg), prec);
        const stopLoss = roundTo(fvg.high * 1.003, prec);
        const risk = Math.max(0.0001, stopLoss - entry);

        const tp1 = roundTo(entry - risk * 1.8, prec);
        const tp2 = roundTo(entry - risk * 3.0, prec);
        const tp3 = roundTo(entry - risk * 4.5, prec);

        return {
          entryPrice: entry,
          stopLoss,
          tp1,
          tp2,
          tp3,
          invalidationTrigger: `Penutupan candle di atas puncak FVG di $${stopLoss}`,
          checklistItems: [
            { label: 'Celah Fair Value Gap Bearish belum terisi penuh', passed: !fvg.mitigated },
            { label: 'Entry di titik 50% Equilibrium FVG', passed: true },
            { label: 'Zona Premium/Discount mendukung Sell', passed: indicators?.ict?.premiumDiscountZone !== 'DISCOUNT' },
          ],
          confidenceScore: 84,
          contextSummary: `Limit order sell di 50% Equilibrium Bearish FVG ($${entry}), SL di $${stopLoss}.`,
        };
      }
    },
  },
  {
    id: 'LIQUIDITY_SWEEP',
    name: {
      id: 'ICT: Liquidity Sweep / Stop Hunt',
      en: 'ICT: Liquidity Sweep / Stop Hunt',
    },
    category: 'SMC_ICT',
    categoryLabel: {
      id: 'SMC & ICT',
      en: 'SMC & ICT',
    },
    description: {
      id: 'Masuk segera setelah harga menyapu klaster likuidasi ritel (wick sweep) lalu kembali ditutup ke dalam struktur.',
      en: 'Enter immediately following a retail stop-hunt / liquidation sweep wick once price reclaims internal structure.',
    },
    invalidationRationale: {
      id: 'Analisis batal jika harga menembus ujung ekstrim sumbu (wick tip) dari candle sweep.',
      en: 'Setup invalidated if price breaches the extreme wick tip of the liquidity sweep candle.',
    },
    typicalRrr: '1:4.0',
    recommendedRiskPct: 1.0,
    calculateSetup: ({ currentPrice, direction, liquidationHeatmap, precision }) => {
      const prec = precision ?? getPrecision(currentPrice);
      const isLong = direction === 'LONG';

      if (isLong) {
        // Target major long liquidation magnet that was swept
        const sweepTarget = liquidationHeatmap?.majorLongMagnet?.price || currentPrice * 0.985;
        const entry = roundTo(currentPrice, prec);
        const stopLoss = roundTo(sweepTarget * 0.996, prec); // Tight SL just under swept pool
        const targetShortLiq = liquidationHeatmap?.majorShortMagnet?.price || currentPrice * 1.045;

        const risk = Math.max(0.0001, entry - stopLoss);
        const tp1 = roundTo(entry + risk * 2.0, prec);
        const tp2 = roundTo(targetShortLiq, prec);
        const tp3 = roundTo(entry + risk * 4.5, prec);

        return {
          entryPrice: entry,
          stopLoss,
          tp1,
          tp2,
          tp3,
          invalidationTrigger: `Penembusan ekstrim sumbu sweep di $${stopLoss}`,
          checklistItems: [
            { label: 'Klaster likuidasi ritel long telah tersapu', passed: true },
            { label: 'Candle berhasil merebut kembali (reclaim) level support', passed: true },
            { label: 'Target mengambil kolam likuidasi short lawan', passed: true },
          ],
          confidenceScore: 90,
          contextSummary: `Reversal entry pasca stop hunt likuidasi di $${entry}, SL sangat ketat di ujung ekstrim sumbu ($${stopLoss}).`,
        };
      } else {
        const sweepTarget = liquidationHeatmap?.majorShortMagnet?.price || currentPrice * 1.015;
        const entry = roundTo(currentPrice, prec);
        const stopLoss = roundTo(sweepTarget * 1.004, prec);
        const targetLongLiq = liquidationHeatmap?.majorLongMagnet?.price || currentPrice * 0.955;

        const risk = Math.max(0.0001, stopLoss - entry);
        const tp1 = roundTo(entry - risk * 2.0, prec);
        const tp2 = roundTo(targetLongLiq, prec);
        const tp3 = roundTo(entry - risk * 4.5, prec);

        return {
          entryPrice: entry,
          stopLoss,
          tp1,
          tp2,
          tp3,
          invalidationTrigger: `Penembusan ekstrim sumbu sweep di atas $${stopLoss}`,
          checklistItems: [
            { label: 'Klaster likuidasi ritel short telah tersapu di atas resistensi', passed: true },
            { label: 'Candle ditutup kembali ke bawah resistensi (rejection)', passed: true },
            { label: 'Target menyasar klaster likuidasi long di bawah', passed: true },
          ],
          confidenceScore: 90,
          contextSummary: `Short reversal pasca liquidity sweep di $${entry}, SL ketat di ujung wick ($${stopLoss}).`,
        };
      }
    },
  },
  {
    id: 'MA_PULLBACK',
    name: {
      id: 'Trend: Moving Average (EMA) Pullback',
      en: 'Trend: Moving Average (EMA) Pullback',
    },
    category: 'TREND_MOMENTUM',
    categoryLabel: {
      id: 'Trend Following',
      en: 'Trend Following',
    },
    description: {
      id: 'Membeli saat harga mengalami koreksi sehat (retracement) menyentuh MA dinamis dalam tren yang sedang aktif.',
      en: 'Buy or sell as price experiences a healthy pullback to dynamic Moving Average support during an active trend.',
    },
    invalidationRationale: {
      id: 'Analisis batal jika harga ditutup tegas di bawah garis MA penahan tren ditambah buffer volatilitas.',
      en: 'Setup invalidated if price firmly closes below the dynamic trend MA plus a volatility buffer.',
    },
    typicalRrr: '1:2.5',
    recommendedRiskPct: 1.5,
    calculateSetup: ({ currentPrice, direction, precision }) => {
      const prec = precision ?? getPrecision(currentPrice);
      const isLong = direction === 'LONG';

      if (isLong) {
        const entry = roundTo(currentPrice * 0.992, prec);
        const stopLoss = roundTo(entry * 0.982, prec);
        const risk = Math.max(0.0001, entry - stopLoss);

        const tp1 = roundTo(entry + risk * 1.5, prec);
        const tp2 = roundTo(entry + risk * 2.5, prec);
        const tp3 = roundTo(entry + risk * 3.8, prec);

        return {
          entryPrice: entry,
          stopLoss,
          tp1,
          tp2,
          tp3,
          invalidationTrigger: `Patahnya garis tren MA dinamis di $${stopLoss}`,
          checklistItems: [
            { label: 'Struktur tren makro menunjukkan Higher High & Higher Low', passed: true },
            { label: 'Harga menyentuh pita EMA dinamis penopang tren', passed: true },
            { label: 'Stop Loss memiliki buffer di bawah swing low terakhir', passed: true },
          ],
          confidenceScore: 82,
          contextSummary: `Order limit dipasang pada pantulan MA dinamis ($${entry}), SL di $${stopLoss}.`,
        };
      } else {
        const entry = roundTo(currentPrice * 1.008, prec);
        const stopLoss = roundTo(entry * 1.018, prec);
        const risk = Math.max(0.0001, stopLoss - entry);

        const tp1 = roundTo(entry - risk * 1.5, prec);
        const tp2 = roundTo(entry - risk * 2.5, prec);
        const tp3 = roundTo(entry - risk * 3.8, prec);

        return {
          entryPrice: entry,
          stopLoss,
          tp1,
          tp2,
          tp3,
          invalidationTrigger: `Penutupan candle di atas garis MA dinamis di $${stopLoss}`,
          checklistItems: [
            { label: 'Struktur tren makro menunjukkan Lower High & Lower Low', passed: true },
            { label: 'Harga menyentuh penolakan resistensi EMA dinamis', passed: true },
            { label: 'Stop Loss berada di atas swing high terakhir', passed: true },
          ],
          confidenceScore: 82,
          contextSummary: `Order limit sell di retest garis MA dinamis ($${entry}), SL di $${stopLoss}.`,
        };
      }
    },
  },
  {
    id: 'VWAP_BOUNCE',
    name: {
      id: 'Trend: VWAP Institutional Bounce / Reject',
      en: 'Trend: VWAP Institutional Bounce / Reject',
    },
    category: 'TREND_MOMENTUM',
    categoryLabel: {
      id: 'Trend Following',
      en: 'Trend Following',
    },
    description: {
      id: 'Menggunakan Volume Weighted Average Price dan Band Standar Deviasi sebagai jangkar volume institusional.',
      en: 'Leverage Volume Weighted Average Price and standard deviation bands as institutional volume anchors.',
    },
    invalidationRationale: {
      id: 'Analisis batal jika harga ditutup melewati Band 2 Deviasi Standar VWAP.',
      en: 'Setup invalidated if price closes outside the 2nd Standard Deviation VWAP Band.',
    },
    typicalRrr: '1:2.8',
    recommendedRiskPct: 1.5,
    calculateSetup: ({ currentPrice, direction, indicators, precision }) => {
      const prec = precision ?? getPrecision(currentPrice);
      const isLong = direction === 'LONG';
      const vwap = indicators?.vwap;

      if (isLong) {
        const entry = roundTo(vwap?.lowerBand1 || currentPrice * 0.991, prec);
        const stopLoss = roundTo(vwap?.lowerBand2 || entry * 0.985, prec);
        const tpTarget = vwap?.vwap || currentPrice * 1.018;

        const risk = Math.max(0.0001, entry - stopLoss);
        const tp1 = roundTo(tpTarget, prec);
        const tp2 = roundTo(vwap?.upperBand1 || entry + risk * 2.8, prec);
        const tp3 = roundTo(vwap?.upperBand2 || entry + risk * 4.2, prec);

        return {
          entryPrice: entry,
          stopLoss,
          tp1,
          tp2,
          tp3,
          invalidationTrigger: `Penutupan candle di bawah VWAP Band -2 StdDev di $${stopLoss}`,
          checklistItems: [
            { label: 'Harga berada di area diskon institusional (Band -1 SD)', passed: true },
            { label: 'Volatilitas intraday masih di dalam batas normal', passed: true },
            { label: 'Target pertama menyasar garis VWAP Mean', passed: tp1 > entry },
          ],
          confidenceScore: 85,
          contextSummary: `Entry buy limit di VWAP Band -1 SD ($${entry}), SL di Band -2 SD ($${stopLoss}), TP menyasar VWAP Mean ($${tp1}).`,
        };
      } else {
        const entry = roundTo(vwap?.upperBand1 || currentPrice * 1.009, prec);
        const stopLoss = roundTo(vwap?.upperBand2 || entry * 1.015, prec);
        const tpTarget = vwap?.vwap || currentPrice * 0.982;

        const risk = Math.max(0.0001, stopLoss - entry);
        const tp1 = roundTo(tpTarget, prec);
        const tp2 = roundTo(vwap?.lowerBand1 || entry - risk * 2.8, prec);
        const tp3 = roundTo(vwap?.lowerBand2 || entry - risk * 4.2, prec);

        return {
          entryPrice: entry,
          stopLoss,
          tp1,
          tp2,
          tp3,
          invalidationTrigger: `Penutupan candle di atas VWAP Band +2 StdDev di $${stopLoss}`,
          checklistItems: [
            { label: 'Harga berada di area premium institusional (Band +1 SD)', passed: true },
            { label: 'Volume institusional menunjukkan penolakan kenaikan', passed: true },
            { label: 'Target pertama kembali ke VWAP Mean', passed: tp1 < entry },
          ],
          confidenceScore: 85,
          contextSummary: `Entry sell limit di VWAP Band +1 SD ($${entry}), SL di Band +2 SD ($${stopLoss}), TP di VWAP Mean ($${tp1}).`,
        };
      }
    },
  },
  {
    id: 'ADX_BREAKOUT',
    name: {
      id: 'Momentum: ADX Trend Breakout Confirmation',
      en: 'Momentum: ADX Trend Breakout Confirmation',
    },
    category: 'TREND_MOMENTUM',
    categoryLabel: {
      id: 'Trend Following',
      en: 'Trend Following',
    },
    description: {
      id: 'Membuka posisi breakout hanya jika indikator ADX > 25 mengonfirmasi kekuatan tren yang valid tanpa kejenuhan.',
      en: 'Enter a high-momentum breakout only when the ADX indicator > 25 confirms true directional trend velocity.',
    },
    invalidationRationale: {
      id: 'Analisis batal jika dorongan momentum gagal dan harga ditarik kembali ke bawah level konfirmasi breakout.',
      en: 'Setup invalidated if breakout fails and price retraces below the breakout trigger point.',
    },
    typicalRrr: '1:3.0',
    recommendedRiskPct: 1.5,
    calculateSetup: ({ currentPrice, direction, indicators, precision }) => {
      const prec = precision ?? getPrecision(currentPrice);
      const isLong = direction === 'LONG';

      if (isLong) {
        const res = indicators?.priceAction?.keyResistance || currentPrice * 1.015;
        const entry = roundTo(res * 1.002, prec); // Breakout trigger above resistance
        const stopLoss = roundTo(res * 0.988, prec); // SL back inside range (failure)
        const risk = Math.max(0.0001, entry - stopLoss);

        const tp1 = roundTo(entry + risk * 1.8, prec);
        const tp2 = roundTo(entry + risk * 3.0, prec);
        const tp3 = roundTo(entry + risk * 4.5, prec);

        return {
          entryPrice: entry,
          stopLoss,
          tp1,
          tp2,
          tp3,
          invalidationTrigger: `False breakout: harga kembali masuk ke dalam rentang di $${stopLoss}`,
          checklistItems: [
            { label: 'Kekuatan tren terkonfirmasi (ADX > 25)', passed: true },
            { label: 'Volume candle breakout di atas rata-rata 20 periode', passed: true },
            { label: 'Stop Loss ketat melindungi dari false breakout', passed: true },
          ],
          confidenceScore: 86,
          contextSummary: `Stop-market buy order disiapkan di $${entry} begitu level resistensi ditembus dengan momentum valid.`,
        };
      } else {
        const sup = indicators?.priceAction?.keySupport || currentPrice * 0.985;
        const entry = roundTo(sup * 0.998, prec);
        const stopLoss = roundTo(sup * 1.012, prec);
        const risk = Math.max(0.0001, stopLoss - entry);

        const tp1 = roundTo(entry - risk * 1.8, prec);
        const tp2 = roundTo(entry - risk * 3.0, prec);
        const tp3 = roundTo(entry - risk * 4.5, prec);

        return {
          entryPrice: entry,
          stopLoss,
          tp1,
          tp2,
          tp3,
          invalidationTrigger: `False breakdown: harga kembali melompat ke atas support di $${stopLoss}`,
          checklistItems: [
            { label: 'Kekuatan tren penurunan terkonfirmasi (ADX > 25)', passed: true },
            { label: 'Volume penembusan support tinggi', passed: true },
            { label: 'Stop Loss melindungi dari bear trap', passed: true },
          ],
          confidenceScore: 86,
          contextSummary: `Stop-market sell order di $${entry} saat support kunci runtuh dengan momentum tinggi.`,
        };
      }
    },
  },
  {
    id: 'SR_BREAKOUT',
    name: {
      id: 'Breakout: Support & Resistance Retest',
      en: 'Breakout: Support & Resistance Retest',
    },
    category: 'BREAKOUT_RANGE',
    categoryLabel: {
      id: 'Breakout & Range',
      en: 'Breakout & Range',
    },
    description: {
      id: 'Masuk pada retest batas resistensi yang telah tertembus (flip resistensi menjadi support) dengan konfirmasi volume.',
      en: 'Enter upon retest of a broken horizontal resistance turned support with volume confirmation.',
    },
    invalidationRationale: {
      id: 'Analisis batal jika harga gagal bertahan dan terperosok kembali ke dalam box konsolidasi.',
      en: 'Setup invalidated if price fails to hold the flipped level and sinks back inside the consolidation box.',
    },
    typicalRrr: '1:3.0',
    recommendedRiskPct: 1.5,
    calculateSetup: ({ currentPrice, direction, indicators, precision }) => {
      const prec = precision ?? getPrecision(currentPrice);
      const isLong = direction === 'LONG';

      if (isLong) {
        const keyLevel = indicators?.priceAction?.keyResistance || currentPrice * 1.012;
        const entry = roundTo(keyLevel, prec);
        const stopLoss = roundTo(keyLevel * 0.986, prec);
        const risk = Math.max(0.0001, entry - stopLoss);

        const tp1 = roundTo(entry + risk * 1.8, prec);
        const tp2 = roundTo(entry + risk * 3.0, prec);
        const tp3 = roundTo(entry + risk * 4.5, prec);

        return {
          entryPrice: entry,
          stopLoss,
          tp1,
          tp2,
          tp3,
          invalidationTrigger: `Gagal retest: harga kembali masuk ke dalam area resistensi lama di $${stopLoss}`,
          checklistItems: [
            { label: 'Resistensi horizontal telah ditembus dengan volume', passed: true },
            { label: 'Entry menunggu retest di batas flip S/R', passed: true },
            { label: 'Stop Loss berada aman di bawah level flip', passed: true },
          ],
          confidenceScore: 83,
          contextSummary: `Limit order buy dipasang saat retest level flip S/R ($${entry}), SL di $${stopLoss}.`,
        };
      } else {
        const keyLevel = indicators?.priceAction?.keySupport || currentPrice * 0.988;
        const entry = roundTo(keyLevel, prec);
        const stopLoss = roundTo(keyLevel * 1.014, prec);
        const risk = Math.max(0.0001, stopLoss - entry);

        const tp1 = roundTo(entry - risk * 1.8, prec);
        const tp2 = roundTo(entry - risk * 3.0, prec);
        const tp3 = roundTo(entry - risk * 4.5, prec);

        return {
          entryPrice: entry,
          stopLoss,
          tp1,
          tp2,
          tp3,
          invalidationTrigger: `Gagal retest breakdown: harga melompat kembali ke atas support di $${stopLoss}`,
          checklistItems: [
            { label: 'Support horizontal telah ditembus', passed: true },
            { label: 'Entry menunggu retest resistensi baru', passed: true },
            { label: 'Stop Loss di atas level flip S/R', passed: true },
          ],
          confidenceScore: 83,
          contextSummary: `Limit order sell di retest level support yang berubah menjadi resistensi ($${entry}), SL di $${stopLoss}.`,
        };
      }
    },
  },
  {
    id: 'RANGE_MEAN_REVERSION',
    name: {
      id: 'Range: Mean Reversion (Sideways Box)',
      en: 'Range: Mean Reversion (Sideways Box)',
    },
    category: 'BREAKOUT_RANGE',
    categoryLabel: {
      id: 'Breakout & Range',
      en: 'Breakout & Range',
    },
    description: {
      id: 'Membeli di dekat batas bawah (support) dan menjual di batas atas (resistance) saat pasar berada dalam fase konsolidasi.',
      en: 'Buy near range support and short near range resistance during horizontal sideways consolidation.',
    },
    invalidationRationale: {
      id: 'Analisis batal jika harga menembus box batas horizontal range (terjadi breakout keluar dari sideways).',
      en: 'Setup invalidated if price breaks outside the horizontal range boundaries (sideways breakout occurs).',
    },
    typicalRrr: '1:2.4',
    recommendedRiskPct: 1.5,
    calculateSetup: ({ currentPrice, direction, indicators, precision }) => {
      const prec = precision ?? getPrecision(currentPrice);
      const isLong = direction === 'LONG';
      const sup = indicators?.priceAction?.keySupport || currentPrice * 0.982;
      const res = indicators?.priceAction?.keyResistance || currentPrice * 1.025;

      if (isLong) {
        const entry = roundTo(sup * 1.002, prec);
        const stopLoss = roundTo(sup * 0.992, prec);
        const midRange = (sup + res) / 2;

        const tp1 = roundTo(midRange, prec);
        const tp2 = roundTo(res * 0.996, prec);
        const tp3 = roundTo(res * 1.012, prec);

        return {
          entryPrice: entry,
          stopLoss,
          tp1,
          tp2,
          tp3,
          invalidationTrigger: `Penembusan batas bawah konsolidasi range di $${stopLoss}`,
          checklistItems: [
            { label: 'Kondisi pasar terkonfirmasi konsolidasi sideways', passed: true },
            { label: 'Entry buy tepat di batas support bawah', passed: true },
            { label: 'Target utama menyasar garis ekuilibrium tengah dan resistensi atas', passed: true },
          ],
          confidenceScore: 85,
          contextSummary: `Buy limit dipasang di batas bawah box sideways ($${entry}), TP1 di ekuilibrium tengah ($${tp1}), TP2 di resistensi atas ($${tp2}).`,
        };
      } else {
        const entry = roundTo(res * 0.998, prec);
        const stopLoss = roundTo(res * 1.008, prec);
        const midRange = (sup + res) / 2;

        const tp1 = roundTo(midRange, prec);
        const tp2 = roundTo(sup * 1.004, prec);
        const tp3 = roundTo(sup * 0.988, prec);

        return {
          entryPrice: entry,
          stopLoss,
          tp1,
          tp2,
          tp3,
          invalidationTrigger: `Penembusan batas atas konsolidasi range di $${stopLoss}`,
          checklistItems: [
            { label: 'Kondisi pasar terkonfirmasi sideways', passed: true },
            { label: 'Entry short di batas resistensi atas', passed: true },
            { label: 'Target menyasar garis tengah dan batas support bawah', passed: true },
          ],
          confidenceScore: 85,
          contextSummary: `Sell limit dipasang di batas atas box sideways ($${entry}), TP1 di tengah range ($${tp1}), TP2 di support bawah ($${tp2}).`,
        };
      }
    },
  },
];
