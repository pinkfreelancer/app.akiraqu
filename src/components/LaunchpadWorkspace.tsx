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
} from '../types/crypto.types';
import { Language } from '../i18n/translations';
import { InteractiveChart } from './InteractiveChart';
import { LiquidationHeatmapCard } from './LiquidationHeatmapCard';
import { RiskCalculatorCard } from './RiskCalculatorCard';
import { GaugeChart } from './GaugeChart';
import {
  LayoutGrid,
  Columns,
  Maximize2,
  Minimize2,
  CandlestickChart,
  Gauge,
  Flame,
  ShieldCheck,
  Zap,
  Activity,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Clock,
} from 'lucide-react';
import { formatCryptoPrice } from '../utils/formatters';

export type LaunchpadLayoutPreset = 'quad' | 'chart_focus' | 'execution_focus';

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
  isLoading = false,
  lang = 'id',
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const [layoutPreset, setLayoutPreset] = useState<LaunchpadLayoutPreset>(() => {
    return (localStorage.getItem('imasbtc_launchpad_layout') as LaunchpadLayoutPreset) || 'quad';
  });
  const [maximizedPanel, setMaximizedPanel] = useState<'chart' | 'confluence' | 'heatmap' | 'risk' | null>(null);

  const handleSelectLayout = (preset: LaunchpadLayoutPreset) => {
    setLayoutPreset(preset);
    localStorage.setItem('imasbtc_launchpad_layout', preset);
  };

  const toggleMaximize = (panel: 'chart' | 'confluence' | 'heatmap' | 'risk') => {
    setMaximizedPanel((prev) => (prev === panel ? null : panel));
  };

  const activeDisplayPrice = livePrice || (candles.length > 0 ? candles[candles.length - 1].close : 0);

  // Panel Header Bar Helper
  const renderPanelHeader = (
    title: string,
    badge: string,
    Icon: React.ElementType,
    panelKey: 'chart' | 'confluence' | 'heatmap' | 'risk'
  ) => {
    const isMax = maximizedPanel === panelKey;
    return (
      <div
        className={`flex items-center justify-between px-3.5 py-2 border-b select-none ${
          isDark ? 'bg-[#090d16] border-[#1e293b] text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex items-center gap-2">
          <Icon className={`w-3.5 h-3.5 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`} />
          <span className="font-mono text-xs font-bold tracking-wide uppercase">{title}</span>
          <span
            className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
              isDark ? 'bg-slate-800 text-cyan-300 border border-slate-700' : 'bg-slate-200 text-slate-800 border border-slate-300'
            }`}
          >
            {badge}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => toggleMaximize(panelKey)}
            className={`p-1 rounded transition-colors cursor-pointer ${
              isDark ? 'hover:bg-slate-800 text-slate-300 hover:text-white' : 'hover:bg-slate-200 text-slate-700 hover:text-slate-950'
            }`}
            title={isMax ? 'Kecilkan Panel' : 'Perbesar Panel Penuh'}
          >
            {isMax ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full space-y-3 font-mono">
      {/* Launchpad Workspace Toolbar */}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl border transition-colors ${
          isDark ? 'bg-[#0b0f19] border-[#1e293b] text-slate-300' : 'bg-white border-slate-200 text-slate-800 shadow-xs'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold text-xs">
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>MEJA KERJA TRADING (MULTI-PANEL)</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-mono">
            <span className={`font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Tata Letak:</span>
            <div className={`flex items-center gap-1 p-0.5 rounded-lg border ${
              isDark ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                onClick={() => handleSelectLayout('quad')}
                className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                  layoutPreset === 'quad'
                    ? isDark
                      ? 'bg-cyan-500 text-slate-950 shadow-xs'
                      : 'bg-cyan-600 text-white shadow-xs'
                    : isDark
                    ? 'text-slate-300 hover:text-white'
                    : 'text-slate-700 hover:text-slate-950'
                }`}
                title="Tampilan 4 Panel Simultan: Grafik, Konfluensi, Liquidation, dan Risiko"
              >
                4 Panel
              </button>
              <button
                onClick={() => handleSelectLayout('chart_focus')}
                className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                  layoutPreset === 'chart_focus'
                    ? isDark
                      ? 'bg-cyan-500 text-slate-950 shadow-xs'
                      : 'bg-cyan-600 text-white shadow-xs'
                    : isDark
                    ? 'text-slate-300 hover:text-white'
                    : 'text-slate-700 hover:text-slate-950'
                }`}
                title="Fokus Grafik Candlestick Lebih Luas"
              >
                Fokus Grafik
              </button>
              <button
                onClick={() => handleSelectLayout('execution_focus')}
                className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                  layoutPreset === 'execution_focus'
                    ? isDark
                      ? 'bg-cyan-500 text-slate-950 shadow-xs'
                      : 'bg-cyan-600 text-white shadow-xs'
                    : isDark
                    ? 'text-slate-300 hover:text-white'
                    : 'text-slate-700 hover:text-slate-950'
                }`}
                title="Fokus Analisis Eksekusi & Manajemen Risiko"
              >
                Fokus Eksekusi
              </button>
            </div>
          </div>
        </div>

        {/* Real-time Ticker Ribbon */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-cyan-400">{symbol}</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-semibold">
              {timeframe}
            </span>
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
          </div>

          <span
            className={`hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold ${
              evaluation?.marketBias?.includes('Bullish')
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : evaluation?.marketBias?.includes('Bearish')
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                : 'bg-slate-800 text-slate-300'
            }`}
          >
            {evaluation?.marketBias || 'CALCULATING'}
          </span>
        </div>
      </div>

      {/* Main Multi-Window Grid */}
      {maximizedPanel ? (
        // Maximized Single Tile View
        <div
          className={`w-full rounded-xl border overflow-hidden transition-colors ${
            isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200'
          }`}
        >
          {maximizedPanel === 'chart' && (
            <>
              {renderPanelHeader('Interactive Candlestick & Market Depth', 'L1/L2 FULL', CandlestickChart, 'chart')}
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
              {renderPanelHeader('Institutional Confluence Radar (12 Indikator)', 'QUANTUM 100', Gauge, 'confluence')}
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
                    <span className={`text-xs uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Market Consensus Bias</span>
                    <h4 className={`text-xl font-bold mt-1 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>{evaluation.marketBias}</h4>
                    <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {evaluation.bullishCount} Bullish • {evaluation.bearishCount} Bearish • {evaluation.neutralCount} Netral
                    </p>
                  </div>
                </div>

                <div className="space-y-2 max-h-[500px] overflow-y-auto">
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
              {renderPanelHeader('Order Flow Liquidation Heatmap & Whale Clusters', 'DERIVATIVES', Flame, 'heatmap')}
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
              {renderPanelHeader('Risk Management & Execution Planner', 'RISK PROTOCOL', ShieldCheck, 'risk')}
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
        // Standard Multi-Tile Grid (Quad or Dual Presets)
        <div
          className={`grid gap-3 ${
            layoutPreset === 'quad'
              ? 'grid-cols-1 xl:grid-cols-2'
              : layoutPreset === 'chart_focus'
              ? 'grid-cols-1 lg:grid-cols-12'
              : 'grid-cols-1 lg:grid-cols-2'
          }`}
        >
          {/* TILE 1: Interactive Candlestick Chart */}
          <div
            className={`rounded-xl border overflow-hidden transition-colors ${
              isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200'
            } ${layoutPreset === 'chart_focus' ? 'lg:col-span-8' : ''}`}
          >
            {renderPanelHeader('Interactive Candlestick Chart & L2 Depth', 'LIVE', CandlestickChart, 'chart')}
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
            {renderPanelHeader('Confluence Radar & 12 Indicators', 'MULTI-MODEL', Gauge, 'confluence')}
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
                        {evaluation.bullishCount} Bullish • {evaluation.bearishCount} Bearish • {evaluation.neutralCount} Netral
                      </p>
                    </div>
                  </div>

                  {/* Compact Quick 12-Indicator Status Pills */}
                  <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
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
                  <span>{lang === 'id' ? 'Menghitung 12 Indikator & Confluence...' : 'Calculating 12 Indicators & Confluence...'}</span>
                </div>
              ) : (
                <div className="py-12 px-4 text-center flex flex-col items-center justify-center">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                    isDark ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400' : 'bg-cyan-50 border border-cyan-200 text-cyan-700'
                  }`}>
                    <Gauge className="w-6 h-6" />
                  </div>
                  <p className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    {lang === 'id' ? `Chart ${timeframe} Siap` : `${timeframe} Chart Ready`}
                  </p>
                  <p className={`text-xs max-w-xs mt-1 mb-4 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {lang === 'id'
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
                      {lang === 'id' ? `Jalankan Analisis (${timeframe})` : `Run Analysis (${timeframe})`}
                    </button>
                  )}
                  <span className="text-[10px] text-slate-500 mt-2 font-mono">Shortcut: [R]</span>
                </div>
              )}
            </div>
          </div>

          {/* TILE 3: Liquidation Heatmap & CVD (Hidden or stacked in execution_focus) */}
          {layoutPreset !== 'execution_focus' && (
            <div
              className={`rounded-xl border overflow-hidden transition-colors ${
                isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200'
              } ${layoutPreset === 'chart_focus' ? 'lg:col-span-6' : ''}`}
            >
              {renderPanelHeader('Order Flow Liquidation Heatmap', 'CLUSTERS', Flame, 'heatmap')}
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

          {/* TILE 4: Risk Calculator & Execution Planner */}
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
            {renderPanelHeader('Risk Management & Execution Planner', 'CALCULATOR', ShieldCheck, 'risk')}
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
                    {lang === 'id' ? 'Menunggu kalkulasi Confluence...' : 'Awaiting Confluence calculation...'}
                  </p>
                  {onTriggerAnalyze && (
                    <button
                      onClick={onTriggerAnalyze}
                      className="mt-2 text-xs text-cyan-400 hover:underline font-semibold cursor-pointer"
                    >
                      {lang === 'id' ? '⚡ Hitung Protokol Risiko' : '⚡ Calculate Risk Protocol'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
