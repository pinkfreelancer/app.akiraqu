import React, { useState, useMemo } from 'react';
import {
  BotTradeRecord,
  TradingBotConfig,
  MarketType,
} from '../types/crypto.types';
import { calculateBotAnalytics } from '../services/terminalExtensionService';
import { formatCryptoPrice } from '../utils/formatters';
import {
  TrendingUp,
  BarChart3,
  DollarSign,
  Activity,
  ShieldAlert,
  Calendar,
  Sparkles,
  Download,
  RefreshCw,
  Layers,
  Target,
  Clock,
  Award,
  PieChart,
} from 'lucide-react';

interface BotAnalyticsViewProps {
  trades: BotTradeRecord[];
  bots: TradingBotConfig[];
  theme?: 'light' | 'dark';
  onSimulateNewTrade?: () => void;
  onResetTrades?: () => void;
}

export const BotAnalyticsView: React.FC<BotAnalyticsViewProps> = ({
  trades,
  bots,
  theme = 'dark',
  onSimulateNewTrade,
  onResetTrades,
}) => {
  const isDark = theme === 'dark';

  // Filters
  const [selectedBotId, setSelectedBotId] = useState<string>('ALL');
  const [selectedMarket, setSelectedMarket] = useState<'ALL' | MarketType>('ALL');
  const [selectedAccountType, setSelectedAccountType] = useState<'ALL' | 'DEMO' | 'REAL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'WIN' | 'LOSS'>('ALL');
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  // Filtered trade list
  const filteredTrades = useMemo(() => {
    return trades.filter((t) => {
      if (selectedBotId !== 'ALL' && t.botId !== selectedBotId) return false;
      if (selectedMarket !== 'ALL' && t.marketType !== selectedMarket) return false;
      if (selectedAccountType === 'DEMO' && !t.isDemo) return false;
      if (selectedAccountType === 'REAL' && t.isDemo) return false;
      if (selectedStatus !== 'ALL' && t.status !== selectedStatus) return false;
      return true;
    });
  }, [trades, selectedBotId, selectedMarket, selectedAccountType, selectedStatus]);

  // Analytics summary based on filtered trades
  const analytics = useMemo(() => {
    return calculateBotAnalytics(filteredTrades);
  }, [filteredTrades]);

  // Symbol distribution stats
  const symbolStats = useMemo(() => {
    const map = new Map<string, { trades: number; pnl: number; wins: number }>();
    filteredTrades.forEach((t) => {
      const current = map.get(t.symbol) || { trades: 0, pnl: 0, wins: 0 };
      map.set(t.symbol, {
        trades: current.trades + 1,
        pnl: current.pnl + t.pnlUsd,
        wins: current.wins + (t.status === 'WIN' ? 1 : 0),
      });
    });
    return Array.from(map.entries()).map(([sym, data]) => ({
      symbol: sym,
      trades: data.trades,
      pnl: Math.round(data.pnl * 100) / 100,
      winRate: Math.round((data.wins / data.trades) * 100),
    }));
  }, [filteredTrades]);

  // Strategy comparison metrics
  const strategyMetrics = useMemo(() => {
    return bots.map((bot) => {
      const bTrades = trades.filter((t) => t.botId === bot.id);
      const total = bTrades.length;
      const wins = bTrades.filter((t) => t.status === 'WIN').length;
      const losses = bTrades.filter((t) => t.status === 'LOSS').length;
      const winRate = total > 0 ? (wins / total) * 100 : 0;
      const grossWin = bTrades.filter((t) => t.status === 'WIN').reduce((s, t) => s + t.pnlUsd, 0);
      const grossLoss = Math.abs(bTrades.filter((t) => t.status === 'LOSS').reduce((s, t) => s + t.pnlUsd, 0));
      const netPnl = grossWin - grossLoss;
      const pf = grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? 99.9 : 0;
      const best = bTrades.length > 0 ? Math.max(...bTrades.map((t) => t.pnlUsd)) : 0;

      return {
        bot,
        total,
        wins,
        losses,
        winRate: Math.round(winRate * 10) / 10,
        netPnl: Math.round(netPnl * 100) / 100,
        profitFactor: Math.round(pf * 100) / 100,
        bestTrade: Math.round(best * 100) / 100,
      };
    });
  }, [bots, trades]);

  const handleExportCsv = () => {
    if (filteredTrades.length === 0) return;
    const headers = [
      'Trade ID',
      'Strategy',
      'Symbol',
      'Side',
      'Market',
      'Account',
      'Entry Time',
      'Exit Time',
      'Entry Price',
      'Exit Price',
      'Size USD',
      'Leverage',
      'Net PnL USD',
      'PnL %',
      'Status',
      'Exit Reason',
    ];
    const rows = filteredTrades.map((t) => [
      t.id,
      t.botName,
      t.symbol,
      t.side,
      t.marketType,
      t.isDemo ? 'DEMO' : 'REAL',
      new Date(t.entryTime).toISOString(),
      new Date(t.exitTime).toISOString(),
      t.entryPrice,
      t.exitPrice,
      t.sizeUsd,
      `${t.leverage}x`,
      t.pnlUsd,
      `${t.pnlPct}%`,
      t.status,
      t.exitReason,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `bot_analytics_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // SVG Equity curve rendering math
  const equityPoints = analytics.equityCurve;
  const minEquity = Math.min(...equityPoints.map((p) => p.equityUsd)) * 0.98;
  const maxEquity = Math.max(...equityPoints.map((p) => p.equityUsd)) * 1.02;
  const equityRange = maxEquity - minEquity || 1;

  const svgWidth = 800;
  const svgHeight = 220;
  const paddingX = 45;
  const paddingY = 25;
  const plotWidth = svgWidth - paddingX * 2;
  const plotHeight = svgHeight - paddingY * 2;

  const polylineCoords = equityPoints.map((p, idx) => {
    const x = paddingX + (idx / Math.max(1, equityPoints.length - 1)) * plotWidth;
    const y = svgHeight - paddingY - ((p.equityUsd - minEquity) / equityRange) * plotHeight;
    return { x, y, point: p, index: idx };
  });

  const polylineString = polylineCoords.map((c) => `${c.x},${c.y}`).join(' ');
  const areaString = `${polylineCoords[0]?.x || 0},${svgHeight - paddingY} ${polylineString} ${polylineCoords[polylineCoords.length - 1]?.x || 0},${svgHeight - paddingY}`;

  return (
    <div className="space-y-5 font-mono">
      {/* Top Header & Analytics Control Bar */}
      <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#0f172a] border-slate-700' : 'bg-white border-slate-300'}`}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                <BarChart3 className="w-5 h-5" />
              </span>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Quantitative Bot Performance &amp; Analytics
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold">
                  Live Engine
                </span>
              </h2>
            </div>
            <p className="text-xs text-slate-300">
              Evaluasi kinerja strategi trading bot algoritmik, rasio win rate, profit factor, drawdown, dan kurva ekuitas modal.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onSimulateNewTrade && (
              <button
                onClick={onSimulateNewTrade}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                + Simulasi Trade
              </button>
            )}
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 cursor-pointer"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              Export CSV
            </button>
            {onResetTrades && (
              <button
                onClick={onResetTrades}
                className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 transition-colors border border-slate-700 cursor-pointer"
                title="Reset History"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-700 text-xs">
          <div>
            <label className="text-xs text-slate-300 uppercase font-bold block mb-1">
              Filter Strategi:
            </label>
            <select
              value={selectedBotId}
              onChange={(e) => setSelectedBotId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#070b14] border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500 cursor-pointer font-bold"
            >
              <option value="ALL">Semua Bot ({bots.length} Strategi)</option>
              {bots.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.marketType})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-300 uppercase font-bold block mb-1">
              Pasar:
            </label>
            <div className="flex items-center gap-1.5">
              {(['ALL', 'SPOT', 'FUTURES'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setSelectedMarket(m)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedMarket === m
                      ? m === 'SPOT'
                        ? 'bg-cyan-950 text-cyan-200 border border-cyan-500/50'
                        : m === 'FUTURES'
                        ? 'bg-purple-950 text-purple-200 border border-purple-500/50'
                        : 'bg-slate-700 text-white'
                      : 'bg-[#070b14] text-slate-300 hover:text-white border border-slate-700'
                  }`}
                >
                  {m === 'ALL' ? 'Semua' : m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-300 uppercase font-bold block mb-1">
              Tipe Akun:
            </label>
            <div className="flex items-center gap-1.5">
              {(['ALL', 'DEMO', 'REAL'] as const).map((a) => (
                <button
                  key={a}
                  onClick={() => setSelectedAccountType(a)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedAccountType === a
                      ? a === 'DEMO'
                        ? 'bg-emerald-950 text-emerald-200 border border-emerald-500/50'
                        : a === 'REAL'
                        ? 'bg-cyan-950 text-cyan-200 border border-cyan-500/50'
                        : 'bg-slate-700 text-white'
                      : 'bg-[#070b14] text-slate-300 hover:text-white border border-slate-700'
                  }`}
                >
                  {a === 'ALL' ? 'Semua' : a === 'DEMO' ? 'Demo' : 'Live'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-300 uppercase font-bold block mb-1">
              Hasil Posisi:
            </label>
            <div className="flex items-center gap-1.5">
              {(['ALL', 'WIN', 'LOSS'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedStatus(s)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedStatus === s
                      ? s === 'WIN'
                        ? 'bg-emerald-950 text-emerald-200 border border-emerald-500/50'
                        : s === 'LOSS'
                        ? 'bg-rose-950 text-rose-200 border border-rose-500/50'
                        : 'bg-slate-700 text-white'
                      : 'bg-[#070b14] text-slate-300 hover:text-white border border-slate-700'
                  }`}
                >
                  {s === 'ALL' ? 'Semua' : s === 'WIN' ? 'Win' : 'Loss'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Primary KPI Metric Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Net Realized PnL */}
        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#0f172a] border-slate-700' : 'bg-white border-slate-300'}`}>
          <div className="flex items-center justify-between text-slate-300 text-xs mb-1 font-bold">
            <span>Net Realized PnL</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className={`text-lg font-black tabular-nums ${analytics.netPnlUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {analytics.netPnlUsd >= 0 ? '+' : ''}${formatCryptoPrice(analytics.netPnlUsd)}
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
            <span>Setelah Fee:</span>
            <span className="text-slate-200 font-bold tabular-nums">${formatCryptoPrice(analytics.netPnlAfterFeesUsd)}</span>
          </div>
        </div>

        {/* Win Rate */}
        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#0f172a] border-slate-700' : 'bg-white border-slate-300'}`}>
          <div className="flex items-center justify-between text-slate-300 text-xs mb-1 font-bold">
            <span>Win Rate</span>
            <Target className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-lg font-black text-cyan-300 tabular-nums">
            {analytics.winRatePct}%
          </div>
          <div className="text-xs text-slate-300 mt-1 flex items-center gap-1.5 font-semibold">
            <span className="text-emerald-400 font-bold">{analytics.winCount}W</span>
            <span>/</span>
            <span className="text-rose-400 font-bold">{analytics.lossCount}L</span>
            <span className="text-slate-400">({analytics.totalTrades} Total)</span>
          </div>
        </div>

        {/* Profit Factor */}
        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#0f172a] border-slate-700' : 'bg-white border-slate-300'}`}>
          <div className="flex items-center justify-between text-slate-300 text-xs mb-1 font-bold">
            <span>Profit Factor</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg font-black text-amber-300 tabular-nums">
            {analytics.profitFactor.toFixed(2)}
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
            <span>Payoff R:R:</span>
            <span className="text-slate-200 font-bold tabular-nums">{analytics.payoffRatio}:1</span>
          </div>
        </div>

        {/* Max Drawdown */}
        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#0f172a] border-slate-700' : 'bg-white border-slate-300'}`}>
          <div className="flex items-center justify-between text-slate-300 text-xs mb-1 font-bold">
            <span>Max Drawdown</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-lg font-black text-rose-400 tabular-nums">
            -{analytics.maxDrawdownPct}%
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
            <span>Max DD:</span>
            <span className="text-slate-200 font-bold tabular-nums">-${formatCryptoPrice(analytics.maxDrawdownUsd)}</span>
          </div>
        </div>

        {/* Sharpe Ratio */}
        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#0f172a] border-slate-700' : 'bg-white border-slate-300'}`}>
          <div className="flex items-center justify-between text-slate-300 text-xs mb-1 font-bold">
            <span>Sharpe Ratio</span>
            <Activity className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-lg font-black text-purple-300 tabular-nums">
            {analytics.sharpeRatio}
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
            <span>Rating:</span>
            <span className="text-emerald-300 font-bold">Alpha Tier</span>
          </div>
        </div>

        {/* Avg Duration & Volume */}
        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#0f172a] border-slate-700' : 'bg-white border-slate-300'}`}>
          <div className="flex items-center justify-between text-slate-300 text-xs mb-1 font-bold">
            <span>Avg Hold Time</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-lg font-black text-white tabular-nums">
            {Math.floor(analytics.avgDurationMin / 60)}j {analytics.avgDurationMin % 60}m
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
            <span>Total Vol:</span>
            <span className="text-slate-200 font-bold tabular-nums">${formatCryptoPrice(analytics.totalVolumeUsd)}</span>
          </div>
        </div>
      </div>

      {/* Charts Section: Cumulative Equity Curve & Daily PnL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Equity Curve SVG Chart */}
        <div className={`lg:col-span-2 p-5 rounded-2xl border flex flex-col justify-between ${
          isDark ? 'bg-[#0f172a] border-slate-700' : 'bg-white border-slate-300'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Cumulative Equity Curve Growth (Portfolio Balance)
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                Capital Balance
              </span>
            </div>
          </div>

          {/* Interactive SVG Chart Container */}
          <div className="relative w-full h-[220px] bg-[#070b14] rounded-xl border border-slate-700 p-2 overflow-hidden flex items-center justify-center">
            {equityPoints.length < 2 ? (
              <div className="text-xs text-slate-400">Belum ada trade yang ditutup untuk menghasilkan kurva ekuitas.</div>
            ) : (
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-full overflow-visible"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="lineStrokeGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>

                {/* Horizontal Grid lines */}
                {[0.2, 0.4, 0.6, 0.8].map((ratio) => {
                  const y = paddingY + ratio * plotHeight;
                  const val = maxEquity - ratio * equityRange;
                  return (
                    <g key={ratio}>
                      <line
                        x1={paddingX}
                        y1={y}
                        x2={svgWidth - paddingX}
                        y2={y}
                        stroke="#334155"
                        strokeDasharray="4,4"
                        strokeWidth="1"
                      />
                      <text
                        x={paddingX - 6}
                        y={y + 3}
                        fill="#94a3b8"
                        fontSize="10"
                        textAnchor="end"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        ${Math.round(val).toLocaleString()}
                      </text>
                    </g>
                  );
                })}

                {/* Shaded Area Fill */}
                <polygon points={areaString} fill="url(#equityGradient)" />

                {/* Equity Curve Polyline */}
                <polyline
                  points={polylineString}
                  fill="none"
                  stroke="url(#lineStrokeGradient)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Data Points */}
                {polylineCoords.map((c, i) => (
                  <g key={i}>
                    <circle
                      cx={c.x}
                      cy={c.y}
                      r={hoveredPoint === i ? 5 : 3.5}
                      fill={c.point.pnlUsd >= 0 ? '#10b981' : '#f43f5e'}
                      stroke="#0f172a"
                      strokeWidth="1.5"
                      className="cursor-pointer transition-all"
                      onMouseEnter={() => setHoveredPoint(i)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  </g>
                ))}
              </svg>
            )}

            {/* Hover Tooltip Overlay */}
            {hoveredPoint !== null && polylineCoords[hoveredPoint] && (
              <div
                className="absolute z-10 px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 shadow-xl text-xs text-white pointer-events-none transform -translate-x-1/2 -translate-y-full"
                style={{
                  left: `${(polylineCoords[hoveredPoint].x / svgWidth) * 100}%`,
                  top: `${(polylineCoords[hoveredPoint].y / svgHeight) * 100 - 8}%`,
                }}
              >
                <div className="font-bold text-cyan-300">{polylineCoords[hoveredPoint].point.dateLabel}</div>
                <div>Modal: ${formatCryptoPrice(polylineCoords[hoveredPoint].point.equityUsd)}</div>
                <div className={polylineCoords[hoveredPoint].point.pnlUsd >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                  Kumulatif: {polylineCoords[hoveredPoint].point.pnlUsd >= 0 ? '+' : ''}${formatCryptoPrice(polylineCoords[hoveredPoint].point.pnlUsd)}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 text-xs text-slate-300 font-mono">
            <span>Saldo Awal: $20,000.00</span>
            <span className="text-emerald-400 font-bold tabular-nums">
              Saldo Sekarang: ${formatCryptoPrice(equityPoints[equityPoints.length - 1]?.equityUsd || 20000)} (
              +{(((equityPoints[equityPoints.length - 1]?.equityUsd || 20000) - 20000) / 200).toFixed(2)}%)
            </span>
          </div>
        </div>

        {/* Daily PnL Distribution Bar Chart */}
        <div className={`p-5 rounded-2xl border flex flex-col justify-between ${
          isDark ? 'bg-[#0f172a] border-slate-700' : 'bg-white border-slate-300'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Distribusi PnL Harian
              </h3>
            </div>
            <span className="text-xs text-slate-300 font-semibold">{analytics.dailyPnlSeries.length} Hari</span>
          </div>

          <div className="bg-[#070b14] rounded-xl border border-slate-700 p-3 h-[220px] flex flex-col justify-end space-y-2">
            <div className="flex items-end justify-between gap-2 h-[160px] pt-4">
              {analytics.dailyPnlSeries.map((day, idx) => {
                const maxBar = Math.max(...analytics.dailyPnlSeries.map((d) => Math.abs(d.pnlUsd))) || 1;
                const heightPct = Math.max(15, (Math.abs(day.pnlUsd) / maxBar) * 100);
                const isPos = day.pnlUsd >= 0;

                return (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center justify-end h-full relative group cursor-pointer"
                    onMouseEnter={() => setHoveredBarIndex(idx)}
                    onMouseLeave={() => setHoveredBarIndex(null)}
                  >
                    {hoveredBarIndex === idx && (
                      <div className="absolute -top-12 z-20 px-2.5 py-1 rounded bg-slate-900 border border-slate-600 text-xs text-white whitespace-nowrap shadow-lg">
                        <div className="font-bold">{day.date}</div>
                        <div className={isPos ? 'text-emerald-400' : 'text-rose-400'}>
                          {isPos ? '+' : ''}${day.pnlUsd} ({day.tradesCount} trades)
                        </div>
                      </div>
                    )}

                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-t-md transition-all ${
                        isPos
                          ? 'bg-emerald-500 hover:bg-emerald-400 shadow-sm shadow-emerald-500/20'
                          : 'bg-rose-500 hover:bg-rose-400 shadow-sm shadow-rose-500/20'
                      }`}
                    />
                    <span className="text-[10px] text-slate-400 mt-1 transform -rotate-45 origin-left truncate w-6">
                      {day.dayLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-300 pt-2 font-semibold">
            <span className="flex items-center gap-1 text-emerald-400 font-bold">
              ✓ Hijau: {analytics.dailyPnlSeries.filter((d) => d.pnlUsd >= 0).length} Hari
            </span>
            <span className="flex items-center gap-1 text-rose-400 font-bold">
              ✕ Merah: {analytics.dailyPnlSeries.filter((d) => d.pnlUsd < 0).length} Hari
            </span>
          </div>
        </div>
      </div>

      {/* Bot Strategy Comparison Matrix */}
      <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#0f172a] border-slate-700' : 'bg-white border-slate-300'}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Matrix Komparasi Kinerja Per Strategi Bot
            </h3>
          </div>
          <span className="text-xs text-slate-300 font-semibold">Total {bots.length} Algoritma Aktif</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-700 text-xs text-slate-300 uppercase">
                <th className="pb-3 font-bold">Nama Algoritma &amp; Tipe</th>
                <th className="pb-3 font-bold">Pasar &amp; Leverage</th>
                <th className="pb-3 font-bold text-center">Status</th>
                <th className="pb-3 font-bold text-right">Total Trade</th>
                <th className="pb-3 font-bold text-right">Win Rate</th>
                <th className="pb-3 font-bold text-right">Profit Factor</th>
                <th className="pb-3 font-bold text-right">Best Trade</th>
                <th className="pb-3 font-bold text-right">Net PnL (USD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/80">
              {strategyMetrics.map(({ bot, total, winRate, netPnl, profitFactor, bestTrade }) => (
                <tr key={bot.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5">
                    <div className="font-bold text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-400" />
                      {bot.name}
                    </div>
                    <span className="text-xs text-slate-300 font-normal">
                      {bot.type.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                        bot.marketType === 'SPOT'
                          ? 'bg-cyan-950 text-cyan-200 border border-cyan-500/40'
                          : 'bg-purple-950 text-purple-200 border border-purple-500/40'
                      }`}>
                        {bot.marketType}
                      </span>
                      <span className="text-xs text-slate-300 font-bold">{bot.leverage}x</span>
                    </div>
                  </td>
                  <td className="py-3.5 text-center">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                      bot.isActive
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      {bot.isActive ? 'RUNNING' : 'PAUSED'}
                    </span>
                  </td>
                  <td className="py-3.5 text-right text-slate-200 font-bold tabular-nums">{total}</td>
                  <td className="py-3.5 text-right">
                    <span className="font-bold text-cyan-300 tabular-nums">{winRate}%</span>
                  </td>
                  <td className="py-3.5 text-right text-amber-300 font-bold tabular-nums">
                    {profitFactor.toFixed(2)}
                  </td>
                  <td className="py-3.5 text-right text-emerald-400 font-bold tabular-nums">
                    +${formatCryptoPrice(bestTrade)}
                  </td>
                  <td className="py-3.5 text-right">
                    <span className={`font-black text-sm tabular-nums ${netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {netPnl >= 0 ? '+' : ''}${formatCryptoPrice(netPnl)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Symbol Breakdown & Trade Log History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Symbol Distribution Stats */}
        <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#0f172a] border-slate-700' : 'bg-white border-slate-300'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Kinerja Per Aset Kripto
              </h3>
            </div>
          </div>

          <div className="space-y-2.5">
            {symbolStats.map((sym) => (
              <div
                key={sym.symbol}
                className="p-3.5 rounded-xl bg-[#070b14] border border-slate-700 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-white">{sym.symbol}</div>
                  <div className="text-xs text-slate-300">{sym.trades} Eksekusi Trade</div>
                </div>
                <div className="text-right">
                  <div className={`font-black tabular-nums ${sym.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {sym.pnl >= 0 ? '+' : ''}${formatCryptoPrice(sym.pnl)}
                  </div>
                  <div className="text-xs text-cyan-300 font-bold tabular-nums">
                    {sym.winRate}% Win
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trade Execution History Table */}
        <div className={`lg:col-span-2 p-5 rounded-2xl border ${isDark ? 'bg-[#0f172a] border-slate-700' : 'bg-white border-slate-300'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Riwayat Closed Trades Log ({filteredTrades.length})
              </h3>
            </div>
            <span className="text-xs text-slate-300 font-semibold">Realtime</span>
          </div>

          <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-[#0f172a] z-10">
                <tr className="border-b border-slate-700 text-xs text-slate-300 uppercase">
                  <th className="pb-2.5 font-bold">Waktu &amp; Pair</th>
                  <th className="pb-2.5 font-bold">Strategi &amp; Mode</th>
                  <th className="pb-2.5 font-bold">Entry → Exit</th>
                  <th className="pb-2.5 font-bold text-right">PnL (USD)</th>
                  <th className="pb-2.5 font-bold text-right">ROI %</th>
                  <th className="pb-2.5 font-bold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/80">
                {filteredTrades.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-black ${
                          t.side === 'LONG' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                        }`}>
                          {t.side}
                        </span>
                        {t.symbol}
                      </div>
                      <span className="text-xs text-slate-400">
                        {new Date(t.exitTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {t.durationMinutes}m
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="text-slate-200 font-bold truncate max-w-[150px]">{t.botName}</div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-300">
                        <span>{t.marketType}</span>
                        <span>•</span>
                        <span className={t.isDemo ? 'text-emerald-400 font-bold' : 'text-cyan-400 font-bold'}>
                          {t.isDemo ? 'DEMO' : 'LIVE'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="text-slate-200 text-xs font-semibold tabular-nums">
                        ${formatCryptoPrice(t.entryPrice)} → ${formatCryptoPrice(t.exitPrice)}
                      </div>
                      <span className="text-xs text-slate-400">Exit: {t.exitReason.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="py-3 text-right font-black tabular-nums">
                      <span className={t.pnlUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {t.pnlUsd >= 0 ? '+' : ''}${formatCryptoPrice(t.pnlUsd)}
                      </span>
                    </td>
                    <td className="py-3 text-right font-bold tabular-nums">
                      <span className={t.pnlPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {t.pnlPct >= 0 ? '+' : ''}{t.pnlPct.toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                        t.status === 'WIN'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                          : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
