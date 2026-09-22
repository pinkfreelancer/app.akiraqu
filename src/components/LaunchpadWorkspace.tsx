import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  CryptoSymbolInfo,
  OpenPosition,
} from '../types/crypto.types';
import { Language } from '../i18n/translations';
import { InteractiveChart } from './InteractiveChart';
import { LiquidationHeatmapCard } from './LiquidationHeatmapCard';
import { RiskCalculatorCard } from './RiskCalculatorCard';
import { GaugeChart } from './GaugeChart';
import {
  LaunchpadToolbar,
  LaunchpadLayoutPreset,
} from './launchpad/LaunchpadToolbar';
import { LaunchpadOrderBookTape } from './launchpad/LaunchpadOrderBookTape';
import { LaunchpadQuickTrade } from './launchpad/LaunchpadQuickTrade';
import { LaunchpadPositionsBar } from './launchpad/LaunchpadPositionsBar';
import {
  LaunchpadCustomizerModal,
  GridPanelVisibilityConfig,
} from './launchpad/LaunchpadCustomizerModal';
import {
  LaunchpadMobileTabBar,
  MobileTabKey,
} from './launchpad/LaunchpadMobileTabBar';
import { LaunchpadSimpleView } from './launchpad/LaunchpadSimpleView';
import { LaunchpadOnboardingModal } from './launchpad/LaunchpadOnboardingModal';
import { TradingGlossaryModal } from './launchpad/TradingGlossaryModal';
import {
  Maximize2,
  Minimize2,
  CandlestickChart,
  Gauge,
  Flame,
  ShieldCheck,
  Zap,
  ExternalLink,
  Layers,
  Sparkles,
  X,
  Copy,
  Check,
  Activity,
  Filter,
  BarChart2,
  TrendingUp,
  TrendingDown,
  BookOpen,
} from 'lucide-react';
import { formatCryptoPrice } from '../utils/formatters';

interface LaunchpadWorkspaceProps {
  candles: OHLCVCandle[];
  symbol: string;
  symbols?: CryptoSymbolInfo[];
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
  onSelectSymbol?: (symbol: string) => void;
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
  symbols = [],
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
  onSelectSymbol,
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

  // Layout & Maximize State
  const [layoutPreset, setLayoutPreset] = useState<LaunchpadLayoutPreset>(() => {
    return (localStorage.getItem('imasbtc_launchpad_layout') as LaunchpadLayoutPreset) || 'quad';
  });
  const [maximizedPanel, setMaximizedPanel] = useState<'chart' | 'confluence' | 'heatmap' | 'risk' | null>(null);

  // Workflow Guide Banner State
  const [showWorkflowGuide, setShowWorkflowGuide] = useState<boolean>(() => {
    return localStorage.getItem('imasbtc_grid_guide_dismissed') !== 'true';
  });

  // Sound Alerts state
  const [soundAlerts, setSoundAlerts] = useState<boolean>(() => {
    return localStorage.getItem('imasbtc_grid_sound') !== 'false';
  });

  // Customizer Modal state
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [panelConfig, setPanelConfig] = useState<GridPanelVisibilityConfig>(() => {
    try {
      const saved = localStorage.getItem('imasbtc_grid_panels');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      showChart: true,
      showConfluence: true,
      showLiquidity: true,
      showRisk: true,
      showPositionsBar: true,
    };
  });

  // Panel 1 View Mode: 'chart' (Candlestick) | 'orderbook' (L2 Depth & Tape)
  const [panel1View, setPanel1View] = useState<'chart' | 'orderbook'>('chart');

  // Panel 2 Indicator Category Filter: 'all' | 'bullish' | 'bearish' | 'smc' | 'momentum'
  const [indicatorFilter, setIndicatorFilter] = useState<'all' | 'bullish' | 'bearish' | 'smc' | 'momentum'>('all');

  // Panel 4 Mode: 'calculator' (Full Sizing Calculator) | 'quick_trade' (Paper Trading Desk)
  const [panel4View, setPanel4View] = useState<'calculator' | 'quick_trade'>('calculator');

  // Active Simulated Positions in Grid
  const [gridPositions, setGridPositions] = useState<OpenPosition[]>(() => {
    try {
      const saved = localStorage.getItem('imasbtc_grid_sim_positions');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // Density Mode State: 'pro' (Full 4-Panel Grid) | 'simple' (Clean 1-Screen Summary)
  const [densityMode, setDensityMode] = useState<'pro' | 'simple'>(() => {
    return (localStorage.getItem('imasbtc_grid_density') as 'pro' | 'simple') || 'pro';
  });

  // Mobile Active Tab: 'chart' | 'confluence' | 'liquidity' | 'risk'
  const [mobileTab, setMobileTab] = useState<MobileTabKey>('chart');

  // Modal States
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);

  // Toast Notification State
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => {
      setToastMsg((prev) => (prev?.text === text ? null : prev));
    }, 3000);
  };

  const toggleDensityMode = () => {
    const next = densityMode === 'pro' ? 'simple' : 'pro';
    setDensityMode(next);
    localStorage.setItem('imasbtc_grid_density', next);
    showToast(
      isId
        ? next === 'simple'
          ? 'Mode Ringkas Diaktifkan (Sederhana)'
          : 'Mode Kuantitatif Pro Diaktifkan (12 Indikator)'
        : next === 'simple'
        ? 'Simple Mode Enabled'
        : 'Pro Quant Mode Enabled',
      'info'
    );
  };

  const [copiedConfluence, setCopiedConfluence] = useState(false);

  const activeDisplayPrice = livePrice || (candles.length > 0 ? candles[candles.length - 1].close : 0);

  // Save changes to localStorage
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

  const toggleSound = () => {
    const next = !soundAlerts;
    setSoundAlerts(next);
    localStorage.setItem('imasbtc_grid_sound', next ? 'true' : 'false');
  };

  const handleUpdatePanelConfig = (newConfig: GridPanelVisibilityConfig) => {
    setPanelConfig(newConfig);
    localStorage.setItem('imasbtc_grid_panels', JSON.stringify(newConfig));
  };

  // Audio Chime Player Helper
  const playAudioChime = useCallback((freq = 880) => {
    if (!soundAlerts) return;
    try {
      const audioCtx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.32);
    } catch {}
  }, [soundAlerts]);

  // Trigger audio on confluence completion
  useEffect(() => {
    if (evaluation && evaluation.confluenceScore >= 75) {
      playAudioChime(950);
    }
  }, [evaluation, playAudioChime]);

  // Simulated Trades Handling
  const handleExecuteSimTrade = (pos: OpenPosition) => {
    const updated = [pos, ...gridPositions];
    setGridPositions(updated);
    localStorage.setItem('imasbtc_grid_sim_positions', JSON.stringify(updated));
    playAudioChime(1100);
    showToast(
      isId
        ? `Order Simulasi ${pos.side} $${formatCryptoPrice(pos.entryPrice)} Berhasil Ditempatkan!`
        : `Simulated ${pos.side} order at $${formatCryptoPrice(pos.entryPrice)} placed!`,
      'success'
    );
  };

  const handleClosePosition = (id: string) => {
    const updated = gridPositions.filter((p) => p.id !== id);
    setGridPositions(updated);
    localStorage.setItem('imasbtc_grid_sim_positions', JSON.stringify(updated));
    showToast(isId ? 'Posisi Berhasil Ditutup' : 'Position Closed', 'info');
  };

  const handleClearAllPositions = () => {
    setGridPositions([]);
    localStorage.removeItem('imasbtc_grid_sim_positions');
    showToast(isId ? 'Semua Posisi Dikosongkan' : 'All Positions Cleared', 'info');
  };

  const getIndicatorMeta = (key: string) => {
    const metaMap: Record<string, { name: string; weight: string }> = {
      priceAction: { name: 'Price Action & Trends', weight: '12%' },
      smc: { name: 'Smart Money (SMC / OB / FVG)', weight: '12%' },
      orderFlow: { name: 'Order Flow & Delta', weight: '11%' },
      ict: { name: 'ICT (Killzones & Liquidity)', weight: '10%' },
      optionFlow: { name: 'Option Flow (PCR & Max Pain)', weight: '9%' },
      rsi: { name: 'RSI(14) Momentum', weight: '8%' },
      vwap: { name: 'Institutional VWAP Bands', weight: '8%' },
      fibonacci: { name: 'Fibonacci Retracement', weight: '8%' },
      macd: { name: 'MACD (12, 26, 9)', weight: '8%' },
      ichimoku: { name: 'Ichimoku Kumo Cloud', weight: '6%' },
      tdSequential: { name: 'TD Sequential (DeMark)', weight: '4%' },
      elliottWave: { name: 'Elliott Wave Theory', weight: '4%' },
    };
    return metaMap[key] || { name: key.toUpperCase(), weight: '8%' };
  };

  // Filtered 12 Indicators
  const filteredIndicators = useMemo(() => {
    if (!evaluation?.indicators) return [];
    const entries = Object.entries(evaluation.indicators);

    if (indicatorFilter === 'bullish') {
      return entries.filter(([_, ind]: [string, any]) => ind?.signal === 'BULLISH');
    }
    if (indicatorFilter === 'bearish') {
      return entries.filter(([_, ind]: [string, any]) => ind?.signal === 'BEARISH');
    }
    if (indicatorFilter === 'smc') {
      return entries.filter(([k]) => ['smc', 'ict', 'orderFlow', 'optionFlow'].includes(k));
    }
    if (indicatorFilter === 'momentum') {
      return entries.filter(([k]) => ['rsi', 'macd', 'vwap', 'fibonacci', 'ichimoku'].includes(k));
    }
    return entries;
  }, [evaluation, indicatorFilter]);

  // Copy Confluence
  const handleCopyConfluence = () => {
    if (!evaluation) return;
    const text = `📊 [AKIRAQU CONFLUENCE RADAR - ${symbol} (${timeframe})]
Skor Konfluensi: ${evaluation.confluenceScore}/100 | Bias: ${evaluation.marketBias}
Konsensus: ${evaluation.bullishCount} Bullish • ${evaluation.bearishCount} Bearish • ${evaluation.neutralCount} Netral
Harga Acuan: $${formatCryptoPrice(activeDisplayPrice)}
Catatan: ${evaluation.executiveNarrative || 'Kalkulasi 12-Indikator kuantitatif valid.'}`;

    navigator.clipboard.writeText(text);
    setCopiedConfluence(true);
    showToast(isId ? 'Ringkasan Konfluensi Berhasil Disalin ke Clipboard!' : 'Confluence summary copied to clipboard!', 'success');
    setTimeout(() => setCopiedConfluence(false), 2000);
  };

  // Keyboard Shortcuts listener in Grid
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key.toLowerCase() === 'r' && onTriggerAnalyze && !isLoading) {
        e.preventDefault();
        onTriggerAnalyze();
      } else if (e.key === '1') {
        toggleMaximize('chart');
      } else if (e.key === '2') {
        toggleMaximize('confluence');
      } else if (e.key === '3') {
        toggleMaximize('heatmap');
      } else if (e.key === '4') {
        toggleMaximize('risk');
      } else if (e.key === 'Escape' && maximizedPanel) {
        setMaximizedPanel(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onTriggerAnalyze, isLoading, maximizedPanel]);

  // Panel Header Bar Helper
  const renderPanelHeader = (
    stepTag: string,
    title: string,
    badge: string,
    Icon: React.ElementType,
    panelKey: 'chart' | 'confluence' | 'heatmap' | 'risk',
    targetStage?: StageId,
    targetStageLabel?: string,
    extraControls?: React.ReactNode
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
          {extraControls}

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
            title={isMax ? (isId ? 'Kecilkan Panel [Esc]' : 'Minimize Panel [Esc]') : (isId ? 'Perbesar Panel Penuh [1-4]' : 'Maximize Panel [1-4]')}
          >
            {isMax ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full space-y-3 font-mono relative">
      {/* 🍞 Floating Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div
            className={`px-4 py-2.5 rounded-2xl border shadow-xl flex items-center gap-2 text-xs font-bold ${
              toastMsg.type === 'success'
                ? isDark
                  ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40 shadow-emerald-950/50'
                  : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                : isDark
                ? 'bg-cyan-950/90 text-cyan-300 border-cyan-500/40 shadow-cyan-950/50'
                : 'bg-cyan-100 text-cyan-900 border-cyan-300'
            }`}
          >
            <Check className="w-4 h-4 text-cyan-400" />
            <span>{toastMsg.text}</span>
          </div>
        </div>
      )}

      {/* 🧭 1. Advanced Launchpad Workspace Toolbar */}
      <LaunchpadToolbar
        symbol={symbol}
        symbols={symbols}
        timeframe={timeframe}
        selectedExchange={selectedExchange}
        selectedMarketType={selectedMarketType}
        layoutPreset={layoutPreset}
        densityMode={densityMode}
        livePrice={activeDisplayPrice}
        priceDirection={priceDirection}
        evaluation={evaluation}
        wsStatus={wsStatus}
        latencyMs={latencyMs}
        syncMetrics={syncMetrics}
        soundAlerts={soundAlerts}
        showWorkflowGuide={showWorkflowGuide}
        isLoading={isLoading}
        isDark={isDark}
        lang={lang}
        onSelectSymbol={onSelectSymbol}
        onSelectTimeframe={onSelectTimeframe}
        onSelectExchange={onSelectExchange}
        onSelectMarketType={onSelectMarketType}
        onSelectLayout={handleSelectLayout}
        onToggleDensityMode={toggleDensityMode}
        onToggleSoundAlerts={toggleSound}
        onToggleGuide={toggleGuide}
        onOpenCustomizer={() => setIsCustomizerOpen(true)}
        onOpenGlossary={() => setIsGlossaryOpen(true)}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
        onTriggerAnalyze={onTriggerAnalyze}
      />

      {/* 💡 2. Workflow Guide Banner */}
      {showWorkflowGuide && (
        <div
          className={`p-3.5 rounded-2xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
            isDark
              ? 'bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-slate-900 border-cyan-500/30'
              : 'bg-cyan-50/80 border-cyan-200 text-slate-800'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${isDark ? 'bg-cyan-500/20 text-cyan-300' : 'bg-cyan-100 text-cyan-800'}`}>
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="space-y-1 text-xs">
              <div className="font-bold flex items-center gap-2 text-cyan-400">
                <span>{isId ? 'Panduan Meja Kerja Trading Grid (4 Panel Terpadu)' : 'Unified 4-Panel Grid Trading Desk'}</span>
                <span className="text-[10px] font-normal text-slate-400">
                  {isId ? '• Shortcut: [R] Pindai, [1-4] Perbesar, [W] Layout' : '• Shortcut: [R] Scan, [1-4] Maximize, [W] Layout'}
                </span>
              </div>
              <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {isId
                  ? 'Meja kerja profesional ini mengintegrasikan seluruh alur trading: (1) Grafik & Buku Order L2 untuk struktur harga, (2) Radar Konfluensi 12 Algoritma untuk validasi statistik, (3) Heatmap Likuidasi untuk deteksi jebakan whale, dan (4) Protokol Risiko & Eksekusi Cepat untuk penempatan order instan.'
                  : 'This desk unifies the entire quant workflow: (1) Candlestick Chart & L2 Depth for price action, (2) 12-Indicator Confluence Radar for statistical edge, (3) Liquidation Heatmap for whale traps, and (4) Risk Protocol & Quick Trade for instant execution.'}
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

      {/* 📱 Mobile Tabs Switcher (Shown on mobile when in Pro mode) */}
      {!maximizedPanel && densityMode === 'pro' && (
        <LaunchpadMobileTabBar
          activeTab={mobileTab}
          onSelectTab={setMobileTab}
          confluenceScore={evaluation?.confluenceScore}
          marketBias={evaluation?.marketBias}
          isDark={isDark}
          lang={lang}
        />
      )}

      {/* 🎛️ Simple Density View OR Pro Multi-Grid View */}
      {densityMode === 'simple' ? (
        <LaunchpadSimpleView
          candles={candles}
          symbol={symbol}
          timeframe={timeframe}
          evaluation={evaluation}
          currentPrice={activeDisplayPrice}
          selectedExchange={selectedExchange}
          selectedMarketType={selectedMarketType}
          onExecuteTrade={handleExecuteSimTrade}
          onSwitchToProView={() => {
            setDensityMode('pro');
            localStorage.setItem('imasbtc_grid_density', 'pro');
          }}
          onTriggerAnalyze={onTriggerAnalyze}
          isLoading={isLoading}
          isDark={isDark}
          lang={lang}
        />
      ) : maximizedPanel ? (
        // Single Maximized Panel View
        <div
          className={`w-full rounded-2xl border overflow-hidden transition-colors ${
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
                isId ? 'Buka Modul Grafik' : 'Full Chart View',
                <div className="flex items-center gap-1 mr-2">
                  <button
                    onClick={() => setPanel1View('chart')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      panel1View === 'chart' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    Chart
                  </button>
                  <button
                    onClick={() => setPanel1View('orderbook')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      panel1View === 'orderbook' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    L2 Depth / Tape
                  </button>
                </div>
              )}
              <div className="p-4">
                {panel1View === 'chart' ? (
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
                ) : (
                  <LaunchpadOrderBookTape
                    symbol={symbol}
                    currentPrice={activeDisplayPrice}
                    recentLiveTrades={recentLiveTrades}
                    orderBookBids={orderBookBids}
                    orderBookAsks={orderBookAsks}
                    bidTotal={bidTotal}
                    askTotal={askTotal}
                    selectedExchange={selectedExchange}
                    selectedMarketType={selectedMarketType}
                    isDark={isDark}
                    lang={lang}
                  />
                )}
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
                isId ? 'Buka 12 Indikator Lengkap' : '12 Indicators Detail',
                <button
                  onClick={handleCopyConfluence}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer mr-2"
                >
                  {copiedConfluence ? <Check className="w-3 h-3 text-cyan-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedConfluence ? 'Tersalin' : 'Salin'}</span>
                </button>
              )}
              <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
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
                      {isId ? 'Bias Konsensus Kuantitatif' : 'Quant Consensus Bias'}
                    </span>
                    <h4 className={`text-xl font-bold mt-1 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>{evaluation.marketBias}</h4>
                    <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {evaluation.bullishCount} Bullish • {evaluation.bearishCount} Bearish • {evaluation.neutralCount} {isId ? 'Netral' : 'Neutral'}
                    </p>
                  </div>
                </div>

                <div className="lg:col-span-8 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[500px] overflow-y-auto pr-1">
                    {filteredIndicators.map(([key, ind]: [string, any]) => (
                      <div
                        key={key}
                        className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                          isDark ? 'bg-[#090d16] border-[#1e293b]' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <span className={`font-semibold uppercase tracking-wider block truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{key}</span>
                          <p className={`text-[11px] mt-0.5 line-clamp-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{ind?.summary}</p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
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
                isId ? 'Kalkulator Risiko & Simulasi Eksekusi' : 'Risk Management & Sizing Planner',
                'RISK PROTOCOL',
                ShieldCheck,
                'risk',
                'manual_trading',
                isId ? 'Kirim ke Trading Manual ⚡' : 'Go to Manual Trading ⚡',
                <div className="flex items-center gap-1 mr-2">
                  <button
                    onClick={() => setPanel4View('calculator')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      panel4View === 'calculator' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    Kalkulator
                  </button>
                  <button
                    onClick={() => setPanel4View('quick_trade')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      panel4View === 'quick_trade' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    Eksekusi Cepat
                  </button>
                </div>
              )}
              <div className="p-4">
                {panel4View === 'calculator' ? (
                  <RiskCalculatorCard
                    initialRiskPlan={evaluation.riskPlan}
                    symbol={symbol}
                    indicators={evaluation.indicators}
                    currentPrice={activeDisplayPrice}
                    lang={lang}
                    theme={theme}
                  />
                ) : (
                  <LaunchpadQuickTrade
                    symbol={symbol}
                    currentPrice={activeDisplayPrice}
                    riskPlan={evaluation.riskPlan}
                    selectedExchange={selectedExchange}
                    selectedMarketType={selectedMarketType}
                    onExecuteSimulatedTrade={handleExecuteSimTrade}
                    isDark={isDark}
                    lang={lang}
                  />
                )}
              </div>
            </>
          )}
        </div>
      ) : (
        // Standard Multi-Tile Grid
        <div
          className={`grid gap-3.5 ${
            layoutPreset === 'quad'
              ? 'grid-cols-1 xl:grid-cols-2'
              : layoutPreset === 'chart_focus'
              ? 'grid-cols-1 lg:grid-cols-12'
              : layoutPreset === 'execution_focus'
              ? 'grid-cols-1 lg:grid-cols-12'
              : layoutPreset === 'dual_chart_confluence'
              ? 'grid-cols-1 lg:grid-cols-2'
              : layoutPreset === 'triple_analytics'
              ? 'grid-cols-1 lg:grid-cols-3'
              : 'grid-cols-1 lg:grid-cols-2'
          }`}
        >
          {/* TILE 1: Candlestick Chart & L2 Depth Stream */}
          {panelConfig.showChart && (
            <div
              className={`rounded-2xl border overflow-hidden transition-colors ${
                isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200'
              } ${
                layoutPreset === 'chart_focus'
                  ? 'lg:col-span-8'
                  : layoutPreset === 'execution_focus'
                  ? 'lg:col-span-7'
                  : ''
              } ${mobileTab !== 'chart' ? 'hidden lg:block' : ''}`}
            >
              {renderPanelHeader(
                isId ? 'Langkah 3: Validasi' : 'Step 3: Validation',
                isId ? 'Grafik Candlestick & L2 Depth' : 'Candlestick Chart & L2 Depth',
                'LIVE',
                CandlestickChart,
                'chart',
                'ticker',
                isId ? 'Grafik Penuh' : 'Full Chart',
                <div className="flex items-center gap-1 mr-1.5">
                  <button
                    onClick={() => setPanel1View('chart')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                      panel1View === 'chart'
                        ? 'bg-cyan-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Chart
                  </button>
                  <button
                    onClick={() => setPanel1View('orderbook')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                      panel1View === 'orderbook'
                        ? 'bg-cyan-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Depth / Tape
                  </button>
                </div>
              )}
              <div className="p-3">
                {panel1View === 'chart' ? (
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
                ) : (
                  <LaunchpadOrderBookTape
                    symbol={symbol}
                    currentPrice={activeDisplayPrice}
                    recentLiveTrades={recentLiveTrades}
                    orderBookBids={orderBookBids}
                    orderBookAsks={orderBookAsks}
                    bidTotal={bidTotal}
                    askTotal={askTotal}
                    selectedExchange={selectedExchange}
                    selectedMarketType={selectedMarketType}
                    isDark={isDark}
                    lang={lang}
                  />
                )}
              </div>
            </div>
          )}

          {/* TILE 2: Confluence Radar & Scorecard */}
          {panelConfig.showConfluence && (
            <div
              className={`rounded-2xl border overflow-hidden transition-colors ${
                isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200'
              } ${
                layoutPreset === 'chart_focus'
                  ? 'lg:col-span-4'
                  : layoutPreset === 'execution_focus'
                  ? 'lg:col-span-5'
                  : ''
              } ${mobileTab !== 'confluence' ? 'hidden lg:block' : ''}`}
            >
              {renderPanelHeader(
                isId ? 'Langkah 3: Konfluensi' : 'Step 3: Confluence',
                isId ? 'Radar Konfluensi & 12 Indikator' : 'Confluence Radar & 12 Inds',
                'QUANTUM 100',
                Gauge,
                'confluence',
                'indicators',
                isId ? '12 Indikator' : '12 Indicators',
                <button
                  onClick={handleCopyConfluence}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer mr-1"
                  title={isId ? 'Salin Ringkasan Konfluensi' : 'Copy Confluence Summary'}
                >
                  {copiedConfluence ? <Check className="w-3 h-3 text-cyan-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedConfluence ? 'Tersalin' : 'Salin'}</span>
                </button>
              )}
              <div className="p-4 space-y-3">
                {evaluation ? (
                  <>
                    <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-900/50 border border-slate-800/80">
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

                    {/* Indicator Category Filters */}
                    <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px]">
                      <button
                        onClick={() => setIndicatorFilter('all')}
                        className={`px-2 py-0.5 rounded font-bold cursor-pointer shrink-0 ${
                          indicatorFilter === 'all'
                            ? 'bg-cyan-500 text-slate-950'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        Semua (12)
                      </button>
                      <button
                        onClick={() => setIndicatorFilter('bullish')}
                        className={`px-2 py-0.5 rounded font-bold cursor-pointer shrink-0 ${
                          indicatorFilter === 'bullish'
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        Bullish ({evaluation.bullishCount})
                      </button>
                      <button
                        onClick={() => setIndicatorFilter('bearish')}
                        className={`px-2 py-0.5 rounded font-bold cursor-pointer shrink-0 ${
                          indicatorFilter === 'bearish'
                            ? 'bg-rose-500 text-slate-950'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        Bearish ({evaluation.bearishCount})
                      </button>
                      <button
                        onClick={() => setIndicatorFilter('smc')}
                        className={`px-2 py-0.5 rounded font-bold cursor-pointer shrink-0 ${
                          indicatorFilter === 'smc'
                            ? 'bg-cyan-500 text-slate-950'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        SMC & Flow
                      </button>
                    </div>

                    {/* Compact Quick 12-Indicator Status Pills */}
                    <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
                      {filteredIndicators.map(([key, ind]: [string, any]) => {
                        const meta = getIndicatorMeta(key);
                        return (
                          <div
                            key={key}
                            className={`px-3 py-1.5 rounded-xl border text-xs flex items-center justify-between ${
                              isDark ? 'bg-[#090d16] border-[#1e293b]' : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <div className="flex items-center gap-1.5">
                                <span className={`font-semibold text-[11px] truncate block ${
                                  isDark ? 'text-slate-200' : 'text-slate-800'
                                }`}>
                                  {meta.name}
                                </span>
                                <span className="text-[9px] font-mono text-cyan-400/80 px-1 py-0.2 rounded bg-cyan-950/40 border border-cyan-800/40 shrink-0">
                                  {meta.weight}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-500 truncate block mt-0.5">
                                {ind?.summary}
                              </span>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono shrink-0 ${
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
                        );
                      })}
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
                        ? 'Grafik dibuka seketika. Klik di bawah atau tekan [R] untuk memproses kalkulasi 12-Indikator.'
                        : 'Chart ready. Click below or press [R] to compute the 12-indicator confluence.'}
                    </p>
                    {onTriggerAnalyze && (
                      <button
                        onClick={onTriggerAnalyze}
                        className={`px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer ${
                          isDark
                            ? 'bg-gradient-to-r from-cyan-500 to-cyan-400 text-slate-950 hover:from-cyan-400 hover:to-cyan-300 shadow-cyan-500/20'
                            : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/20'
                        }`}
                      >
                        <Zap className="w-3.5 h-3.5 fill-current" />
                        {isId ? `Pindai Konfluensi (${timeframe}) [R]` : `Run Analysis (${timeframe}) [R]`}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TILE 3: Liquidation Heatmap & CVD (Hidden in dual preset) */}
          {panelConfig.showLiquidity && layoutPreset !== 'dual_chart_confluence' && (
            <div
              className={`rounded-2xl border overflow-hidden transition-colors ${
                isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200'
              } ${
                layoutPreset === 'chart_focus'
                  ? 'lg:col-span-6'
                  : layoutPreset === 'execution_focus'
                  ? 'lg:col-span-6'
                  : ''
              } ${mobileTab !== 'liquidity' ? 'hidden lg:block' : ''}`}
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

          {/* TILE 4: Risk Protocol & Quick Execution Planner (Hidden in dual preset) */}
          {panelConfig.showRisk && layoutPreset !== 'dual_chart_confluence' && (
            <div
              className={`rounded-2xl border overflow-hidden transition-colors ${
                isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200'
              } ${
                layoutPreset === 'chart_focus'
                  ? 'lg:col-span-6'
                  : layoutPreset === 'execution_focus'
                  ? 'lg:col-span-6'
                  : ''
              } ${mobileTab !== 'risk' ? 'hidden lg:block' : ''}`}
            >
              {renderPanelHeader(
                isId ? 'Langkah 4: Hitung Risiko' : 'Step 4: Risk Protocol',
                isId ? 'Kalkulator Risiko & Eksekusi' : 'Risk Calculator & Execution',
                'PLANNER',
                ShieldCheck,
                'risk',
                'manual_trading',
                isId ? 'Eksekusi ⚡' : 'Execute ⚡',
                <div className="flex items-center gap-1 mr-1.5">
                  <button
                    onClick={() => setPanel4View('calculator')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                      panel4View === 'calculator'
                        ? 'bg-cyan-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Kalkulator
                  </button>
                  <button
                    onClick={() => setPanel4View('quick_trade')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                      panel4View === 'quick_trade'
                        ? 'bg-cyan-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Order Cepat
                  </button>
                </div>
              )}
              <div className="p-3">
                {panel4View === 'calculator' ? (
                  evaluation?.riskPlan ? (
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
                          {isId ? '⚡ Hitung Protokol Risiko [R]' : '⚡ Calculate Risk Protocol [R]'}
                        </button>
                      )}
                    </div>
                  )
                ) : (
                  <LaunchpadQuickTrade
                    symbol={symbol}
                    currentPrice={activeDisplayPrice}
                    riskPlan={evaluation?.riskPlan}
                    selectedExchange={selectedExchange}
                    selectedMarketType={selectedMarketType}
                    onExecuteSimulatedTrade={handleExecuteSimTrade}
                    isDark={isDark}
                    lang={lang}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Active Grid Simulated Positions Bar */}
      {panelConfig.showPositionsBar && (
        <LaunchpadPositionsBar
          positions={gridPositions}
          currentPrice={activeDisplayPrice}
          onClosePosition={handleClosePosition}
          onClearAllPositions={handleClearAllPositions}
          isDark={isDark}
          lang={lang}
        />
      )}

      {/* 5. Customizer Modal */}
      <LaunchpadCustomizerModal
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        panelConfig={panelConfig}
        onUpdatePanelConfig={handleUpdatePanelConfig}
        layoutPreset={layoutPreset}
        onSelectLayoutPreset={handleSelectLayout}
        soundAlerts={soundAlerts}
        onToggleSoundAlerts={toggleSound}
        isDark={isDark}
        lang={lang}
      />

      {/* 6. Onboarding Tour Modal */}
      <LaunchpadOnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        isDark={isDark}
        lang={lang}
      />

      {/* 7. Trading Glossary Modal */}
      <TradingGlossaryModal
        isOpen={isGlossaryOpen}
        onClose={() => setIsGlossaryOpen(false)}
        isDark={isDark}
        lang={lang}
      />
    </div>
  );
};
