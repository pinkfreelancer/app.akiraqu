import React, { useState, useMemo } from 'react';
import {
  TradingBotConfig,
  BotStrategyType,
  MarketType,
  SupportedExchange,
} from '../types/crypto.types';
import { calculateGridLevels, calculateDcaSchedule } from '../services/terminalExtensionService';
import { formatCryptoPrice } from '../utils/formatters';
import {
  X,
  Bot,
  Grid,
  Zap,
  Layers,
  ArrowDownCircle,
  Repeat,
  Sparkles,
  Sliders,
  CheckCircle2,
  HelpCircle,
  Info,
} from 'lucide-react';
import { FormField } from './ui/FormField';

interface BotStrategyConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveBot: (bot: TradingBotConfig) => void;
  initialBot?: TradingBotConfig | null;
  currentSymbol: string;
  currentPrice: number;
  theme?: 'light' | 'dark';
}

export const BotStrategyConfigModal: React.FC<BotStrategyConfigModalProps> = ({
  isOpen,
  onClose,
  onSaveBot,
  initialBot,
  currentSymbol,
  currentPrice,
  theme = 'dark',
}) => {
  if (!isOpen) return null;

  const isDark = theme === 'dark';

  // Core configuration states
  const [strategyType, setStrategyType] = useState<BotStrategyType>(
    initialBot?.type || 'GRID_BOT'
  );
  const [botName, setBotName] = useState<string>(
    initialBot?.name || 'My High-Performance Strategy'
  );
  const [marketType, setMarketType] = useState<MarketType>(
    initialBot?.marketType || 'FUTURES'
  );
  const [exchange, setExchange] = useState<SupportedExchange>(
    initialBot?.exchange || 'BINANCE'
  );
  const [mode, setMode] = useState<'PAPER_SIMULATION' | 'EXCHANGE_API'>(
    initialBot?.mode === 'EXCHANGE_API' ? 'EXCHANGE_API' : 'PAPER_SIMULATION'
  );
  const [allocatedCapitalUsd, setAllocatedCapitalUsd] = useState<number>(
    initialBot?.allocatedCapitalUsd || 5000
  );
  const [leverage, setLeverage] = useState<number>(
    initialBot?.leverage || (marketType === 'SPOT' ? 1 : 3)
  );
  const [maxDailyLossPct, setMaxDailyLossPct] = useState<number>(
    initialBot?.maxDailyLossPct || 3.5
  );

  // 1. GRID BOT PARAMS
  const [gridType, setGridType] = useState<'ARITHMETIC' | 'GEOMETRIC'>(
    initialBot?.gridParams?.gridType || 'ARITHMETIC'
  );
  const [lowerPrice, setLowerPrice] = useState<number>(
    initialBot?.gridParams?.lowerPrice || Math.round(currentPrice * 0.92)
  );
  const [upperPrice, setUpperPrice] = useState<number>(
    initialBot?.gridParams?.upperPrice || Math.round(currentPrice * 1.08)
  );
  const [gridQuantity, setGridQuantity] = useState<number>(
    initialBot?.gridParams?.gridQuantity || 20
  );
  const [gridTrailingUp, setGridTrailingUp] = useState<boolean>(
    initialBot?.gridParams?.trailingUp ?? true
  );
  const [gridStopLoss, setGridStopLoss] = useState<number>(
    initialBot?.gridParams?.stopLossPrice || Math.round(currentPrice * 0.88)
  );

  // 2. QFL BOT PARAMS
  const [qflBasePrice, setQflBasePrice] = useState<number>(
    initialBot?.qflParams?.basePrice || Math.round(currentPrice * 1.015 * 100) / 100
  );
  const [qflCrackPct, setQflCrackPct] = useState<number>(
    initialBot?.qflParams?.crackPct || 3.5
  );
  const [qflReboundTargetPct, setQflReboundTargetPct] = useState<number>(
    initialBot?.qflParams?.reboundTargetPct || 4.2
  );
  const [qflStopLossPct, setQflStopLossPct] = useState<number>(
    initialBot?.qflParams?.stopLossPct || 3.0
  );
  const [qflVolumeSpike, setQflVolumeSpike] = useState<number>(
    initialBot?.qflParams?.minVolumeSpikeRatio || 2.0
  );

  // 3. DCA BOT PARAMS
  const [dcaBaseOrderUsd, setDcaBaseOrderUsd] = useState<number>(
    initialBot?.dcaParams?.baseOrderSizeUsd || 400
  );
  const [dcaSafetyOrderUsd, setDcaSafetyOrderUsd] = useState<number>(
    initialBot?.dcaParams?.safetyOrderSizeUsd || 600
  );
  const [dcaPriceDeviationPct, setDcaPriceDeviationPct] = useState<number>(
    initialBot?.dcaParams?.priceDeviationPct || 1.5
  );
  const [dcaMaxSafetyOrders, setDcaMaxSafetyOrders] = useState<number>(
    initialBot?.dcaParams?.maxSafetyOrders || 5
  );
  const [dcaVolumeMultiplier, setDcaVolumeMultiplier] = useState<number>(
    initialBot?.dcaParams?.volumeMultiplier || 1.3
  );
  const [dcaStepMultiplier, setDcaStepMultiplier] = useState<number>(
    initialBot?.dcaParams?.stepMultiplier || 1.2
  );
  const [dcaTargetTakeProfitPct, setDcaTargetTakeProfitPct] = useState<number>(
    initialBot?.dcaParams?.targetTakeProfitPct || 2.0
  );
  const [dcaTrailingTp, setDcaTrailingTp] = useState<number>(
    initialBot?.dcaParams?.trailingTakeProfitPct || 0.3
  );

  // 4. BTD BOT PARAMS
  const [btdDipTriggerPct, setBtdDipTriggerPct] = useState<number>(
    initialBot?.btdParams?.dipTriggerPct || 4.5
  );
  const [btdDipTimeframe, setBtdDipTimeframe] = useState<number>(
    initialBot?.btdParams?.dipTimeframeMinutes || 15
  );
  const [btdRsiMax, setBtdRsiMax] = useState<number>(
    initialBot?.btdParams?.rsiMaxThreshold || 25
  );
  const [btdTakeProfitPct, setBtdTakeProfitPct] = useState<number>(
    initialBot?.btdParams?.takeProfitPct || 5.0
  );

  // 5. LOOP BOT PARAMS
  const [loopDirection, setLoopDirection] = useState<'AUTO_TREND' | 'LONG_ONLY' | 'SHORT_ONLY' | 'REVERSE_ON_CLOSE'>(
    initialBot?.loopParams?.cycleDirection || 'AUTO_TREND'
  );
  const [loopProfitPerCyclePct, setLoopProfitPerCyclePct] = useState<number>(
    initialBot?.loopParams?.profitPerCyclePct || 1.25
  );
  const [loopCooldownSec, setLoopCooldownSec] = useState<number>(
    initialBot?.loopParams?.cycleCooldownSeconds || 30
  );
  const [loopAutoCompoundPct, setLoopAutoCompoundPct] = useState<number>(
    initialBot?.loopParams?.autoCompoundPct || 75
  );

  // 1-Click AI Auto Param Estimator
  const handleAutoEstimateParams = (type: BotStrategyType) => {
    if (type === 'GRID_BOT') {
      const low = Math.round(currentPrice * 0.9);
      const high = Math.round(currentPrice * 1.1);
      setLowerPrice(low);
      setUpperPrice(high);
      setGridQuantity(20);
      setGridStopLoss(Math.round(currentPrice * 0.85));
      setBotName(`AI Arithmetic Grid [${currentSymbol}]`);
    } else if (type === 'QFL_BOT') {
      const base = Math.round(currentPrice * 1.02 * 100) / 100;
      setQflBasePrice(base);
      setQflCrackPct(3.8);
      setQflReboundTargetPct(4.5);
      setQflStopLossPct(3.0);
      setBotName(`QFL Base Crack Hunter [${currentSymbol}]`);
    } else if (type === 'DCA_BOT') {
      const bo = Math.round(allocatedCapitalUsd * 0.1);
      const so = Math.round(allocatedCapitalUsd * 0.15);
      setDcaBaseOrderUsd(bo);
      setDcaSafetyOrderUsd(so);
      setDcaPriceDeviationPct(1.5);
      setDcaMaxSafetyOrders(5);
      setDcaVolumeMultiplier(1.3);
      setDcaStepMultiplier(1.2);
      setDcaTargetTakeProfitPct(2.2);
      setBotName(`Smart DCA Scalper [${currentSymbol}]`);
    } else if (type === 'BTD_BOT') {
      setBtdDipTriggerPct(4.5);
      setBtdDipTimeframe(15);
      setBtdRsiMax(25);
      setBtdTakeProfitPct(5.0);
      setBotName(`BTD Flash Crash Sniper [${currentSymbol}]`);
    } else if (type === 'LOOP_BOT') {
      setLoopProfitPerCyclePct(1.2);
      setLoopCooldownSec(30);
      setLoopAutoCompoundPct(75);
      setLoopDirection('AUTO_TREND');
      setBotName(`Infinite Loop Compounder [${currentSymbol}]`);
    }
  };

  const gridLevels = useMemo(() => {
    return calculateGridLevels(lowerPrice, upperPrice, gridQuantity, gridType, allocatedCapitalUsd);
  }, [lowerPrice, upperPrice, gridQuantity, gridType, allocatedCapitalUsd]);

  const gridEstimatedProfitPct = useMemo(() => {
    if (lowerPrice >= upperPrice || gridQuantity < 2) return 0;
    const spacing = ((upperPrice - lowerPrice) / lowerPrice / gridQuantity) * 100;
    const netProfit = Math.max(0.1, spacing - 0.08);
    return +netProfit.toFixed(2);
  }, [lowerPrice, upperPrice, gridQuantity]);

  const dcaSchedule = useMemo(() => {
    return calculateDcaSchedule(
      currentPrice,
      dcaBaseOrderUsd,
      dcaSafetyOrderUsd,
      dcaPriceDeviationPct,
      dcaMaxSafetyOrders,
      dcaVolumeMultiplier,
      dcaStepMultiplier
    );
  }, [
    currentPrice,
    dcaBaseOrderUsd,
    dcaSafetyOrderUsd,
    dcaPriceDeviationPct,
    dcaMaxSafetyOrders,
    dcaVolumeMultiplier,
    dcaStepMultiplier,
  ]);

  const handleSave = () => {
    const spacing = upperPrice > lowerPrice && gridQuantity > 0 ? +(((upperPrice - lowerPrice) / lowerPrice / gridQuantity) * 100).toFixed(2) : 1.0;

    const newBot: TradingBotConfig = {
      id: initialBot?.id || `bot-${Date.now()}`,
      name: botName,
      type: strategyType,
      exchange,
      marketType,
      mode,
      targetSymbols: [currentSymbol],
      allocatedCapitalUsd,
      riskPerTradePct: 2.5,
      minConfluenceScore: 75,
      minRiskRewardRatio: 2.0,
      leverage: marketType === 'SPOT' ? 1 : leverage,
      maxDailyLossPct,
      isActive: initialBot?.isActive ?? true,
      emergencyKillSwitch: false,
      gridParams:
        strategyType === 'GRID_BOT'
          ? {
              lowerPrice,
              upperPrice,
              gridQuantity,
              gridType,
              direction: 'NEUTRAL',
              trailingUp: gridTrailingUp,
              trailingDown: false,
              gridSpacingPct: spacing,
              stopLossPrice: gridStopLoss,
              profitPerGridPct: gridEstimatedProfitPct,
            }
          : undefined,
      qflParams:
        strategyType === 'QFL_BOT'
          ? {
              basePrice: qflBasePrice,
              crackPct: qflCrackPct,
              reboundTargetPct: qflReboundTargetPct,
              stopLossPct: qflStopLossPct,
              baseTimeframe: '1h',
              minVolumeSpikeRatio: qflVolumeSpike,
              layerCount: 2,
              maxHoldingHours: 48,
            }
          : undefined,
      dcaParams:
        strategyType === 'DCA_BOT'
          ? {
              baseOrderSizeUsd: dcaBaseOrderUsd,
              safetyOrderSizeUsd: dcaSafetyOrderUsd,
              priceDeviationPct: dcaPriceDeviationPct,
              maxSafetyOrders: dcaMaxSafetyOrders,
              volumeMultiplier: dcaVolumeMultiplier,
              stepMultiplier: dcaStepMultiplier,
              targetTakeProfitPct: dcaTargetTakeProfitPct,
              trailingTakeProfitPct: dcaTrailingTp,
            }
          : undefined,
      btdParams:
        strategyType === 'BTD_BOT'
          ? {
              dipTriggerPct: btdDipTriggerPct,
              dipTimeframeMinutes: btdDipTimeframe,
              rsiMaxThreshold: btdRsiMax,
              requireLiquidationSpike: true,
              minLiquidationUsd: 250000,
              ladderTranches: [
                { step: 1, dropPct: btdDipTriggerPct, allocationPct: 40 },
                { step: 2, dropPct: btdDipTriggerPct * 1.5, allocationPct: 60 },
              ],
              takeProfitPct: btdTakeProfitPct,
            }
          : undefined,
      loopParams:
        strategyType === 'LOOP_BOT'
          ? {
              profitPerCyclePct: loopProfitPerCyclePct,
              cycleCooldownSeconds: loopCooldownSec,
              autoCompoundPct: loopAutoCompoundPct,
              maxCycles: 0,
              cycleDirection: loopDirection,
              completedCycles: initialBot?.loopParams?.completedCycles || 0,
              cycleStopLossPct: maxDailyLossPct,
            }
          : undefined,
    };

    onSaveBot(newBot);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div
        className={`relative w-full max-w-4xl rounded-2xl border shadow-2xl my-8 overflow-hidden font-mono ${
          isDark ? 'bg-[#0b101f] border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
        }`}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-700 flex items-center justify-between bg-[#0f172a]">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Bot className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Konfigurasi Strategi Bot Spot &amp; Futures
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40 tabular-nums font-bold">
                  {currentSymbol} • ${formatCryptoPrice(currentPrice)}
                </span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Konfigurasi parameter kuantitatif dengan visualisasi kalkulasi matematis.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* 1. Strategy Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-cyan-400" />
                1. Pilih Tipe Strategi Bot (5 Model Utama):
              </label>
              <button
                onClick={() => handleAutoEstimateParams(strategyType)}
                className="flex items-center gap-1 text-xs font-bold text-emerald-300 hover:text-emerald-200 bg-emerald-950/80 px-3 py-1 rounded-lg border border-emerald-500/40 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Auto AI Parameters
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {[
                { type: 'GRID_BOT' as BotStrategyType, label: 'GRID Bot', desc: 'Scalping Range Jaring', icon: Grid },
                { type: 'QFL_BOT' as BotStrategyType, label: 'QFL Bot', desc: 'Base Crack Rebound', icon: Zap },
                { type: 'DCA_BOT' as BotStrategyType, label: 'DCA Bot', desc: 'Martingale Safety Order', icon: Layers },
                { type: 'BTD_BOT' as BotStrategyType, label: 'BTD Bot', desc: 'Flash Crash Dip Sniper', icon: ArrowDownCircle },
                { type: 'LOOP_BOT' as BotStrategyType, label: 'Loop Bot', desc: 'Continuous Compounding', icon: Repeat },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = strategyType === item.type;
                return (
                  <button
                    key={item.type}
                    onClick={() => {
                      setStrategyType(item.type);
                      handleAutoEstimateParams(item.type);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-cyan-950/60 border-cyan-400 shadow-md'
                        : 'bg-[#070b14] border-slate-700 hover:border-slate-600 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`p-1.5 rounded-lg ${isSelected ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-300'}`}>
                        <Icon className="w-4 h-4" />
                      </span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                    </div>
                    <div>
                      <div className={`font-bold text-xs ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                        {item.label}
                      </div>
                      <div className="text-[11px] text-slate-400 leading-tight mt-0.5">
                        {item.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Market & Exchange Architecture */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 p-4 rounded-xl bg-[#070b14] border border-slate-700 text-xs">
            <div>
              <label className="text-xs text-slate-300 uppercase font-bold block mb-1">
                Pasar Eksekusi:
              </label>
              <div className="flex items-center gap-1.5">
                {(['SPOT', 'FUTURES'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      setMarketType(m);
                      if (m === 'SPOT') setLeverage(1);
                    }}
                    className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                      marketType === m
                        ? m === 'SPOT'
                          ? 'bg-cyan-950 text-cyan-200 border border-cyan-500/50'
                          : 'bg-purple-950 text-purple-200 border border-purple-500/50'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {m === 'SPOT' ? 'SPOT' : 'FUTURES'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <FormField
                label={`Leverage (${marketType === 'SPOT' ? 'Terkunci 1x' : `${leverage}x`}):`}
              >
                <input
                  type="range"
                  min={1}
                  max={20}
                  step={1}
                  disabled={marketType === 'SPOT'}
                  aria-label={`Leverage: ${marketType === 'SPOT' ? '1x Spot' : `${leverage}x`}`}
                  aria-valuemin={1}
                  aria-valuemax={20}
                  aria-valuenow={marketType === 'SPOT' ? 1 : leverage}
                  value={marketType === 'SPOT' ? 1 : leverage}
                  onChange={(e) => setLeverage(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer disabled:opacity-30"
                />
              </FormField>
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>1x (Spot)</span>
                <span>5x</span>
                <span>10x</span>
                <span>20x</span>
              </div>
            </div>

            <div>
              <FormField label="Alokasi Modal (USD):">
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 text-xs font-bold" aria-hidden="true">$</span>
                  <input
                    type="number"
                    aria-label="Alokasi Modal dalam USD"
                    value={allocatedCapitalUsd}
                    onChange={(e) => setAllocatedCapitalUsd(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2 rounded-lg bg-[#0b101f] border border-slate-700 text-white font-bold text-xs focus:outline-none focus:border-cyan-500 tabular-nums"
                  />
                </div>
              </FormField>
            </div>
          </div>

          {/* 3. DYNAMIC STRATEGY CONFIGURATION VIEW */}

          {/* 3A. GRID BOT CONFIG */}
          {strategyType === 'GRID_BOT' && (
            <div className="p-4 rounded-xl border border-cyan-500/30 bg-[#0f172a] space-y-4">
              <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                <div className="flex items-center gap-2">
                  <Grid className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-white uppercase">
                    Parameter GRID Bot (Spot &amp; Futures)
                  </span>
                </div>
                <span className="text-xs text-cyan-300 font-bold">
                  Estimasi Profit/Grid: ~{gridEstimatedProfitPct}%
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <FormField
                  label="Batas Bawah Harga ($):"
                  hint={`-${(((currentPrice - lowerPrice) / currentPrice) * 100).toFixed(1)}% dari harga saat ini`}
                >
                  <input
                    type="number"
                    value={lowerPrice}
                    onChange={(e) => setLowerPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-[#070b14] border border-slate-700 text-emerald-400 font-bold text-xs tabular-nums"
                  />
                </FormField>

                <FormField
                  label="Batas Atas Harga ($):"
                  hint={`+${(((upperPrice - currentPrice) / currentPrice) * 100).toFixed(1)}% dari harga saat ini`}
                >
                  <input
                    type="number"
                    value={upperPrice}
                    onChange={(e) => setUpperPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-[#070b14] border border-slate-700 text-rose-400 font-bold text-xs tabular-nums"
                  />
                </FormField>

                <FormField
                  label="Jumlah Jaring (Grid Quantity):"
                  hint={`Modal/Grid: $${Math.round(allocatedCapitalUsd / gridQuantity)}`}
                >
                  <input
                    type="number"
                    min={2}
                    max={100}
                    value={gridQuantity}
                    onChange={(e) => setGridQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-[#070b14] border border-slate-700 text-cyan-300 font-bold text-xs tabular-nums"
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-700">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#070b14] border border-slate-700">
                  <span className="text-slate-200">Tipe Interval Grid:</span>
                  <div className="flex items-center gap-1.5">
                    {(['ARITHMETIC', 'GEOMETRIC'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setGridType(t)}
                        className={`px-3 py-1 rounded text-xs font-bold cursor-pointer ${
                          gridType === t ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#070b14] border border-slate-700">
                  <span className="text-slate-200">Trailing Grid Up:</span>
                  <button
                    onClick={() => setGridTrailingUp(!gridTrailingUp)}
                    className={`px-3 py-1 rounded text-xs font-bold cursor-pointer ${
                      gridTrailingUp
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {gridTrailingUp ? 'AKTIF (Trailing ATH)' : 'NONAKTIF'}
                  </button>
                </div>
              </div>

              {/* Grid Ladder Visualizer */}
              <div className="bg-[#070b14] p-3.5 rounded-lg border border-slate-700 text-xs">
                <span className="font-bold text-slate-300 block mb-2">
                  Pratinjau Level Order ({gridLevels.length} Level Grid):
                </span>
                <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                  {gridLevels.slice(0, 8).map((lvl) => (
                    <div
                      key={lvl.index}
                      className={`px-2.5 py-1.5 rounded-md text-center shrink-0 border ${
                        lvl.price < currentPrice
                          ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                          : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                      }`}
                    >
                      <div className="font-bold tabular-nums">${formatCryptoPrice(lvl.price)}</div>
                      <div className="text-[11px] text-slate-300 font-mono">{lvl.type} (${lvl.allocatedUsd})</div>
                    </div>
                  ))}
                  {gridLevels.length > 8 && (
                    <span className="text-slate-400 text-xs px-2 font-semibold">+ {gridLevels.length - 8} level</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 3B. QFL BOT CONFIG */}
          {strategyType === 'QFL_BOT' && (
            <div className="p-4 rounded-xl border border-amber-500/30 bg-[#0f172a] space-y-4">
              <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white uppercase">
                    Parameter QFL (Quick-Finger-Luc) Base Crack &amp; Rebound
                  </span>
                </div>
                <span className="text-xs text-amber-300 font-bold">
                  Target TP: +{qflReboundTargetPct}%
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <FormField label="Level Base Pivot ($):" hint="Support Terkonfirmasi">
                  <input
                    type="number"
                    value={qflBasePrice}
                    onChange={(e) => setQflBasePrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-[#070b14] border border-slate-700 text-amber-300 font-bold text-xs tabular-nums"
                  />
                </FormField>

                <FormField
                  label="Crack Threshold (%):"
                  hint={`Trigger: $${formatCryptoPrice(qflBasePrice * (1 - qflCrackPct / 100))}`}
                >
                  <input
                    type="number"
                    step={0.1}
                    value={qflCrackPct}
                    onChange={(e) => setQflCrackPct(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-[#070b14] border border-slate-700 text-rose-400 font-bold text-xs tabular-nums"
                  />
                </FormField>

                <FormField
                  label="Rebound Take Profit (%):"
                  hint={`Target Reversal +${qflReboundTargetPct}%`}
                >
                  <input
                    type="number"
                    step={0.1}
                    value={qflReboundTargetPct}
                    onChange={(e) => setQflReboundTargetPct(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-[#070b14] border border-slate-700 text-emerald-400 font-bold text-xs tabular-nums"
                  />
                </FormField>

                <FormField label="Volume Spike Ratio:" hint={`Min ${qflVolumeSpike}x Vol MA`}>
                  <input
                    type="number"
                    step={0.1}
                    value={qflVolumeSpike}
                    onChange={(e) => setQflVolumeSpike(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-[#070b14] border border-slate-700 text-white font-bold text-xs tabular-nums"
                  />
                </FormField>
              </div>
            </div>
          )}

          {/* 3C. DCA BOT CONFIG */}
          {strategyType === 'DCA_BOT' && (
            <div className="p-4 rounded-xl border border-emerald-500/30 bg-[#0f172a] space-y-4">
              <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white uppercase">
                    Parameter DCA &amp; Safety Order Martingale
                  </span>
                </div>
                <span className="text-xs text-emerald-300 font-bold">
                  Take Profit Basket: +{dcaTargetTakeProfitPct}%
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <FormField label="Base Order (BO $):" hint="Order Pertama">
                  <input
                    type="number"
                    value={dcaBaseOrderUsd}
                    onChange={(e) => setDcaBaseOrderUsd(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-[#070b14] border border-slate-700 text-white font-bold text-xs tabular-nums"
                  />
                </FormField>

                <FormField label="Safety Order (SO#1 $):" hint="Order Safety 1">
                  <input
                    type="number"
                    value={dcaSafetyOrderUsd}
                    onChange={(e) => setDcaSafetyOrderUsd(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-[#070b14] border border-slate-700 text-white font-bold text-xs tabular-nums"
                  />
                </FormField>

                <FormField label="Deviasi Harga SO#1 (%):" hint="Jarak Drop 1">
                  <input
                    type="number"
                    step={0.1}
                    value={dcaPriceDeviationPct}
                    onChange={(e) => setDcaPriceDeviationPct(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-[#070b14] border border-slate-700 text-cyan-300 font-bold text-xs tabular-nums"
                  />
                </FormField>

                <FormField label="Maks Safety Orders:" hint={`Maks ${dcaMaxSafetyOrders} Lapisan`}>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={dcaMaxSafetyOrders}
                    onChange={(e) => setDcaMaxSafetyOrders(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-[#070b14] border border-slate-700 text-white font-bold text-xs tabular-nums"
                  />
                </FormField>
              </div>

              {/* DCA Schedule Table Preview */}
              <div className="bg-[#070b14] p-3.5 rounded-lg border border-slate-700 text-xs">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-slate-300">
                    Jadwal Lapisan Safety Orders ({dcaSchedule.steps.length} Steps):
                  </span>
                  <span className="text-emerald-400 font-bold tabular-nums">
                    Total Modal: ${dcaSchedule.totalRequiredCapitalUsd}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                  {dcaSchedule.steps.map((s) => (
                    <div key={s.step} className="p-2 rounded bg-slate-900 border border-slate-800 text-center">
                      <div className="font-bold text-cyan-300">{s.label}</div>
                      <div className="text-white font-bold tabular-nums">${formatCryptoPrice(s.triggerPrice)}</div>
                      <div className="text-slate-300 text-[11px]">Size: ${s.orderSizeUsd}</div>
                      <div className="text-emerald-400 text-[11px]">Avg: ${formatCryptoPrice(s.avgEntryPrice)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 3D. BTD BOT CONFIG */}
          {strategyType === 'BTD_BOT' && (
            <div className="p-4 rounded-xl border border-purple-500/30 bg-[#0f172a] space-y-4">
              <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                <div className="flex items-center gap-2">
                  <ArrowDownCircle className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold text-white uppercase">
                    Parameter BTD (Buy The Dip) Flash Crash Sniper
                  </span>
                </div>
                <span className="text-xs text-purple-300 font-bold">
                  Dip Trigger: ≥ -{btdDipTriggerPct}% ({btdDipTimeframe}m)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <FormField label="Dip Velocity Drop (%):" hint="Minimal drop kilat">
                  <input
                    type="number"
                    step={0.1}
                    value={btdDipTriggerPct}
                    onChange={(e) => setBtdDipTriggerPct(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-[#070b14] border border-slate-700 text-rose-400 font-bold text-xs tabular-nums"
                  />
                </FormField>

                <FormField label="Jendela Waktu Drop:">
                  <select
                    value={btdDipTimeframe}
                    onChange={(e) => setBtdDipTimeframe(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-[#070b14] border border-slate-700 text-white font-bold text-xs cursor-pointer"
                  >
                    <option value={5}>5 Menit (Flash Crash)</option>
                    <option value={15}>15 Menit (Standar)</option>
                    <option value={60}>1 Jam (Macro Dump)</option>
                  </select>
                </FormField>

                <FormField label="Filter RSI Max:" hint={`RSI < ${btdRsiMax}`}>
                  <input
                    type="number"
                    value={btdRsiMax}
                    onChange={(e) => setBtdRsiMax(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-[#070b14] border border-slate-700 text-cyan-300 font-bold text-xs tabular-nums"
                  />
                </FormField>

                <FormField label="Rebound TP (%):" hint="Target Rebound">
                  <input
                    type="number"
                    step={0.1}
                    value={btdTakeProfitPct}
                    onChange={(e) => setBtdTakeProfitPct(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-[#070b14] border border-slate-700 text-emerald-400 font-bold text-xs tabular-nums"
                  />
                </FormField>
              </div>
            </div>
          )}

          {/* 3E. LOOP BOT CONFIG */}
          {strategyType === 'LOOP_BOT' && (
            <div className="p-4 rounded-xl border border-blue-500/30 bg-[#0f172a] space-y-4">
              <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                <div className="flex items-center gap-2">
                  <Repeat className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold text-white uppercase">
                    Parameter Loop Bot (Continuous Circular Scalper)
                  </span>
                </div>
                <span className="text-xs text-blue-300 font-bold">
                  Siklus Otomatis Berkelanjutan
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <FormField label="Arah Siklus:">
                  <select
                    value={loopDirection}
                    onChange={(e) => setLoopDirection(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-[#070b14] border border-slate-700 text-white font-bold text-xs cursor-pointer"
                  >
                    <option value="AUTO_TREND">Auto Trend Follow</option>
                    <option value="LONG_ONLY">Long Only</option>
                    <option value="SHORT_ONLY">Short Only</option>
                    <option value="REVERSE_ON_CLOSE">Flip Direction</option>
                  </select>
                </FormField>

                <FormField label="Target Profit/Siklus (%):">
                  <input
                    type="number"
                    step={0.05}
                    value={loopProfitPerCyclePct}
                    onChange={(e) => setLoopProfitPerCyclePct(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-[#070b14] border border-slate-700 text-emerald-400 font-bold text-xs tabular-nums"
                  />
                </FormField>

                <FormField label="Auto-Compound (%):">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={loopAutoCompoundPct}
                    onChange={(e) => setLoopAutoCompoundPct(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-[#070b14] border border-slate-700 text-cyan-300 font-bold text-xs tabular-nums"
                  />
                </FormField>

                <FormField label="Delay Re-Entry (Detik):">
                  <input
                    type="number"
                    value={loopCooldownSec}
                    onChange={(e) => setLoopCooldownSec(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-[#070b14] border border-slate-700 text-white font-bold text-xs tabular-nums"
                  />
                </FormField>
              </div>
            </div>
          )}

          {/* 4. Strategy Name & Safety Stop Limits */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-4 rounded-xl bg-[#070b14] border border-slate-700 text-xs">
            <FormField label="Nama Label Bot:">
              <input
                type="text"
                value={botName}
                onChange={(e) => setBotName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0b101f] border border-slate-700 text-white font-bold text-xs focus:outline-none focus:border-cyan-500"
              />
            </FormField>

            <FormField
              label="Emergency Daily Stop Loss (% Portofolio):"
              hint={`Auto-Halt bot jika rugi ${maxDailyLossPct}%`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step={0.5}
                  value={maxDailyLossPct}
                  onChange={(e) => setMaxDailyLossPct(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-[#0b101f] border border-slate-700 text-rose-400 font-bold text-xs focus:outline-none focus:border-rose-500 tabular-nums"
                />
                <span className="text-xs text-slate-300 shrink-0 font-medium" aria-hidden="true">Halt di {maxDailyLossPct}%</span>
              </div>
            </FormField>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-slate-700 bg-[#0f172a] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold transition-all cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            Simpan &amp; Aktifkan Bot
          </button>
        </div>
      </div>
    </div>
  );
};
