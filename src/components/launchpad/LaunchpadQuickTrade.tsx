import React, { useState, useEffect } from 'react';
import {
  RiskManagementPlan,
  OpenPosition,
  SupportedExchange,
  MarketType,
} from '../../types/crypto.types';
import { Language } from '../../i18n/translations';
import { formatCryptoPrice } from '../../utils/formatters';
import {
  ShieldCheck,
  Zap,
  TrendingUp,
  TrendingDown,
  Percent,
  DollarSign,
  Crosshair,
  CheckCircle2,
  Copy,
  Check,
  Send,
  Sliders,
  AlertTriangle,
} from 'lucide-react';

interface LaunchpadQuickTradeProps {
  symbol: string;
  currentPrice: number;
  riskPlan?: RiskManagementPlan;
  selectedExchange?: SupportedExchange;
  selectedMarketType?: MarketType;
  onExecuteSimulatedTrade?: (position: OpenPosition) => void;
  isDark?: boolean;
  lang?: Language;
}

export const LaunchpadQuickTrade: React.FC<LaunchpadQuickTradeProps> = ({
  symbol,
  currentPrice,
  riskPlan,
  selectedExchange = 'BINANCE',
  selectedMarketType = 'SPOT',
  onExecuteSimulatedTrade,
  isDark = true,
  lang = 'id',
}) => {
  const isId = lang === 'id';

  // State
  const [side, setSide] = useState<'LONG' | 'SHORT'>('LONG');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [entryPrice, setEntryPrice] = useState<number>(() => riskPlan?.entryPrice || currentPrice);
  const [stopLoss, setStopLoss] = useState<number>(() => riskPlan?.stopLoss || currentPrice * 0.98);
  const [takeProfit1, setTakeProfit1] = useState<number>(() => riskPlan?.takeProfit1 || currentPrice * 1.03);
  const [takeProfit2, setTakeProfit2] = useState<number>(() => riskPlan?.takeProfit2 || currentPrice * 1.06);
  const [riskPercent, setRiskPercent] = useState<number>(2);
  const [leverage, setLeverage] = useState<number>(() => riskPlan?.recommendedLeverage || 5);
  const [accountBalance, setAccountBalance] = useState<number>(10000);
  const [copied, setCopied] = useState(false);
  const [executedSuccess, setExecutedSuccess] = useState(false);

  // Sync with riskPlan when changed
  useEffect(() => {
    if (riskPlan) {
      setEntryPrice(riskPlan.entryPrice || currentPrice);
      setStopLoss(riskPlan.stopLoss || (side === 'LONG' ? currentPrice * 0.98 : currentPrice * 1.02));
      setTakeProfit1(riskPlan.takeProfit1 || (side === 'LONG' ? currentPrice * 1.03 : currentPrice * 0.97));
      setTakeProfit2(riskPlan.takeProfit2 || (side === 'LONG' ? currentPrice * 1.06 : currentPrice * 0.94));
      if (riskPlan.recommendedLeverage) setLeverage(riskPlan.recommendedLeverage);
    }
  }, [riskPlan, currentPrice, side]);

  // Calculations
  const maxLossUsd = (accountBalance * riskPercent) / 100;
  const slDistancePct = entryPrice > 0 ? Math.abs((entryPrice - stopLoss) / entryPrice) : 0.02;
  const positionSizeUsd = slDistancePct > 0 ? maxLossUsd / slDistancePct : 0;
  const positionUnits = entryPrice > 0 ? positionSizeUsd / entryPrice : 0;
  const marginRequired = leverage > 0 ? positionSizeUsd / leverage : positionSizeUsd;

  const tp1DistancePct = entryPrice > 0 ? Math.abs((takeProfit1 - entryPrice) / entryPrice) : 0.03;
  const riskRewardRatio = slDistancePct > 0 ? tp1DistancePct / slDistancePct : 1.5;

  // Estimated Liquidation Price
  const estLiqPrice =
    side === 'LONG'
      ? entryPrice * (1 - 1 / leverage + 0.005)
      : entryPrice * (1 + 1 / leverage - 0.005);

  const handleExecute = () => {
    const newPos: OpenPosition = {
      id: `SIM-${Date.now()}`,
      symbol,
      side,
      size: positionUnits,
      sizeUsd: positionSizeUsd,
      entryPrice,
      markPrice: currentPrice,
      liquidationPrice: Math.max(0, estLiqPrice),
      margin: marginRequired,
      leverage,
      marginMode: 'ISOLATED',
      unrealizedPnl: 0,
      unrealizedPnlPct: 0,
      stopLoss,
      takeProfit: takeProfit1,
      exchange: selectedExchange,
      marketType: selectedMarketType,
      timestamp: Date.now(),
    };

    if (onExecuteSimulatedTrade) {
      onExecuteSimulatedTrade(newPos);
    }

    setExecutedSuccess(true);
    setTimeout(() => setExecutedSuccess(false), 2500);
  };

  const handleCopySetup = () => {
    const text = `📋 [AKIRAQU GRID EXECUTION SETUP]
Aset: ${symbol} (${selectedExchange} ${selectedMarketType})
Arah: ${side} | Leverage: ${leverage}x
═════════════════════════
Entry: $${formatCryptoPrice(entryPrice)}
Stop Loss: $${formatCryptoPrice(stopLoss)} (-${(slDistancePct * 100).toFixed(2)}%)
TP1: $${formatCryptoPrice(takeProfit1)} (+${(tp1DistancePct * 100).toFixed(2)}%)
TP2: $${formatCryptoPrice(takeProfit2)}
R:R Ratio: 1 : ${riskRewardRatio.toFixed(2)}
Ukuran Posisi: $${positionSizeUsd.toFixed(2)} (${positionUnits.toFixed(4)} ${symbol.split('/')[0]})
Margin: $${marginRequired.toFixed(2)}
Maksimal Risiko (SL): -$${maxLossUsd.toFixed(2)} (${riskPercent}%)
═════════════════════════`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full space-y-3 font-mono text-xs">
      {/* Side & Order Type Switcher */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setSide('LONG')}
          className={`py-2 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            side === 'LONG'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : isDark
              ? 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              : 'bg-slate-100 border border-slate-300 text-slate-600 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>LONG / BELI</span>
        </button>

        <button
          onClick={() => setSide('SHORT')}
          className={`py-2 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            side === 'SHORT'
              ? 'bg-rose-500 text-slate-950 shadow-md shadow-rose-500/20'
              : isDark
              ? 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              : 'bg-slate-100 border border-slate-300 text-slate-600 hover:text-slate-900'
          }`}
        >
          <TrendingDown className="w-4 h-4" />
          <span>SHORT / JUAL</span>
        </button>
      </div>

      {/* Numerical Entry, SL, TP Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <label className="text-[10px] text-slate-400 block font-semibold">{isId ? 'Entry Price' : 'Entry Price'}</label>
          <div className="flex items-center text-white font-bold">
            <span className="text-slate-500 mr-1">$</span>
            <input
              type="number"
              step="any"
              value={entryPrice}
              onChange={(e) => setEntryPrice(Number(e.target.value))}
              className="w-full bg-transparent outline-hidden text-cyan-300 font-bold"
            />
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-rose-950/60 space-y-1">
          <label className="text-[10px] text-rose-400 block font-semibold">{isId ? 'Stop Loss (s1)' : 'Stop Loss'}</label>
          <div className="flex items-center text-rose-300 font-bold">
            <span className="text-slate-500 mr-1">$</span>
            <input
              type="number"
              step="any"
              value={stopLoss}
              onChange={(e) => setStopLoss(Number(e.target.value))}
              className="w-full bg-transparent outline-hidden text-rose-400 font-bold"
            />
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-emerald-950/60 space-y-1">
          <label className="text-[10px] text-emerald-400 block font-semibold">{isId ? 'Take Profit (r1)' : 'Target 1 (TP1)'}</label>
          <div className="flex items-center text-emerald-300 font-bold">
            <span className="text-slate-500 mr-1">$</span>
            <input
              type="number"
              step="any"
              value={takeProfit1}
              onChange={(e) => setTakeProfit1(Number(e.target.value))}
              className="w-full bg-transparent outline-hidden text-emerald-400 font-bold"
            />
          </div>
        </div>
      </div>

      {/* Sizing & Leverage Presets */}
      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-400">{isId ? 'Batas Risiko Modal:' : 'Risk Capital:'}</span>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 5].map((pct) => (
              <button
                key={pct}
                onClick={() => setRiskPercent(pct)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                  riskPercent === pct
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {pct}%
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-400">{isId ? 'Leverage Kontrak:' : 'Leverage:'}</span>
          <div className="flex items-center gap-1.5">
            <input
              type="range"
              min="1"
              max="25"
              step="1"
              value={leverage}
              onChange={(e) => setLeverage(Number(e.target.value))}
              className="w-24 accent-cyan-400 cursor-pointer"
            />
            <span className="text-cyan-400 font-bold text-xs">{leverage}x</span>
          </div>
        </div>
      </div>

      {/* Computed Summary Details Box */}
      <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5 text-[11px]">
        <div className="flex justify-between text-slate-300">
          <span>{isId ? 'Ukuran Posisi Rekomendasi:' : 'Suggested Position Size:'}</span>
          <span className="text-white font-bold">${positionSizeUsd.toLocaleString(undefined, { maximumFractionDigits: 1 })} ({positionUnits.toFixed(4)} {symbol.split('/')[0]})</span>
        </div>
        <div className="flex justify-between text-slate-300">
          <span>{isId ? 'Margin Diperlukan:' : 'Required Margin:'}</span>
          <span className="text-cyan-300 font-bold">${marginRequired.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-slate-300">
          <span>{isId ? 'Maksimal Risiko (Loss):' : 'Max Capital at Risk:'}</span>
          <span className="text-rose-400 font-bold">-${maxLossUsd.toFixed(2)} ({riskPercent}%)</span>
        </div>
        <div className="flex justify-between text-slate-300">
          <span>{isId ? 'Risk / Reward Ratio (R:R):' : 'Risk / Reward Ratio:'}</span>
          <span className={`font-bold ${riskRewardRatio >= 2 ? 'text-emerald-400' : 'text-amber-400'}`}>
            1 : {riskRewardRatio.toFixed(2)} {riskRewardRatio >= 2 ? '✓ Optimal' : '⚠️ Sub-optimal'}
          </span>
        </div>
        <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800/80 text-[10px]">
          <span>{isId ? 'Estimasi Harga Likuidasi:' : 'Est. Liquidation Price:'}</span>
          <span className="text-amber-400 font-bold">${formatCryptoPrice(estLiqPrice)}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
        <button
          onClick={handleExecute}
          className={`py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md ${
            executedSuccess
              ? 'bg-emerald-500 text-slate-950 font-bold'
              : side === 'LONG'
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
              : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
          }`}
        >
          {executedSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>{isId ? 'Posisi Terbuka!' : 'Position Opened!'}</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 fill-current" />
              <span>{isId ? 'Eksekusi Simulasi Order' : 'Execute Paper Trade'}</span>
            </>
          )}
        </button>

        <button
          onClick={handleCopySetup}
          className={`py-2.5 rounded-xl border font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            copied
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
              : isDark
              ? 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:border-slate-600'
              : 'bg-slate-100 border-slate-300 text-slate-700 hover:text-slate-900'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-cyan-400" />
              <span>{isId ? 'Tersalin!' : 'Copied!'}</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>{isId ? 'Salin Setup R:R' : 'Copy Setup'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
