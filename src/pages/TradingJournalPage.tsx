import React, { useState, useMemo } from 'react';
import { JournalTradeEntry, SupportedExchange } from '../types/crypto.types';
import { INITIAL_JOURNAL_TRADES } from '../services/terminalExtensionService';
import { BookOpen, Plus, TrendingUp, TrendingDown, CheckCircle2, XCircle, Clock, Trash2, Download, Filter, Cloud } from 'lucide-react';
import { formatCryptoPrice } from '../utils/formatters';
import { useAuth } from '../contexts/AuthContext';

interface TradingJournalPageProps {
  currentSymbol: string;
  currentPrice: number;
  currentScore?: number;
  selectedExchange: SupportedExchange;
  theme?: 'light' | 'dark';
}

export const TradingJournalPage: React.FC<TradingJournalPageProps> = ({
  currentSymbol,
  currentPrice,
  currentScore = 80,
  selectedExchange,
  theme = 'dark',
}) => {
  const { user, isAuthenticated } = useAuth();
  const [trades, setTrades] = useState<JournalTradeEntry[]>(() => {
    const saved = localStorage.getItem('nexus_journal_trades');
    return saved ? JSON.parse(saved) : INITIAL_JOURNAL_TRADES;
  });

  const [isAddingTrade, setIsAddingTrade] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'OPEN' | 'CLOSED_WIN' | 'CLOSED_LOSS'>('ALL');

  // New trade state
  const [side, setSide] = useState<'LONG' | 'SHORT'>('LONG');
  const [entryPrice, setEntryPrice] = useState<number>(currentPrice);
  const [stopLoss, setStopLoss] = useState<number>(currentPrice * 0.98);
  const [takeProfit, setTakeProfit] = useState<number>(currentPrice * 1.04);
  const [sizeUsd, setSizeUsd] = useState<number>(1000);
  const [leverage, setLeverage] = useState<number>(3);
  const [rationale, setRationale] = useState<string>('Confluence AI Alignment + AVWAP Support Sweep');

  const isDark = theme === 'dark';

  const saveTrades = (newTrades: JournalTradeEntry[]) => {
    setTrades(newTrades);
    localStorage.setItem('nexus_journal_trades', JSON.stringify(newTrades));
  };

  const handleCreateTrade = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry: JournalTradeEntry = {
      id: `tr-${Date.now()}`,
      timestamp: Date.now(),
      symbol: currentSymbol,
      side,
      entryPrice: Number(entryPrice),
      stopLoss: Number(stopLoss),
      takeProfit: Number(takeProfit),
      sizeUsd: Number(sizeUsd),
      leverage: Number(leverage),
      status: 'OPEN',
      setupRationale: rationale,
      confluenceScoreAtEntry: currentScore,
      exchange: selectedExchange,
      notes: 'Logged via Nexus Journal',
    };

    saveTrades([newEntry, ...trades]);
    setIsAddingTrade(false);
  };

  const handleCloseTrade = (id: string, win: boolean) => {
    const updated = trades.map((t) => {
      if (t.id !== id) return t;
      const targetExit = win ? t.takeProfit : t.stopLoss;
      const pct = t.side === 'LONG'
        ? ((targetExit - t.entryPrice) / t.entryPrice) * t.leverage * 100
        : ((t.entryPrice - targetExit) / t.entryPrice) * t.leverage * 100;
      const pnl = (t.sizeUsd * pct) / 100;

      return {
        ...t,
        status: win ? ('CLOSED_WIN' as const) : ('CLOSED_LOSS' as const),
        exitPrice: targetExit,
        pnlPct: parseFloat(pct.toFixed(2)),
        pnlUsd: parseFloat(pnl.toFixed(2)),
        closedAt: Date.now(),
      };
    });
    saveTrades(updated);
  };

  const handleDeleteTrade = (id: string) => {
    saveTrades(trades.filter((t) => t.id !== id));
  };

  // Performance analytics metrics
  const stats = useMemo(() => {
    const closed = trades.filter((t) => t.status === 'CLOSED_WIN' || t.status === 'CLOSED_LOSS');
    const wins = closed.filter((t) => t.status === 'CLOSED_WIN');
    const winRate = closed.length > 0 ? (wins.length / closed.length) * 100 : 0;
    const totalPnlUsd = closed.reduce((acc, t) => acc + (t.pnlUsd || 0), 0);
    const avgWin = wins.length > 0 ? wins.reduce((acc, t) => acc + (t.pnlUsd || 0), 0) / wins.length : 0;
    const losses = closed.filter((t) => t.status === 'CLOSED_LOSS');
    const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((acc, t) => acc + (t.pnlUsd || 0), 0) / losses.length) : 1;
    const profitFactor = avgLoss > 0 ? (avgWin * wins.length) / (avgLoss * Math.max(1, losses.length)) : 1;

    return {
      totalTrades: trades.length,
      closedTrades: closed.length,
      winRate,
      totalPnlUsd,
      profitFactor: parseFloat(profitFactor.toFixed(2)),
    };
  }, [trades]);

  const filteredTrades = trades.filter((t) => {
    if (filterStatus === 'ALL') return true;
    return t.status === filterStatus;
  });

  return (
    <div id="page-trading-journal" className="space-y-6">
      {/* Performance Analytics Telemetry */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200'}`}>
          <div className="text-xs text-slate-400 mb-1 font-mono">Win Rate</div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">{stats.winRate.toFixed(1)}%</span>
            <span className="text-xs text-slate-400">({stats.closedTrades} closed)</span>
          </div>
        </div>

        <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200'}`}>
          <div className="text-xs text-slate-400 mb-1 font-mono">Total Cumulative PnL</div>
          <div className={`text-2xl font-bold font-mono ${stats.totalPnlUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {stats.totalPnlUsd >= 0 ? '+' : ''}${stats.totalPnlUsd.toFixed(2)}
          </div>
        </div>

        <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200'}`}>
          <div className="text-xs text-slate-400 mb-1 font-mono">Profit Factor</div>
          <div className="text-2xl font-bold font-mono text-cyan-400">{stats.profitFactor}x</div>
        </div>

        <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200'}`}>
          <div className="text-xs text-slate-400 mb-1 font-mono">Active Positions</div>
          <div className="text-2xl font-bold font-mono text-white">
            {trades.filter((t) => t.status === 'OPEN').length} Open
          </div>
        </div>
      </div>

      {/* Header and Add Trade Trigger */}
      <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
        isDark ? 'bg-[#0b101f] border-[#1e293b]' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <BookOpen className="w-5 h-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">Trading Journal & Performance Hub</h2>
              {isAuthenticated && user ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <Cloud className="w-3 h-3" />
                  Cloud Sync ({user.displayName?.split(' ')[0] || user.email})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono text-slate-400 bg-slate-800/80 border border-slate-700">
                  Local Storage
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Catat eksekusi setup, evaluasi rasio win-rate, dan lacak disiplin risiko.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddingTrade(!isAddingTrade)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Catat Trade Baru ({currentSymbol})
          </button>
        </div>
      </div>

      {/* Add trade form modal / collapse */}
      {isAddingTrade && (
        <form onSubmit={handleCreateTrade} className={`p-5 rounded-2xl border ${isDark ? 'bg-[#0f172a] border-cyan-500/40' : 'bg-slate-50 border-cyan-300'} space-y-4`}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white font-mono">Catat Trade Setup: {currentSymbol}</h3>
            <span className="text-xs text-slate-400">Score Confluence: {currentScore}/100</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Arah Posisi</label>
              <div className="flex rounded-lg overflow-hidden border border-slate-700">
                <button
                  type="button"
                  onClick={() => setSide('LONG')}
                  className={`flex-1 py-1.5 text-xs font-bold font-mono ${side === 'LONG' ? 'bg-emerald-500 text-slate-950' : 'bg-[#070b14] text-slate-400'}`}
                >
                  LONG
                </button>
                <button
                  type="button"
                  onClick={() => setSide('SHORT')}
                  className={`flex-1 py-1.5 text-xs font-bold font-mono ${side === 'SHORT' ? 'bg-rose-500 text-slate-950' : 'bg-[#070b14] text-slate-400'}`}
                >
                  SHORT
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Harga Entry ($)</label>
              <input
                type="number"
                step="any"
                value={entryPrice}
                onChange={(e) => setEntryPrice(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-lg bg-[#070b14] border border-slate-700 text-white font-mono text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Stop Loss ($)</label>
              <input
                type="number"
                step="any"
                value={stopLoss}
                onChange={(e) => setStopLoss(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-lg bg-[#070b14] border border-slate-700 text-rose-400 font-mono text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Take Profit ($)</label>
              <input
                type="number"
                step="any"
                value={takeProfit}
                onChange={(e) => setTakeProfit(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-lg bg-[#070b14] border border-slate-700 text-emerald-400 font-mono text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Ukuran Posisi ($)</label>
              <input
                type="number"
                value={sizeUsd}
                onChange={(e) => setSizeUsd(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-lg bg-[#070b14] border border-slate-700 text-white font-mono text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Leverage (x)</label>
              <input
                type="number"
                value={leverage}
                onChange={(e) => setLeverage(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-lg bg-[#070b14] border border-slate-700 text-white font-mono text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Alasan Setup / Confluence</label>
              <input
                type="text"
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-[#070b14] border border-slate-700 text-white font-mono text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddingTrade(false)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-mono"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-bold text-xs font-mono"
            >
              Simpan ke Jurnal
            </button>
          </div>
        </form>
      )}

      {/* Trades table */}
      <div className={`rounded-xl border overflow-hidden ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200'}`}>
        <div className="p-3 border-b border-[#1e293b] flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {(['ALL', 'OPEN', 'CLOSED_WIN', 'CLOSED_LOSS'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setFilterStatus(filter)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                  filterStatus === filter
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-[#1e293b] text-slate-400 hover:text-white'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-500 font-mono">{filteredTrades.length} Catatan</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-[#1e293b] bg-[#0b101f] text-slate-400">
                <th className="py-2.5 px-4">Simbol & Side</th>
                <th className="py-2.5 px-4">Entry / Exit</th>
                <th className="py-2.5 px-4">SL / TP Target</th>
                <th className="py-2.5 px-4">Size & Leverage</th>
                <th className="py-2.5 px-4">PnL ($ / %)</th>
                <th className="py-2.5 px-4">Status & Rationale</th>
                <th className="py-2.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]/60">
              {filteredTrades.map((t) => (
                <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      {t.symbol}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${t.side === 'LONG' ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'}`}>
                        {t.side}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500">{new Date(t.timestamp).toLocaleDateString()}</div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="text-white">${formatCryptoPrice(t.entryPrice)}</div>
                    {t.exitPrice && <div className="text-slate-400 text-[10px]">Exit: ${formatCryptoPrice(t.exitPrice)}</div>}
                  </td>

                  <td className="py-3 px-4">
                    <div className="text-rose-400 text-[11px]">SL: ${formatCryptoPrice(t.stopLoss)}</div>
                    <div className="text-emerald-400 text-[11px]">TP: ${formatCryptoPrice(t.takeProfit)}</div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="text-white">${t.sizeUsd}</div>
                    <div className="text-cyan-400 text-[10px]">{t.leverage}x Lev</div>
                  </td>

                  <td className="py-3 px-4">
                    {t.pnlUsd !== undefined ? (
                      <div className={`font-bold ${t.pnlUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {t.pnlUsd >= 0 ? '+' : ''}${t.pnlUsd.toFixed(2)} ({t.pnlPct}%)
                      </div>
                    ) : (
                      <span className="text-slate-500">Floating...</span>
                    )}
                  </td>

                  <td className="py-3 px-4 max-w-[200px]">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold mb-1 ${
                      t.status === 'CLOSED_WIN'
                        ? 'bg-emerald-950 text-emerald-400'
                        : t.status === 'CLOSED_LOSS'
                        ? 'bg-rose-950 text-rose-400'
                        : 'bg-cyan-950 text-cyan-400'
                    }`}>
                      {t.status}
                    </span>
                    <div className="text-[11px] text-slate-400 truncate" title={t.setupRationale}>
                      {t.setupRationale}
                    </div>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {t.status === 'OPEN' && (
                        <>
                          <button
                            onClick={() => handleCloseTrade(t.id, true)}
                            className="p-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 cursor-pointer"
                            title="Tutup Posisi Profit (TP)"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleCloseTrade(t.id, false)}
                            className="p-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 cursor-pointer"
                            title="Tutup Posisi Stop Loss (SL)"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDeleteTrade(t.id)}
                        className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-rose-400 cursor-pointer"
                        title="Hapus Catatan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
