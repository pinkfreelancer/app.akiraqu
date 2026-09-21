import React, { useState } from 'react';
import { CryptoTradingSignal } from '../../types/signal.types';
import {
  LineChart,
  Target,
  Shield,
  Zap,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  BarChart3,
  Sliders,
  Check,
  AlertCircle,
  Clock,
  Layers,
} from 'lucide-react';
import { formatCryptoPrice } from '../../utils/formatters';
import { Language } from '../../i18n/translations';

interface SignalLiveAnalysisViewProps {
  selectedSignal: CryptoTradingSignal | null;
  allSignals: CryptoTradingSignal[];
  onSelectSignal: (sig: CryptoTradingSignal) => void;
  isDark: boolean;
  lang: Language;
  onNavigateToTrade?: (symbol: string) => void;
}

export const SignalLiveAnalysisView: React.FC<SignalLiveAnalysisViewProps> = ({
  selectedSignal,
  allSignals,
  onSelectSignal,
  isDark,
  lang,
  onNavigateToTrade,
}) => {
  const isId = lang === 'id';
  const signal = selectedSignal || allSignals[0];

  if (!signal) {
    return (
      <div className="p-12 text-center rounded-2xl border border-slate-800 bg-[#0f172a] font-mono text-slate-400">
        Tidak ada sinyal aktif untuk dianalisis.
      </div>
    );
  }

  const isLong = signal.direction === 'LONG';
  const cat = signal.modelCategory || 'CLASSIC';
  const levels = signal.priceLevels || {
    entry: signal.entryPrice,
    r1: signal.targetPrice1,
    r2: signal.targetPrice2,
    r3: signal.targetPrice3,
    r4: signal.targetPrice3 * 1.02,
    r5: signal.targetPrice3 * 1.04,
    r6: signal.targetPrice3 * 1.06,
    r7: signal.targetPrice3 * 1.08,
    r8: signal.targetPrice3 * 1.10,
    s1: signal.stopLoss,
    s2: signal.stopLoss * 0.98,
    s3: signal.stopLoss * 0.96,
    s4: signal.stopLoss * 0.94,
    trailingStop: signal.trailingStopPrice,
    isTrailingActive: signal.isTrailingActive,
  };

  const pnl = signal.realizedPnlPct || signal.pnlPctCurrent || 0;

  return (
    <div className="space-y-5 font-mono">
      {/* 1. Signal Selector Bar */}
      <div
        className={`p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
          isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex items-center gap-2">
          <LineChart className="w-4 h-4 text-pink-400" />
          <span className="text-xs font-bold text-white">Inspeksi Langsung Sinyal:</span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
          {allSignals.slice(0, 8).map((sig) => {
            const isSelected = sig.id === signal.id;
            return (
              <button
                key={sig.id}
                type="button"
                onClick={() => onSelectSignal(sig)}
                className={`px-2.5 py-1 rounded-xl font-bold transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-pink-600 text-white shadow-xs'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span>{sig.symbol}</span>
                <span className="text-[10px] opacity-75">{sig.direction}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Top Summary Overview Card */}
      <div
        className={`p-6 rounded-2xl border space-y-4 ${
          isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-2xl font-black flex items-center justify-center ${
                isLong
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}
            >
              {isLong ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownRight className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-white">{signal.symbol}</span>
                <span className="px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 font-bold text-xs">
                  {cat} MODEL
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold text-xs">
                  {signal.resolution || signal.timeframe}
                </span>
                {signal.strength === 'STRONG' && (
                  <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold text-xs flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    STRONG
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {signal.strategyName} • Dibuat: {signal.createdAt}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <div
              className={`px-3 py-1.5 rounded-xl font-bold text-sm ${
                pnl >= 0
                  ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-950/60 text-rose-400 border border-rose-500/30'
              }`}
            >
              {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}% P/L
            </div>
            {onNavigateToTrade && (
              <button
                type="button"
                onClick={() => onNavigateToTrade(signal.symbol)}
                className="px-3.5 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Trade Pair</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Deep Price Ladder & 8 Take-Profit Targets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Price Ladder (8 Take-Profits & 4 Support Stops) */}
        <div
          className={`p-5 rounded-2xl border space-y-3.5 lg:col-span-2 ${
            isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-sm text-white">Struktur Tangga Level Harga (r1–r8 & s1–s4)</span>
            </div>
            <span className="text-[10px] text-slate-400">Deterministic Price Ladder</span>
          </div>

          <div className="space-y-1.5 text-xs">
            {/* Take-Profit Levels (r8 down to r1) */}
            {[
              { key: 'r8', label: 'R8 Target Maksimal', mult: 8 },
              { key: 'r7', label: 'R7 Target Ekstensi 4', mult: 7 },
              { key: 'r6', label: 'R6 Target Ekstensi 3', mult: 6 },
              { key: 'r5', label: 'R5 Target Ekstensi 2', mult: 5 },
              { key: 'r4', label: 'R4 Target Ekstensi 1', mult: 4 },
              { key: 'r3', label: 'R3 Swing Target', mult: 3 },
              { key: 'r2', label: 'R2 Intraday Target', mult: 2 },
              { key: 'r1', label: 'R1 Target Pertama (Aktifkan Trailing)', mult: 1 },
            ].map(({ key, label, mult }) => {
              const targetVal = (levels as any)[key];
              const isHit = (signal.highestRReached || 0) >= mult;

              return (
                <div
                  key={key}
                  className={`p-2 rounded-lg border flex items-center justify-between transition ${
                    isHit
                      ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200 font-bold'
                      : 'bg-[#090d16] border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                        isHit ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {mult}
                    </span>
                    <span className="text-[11px]">{label}</span>
                  </div>
                  <div className="flex items-center gap-2 font-bold">
                    <span className="text-white">${formatCryptoPrice(targetVal)}</span>
                    {isHit && (
                      <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">
                        TERCAPAI ✓
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Entry Price Row */}
            <div className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-500/40 text-blue-200 font-bold flex items-center justify-between my-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-ping" />
                <span className="text-xs">HARGA ENTRY (Harga Acuan Sinyal)</span>
              </div>
              <span className="text-sm font-black text-white">${formatCryptoPrice(levels.entry)}</span>
            </div>

            {/* Support Stop Levels (s1 to s4) */}
            {[
              { key: 's1', label: 'S1 Stop Loss Utama (Batas Rugi)' },
              { key: 's2', label: 'S2 Support Sekunder' },
              { key: 's3', label: 'S3 Support Kritis' },
              { key: 's4', label: 'S4 Batas Likuidasi' },
            ].map(({ key, label }) => {
              const stopVal = (levels as any)[key];
              return (
                <div
                  key={key}
                  className="p-2 rounded-lg bg-rose-950/20 border border-rose-500/30 text-rose-300 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-rose-400" />
                    <span className="text-[11px]">{label}</span>
                  </div>
                  <span className="font-bold text-white">${formatCryptoPrice(stopVal)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Trailing Status, Confluence Matrix & Quantitative Risk */}
        <div className="space-y-4">
          {/* Trailing Stop Inspector */}
          <div
            className={`p-5 rounded-2xl border space-y-3 ${
              isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="font-bold text-xs text-white">Status Trailing Stop</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                  signal.isTrailingActive
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {signal.isTrailingActive ? 'AKTIF (PROFIT TERKUNCI)' : 'NON-AKTIF'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#090d16] border border-slate-800 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span>Batas Harga Trailing:</span>
                <span className="text-white font-bold">
                  {signal.trailingStopPrice ? `$${formatCryptoPrice(signal.trailingStopPrice)}` : 'N/A (Belum Sentuh R1)'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span>Profit Terkunci Minimum:</span>
                <span className="text-emerald-400 font-bold">
                  {signal.isTrailingActive ? `+${((signal.highestRReached || 1) * 1.5).toFixed(1)}%` : '0%'}
                </span>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Trailing stop aktif otomatis saat harga menyentuh target R1 atau lebih tinggi, mengamankan profit dan mencegah risiko berbalik menjadi kerugian.
            </p>
          </div>

          {/* 12-Indicator Confluence Matrix */}
          <div
            className={`p-5 rounded-2xl border space-y-3 ${
              isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="font-bold text-xs text-white">Matrix Konfluensi 12-Faktor</span>
              <span className="text-xs font-bold text-pink-400">{signal.confluenceScore}/100</span>
            </div>

            <div className="space-y-1.5 text-xs">
              {signal.indicatorsSummary.map((ind, i) => (
                <div
                  key={i}
                  className="p-2 rounded-lg bg-[#090d16] border border-slate-800/80 flex items-center gap-2 text-slate-300"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-[11px]">{ind}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
