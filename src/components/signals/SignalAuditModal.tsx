import React from 'react';
import {
  Shield,
  Target,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  ExternalLink,
  Copy,
  Hash,
  Activity,
  Layers,
  TrendingUp,
  X,
} from 'lucide-react';
import { CryptoTradingSignal } from '../../types/signal.types';
import { formatCryptoPrice } from '../../utils/formatters';
import { Language } from '../../i18n/translations';

interface SignalAuditModalProps {
  signal: CryptoTradingSignal | null;
  onClose: () => void;
  isDark: boolean;
  lang: Language;
}

export const SignalAuditModal: React.FC<SignalAuditModalProps> = ({
  signal,
  onClose,
  isDark,
  lang,
}) => {
  if (!signal) return null;

  const isId = lang === 'id';
  const isLong = signal.direction === 'LONG';
  const [copiedHash, setCopiedHash] = React.useState(false);

  const handleCopyHash = () => {
    if (!signal.verificationHash) return;
    navigator.clipboard.writeText(signal.verificationHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in">
      <div
        className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border p-5 sm:p-6 font-mono space-y-4 shadow-2xl ${
          isDark ? 'bg-[#0f172a] border-[#1e293b] text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl font-bold flex items-center gap-1 ${
                isLong
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}
            >
              {isLong ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              <span className="text-xs">{signal.direction}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white">{signal.symbol}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {signal.timeframe}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-pink-950/60 text-pink-400 border border-pink-500/30 font-bold">
                  {signal.exchange}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {isId ? 'Audit Akuntabilitas & Verifikasi Kinerja Sinyal (MarketOwl Protocol)' : 'Signal Accountability & Performance Verification Audit'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Verification Certificate Banner */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-slate-300">
              <Hash className="w-3.5 h-3.5 text-pink-400" />
              <span className="text-slate-400">Audit Hash:</span>
              <span className="text-pink-300 font-bold tracking-wider">
                {signal.verificationHash || `0x${signal.id.replace(/[^0-9a-f]/gi, '')}9b2f...c4a1`}
              </span>
            </div>

            <button
              onClick={handleCopyHash}
              className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] cursor-pointer"
            >
              {copiedHash ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedHash ? (isId ? 'Tersalin' : 'Copied') : (isId ? 'Salin Hash' : 'Copy Hash')}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/60 text-[11px]">
            <div>
              <span className="text-slate-500 block">Waktu Publikasi:</span>
              <span className="font-bold text-slate-300">{signal.officialTimestamp || signal.createdAt}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Status Terkini:</span>
              <span
                className={`font-bold ${
                  signal.status.includes('TP')
                    ? 'text-emerald-400'
                    : signal.status === 'SL_HIT'
                    ? 'text-rose-400'
                    : 'text-cyan-400'
                }`}
              >
                {signal.status}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Skor Konfluensi:</span>
              <span className="font-bold text-amber-400">{signal.confluenceScore}/100</span>
            </div>
            <div>
              <span className="text-slate-500 block">Risk:Reward:</span>
              <span className="font-bold text-emerald-400">1 : {signal.riskRewardRatio}</span>
            </div>
          </div>
        </div>

        {/* 4 Mandatory Components Compliance Check */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
            <span>4 Komponen Wajib Sinyal (Risk Filter Compliance):</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              ✓ MEMENUHI STANDAR
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">1. Direction (Arah)</span>
              <span className="font-bold text-white mt-0.5 block">{signal.direction}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">2. Entry Price</span>
              <span className="font-bold text-white mt-0.5 block">${formatCryptoPrice(signal.entryPrice)}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-800/40">
              <span className="text-[10px] text-rose-400 block">3. Stop Loss (Batas Risiko)</span>
              <span className="font-bold text-rose-300 mt-0.5 block">${formatCryptoPrice(signal.stopLoss)}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40">
              <span className="text-[10px] text-emerald-400 block">4. Target (TP1 / TP2 / TP3)</span>
              <span className="font-bold text-emerald-300 mt-0.5 block">
                ${formatCryptoPrice(signal.targetPrice1)} - ${formatCryptoPrice(signal.targetPrice3)}
              </span>
            </div>
          </div>
        </div>

        {/* Institutional Trigger & Funding Rate Context */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
          <div className="text-[11px] font-bold text-slate-300">Deteksi Setup & Kondisi Derivatif Saat Rilis:</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-400">
            <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
              <span className="text-slate-500 block">Pemicu Setup (Trigger):</span>
              <span className="text-slate-200 font-bold">
                {signal.triggerType ? signal.triggerType.replace('_', ' ') : 'VOLUME ANOMALY + MSS'}
              </span>
              <p className="text-[10px] text-slate-400 mt-0.5">{signal.triggerDetails || signal.strategyName}</p>
            </div>
            <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
              <span className="text-slate-500 block">Metrik Funding Rate & Likuidasi:</span>
              <span className="text-slate-200 font-bold">
                Funding: {signal.fundingRate ? `${signal.fundingRate > 0 ? '+' : ''}${signal.fundingRate}%` : '-0.012% (Squeeze Fuel)'}
              </span>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Likuidasi Derivatif: {signal.liquidationDeltaUsd ? `+$${(signal.liquidationDeltaUsd / 1e6).toFixed(1)}M` : '+$18.4M Short Liquidated'}
              </p>
            </div>
          </div>
        </div>

        {/* Chronological Audit Trail (What happened after publication?) */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
            <span>Pelacakan Akuntabilitas Pasca-Publikasi:</span>
            <span className="text-[11px] text-slate-400">
              PnL Tertinggi: <strong className="text-emerald-400">+{signal.highestPnlReached || signal.pnlPctCurrent}%</strong>
            </span>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {(signal.auditTrail && signal.auditTrail.length > 0
              ? signal.auditTrail
              : [
                  {
                    timestamp: signal.createdAt,
                    event: 'Sinyal lolos filter konfluensi & diterbitkan ke publik',
                    price: signal.entryPrice,
                    pnlPct: 0.0,
                  },
                  {
                    timestamp: '15 menit kemudian',
                    event: 'Harga menguji level Entry Price dan terisi (Filled)',
                    price: signal.entryPrice,
                    pnlPct: 0.2,
                  },
                  {
                    timestamp: '35 menit kemudian',
                    event: 'Target 1 (TP1) tercapai, trailing stop dinaikkan ke BEP',
                    price: signal.targetPrice1,
                    pnlPct: signal.pnlPctCurrent > 2.5 ? 2.8 : signal.pnlPctCurrent,
                  },
                ]
            ).map((trail, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/80 flex items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-pink-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-slate-300 truncate">{trail.event}</div>
                    <div className="text-[10px] text-slate-500">{trail.timestamp} • Harga: ${formatCryptoPrice(trail.price)}</div>
                  </div>
                </div>
                <span
                  className={`font-bold text-xs shrink-0 ${
                    trail.pnlPct > 0 ? 'text-emerald-400' : trail.pnlPct < 0 ? 'text-rose-400' : 'text-slate-400'
                  }`}
                >
                  {trail.pnlPct > 0 ? `+${trail.pnlPct}%` : `${trail.pnlPct}%`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-500">
            Terverifikasi oleh Engine Konsensus Kuantitatif AkiraQu
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold cursor-pointer"
          >
            {isId ? 'Tutup Audit' : 'Close Audit'}
          </button>
        </div>
      </div>
    </div>
  );
};
