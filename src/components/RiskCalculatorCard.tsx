import React, { useState, useMemo } from 'react';
import {
  RiskManagementPlan,
  IndicatorsSnapshot,
  LiquidationHeatmapSummary,
} from '../types/crypto.types';
import {
  Scale,
  AlertOctagon,
  Coins,
  Sparkles,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Copy,
  Check,
  Zap,
  RotateCcw,
  Sliders,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Percent,
  Crosshair,
  CheckCircle2,
  BookOpen,
  Target,
  Plus,
  Trash2,
  Split,
} from 'lucide-react';
import { Language, getTranslation } from '../i18n/translations';
import { formatCryptoPrice, getCryptoPrecision } from '../utils/formatters';
import {
  ENTRY_STRATEGIES,
  EntryStrategyId,
  StrategyCategory,
  CalculatedSetup,
} from '../utils/entryStrategies';

export type EntryExecutionMode = 'SINGLE' | 'DCA_LADDER' | 'BREAKOUT_TRIGGER';

export interface DcaOrderRow {
  id: string;
  price: number;
  allocationPct: number;
}

interface RiskCalculatorCardProps {
  initialRiskPlan: RiskManagementPlan;
  symbol: string;
  indicators?: IndicatorsSnapshot;
  liquidationHeatmap?: LiquidationHeatmapSummary;
  currentPrice?: number;
  lang?: Language;
  theme?: 'light' | 'dark';
}

const CAPITAL_PRESETS = [1, 5, 10, 25, 50, 100, 500, 1000, 5000, 10000];
const RISK_PRESETS = [0.5, 1.0, 1.5, 2.0, 3.0, 5.0];
const LEVERAGE_PRESETS = [1, 2, 3, 5, 10, 15, 20, 25, 50, 75, 100];

export const RiskCalculatorCard: React.FC<RiskCalculatorCardProps> = React.memo(({
  initialRiskPlan,
  symbol,
  indicators,
  liquidationHeatmap,
  currentPrice,
  lang = 'id',
  theme = 'dark',
}) => {
  const t = getTranslation(lang);
  const isDark = theme === 'dark';

  // Direction: LONG vs SHORT
  const initialDirection = initialRiskPlan.takeProfit1 >= initialRiskPlan.entryPrice ? 'LONG' : 'SHORT';
  const [tradeDirection, setTradeDirection] = useState<'LONG' | 'SHORT'>(initialDirection);
  const [marginMode, setMarginMode] = useState<'ISOLATED' | 'CROSS'>('ISOLATED');

  // Interactive Inputs
  const [balance, setBalance] = useState<number>(initialRiskPlan.accountBalance || 10000);
  const [riskPct, setRiskPct] = useState<number>(initialRiskPlan.riskPercentage || 1.5);
  const [customLeverage, setCustomLeverage] = useState<number>(initialRiskPlan.recommendedLeverage || 5);
  const [entryPrice, setEntryPrice] = useState<number>(initialRiskPlan.entryPrice);
  const [stopLoss, setStopLoss] = useState<number>(initialRiskPlan.stopLoss);
  const [tp1, setTp1] = useState<number>(initialRiskPlan.takeProfit1);
  const [tp2, setTp2] = useState<number>(initialRiskPlan.takeProfit2);
  const [tp3, setTp3] = useState<number>(initialRiskPlan.takeProfit3);
  const [fundingRatePct, setFundingRatePct] = useState<number>(0.01); // 0.01% standard 8h funding
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Tactical Entry Strategy Playbook State
  const [selectedStrategyId, setSelectedStrategyId] = useState<EntryStrategyId>('MANUAL');
  const [strategySetup, setStrategySetup] = useState<CalculatedSetup | null>(null);
  const [strategyCategoryFilter, setStrategyCategoryFilter] = useState<StrategyCategory | 'ALL'>('ALL');
  const [showStrategyDetails, setShowStrategyDetails] = useState<boolean>(true);

  const getPricePrecision = (p: number): number => {
    return getCryptoPrecision(p);
  };

  // Progressive Disclosure: Entry Execution Modes
  const [entryMode, setEntryMode] = useState<EntryExecutionMode>('SINGLE');

  // Scale-In / DCA Ladder State (Default: 2 tiers, 50% / 50%)
  const [dcaOrders, setDcaOrders] = useState<DcaOrderRow[]>([
    { id: '1', price: initialRiskPlan.entryPrice, allocationPct: 50 },
    {
      id: '2',
      price: Number(
        (
          initialRiskPlan.entryPrice *
          (initialRiskPlan.takeProfit1 >= initialRiskPlan.entryPrice ? 0.99 : 1.01)
        ).toFixed(getPricePrecision(initialRiskPlan.entryPrice))
      ),
      allocationPct: 50,
    },
  ]);

  // Breakout / Trigger State (Default: Stop-Market with 0.05% slippage buffer)
  const [triggerPrice, setTriggerPrice] = useState<number>(
    Number(
      (
        initialRiskPlan.entryPrice *
        (initialRiskPlan.takeProfit1 >= initialRiskPlan.entryPrice ? 1.005 : 0.995)
      ).toFixed(getPricePrecision(initialRiskPlan.entryPrice))
    )
  );
  const [triggerOrderType, setTriggerOrderType] = useState<'STOP_MARKET' | 'STOP_LIMIT'>('STOP_MARKET');
  const [slippageBufferPct, setSlippageBufferPct] = useState<number>(0.05);

  // Calculate DCA Total Allocation and Weighted Average
  const totalDcaAllocation = useMemo(() => {
    return dcaOrders.reduce((sum, o) => sum + (Number(o.allocationPct) || 0), 0);
  }, [dcaOrders]);

  const avgDcaEntry = useMemo(() => {
    const totalWeight = totalDcaAllocation || 100;
    const weightedSum = dcaOrders.reduce(
      (sum, o) => sum + (Number(o.price) || 0) * (Number(o.allocationPct) || 0),
      0
    );
    const prec = getPricePrecision(entryPrice);
    return totalWeight > 0 ? Number((weightedSum / totalWeight).toFixed(prec)) : entryPrice;
  }, [dcaOrders, totalDcaAllocation, entryPrice]);

  // Effective Entry Price across all modes (Progressive Disclosure Engine)
  const effectiveEntryPrice = useMemo(() => {
    if (entryMode === 'DCA_LADDER') {
      return avgDcaEntry > 0 ? avgDcaEntry : entryPrice;
    }
    if (entryMode === 'BREAKOUT_TRIGGER') {
      const base = triggerPrice > 0 ? triggerPrice : entryPrice;
      if (triggerOrderType === 'STOP_MARKET' && slippageBufferPct > 0) {
        const prec = getPricePrecision(base);
        const slipMult =
          tradeDirection === 'LONG'
            ? 1 + slippageBufferPct / 100
            : 1 - slippageBufferPct / 100;
        return Number((base * slipMult).toFixed(prec));
      }
      return base;
    }
    return entryPrice > 0 ? entryPrice : 1;
  }, [
    entryMode,
    avgDcaEntry,
    entryPrice,
    triggerPrice,
    triggerOrderType,
    slippageBufferPct,
    tradeDirection,
  ]);

  const handleAddDcaRow = () => {
    if (dcaOrders.length >= 4) return;
    const prec = getPricePrecision(entryPrice);
    const lastOrder = dcaOrders[dcaOrders.length - 1];
    const stepOffset = tradeDirection === 'LONG' ? 0.99 : 1.01;
    const newPrice = Number(((lastOrder?.price || entryPrice) * stepOffset).toFixed(prec));
    const newId = String(Date.now());
    const newCount = dcaOrders.length + 1;
    const equalAlloc = Math.floor(100 / newCount);
    const remainder = 100 - equalAlloc * newCount;
    setDcaOrders([
      ...dcaOrders.map((o, idx) => ({ ...o, allocationPct: equalAlloc + (idx === 0 ? remainder : 0) })),
      { id: newId, price: newPrice, allocationPct: equalAlloc },
    ]);
  };

  const handleRemoveDcaRow = (idToRemove: string) => {
    if (dcaOrders.length <= 2) return;
    const remaining = dcaOrders.filter((o) => o.id !== idToRemove);
    const equalAlloc = Math.floor(100 / remaining.length);
    const remainder = 100 - equalAlloc * remaining.length;
    setDcaOrders(
      remaining.map((o, idx) => ({
        ...o,
        allocationPct: equalAlloc + (idx === 0 ? remainder : 0),
      }))
    );
  };

  const handleUpdateDcaPrice = (id: string, newPrice: number) => {
    setDcaOrders((prev) => prev.map((o) => (o.id === id ? { ...o, price: newPrice } : o)));
  };

  const handleUpdateDcaAlloc = (id: string, newAlloc: number) => {
    setDcaOrders((prev) => prev.map((o) => (o.id === id ? { ...o, allocationPct: newAlloc } : o)));
  };

  const handleNormalizeDcaAlloc = () => {
    if (!dcaOrders.length) return;
    const equalAlloc = Math.floor(100 / dcaOrders.length);
    const remainder = 100 - equalAlloc * dcaOrders.length;
    setDcaOrders(
      dcaOrders.map((o, idx) => ({
        ...o,
        allocationPct: equalAlloc + (idx === 0 ? remainder : 0),
      }))
    );
  };

  const handleApplyDcaPreset = (preset: '50_50' | '30_30_40' | '20_30_50') => {
    const prec = getPricePrecision(entryPrice);
    const dirMultiplier = tradeDirection === 'LONG' ? -1 : 1;
    if (preset === '50_50') {
      setDcaOrders([
        { id: '1', price: entryPrice, allocationPct: 50 },
        { id: '2', price: Number((entryPrice * (1 + dirMultiplier * 0.012)).toFixed(prec)), allocationPct: 50 },
      ]);
    } else if (preset === '30_30_40') {
      setDcaOrders([
        { id: '1', price: entryPrice, allocationPct: 30 },
        { id: '2', price: Number((entryPrice * (1 + dirMultiplier * 0.01)).toFixed(prec)), allocationPct: 30 },
        { id: '3', price: Number((entryPrice * (1 + dirMultiplier * 0.022)).toFixed(prec)), allocationPct: 40 },
      ]);
    } else if (preset === '20_30_50') {
      setDcaOrders([
        { id: '1', price: entryPrice, allocationPct: 20 },
        { id: '2', price: Number((entryPrice * (1 + dirMultiplier * 0.012)).toFixed(prec)), allocationPct: 30 },
        { id: '3', price: Number((entryPrice * (1 + dirMultiplier * 0.025)).toFixed(prec)), allocationPct: 50 },
      ]);
    }
  };

  const handleSelectStrategy = (stratId: EntryStrategyId) => {
    if (stratId === 'MANUAL') {
      setSelectedStrategyId('MANUAL');
      setStrategySetup(null);
      return;
    }

    const stratMeta = ENTRY_STRATEGIES.find((s) => s.id === stratId);
    if (!stratMeta) return;

    const effectivePrice = currentPrice || initialRiskPlan.currentPrice || entryPrice;
    const prec = getPricePrecision(effectivePrice);
    const setup = stratMeta.calculateSetup({
      currentPrice: effectivePrice,
      direction: tradeDirection,
      indicators,
      liquidationHeatmap,
      precision: prec,
    });

    setSelectedStrategyId(stratId);
    setStrategySetup(setup);
    setEntryPrice(setup.entryPrice);
    setStopLoss(setup.stopLoss);
    setTp1(setup.tp1);
    setTp2(setup.tp2);
    setTp3(setup.tp3);
    if (stratMeta.recommendedRiskPct) {
      setRiskPct(stratMeta.recommendedRiskPct);
    }

    const dirMultiplier = tradeDirection === 'LONG' ? -1 : 1;
    setDcaOrders([
      { id: '1', price: setup.entryPrice, allocationPct: 50 },
      { id: '2', price: Number((setup.entryPrice * (1 + dirMultiplier * 0.012)).toFixed(prec)), allocationPct: 50 },
    ]);
    setTriggerPrice(
      Number((setup.entryPrice * (tradeDirection === 'LONG' ? 1.005 : 0.995)).toFixed(prec))
    );
  };

  // Synchronize when active symbol or analysis plan updates
  React.useEffect(() => {
    const dir = initialRiskPlan.takeProfit1 >= initialRiskPlan.entryPrice ? 'LONG' : 'SHORT';
    const prec = getPricePrecision(initialRiskPlan.entryPrice);
    setTradeDirection(dir);
    setEntryPrice(initialRiskPlan.entryPrice);
    setStopLoss(initialRiskPlan.stopLoss);
    setTp1(initialRiskPlan.takeProfit1);
    setTp2(initialRiskPlan.takeProfit2);
    setTp3(initialRiskPlan.takeProfit3);
    setSelectedStrategyId('MANUAL');
    setStrategySetup(null);
    setEntryMode('SINGLE');
    if (initialRiskPlan.recommendedLeverage) {
      setCustomLeverage(initialRiskPlan.recommendedLeverage);
    }

    const dirMultiplier = dir === 'LONG' ? -1 : 1;
    setDcaOrders([
      { id: '1', price: initialRiskPlan.entryPrice, allocationPct: 50 },
      { id: '2', price: Number((initialRiskPlan.entryPrice * (1 + dirMultiplier * 0.012)).toFixed(prec)), allocationPct: 50 },
    ]);
    setTriggerPrice(
      Number((initialRiskPlan.entryPrice * (dir === 'LONG' ? 1.005 : 0.995)).toFixed(prec))
    );
  }, [symbol, initialRiskPlan.entryPrice, initialRiskPlan.stopLoss, initialRiskPlan.takeProfit1]);

  const isLong = tradeDirection === 'LONG';
  const safeBalance = Math.max(1, balance || 1);
  const safeEntry = Math.max(0.00000001, effectiveEntryPrice || 1);

  // Function to automatically align SL and TP levels when switching LONG / SHORT
  const alignLevelsForDirection = (dir: 'LONG' | 'SHORT', basePrice: number) => {
    const slOffset = 0.02; // 2% SL
    const prec = getPricePrecision(basePrice);
    if (dir === 'LONG') {
      const newSl = Number((basePrice * (1 - slOffset)).toFixed(prec));
      const newTp1 = Number((basePrice * 1.025).toFixed(prec));
      const newTp2 = Number((basePrice * 1.05).toFixed(prec));
      const newTp3 = Number((basePrice * 1.08).toFixed(prec));
      setStopLoss(newSl);
      setTp1(newTp1);
      setTp2(newTp2);
      setTp3(newTp3);
    } else {
      const newSl = Number((basePrice * (1 + slOffset)).toFixed(prec));
      const newTp1 = Number((basePrice * 0.975).toFixed(prec));
      const newTp2 = Number((basePrice * 0.95).toFixed(prec));
      const newTp3 = Number((basePrice * 0.92).toFixed(prec));
      setStopLoss(newSl);
      setTp1(newTp1);
      setTp2(newTp2);
      setTp3(newTp3);
    }
  };

  const handleDirectionSwitch = (newDir: 'LONG' | 'SHORT') => {
    setTradeDirection(newDir);
    const effectivePrice = currentPrice || initialRiskPlan.currentPrice || entryPrice;
    const prec = getPricePrecision(effectivePrice);
    const dirMultiplier = newDir === 'LONG' ? -1 : 1;

    setDcaOrders([
      { id: '1', price: effectivePrice, allocationPct: 50 },
      { id: '2', price: Number((effectivePrice * (1 + dirMultiplier * 0.012)).toFixed(prec)), allocationPct: 50 },
    ]);
    setTriggerPrice(
      Number((effectivePrice * (newDir === 'LONG' ? 1.005 : 0.995)).toFixed(prec))
    );

    if (selectedStrategyId !== 'MANUAL') {
      const stratMeta = ENTRY_STRATEGIES.find((s) => s.id === selectedStrategyId);
      if (stratMeta) {
        const setup = stratMeta.calculateSetup({
          currentPrice: effectivePrice,
          direction: newDir,
          indicators,
          liquidationHeatmap,
          precision: prec,
        });
        setStrategySetup(setup);
        setEntryPrice(setup.entryPrice);
        setStopLoss(setup.stopLoss);
        setTp1(setup.tp1);
        setTp2(setup.tp2);
        setTp3(setup.tp3);
        return;
      }
    }
    // Auto-adjust if levels were oriented in opposite direction
    if (newDir === 'LONG' && tp1 <= entryPrice) {
      alignLevelsForDirection('LONG', entryPrice);
    } else if (newDir === 'SHORT' && tp1 >= entryPrice) {
      alignLevelsForDirection('SHORT', entryPrice);
    }
  };

  // Capital Risk calculation
  const rawCapitalRisk = (safeBalance * riskPct) / 100;
  const maxCapitalAtRisk = rawCapitalRisk < 0.1
    ? Number(rawCapitalRisk.toFixed(4))
    : Number(rawCapitalRisk.toFixed(2));

  // Distance to Stop Loss
  const stopDistance = Math.abs(effectiveEntryPrice - stopLoss);
  const stopLossPercent = (stopDistance / safeEntry) * 100;

  // Institutional Position Sizing formula: Position Size = Max Risk / SL%
  const calculatedPositionSizeUsd = Number(((maxCapitalAtRisk / ((stopLossPercent || 0.1) / 100))).toFixed(2));
  const positionSizeUsd = Math.max(1, calculatedPositionSizeUsd);

  // Position Units (e.g. BTC, ETH)
  const rawUnits = positionSizeUsd / safeEntry;
  const positionUnits = rawUnits < 0.0001
    ? rawUnits.toFixed(7)
    : rawUnits < 0.01
    ? rawUnits.toFixed(5)
    : rawUnits < 1
    ? rawUnits.toFixed(4)
    : rawUnits.toFixed(2);

  // Margin required for derivative contract
  const initialMarginRequired = Number((positionSizeUsd / customLeverage).toFixed(2));
  const maintenanceMarginRate = 0.005; // 0.5% standard MMR
  const maintenanceMarginRequired = Number((positionSizeUsd * maintenanceMarginRate).toFixed(2));

  // Derivative Liquidation Price Calculation (Standard Perpetual Contract Model)
  const rawLiqPrice = isLong
    ? effectiveEntryPrice * (1 - (1 / customLeverage) + maintenanceMarginRate)
    : effectiveEntryPrice * (1 + (1 / customLeverage) - maintenanceMarginRate);
  const liquidationPrice = Math.max(0, Number(rawLiqPrice.toFixed(getPricePrecision(effectiveEntryPrice))));

  const liqDistancePct = isLong
    ? ((effectiveEntryPrice - liquidationPrice) / safeEntry) * 100
    : ((liquidationPrice - effectiveEntryPrice) / safeEntry) * 100;

  // Directional validity checks (Critical UX Risk Signal)
  // For LONG: SL must be below entry, TP must be above entry.
  // For SHORT: SL must be above entry, TP must be below entry.
  const isSlDirectionValid = isLong ? stopLoss < effectiveEntryPrice : stopLoss > effectiveEntryPrice;
  const isTpDirectionValid = isLong
    ? (tp1 > effectiveEntryPrice && tp2 > effectiveEntryPrice && tp3 > effectiveEntryPrice)
    : (tp1 < effectiveEntryPrice && tp2 < effectiveEntryPrice && tp3 < effectiveEntryPrice);

  // Critical Safety Condition: Does the Stop Loss trigger BEFORE Liquidation?
  // Only valid if SL direction itself is valid.
  const isSlSafe = isSlDirectionValid && (isLong
    ? stopLoss > liquidationPrice
    : stopLoss < liquidationPrice);

  // Flash-wick extreme leverage alert: distance to liquidation <= 2.0% or leverage >= 50x
  const isFlashWickRisk = customLeverage >= 50 || (liqDistancePct > 0 && liqDistancePct <= 2.0);

  // Price movements and ROE% for TP Ladder and SL
  const tp1PriceMovePct = isLong
    ? ((tp1 - effectiveEntryPrice) / safeEntry) * 100
    : ((effectiveEntryPrice - tp1) / safeEntry) * 100;
  const tp2PriceMovePct = isLong
    ? ((tp2 - effectiveEntryPrice) / safeEntry) * 100
    : ((effectiveEntryPrice - tp2) / safeEntry) * 100;
  const tp3PriceMovePct = isLong
    ? ((tp3 - effectiveEntryPrice) / safeEntry) * 100
    : ((effectiveEntryPrice - tp3) / safeEntry) * 100;
  const slPriceMovePct = -stopLossPercent;

  // Leveraged Return on Equity (ROE) % = Price Move % * Leverage
  const tp1Roe = Number((tp1PriceMovePct * customLeverage).toFixed(1));
  const tp2Roe = Number((tp2PriceMovePct * customLeverage).toFixed(1));
  const tp3Roe = Number((tp3PriceMovePct * customLeverage).toFixed(1));
  const slRoe = Number((slPriceMovePct * customLeverage).toFixed(1));

  // Partial Take Profit breakdown: TP1 (40%), TP2 (30%), TP3 (30%)
  const tp1ProfitUsd = (positionSizeUsd * 0.4) * (tp1PriceMovePct / 100);
  const tp2ProfitUsd = (positionSizeUsd * 0.3) * (tp2PriceMovePct / 100);
  const tp3ProfitUsd = (positionSizeUsd * 0.3) * (tp3PriceMovePct / 100);
  const totalLadderProfit = Math.max(0, tp1ProfitUsd + tp2ProfitUsd + tp3ProfitUsd);

  // Risk-Reward Ratio
  const avgReward = (tp1 + tp2 + tp3) / 3;
  const rewardDistance = Math.abs(avgReward - effectiveEntryPrice);
  const currentRRR = Number((rewardDistance / (stopDistance || 0.0001)).toFixed(2));

  // Exchange Fees & Breakeven Price (0.05% Taker Open + 0.05% Taker Close = 0.10% Round-trip)
  const takerFeeRate = 0.0005;
  const totalExchangeFees = Number((positionSizeUsd * takerFeeRate * 2).toFixed(2));
  const breakevenPrice = isLong
    ? Number((effectiveEntryPrice * (1 + takerFeeRate * 2)).toFixed(getPricePrecision(effectiveEntryPrice)))
    : Number((effectiveEntryPrice * (1 - takerFeeRate * 2)).toFixed(getPricePrecision(effectiveEntryPrice)));

  // Estimated 8h Funding Fee
  const fundingFee8h = Number((positionSizeUsd * (Math.abs(fundingRatePct) / 100)).toFixed(2));

  // Leverage Risk Tier Classification
  const getLeverageTier = (lev: number) => {
    if (lev <= 5) return { label: lang === 'id' ? 'Konservatif (Aman)' : 'Conservative', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' };
    if (lev <= 15) return { label: lang === 'id' ? 'Moderat (Standar)' : 'Moderate', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/30' };
    if (lev <= 25) return { label: lang === 'id' ? 'Agresif (Tinggi)' : 'Aggressive', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' };
    return { label: lang === 'id' ? 'Ekstrem (Risiko Likuidasi Tinggi)' : 'Extreme Risk', color: 'text-rose-400', bg: 'bg-rose-500/15 border-rose-500/40' };
  };
  const leverageTier = getLeverageTier(customLeverage);

  // Format Copyable Order Ticket
  const handleCopyTicket = () => {
    const baseCoin = symbol.split('/')[0];

    let entryDetails = `Entry Price: $${formatCryptoPrice(effectiveEntryPrice)}`;
    if (entryMode === 'DCA_LADDER') {
      entryDetails = `Entry Mode : Scale-In / DCA Ladder (${dcaOrders.length} Tiers)
Weighted Avg: $${formatCryptoPrice(effectiveEntryPrice)}
${dcaOrders.map((o, i) => `  - Tier ${i + 1}: $${formatCryptoPrice(o.price)} (${o.allocationPct}% | $${((positionSizeUsd * (o.allocationPct / 100))).toFixed(2)})`).join('\n')}`;
    } else if (entryMode === 'BREAKOUT_TRIGGER') {
      entryDetails = `Entry Mode : Breakout / Trigger (${triggerOrderType})
Trigger Price: $${formatCryptoPrice(triggerPrice)} (Buffer: ${slippageBufferPct}%)
Effective Entry: $${formatCryptoPrice(effectiveEntryPrice)}`;
    }

    const ticketText = `=== [NEXUSTRADE DERIVATIVE ORDER TICKET] ===
Instrument : ${symbol} (Perpetual Futures)
Direction  : ${tradeDirection} (${isLong ? 'Beli Naik' : 'Jual Turun'})
Margin Mode: ${marginMode}
Leverage   : ${customLeverage}x
Position   : $${positionSizeUsd.toLocaleString()} (≈ ${positionUnits} ${baseCoin})
Initial Margin: $${initialMarginRequired.toLocaleString()} USDT
${entryDetails}
Stop Loss  : $${formatCryptoPrice(stopLoss)} (${slRoe}% ROE | -$${maxCapitalAtRisk})
Target TP1 : $${formatCryptoPrice(tp1)} (+${tp1Roe}% ROE | 40% Size)
Target TP2 : $${formatCryptoPrice(tp2)} (+${tp2Roe}% ROE | 30% Size)
Target TP3 : $${formatCryptoPrice(tp3)} (+${tp3Roe}% ROE | 30% Size)
Est. Liq   : $${formatCryptoPrice(liquidationPrice)} (${isSlSafe ? 'SL triggers before Liquidation' : 'DANGER: Liquidation before SL'})
Risk/Reward: ${currentRRR}:1 | Est. Total Profit: +$${totalLadderProfit.toFixed(2)}
Breakeven  : $${formatCryptoPrice(breakevenPrice)}
Generated  : ${new Date().toLocaleString()}`;

    navigator.clipboard.writeText(ticketText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className={`flex flex-col rounded-xl border p-4 sm:p-5 shadow-md transition-colors duration-200 ${
      isDark ? 'bg-[#0f172a] border-[#1e293b] text-white' : 'bg-white border-slate-200 text-slate-800'
    }`}>
      {/* Header */}
      <div className={`flex flex-wrap items-center justify-between gap-3 border-b pb-3 mb-4 transition-colors ${
        isDark ? 'border-[#1e293b]' : 'border-slate-100'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-500">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-sm sm:text-base font-bold font-display ${isDark ? 'text-white' : 'text-slate-800'}`}>
                {t.risk.title}
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-600 text-[10px] font-mono font-bold tracking-tight">
                <Coins className="w-3 h-3 text-emerald-500" />
                {t.risk.microBadge || 'Mulai dari $1'}
              </span>
            </div>
            <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.risk.subtitle}</p>
          </div>
        </div>

        {/* Dynamic Controls: Live Price Feed, RRR & Copy Order Ticket */}
        <div className="flex items-center gap-2">
          {currentPrice && currentPrice > 0 && (
            <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono text-xs ${
              isDark ? 'bg-[#0b0f19] border-emerald-500/30 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[10px] text-slate-400 font-semibold">{lang === 'id' ? 'Live:' : 'Live:'}</span>
              <span className="font-bold font-mono">${formatCryptoPrice(currentPrice)}</span>
            </div>
          )}

          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border font-mono text-xs font-bold shadow-xs transition-colors ${
            isDark ? 'bg-[#0b0f19] border-cyan-500/40 text-cyan-300' : 'bg-cyan-50 border-cyan-200 text-cyan-700'
          }`}>
            <span>{t.risk.rrrBadge}</span>
            <span className={`text-sm font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>{currentRRR}:1</span>
            <span className={`text-[10px] ${currentRRR >= 2 ? 'text-emerald-500' : 'text-amber-500'}`}>
              {currentRRR >= 2 ? t.risk.favorable : t.risk.suboptimal}
            </span>
          </div>

          <button
            type="button"
            onClick={handleCopyTicket}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition cursor-pointer ${
              isDark
                ? 'bg-[#0b0f19] hover:bg-slate-800 border-slate-700 hover:border-cyan-500 text-slate-200'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 shadow-xs'
            }`}
            title={t.risk.copyOrder}
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">{t.risk.orderCopied}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">{t.risk.copyOrder}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Derivative Control Bar: Direction (LONG vs SHORT) & Margin Mode */}
      <div className="p-3 bg-[#0b0f19] rounded-xl border border-cyan-500/20 mb-4 flex flex-wrap items-center justify-between gap-3">
        {/* Direction Switch: LONG or SHORT */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-semibold text-slate-400">
            {t.risk.tradeMode}:
          </span>
          <div className="flex items-center p-1 bg-[#090d16] rounded-lg border border-[#1e293b]">
            <button
              type="button"
              onClick={() => handleDirectionSwitch('LONG')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                isLong
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{t.risk.long}</span>
            </button>

            <button
              type="button"
              onClick={() => handleDirectionSwitch('SHORT')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                !isLong
                  ? 'bg-rose-500 text-slate-950 shadow-md shadow-rose-500/30'
                  : 'text-slate-400 hover:text-rose-400'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span>{t.risk.short}</span>
            </button>
          </div>
        </div>

        {/* Margin Mode & Auto-Align Helper */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#090d16] p-1 rounded-lg border border-[#1e293b] text-xs font-mono">
            <button
              type="button"
              onClick={() => setMarginMode('ISOLATED')}
              className={`px-2.5 py-1 rounded transition cursor-pointer ${
                marginMode === 'ISOLATED'
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.risk.isolated}
            </button>
            <button
              type="button"
              onClick={() => setMarginMode('CROSS')}
              className={`px-2.5 py-1 rounded transition cursor-pointer ${
                marginMode === 'CROSS'
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.risk.cross}
            </button>
          </div>

          <button
            type="button"
            onClick={() => alignLevelsForDirection(tradeDirection, entryPrice)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-[#090d16] hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 text-slate-300 text-xs font-mono rounded-lg transition cursor-pointer"
            title={t.risk.autoAlign}
          >
            <RotateCcw className="w-3 h-3 text-cyan-400" />
            <span className="hidden md:inline">{t.risk.autoAlign}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TACTICAL ENTRY STRATEGY PLAYBOOK (SMC, Trend Following, Breakout/Range)  */}
      {/* ========================================================================= */}
      <div className={`p-4 rounded-xl border mb-6 transition-colors ${
        isDark ? 'bg-[#0b0f19] border-[#1e293b]' : 'bg-slate-50/80 border-slate-200'
      }`}>
        {/* Playbook Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Crosshair className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className={`text-xs sm:text-sm font-bold font-mono uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  {t.risk.entryStrategyTitle}
                </h4>
                {selectedStrategyId !== 'MANUAL' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 text-[10px] font-mono font-bold">
                    <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                    {t.risk.autoPopulatedBadge}
                  </span>
                )}
              </div>
              <p className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {t.risk.entryStrategySubtitle}
              </p>
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center flex-wrap gap-1 p-1 bg-[#090d16] rounded-lg border border-[#1e293b] text-[11px] font-mono">
            <button
              type="button"
              onClick={() => setStrategyCategoryFilter('ALL')}
              className={`px-2 py-1 rounded transition cursor-pointer ${
                strategyCategoryFilter === 'ALL'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {lang === 'id' ? 'Semua' : 'All'}
            </button>
            <button
              type="button"
              onClick={() => setStrategyCategoryFilter('SMC_ICT')}
              className={`px-2 py-1 rounded transition cursor-pointer ${
                strategyCategoryFilter === 'SMC_ICT'
                  ? 'bg-purple-500 text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.risk.catSmcIct}
            </button>
            <button
              type="button"
              onClick={() => setStrategyCategoryFilter('TREND_MOMENTUM')}
              className={`px-2 py-1 rounded transition cursor-pointer ${
                strategyCategoryFilter === 'TREND_MOMENTUM'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.risk.catTrend}
            </button>
            <button
              type="button"
              onClick={() => setStrategyCategoryFilter('BREAKOUT_RANGE')}
              className={`px-2 py-1 rounded transition cursor-pointer ${
                strategyCategoryFilter === 'BREAKOUT_RANGE'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.risk.catRange}
            </button>
          </div>
        </div>

        {/* Strategy Selection Pills Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
          {/* Manual Input Mode Pill */}
          <button
            type="button"
            onClick={() => handleSelectStrategy('MANUAL')}
            className={`p-2.5 rounded-lg border text-left transition cursor-pointer flex flex-col justify-between gap-1.5 ${
              selectedStrategyId === 'MANUAL'
                ? 'bg-[#090d16] border-cyan-400 shadow-md ring-1 ring-cyan-400/50'
                : isDark
                ? 'bg-[#090d16]/70 border-[#1e293b] hover:border-slate-600'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between gap-1">
              <span className={`text-xs font-mono font-bold ${
                selectedStrategyId === 'MANUAL' ? 'text-cyan-300' : isDark ? 'text-slate-300' : 'text-slate-700'
              }`}>
                {t.risk.strategyManual}
              </span>
              {selectedStrategyId === 'MANUAL' && (
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {t.risk.strategyActive}
                </span>
              )}
            </div>
            <p className={`text-[10px] font-mono line-clamp-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {lang === 'id' ? 'Input harga Entry, SL, dan TP secara manual tanpa preset pola institusional.' : 'Custom manual entry without automated institutional patterns.'}
            </p>
          </button>

          {/* Strategy Preset Cards */}
          {ENTRY_STRATEGIES
            .filter((strat) => strategyCategoryFilter === 'ALL' || strat.category === strategyCategoryFilter)
            .map((strat) => {
              const isSelected = selectedStrategyId === strat.id;
              const categoryColor =
                strat.category === 'SMC_ICT'
                  ? 'text-purple-400 bg-purple-500/10 border-purple-500/30'
                  : strat.category === 'TREND_MOMENTUM'
                  ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
                  : 'text-amber-400 bg-amber-500/10 border-amber-500/30';

              return (
                <button
                  key={strat.id}
                  type="button"
                  onClick={() => handleSelectStrategy(strat.id)}
                  className={`p-2.5 rounded-lg border text-left transition cursor-pointer flex flex-col justify-between gap-1.5 ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-400 shadow-md ring-1 ring-cyan-400/60'
                      : isDark
                      ? 'bg-[#090d16]/70 border-[#1e293b] hover:border-slate-600 hover:bg-[#090d16]'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className={`text-xs font-mono font-bold line-clamp-1 ${
                      isSelected ? 'text-cyan-300' : isDark ? 'text-slate-200' : 'text-slate-800'
                    }`}>
                      {strat.name[lang]}
                    </span>
                    {isSelected && (
                      <span className="shrink-0 text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-500 text-slate-950 font-bold">
                        {t.risk.strategyActive}
                      </span>
                    )}
                  </div>

                  <p className={`text-[10px] font-mono line-clamp-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {strat.description[lang]}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-[#1e293b]/60 text-[10px] font-mono">
                    <span className={`px-1.5 py-0.5 rounded border text-[9px] ${categoryColor}`}>
                      {strat.categoryLabel[lang]}
                    </span>
                    <span className="text-emerald-400 font-bold">
                      RRR {strat.typicalRrr}
                    </span>
                  </div>
                </button>
              );
            })}
        </div>

        {/* Tactical Strategy Execution Briefing (Visible when a strategy is active) */}
        {selectedStrategyId !== 'MANUAL' && strategySetup && (
          <div className={`p-3.5 rounded-lg border text-xs font-mono space-y-3 transition-all ${
            isDark ? 'bg-[#090d16] border-cyan-500/30' : 'bg-white border-cyan-200 shadow-xs'
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1e293b] pb-2">
              <div className="flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-bold text-cyan-300">
                  {ENTRY_STRATEGIES.find((s) => s.id === selectedStrategyId)?.name[lang]}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                  Skor Validitas: {strategySetup.confidenceScore}%
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400">
                  {lang === 'id' ? 'Arah:' : 'Direction:'} <strong className={isLong ? 'text-emerald-400' : 'text-rose-400'}>{tradeDirection}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => handleSelectStrategy('MANUAL')}
                  className="px-2 py-0.5 rounded border border-slate-700 hover:border-slate-500 text-[10px] text-slate-400 hover:text-white transition cursor-pointer"
                >
                  {t.risk.resetManualBtn}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Invalidation Rule & SL Rationale */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-slate-300 font-semibold text-[11px]">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t.risk.invalidationLogic}</span>
                </div>
                <div className={`p-2.5 rounded border ${isDark ? 'bg-[#0b0f19] border-[#1e293b]' : 'bg-slate-50 border-slate-200'}`}>
                  <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    {ENTRY_STRATEGIES.find((s) => s.id === selectedStrategyId)?.invalidationRationale[lang]}
                  </p>
                  <p className="text-[10px] text-cyan-400 mt-1 font-semibold">
                    Trigger Invalidation: {strategySetup.invalidationTrigger}
                  </p>
                </div>
              </div>

              {/* Execution Discipline Checklist */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-slate-300 font-semibold text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t.risk.disciplineChecklist}</span>
                </div>
                <div className={`p-2.5 rounded border space-y-1.5 ${isDark ? 'bg-[#0b0f19] border-[#1e293b]' : 'bg-slate-50 border-slate-200'}`}>
                  {strategySetup.checklistItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-[11px]">
                      <div className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] ${
                        item.passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                      }`}>
                        ✓
                      </div>
                      <span className={item.passed ? (isDark ? 'text-slate-200' : 'text-slate-800') : 'text-slate-500 line-through'}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                  <div className="pt-1 text-[10px] text-slate-400 italic">
                    {strategySetup.contextSummary}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Interactive Inputs */}
        <div className="space-y-4">
          {/* Account Capital - with numeric input, range slider from $1, and presets */}
          <div className="p-3 bg-[#0b0f19] rounded-lg border border-[#1e293b]">
            <div className="flex items-center justify-between gap-2 mb-2 font-mono">
              <label htmlFor="risk-account-balance-number" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-cyan-400" />
                <span>{t.risk.accountEquity}</span>
              </label>

              {/* Direct numeric input starting from $1 */}
              <div className="relative flex items-center">
                <span className="absolute left-2.5 text-xs font-mono text-cyan-400 font-bold">$</span>
                <input
                  id="risk-account-balance-number"
                  type="number"
                  min="1"
                  max="1000000"
                  step="any"
                  value={balance}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setBalance(isNaN(val) ? 1 : Math.max(1, val));
                  }}
                  className="w-32 pl-6 pr-2 py-1 bg-[#090d16] border border-cyan-500/50 rounded-md text-xs font-mono text-cyan-300 font-bold focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  aria-label="Account Equity in USD"
                />
              </div>
            </div>

            {/* Range Slider from $1 up to $10,000 */}
            <div className="space-y-1">
              <input
                id="risk-account-balance"
                type="range"
                min="1"
                max="10000"
                step="1"
                value={Math.min(balance, 10000)}
                onChange={(e) => setBalance(Math.max(1, parseFloat(e.target.value)))}
                aria-label="Account Equity Range Slider"
                className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>$1</span>
                <span>$500</span>
                <span>$1k</span>
                <span>$5k</span>
                <span>$10k+</span>
              </div>
            </div>

            {/* Quick Presets Starting from $1 */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2 border-t border-[#1e293b]/70">
              <span className="text-[10px] font-mono text-slate-400">{t.risk.presetsTitle || 'Preset'}:</span>
              {CAPITAL_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setBalance(preset)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all cursor-pointer ${
                    balance === preset
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm shadow-cyan-500/30 ring-1 ring-cyan-400'
                      : 'bg-[#0f172a] border border-[#1e293b] text-slate-300 hover:border-cyan-500/50 hover:text-white'
                  }`}
                >
                  ${preset >= 1000 ? `${preset / 1000}k` : preset}
                </button>
              ))}
            </div>
          </div>

          {/* Risk Percentage */}
          <div className="p-3 bg-[#0b0f19] rounded-lg border border-[#1e293b]">
            <div className="flex justify-between text-xs font-medium text-slate-300 mb-1.5 font-mono">
              <label htmlFor="risk-percentage-per-trade">{t.risk.riskPerTrade}</label>
              <span className="text-amber-400 font-bold">
                {riskPct}% (${maxCapitalAtRisk < 0.01 ? maxCapitalAtRisk.toFixed(4) : maxCapitalAtRisk.toLocaleString()})
              </span>
            </div>
            <input
              id="risk-percentage-per-trade"
              type="range"
              min="0.25"
              max="5"
              step="0.25"
              value={riskPct}
              onChange={(e) => setRiskPct(parseFloat(e.target.value))}
              aria-label="Risk Per Trade"
              className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            {/* Quick Risk Presets */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-1.5 border-t border-[#1e293b]/70">
              <span className="text-[10px] font-mono text-slate-400">Risk %:</span>
              {RISK_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setRiskPct(preset)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all cursor-pointer ${
                    riskPct === preset
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm shadow-amber-500/30'
                      : 'bg-[#0f172a] border border-[#1e293b] text-slate-300 hover:border-amber-500/50 hover:text-white'
                  }`}
                >
                  {preset}%
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Leverage Slider & Multipliers */}
          <div className="p-3 bg-[#0b0f19] rounded-lg border border-[#1e293b]">
            <div className="flex items-center justify-between text-xs font-mono mb-1.5">
              <div className="flex items-center gap-1.5 text-slate-300">
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>{t.risk.leverage}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${leverageTier.bg} ${leverageTier.color}`}>
                  {leverageTier.label}
                </span>
                <span className="text-amber-300 font-extrabold text-sm">
                  {customLeverage}x
                </span>
              </div>
            </div>

            <input
              id="risk-leverage-slider"
              type="range"
              min="1"
              max="100"
              step="1"
              value={customLeverage}
              onChange={(e) => setCustomLeverage(Math.max(1, parseInt(e.target.value) || 1))}
              aria-label="Leverage Multiplier"
              className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />

            {/* Quick Leverage Presets */}
            <div className="flex flex-wrap items-center gap-1 mt-2 pt-1.5 border-t border-[#1e293b]/70">
              <span className="text-[10px] font-mono text-slate-400">Lev:</span>
              {LEVERAGE_PRESETS.map((lev) => (
                <button
                  key={lev}
                  type="button"
                  onClick={() => setCustomLeverage(lev)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-all cursor-pointer ${
                    customLeverage === lev
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                      : 'bg-[#0f172a] border border-[#1e293b] text-slate-300 hover:text-white hover:border-amber-400'
                  }`}
                >
                  {lev}x
                </button>
              ))}
            </div>
          </div>

          {/* Trade Execution Entry & Stop Loss Section with Progressive Disclosure */}
          <div className="p-3 bg-[#0b0f19] rounded-xl border border-[#1e293b] space-y-3">
            {/* Header with Mode Switcher Minimalis (Segmented Pill) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-xs font-mono font-bold text-slate-200">
                  {t.risk.entryMode}
                </span>
              </div>

              {/* Segmented Pill Switcher */}
              <div
                role="tablist"
                aria-label={t.risk.entryMode}
                className="flex items-center p-0.5 bg-[#070a12] rounded-lg border border-[#1e293b] text-xs font-mono"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={entryMode === 'SINGLE'}
                  onClick={() => setEntryMode('SINGLE')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                    entryMode === 'SINGLE'
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t.risk.singleEntry}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={entryMode === 'DCA_LADDER'}
                  onClick={() => setEntryMode('DCA_LADDER')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                    entryMode === 'DCA_LADDER'
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-3 h-3" />
                  <span>{t.risk.dcaLadder}</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={entryMode === 'BREAKOUT_TRIGGER'}
                  onClick={() => setEntryMode('BREAKOUT_TRIGGER')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                    entryMode === 'BREAKOUT_TRIGGER'
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Zap className="w-3 h-3" />
                  <span>{t.risk.breakoutTrigger}</span>
                </button>
              </div>
            </div>

            {/* Mode 1: Single Entry (Default Clean View) */}
            {entryMode === 'SINGLE' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="risk-entry-price" className="block text-[11px] font-mono text-slate-400">
                      {t.risk.entryPrice}
                    </label>
                    {currentPrice && currentPrice > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          const prec = getPricePrecision(currentPrice);
                          const newPrice = Number(currentPrice.toFixed(prec));
                          setEntryPrice(newPrice);
                          alignLevelsForDirection(tradeDirection, newPrice);
                        }}
                        className="inline-flex items-center gap-1 text-[10px] font-mono text-cyan-400 hover:text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/50 px-1.5 py-0.5 rounded border border-cyan-500/30 transition cursor-pointer"
                        title={lang === 'id' ? 'Sinkronkan dengan harga live streaming saat ini' : 'Sync to current live market price'}
                      >
                        <Zap className="w-2.5 h-2.5 text-amber-400 fill-amber-400 animate-pulse" />
                        <span>{lang === 'id' ? 'Pakai Harga Live' : 'Use Live'} (${formatCryptoPrice(currentPrice)})</span>
                      </button>
                    )}
                  </div>
                  <input
                    id="risk-entry-price"
                    type="number"
                    step="any"
                    value={entryPrice}
                    onChange={(e) => setEntryPrice(parseFloat(e.target.value) || 0)}
                    aria-label="Entry Price in USD"
                    className="w-full px-3 py-1.5 bg-[#080d1a] border border-[#1e293b] rounded-lg text-sm font-mono text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label htmlFor="risk-stop-loss" className="block text-[11px] font-mono text-rose-400 mb-1">
                    {t.risk.stopLoss} [{slPriceMovePct.toFixed(2)}% | {slRoe}% ROE]
                    {!isSlDirectionValid && (
                      <span className="text-rose-400 font-bold ml-1.5 animate-pulse">
                        ({lang === 'id' ? 'Arah Salah!' : 'Invalid Direction!'})
                      </span>
                    )}
                  </label>
                  <input
                    id="risk-stop-loss"
                    type="number"
                    step="any"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(parseFloat(e.target.value) || 0)}
                    aria-label="Stop Loss in USD"
                    className={`w-full px-3 py-1.5 bg-[#080d1a] rounded-lg text-sm font-mono text-rose-300 focus:outline-none focus:ring-1 transition-all ${
                      !isSlDirectionValid
                        ? 'border-2 border-rose-500 ring-2 ring-rose-500/30 focus:ring-rose-500 bg-rose-950/20'
                        : 'border border-rose-500/40 focus:ring-rose-500'
                    }`}
                  />
                </div>
              </div>
            )}

            {/* Mode 2: Scale-In / DCA Ladder (Flexible Tiers with Instant Avg Entry) */}
            {entryMode === 'DCA_LADDER' && (
              <div className="space-y-2.5 pt-0.5">
                {/* Avg Entry & Allocation Banner */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-cyan-950/30 border border-cyan-500/40 font-mono">
                  <div className="flex items-center gap-2">
                    <div>
                      <span className="text-[10px] text-cyan-300 uppercase tracking-wider block font-bold">
                        {t.risk.avgEntryPrice}
                      </span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-base font-black text-cyan-200">
                          ${formatCryptoPrice(avgDcaEntry)}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          ({dcaOrders.length} {lang === 'id' ? 'Tingkat' : 'Tiers'})
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        totalDcaAllocation === 100
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {t.risk.dcaAllocationTotal}: {totalDcaAllocation}%
                    </span>
                    {totalDcaAllocation !== 100 && (
                      <button
                        type="button"
                        onClick={handleNormalizeDcaAlloc}
                        className="text-[10px] text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                        title={t.risk.normalizeAllocation}
                      >
                        {t.risk.normalizeAllocation}
                      </button>
                    )}
                  </div>
                </div>

                {/* DCA Presets Bar */}
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-0.5">
                  <span className="text-[10px]">{t.risk.dcaPresets}:</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleApplyDcaPreset('50_50')}
                      className="px-1.5 py-0.5 rounded bg-[#0f172a] border border-[#1e293b] text-slate-300 hover:text-white hover:border-cyan-400 transition cursor-pointer text-[10px]"
                    >
                      50 / 50
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyDcaPreset('30_30_40')}
                      className="px-1.5 py-0.5 rounded bg-[#0f172a] border border-[#1e293b] text-slate-300 hover:text-white hover:border-cyan-400 transition cursor-pointer text-[10px]"
                    >
                      30 / 30 / 40
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyDcaPreset('20_30_50')}
                      className="px-1.5 py-0.5 rounded bg-[#0f172a] border border-[#1e293b] text-slate-300 hover:text-white hover:border-cyan-400 transition cursor-pointer text-[10px]"
                    >
                      20 / 30 / 50
                    </button>
                  </div>
                </div>

                {/* Sub-rows for each DCA order tier */}
                <div className="space-y-1.5">
                  {dcaOrders.map((order, idx) => {
                    const tierUsd = (positionSizeUsd * (order.allocationPct / 100)).toFixed(0);
                    return (
                      <div
                        key={order.id}
                        className="flex items-center gap-2 p-2 rounded-lg bg-[#070b14] border border-[#1e293b] text-xs font-mono"
                      >
                        <div className="w-16 shrink-0">
                          <span className="text-[11px] font-bold text-slate-300 block leading-none">
                            Entry {idx + 1}
                          </span>
                          <span className="text-[9px] text-slate-500 font-mono mt-0.5 block">
                            ${tierUsd}
                          </span>
                        </div>

                        {/* Price Input */}
                        <div className="flex-1 min-w-0">
                          <input
                            type="number"
                            step="any"
                            value={order.price}
                            onChange={(e) => handleUpdateDcaPrice(order.id, parseFloat(e.target.value) || 0)}
                            aria-label={`Entry ${idx + 1} Price`}
                            className="w-full px-2.5 py-1 bg-[#090e1a] border border-[#1e293b] rounded text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                          />
                        </div>

                        {/* Allocation % Input */}
                        <div className="w-20 shrink-0 flex items-center gap-1">
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={order.allocationPct}
                            onChange={(e) => handleUpdateDcaAlloc(order.id, parseFloat(e.target.value) || 0)}
                            aria-label={`Entry ${idx + 1} Allocation Percent`}
                            className="w-12 px-1 py-1 bg-[#090e1a] border border-[#1e293b] rounded text-xs font-mono text-cyan-300 text-center focus:outline-none focus:ring-1 focus:ring-cyan-500"
                          />
                          <span className="text-slate-400 text-[11px]">%</span>
                        </div>

                        {/* Remove Tier Button */}
                        {dcaOrders.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveDcaRow(order.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition cursor-pointer shrink-0"
                            title={t.risk.removeDcaTier}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Add Tier Action */}
                {dcaOrders.length < 4 && (
                  <button
                    type="button"
                    onClick={handleAddDcaRow}
                    className="w-full py-1.5 rounded-lg border border-dashed border-[#1e293b] hover:border-cyan-500/50 text-[11px] font-mono text-slate-400 hover:text-cyan-300 flex items-center justify-center gap-1.5 transition cursor-pointer bg-[#070b14]/50"
                  >
                    <Plus className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{t.risk.addDcaTier}</span>
                  </button>
                )}

                {/* Stop Loss Field Linked to Avg Entry */}
                <div className="pt-1.5 border-t border-[#1e293b]/70">
                  <label htmlFor="risk-stop-loss-dca" className="block text-[11px] font-mono text-rose-400 mb-1">
                    {t.risk.stopLoss} [{slPriceMovePct.toFixed(2)}% vs Avg Entry | {slRoe}% ROE]
                    {!isSlDirectionValid && (
                      <span className="text-rose-400 font-bold ml-1.5 animate-pulse">
                        ({lang === 'id' ? 'Arah Salah!' : 'Invalid Direction!'})
                      </span>
                    )}
                  </label>
                  <input
                    id="risk-stop-loss-dca"
                    type="number"
                    step="any"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(parseFloat(e.target.value) || 0)}
                    aria-label="Stop Loss in USD"
                    className={`w-full px-3 py-1.5 bg-[#080d1a] rounded-lg text-sm font-mono text-rose-300 focus:outline-none focus:ring-1 transition-all ${
                      !isSlDirectionValid
                        ? 'border-2 border-rose-500 ring-2 ring-rose-500/30 focus:ring-rose-500 bg-rose-950/20'
                        : 'border border-rose-500/40 focus:ring-rose-500'
                    }`}
                  />
                </div>
              </div>
            )}

            {/* Mode 3: Breakout / Trigger (Stop-Market / Stop-Limit Key Level Entry) */}
            {entryMode === 'BREAKOUT_TRIGGER' && (
              <div className="space-y-2.5 pt-0.5">
                {/* Order Execution Type Selector */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-[#070a12] border border-[#1e293b] text-xs font-mono">
                  <span className="text-slate-400 text-[11px]">{t.risk.triggerOrderType}:</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setTriggerOrderType('STOP_MARKET')}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer ${
                        triggerOrderType === 'STOP_MARKET'
                          ? 'bg-cyan-500 text-slate-950 font-bold'
                          : 'bg-[#0f172a] border border-[#1e293b] text-slate-400 hover:text-white'
                      }`}
                    >
                      {t.risk.stopMarket}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTriggerOrderType('STOP_LIMIT')}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer ${
                        triggerOrderType === 'STOP_LIMIT'
                          ? 'bg-cyan-500 text-slate-950 font-bold'
                          : 'bg-[#0f172a] border border-[#1e293b] text-slate-400 hover:text-white'
                      }`}
                    >
                      {t.risk.stopLimit}
                    </button>
                  </div>
                </div>

                {/* Trigger Inputs Grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label htmlFor="risk-trigger-price" className="block text-[11px] font-mono text-cyan-300 mb-1">
                      {t.risk.triggerPrice}
                    </label>
                    <input
                      id="risk-trigger-price"
                      type="number"
                      step="any"
                      value={triggerPrice}
                      onChange={(e) => setTriggerPrice(parseFloat(e.target.value) || 0)}
                      aria-label="Breakout Trigger Price in USD"
                      className="w-full px-3 py-1.5 bg-[#080d1a] border border-[#1e293b] rounded-lg text-sm font-mono text-cyan-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-bold"
                    />
                  </div>

                  <div>
                    <label htmlFor="risk-slippage-buffer" className="block text-[11px] font-mono text-slate-400 mb-1">
                      {t.risk.slippageBuffer} ({slippageBufferPct}%)
                    </label>
                    <input
                      id="risk-slippage-buffer"
                      type="number"
                      step="0.01"
                      min="0"
                      max="1.0"
                      value={slippageBufferPct}
                      onChange={(e) => setSlippageBufferPct(Math.max(0, parseFloat(e.target.value) || 0))}
                      aria-label="Slippage Buffer Percent"
                      className="w-full px-3 py-1.5 bg-[#080d1a] border border-[#1e293b] rounded-lg text-sm font-mono text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>
                </div>

                {/* Execution Estimate Banner */}
                <div className="p-2 rounded-lg bg-cyan-950/20 border border-cyan-500/30 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-1.5 text-cyan-300">
                    <Zap className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
                    <span className="text-[11px]">{t.risk.effectiveEstimatedEntry}:</span>
                  </div>
                  <span className="text-sm font-black text-cyan-200 font-mono">
                    ${formatCryptoPrice(effectiveEntryPrice)}
                  </span>
                </div>

                {/* Educational instruction for execution */}
                <p className="text-[10px] font-mono text-slate-400 leading-relaxed px-1">
                  💡 {t.risk.breakoutInstruction}
                </p>

                {/* Stop Loss Field Linked to Breakout Trigger */}
                <div className="pt-1.5 border-t border-[#1e293b]/70">
                  <label htmlFor="risk-stop-loss-breakout" className="block text-[11px] font-mono text-rose-400 mb-1">
                    {t.risk.stopLoss} [{slPriceMovePct.toFixed(2)}% vs Breakout | {slRoe}% ROE]
                    {!isSlDirectionValid && (
                      <span className="text-rose-400 font-bold ml-1.5 animate-pulse">
                        ({lang === 'id' ? 'Arah Salah!' : 'Invalid Direction!'})
                      </span>
                    )}
                  </label>
                  <input
                    id="risk-stop-loss-breakout"
                    type="number"
                    step="any"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(parseFloat(e.target.value) || 0)}
                    aria-label="Stop Loss in USD"
                    className={`w-full px-3 py-1.5 bg-[#080d1a] rounded-lg text-sm font-mono text-rose-300 focus:outline-none focus:ring-1 transition-all ${
                      !isSlDirectionValid
                        ? 'border-2 border-rose-500 ring-2 ring-rose-500/30 focus:ring-rose-500 bg-rose-950/20'
                        : 'border border-rose-500/40 focus:ring-rose-500'
                    }`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Targets TP1, TP2, TP3 with ROE tags */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label htmlFor="risk-tp1" className="block text-[10px] font-mono text-emerald-400 mb-1">
                {t.risk.tp1}
              </label>
              <input
                id="risk-tp1"
                type="number"
                step="any"
                value={tp1}
                onChange={(e) => setTp1(parseFloat(e.target.value) || 0)}
                aria-label="Take Profit 1 in USD"
                className={`w-full px-2 py-1 bg-[#0b0f19] rounded text-xs font-mono text-emerald-300 ${
                  !isTpDirectionValid ? 'border border-rose-500/60' : 'border border-emerald-500/30'
                }`}
              />
              <span className="block text-[9px] font-mono text-emerald-400 mt-0.5">
                +{tp1Roe}% ROE
              </span>
            </div>

            <div>
              <label htmlFor="risk-tp2" className="block text-[10px] font-mono text-emerald-400 mb-1">
                {t.risk.tp2}
              </label>
              <input
                id="risk-tp2"
                type="number"
                step="any"
                value={tp2}
                onChange={(e) => setTp2(parseFloat(e.target.value) || 0)}
                aria-label="Take Profit 2 in USD"
                className={`w-full px-2 py-1 bg-[#0b0f19] rounded text-xs font-mono text-emerald-300 ${
                  !isTpDirectionValid ? 'border border-rose-500/60' : 'border border-emerald-500/30'
                }`}
              />
              <span className="block text-[9px] font-mono text-emerald-400 mt-0.5">
                +{tp2Roe}% ROE
              </span>
            </div>

            <div>
              <label htmlFor="risk-tp3" className="block text-[10px] font-mono text-emerald-400 mb-1">
                {t.risk.tp3}
              </label>
              <input
                id="risk-tp3"
                type="number"
                step="any"
                value={tp3}
                onChange={(e) => setTp3(parseFloat(e.target.value) || 0)}
                aria-label="Take Profit 3 in USD"
                className={`w-full px-2 py-1 bg-[#0b0f19] rounded text-xs font-mono text-emerald-300 ${
                  !isTpDirectionValid ? 'border border-rose-500/60' : 'border border-emerald-500/30'
                }`}
              />
              <span className="block text-[9px] font-mono text-emerald-400 mt-0.5">
                +{tp3Roe}% ROE
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Execution Metrics, Liquidation Safety, & Derivative Supports */}
        <div className="flex flex-col justify-between space-y-4">
          {/* Bento Grid: 6 Core Derivative Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {/* 1. Notional Position Size */}
            <div className="p-2.5 bg-[#0b0f19] rounded-lg border border-[#1e293b]">
              <span className="block text-[10px] font-mono text-slate-400 uppercase">
                {t.risk.positionSize}
              </span>
              <span className="text-base font-bold font-mono text-white">
                ${positionSizeUsd.toLocaleString()}
              </span>
              <span className="block text-[10px] font-mono text-cyan-400 mt-0.5 truncate">
                ≈ {positionUnits} {symbol.split('/')[0]}
              </span>
            </div>

            {/* 2. Initial Margin Required */}
            <div className="p-2.5 bg-[#0b0f19] rounded-lg border border-[#1e293b]">
              <span className="block text-[10px] font-mono text-slate-400 uppercase">
                {t.risk.initialMargin}
              </span>
              <span className="text-base font-bold font-mono text-cyan-300">
                ${initialMarginRequired.toLocaleString()}
              </span>
              <span className="block text-[10px] font-mono text-slate-400 mt-0.5">
                MM: ${maintenanceMarginRequired}
              </span>
            </div>

            {/* 3. Estimated Liquidation Price */}
            <div className={`p-2.5 rounded-lg border ${isSlSafe ? 'bg-[#0b0f19] border-[#1e293b]' : 'bg-rose-950/20 border-rose-500/50'}`}>
              <span className="block text-[10px] font-mono text-slate-400 uppercase">
                {t.risk.estLiquidation}
              </span>
              <span className={`text-base font-bold font-mono ${isSlSafe ? 'text-amber-300' : 'text-rose-400'}`}>
                ${formatCryptoPrice(liquidationPrice)}
              </span>
              <span className="block text-[10px] font-mono text-slate-400 mt-0.5">
                Δ {liqDistancePct.toFixed(2)}%
              </span>
            </div>

            {/* 4. Capital at Risk */}
            <div className="p-2.5 bg-[#0b0f19] rounded-lg border border-[#1e293b]">
              <span className="block text-[10px] font-mono text-slate-400 uppercase">
                {t.risk.capitalAtRisk}
              </span>
              <span className="text-base font-bold font-mono text-rose-400">
                -${maxCapitalAtRisk < 0.01 ? maxCapitalAtRisk.toFixed(4) : maxCapitalAtRisk.toLocaleString()}
              </span>
              <span className="block text-[10px] font-mono text-slate-500 mt-0.5">
                {riskPct}% saldo | {slRoe}% ROE
              </span>
            </div>

            {/* 5. Expected Total Profit */}
            <div className="p-2.5 bg-[#0b0f19] rounded-lg border border-[#1e293b]">
              <span className="block text-[10px] font-mono text-slate-400 uppercase">
                {t.risk.expectedProfit}
              </span>
              <span className="text-base font-bold font-mono text-emerald-400">
                +${totalLadderProfit.toFixed(2)}
              </span>
              <span className="block text-[10px] font-mono text-emerald-500 mt-0.5">
                +{(totalLadderProfit / initialMarginRequired * 100).toFixed(1)}% ROE
              </span>
            </div>

            {/* 6. Breakeven Price & Fees */}
            <div className="p-2.5 bg-[#0b0f19] rounded-lg border border-[#1e293b]">
              <span className="block text-[10px] font-mono text-slate-400 uppercase">
                {t.risk.breakeven}
              </span>
              <span className="text-base font-bold font-mono text-slate-200">
                ${formatCryptoPrice(breakevenPrice)}
              </span>
              <span className="block text-[10px] font-mono text-slate-400 mt-0.5">
                Fee: ${totalExchangeFees}
              </span>
            </div>
          </div>

          {/* 1. Critical Directional Invalidation Warning (If SL is placed on wrong side of Entry) */}
          {!isSlDirectionValid && (
            <div className="p-2.5 rounded-lg border bg-rose-950/60 border-rose-500/70 text-rose-200 flex items-center gap-2.5 text-xs font-mono shadow-xs">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
              <div className="text-[11px] leading-tight">
                <span className="font-bold text-rose-300">
                  {isLong ? t.risk.slDirectionInvalidLong : t.risk.slDirectionInvalidShort}
                </span>
                <p className="text-rose-400 text-[10px] mt-0.5">
                  Entry: ${formatCryptoPrice(effectiveEntryPrice)} • Stop Loss: ${formatCryptoPrice(stopLoss)}
                </p>
              </div>
            </div>
          )}

          {/* 2. Take Profit Directional Warning */}
          {!isTpDirectionValid && (
            <div className="p-2.5 rounded-lg border bg-amber-950/40 border-amber-500/50 text-amber-200 flex items-center gap-2.5 text-xs font-mono">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="text-[11px] leading-tight">
                <span className="font-bold text-amber-300">
                  {isLong ? t.risk.tpDirectionInvalidLong : t.risk.tpDirectionInvalidShort}
                </span>
              </div>
            </div>
          )}

          {/* 3. Liquidation Safety Guard Check: SL vs Liquidation Price */}
          {isSlDirectionValid && (
            <div className={`p-2.5 rounded-lg border flex items-center gap-2.5 text-xs font-mono ${
              isSlSafe
                ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-950/40 border-rose-500/60 text-rose-300'
            }`}>
              {isSlSafe ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="text-[11px] leading-tight">
                    <span className="font-bold">{t.risk.slSafeNotice}</span>
                    <p className="text-slate-400 text-[10px] mt-0.5">
                      {isLong ? t.risk.slSafeDescLong : t.risk.slSafeDescShort} (SL: ${formatCryptoPrice(stopLoss)} vs Liq: ${formatCryptoPrice(liquidationPrice)})
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
                  <div className="text-[11px] leading-tight">
                    <span className="font-bold text-rose-300">{t.risk.slDangerNotice}</span>
                    <p className="text-rose-400 text-[10px] mt-0.5">
                      {t.risk.slDangerDesc} (Liq: ${formatCryptoPrice(liquidationPrice)} vs SL: ${formatCryptoPrice(stopLoss)})
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* 4. Flash-Wick High Leverage Proximity Warning */}
          {isFlashWickRisk && (
            <div className="p-2.5 rounded-lg border bg-amber-950/25 border-amber-500/40 text-amber-300 flex items-center gap-2.5 text-xs font-mono">
              <Zap className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
              <div className="text-[11px] leading-tight">
                <span className="font-bold text-amber-300">
                  {t.risk.flashWickRiskTitle} ({liqDistancePct.toFixed(2)}% buffer)
                </span>
                <p className="text-amber-400/90 text-[10px] mt-0.5">
                  {t.risk.flashWickRiskDesc}
                </p>
              </div>
            </div>
          )}

          {/* Derivative Partial TP Ladder Breakdown */}
          <div className="p-3 bg-[#0b0f19] rounded-lg border border-[#1e293b] space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>{t.risk.ladderBreakdown}</span>
              </span>
              <span className="text-cyan-400 text-[10px]">
                Target: {isLong ? 'Naik' : 'Turun'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
              <div className="p-1.5 rounded bg-[#090d16] border border-emerald-500/20">
                <div className="text-[10px] text-slate-400">TP1 (40% Size)</div>
                <div className="font-bold text-emerald-400">+${tp1ProfitUsd.toFixed(2)}</div>
                <div className="text-[9px] text-emerald-500">+{tp1Roe}% ROE</div>
              </div>
              <div className="p-1.5 rounded bg-[#090d16] border border-emerald-500/20">
                <div className="text-[10px] text-slate-400">TP2 (30% Size)</div>
                <div className="font-bold text-emerald-400">+${tp2ProfitUsd.toFixed(2)}</div>
                <div className="text-[9px] text-emerald-500">+{tp2Roe}% ROE</div>
              </div>
              <div className="p-1.5 rounded bg-[#090d16] border border-emerald-500/20">
                <div className="text-[10px] text-slate-400">TP3 (30% Size)</div>
                <div className="font-bold text-emerald-400">+${tp3ProfitUsd.toFixed(2)}</div>
                <div className="text-[9px] text-emerald-500">+{tp3Roe}% ROE</div>
              </div>
            </div>
          </div>

          {/* Exchange Fee & Funding Rate Information */}
          <div className="p-2.5 rounded-lg bg-cyan-950/20 border border-cyan-500/20 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-cyan-300">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                {t.risk.feeEst}: ${totalExchangeFees} (0.10%)
              </span>
            </div>
            <div className="flex items-center gap-1 text-slate-400 text-[10px]">
              <span>{t.risk.fundingEst}:</span>
              <span className="text-amber-300 font-bold">~${fundingFee8h}</span>
              <span>({isLong ? 'Long Bayar' : 'Short Terima'})</span>
            </div>
          </div>

          {/* Tail Risk Warning Banner */}
          <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-500/30 text-xs">
            <div className="flex items-center gap-1.5 text-rose-300 font-bold font-mono mb-1">
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>{t.risk.tailRiskTitle}</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              {initialRiskPlan.invalidationTrigger || t.risk.tailRiskDesc}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});
