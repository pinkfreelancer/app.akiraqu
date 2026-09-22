import React from 'react';
import {
  ConfluenceEvaluation,
  OHLCVCandle,
  SupportedExchange,
  MarketType,
  OpenPosition,
} from '../../types/crypto.types';
import { Language } from '../../i18n/translations';
import { formatCryptoPrice } from '../../utils/formatters';
import { GaugeChart } from '../GaugeChart';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Shield,
  Zap,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Layers,
  ChevronRight,
} from 'lucide-react';

interface LaunchpadSimpleViewProps {
  candles: OHLCVCandle[];
  symbol: string;
  timeframe: string;
  evaluation: ConfluenceEvaluation | null;
  currentPrice: number;
  selectedExchange?: SupportedExchange;
  selectedMarketType?: MarketType;
  onExecuteTrade?: (pos: OpenPosition) => void;
  onSwitchToProView: () => void;
  onTriggerAnalyze?: () => void;
  isLoading?: boolean;
  isDark?: boolean;
  lang?: Language;
}

export const LaunchpadSimpleView: React.FC<LaunchpadSimpleViewProps> = ({
  candles,
  symbol,
  timeframe,
  evaluation,
  currentPrice,
  selectedExchange = 'BINANCE',
  selectedMarketType = 'SPOT',
  onExecuteTrade,
  onSwitchToProView,
  onTriggerAnalyze,
  isLoading = false,
  isDark = true,
  lang = 'id',
}) => {
  const isId = lang === 'id';

  const riskPlan = evaluation?.riskPlan;
  const isBullish =
    evaluation?.marketBias === 'Strong Bullish' ||
    evaluation?.marketBias === 'Bullish' ||
    (evaluation?.confluenceScore || 0) >= 60;
  const isBearish =
    evaluation?.marketBias === 'Strong Bearish' ||
    evaluation?.marketBias === 'Bearish' ||
    (evaluation?.confluenceScore || 0) <= 40;

  const entryPrice = riskPlan?.entryPrice || currentPrice;
  const stopLoss = riskPlan?.stopLoss || (isBullish ? entryPrice * 0.985 : entryPrice * 1.015);
  const takeProfit1 = riskPlan?.takeProfit1 || (isBullish ? entryPrice * 1.03 : entryPrice * 0.97);
  const takeProfit2 = riskPlan?.takeProfit2 || (isBullish ? entryPrice * 1.06 : entryPrice * 0.94);
  const rrRatio = riskPlan?.riskRewardRatio || 2.0;

  const handleQuickBuy = () => {
    if (!onExecuteTrade) return;
    const size = 1000 / entryPrice;
    const newPos: OpenPosition = {
      id: `sim-${Date.now()}`,
      symbol,
      side: 'LONG',
      size,
      sizeUsd: 1000,
      entryPrice,
      markPrice: currentPrice,
      liquidationPrice: entryPrice * 0.9,
      margin: 100,
      leverage: 10,
      marginMode: 'ISOLATED',
      unrealizedPnl: 0,
      unrealizedPnlPct: 0,
      stopLoss,
      takeProfit: takeProfit1,
      exchange: selectedExchange,
      marketType: selectedMarketType,
      timestamp: Date.now(),
    };
    onExecuteTrade(newPos);
  };

  const handleQuickSell = () => {
    if (!onExecuteTrade) return;
    const size = 1000 / entryPrice;
    const newPos: OpenPosition = {
      id: `sim-${Date.now()}`,
      symbol,
      side: 'SHORT',
      size,
      sizeUsd: 1000,
      entryPrice,
      markPrice: currentPrice,
      liquidationPrice: entryPrice * 1.1,
      margin: 100,
      leverage: 10,
      marginMode: 'ISOLATED',
      unrealizedPnl: 0,
      unrealizedPnlPct: 0,
      stopLoss,
      takeProfit: takeProfit1,
      exchange: selectedExchange,
      marketType: selectedMarketType,
      timestamp: Date.now(),
    };
    onExecuteTrade(newPos);
  };

  return (
    <div className="w-full space-y-4 font-mono select-none">
      {/* 🌟 Summary Hero Card */}
      <div
        className={`p-5 rounded-2xl border transition-colors ${
          isDark
            ? 'bg-gradient-to-br from-[#0f172a] via-[#090d16] to-[#040711] border-[#1e293b]'
            : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          {/* Gauge & Score */}
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {evaluation ? (
              <div className="shrink-0 scale-90 sm:scale-100">
                <GaugeChart
                  score={evaluation.confluenceScore}
                  bias={evaluation.marketBias}
                  bullishCount={evaluation.bullishCount}
                  bearishCount={evaluation.bearishCount}
                  neutralCount={evaluation.neutralCount}
                  lang={lang}
                  theme={isDark ? 'dark' : 'light'}
                />
              </div>
            ) : (
              <div className="w-32 h-32 rounded-2xl border border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-500">
                <Zap className="w-8 h-8 animate-pulse text-cyan-400 mb-1" />
                <span className="text-[10px]">Perlu Pindai</span>
              </div>
            )}

            <div className="space-y-1.5 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="text-xl font-bold tracking-tight text-white">
                  {symbol}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {timeframe}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    isBullish
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : isBearish
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  }`}
                >
                  {evaluation?.marketBias || (isId ? 'NETRAL' : 'NEUTRAL')}
                </span>
              </div>

              <div className="text-2xl font-bold tracking-tight text-cyan-400">
                ${formatCryptoPrice(currentPrice)}
              </div>

              <p className={`text-xs max-w-md ${isDark ? 'text-slate-400' : 'text-slate-600'} leading-relaxed`}>
                {evaluation?.executiveNarrative ||
                  (isId
                    ? 'Mode Ringkas menyaring noise dan hanya menampilkan level harga kritis serta sinyal siap eksekusi.'
                    : 'Simple View filters out noise and highlights critical execution levels and consensus bias.')}
              </p>
            </div>
          </div>

          {/* Direct Actions & Switch to Pro */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 w-full sm:w-auto shrink-0">
            {onTriggerAnalyze && (
              <button
                onClick={onTriggerAnalyze}
                disabled={isLoading}
                className={`min-h-[44px] px-5 py-2.5 rounded-[2px] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs ${
                  isLoading
                    ? 'bg-pink-500/30 text-slate-400'
                    : 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white active:scale-95'
                }`}
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>{isLoading ? (isId ? 'Memindai...' : 'Scanning...') : isId ? 'Pindai Ulang [R]' : 'Re-Scan [R]'}</span>
              </button>
            )}

            <button
              onClick={onSwitchToProView}
              className={`min-h-[44px] px-4 py-2 rounded-[2px] text-xs font-bold border transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                isDark
                  ? 'bg-slate-900/80 border-slate-700 hover:border-cyan-500 text-slate-300 hover:text-white'
                  : 'bg-slate-100 border-slate-300 hover:border-cyan-600 text-slate-700 hover:text-slate-950'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isId ? 'Buka Mode Kuantitatif Pro' : 'Switch to Pro Quant View'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 🎯 3 Key Action Boxes: Entry, Stop Loss, Target TP */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Entry Zone */}
        <div
          className={`p-4 rounded-2xl border ${
            isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {isId ? 'Area Masuk (Entry)' : 'Optimal Entry Zone'}
            </span>
            <Target className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-cyan-300 tabular-nums">
            ${formatCryptoPrice(entryPrice)}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            {isId ? 'Sesuai konfluensi harga dan Fibonacci Golden Pocket' : 'Aligned with price action and Fib Pocket'}
          </p>
        </div>

        {/* Stop Loss & Risk Control */}
        <div
          className={`p-4 rounded-2xl border ${
            isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">
              {isId ? 'Batas Rugi (Stop Loss)' : 'Hard Stop Loss'}
            </span>
            <Shield className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl font-bold text-rose-400 tabular-nums">
            ${formatCryptoPrice(stopLoss)}
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
            <span>{isId ? 'Risiko Terukur' : 'Calculated Risk'}:</span>
            <span className="font-bold text-rose-400">
              {(((stopLoss - entryPrice) / entryPrice) * 100).toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Take Profit 1 & R:R */}
        <div
          className={`p-4 rounded-2xl border ${
            isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
              {isId ? 'Target Ambil Profit (TP1)' : 'Target Profit (TP1)'}
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400 tabular-nums">
            ${formatCryptoPrice(takeProfit1)}
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
            <span>Risk-to-Reward:</span>
            <span className="font-bold text-emerald-400">1 : {rrRatio.toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* ⚡ Quick Paper Trade Execution Buttons */}
      <div
        className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
          isDark ? 'bg-[#090d16] border-[#1e293b]' : 'bg-slate-50 border-slate-200'
        }`}
      >
        <div>
          <h4 className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
            {isId ? 'Eksekusi Simulasi Langsung (Paper Trade)' : 'Direct Simulation Execution'}
          </h4>
          <p className="text-[11px] text-slate-500">
            {isId
              ? 'Pasang order simulasi otomatis dengan level Stop Loss dan TP1 yang sudah dihitung.'
              : 'Execute auto-calculated position with predefined SL and TP1 levels.'}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleQuickBuy}
            className="flex-1 sm:flex-none min-h-[44px] px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <TrendingUp className="w-4 h-4" />
            <span>{isId ? 'Eksekusi LONG' : 'Execute LONG'}</span>
          </button>

          <button
            onClick={handleQuickSell}
            className="flex-1 sm:flex-none min-h-[44px] px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs transition-all shadow-md shadow-rose-500/20 active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <TrendingDown className="w-4 h-4" />
            <span>{isId ? 'Eksekusi SHORT' : 'Execute SHORT'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
