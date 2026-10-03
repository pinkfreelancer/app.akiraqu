import React, { useState } from 'react';
import { Calculator, ShieldCheck, DollarSign, Percent, AlertCircle, Zap, Check } from 'lucide-react';
import { formatCryptoPrice } from '../../utils/formatters';

interface PositionSizingViewProps {
  currentSymbol?: string;
  currentPrice?: number;
  onNavigateToTrade?: (symbol: string) => void;
  theme?: 'light' | 'dark';
  lang?: 'id' | 'en';
}

export const PositionSizingView: React.FC<PositionSizingViewProps> = ({
  currentSymbol = 'BTC/USDT',
  currentPrice = 88500,
  onNavigateToTrade,
  theme = 'dark',
  lang = 'id',
}) => {
  const isDark = theme === 'dark';
  const isId = lang === 'id';

  const [accountBalance, setAccountBalance] = useState<number>(25000);
  const [riskPercent, setRiskPercent] = useState<number>(1.5); // 1.5% max risk
  const [entryPrice, setEntryPrice] = useState<number>(currentPrice || 88500);
  const [stopLossPrice, setStopLossPrice] = useState<number>((currentPrice || 88500) * 0.975); // 2.5% SL
  const [leverage, setLeverage] = useState<number>(5);
  const [strategyMode, setStrategyMode] = useState<'FIXED_FRACTIONAL' | 'HALF_KELLY' | 'VOLATILITY_ATR'>('FIXED_FRACTIONAL');

  // Calculations
  const riskAmountUsd = (accountBalance * riskPercent) / 100;
  const slDistancePercent = Math.abs((entryPrice - stopLossPrice) / entryPrice) * 100;
  const totalPositionSizeUsd = slDistancePercent > 0 ? (riskAmountUsd / (slDistancePercent / 100)) : 0;
  const marginRequiredUsd = leverage > 0 ? totalPositionSizeUsd / leverage : totalPositionSizeUsd;
  const coinQuantity = entryPrice > 0 ? totalPositionSizeUsd / entryPrice : 0;

  // Kelly Formula: f = (bp - q) / b
  const winRate = 0.58;
  const rewardRiskRatio = 2.4;
  const kellyFraction = (winRate * (rewardRiskRatio + 1) - 1) / rewardRiskRatio;
  const halfKellyRisk = Math.max(0.5, Math.min(5.0, (kellyFraction * 50)));

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className={`p-4 sm:p-5 rounded-2xl border ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Calculator className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-lg sm:text-xl font-bold font-mono tracking-tight flex items-center gap-2">
                <span>{isId ? 'Kalkulator Position Sizing Otomatis' : 'Automated Position Sizing Engine'}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono">KELLY & ATR</span>
              </h1>
              <p className="text-xs text-slate-400">
                {isId ? 'Optimasi ukuran lot posisi berdasarkan toleransi risiko portofolio, stop loss, dan kriteria Kelly.' : 'Compute exact margin and position size based on portfolio risk tolerance and stop loss.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => {
                setStrategyMode('FIXED_FRACTIONAL');
                setRiskPercent(1.5);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                strategyMode === 'FIXED_FRACTIONAL' ? 'bg-emerald-500 text-slate-950 shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Fixed Risk (1.5%)
            </button>
            <button
              onClick={() => {
                setStrategyMode('HALF_KELLY');
                setRiskPercent(Number(halfKellyRisk.toFixed(1)));
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                strategyMode === 'HALF_KELLY' ? 'bg-pink-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
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
        <div className={`lg:col-span-6 p-4 sm:p-5 rounded-2xl border ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-sm'} space-y-4`}>
          <h2 className="text-sm font-bold font-mono text-slate-200">{isId ? 'Parameter Portofolio & Risiko' : 'Risk Inputs'}</h2>

          <div>
            <label className="text-xs font-mono text-slate-400 block mb-1">
              {isId ? 'Saldo Total Akun ($ USD)' : 'Account Balance ($ USD)'}
            </label>
            <input
              type="number"
              value={accountBalance}
              onChange={(e) => setAccountBalance(Number(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono font-bold text-sm outline-hidden focus:border-pink-500"
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
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-emerald-400 font-mono font-bold text-sm outline-hidden focus:border-pink-500"
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
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-pink-400 font-mono font-bold text-sm outline-hidden focus:border-pink-500"
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
                value={entryPrice}
                onChange={(e) => setEntryPrice(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono font-bold text-sm outline-hidden focus:border-pink-500"
              />
            </div>
            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">
                {isId ? 'Harga Stop Loss ($)' : 'Stop Loss ($)'}
              </label>
              <input
                type="number"
                value={stopLossPrice}
                onChange={(e) => setStopLossPrice(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-rose-400 font-mono font-bold text-sm outline-hidden focus:border-pink-500"
              />
            </div>
          </div>
        </div>

        {/* Right: Calculated Sizing Output */}
        <div className={`lg:col-span-6 p-4 sm:p-5 rounded-2xl border flex flex-col justify-between ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="space-y-4">
            <h2 className="text-sm font-bold font-mono text-slate-200">{isId ? 'Hasil Kalkulasi Ukuran Posisi' : 'Computed Position Sizing'}</h2>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 block">Total Nilai Posisi (Notional)</span>
                <span className="text-lg font-black font-mono text-white">${totalPositionSizeUsd.toFixed(2)}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 block">Margin Modal Diperlukan</span>
                <span className="text-lg font-black font-mono text-pink-400">${marginRequiredUsd.toFixed(2)}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 block">Kuantitas Koin ({currentSymbol.replace('/USDT', '')})</span>
                <span className="text-lg font-black font-mono text-pink-400">{coinQuantity.toFixed(4)}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 block">Maksimal Kerugian (Loss di SL)</span>
                <span className="text-lg font-black font-mono text-rose-400">-${riskAmountUsd.toFixed(2)}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs font-mono text-emerald-300">
              <div className="flex items-center gap-1.5 font-bold mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Rasio Risiko Aman (Risk-Protected)</span>
              </div>
              <span>Jika harga menyentuh Stop Loss (${stopLossPrice}), Anda hanya kehilangan tepat {riskPercent}% (${riskAmountUsd}) dari portofolio.</span>
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
