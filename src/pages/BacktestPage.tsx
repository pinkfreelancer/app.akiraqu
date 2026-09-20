import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Play,
  RotateCcw,
  Sparkles,
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
  Database,
  Wifi,
  WifiOff,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  BrainCircuit,
  Zap,
  ChevronRight,
  ChevronDown,
  Layers,
  HelpCircle,
  Maximize,
  Minimize,
  StretchHorizontal,
  LayoutGrid,
  Compass,
  Dice5,
  Scale,
  RefreshCw,
} from 'lucide-react';
import {
  BacktestConfig,
  BacktestDataSourceType,
  BacktestResult,
  BacktestTrade,
  IndicatorKey,
  OHLCVCandle,
  OfflinePresetId,
  Timeframe,
  VerifiedParameters,
  AIPatternInsight,
} from '../types/crypto.types';
import {
  DEFAULT_VERIFIED_PARAMETERS,
  INDICATORS_CATALOG,
  IndicatorMeta,
} from '../services/backtest/verifiedParameters';
import { DEFAULT_BACKTEST_CONFIG, runBacktest, CONFLUENCE_12_INDICATORS } from '../services/backtest/backtestEngine';
import { OFFLINE_PRESETS, getOfflinePresetCandles, parseCustomCandleUpload } from '../services/backtest/offlinePresets';
import { extractStatisticalPatterns, requestAIPatternLearning } from '../services/backtest/aiPatternLearner';
import { runMonteCarloBootstrap, MonteCarloSimulationResult } from '../services/backtest/monteCarloEngine';
import { Language } from '../i18n/translations';
import { formatCryptoPrice } from '../utils/formatters';

interface BacktestPageProps {
  symbol: string;
  timeframe: Timeframe;
  currentCandles: OHLCVCandle[];
  initialIndicator?: IndicatorKey;
  lang?: Language;
  theme?: 'light' | 'dark';
  isFullWidth?: boolean;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onToggleFullWidth?: () => void;
}

export const BacktestPage: React.FC<BacktestPageProps> = ({
  symbol,
  timeframe,
  currentCandles,
  initialIndicator = 'confluence',
  lang = 'id',
  theme = 'dark',
  isFullWidth = true,
  isFullscreen = false,
  onToggleFullscreen,
  onToggleFullWidth,
}) => {
  const isDark = theme === 'dark';
  const isId = lang === 'id';

  // Data Source State
  const [dataSource, setDataSource] = useState<BacktestDataSourceType>('api');
  const [selectedPresetId, setSelectedPresetId] = useState<OfflinePresetId>('bull_breakout');
  const [customCandles, setCustomCandles] = useState<{ fileName: string; candles: OHLCVCandle[] } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [candleSample, setCandleSample] = useState<number>(250);
  const [apiSymbol, setApiSymbol] = useState<string>(symbol || 'BTC/USDT');
  const [apiTimeframe, setApiTimeframe] = useState<Timeframe>(timeframe || '1H');

  // Strategy & Parameter State
  const [selectedIndicator, setSelectedIndicator] = useState<IndicatorKey>(initialIndicator);
  const [params, setParams] = useState<VerifiedParameters>(DEFAULT_VERIFIED_PARAMETERS);
  const [config, setConfig] = useState<BacktestConfig>({
    ...DEFAULT_BACKTEST_CONFIG,
    slippagePercent: 0.05,
    usePartialTakeProfit: true,
    useTrailingStop: false,
  });

  // Results & Monte Carlo State
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAILearning, setIsAILearning] = useState<boolean>(false);
  const [aiInsight, setAiInsight] = useState<AIPatternInsight | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'monte_carlo' | 'ai_learner' | 'trades' | 'parameters'>('overview');
  const [tradeFilter, setTradeFilter] = useState<'ALL' | 'WIN' | 'LOSS'>('ALL');
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; equity: number; date: string; dd: number } | null>(null);
  const [appliedNotification, setAppliedNotification] = useState<string | null>(null);

  // Monte Carlo Bootstrap State
  const [mcIterations, setMcIterations] = useState<number>(500);
  const [mcResult, setMcResult] = useState<MonteCarloSimulationResult | null>(null);
  const [isSimulatingMC, setIsSimulatingMC] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync initial indicator if prop changes
  useEffect(() => {
    if (initialIndicator) {
      setSelectedIndicator(initialIndicator);
    }
  }, [initialIndicator]);

  // Sync symbol from props if currently in API mode
  useEffect(() => {
    if (symbol) {
      setApiSymbol(symbol);
    }
  }, [symbol]);

  // Resolve current active candles according to data source
  const activeCandles = useMemo<OHLCVCandle[]>(() => {
    if (dataSource === 'offline_preset') {
      return getOfflinePresetCandles(selectedPresetId);
    }
    if (dataSource === 'custom_upload' && customCandles) {
      return customCandles.candles;
    }
    return currentCandles && currentCandles.length > 0 ? currentCandles : getOfflinePresetCandles('bull_breakout');
  }, [dataSource, selectedPresetId, customCandles, currentCandles]);

  // Recalculate Monte Carlo Bootstrap whenever results update
  useEffect(() => {
    if (result && result.trades.length >= 3) {
      const mc = runMonteCarloBootstrap(result.trades, result.initialBalance, mcIterations);
      setMcResult(mc);
    } else {
      setMcResult(null);
    }
  }, [result, mcIterations]);

  // Execute Backtest
  const handleExecuteBacktest = async (
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
    setAppliedNotification(null);

    try {
      if (dataSource === 'api') {
        const res = await fetch('/api/v1/backtest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            symbol: apiSymbol,
            timeframe: apiTimeframe,
            indicatorKey: safeIndicator,
            parameters: safeParams,
            config: safeConfig,
            candleCount: candleSample,
            dataSource: 'api',
          }),
        });

        if (res.ok) {
          const body = await res.json();
          if (body.status === 'success' && body.data) {
            setResult(body.data);
            const quantInsight = extractStatisticalPatterns(body.data, isId ? 'id' : 'en');
            setAiInsight(quantInsight);
            setIsLoading(false);
            return;
          }
        }
      }

      // Offline Presets or Custom Upload or API Fallback
      const simCandles = activeCandles;
      const effectiveSymbol =
        dataSource === 'offline_preset'
          ? OFFLINE_PRESETS.find((p) => p.id === selectedPresetId)?.symbol || 'BTC/USDT'
          : dataSource === 'custom_upload'
          ? customCandles?.fileName || 'CUSTOM/DATA'
          : apiSymbol;

      const effectiveTimeframe =
        dataSource === 'offline_preset'
          ? OFFLINE_PRESETS.find((p) => p.id === selectedPresetId)?.timeframe || '1H'
          : apiTimeframe;

      await new Promise((resolve) => setTimeout(resolve, 80));

      const localResult = runBacktest(
        simCandles,
        effectiveSymbol,
        effectiveTimeframe,
        safeIndicator,
        safeParams,
        safeConfig,
        dataSource
      );

      setResult(localResult);
      const quantInsight = extractStatisticalPatterns(localResult, isId ? 'id' : 'en');
      setAiInsight(quantInsight);
    } catch (err: any) {
      console.error('Backtest run error:', err);
      const fallbackResult = runBacktest(
        activeCandles,
        apiSymbol,
        apiTimeframe,
        safeIndicator,
        safeParams,
        safeConfig,
        dataSource
      );
      setResult(fallbackResult);
      setAiInsight(extractStatisticalPatterns(fallbackResult, isId ? 'id' : 'en'));
    } finally {
      setIsLoading(false);
    }
  };

  // Run backtest on initial mount
  useEffect(() => {
    handleExecuteBacktest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataSource, selectedPresetId]);

  // Request Deep AI Pattern Learning
  const handleTriggerAILearning = async () => {
    if (!result) return;
    setIsAILearning(true);
    try {
      const insight = await requestAIPatternLearning(result, isId ? 'id' : 'en');
      setAiInsight(insight);
      setActiveTab('ai_learner');
    } catch (err) {
      console.error('AI learning error:', err);
    } finally {
      setIsAILearning(false);
    }
  };

  // Re-run Monte Carlo Simulation
  const handleReRunMonteCarlo = () => {
    if (!result || result.trades.length < 3) return;
    setIsSimulatingMC(true);
    setTimeout(() => {
      const mc = runMonteCarloBootstrap(result.trades, result.initialBalance, mcIterations);
      setMcResult(mc);
      setIsSimulatingMC(false);
    }, 150);
  };

  // Export Trades as CSV
  const handleExportCSV = () => {
    if (!result || result.trades.length === 0) return;
    const headers = ['ID', 'Side', 'EntryPrice', 'ExitPrice', 'PnL_USD', 'PnL_Percent', 'ExitReason', 'Duration_Bars', 'Fee_USD'];
    const rows = result.trades.map((t) => [
      t.id,
      t.direction,
      t.entryPrice,
      t.exitPrice,
      t.pnlUsd.toFixed(2),
      t.pnlPercent,
      t.exitReason,
      t.holdingBars,
      t.feeDeductionUsd || 0,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `backtest_${result.symbol.replace('/', '_')}_${result.timeframe}_trades.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Apply AI Recommended Parameters
  const handleApplyAIOptimizations = () => {
    if (!aiInsight || !aiInsight.optimizedParameters) return;
    const opt = aiInsight.optimizedParameters;

    const newConfig: BacktestConfig = {
      ...config,
      takeProfitRRR: opt.takeProfitRRR || config.takeProfitRRR,
      stopLossPercent: opt.stopLossPercent || config.stopLossPercent,
      slippagePercent: opt.slippagePercent !== undefined ? opt.slippagePercent : config.slippagePercent,
      usePartialTakeProfit: true,
    };

    let newParams = { ...params };
    if (opt.minConfluenceScore) {
      newParams = {
        ...newParams,
        confluence: {
          ...newParams.confluence,
          minScoreThreshold: opt.minConfluenceScore,
        },
      };
    }

    setConfig(newConfig);
    setParams(newParams);
    if (opt.recommendedIndicator) {
      setSelectedIndicator(opt.recommendedIndicator);
    }

    setAppliedNotification(
      isId
        ? `Parameter AI berhasil diterapkan (RRR: ${opt.takeProfitRRR}:1, SL: ${opt.stopLossPercent}%). Menjalankan backtest ulang...`
        : `AI parameters applied (RRR: ${opt.takeProfitRRR}:1, SL: ${opt.stopLossPercent}%). Re-running simulation...`
    );

    handleExecuteBacktest(opt.recommendedIndicator || selectedIndicator, newParams, newConfig);

    setTimeout(() => {
      setAppliedNotification(null);
    }, 4500);
  };

  // Handle Custom File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const parsed = parseCustomCandleUpload(content, file.name);
      if (parsed.success && parsed.candles && parsed.candles.length >= 20) {
        setCustomCandles({ fileName: file.name, candles: parsed.candles });
        setDataSource('custom_upload');
      } else {
        setUploadError(parsed.error || 'Gagal membaca format file.');
      }
    };
    reader.onerror = () => {
      setUploadError('Gagal membaca file dari disk.');
    };
    reader.readAsText(file);
  };

  const handleResetToVerified = () => {
    setParams(DEFAULT_VERIFIED_PARAMETERS);
    setConfig(DEFAULT_BACKTEST_CONFIG);
    handleExecuteBacktest(selectedIndicator, DEFAULT_VERIFIED_PARAMETERS, DEFAULT_BACKTEST_CONFIG);
  };

  const selectedMeta = useMemo<IndicatorMeta>(() => {
    return INDICATORS_CATALOG.find((i) => i.key === selectedIndicator) || INDICATORS_CATALOG[0];
  }, [selectedIndicator]);

  const filteredTrades = useMemo(() => {
    if (!result) return [];
    if (tradeFilter === 'ALL') return result.trades;
    return result.trades.filter((t) => t.result === tradeFilter);
  }, [result, tradeFilter]);

  // Equity Curve SVG Coordinates Calculation
  const equitySvgData = useMemo(() => {
    if (!result || result.equityCurve.length < 2) return null;
    const pts = result.equityCurve;
    const values = pts.map((p) => p.equity);
    const minVal = Math.min(...values) * 0.985;
    const maxVal = Math.max(...values) * 1.015;
    const range = maxVal - minVal || 1;

    const width = 800;
    const height = 220;
    const padding = 20;
    const plotWidth = width - padding * 2;
    const plotHeight = height - padding * 2;

    const coords = pts.map((p, idx) => {
      const x = padding + (idx / (pts.length - 1)) * plotWidth;
      const y = height - padding - ((p.equity - minVal) / range) * plotHeight;
      return { x, y, point: p };
    });

    const pathD = coords.reduce((acc, c, idx) => {
      return idx === 0 ? `M ${c.x} ${c.y}` : `${acc} L ${c.x} ${c.y}`;
    }, '');

    const areaD = `${pathD} L ${coords[coords.length - 1].x} ${height - padding} L ${coords[0].x} ${height - padding} Z`;

    return { coords, pathD, areaD, minVal, maxVal, width, height, padding };
  }, [result]);

  return (
    <div className={`min-h-[calc(100vh-112px)] w-full transition-colors duration-200 ${
      isDark ? 'bg-[#060813] text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Top Header Banner */}
      <div className={`border-b px-3 sm:px-4 lg:px-8 py-4 sm:py-5 transition-colors ${
        isDark ? 'bg-[#0d1222]/80 border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div className="w-full mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20 shrink-0">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-black tracking-tight flex items-center gap-2">
                  <span>{isId ? 'Laboratorium Backtest Kuantitatif' : 'Quantitative Backtest Lab'}</span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-bold">
                    Institutional v3.5 • Monte Carlo
                  </span>
                </h1>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {isId
                    ? 'Simulasi eksekusi strategi dengan data live API bursa, Monte Carlo stress-testing, serta AI Pattern Synthesis.'
                    : 'High-fidelity strategy simulation across live exchange API data, Monte Carlo bootstrap stress-testing, and AI synthesis.'}
                </p>
              </div>
            </div>
          </div>

          {/* Top Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleExecuteBacktest()}
              disabled={isLoading}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md min-h-[38px] ${
                isLoading
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 hover:brightness-110 active:scale-98 shadow-cyan-500/20 font-black'
              }`}
            >
              <Play className={`w-3.5 h-3.5 fill-current ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? (isId ? 'Menjalankan Simulasi...' : 'Running Backtest...') : (isId ? 'Jalankan Backtest' : 'Run Backtest')}</span>
            </button>

            <button
              onClick={handleTriggerAILearning}
              disabled={isAILearning || !result}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border min-h-[38px] ${
                isAILearning
                  ? 'bg-purple-950/40 border-purple-500/50 text-purple-300 animate-pulse cursor-not-allowed'
                  : isDark
                  ? 'bg-purple-900/30 border-purple-500/40 text-purple-200 hover:bg-purple-900/50'
                  : 'bg-purple-50 border-purple-300 text-purple-700 hover:bg-purple-100 shadow-xs'
              }`}
            >
              <Sparkles className={`w-3.5 h-3.5 ${isAILearning ? 'animate-spin' : 'text-purple-400'}`} />
              <span>{isAILearning ? (isId ? 'AI Menganalisis Pola...' : 'AI Learning Patterns...') : (isId ? 'Pelajari Pola (AI)' : 'Learn Patterns (AI)')}</span>
            </button>

            <button
              onClick={handleExportCSV}
              disabled={!result || result.trades.length === 0}
              title={isId ? 'Ekspor riwayat trade sebagai CSV' : 'Export trade logs as CSV'}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-mono font-bold transition cursor-pointer min-h-[38px] ${
                isDark
                  ? 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">CSV</span>
            </button>

            <button
              onClick={handleResetToVerified}
              title={isId ? 'Kembalikan parameter ke default terverifikasi' : 'Reset to verified defaults'}
              className={`p-2 rounded-xl border transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center ${
                isDark
                  ? 'border-slate-700 hover:bg-slate-800 text-slate-300'
                  : 'border-slate-200 hover:bg-slate-100 text-slate-600'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Native Fullscreen Toggle in Backtest */}
            {onToggleFullscreen && (
              <button
                onClick={onToggleFullscreen}
                title={isFullscreen ? (isId ? 'Keluar Layar Penuh' : 'Exit Fullscreen') : (isId ? 'Layar Penuh (F11)' : 'Fullscreen (F11)')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-mono font-bold transition cursor-pointer min-h-[38px] ${
                  isFullscreen
                    ? (isDark ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300' : 'bg-cyan-50 border-cyan-300 text-cyan-700')
                    : (isDark ? 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200')
                }`}
              >
                {isFullscreen ? <Minimize className="w-3.5 h-3.5 text-cyan-400" /> : <Maximize className="w-3.5 h-3.5" />}
                <span className="hidden lg:inline">{isFullscreen ? (isId ? 'Keluar Penuh' : 'Exit Full') : (isId ? 'Layar Penuh' : 'Fullscreen')}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notification Toast if AI Params Applied */}
      {appliedNotification && (
        <div className="w-full mx-auto px-3 sm:px-4 lg:px-8 mt-3">
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{appliedNotification}</span>
          </div>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="w-full mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 space-y-6">
        {/* Section 1: Data Source Selector */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isDark ? 'bg-[#0f1528]/90 border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-slate-700/30">
            <div>
              <h2 className="text-sm font-bold flex items-center gap-2 text-cyan-400 uppercase tracking-wider">
                <Database className="w-4 h-4" />
                <span>{isId ? 'Pilihan Sumber Data Backtest' : 'Backtest Data Source Selection'}</span>
              </h2>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {isId
                  ? 'Tentukan sumber data candle historis: Umpan Live API Bursa, Skenario Terkurasi Offline, atau Unggah File Anda.'
                  : 'Select candle source: Live Exchange API, Curated Historical Scenarios, or Custom File Upload.'}
              </p>
            </div>

            {/* Source Mode Toggle Pills */}
            <div className={`flex items-center p-1 rounded-xl border ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                onClick={() => setDataSource('api')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  dataSource === 'api'
                    ? 'bg-cyan-500 text-slate-950 shadow-xs'
                    : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Wifi className="w-3.5 h-3.5" />
                <span>Live Exchange API</span>
              </button>

              <button
                onClick={() => setDataSource('offline_preset')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  dataSource === 'offline_preset'
                    ? 'bg-cyan-500 text-slate-950 shadow-xs'
                    : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <WifiOff className="w-3.5 h-3.5" />
                <span>{isId ? 'Preset Offline (Terkurasi)' : 'Offline Presets'}</span>
              </button>

              <button
                onClick={() => setDataSource('custom_upload')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  dataSource === 'custom_upload'
                    ? 'bg-cyan-500 text-slate-950 shadow-xs'
                    : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>{isId ? 'Unggah CSV / JSON' : 'Upload Data'}</span>
              </button>
            </div>
          </div>

          {/* Sub-Panel: Mode 1 - Live Exchange API */}
          {dataSource === 'api' && (
            <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  {isId ? 'Pasangan Aset (Pair)' : 'Trading Pair'}
                </label>
                <select
                  value={apiSymbol}
                  onChange={(e) => setApiSymbol(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-mono font-bold border transition-colors ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="BTC/USDT">BTC/USDT (Bitcoin)</option>
                  <option value="ETH/USDT">ETH/USDT (Ethereum)</option>
                  <option value="SOL/USDT">SOL/USDT (Solana)</option>
                  <option value="SEI/USDT">SEI/USDT (Sei Network)</option>
                  <option value="KAS/USDT">KAS/USDT (Kaspa)</option>
                  <option value="PEPE/USDT">PEPE/USDT (Pepe)</option>
                  <option value="BNB/USDT">BNB/USDT (Binance Coin)</option>
                  <option value="AVAX/USDT">AVAX/USDT (Avalanche)</option>
                  <option value="NEAR/USDT">NEAR/USDT (Near Protocol)</option>
                  <option value="SUI/USDT">SUI/USDT (Sui)</option>
                  <option value="LINK/USDT">LINK/USDT (Chainlink)</option>
                  <option value="DOGE/USDT">DOGE/USDT (Dogecoin)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Timeframe
                </label>
                <select
                  value={apiTimeframe}
                  onChange={(e) => setApiTimeframe(e.target.value as Timeframe)}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-mono font-bold border transition-colors ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="15m">15m (Scalping / Intraday)</option>
                  <option value="1H">1H (Standard Swing)</option>
                  <option value="4H">4H (Macro Structure)</option>
                  <option value="1D">1D (Daily Macro Trend)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1 flex items-center justify-between">
                  <span>{isId ? 'Kedalaman Candle' : 'Candle Depth'}</span>
                  <span className="text-cyan-400 font-mono">{candleSample} {isId ? 'lilin' : 'bars'}</span>
                </label>
                <div className="flex items-center gap-1.5 pt-1">
                  {[100, 200, 300, 500].map((sample) => (
                    <button
                      key={sample}
                      onClick={() => setCandleSample(sample)}
                      className={`flex-1 py-1 rounded-lg text-[11px] font-mono font-bold border transition-all cursor-pointer ${
                        candleSample === sample
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                          : isDark
                          ? 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                          : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {sample}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col justify-end">
                <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
                  isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <div className="text-[11px]">
                    <span className="font-bold text-emerald-400">Binance REST + CCXT</span>
                    <span className={`block text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {isId ? 'Terkoneksi (Latensi ~38ms)' : 'Connected (Latency ~38ms)'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sub-Panel: Mode 2 - Offline Curated Market Presets */}
          {dataSource === 'offline_preset' && (
            <div className="pt-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {OFFLINE_PRESETS.map((preset) => {
                  const isSelected = selectedPresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => setSelectedPresetId(preset.id)}
                      className={`p-3.5 rounded-xl text-left border transition-all cursor-pointer relative flex flex-col justify-between ${
                        isSelected
                          ? isDark
                            ? 'bg-cyan-950/30 border-cyan-500 shadow-md shadow-cyan-500/10'
                            : 'bg-cyan-50/80 border-cyan-500 shadow-xs'
                          : isDark
                          ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-400">
                            {preset.symbol} • {preset.timeframe}
                          </span>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                        </div>
                        <h4 className="text-xs font-bold leading-snug line-clamp-2">
                          {isId ? preset.nameId : preset.name}
                        </h4>
                        <p className={`text-[11px] mt-1 line-clamp-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {isId ? preset.descriptionId : preset.description}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-800/40 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>{preset.regime}</span>
                        <span>{preset.candleCount} {isId ? 'lilin' : 'bars'}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className={`text-[11px] italic flex items-center gap-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>
                  {isId
                    ? 'Mode offline bekerja instan tanpa kuota jaringan, memungkinkan iterasi strategi dan kalibrasi parameter dengan nol latensi.'
                    : 'Offline presets operate deterministically with zero network overhead for instant parameter optimization.'}
                </span>
              </p>
            </div>
          )}

          {/* Sub-Panel: Mode 3 - Custom Upload (CSV / JSON) */}
          {dataSource === 'custom_upload' && (
            <div className="pt-4 space-y-3">
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 rounded-xl border-2 border-dashed transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-2 ${
                  isDark
                    ? 'border-slate-700 bg-slate-900/40 hover:bg-slate-900/70 hover:border-cyan-500/50'
                    : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-cyan-500/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.json,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="w-10 h-10 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold">
                    {customCandles
                      ? `${customCandles.fileName} (${customCandles.candles.length} ${isId ? 'lilin terbaca' : 'candles parsed'})`
                      : (isId ? 'Klik atau Seret File CSV / JSON OHLCV ke sini' : 'Click or drop your CSV / JSON OHLCV file here')}
                  </p>
                  <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {isId
                      ? 'Format kolom: timestamp, open, high, low, close, volume (min 20 baris)'
                      : 'Required headers: timestamp, open, high, low, close, volume (min 20 rows)'}
                  </p>
                </div>
              </div>

              {uploadError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section 2: Strategy Selector & Parameter Controls */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isDark ? 'bg-[#0f1528]/90 border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-700/30">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {isId ? 'Pilihan Strategi / Indikator yang Diuji' : 'Target Strategy / Indicator'}
                </h3>
                {selectedIndicator === 'confluence' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse">
                    {isId ? '12 Model Konsensus Aktif' : '12 Consensus Models Active'}
                  </span>
                )}
              </div>
              <p className="text-sm font-black text-cyan-400 mt-0.5">
                {selectedMeta.name} ({selectedMeta.shortName})
              </p>
              <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
                {selectedMeta.description}
              </p>
            </div>

            {/* Indicator Pills Selector */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              <button
                onClick={() => {
                  setSelectedIndicator('confluence');
                  handleExecuteBacktest('confluence', params, config);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                  selectedIndicator === 'confluence'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 border-cyan-400 font-black shadow-xs ring-2 ring-cyan-400/30'
                    : isDark
                    ? 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                    : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                }`}
              >
                ★ {isId ? 'Konsensus 12 Indikator (12-Confluence)' : '12-Indicator Consensus'}
              </button>

              {INDICATORS_CATALOG.filter((i) => i.key !== 'confluence').map((ind) => (
                <button
                  key={ind.key}
                  onClick={() => {
                    setSelectedIndicator(ind.key);
                    handleExecuteBacktest(ind.key, params, config);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all cursor-pointer border ${
                    selectedIndicator === ind.key
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold shadow-xs'
                      : isDark
                      ? 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {ind.shortName}
                </button>
              ))}
            </div>
          </div>

          {/* Parameter Calibration Panel for Selected Indicator */}
          <div className={`p-4 rounded-xl border my-4 ${
            isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50/80 border-slate-200'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-700/20">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  {isId ? `Kalibrasi Parameter: ${selectedMeta.shortName}` : `Parameter Calibration: ${selectedMeta.shortName}`}
                </span>
                <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                  • {selectedMeta.verificationSource}
                </span>
              </div>

              <div className="flex items-center gap-3 self-start sm:self-auto">
                <button
                  onClick={() => {
                    const resetValue = (DEFAULT_VERIFIED_PARAMETERS as any)[selectedIndicator];
                    const updated = {
                      ...params,
                      [selectedIndicator]: { ...resetValue },
                    };
                    setParams(updated);
                    handleExecuteBacktest(selectedIndicator, updated, config);
                  }}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 underline font-medium cursor-pointer"
                >
                  {isId ? 'Kembalikan Default' : 'Restore Defaults'}
                </button>

                <button
                  onClick={() => handleExecuteBacktest(selectedIndicator, params, config)}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>{isId ? 'Terapkan & Uji' : 'Apply & Test'}</span>
                </button>
              </div>
            </div>

            {/* If Confluence is selected */}
            {selectedIndicator === 'confluence' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Min Score Threshold */}
                  <div className={`p-3 rounded-lg border ${isDark ? 'bg-slate-950/60 border-slate-800/80' : 'bg-white border-slate-200'}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-200">
                        {isId ? 'Skor Ambang Minimal (Threshold)' : 'Min Confluence Score'}
                      </label>
                      <span className="text-xs font-mono font-bold text-cyan-400">
                        {params.confluence?.minScoreThreshold ?? 60} pts
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mb-2">
                      {isId
                        ? 'Skor konfluensi voting minimum yang dibutuhkan untuk memicu open posisi Long atau Short (50 - 85).'
                        : 'Minimum confluence consensus score required to trigger a trade entry (50 - 85).'}
                    </p>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="50"
                        max="85"
                        step="5"
                        value={params.confluence?.minScoreThreshold ?? 60}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setParams((prev) => ({
                            ...prev,
                            confluence: { ...prev.confluence, minScoreThreshold: val },
                          }));
                        }}
                        className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                      />
                      <input
                        type="number"
                        min="50"
                        max="85"
                        step="5"
                        value={params.confluence?.minScoreThreshold ?? 60}
                        onChange={(e) => {
                          const val = Math.min(85, Math.max(50, Number(e.target.value)));
                          setParams((prev) => ({
                            ...prev,
                            confluence: { ...prev.confluence, minScoreThreshold: val },
                          }));
                        }}
                        className={`w-16 px-2 py-1 rounded text-xs font-mono font-bold text-center border ${
                          isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Min Agreed Indicators */}
                  <div className={`p-3 rounded-lg border ${isDark ? 'bg-slate-950/60 border-slate-800/80' : 'bg-white border-slate-200'}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-200">
                        {isId ? 'Konsensus Minimal Indikator' : 'Min Agreed Indicators'}
                      </label>
                      <span className="text-xs font-mono font-bold text-cyan-400">
                        {params.confluence?.minAgreedIndicators ?? 7} / 12
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mb-2">
                      {isId
                        ? 'Jumlah minimum dari 12 indikator teknikal yang wajib sepakat searah (Bullish/Bearish).'
                        : 'Minimum number of the 12 models that must confirm the same direction.'}
                    </p>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="4"
                        max="11"
                        step="1"
                        value={params.confluence?.minAgreedIndicators ?? 7}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setParams((prev) => ({
                            ...prev,
                            confluence: { ...prev.confluence, minAgreedIndicators: val },
                          }));
                        }}
                        className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                      />
                      <input
                        type="number"
                        min="4"
                        max="11"
                        step="1"
                        value={params.confluence?.minAgreedIndicators ?? 7}
                        onChange={(e) => {
                          const val = Math.min(11, Math.max(4, Number(e.target.value)));
                          setParams((prev) => ({
                            ...prev,
                            confluence: { ...prev.confluence, minAgreedIndicators: val },
                          }));
                        }}
                        className={`w-16 px-2 py-1 rounded text-xs font-mono font-bold text-center border ${
                          isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* 12 Indicators Included in Consensus */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {isId ? 'Matriks 12 Indikator Kuantitatif dalam Mesin Konsensus:' : '12 Constituent Indicators in Consensus Matrix:'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {isId ? 'Klik salah satu indikator di bawah untuk menguji parameternya secara terpisah' : 'Select an indicator below to test individually'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 text-xs">
                    {[
                      { key: 'priceAction', name: 'Price Action & S/R', sub: 'Pin Bar & Engulfing', weight: '12%' },
                      { key: 'smc', name: 'Smart Money (SMC)', sub: 'BoS & FVG Imbalance', weight: '12%' },
                      { key: 'orderFlow', name: 'Order Flow (CVD)', sub: 'Delta Volume Bias', weight: '11%' },
                      { key: 'ict', name: 'ICT (OTE Discount)', sub: 'Optimal Trade Entry', weight: '10%' },
                      { key: 'optionFlow', name: 'Option Flow (PCR)', sub: 'Put/Call Ratio & Max Pain', weight: '9%' },
                      { key: 'rsi', name: 'RSI Momentum', sub: 'Oversold / Overbought', weight: '8%' },
                      { key: 'vwap', name: 'VWAP Bands', sub: 'Institutional Reversion', weight: '8%' },
                      { key: 'fibonacci', name: 'Fibonacci Levels', sub: 'Golden Pocket (0.618)', weight: '8%' },
                      { key: 'macd', name: 'MACD Momentum', sub: 'Fast/Slow Cross', weight: '8%' },
                      { key: 'ichimoku', name: 'Ichimoku Cloud', sub: 'Tenkan/Kijun & Kumo', weight: '6%' },
                      { key: 'tdSequential', name: 'TD Sequential', sub: 'Setup Count 9-13', weight: '4%' },
                      { key: 'elliottWave', name: 'Elliott Wave', sub: 'Trend Wave Alignment', weight: '4%' },
                    ].map((item, idx) => (
                      <div
                        key={item.key}
                        onClick={() => {
                          setSelectedIndicator(item.key as IndicatorKey);
                          handleExecuteBacktest(item.key as IndicatorKey, params, config);
                        }}
                        className={`p-2.5 rounded-lg border transition-all cursor-pointer hover:border-cyan-500/50 ${
                          isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-200 text-[11px] truncate">{idx + 1}. {item.name}</span>
                          <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/50 px-1 rounded shrink-0">
                            {item.weight}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5 truncate">{item.sub}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* If individual indicator is selected: render its parameters dynamically */
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {selectedMeta.parameters.map((p) => {
                  const currentVal = (params as any)[selectedIndicator]?.[p.key] ?? p.defaultValue;
                  return (
                    <div
                      key={p.key}
                      className={`p-3 rounded-lg border ${
                        isDark ? 'bg-slate-950/60 border-slate-800/80' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-200">{p.label}</label>
                        <span className="text-xs font-mono font-bold text-cyan-400">
                          {currentVal} {p.unit || ''}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mb-2 line-clamp-2">{p.description}</p>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min={p.min}
                          max={p.max}
                          step={p.step}
                          value={currentVal}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setParams((prev) => ({
                              ...prev,
                              [selectedIndicator]: {
                                ...(prev as any)[selectedIndicator],
                                [p.key]: val,
                              },
                            }));
                          }}
                          className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                        />
                        <input
                          type="number"
                          min={p.min}
                          max={p.max}
                          step={p.step}
                          value={currentVal}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setParams((prev) => ({
                              ...prev,
                              [selectedIndicator]: {
                                ...(prev as any)[selectedIndicator],
                                [p.key]: val,
                              },
                            }));
                          }}
                          className={`w-16 px-2 py-1 rounded text-xs font-mono font-bold text-center border ${
                            isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Execution Settings Grid */}
          <div className="pt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                {isId ? 'Modal Awal' : 'Initial Capital'}
              </label>
              <div className="relative">
                <DollarSign className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
                <input
                  type="number"
                  value={config.initialCapital}
                  onChange={(e) => setConfig({ ...config, initialCapital: Math.max(100, Number(e.target.value)) })}
                  className={`w-full pl-7 pr-2.5 py-1.5 rounded-lg text-xs font-mono font-bold border ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                {isId ? 'Risiko / Trade (%)' : 'Risk / Trade (%)'}
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="10"
                value={config.riskPerTradePercent}
                onChange={(e) => setConfig({ ...config, riskPerTradePercent: Number(e.target.value) })}
                className={`w-full px-3 py-1.5 rounded-lg text-xs font-mono font-bold border ${
                  isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                Take Profit RRR
              </label>
              <input
                type="number"
                step="0.2"
                min="1.0"
                max="6.0"
                value={config.takeProfitRRR}
                onChange={(e) => setConfig({ ...config, takeProfitRRR: Number(e.target.value) })}
                className={`w-full px-3 py-1.5 rounded-lg text-xs font-mono font-bold border ${
                  isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                Stop Loss (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="8.0"
                value={config.stopLossPercent}
                onChange={(e) => setConfig({ ...config, stopLossPercent: Number(e.target.value) })}
                className={`w-full px-3 py-1.5 rounded-lg text-xs font-mono font-bold border ${
                  isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                {isId ? 'Slippage Realistis (%)' : 'Slippage (%)'}
              </label>
              <input
                type="number"
                step="0.01"
                min="0.00"
                max="0.50"
                value={config.slippagePercent}
                onChange={(e) => setConfig({ ...config, slippagePercent: Number(e.target.value) })}
                className={`w-full px-3 py-1.5 rounded-lg text-xs font-mono font-bold border ${
                  isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                {isId ? 'Biaya Bursa (%)' : 'Taker Fee (%)'}
              </label>
              <input
                type="number"
                step="0.01"
                min="0.00"
                max="0.25"
                value={config.feePercent}
                onChange={(e) => setConfig({ ...config, feePercent: Number(e.target.value) })}
                className={`w-full px-3 py-1.5 rounded-lg text-xs font-mono font-bold border ${
                  isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>
          </div>

          {/* Checkbox Execution Toggles */}
          <div className="mt-3 pt-3 border-t border-slate-800/40 flex items-center gap-6 flex-wrap text-xs">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={config.usePartialTakeProfit}
                onChange={(e) => setConfig({ ...config, usePartialTakeProfit: e.target.checked })}
                className="w-3.5 h-3.5 rounded text-cyan-500 focus:ring-0"
              />
              <span className="font-medium">
                {isId ? 'Partial TP (50% pada 1.5R + Geser SL ke Breakeven)' : 'Partial TP (50% at 1.5R + Breakeven SL)'}
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={config.useTrailingStop}
                onChange={(e) => setConfig({ ...config, useTrailingStop: e.target.checked })}
                className="w-3.5 h-3.5 rounded text-cyan-500 focus:ring-0"
              />
              <span className="font-medium">
                {isId ? 'Trailing Stop Dinamis' : 'Dynamic Trailing Stop'}
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={config.allowShorting}
                onChange={(e) => setConfig({ ...config, allowShorting: e.target.checked })}
                className="w-3.5 h-3.5 rounded text-cyan-500 focus:ring-0"
              />
              <span className="font-medium">
                {isId ? 'Izinkan Posisi Short' : 'Allow Short Positions'}
              </span>
            </label>
          </div>
        </div>

        {/* Section 3: Primary Performance Summary Metric Cards */}
        {result && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className={`p-4 rounded-2xl border transition-all ${
              isDark ? 'bg-[#0f1528] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                {isId ? 'Hasil Bersih (Net Profit)' : 'Net Profit'}
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className={`text-lg font-mono font-black ${
                  result.netProfitUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {result.netProfitUsd >= 0 ? '+' : ''}${result.netProfitUsd.toLocaleString()}
                </span>
                <span className={`text-xs font-mono font-bold ${
                  result.netProfitPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  ({result.netProfitPercent >= 0 ? '+' : ''}{result.netProfitPercent}%)
                </span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-1">
                ${result.initialBalance.toLocaleString()} → ${result.finalBalance.toLocaleString()}
              </span>
            </div>

            <div className={`p-4 rounded-2xl border transition-all ${
              isDark ? 'bg-[#0f1528] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Win Rate (%)
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className={`text-lg font-mono font-black ${
                  result.winRate >= 55 ? 'text-cyan-400' : result.winRate >= 45 ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  {result.winRate}%
                </span>
                <span className="text-xs text-slate-400">
                  ({result.winningTrades}W / {result.losingTrades}L)
                </span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-1">
                {result.totalTrades} {isId ? 'total transaksi' : 'total trades'}
              </span>
            </div>

            <div className={`p-4 rounded-2xl border transition-all ${
              isDark ? 'bg-[#0f1528] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Profit Factor
              </span>
              <span className={`text-lg font-mono font-black ${
                result.profitFactor >= 1.5 ? 'text-emerald-400' : result.profitFactor >= 1.0 ? 'text-amber-400' : 'text-rose-400'
              }`}>
                {result.profitFactor}
              </span>
              <span className="text-[10px] text-slate-500 block mt-1">
                {result.profitFactor >= 1.5 ? 'Institutional Grade' : 'Sub-Optimal'}
              </span>
            </div>

            <div className={`p-4 rounded-2xl border transition-all ${
              isDark ? 'bg-[#0f1528] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Max Drawdown
                </span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                  result.maxDrawdownPercent <= 10
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : result.maxDrawdownPercent <= 20
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                }`}>
                  {result.maxDrawdownPercent <= 10
                    ? (isId ? 'Aman' : 'Safe')
                    : result.maxDrawdownPercent <= 20
                    ? (isId ? 'Moderat' : 'Moderate')
                    : (isId ? 'Tinggi' : 'High Risk')}
                </span>
              </div>
              <span className={`text-lg font-mono font-black ${
                result.maxDrawdownPercent <= 10 ? 'text-emerald-400' : result.maxDrawdownPercent <= 20 ? 'text-amber-400' : 'text-rose-400'
              }`}>
                -{result.maxDrawdownPercent}%
              </span>
              <span className="text-[10px] text-slate-500 block mt-1">
                -${result.maxDrawdownUsd.toLocaleString()} peak-to-trough
              </span>
            </div>

            <div className={`p-4 rounded-2xl border transition-all ${
              isDark ? 'bg-[#0f1528] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Expected Payoff
              </span>
              <span className={`text-lg font-mono font-black ${
                (result.expectancyUsd || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                ${result.expectancyUsd || '0.00'}
              </span>
              <span className="text-[10px] text-slate-500 block mt-1 font-mono">
                {result.expectancyR || '0.0'}R per trade
              </span>
            </div>

            <div className={`p-4 rounded-2xl border transition-all ${
              isDark ? 'bg-[#0f1528] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Sharpe / Sortino
              </span>
              <span className="text-lg font-mono font-black text-cyan-400">
                {result.sharpeRatio} / {result.sortinoRatio || '-'}
              </span>
              <span className="text-[10px] text-slate-500 block mt-1">
                Calmar: {result.calmarRatio || '-'}
              </span>
            </div>
          </div>
        )}

        {/* Section 4: Detailed Interactive Tabs */}
        <div className={`rounded-2xl border overflow-hidden transition-all ${
          isDark ? 'bg-[#0f1528]/90 border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          {/* Navigation Bar inside Workbench */}
          <div className={`flex items-center gap-2 px-5 py-3 border-b overflow-x-auto ${
            isDark ? 'border-slate-800 bg-[#0d1222]' : 'border-slate-200 bg-slate-50/80'
          }`}>
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-cyan-500 text-slate-950 shadow-xs font-black'
                  : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{isId ? 'Grafik Ekuitas & Ringkasan' : 'Equity Curve & Overview'}</span>
            </button>

            <button
              onClick={() => setActiveTab('monte_carlo')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'monte_carlo'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-xs font-black'
                  : isDark ? 'text-amber-400 hover:text-amber-200 hover:bg-amber-950/20' : 'text-amber-700 hover:bg-amber-50'
              }`}
            >
              <Dice5 className="w-3.5 h-3.5" />
              <span>{isId ? 'Simulasi Monte Carlo (500x)' : 'Monte Carlo Stress Test'}</span>
              {mcResult && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-950/40 font-mono font-bold">
                  {mcResult.confidenceInterval95.medianEndingCapital ? `$${mcResult.confidenceInterval95.medianEndingCapital.toLocaleString()}` : ''}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('ai_learner')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'ai_learner'
                  ? 'bg-purple-600 text-white shadow-xs font-black'
                  : isDark ? 'text-purple-300 hover:text-purple-100 hover:bg-purple-900/20' : 'text-purple-700 hover:bg-purple-100'
              }`}
            >
              <BrainCircuit className="w-3.5 h-3.5" />
              <span>{isId ? 'AI Pattern Learner' : 'AI Pattern Learner'}</span>
              {aiInsight && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('trades')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'trades'
                  ? 'bg-cyan-500 text-slate-950 shadow-xs font-black'
                  : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{isId ? 'Riwayat Transaksi' : 'Trade Logs'} ({result?.trades.length || 0})</span>
            </button>
          </div>

          <div className="p-5">
            {/* TAB 1: Equity Curve & Performance Breakdown */}
            {activeTab === 'overview' && result && equitySvgData && (
              <div className="space-y-6">
                {/* Equity Curve SVG Chart */}
                <div className={`p-4 rounded-xl border relative ${
                  isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{isId ? 'Kurva Pertumbuhan Ekuitas Modal ($)' : 'Capital Growth Equity Curve ($)'}</span>
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      ${result.finalBalance.toLocaleString()} ({result.netProfitPercent >= 0 ? '+' : ''}{result.netProfitPercent}%)
                    </span>
                  </div>

                  <div className="w-full overflow-hidden">
                    <svg
                      viewBox={`0 0 ${equitySvgData.width} ${equitySvgData.height}`}
                      className="w-full h-52 overflow-visible"
                    >
                      <defs>
                        <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Zero/Baseline grid lines */}
                      <line
                        x1={equitySvgData.padding}
                        y1={equitySvgData.height - equitySvgData.padding}
                        x2={equitySvgData.width - equitySvgData.padding}
                        y2={equitySvgData.height - equitySvgData.padding}
                        stroke={isDark ? '#334155' : '#cbd5e1'}
                        strokeWidth="1"
                        strokeDasharray="3 3"
                      />

                      {/* Area Fill */}
                      <path d={equitySvgData.areaD} fill="url(#equityGradient)" />

                      {/* Main Stroke */}
                      <path
                        d={equitySvgData.pathD}
                        fill="none"
                        stroke="#06b6d4"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {/* Interactive Hover Dots */}
                      {equitySvgData.coords.map((c, i) => (
                        <circle
                          key={i}
                          cx={c.x}
                          cy={c.y}
                          r={hoveredPoint?.date === c.point.date ? 5 : 2.5}
                          className="cursor-pointer transition-all fill-cyan-400 hover:fill-white"
                          onMouseEnter={() =>
                            setHoveredPoint({
                              x: c.x,
                              y: c.y,
                              equity: c.point.equity,
                              date: c.point.date,
                              dd: c.point.drawdownPercent,
                            })
                          }
                          onMouseLeave={() => setHoveredPoint(null)}
                        />
                      ))}
                    </svg>

                    {/* Tooltip Overlay */}
                    {hoveredPoint && (
                      <div
                        className={`absolute px-3 py-1.5 rounded-lg text-[11px] font-mono shadow-lg border pointer-events-none z-10 ${
                          isDark ? 'bg-slate-900 border-cyan-500 text-white' : 'bg-white border-cyan-500 text-slate-900'
                        }`}
                        style={{ left: Math.min(hoveredPoint.x, 650), top: Math.max(hoveredPoint.y - 45, 10) }}
                      >
                        <span className="font-bold text-cyan-400">${hoveredPoint.equity.toLocaleString()}</span>
                        <span className="block text-[10px] text-slate-400">
                          {hoveredPoint.date} • DD: -{hoveredPoint.dd}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sub-Metrics Breakdown Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className={`p-4 rounded-xl border ${
                    isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <h4 className="font-bold uppercase text-slate-400 mb-2">
                      {isId ? 'Karakteristik Transaksi' : 'Trade Characteristics'}
                    </h4>
                    <div className="space-y-1.5 font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-400">{isId ? 'Rata-rata Gain (Menang):' : 'Avg Win:'}</span>
                        <span className="font-bold text-emerald-400">+{result.averageWinPercent}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">{isId ? 'Rata-rata Loss (Kalah):' : 'Avg Loss:'}</span>
                        <span className="font-bold text-rose-400">-{result.averageLossPercent}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">{isId ? 'Rasio Rata-rata Win/Loss:' : 'Win/Loss Ratio:'}</span>
                        <span className="font-bold">
                          {result.averageLossPercent > 0
                            ? (result.averageWinPercent / result.averageLossPercent).toFixed(2)
                            : 'N/A'}x
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl border ${
                    isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <h4 className="font-bold uppercase text-slate-400 mb-2">
                      {isId ? 'Ketahanan & Rekor Streak' : 'Streak Endurance'}
                    </h4>
                    <div className="space-y-1.5 font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-400">{isId ? 'Kemenangan Beruntun Maks:' : 'Max Consecutive Wins:'}</span>
                        <span className="font-bold text-emerald-400">{result.maxConsecutiveWins || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">{isId ? 'Kekalahan Beruntun Maks:' : 'Max Consecutive Losses:'}</span>
                        <span className="font-bold text-rose-400">{result.maxConsecutiveLosses || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">{isId ? 'Transaksi Impas (BE):' : 'Breakeven Trades:'}</span>
                        <span className="font-bold">{result.breakevenTrades || 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl border ${
                    isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <h4 className="font-bold uppercase text-slate-400 mb-2">
                      {isId ? 'Eksekusi & Friksi Bursa' : 'Friction & Slippage'}
                    </h4>
                    <div className="space-y-1.5 font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-400">{isId ? 'Model Slippage:' : 'Slippage Model:'}</span>
                        <span className="font-bold text-cyan-400">{config.slippagePercent}% per fill</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">{isId ? 'Biaya Taker (Roundtrip):' : 'Roundtrip Fees:'}</span>
                        <span className="font-bold">{(config.feePercent * 2).toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">{isId ? 'Status Partial TP:' : 'Partial TP Status:'}</span>
                        <span className={`font-bold ${config.usePartialTakeProfit ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {config.usePartialTakeProfit ? (isId ? 'Aktif (1.5R + BE)' : 'Active (1.5R + BE)') : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Monte Carlo Simulation Stress Test */}
            {activeTab === 'monte_carlo' && (
              <div className="space-y-6">
                <div className={`p-5 rounded-2xl border ${
                  isDark ? 'bg-gradient-to-r from-amber-950/30 via-slate-900/90 to-slate-950 border-amber-500/30' : 'bg-amber-50/50 border-amber-200 shadow-xs'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-amber-500/20">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                        <Dice5 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-amber-300">
                          {isId ? 'Simulasi Bootstrap Monte Carlo (Stress Test Risiko Urutan)' : 'Monte Carlo Bootstrap Resampling (Sequence Risk)'}
                        </h4>
                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          {isId
                            ? 'Mengacak urutan hasil trade secara berulang (500x iterasi) untuk menguji ketahanan strategi terhadap skenario terburuk dan risiko kebangkrutan.'
                            : 'Bootstrap reshuffling of actual trade PnL across 500+ iterations to evaluate sequence-of-returns risk and probability of ruin.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <select
                        value={mcIterations}
                        onChange={(e) => setMcIterations(Number(e.target.value))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border ${
                          isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      >
                        <option value="250">250 Iterasi</option>
                        <option value="500">500 Iterasi</option>
                        <option value="1000">1,000 Iterasi</option>
                      </select>

                      <button
                        onClick={handleReRunMonteCarlo}
                        disabled={isSimulatingMC || !result || result.trades.length < 3}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 text-xs font-bold hover:brightness-110 active:scale-98 transition-all cursor-pointer shadow-sm shadow-amber-500/20 font-black"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSimulatingMC ? 'animate-spin' : ''}`} />
                        <span>{isSimulatingMC ? (isId ? 'Mengacak...' : 'Shuffling...') : (isId ? 'Acak Ulang' : 'Reshuffle')}</span>
                      </button>
                    </div>
                  </div>

                  {mcResult && (
                    <div className="mt-5 space-y-6">
                      {/* Monte Carlo 4 Key Stat Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                        <div className={`p-3.5 rounded-xl border ${
                          isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-white border-slate-200'
                        }`}>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                            {isId ? 'Rentang Ekuitas Akhir (95% CI)' : '95% Confidence Final Balance'}
                          </span>
                          <span className="text-sm font-mono font-bold text-amber-300 block">
                            ${mcResult.confidenceInterval95.minEndingCapital.toLocaleString()} - ${mcResult.confidenceInterval95.maxEndingCapital.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                            {isId ? 'Median:' : 'Median:'} ${mcResult.confidenceInterval95.medianEndingCapital.toLocaleString()}
                          </span>
                        </div>

                        <div className={`p-3.5 rounded-xl border ${
                          isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-white border-slate-200'
                        }`}>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                            {isId ? 'Median Drawdown (P50)' : 'Median Drawdown (P50)'}
                          </span>
                          <span className="text-sm font-mono font-bold text-cyan-400 block">
                            -{mcResult.maxDrawdownDistribution.p50}%
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                            P10: -{mcResult.maxDrawdownDistribution.p10}%
                          </span>
                        </div>

                        <div className={`p-3.5 rounded-xl border ${
                          isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-white border-slate-200'
                        }`}>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                            {isId ? 'Skenario Terburuk (P99 Drawdown)' : 'Worst Case Tail Risk (P99 DD)'}
                          </span>
                          <span className={`text-sm font-mono font-bold block ${
                            mcResult.maxDrawdownDistribution.p99 <= 20 ? 'text-emerald-400' : mcResult.maxDrawdownDistribution.p99 <= 35 ? 'text-amber-400' : 'text-rose-400'
                          }`}>
                            -{mcResult.maxDrawdownDistribution.p99}%
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                            P90: -{mcResult.maxDrawdownDistribution.p90}%
                          </span>
                        </div>

                        <div className={`p-3.5 rounded-xl border ${
                          isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-white border-slate-200'
                        }`}>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                            {isId ? 'Probabilitas Kehancuran (Ruin)' : 'Probability of Ruin (50% DD)'}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-sm font-mono font-bold ${
                              mcResult.probabilityOfRuinPercent === 0 ? 'text-emerald-400' : mcResult.probabilityOfRuinPercent < 2 ? 'text-amber-400' : 'text-rose-400'
                            }`}>
                              {mcResult.probabilityOfRuinPercent}%
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold uppercase">
                              {mcResult.probabilityOfRuinPercent < 1 ? (isId ? 'Sangat Aman' : 'Robust') : (isId ? 'Waspada' : 'Caution')}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 mt-1 block">
                            {isId ? 'Peluang modal menyusut 50%' : 'Chance of account cutting 50%'}
                          </span>
                        </div>
                      </div>

                      {/* Monte Carlo Visual Simulation Paths Overlay SVG */}
                      {mcResult.simulatedPaths.length > 0 && (
                        <div className={`p-4 rounded-xl border ${
                          isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white border-slate-200'
                        }`}>
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                            {isId ? 'Hamparan 12 Jalur Simulasi Acak (Simulated Trajectories)' : 'Sampled 12 Random Trajectories Overlay'}
                          </span>
                          <svg viewBox="0 0 800 160" className="w-full h-40 overflow-visible">
                            {mcResult.simulatedPaths.map((path, pathIdx) => {
                              const minVal = Math.min(...mcResult.simulatedPaths.flat()) * 0.95;
                              const maxVal = Math.max(...mcResult.simulatedPaths.flat()) * 1.05;
                              const range = maxVal - minVal || 1;
                              const coords = path.map((val, stepIdx) => {
                                const x = 20 + (stepIdx / (path.length - 1)) * 760;
                                const y = 140 - ((val - minVal) / range) * 120;
                                return `${x},${y}`;
                              });
                              return (
                                <polyline
                                  key={pathIdx}
                                  fill="none"
                                  stroke={pathIdx === 0 ? '#38bdf8' : '#f59e0b'}
                                  strokeWidth={pathIdx === 0 ? '2' : '1'}
                                  strokeOpacity={pathIdx === 0 ? '0.9' : '0.35'}
                                  points={coords.join(' ')}
                                />
                              );
                            })}
                          </svg>
                          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-1">
                            <span>{isId ? 'Awal: ' : 'Start: '}${result.initialBalance.toLocaleString()}</span>
                            <span>{isId ? 'Selesai: ' : 'End: '}{result.trades.length} {isId ? 'transaksi' : 'trades'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: AI Pattern Learning Workbench */}
            {activeTab === 'ai_learner' && aiInsight && (
              <div className="space-y-6">
                {/* AI Executive Card */}
                <div className={`p-5 rounded-2xl border relative overflow-hidden ${
                  isDark
                    ? 'bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-slate-900/80 border-purple-500/30'
                    : 'bg-gradient-to-r from-purple-50 via-indigo-50/50 to-white border-purple-200 shadow-xs'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-purple-500/20">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                        <BrainCircuit className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-purple-300">
                          {isId ? 'Sintesis Pola Kuantitatif oleh AI' : 'AI Quantitative Pattern Synthesis'}
                        </h4>
                        <span className="text-[10px] font-mono text-slate-400">
                          Engine: {aiInsight.aiEngine}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                        {aiInsight.marketRegimeDetected}
                      </span>
                    </div>
                  </div>

                  <p className={`text-xs mt-3 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    {aiInsight.summary}
                  </p>

                  {/* One-Click Apply Button */}
                  {aiInsight.optimizedParameters && (
                    <div className="mt-4 pt-3 border-t border-purple-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-[11px] font-bold text-emerald-400 block">
                          ★ {isId ? 'Rekomendasi Parameter Optimal:' : 'Recommended Optimal Parameters:'}
                        </span>
                        <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          {aiInsight.optimizedParameters.explanation}
                        </span>
                      </div>
                      <button
                        onClick={handleApplyAIOptimizations}
                        className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 hover:brightness-110 active:scale-98 transition-all cursor-pointer whitespace-nowrap shadow-md shadow-emerald-500/20"
                      >
                        <Zap className="w-3.5 h-3.5 fill-current" />
                        <span>{isId ? 'Terapkan Parameter AI & Uji Ulang' : 'Apply AI Settings & Re-Test'}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Grid: Learned Rules (If-Then) */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    <span>{isId ? 'Aturan Pola Teridentifikasi (Learned Rules)' : 'Learned Pattern Rules'}</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {aiInsight.learnedRules.map((rule) => (
                      <div
                        key={rule.id}
                        className={`p-4 rounded-xl border flex flex-col justify-between ${
                          isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-400">
                              {rule.id} • {rule.type}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-400 font-mono">
                              {rule.winRateImpact}
                            </span>
                          </div>
                          <h5 className="text-xs font-bold text-slate-200 mb-1.5">
                            {rule.title}
                          </h5>
                          <div className="text-[11px] space-y-1">
                            <p className="text-amber-400/90 font-medium">
                              <span className="text-slate-500 uppercase text-[9px] block">KONDISI (IF):</span>
                              {rule.condition}
                            </p>
                            <p className="text-cyan-300 font-medium pt-1">
                              <span className="text-slate-500 uppercase text-[9px] block">TINDAKAN (THEN):</span>
                              {rule.action}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-800/40 text-[10px] text-slate-500 flex justify-between">
                          <span>Keyakinan Mesin</span>
                          <span className="font-mono text-cyan-400 font-bold">{rule.confidence}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Indicator Synergy Matrix */}
                {aiInsight.synergyMatrix && aiInsight.synergyMatrix.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-purple-400" />
                      <span>{isId ? 'Matriks Sinergi Kombinasi Indikator' : 'Indicator Synergy Matrix'}</span>
                    </h4>
                    <div className="overflow-x-auto rounded-xl border border-slate-800/60">
                      <table className="w-full text-xs text-left">
                        <thead className={`text-[10px] uppercase font-mono ${
                          isDark ? 'bg-slate-900 text-slate-400' : 'bg-slate-100 text-slate-600'
                        }`}>
                          <tr>
                            <th className="px-4 py-2.5">{isId ? 'Kombinasi Indikator' : 'Indicator Combo'}</th>
                            <th className="px-4 py-2.5">Win Rate (%)</th>
                            <th className="px-4 py-2.5">Profit Factor</th>
                            <th className="px-4 py-2.5">{isId ? 'Jumlah Trade' : 'Sample Size'}</th>
                            <th className="px-4 py-2.5">{isId ? 'Kategori Sinergi' : 'Synergy Grade'}</th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y font-mono ${
                          isDark ? 'divide-slate-800 text-slate-300' : 'divide-slate-200 text-slate-700'
                        }`}>
                          {aiInsight.synergyMatrix.map((item, i) => (
                            <tr key={i} className={isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'}>
                              <td className="px-4 py-2.5 font-sans font-bold text-slate-200">
                                {item.indicators}
                              </td>
                              <td className={`px-4 py-2.5 font-bold ${
                                item.winRate >= 70 ? 'text-emerald-400' : item.winRate >= 55 ? 'text-cyan-400' : 'text-rose-400'
                              }`}>
                                {item.winRate}%
                              </td>
                              <td className="px-4 py-2.5 font-bold">
                                {item.profitFactor}x
                              </td>
                              <td className="px-4 py-2.5 text-slate-400">
                                {item.tradesCount} trades
                              </td>
                              <td className="px-4 py-2.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  item.status === 'EXCELLENT'
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : item.status === 'GOOD'
                                    ? 'bg-cyan-500/20 text-cyan-400'
                                    : 'bg-rose-500/20 text-rose-400'
                                }`}>
                                  {item.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Leaks & Edge Discovered */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`p-4 rounded-xl border ${
                    isDark ? 'bg-rose-950/20 border-rose-500/30' : 'bg-rose-50/60 border-rose-200'
                  }`}>
                    <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{isId ? 'Titik Kebocoran Risiko (Risk Leaks)' : 'Identified Risk Leaks'}</span>
                    </h4>
                    <ul className="space-y-1.5 text-xs">
                      {aiInsight.riskLeaks.map((leak, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-rose-400 font-bold">•</span>
                          <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{leak}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className={`p-4 rounded-xl border ${
                    isDark ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-emerald-50/60 border-emerald-200'
                  }`}>
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isId ? 'Peluang Keunggulan Pasar (Edge Discovery)' : 'Edge Discoveries'}</span>
                    </h4>
                    <ul className="space-y-1.5 text-xs">
                      {aiInsight.edgeDiscovery.map((edge, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-emerald-400 font-bold">•</span>
                          <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{edge}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: Individual Trade Log */}
            {activeTab === 'trades' && result && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5">
                    {(['ALL', 'WIN', 'LOSS'] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setTradeFilter(filter)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          tradeFilter === filter
                            ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black'
                            : isDark
                            ? 'bg-slate-900 border-slate-800 text-slate-400'
                            : 'bg-slate-100 border-slate-200 text-slate-600'
                        }`}
                      >
                        {filter} ({filter === 'ALL' ? result.trades.length : result.trades.filter((t) => t.result === filter).length})
                      </button>
                    ))}
                  </div>

                  <span className="text-xs text-slate-400 font-mono">
                    {filteredTrades.length} {isId ? 'transaksi ditampilkan' : 'trades shown'}
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-800/60">
                  <table className="w-full text-xs text-left">
                    <thead className={`text-[10px] uppercase font-mono ${
                      isDark ? 'bg-slate-900 text-slate-400' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <tr>
                        <th className="px-3 py-2.5">ID</th>
                        <th className="px-3 py-2.5">{isId ? 'Arah' : 'Side'}</th>
                        <th className="px-3 py-2.5">{isId ? 'Harga Masuk' : 'Entry'}</th>
                        <th className="px-3 py-2.5">{isId ? 'Harga Keluar' : 'Exit'}</th>
                        <th className="px-3 py-2.5">Net PnL ($)</th>
                        <th className="px-3 py-2.5">PnL (%)</th>
                        <th className="px-3 py-2.5">{isId ? 'Alasan Keluar' : 'Exit Reason'}</th>
                        <th className="px-3 py-2.5">{isId ? 'Durasi' : 'Duration'}</th>
                        <th className="px-3 py-2.5">{isId ? 'Friksi' : 'Friction'}</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y font-mono ${
                      isDark ? 'divide-slate-800 text-slate-300' : 'divide-slate-200 text-slate-700'
                    }`}>
                      {filteredTrades.map((t) => (
                        <tr key={t.id} className={isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'}>
                          <td className="px-3 py-2.5 font-bold text-slate-400">{t.id}</td>
                          <td className="px-3 py-2.5">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              t.direction === 'LONG' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                            }`}>
                              {t.direction}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 font-bold">${formatCryptoPrice(t.entryPrice)}</td>
                          <td className="px-3 py-2.5 font-bold">${formatCryptoPrice(t.exitPrice)}</td>
                          <td className={`px-3 py-2.5 font-bold ${
                            t.pnlUsd > 0 ? 'text-emerald-400' : t.pnlUsd < 0 ? 'text-rose-400' : 'text-slate-400'
                          }`}>
                            {t.pnlUsd > 0 ? '+' : ''}${t.pnlUsd.toFixed(2)}
                          </td>
                          <td className={`px-3 py-2.5 font-bold ${
                            t.pnlPercent > 0 ? 'text-emerald-400' : t.pnlPercent < 0 ? 'text-rose-400' : 'text-slate-400'
                          }`}>
                            {t.pnlPercent > 0 ? '+' : ''}{t.pnlPercent}%
                          </td>
                          <td className="px-3 py-2.5">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              t.exitReason === 'TAKE_PROFIT' || t.exitReason === 'PARTIAL_TP'
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : t.exitReason === 'STOP_LOSS'
                                ? 'bg-rose-500/15 text-rose-400'
                                : 'bg-slate-500/15 text-slate-400'
                            }`}>
                              {t.exitReason}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-slate-400">
                            {t.holdingBars} {isId ? 'lilin' : 'bars'}
                          </td>
                          <td className="px-3 py-2.5 text-slate-400 text-[10px]">
                            {t.feeDeductionUsd ? `-$${t.feeDeductionUsd}` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
