import React, { useState, useEffect, useRef } from 'react';
import { Calculator, ShieldCheck, Zap, RefreshCw } from 'lucide-react';
import { useMarketDataStore } from '../../stores/useMarketDataStore';
import { formatSmartCryptoPrice } from '../../services/marketDataValidator';
import { DataStatusBadge } from '../ui/DataStatusBadge';
import { CoinLogo } from '../ui/CoinLogo';

interface PositionSizingViewProps {
  currentSymbol?: string;
  currentPrice?: number;
  onNavigateToTrade?: (symbol: string) => void;
  theme?: 'light' | 'dark';
  lang?: 'id' | 'en';
}

export const PositionSizingView: React.FC<PositionSizingViewProps> = ({
  currentSymbol = 'BTC/USDT',
  currentPrice = 0,
  onNavigateToTrade,
  theme = 'dark',
  lang = 'id',
}) => {
  const isDark = theme === 'dark';
  const isId = lang === 'id';

  const ssotTicker = useMarketDataStore((s) => s.tickers[currentSymbol]);
  const liveRefPrice = ssotTicker?.price ?? (currentPrice > 0 ? currentPrice : 0);

  const [accountBalance, setAccountBalance] = useState<number>(25000);
  const [riskPercent, setRiskPercent] = useState<number>(1.5);
  const [autoFollowLive, setAutoFollowLive] = useState<boolean>(true);
  const [manualEntryPrice, setManualEntryPrice] = useState<number>(0);
  const [slOffsetPct, setSlOffsetPct] = useState<number>(2.5);
  const [manualStopLossPrice, setManualStopLossPrice] = useState<number | null>(null);
  const [leverage, setLeverage] = useState<number>(5);
  const [strategyMode, setStrategyMode] = useState<'FIXED_FRACTIONAL' | 'HALF_KELLY' | 'VOLATILITY_ATR'>('FIXED_FRACTIONAL');

  const prevSymbolRef = useRef<string>(currentSymbol);

  // Reset manual overrides when active symbol switches so previous symbol's price never lingers
  useEffect(() => {
    if (prevSymbolRef.current !== currentSymbol) {
      prevSymbolRef.current = currentSymbol;
      setAutoFollowLive(true);
      setManualEntryPrice(0);
      setManualStopLossPrice(null);
    }
  }, [currentSymbol]);

  const entryPrice = autoFollowLive ? liveRefPrice : manualEntryPrice;
  const stopLossPrice =
    manualStopLossPrice !== null
      ? manualStopLossPrice
      : entryPrice > 0
      ? Number((entryPrice * (1 - slOffsetPct / 100)).toPrecision(6))
      : 0;

  // Calculations
  const riskAmountUsd = (accountBalance * riskPercent) / 100;
  const slDistancePercent =
    entryPrice > 0 && stopLossPrice > 0
      ? Math.abs((entryPrice - stopLossPrice) / entryPrice) * 100
      : 0;
  const totalPositionSizeUsd = slDistancePercent > 0 ? riskAmountUsd / (slDistancePercent / 100) : 0;
  const marginRequiredUsd = leverage > 0 ? totalPositionSizeUsd / leverage : totalPositionSizeUsd;
  const coinQuantity = entryPrice > 0 ? totalPositionSizeUsd / entryPrice : 0;

  // Kelly Formula: f = (bp - q) / b
  const winRate = 0.58;
  const rewardRiskRatio = 2.4;
  const kellyFraction = (winRate * (rewardRiskRatio + 1) - 1) / rewardRiskRatio;
  const halfKellyRisk = Math.max(0.5, Math.min(5.0, kellyFraction * 50));

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border ${
          isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Calculator className="w-5 h-5" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold font-mono tracking-tight">
                  {isId ? 'Kalkulator Position Sizing Otomatis' : 'Automated Position Sizing Engine'}
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-[2px] bg-pink-500/15 text-pink-300 border border-pink-500/30 font-mono tabular-nums font-bold inline-flex items-center gap-1.5">
                  <CoinLogo symbol={currentSymbol} size="xs" priority decorative />
                  <span>
                    {currentSymbol}:{' '}
                    {liveRefPrice > 0
                      ? `$${formatSmartCryptoPrice(liveRefPrice)}`
                      : isId
                      ? 'Sinkron...'
                      : 'Syncing...'}
                  </span>
                </span>
                <DataStatusBadge symbol={currentSymbol} scope="ticker" lang={lang} compact />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isId
                  ? 'Tersinkronisasi real-time dengan harga referensi SSOT simbol aktif, toleransi risiko portofolio, dan kriteria Kelly.'
                  : 'Real-time synchronized with active symbol SSOT reference price, portfolio risk tolerance, and Kelly sizing.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setStrategyMode('FIXED_FRACTIONAL');
                setRiskPercent(1.5);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                strategyMode === 'FIXED_FRACTIONAL'
                  ? 'bg-emerald-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Fixed Risk (1.5%)
            </button>
            <button
              type="button"
              onClick={() => {
                setStrategyMode('HALF_KELLY');
                setRiskPercent(Number(halfKellyRisk.toFixed(1)));
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                strategyMode === 'HALF_KELLY'
                  ? 'bg-pink-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Half-Kelly ({halfKellyRisk.toFixed(1)}%)
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Controls & Output Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Input Parameters */}
        <div
          className={`lg:col-span-6 p-4 sm:p-5 rounded-2xl border ${
            isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-sm'
          } space-y-4`}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold font-mono text-slate-200">
              {isId ? 'Parameter Portofolio & Risiko' : 'Risk Inputs'}
            </h2>
            <button
              type="button"
              onClick={() => {
                setAutoFollowLive(true);
                setManualStopLossPrice(null);
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-[2px] text-[11px] font-mono font-bold border transition cursor-pointer ${
                autoFollowLive
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              <RefreshCw className="w-3 h-3" />
              <span>
                {autoFollowLive
                  ? isId
                    ? 'Sinkron Harga Live Aktif'
                    : 'Live Price Synced'
                  : isId
                  ? 'Ikuti Harga Live'
                  : 'Follow Live Price'}
              </span>
            </button>
          </div>

          <div>
            <label className="text-xs font-mono text-slate-400 block mb-1">
              {isId ? 'Saldo Total Akun ($ USD)' : 'Account Balance ($ USD)'}
            </label>
            <input
              type="number"
              value={accountBalance}
              onChange={(e) => setAccountBalance(Number(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono tabular-nums font-bold text-sm outline-hidden focus:border-pink-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">
                {isId ? 'Maksimum Risiko (%)' : 'Risk per Trade (%)'}
              </label>
              <input
                type="number"
                step="0.1"
                value={riskPercent}
                onChange={(e) => setRiskPercent(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-emerald-400 font-mono tabular-nums font-bold text-sm outline-hidden focus:border-pink-500"
              />
            </div>
            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">
                {isId ? 'Leverage (x)' : 'Leverage (x)'}
              </label>
              <input
                type="number"
                value={leverage}
                onChange={(e) => setLeverage(Number(e.target.value) || 1)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-pink-400 font-mono tabular-nums font-bold text-sm outline-hidden focus:border-pink-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">
                {isId ? 'Harga Entry ($)' : 'Entry Price ($)'}
              </label>
              <input
                type="number"
                step="any"
                value={entryPrice || ''}
                placeholder={isId ? 'Menunggu harga live...' : 'Waiting for live price...'}
                onChange={(e) => {
                  setAutoFollowLive(false);
                  setManualEntryPrice(Number(e.target.value) || 0);
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono tabular-nums font-bold text-sm outline-hidden focus:border-pink-500"
              />
            </div>
            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">
                {isId ? `Harga Stop Loss ($ • -${slOffsetPct}%)` : `Stop Loss ($ • -${slOffsetPct}%)`}
              </label>
              <input
                type="number"
                step="any"
                value={stopLossPrice || ''}
                placeholder={isId ? 'Menunggu harga live...' : 'Waiting for live price...'}
                onChange={(e) => {
                  const val = Number(e.target.value) || 0;
                  setManualStopLossPrice(val);
                  if (entryPrice > 0 && val > 0) {
                    setSlOffsetPct(Number((Math.abs(entryPrice - val) / entryPrice * 100).toFixed(2)));
                  }
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-rose-400 font-mono tabular-nums font-bold text-sm outline-hidden focus:border-pink-500"
              />
            </div>
          </div>
        </div>

        {/* Right: Calculated Sizing Output */}
        <div
          className={`lg:col-span-6 p-4 sm:p-5 rounded-2xl border flex flex-col justify-between ${
            isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="space-y-4">
            <h2 className="text-sm font-bold font-mono text-slate-200">
              {isId ? 'Hasil Kalkulasi Ukuran Posisi' : 'Computed Position Sizing'}
            </h2>

            <div className="grid grid-cols-2 gap-3 font-mono tabular-nums">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Total Nilai Posisi (Notional)</span>
                <span className="text-lg font-black text-white">${totalPositionSizeUsd.toFixed(2)}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Margin Modal Diperlukan</span>
                <span className="text-lg font-black text-pink-400">${marginRequiredUsd.toFixed(2)}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">
                  Kuantitas Koin ({currentSymbol.replace('/USDT', '')})
                </span>
                <span className="text-lg font-black text-pink-400">{coinQuantity.toFixed(4)}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Maksimal Kerugian (Loss di SL)</span>
                <span className="text-lg font-black text-rose-400">-${riskAmountUsd.toFixed(2)}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs font-mono tabular-nums text-emerald-300">
              <div className="flex items-center gap-1.5 font-bold mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Rasio Risiko Aman (Risk-Protected)</span>
              </div>
              <span>
                {stopLossPrice > 0
                  ? `Jika harga menyentuh Stop Loss ($${formatSmartCryptoPrice(stopLossPrice)}), risiko dibatasi tepat ${riskPercent}% ($${riskAmountUsd.toFixed(2)}) dari portofolio.`
                  : isId
                  ? 'Menunggu harga referensi live simbol aktif untuk menghitung batas Stop Loss.'
                  : 'Waiting for live reference price to compute Stop Loss protection.'}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800 flex justify-end">
            <button
              type="button"
              onClick={() => onNavigateToTrade && onNavigateToTrade(currentSymbol)}
              className="w-full py-2.5 px-4 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-mono font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" />
              <span>{isId ? 'Terapkan ke Eksekusi Trading Manual' : 'Apply Sizing to Manual Order'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
