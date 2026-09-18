import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Play,
  RotateCcw,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  BarChart3,
  Sliders,
  FileText,
  Download,
  AlertCircle,
  Clock,
  Percent,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import {
  BacktestConfig,
  BacktestResult,
  IndicatorKey,
  OHLCVCandle,
  Timeframe,
  VerifiedParameters,
} from '../types/crypto.types';
import {
  DEFAULT_VERIFIED_PARAMETERS,
  INDICATORS_CATALOG,
  IndicatorMeta,
} from '../services/backtest/verifiedParameters';
import { DEFAULT_BACKTEST_CONFIG, runBacktest } from '../services/backtest/backtestEngine';
import { Language } from '../i18n/translations';
import { formatCryptoPrice } from '../utils/formatters';

interface BacktestModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
  timeframe: Timeframe;
  currentCandles: OHLCVCandle[];
  initialIndicator?: IndicatorKey;
  lang: Language;
}

export const BacktestModal: React.FC<BacktestModalProps> = ({
  isOpen,
  onClose,
  symbol,
  timeframe,
  currentCandles,
  initialIndicator = 'confluence',
  lang,
}) => {
  const [selectedIndicator, setSelectedIndicator] = useState<IndicatorKey>(initialIndicator);
  const [activeTab, setActiveTab] = useState<'results' | 'parameters' | 'trades'>('results');
  const [tradeFilter, setTradeFilter] = useState<'ALL' | 'WIN' | 'LOSS'>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [candleSample, setCandleSample] = useState<number>(180);
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; equity: number; date: string; dd: number } | null>(null);

  // Config State
  const [config, setConfig] = useState<BacktestConfig>(DEFAULT_BACKTEST_CONFIG);

  // Parameters State
  const [params, setParams] = useState<VerifiedParameters>(DEFAULT_VERIFIED_PARAMETERS);

  // Backtest Result State
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [isModalFullscreen, setIsModalFullscreen] = useState<boolean>(false);

  // Sync initial indicator when opened
  useEffect(() => {
    if (initialIndicator) {
      setSelectedIndicator(initialIndicator);
    }
  }, [initialIndicator, isOpen]);

  // Execute Backtest
  const handleRunBacktest = async (
    targetIndicator?: any,
    targetParams?: any,
    targetConfig?: any
  ) => {
    const safeIndicator: IndicatorKey =
      typeof targetIndicator === 'string' && targetIndicator.length > 0
        ? (targetIndicator as IndicatorKey)
        : (typeof selectedIndicator === 'string' ? selectedIndicator : 'confluence');

    const safeParams: VerifiedParameters =
      targetParams && typeof targetParams === 'object' && !('nativeEvent' in targetParams) && !('target' in targetParams)
        ? targetParams
        : params;

    const safeConfig: BacktestConfig =
      targetConfig && typeof targetConfig === 'object' && !('nativeEvent' in targetConfig) && !('target' in targetConfig)
        ? targetConfig
        : config;

    setIsLoading(true);

    try {
      // Try to fetch extended historical candles from backend API for deep backtest
      const res = await fetch('/api/v1/backtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          timeframe,
          indicatorKey: safeIndicator,
          parameters: safeParams,
          config: safeConfig,
          candleCount: candleSample,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setResult(json.data);
          setIsLoading(false);
          return;
        }
      }
    } catch (_err) {
      // Fallback: client-side deterministic backtest on available candles
    }

    // Client-side fallback computation
    const fallbackCandles = currentCandles.length >= 35 ? currentCandles : [];
    const clientResult = runBacktest(
      fallbackCandles,
      symbol,
      timeframe,
      safeIndicator,
      safeParams,
      safeConfig
    );
    setResult(clientResult);
    setIsLoading(false);
  };

  // Run backtest on initial open or coin switch
  useEffect(() => {
    if (isOpen) {
      handleRunBacktest(selectedIndicator);
    }
  }, [isOpen, symbol, timeframe, selectedIndicator, candleSample]);

  // Reset to verified default parameters
  const handleResetParameters = () => {
    setParams(DEFAULT_VERIFIED_PARAMETERS);
    setConfig(DEFAULT_BACKTEST_CONFIG);
    handleRunBacktest(selectedIndicator, DEFAULT_VERIFIED_PARAMETERS, DEFAULT_BACKTEST_CONFIG);
  };

  // Update specific parameter
  const handleParamChange = (indicatorKey: IndicatorKey, paramKey: string, value: number) => {
    setParams((prev) => ({
      ...prev,
      [indicatorKey]: {
        ...(prev as any)[indicatorKey],
        [paramKey]: value,
      },
    }));
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!result || result.trades.length === 0) return;
    const headers = ['Trade ID,Direction,Entry Time,Entry Price,Exit Time,Exit Price,Holding Bars,PnL %,PnL USD,Result,Exit Reason'];
    const rows = result.trades.map((t) =>
      [
        t.id,
        t.direction,
        new Date(t.entryTime).toISOString(),
        t.entryPrice,
        new Date(t.exitTime).toISOString(),
        t.exitPrice,
        t.holdingBars,
        t.pnlPercent,
        t.pnlUsd,
        t.result,
        t.exitReason,
      ].join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Backtest_${symbol.replace('/', '_')}_${selectedIndicator}_${timeframe}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeMeta = useMemo(() => {
    return INDICATORS_CATALOG.find((i) => i.key === selectedIndicator) || INDICATORS_CATALOG[0];
  }, [selectedIndicator]);

  const filteredTrades = useMemo(() => {
    if (!result) return [];
    if (tradeFilter === 'WIN') return result.trades.filter((t) => t.result === 'WIN');
    if (tradeFilter === 'LOSS') return result.trades.filter((t) => t.result === 'LOSS');
    return result.trades;
  }, [result, tradeFilter]);

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200 ${
      isModalFullscreen ? 'p-0' : 'p-2 sm:p-4 lg:p-6'
    }`}>
      <div
        id="backtest-modal-container"
        className={`relative flex flex-col bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden text-slate-100 transition-all duration-200 ${
          isModalFullscreen
            ? 'w-full h-full max-w-none max-h-screen rounded-none border-none'
            : 'w-full max-w-6xl max-h-[92vh] rounded-2xl'
        }`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
                  {lang === 'id' ? 'Mesin Backtest 10 Indikator Kuantitatif' : '10 Quantitative Indicators Backtest Engine'}
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {lang === 'id' ? 'Parameter Terverifikasi' : 'Verified Parameters'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {symbol} • {timeframe} • {result ? `${result.totalCandles} Lilin Historis Teruji` : 'Loading...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-backtest-reset"
              onClick={handleResetParameters}
              title={lang === 'id' ? 'Reset ke Parameter Terverifikasi' : 'Reset to Verified Defaults'}
              className="px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{lang === 'id' ? 'Reset Standar' : 'Reset Defaults'}</span>
            </button>

            {/* Modal Fullscreen Workstation Toggle */}
            <button
              id="btn-backtest-modal-maximize"
              onClick={() => setIsModalFullscreen((prev) => !prev)}
              title={isModalFullscreen ? (lang === 'id' ? 'Kecilkan Tampilan' : 'Restore Window') : (lang === 'id' ? 'Maksimalkan Layar Penuh' : 'Maximize Workstation')}
              className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 border border-slate-700/60 transition cursor-pointer"
            >
              {isModalFullscreen ? <Minimize2 className="w-4 h-4 text-cyan-400" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              id="btn-backtest-close"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Indicator Selector Bar */}
        <div className="px-6 py-2.5 border-b border-slate-800 bg-slate-950/50 shrink-0 overflow-x-auto">
          <div className="flex items-center gap-1.5 min-w-max">
            {INDICATORS_CATALOG.map((ind) => {
              const isSelected = selectedIndicator === ind.key;
              return (
                <button
                  key={ind.key}
                  id={`btn-select-indicator-${ind.key}`}
                  onClick={() => setSelectedIndicator(ind.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25 border border-blue-500'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-transparent'
                  }`}
                >
                  {ind.key === 'confluence' && <span className="text-amber-400">⚡</span>}
                  {ind.shortName}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sub-header Toolbar & View Switcher */}
        <div className="px-6 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 shrink-0">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            <button
              id="tab-backtest-results"
              onClick={() => setActiveTab('results')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'results'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              {lang === 'id' ? 'Hasil & Kurva Ekuitas' : 'Results & Equity Curve'}
            </button>
            <button
              id="tab-backtest-params"
              onClick={() => setActiveTab('parameters')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'parameters'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              {lang === 'id' ? 'Parameter Terverifikasi' : 'Verified Parameters'}
            </button>
            <button
              id="tab-backtest-trades"
              onClick={() => setActiveTab('trades')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'trades'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              {lang === 'id' ? 'Riwayat Transaksi' : 'Trade History'}
              {result && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-700 text-slate-300 font-bold">
                  {result.trades.length}
                </span>
              )}
            </button>
          </div>

          {/* Quick Settings & Run Button */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{lang === 'id' ? 'Sampel Lilin:' : 'Candle Sample:'}</span>
              <select
                id="select-candle-sample"
                value={candleSample}
                onChange={(e) => setCandleSample(Number(e.target.value))}
                className="bg-slate-800 text-slate-200 text-xs rounded-lg px-2 py-1 border border-slate-700 focus:outline-none focus:border-blue-500"
              >
                <option value={85}>85 Bars (Fast)</option>
                <option value={150}>150 Bars (Standard)</option>
                <option value={250}>250 Bars (Deep History)</option>
              </select>
            </div>

            <button
              id="btn-run-backtest-now"
              onClick={() => handleRunBacktest(selectedIndicator)}
              disabled={isLoading}
              className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition shadow-md shadow-blue-600/20 flex items-center gap-1.5 disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : 'fill-white'}`} />
              {isLoading
                ? lang === 'id'
                  ? 'Menghitung...'
                  : 'Simulating...'
                : lang === 'id'
                ? 'Jalankan Backtest'
                : 'Run Backtest'}
            </button>
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: RESULTS & EQUITY CURVE */}
          {activeTab === 'results' && result && (
            <div className="space-y-6">
              {/* Top Key Performance Indicators (KPI Cards) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {/* 1. Win Rate */}
                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{lang === 'id' ? 'Tingkat Kemenangan' : 'Win Rate'}</span>
                    <Percent className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div className="my-1.5">
                    <span
                      className={`text-2xl font-black tracking-tight ${
                        result.winRate >= 55
                          ? 'text-emerald-400'
                          : result.winRate >= 45
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {result.winRate}%
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <span className="text-emerald-400 font-semibold">{result.winningTrades}W</span>
                    <span>/</span>
                    <span className="text-rose-400 font-semibold">{result.losingTrades}L</span>
                    <span className="text-slate-500">({result.totalTrades} trades)</span>
                  </div>
                </div>

                {/* 2. Profit Factor */}
                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Profit Factor</span>
                    <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <div className="my-1.5">
                    <span
                      className={`text-2xl font-black tracking-tight ${
                        result.profitFactor >= 1.75
                          ? 'text-emerald-400'
                          : result.profitFactor >= 1.0
                          ? 'text-blue-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {result.profitFactor}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {result.profitFactor >= 1.5
                      ? lang === 'id'
                        ? 'Unggul secara statistik'
                        : 'Statistically Edge'
                      : lang === 'id'
                      ? 'Netral / Perlu optimasi'
                      : 'Needs optimization'}
                  </div>
                </div>

                {/* 3. Net PnL */}
                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{lang === 'id' ? 'Laba Bersih (Net PnL)' : 'Net Profit'}</span>
                    <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div className="my-1.5">
                    <span
                      className={`text-2xl font-black tracking-tight ${
                        result.netProfitUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {result.netProfitPercent >= 0 ? '+' : ''}
                      {result.netProfitPercent}%
                    </span>
                  </div>
                  <div className="text-[11px] font-semibold text-slate-300">
                    {result.netProfitUsd >= 0 ? '+' : ''}${result.netProfitUsd.toLocaleString()}
                  </div>
                </div>

                {/* 4. Maximum Drawdown */}
                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Max Drawdown</span>
                    <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                  </div>
                  <div className="my-1.5">
                    <span
                      className={`text-2xl font-black tracking-tight ${
                        result.maxDrawdownPercent <= 8 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      -{result.maxDrawdownPercent}%
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    -${result.maxDrawdownUsd.toLocaleString()} {lang === 'id' ? 'penurunan max' : 'peak drop'}
                  </div>
                </div>

                {/* 5. Sharpe Ratio */}
                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between col-span-2 sm:col-span-1">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Sharpe Ratio</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="my-1.5">
                    <span
                      className={`text-2xl font-black tracking-tight ${
                        result.sharpeRatio >= 1.5 ? 'text-emerald-400' : 'text-slate-200'
                      }`}
                    >
                      {result.sharpeRatio}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {result.sharpeRatio >= 1.2
                      ? lang === 'id'
                        ? 'Kualitas Institusional'
                        : 'Institutional Grade'
                      : lang === 'id'
                      ? 'Volatilitas Wajar'
                      : 'Moderate Risk'}
                  </div>
                </div>
              </div>

              {/* Interactive Equity Curve Chart */}
              <div className="p-5 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      {lang === 'id' ? 'Kurva Pertumbuhan Modal (Equity Curve)' : 'Cumulative Equity Curve'}
                    </h3>
                    <span className="text-xs text-slate-400">
                      (Modal Awal: ${result.initialBalance.toLocaleString()} ➔ Saldo Akhir: ${result.finalBalance.toLocaleString()})
                    </span>
                  </div>

                  {hoveredPoint && (
                    <div className="px-3 py-1 rounded-lg bg-slate-700/80 border border-slate-600 text-xs flex items-center gap-3">
                      <span className="text-slate-300">{hoveredPoint.date}</span>
                      <span className="font-bold text-emerald-400">${hoveredPoint.equity.toLocaleString()}</span>
                      <span className="text-rose-400">DD: -{hoveredPoint.dd}%</span>
                    </div>
                  )}
                </div>

                {/* SVG Chart Render */}
                <div className="relative w-full h-56 bg-slate-950/60 rounded-xl border border-slate-800 p-2 overflow-hidden">
                  {result.equityCurve && result.equityCurve.length > 1 ? (
                    <svg
                      className="w-full h-full"
                      viewBox="0 0 800 200"
                      preserveAspectRatio="none"
                      onMouseLeave={() => setHoveredPoint(null)}
                    >
                      <defs>
                        <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Horizontal Grid lines */}
                      <line x1="0" y1="40" x2="800" y2="40" stroke="#334155" strokeWidth="0.75" strokeDasharray="4 4" />
                      <line x1="0" y1="100" x2="800" y2="100" stroke="#334155" strokeWidth="0.75" strokeDasharray="4 4" />
                      <line x1="0" y1="160" x2="800" y2="160" stroke="#334155" strokeWidth="0.75" strokeDasharray="4 4" />

                      {(() => {
                        const pts = result.equityCurve;
                        const minEq = Math.min(...pts.map((p) => p.equity)) * 0.98;
                        const maxEq = Math.max(...pts.map((p) => p.equity)) * 1.02;
                        const range = maxEq - minEq || 1;

                        const coordinates = pts.map((p, idx) => {
                          const x = (idx / (pts.length - 1)) * 780 + 10;
                          const y = 180 - ((p.equity - minEq) / range) * 150;
                          return { x, y, ...p };
                        });

                        const pathData = coordinates.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');
                        const areaData = `${pathData} L ${coordinates[coordinates.length - 1].x} 190 L ${coordinates[0].x} 190 Z`;

                        return (
                          <>
                            {/* Area Fill */}
                            <path d={areaData} fill="url(#equityGradient)" />
                            {/* Line */}
                            <path d={pathData} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                            {/* Trade Dots & Hover Targets */}
                            {coordinates.map((pt, i) => (
                              <g key={i}>
                                <circle
                                  cx={pt.x}
                                  cy={pt.y}
                                  r={i === 0 || i === coordinates.length - 1 ? 4 : 2.5}
                                  className="fill-emerald-400 stroke-slate-900"
                                  strokeWidth="1.5"
                                />
                                <rect
                                  x={pt.x - 10}
                                  y={0}
                                  width={20}
                                  height={200}
                                  fill="transparent"
                                  className="cursor-pointer"
                                  onMouseEnter={() =>
                                    setHoveredPoint({
                                      x: pt.x,
                                      y: pt.y,
                                      equity: pt.equity,
                                      date: pt.date,
                                      dd: pt.drawdownPercent,
                                    })
                                  }
                                />
                              </g>
                            ))}
                          </>
                        );
                      })()}
                    </svg>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-slate-500">
                      {lang === 'id' ? 'Menunggu kalkulasi lilin historis...' : 'Awaiting historical data...'}
                    </div>
                  )}
                </div>
              </div>

              {/* Indicator Context & Strategy Rationale */}
              <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-800/40 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="space-y-1 text-xs">
                  <div className="font-bold text-white flex items-center gap-2">
                    <span>{activeMeta.name}</span>
                    <span className="text-[11px] text-blue-300 font-normal">• {activeMeta.origin}</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">{activeMeta.description}</p>
                  <p className="text-[11px] text-slate-400 font-medium">
                    <span className="text-slate-300 font-semibold">{lang === 'id' ? 'Verifikasi Standard:' : 'Verification Standard:'} </span>
                    {activeMeta.verificationSource}
                  </p>
                </div>
              </div>

              {/* Sub-Metrics Table */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/40">
                  <span className="text-slate-400">{lang === 'id' ? 'Rata-rata Trade' : 'Avg Trade PnL'}</span>
                  <div className="font-bold text-slate-200 mt-0.5">
                    {result.averageTradePnlPercent >= 0 ? '+' : ''}
                    {result.averageTradePnlPercent}%
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/40">
                  <span className="text-slate-400">{lang === 'id' ? 'Rata-rata Menang' : 'Avg Win'}</span>
                  <div className="font-bold text-emerald-400 mt-0.5">+{result.averageWinPercent}%</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/40">
                  <span className="text-slate-400">{lang === 'id' ? 'Rata-rata Kalah' : 'Avg Loss'}</span>
                  <div className="font-bold text-rose-400 mt-0.5">-{result.averageLossPercent}%</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/40">
                  <span className="text-slate-400">{lang === 'id' ? 'Rasio Risiko / Imbalan' : 'Target RRR'}</span>
                  <div className="font-bold text-slate-200 mt-0.5">{config.takeProfitRRR} : 1</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VERIFIED PARAMETERS VIEW */}
          {activeTab === 'parameters' && (
            <div className="space-y-6">
              {/* Header explanation */}
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-blue-400" />
                    {lang === 'id' ? 'Parameter Terverifikasi untuk' : 'Verified Parameters for'} {activeMeta.name}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
                    {lang === 'id'
                      ? 'Parameter berikut telah diverifikasi berdasarkan literatur kuantitatif dan standar perdagangan pasar institusional. Anda dapat menyesuaikan nilai untuk menguji ketahanan strategi atau menekan tombol reset untuk kembali ke konfigurasi standar.'
                      : 'The following parameters are mathematically verified against quantitative research and institutional market conventions.'}
                  </p>
                </div>
                <button
                  onClick={handleResetParameters}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-slate-200 transition shrink-0 flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {lang === 'id' ? 'Reset Standar' : 'Reset Defaults'}
                </button>
              </div>

              {/* Indicator-specific parameter controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeMeta.parameters.map((param) => {
                  const currentValue =
                    (params as any)[selectedIndicator]?.[param.key] ?? param.defaultValue;

                  return (
                    <div
                      key={param.key}
                      className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-white">{param.label}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{param.description}</div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          Std: {param.defaultValue}
                          {param.unit ? ` ${param.unit}` : ''}
                        </span>
                      </div>

                      <div className="flex items-center gap-4">
                        <input
                          type="range"
                          min={param.min}
                          max={param.max}
                          step={param.step}
                          value={currentValue}
                          onChange={(e) =>
                            handleParamChange(selectedIndicator, param.key, Number(e.target.value))
                          }
                          className="flex-1 accent-blue-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                        />
                        <input
                          type="number"
                          min={param.min}
                          max={param.max}
                          step={param.step}
                          value={currentValue}
                          onChange={(e) =>
                            handleParamChange(selectedIndicator, param.key, Number(e.target.value))
                          }
                          className="w-20 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs font-bold text-white text-right focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Global Risk & Money Management Parameters */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  {lang === 'id' ? 'Parameter Manajemen Risiko & Eksekusi' : 'Risk & Execution Settings'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  {/* Modal Awal */}
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-medium">
                      {lang === 'id' ? 'Modal Awal ($ USDT)' : 'Initial Balance ($)'}
                    </label>
                    <input
                      type="number"
                      value={config.initialCapital}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, initialCapital: Number(e.target.value) }))
                      }
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 font-bold focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Stop Loss % */}
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-medium">Stop Loss (%)</label>
                    <input
                      type="number"
                      step={0.1}
                      value={config.stopLossPercent}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, stopLossPercent: Number(e.target.value) }))
                      }
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 font-bold focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Take Profit RRR */}
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-medium">
                      {lang === 'id' ? 'Rasio TP : SL (RRR)' : 'Take Profit RRR'}
                    </label>
                    <input
                      type="number"
                      step={0.2}
                      value={config.takeProfitRRR}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, takeProfitRRR: Number(e.target.value) }))
                      }
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 font-bold focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TRADES LOG VIEW */}
          {activeTab === 'trades' && result && (
            <div className="space-y-4">
              {/* Filter and Export Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700/60 text-xs">
                  <button
                    onClick={() => setTradeFilter('ALL')}
                    className={`px-3 py-1 rounded-md transition ${
                      tradeFilter === 'ALL'
                        ? 'bg-blue-600 text-white font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {lang === 'id' ? 'Semua' : 'All'} ({result.trades.length})
                  </button>
                  <button
                    onClick={() => setTradeFilter('WIN')}
                    className={`px-3 py-1 rounded-md transition ${
                      tradeFilter === 'WIN'
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {lang === 'id' ? 'Menang' : 'Wins'} ({result.winningTrades})
                  </button>
                  <button
                    onClick={() => setTradeFilter('LOSS')}
                    className={`px-3 py-1 rounded-md transition ${
                      tradeFilter === 'LOSS'
                        ? 'bg-rose-600 text-white font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {lang === 'id' ? 'Kalah' : 'Losses'} ({result.losingTrades})
                  </button>
                </div>

                <button
                  onClick={handleExportCSV}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  {lang === 'id' ? 'Unduh Laporan CSV' : 'Export CSV'}
                </button>
              </div>

              {/* Trades Table */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 overflow-hidden">
                <div className="overflow-x-auto max-h-[50vh]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-800/90 text-slate-300 font-semibold sticky top-0 border-b border-slate-700">
                      <tr>
                        <th className="py-2.5 px-3">ID</th>
                        <th className="py-2.5 px-3">{lang === 'id' ? 'Posisi' : 'Side'}</th>
                        <th className="py-2.5 px-3">{lang === 'id' ? 'Masuk' : 'Entry'}</th>
                        <th className="py-2.5 px-3">{lang === 'id' ? 'Keluar' : 'Exit'}</th>
                        <th className="py-2.5 px-3">{lang === 'id' ? 'Durasi' : 'Duration'}</th>
                        <th className="py-2.5 px-3">PnL %</th>
                        <th className="py-2.5 px-3">PnL ($)</th>
                        <th className="py-2.5 px-3">{lang === 'id' ? 'Alasan Keluar' : 'Reason'}</th>
                        <th className="py-2.5 px-3">{lang === 'id' ? 'Hasil' : 'Result'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredTrades.length > 0 ? (
                        filteredTrades.map((trade) => {
                          const isWin = trade.result === 'WIN';
                          return (
                            <tr key={trade.id} className="hover:bg-slate-800/40 transition">
                              <td className="py-2 px-3 font-mono text-slate-400">{trade.id}</td>
                              <td className="py-2 px-3">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                                    trade.direction === 'LONG'
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  }`}
                                >
                                  {trade.direction === 'LONG' ? (
                                    <ArrowUpRight className="w-3 h-3" />
                                  ) : (
                                    <ArrowDownRight className="w-3 h-3" />
                                  )}
                                  {trade.direction}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-slate-200 font-mono">
                                ${formatCryptoPrice(trade.entryPrice)}
                              </td>
                              <td className="py-2 px-3 text-slate-200 font-mono">
                                ${formatCryptoPrice(trade.exitPrice)}
                              </td>
                              <td className="py-2 px-3 text-slate-400 font-mono">{trade.holdingBars} bars</td>
                              <td
                                className={`py-2 px-3 font-bold font-mono ${
                                  trade.pnlPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                }`}
                              >
                                {trade.pnlPercent >= 0 ? '+' : ''}
                                {trade.pnlPercent}%
                              </td>
                              <td
                                className={`py-2 px-3 font-bold font-mono ${
                                  trade.pnlUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                }`}
                              >
                                {trade.pnlUsd >= 0 ? '+' : ''}${trade.pnlUsd.toLocaleString()}
                              </td>
                              <td className="py-2 px-3 text-slate-400 text-[11px]">
                                {trade.exitReason === 'TAKE_PROFIT'
                                  ? '🎯 Take Profit'
                                  : trade.exitReason === 'STOP_LOSS'
                                  ? '🛑 Stop Loss'
                                  : '🔄 Sinyal Berlawanan'}
                              </td>
                              <td className="py-2 px-3">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    isWin
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  }`}
                                >
                                  {isWin ? 'WIN' : 'LOSS'}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={9} className="py-8 text-center text-slate-500">
                            {lang === 'id'
                              ? 'Tidak ada transaksi dengan filter ini.'
                              : 'No trades found with this filter.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>
              {lang === 'id'
                ? 'Seluruh 10 indikator diuji dengan parameter standar institusional.'
                : 'All 10 indicators verified using institutional standard parameters.'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            {lang === 'id' ? 'Tutup' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
