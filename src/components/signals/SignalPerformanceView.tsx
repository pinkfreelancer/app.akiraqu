import React, { useState } from 'react';
import {
  CryptoTradingSignal,
} from '../../types/signal.types';
import {
  computeInstitutionalPerformance,
  SignalPerformanceMetrics,
} from './signalData';
import {
  Award,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
  Clock3,
  Percent,
  Layers,
  BarChart2,
  ShieldCheck,
  RotateCcw,
  Info,
  ExternalLink,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { formatCryptoPrice } from '../../utils/formatters';
import { Language } from '../../i18n/translations';

interface SignalPerformanceViewProps {
  signals: CryptoTradingSignal[];
  isDark: boolean;
  lang: Language;
  onInspectSignal?: (sig: CryptoTradingSignal) => void;
}

export const SignalPerformanceView: React.FC<SignalPerformanceViewProps> = ({
  signals,
  isDark,
  lang,
  onInspectSignal,
}) => {
  const isId = lang === 'id';
  const [filterModel, setFilterModel] = useState<string>('ALL');

  const filteredSignals =
    filterModel === 'ALL'
      ? signals
      : signals.filter((s) => (s.modelCategory || 'CLASSIC') === filterModel);

  // Compute exact metrics according to AKIRAQU formula
  const perf: SignalPerformanceMetrics = computeInstitutionalPerformance(filteredSignals);

  const closedSignals = filteredSignals.filter(
    (s) =>
      s.outcomeResult === 'WIN' ||
      s.outcomeResult === 'LOSS' ||
      s.outcomeResult === 'EXPIRED' ||
      s.lifecycleStatus === 'TAKEPROFIT' ||
      s.lifecycleStatus === 'STOPLOSS' ||
      s.lifecycleStatus === 'EXPIRED' ||
      s.status === 'SL_HIT' ||
      (s.status.includes('TP') && s.closedAt)
  );

  return (
    <div className="space-y-6 font-mono">
      {/* 1. Performance Overview Top Banner */}
      <div
        className={`p-6 rounded-2xl border space-y-4 ${
          isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  VERIFIKASI AUDIT RESMI
                </span>
                <span className="text-xs text-slate-400">AKIRAQU METRIC ENGINE</span>
              </div>
              <h1 className={`text-xl font-bold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {isId ? 'Kinerja Sinyal Kuantitatif' : 'Quantitative Signal Performance'}
              </h1>
            </div>
          </div>

          {/* Model Filter Pills */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 text-[11px] mr-1">Model:</span>
            {['ALL', 'ALPHA', 'GAMMA', 'CLASSIC', 'INV'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setFilterModel(m)}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  filterModel === m
                    ? 'bg-pink-600 text-white shadow-xs'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Formula Disclosure Bar */}
        <div className="p-3.5 rounded-xl bg-[#090d16] border border-slate-800/90 text-xs text-slate-300 space-y-1.5">
          <div className="flex items-center gap-2 text-pink-300 font-bold text-[11px]">
            <Info className="w-3.5 h-3.5" />
            <span>METODOLOGI PERHITUNGAN BAKU:</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Win Rate dihitung dari <strong>Kemenangan ÷ (Kemenangan + Kekalahan) × 100</strong> pada sinyal selesai (Win/Loss). Sinyal kedaluwarsa (Expired) dan sinyal yang sedang berjalan (In-Progress) <strong>dilaporkan secara terpisah</strong> di bawah untuk menjaga transparansi audit.
          </p>
        </div>
      </div>

      {/* 2. Core Primary Metrics Cards (Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Win Rate Card */}
        <div
          className={`p-5 rounded-2xl border space-y-2 ${
            isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Tingkat Keberhasilan</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
              WIN RATE
            </span>
          </div>
          <div className="text-3xl font-black text-emerald-400">{perf.winRate}%</div>
          <p className="text-[11px] text-slate-400">
            {perf.wins} Menang dari {perf.completedSignals} Sinyal Selesai
          </p>
        </div>

        {/* Total Completed P/L */}
        <div
          className={`p-5 rounded-2xl border space-y-2 ${
            isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total P/L Sinyal Selesai</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">
              CUMULATIVE P/L
            </span>
          </div>
          <div
            className={`text-3xl font-black ${
              perf.totalCompletedPnlPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {perf.totalCompletedPnlPct >= 0 ? '+' : ''}
            {perf.totalCompletedPnlPct}%
          </div>
          <p className="text-[11px] text-slate-400">
            Profit Factor: <strong className="text-white">{perf.profitFactor}x</strong> (Avg Win: +{perf.avgWinPnlPct}%)
          </p>
        </div>

        {/* In-Progress (Floating) Metrics */}
        <div
          className={`p-5 rounded-2xl border space-y-2 ${
            isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Sinyal Sedang Berjalan</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">
              IN-PROGRESS
            </span>
          </div>
          <div className="text-3xl font-black text-cyan-300">
            {perf.inProgressPnlPct >= 0 ? '+' : ''}
            {perf.inProgressPnlPct}%
          </div>
          <p className="text-[11px] text-slate-400">
            {perf.inProgressCount} Posisi Aktif / Trailing (Dilaporkan Terpisah)
          </p>
        </div>

        {/* Expired Signals (Separate Accounting) */}
        <div
          className={`p-5 rounded-2xl border space-y-2 ${
            isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Sinyal Kedaluwarsa</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-bold">
              EXPIRED (DIKECUALIKAN)
            </span>
          </div>
          <div className="text-3xl font-black text-slate-400">{perf.expiredCount}</div>
          <p className="text-[11px] text-slate-500">
            Melewati batas durasi tanpa menyentuh stop s1 / r1
          </p>
        </div>
      </div>

      {/* 3. Category & Timeframe Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Model Category Breakdown */}
        <div
          className={`p-5 rounded-2xl border space-y-3.5 ${
            isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
            <span className="font-bold text-sm text-white">Distribusi Kategori Model</span>
            <span className="text-[10px] text-slate-400">Alpha • Gamma • Classic • Inv</span>
          </div>

          <div className="space-y-2.5 text-xs">
            {Object.entries(perf.categoryBreakdown).map(([catKey, item]) => {
              return (
                <div
                  key={catKey}
                  className="p-3 rounded-xl bg-[#090d16] border border-slate-800/80 flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-pink-300">{catKey} MODEL</span>
                    <p className="text-[10px] text-slate-400">
                      {item.wins} Menang • {item.losses} Rugi (Total {item.total})
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-emerald-400">{item.winRate}% Win</span>
                    <span className="block text-[10px] text-slate-400">
                      P/L: {item.pnlPct >= 0 ? '+' : ''}{item.pnlPct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Timeframe Resolution Breakdown */}
        <div
          className={`p-5 rounded-2xl border space-y-3.5 ${
            isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
            <span className="font-bold text-sm text-white">Distribusi Kerangka Waktu</span>
            <span className="text-[10px] text-slate-400">1H hingga 1W</span>
          </div>

          <div className="space-y-2.5 text-xs">
            {Object.entries(perf.timeframeBreakdown).map(([tfKey, item]) => {
              return (
                <div
                  key={tfKey}
                  className="p-3 rounded-xl bg-[#090d16] border border-slate-800/80 flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-cyan-300">{tfKey} CANDLE</span>
                    <p className="text-[10px] text-slate-400">
                      {item.wins} Menang • {item.losses} Rugi
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-emerald-400">{item.winRate}% Win</span>
                    <span className="block text-[10px] text-slate-400">
                      P/L: {item.pnlPct >= 0 ? '+' : ''}{item.pnlPct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Audited Historical Closed Signals Log Table */}
      <div
        className={`p-5 rounded-2xl border space-y-4 ${
          isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-pink-400" />
            <span className="font-bold text-sm text-white">Log Audit Sinyal Selesai & Bersejarah</span>
          </div>
          <span className="text-xs text-slate-400">{closedSignals.length} Arsip Resmi</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#090d16] border-b border-slate-800 text-slate-400 text-[11px] uppercase">
              <tr>
                <th className="py-2.5 px-3">Sinyal / Aset</th>
                <th className="py-2.5 px-3">Model & TF</th>
                <th className="py-2.5 px-3">Entry & Exit</th>
                <th className="py-2.5 px-3">Hasil Audit</th>
                <th className="py-2.5 px-3 text-right">P/L Terealisasi</th>
                <th className="py-2.5 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 bg-[#090d16]/40">
              {closedSignals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 font-mono text-xs">
                    {isId
                      ? `Tidak ada riwayat sinyal selesai untuk model ${filterModel}. Sinyal aktif saat ini sedang berjalan (In-Progress).`
                      : `No completed historical signals found for model ${filterModel}. Active signals are currently in-progress.`}
                  </td>
                </tr>
              ) : (
                closedSignals.map((sig) => {
                const isWin =
                  sig.outcomeResult === 'WIN' ||
                  sig.lifecycleStatus === 'TAKEPROFIT' ||
                  (sig.status === 'TAKEPROFIT' || (sig.status.includes('TP') && sig.closedAt));
                const isLoss = sig.outcomeResult === 'LOSS' || sig.lifecycleStatus === 'STOPLOSS' || sig.status === 'SL_HIT';
                const isExp = sig.outcomeResult === 'EXPIRED' || sig.lifecycleStatus === 'EXPIRED';
                const pnl = sig.realizedPnlPct || sig.pnlPctCurrent || 0;

                return (
                  <tr key={sig.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-white">{sig.symbol}</div>
                      <div className="text-[10px] text-slate-500">{sig.direction} • {sig.exchange}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-pink-300 font-bold text-[10px]">
                        {sig.modelCategory || 'CLASSIC'}
                      </span>
                      <span className="ml-1 text-[10px] text-slate-400">{sig.resolution || sig.timeframe}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div>${formatCryptoPrice(sig.entryPrice)}</div>
                      <div className="text-[10px] text-slate-400">
                        Keluar: ${formatCryptoPrice(sig.exitPrice || sig.currentPrice)}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      {isWin ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 text-[10px]">
                          ✓ TAKEPROFIT (WIN)
                        </span>
                      ) : isLoss ? (
                        <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30 text-[10px]">
                          ✗ STOPLOSS (LOSS)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">
                          — EXPIRED
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span
                        className={`font-bold ${
                          pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {pnl >= 0 ? '+' : ''}
                        {pnl.toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {onInspectSignal && (
                        <button
                          type="button"
                          onClick={() => onInspectSignal(sig)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-pink-300 text-[10px] font-bold cursor-pointer"
                        >
                          Audit Detail
                        </button>
                      )}
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
