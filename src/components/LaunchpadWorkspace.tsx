import React, { useState } from 'react';
import {
  OHLCVCandle,
  Timeframe,
  ConfluenceEvaluation,
  SupportedExchange,
  MarketType,
  WebSocketSyncMetrics,
  LiveTradeTick,
  LiveOrderBookLevel,
  StageId,
} from '../types/crypto.types';
import { Language } from '../i18n/translations';
import { InteractiveChart } from './InteractiveChart';
import { LiquidationHeatmapCard } from './LiquidationHeatmapCard';
import { RiskCalculatorCard } from './RiskCalculatorCard';
import { GaugeChart } from './GaugeChart';
import {
  LayoutGrid,
  Maximize2,
  Minimize2,
  CandlestickChart,
  Gauge,
  Flame,
  ShieldCheck,
  Zap,
  ChevronRight,
  Info,
  ExternalLink,
  ArrowRight,
  Layers,
  Sparkles,
  HelpCircle,
  X,
} from 'lucide-react';
import { formatCryptoPrice } from '../utils/formatters';

export type LaunchpadLayoutPreset = 'quad' | 'chart_focus' | 'execution_focus' | 'dual_chart_confluence';

const TIMEFRAME_OPTIONS: Timeframe[] = ['1m', '5m', '15m', '1H', '4H', '1D'];

interface LaunchpadWorkspaceProps {
  candles: OHLCVCandle[];
  symbol: string;
  timeframe: Timeframe;
  evaluation: ConfluenceEvaluation | null;
  livePrice?: number;
  priceDirection?: 'up' | 'down' | 'neutral';
  wsStatus?: 'connected' | 'connecting' | 'fallback';
  latencyMs?: number;
  syncMetrics?: WebSocketSyncMetrics;
  recentLiveTrades?: LiveTradeTick[];
  orderBookBids?: LiveOrderBookLevel[];
  orderBookAsks?: LiveOrderBookLevel[];
  bidTotal?: number;
  askTotal?: number;
  selectedExchange?: SupportedExchange;
  selectedMarketType?: MarketType;
  onSelectExchange?: (ex: SupportedExchange) => void;
  onSelectMarketType?: (mt: MarketType) => void;
  onSelectTimeframe?: (tf: Timeframe) => void;
  onTriggerAnalyze?: () => void;
  onNavigateStage?: (stage: StageId) => void;
  isLoading?: boolean;
  lang?: Language;
  theme?: 'light' | 'dark';
}

export const LaunchpadWorkspace: React.FC<LaunchpadWorkspaceProps> = ({
  candles,
  symbol,
  timeframe,
  evaluation,
  livePrice,
  priceDirection = 'neutral',
  wsStatus = 'connected',
  latencyMs = 12,
  syncMetrics,
  recentLiveTrades,
  orderBookBids,
  orderBookAsks,
  bidTotal,
  askTotal,
  selectedExchange = 'BINANCE',
  selectedMarketType = 'SPOT',
  onSelectExchange,
  onSelectMarketType,
  onSelectTimeframe,
  onTriggerAnalyze,
  onNavigateStage,
  isLoading = false,
  lang = 'id',
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const isId = lang === 'id';

  const [layoutPreset, setLayoutPreset] = useState<LaunchpadLayoutPreset>(() => {
    return (localStorage.getItem('imasbtc_launchpad_layout') as LaunchpadLayoutPreset) || 'quad';
  });
  const [maximizedPanel, setMaximizedPanel] = useState<'chart' | 'confluence' | 'heatmap' | 'risk' | null>(null);
  const [showWorkflowGuide, setShowWorkflowGuide] = useState<boolean>(() => {
    return localStorage.getItem('imasbtc_grid_guide_dismissed') !== 'true';
  });

  const handleSelectLayout = (preset: LaunchpadLayoutPreset) => {
    setLayoutPreset(preset);
    localStorage.setItem('imasbtc_launchpad_layout', preset);
  };

  const toggleMaximize = (panel: 'chart' | 'confluence' | 'heatmap' | 'risk') => {
    setMaximizedPanel((prev) => (prev === panel ? null : panel));
  };

  const toggleGuide = () => {
    const next = !showWorkflowGuide;
    setShowWorkflowGuide(next);
    localStorage.setItem('imasbtc_grid_guide_dismissed', next ? 'false' : 'true');
  };

  const activeDisplayPrice = livePrice || (candles.length > 0 ? candles[candles.length - 1].close : 0);

  // Panel Header Bar Helper with explicit step tags and quick-jump button
  const renderPanelHeader = (
    stepTag: string,
    title: string,
    badge: string,
    Icon: React.ElementType,
    panelKey: 'chart' | 'confluence' | 'heatmap' | 'risk',
    targetStage?: StageId,
    targetStageLabel?: string
  ) => {
    const isMax = maximizedPanel === panelKey;
    return (
      <div
        className={`flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 border-b select-none transition-colors ${
          isDark ? 'bg-[#090d16] border-[#1e293b] text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider shrink-0 ${
              isDark
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                : 'bg-cyan-100 text-cyan-800 border border-cyan-300'
            }`}
          >
            {stepTag}
          </span>
          <div className="flex items-center gap-1.5 min-w-0">
            <Icon className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`} />
            <span className="font-mono text-xs font-bold tracking-wide uppercase truncate">{title}</span>
          </div>
          <span
            className={`hidden sm:inline-block px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
              isDark ? 'bg-slate-800 text-slate-400 border border-slate-700' : 'bg-slate-200 text-slate-700 border border-slate-300'
            }`}
          >
            {badge}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {targetStage && onNavigateStage && (
            <button
              onClick={() => onNavigateStage(targetStage)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                isDark
                  ? 'bg-slate-800/80 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-slate-700'
                  : 'bg-slate-200 hover:bg-cyan-100 text-slate-700 hover:text-cyan-900 border border-slate-300'
              }`}
              title={isId ? `Buka Halaman Lengkap: ${targetStageLabel || title}` : `Open Full Page: ${targetStageLabel || title}`}
            >
              <span>{targetStageLabel || (isId ? 'Buka Penuh' : 'Open Full')}</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </button>
          )}

          <button
            onClick={() => toggleMaximize(panelKey)}
            className={`p-1 rounded transition-colors cursor-pointer ${
              isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-600 hover:text-slate-950'
            }`}
            title={isMax ? (isId ? 'Kecilkan Panel' : 'Minimize Panel') : (isId ? 'Perbesar Panel Penuh' : 'Maximize Panel')}
          >
            {isMax ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full space-y-3 font-mono">
      {/* 🧭 Launchpad Workspace Toolbar & Control Ribbon */}
      <div
        className={`flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 px-4 py-3 rounded-xl border transition-colors ${
          isDark ? 'bg-[#0b0f19] border-[#1e293b] text-slate-300' : 'bg-white border-slate-200 text-slate-800 shadow-xs'
        }`}
      >
        {/* Left: Title & Quick Layout Presets */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold text-xs">
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>{isId ? 'MEJA KERJA TRADING GRID' : 'TRADING GRID WORKSPACE'}</span>
          </div>

          {/* Layout Presets Buttons */}
          <div className="flex items-center gap-1 p-0.5 rounded-lg border text-xs font-mono overflow-x-auto scrollbar-none">
            <button
              onClick={() => handleSelectLayout('quad')}
              className={`px-2 py-1 rounded text-[11px] font-bold transition-colors cursor-pointer shrink-0 ${
                layoutPreset === 'quad'
                  ? isDark
                    ? 'bg-cyan-500 text-slate-950 shadow-xs'
                    : 'bg-cyan-600 text-white shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
              title={isId ? 'Tampilan 4 Panel Standar (Grafik, Konfluensi, Likuidasi, Risiko)' : 'Standard 4-Panel Grid'}
            >
              {isId ? '4 Panel' : '4 Panels'}
            </button>
            <button
              onClick={() => handleSelectLayout('chart_focus')}
              className={`px-2 py-1 rounded text-[11px] font-bold transition-colors cursor-pointer shrink-0 ${
                layoutPreset === 'chart_focus'
                  ? isDark
                    ? 'bg-cyan-500 text-slate-950 shadow-xs'
                    : 'bg-cyan-600 text-white shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
              title={isId ? 'Fokus Grafik Lebih Lebar + Konfluensi & Risiko' : 'Wide Chart Focus'}
            >
              {isId ? 'Fokus Grafik' : 'Chart Focus'}
            </button>
            <button
              onClick={() => handleSelectLayout('execution_focus')}
              className={`px-2 py-1 rounded text-[11px] font-bold transition-colors cursor-pointer shrink-0 ${
                layoutPreset === 'execution_focus'
                  ? isDark
                    ? 'bg-cyan-500 text-slate-950 shadow-xs'
                    : 'bg-cyan-600 text-white shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
              title={isId ? 'Fokus Analisis Eksekusi & Manajemen Risiko' : 'Execution & Risk Focus'}
            >
              {isId ? 'Fokus Eksekusi' : 'Exec Focus'}
            </button>
            <button
              onClick={() => handleSelectLayout('dual_chart_confluence')}
              className={`px-2 py-1 rounded text-[11px] font-bold transition-colors cursor-pointer shrink-0 ${
                layoutPreset === 'dual_chart_confluence'
                  ? isDark
                    ? 'bg-cyan-500 text-slate-950 shadow-xs'
                    : 'bg-cyan-600 text-white shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
              title={isId ? '2 Panel Kritis: Grafik Candlestick & Skor Konfluensi' : 'Dual Critical Panels'}
            >
              {isId ? '2 Panel' : 'Dual'}
            </button>
          </div>
        </div>

        {/* Right: Quick Timeframe Selector, Price Badge, & Workflow Guide Toggle */}
        <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2.5 text-xs">
          {/* Quick Timeframe Buttons */}
          {onSelectTimeframe && (
            <div className={`flex items-center gap-0.5 p-0.5 rounded-lg border ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}>
              {TIMEFRAME_OPTIONS.map((tf) => (
                <button
                  key={tf}
                  onClick={() => onSelectTimeframe(tf)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono transition-colors cursor-pointer ${
                    timeframe === tf
                      ? isDark
                        ? 'bg-cyan-500 text-slate-950 shadow-xs'
                        : 'bg-cyan-600 text-white shadow-xs'
                      : isDark
                      ? 'text-slate-400 hover:text-white'
                      : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          )}

          {/* Real-time Ticker Badge */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-cyan-400">{symbol}</span>
            <span
              className={`font-bold tabular-nums text-sm ${
                priceDirection === 'up'
                  ? 'text-emerald-400'
                  : priceDirection === 'down'
                  ? 'text-rose-400'
                  : isDark
                  ? 'text-white'
                  : 'text-slate-900'
              }`}
            >
              ${formatCryptoPrice(activeDisplayPrice)}
            </span>
            <span
              className={`hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                evaluation?.marketBias?.includes('Bullish')
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : evaluation?.marketBias?.includes('Bearish')
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {evaluation?.marketBias || (isLoading ? 'CALCULATING...' : 'READY')}
            </span>
          </div>

          {/* Guide Help Toggle */}
          <button
            onClick={toggleGuide}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-semibold ${
              showWorkflowGuide
                ? isDark
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-cyan-100 text-cyan-900 border-cyan-300'
                : isDark
                ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
            title={isId ? 'Tampilkan / Sembunyikan Panduan Alur Trading Grid' : 'Toggle Grid Workflow Guide'}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isId ? 'Panduan Alur' : 'Workflow Guide'}</span>
          </button>
        </div>
      </div>

      {/* 💡 Workflow Guide Banner (Explaining 4 Tiles to Remove Confusion) */}
      {showWorkflowGuide && (
        <div
          className={`p-3.5 rounded-xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
            isDark ? 'bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-slate-900 border-cyan-500/30' : 'bg-cyan-50/70 border-cyan-200 text-slate-800'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${isDark ? 'bg-cyan-500/20 text-cyan-300' : 'bg-cyan-100 text-cyan-800'}`}>
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="space-y-1 text-xs">
              <div className="font-bold flex items-center gap-2 text-cyan-400">
                <span>{isId ? 'Cara Membaca Meja Kerja Trading Grid (4 Panel)' : 'How to Read the Trading Grid (4 Panels)'}</span>
              </div>
              <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {isId
                  ? 'Meja kerja ini menggabungkan 4 tahap analisa penting dalam 1 layar: (1) Grafik Candlestick untuk struktur harga, (2) Skor Konfluensi untuk validasi multi-algoritma, (3) Order Flow untuk pantauan likuidasi whale, dan (4) Kalkulator Risiko untuk menghitung lot & target sebelum order.'
                  : 'This workspace unifies 4 key workflow stages on 1 screen: (1) Candlestick Chart for price structure, (2) Confluence Score for multi-algo validation, (3) Order Flow for whale liquidation levels, and (4) Risk Calculator for sizing & R:R target planning.'}
              </p>
            </div>
          </div>

          <button
            onClick={toggleGuide}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer self-end md:self-center shrink-0 ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-cyan-100'
            }`}
            title={isId ? 'Tutup Panduan' : 'Dismiss Guide'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 🚀 Main Multi-Window Grid */}
      {maximizedPanel ? (
        // Maximized Single Tile View
        <div
          className={`w-full rounded-xl border overflow-hidden transition-colors ${
            isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200'
          }`}
        >
          {maximizedPanel === 'chart' && (
            <>
              {renderPanelHeader(
                isId ? 'Langkah 3: Validasi' : 'Step 3: Validation',
                isId ? 'Grafik Candlestick & Kedalaman Pasar L2' : 'Candlestick Chart & L2 Depth',
                'L1/L2 LIVE',
                CandlestickChart,
                'chart',
                'ticker',
                isId ? 'Buka Modul Grafik' : 'Full Chart View'
              )}
              <div className="p-4">
                <InteractiveChart
                  candles={candles}
                  symbol={symbol}
                  timeframe={timeframe}
                  indicators={evaluation?.indicators}
                  lang={lang}
                  selectedExchange={selectedExchange}
                  selectedMarketType={selectedMarketType}
                  onSelectExchange={onSelectExchange}
                  onSelectMarketType={onSelectMarketType}
                  latencyMs={latencyMs}
                  wsStatus={wsStatus}
                  theme={theme}
                />
              </div>
            </>
          )}

          {maximizedPanel === 'confluence' && evaluation && (
            <>
              {renderPanelHeader(
                isId ? 'Langkah 3: Konfluensi' : 'Step 3: Confluence',
                isId ? 'Radar Konfluensi & 12 Indikator Kuantitatif' : 'Confluence Radar & 12 Indicators',
                '12-ALGO PROTOCOL',
                Gauge,
                'confluence',
                'indicators',
                isId ? 'Buka 12 Indikator Lengkap' : '12 Indicators Detail'
              )}
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-slate-900/40 border border-slate-800">
                  <GaugeChart
                    score={evaluation.confluenceScore}
                    bias={evaluation.marketBias}
                    bullishCount={evaluation.bullishCount}
                    bearishCount={evaluation.bearishCount}
                    neutralCount={evaluation.neutralCount}
                    lang={lang}
                    theme={theme}
                  />
                  <div className="mt-4 text-center">
                    <span className={`text-xs uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {isId ? 'Bias Konsensus Pasar' : 'Market Consensus Bias'}
                    </span>
                    <h4 className={`text-xl font-bold mt-1 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>{evaluation.marketBias}</h4>
                    <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {evaluation.bullishCount} Bullish • {evaluation.bearishCount} Bearish • {evaluation.neutralCount} {isId ? 'Netral' : 'Neutral'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {Object.entries(evaluation.indicators).map(([key, ind]: [string, any]) => (
                    <div
                      key={key}
                      className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                        isDark ? 'bg-[#090d16] border-[#1e293b]' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div>
                        <span className={`font-semibold uppercase tracking-wider ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{key}</span>
                        <p className={`text-[11px] mt-0.5 line-clamp-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{ind?.summary}</p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ind?.signal === 'BULLISH'
                            ? isDark
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : ind?.signal === 'BEARISH'
                            ? isDark
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                            : isDark
                            ? 'bg-slate-800 text-slate-300'
                            : 'bg-slate-200 text-slate-800'
                        }`}
                      >
                        {ind?.signal}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {maximizedPanel === 'heatmap' && (
            <>
              {renderPanelHeader(
                isId ? 'Langkah 3: Likuiditas' : 'Step 3: Liquidity',
                isId ? 'Heatmap Likuidasi Order Flow & Klaster Whale' : 'Order Flow Liquidation Heatmap',
                'DERIVATIVES',
                Flame,
                'heatmap',
                'orderflow',
                isId ? 'Buka Order Flow Lengkap' : 'Full Order Flow'
              )}
              <div className="p-4">
                <LiquidationHeatmapCard
                  candles={candles}
                  symbol={symbol}
                  timeframe={timeframe}
                  currentPrice={activeDisplayPrice}
                  lang={lang}
                  theme={theme}
                />
              </div>
            </>
          )}

          {maximizedPanel === 'risk' && evaluation && (
            <>
              {renderPanelHeader(
                isId ? 'Langkah 4: Hitung Risiko' : 'Step 4: Risk Protocol',
                isId ? 'Kalkulator Risiko & Perencana Eksekusi' : 'Risk Management & Sizing Planner',
                'RISK PROTOCOL',
                ShieldCheck,
                'risk',
                'manual_trading',
                isId ? 'Kirim ke Trading Manual ⚡' : 'Go to Manual Trading ⚡'
              )}
              <div className="p-4">
                <RiskCalculatorCard
                  initialRiskPlan={evaluation.riskPlan}
                  symbol={symbol}
                  indicators={evaluation.indicators}
                  currentPrice={activeDisplayPrice}
                  lang={lang}
                  theme={theme}
                />
              </div>
            </>
          )}
        </div>
      ) : (
        // Standard Multi-Tile Grid
        <div
          className={`grid gap-3 ${
            layoutPreset === 'quad'
              ? 'grid-cols-1 xl:grid-cols-2'
              : layoutPreset === 'chart_focus'
              ? 'grid-cols-1 lg:grid-cols-12'
              : layoutPreset === 'dual_chart_confluence'
              ? 'grid-cols-1 lg:grid-cols-2'
              : 'grid-cols-1 lg:grid-cols-2'
          }`}
        >
          {/* TILE 1: Interactive Candlestick Chart */}
          <div
            className={`rounded-xl border overflow-hidden transition-colors ${
              isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200'
            } ${layoutPreset === 'chart_focus' ? 'lg:col-span-8' : ''}`}
          >
            {renderPanelHeader(
              isId ? 'Langkah 3: Validasi' : 'Step 3: Validation',
              isId ? 'Grafik Candlestick & L2 Depth' : 'Candlestick Chart & L2 Depth',
              'LIVE',
              CandlestickChart,
              'chart',
              'ticker',
              isId ? 'Grafik Penuh' : 'Full Chart'
            )}
            <div className="p-3">
              <InteractiveChart
                candles={candles}
                symbol={symbol}
                timeframe={timeframe}
                indicators={evaluation?.indicators}
                lang={lang}
                selectedExchange={selectedExchange}
                selectedMarketType={selectedMarketType}
                onSelectExchange={onSelectExchange}
                onSelectMarketType={onSelectMarketType}
                latencyMs={latencyMs}
                wsStatus={wsStatus}
                theme={theme}
              />
            </div>
          </div>

          {/* TILE 2: Confluence Radar & Scorecard */}
          <div
            className={`rounded-xl border overflow-hidden transition-colors ${
              isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200'
            } ${layoutPreset === 'chart_focus' ? 'lg:col-span-4' : ''}`}
          >
            {renderPanelHeader(
              isId ? 'Langkah 3: Konfluensi' : 'Step 3: Confluence',
              isId ? 'Radar Konfluensi & 12 Indikator' : 'Confluence Radar & 12 Inds',
              'QUANTUM 100',
              Gauge,
              'confluence',
              'indicators',
              isId ? '12 Indikator' : '12 Indicators'
            )}
            <div className="p-4 space-y-4">
              {evaluation ? (
                <>
                  <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900/40 border border-slate-800/80">
                    <GaugeChart
                      score={evaluation.confluenceScore}
                      bias={evaluation.marketBias}
                      bullishCount={evaluation.bullishCount}
                      bearishCount={evaluation.bearishCount}
                      neutralCount={evaluation.neutralCount}
                      lang={lang}
                      theme={theme}
                    />
                    <div className="mt-2 text-center">
                      <h4 className={`text-sm font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>{evaluation.marketBias}</h4>
                      <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {evaluation.bullishCount} Bullish • {evaluation.bearishCount} Bearish • {evaluation.neutralCount} {isId ? 'Netral' : 'Neutral'}
                      </p>
                    </div>
                  </div>

                  {/* Compact Quick 12-Indicator Status Pills */}
                  <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                    {Object.entries(evaluation.indicators).map(([key, ind]: [string, any]) => (
                      <div
                        key={key}
                        className={`px-3 py-1.5 rounded-lg border text-xs flex items-center justify-between ${
                          isDark ? 'bg-[#090d16] border-[#1e293b]' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <span className={`font-semibold text-[11px] truncate max-w-[150px] ${
                          isDark ? 'text-slate-200' : 'text-slate-800'
                        }`}>
                          {key}
                        </span>
                        <span
                          className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                            ind?.signal === 'BULLISH'
                              ? isDark
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : ind?.signal === 'BEARISH'
                              ? isDark
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                : 'bg-rose-100 text-rose-800 border border-rose-300'
                              : isDark
                              ? 'bg-slate-800 text-slate-300'
                              : 'bg-slate-200 text-slate-800'
                          }`}
                        >
                          {ind?.signal}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : isLoading ? (
                <div className="py-16 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
                  <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>{isId ? 'Menghitung 12 Indikator & Confluence...' : 'Calculating 12 Indicators & Confluence...'}</span>
                </div>
              ) : (
                <div className="py-12 px-4 text-center flex flex-col items-center justify-center">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                    isDark ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400' : 'bg-cyan-50 border border-cyan-200 text-cyan-700'
                  }`}>
                    <Gauge className="w-6 h-6" />
                  </div>
                  <p className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    {isId ? `Chart ${timeframe} Siap` : `${timeframe} Chart Ready`}
                  </p>
                  <p className={`text-xs max-w-xs mt-1 mb-4 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {isId
                      ? 'Grafik dibuka seketika tanpa jeda analisis. Klik di bawah untuk memproses kalkulasi 12-Indikator.'
                      : 'Chart opened first for zero lag. Click below to compute the 12-indicator confluence.'}
                  </p>
                  {onTriggerAnalyze && (
                    <button
                      onClick={onTriggerAnalyze}
                      className={`px-4 py-2 rounded-lg font-bold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer ${
                        isDark
                          ? 'bg-gradient-to-r from-cyan-500 to-cyan-400 text-slate-950 hover:from-cyan-400 hover:to-cyan-300 shadow-cyan-500/20'
                          : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/20'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      {isId ? `Jalankan Analisis (${timeframe})` : `Run Analysis (${timeframe})`}
                    </button>
                  )}
                  <span className="text-[10px] text-slate-500 mt-2 font-mono">Shortcut: [R]</span>
                </div>
              )}
            </div>
          </div>

          {/* TILE 3: Liquidation Heatmap & CVD (Hidden in dual preset or execution focus) */}
          {layoutPreset !== 'execution_focus' && layoutPreset !== 'dual_chart_confluence' && (
            <div
              className={`rounded-xl border overflow-hidden transition-colors ${
                isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200'
              } ${layoutPreset === 'chart_focus' ? 'lg:col-span-6' : ''}`}
            >
              {renderPanelHeader(
                isId ? 'Langkah 3: Likuiditas' : 'Step 3: Liquidity',
                isId ? 'Heatmap Likuidasi Order Flow' : 'Order Flow Liquidation Heatmap',
                'CLUSTERS',
                Flame,
                'heatmap',
                'orderflow',
                isId ? 'Order Flow' : 'Order Flow'
              )}
              <div className="p-3">
                <LiquidationHeatmapCard
                  candles={candles}
                  symbol={symbol}
                  timeframe={timeframe}
                  currentPrice={activeDisplayPrice}
                  lang={lang}
                  theme={theme}
                />
              </div>
            </div>
          )}

          {/* TILE 4: Risk Calculator & Execution Planner (Hidden in dual preset) */}
          {layoutPreset !== 'dual_chart_confluence' && (
            <div
              className={`rounded-xl border overflow-hidden transition-colors ${
                isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200'
              } ${
                layoutPreset === 'chart_focus'
                  ? 'lg:col-span-6'
                  : layoutPreset === 'execution_focus'
                  ? 'lg:col-span-1'
                  : ''
              }`}
            >
              {renderPanelHeader(
                isId ? 'Langkah 4: Hitung Risiko' : 'Step 4: Risk Protocol',
                isId ? 'Kalkulator Risiko & Sizing' : 'Risk Calculator & Sizing',
                'PLANNER',
                ShieldCheck,
                'risk',
                'manual_trading',
                isId ? 'Eksekusi ⚡' : 'Execute ⚡'
              )}
              <div className="p-3">
                {evaluation?.riskPlan ? (
                  <RiskCalculatorCard
                    initialRiskPlan={evaluation.riskPlan}
                    symbol={symbol}
                    indicators={evaluation.indicators}
                    currentPrice={activeDisplayPrice}
                    lang={lang}
                    theme={theme}
                  />
                ) : (
                  <div className="py-12 px-4 text-center flex flex-col items-center justify-center">
                    <ShieldCheck className="w-8 h-8 text-slate-500 mb-2" />
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {isId ? 'Menunggu kalkulasi Confluence...' : 'Awaiting Confluence calculation...'}
                    </p>
                    {onTriggerAnalyze && (
                      <button
                        onClick={onTriggerAnalyze}
                        className="mt-2 text-xs text-cyan-400 hover:underline font-semibold cursor-pointer"
                      >
                        {isId ? '⚡ Hitung Protokol Risiko' : '⚡ Calculate Risk Protocol'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
