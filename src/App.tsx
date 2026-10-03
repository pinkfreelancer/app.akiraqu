import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ExportModal } from './components/ExportModal';
import { AssuranceModal } from './components/AssuranceModal';
import { CommandBarModal } from './components/CommandBarModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { TerminalStatusBar } from './components/TerminalStatusBar';
import { LaunchpadWorkspace } from './components/LaunchpadWorkspace';
import { PendingAnalysisCard } from './components/PendingAnalysisCard';
import { AlertCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AkiraQuLogo } from './components/AkiraQuLogo';
import { TerminalProvider, useTerminal } from './contexts/TerminalContext';
import { AlertProvider, useAlerts } from './contexts/AlertContext';
import { useAuth } from './contexts/AuthContext';
import { AlertCenterModal } from './components/alerts/AlertCenterModal';
import { AlertToastContainer } from './components/alerts/AlertToastContainer';

// Modular Pages
import { TickerPage } from './pages/TickerPage';
import { SignalPage } from './pages/SignalPage';
import { ScreeningPage } from './pages/ScreeningPage';
import { WatchlistPage } from './pages/WatchlistPage';
import { ScannerPage } from './pages/ScannerPage';
import { OrderflowHeatmapPage } from './pages/OrderflowHeatmapPage';
import { IndicatorsPage } from './pages/IndicatorsPage';
import { ConfluencePage } from './pages/ConfluencePage';
import { SentimentNewsPage } from './pages/SentimentNewsPage';
import { RiskPage } from './pages/RiskPage';
import { TradingJournalPage } from './pages/TradingJournalPage';
import { BotTradingHubPage } from './pages/BotTradingHubPage';
import { TradingHubPage } from './pages/TradingHubPage';
import { BacktestPage } from './pages/BacktestPage';
import { OutputPage } from './pages/OutputPage';
import { SettingsPage } from './pages/SettingsPage';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { DocsPage } from './pages/DocsPage';
import { SystemHealthPage } from './pages/SystemHealthPage';

// Newly structured Terminal Views
import { MarketHeatmapView } from './components/market/MarketHeatmapView';
import { GainersLosersView } from './components/market/GainersLosersView';
import { MacroDominanceView } from './components/macro/MacroDominanceView';
import { OnChainDataView } from './components/macro/OnChainDataView';
import { EconomicCalendarView } from './components/macro/EconomicCalendarView';
import { MtfScreenerView } from './components/technical/MtfScreenerView';
import { VolatilityScannerView } from './components/technical/VolatilityScannerView';
import { CorrelationBetaView } from './components/technical/CorrelationBetaView';
import { ReturnDistributionView } from './components/research/ReturnDistributionView';
import { ActiveOrdersView } from './components/execution/ActiveOrdersView';
import { PositionSizingView } from './components/execution/PositionSizingView';
import { MultiExchangeManagerView } from './components/connection/MultiExchangeManagerView';
import { AlertBuilderView } from './components/connection/AlertBuilderView';
import { TraderWorkflowBar, TraderPersona } from './components/TraderWorkflowBar';
import { MasterAnchorChart } from './components/workspace/MasterAnchorChart';

function TerminalApp() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const {
    viewMode,
    currentStage,
    backtestIndicator,
    navigateToLanding,
    navigateToLogin,
    navigateToTerminal,
    navigateToDocs,
    navigateToSystemHealth,
    selectStage,
    openBacktest,

    lang,
    toggleLang,
    theme,
    setEngineTheme,
    customThemeColor,
    setCustomThemeColor,
    customThemeBg,
    setCustomThemeBg,
    toggleTheme,
    isDark,
    t,

    workspaceMode,
    toggleWorkspaceMode,
    setWorkspaceModeDirect,
    isTraderWorkbenchVisible,
    toggleTraderWorkbench,
    isFullWidth,
    toggleFullWidth,
    isFullscreen,
    toggleFullscreen,

    symbols,
    selectedSymbol,
    selectedTimeframe,
    selectedExchange,
    selectedMarketType,
    handleSymbolChange,
    handleTimeframeChange,
    handleExchangeChange,
    handleMarketTypeChange,

    livePrice,
    activeDisplayPrice,
    priceDirection,
    wsStatus,
    latencyMs,
    syncMetrics,
    recentLiveTrades,
    orderBookBids,
    orderBookAsks,
    bidTotal,
    askTotal,
    candles,

    evaluation,
    hasEvaluation,
    isLoading,
    errorNotice,
    runCurrentAnalysis,
    healthStatus,

    isCommandBarOpen,
    setIsCommandBarOpen,
    isShortcutsModalOpen,
    setIsShortcutsModalOpen,
    isExportModalOpen,
    setIsExportModalOpen,
    isAssuranceModalOpen,
    setIsAssuranceModalOpen,
  } = useTerminal();

  const { setNavigateCallback } = useAlerts();

  // Register navigation callback for alert direct links
  useEffect(() => {
    setNavigateCallback((stage, symbol) => {
      selectStage(stage);
      if (symbol) {
        handleSymbolChange(symbol);
      }
    });
  }, [setNavigateCallback, selectStage, handleSymbolChange]);

  // Sidebar Open/Collapse State: On mobile (<768px) default to closed for full chart focus
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return false;
    }
    try {
      const saved = localStorage.getItem('imasbtc_sidebar_open');
      if (saved !== null) return JSON.parse(saved);
    } catch {}
    return true; // Default open on desktop
  });

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('imasbtc_sidebar_open', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Keyboard shortcut Ctrl+B / Cmd+B for Sidebar toggle
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b' && !isInput) {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  // Trader Persona state for personalizing workflow stages
  const [traderPersona, setTraderPersona] = useState<TraderPersona>(() => {
    try {
      const saved = localStorage.getItem('akiraqu_trader_persona');
      if (saved) return saved as TraderPersona;
    } catch {}
    return 'full_cycle';
  });

  const handlePersonaChange = (newPersona: TraderPersona) => {
    setTraderPersona(newPersona);
    try {
      localStorage.setItem('akiraqu_trader_persona', newPersona);
    } catch {}
  };

  // Binary fallback theme ('light' | 'dark') for downstream components that only accept binary theme
  const binaryTheme: 'light' | 'dark' = isDark ? 'dark' : 'light';

  // If in Landing Mode, render the Landing Page
  if (viewMode === 'landing') {
    return (
      <LandingPage
        lang={lang}
        theme={binaryTheme}
        onSetLang={toggleLang}
        onToggleTheme={toggleTheme}
        onNavigateToTerminal={(stage) => navigateToTerminal(stage)}
        onNavigateToLogin={navigateToLogin}
        onOpenDocs={navigateToDocs}
      />
    );
  }

  // If in Login Mode, render the Login Page
  if (viewMode === 'login') {
    return (
      <LoginPage
        lang={lang}
        theme={binaryTheme}
        onNavigateToTerminal={() => navigateToTerminal()}
        onNavigateToLanding={navigateToLanding}
      />
    );
  }

  // If in Docs Mode, render the dedicated Full Documentation Page
  if (viewMode === 'docs') {
    return (
      <DocsPage
        lang={lang}
        theme={binaryTheme}
        onSetLang={toggleLang}
        onToggleTheme={toggleTheme}
        onNavigateToTerminal={(stage) => navigateToTerminal(stage)}
        onNavigateToLanding={navigateToLanding}
      />
    );
  }

  // If in System Health Mode (/system_health), render Developer Health & V8 Telemetry Dashboard
  if (viewMode === 'system_health') {
    return (
      <SystemHealthPage
        isDark={isDark}
        onNavigateToTerminal={() => navigateToTerminal()}
        onNavigateToLanding={() => navigateToLanding()}
        onNavigateToDocs={() => navigateToDocs()}
      />
    );
  }

  // AUTHENTICATION GUARD: Terminal Workspace requires valid Google / Gmail login
  if (!isAuthenticated || !user) {
    if (authLoading) {
      return (
        <div className={`min-h-screen flex flex-col items-center justify-center font-mono ${
          isDark ? 'bg-[#070b14] text-slate-100' : 'bg-[#f8fafc] text-slate-900'
        }`}>
          <div className="flex flex-col items-center gap-4 p-8 rounded-[2px] border border-pink-500/30 bg-slate-900/60 shadow-2xl backdrop-blur-md">
            <AkiraQuLogo size={48} theme={binaryTheme} variant="symbol" />
            <div className="flex items-center gap-2 text-pink-400 font-bold text-sm">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Memverifikasi Sesi Akun Google...</span>
            </div>
            <p className="text-xs text-slate-400">Sinkronisasi Keamanan Firebase & Cloud Firestore</p>
          </div>
        </div>
      );
    }

    // Direct unauthenticated users to the Login Page with return to terminal upon sign in
    return (
      <LoginPage
        lang={lang}
        theme={binaryTheme}
        onNavigateToTerminal={() => navigateToTerminal()}
        onNavigateToLanding={navigateToLanding}
      />
    );
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
      isDark ? 'bg-[#070b14] text-slate-100' : 'bg-[#f8fafc] text-slate-900'
    }`}>
      {/* Header */}
      <Header
        symbols={symbols}
        selectedSymbol={selectedSymbol}
        selectedTimeframe={selectedTimeframe}
        onSelectSymbol={handleSymbolChange}
        onSelectTimeframe={handleTimeframeChange}
        onTriggerAnalyze={runCurrentAnalysis}
        isLoading={isLoading}
        hasEvaluation={hasEvaluation}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenAssuranceModal={() => setIsAssuranceModalOpen(true)}
        onOpenBacktest={openBacktest}
        onNavigateToLanding={navigateToLanding}
        onNavigateToLogin={navigateToLogin}
        healthStatus={healthStatus}
        livePrice={activeDisplayPrice || undefined}
        priceDirection={priceDirection}
        wsStatus={wsStatus}
        syncMetrics={syncMetrics}
        lang={lang}
        onToggleLang={toggleLang}
        theme={theme}
        onToggleTheme={toggleTheme}
        onSelectTheme={setEngineTheme}
        customThemeColor={customThemeColor}
        onUpdateCustomColor={setCustomThemeColor}
        customThemeBg={customThemeBg}
        onUpdateCustomBg={setCustomThemeBg}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        isFullWidth={isFullWidth}
        onToggleFullWidth={toggleFullWidth}
        workspaceMode={workspaceMode}
        onToggleWorkspaceMode={toggleWorkspaceMode}
        onSelectWorkspaceMode={setWorkspaceModeDirect}
        isWorkbenchVisible={isTraderWorkbenchVisible}
        onToggleWorkbench={toggleTraderWorkbench}
        onOpenCommandBar={() => setIsCommandBarOpen(true)}
        onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
        onOpenDocs={navigateToDocs}
        onOpenSystemHealth={navigateToSystemHealth}
        currentStage={currentStage}
        onSelectStage={selectStage}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
      />

      {/* Main Terminal Workspace Layout with Sidebar */}
      <div className="flex-1 flex overflow-x-hidden min-h-0 relative">
        {/* Collapsible Nested Sidebar Navigation */}
        <Sidebar
          currentStage={currentStage}
          onSelectStage={selectStage}
          isOpen={isSidebarOpen}
          onToggleOpen={toggleSidebar}
          lang={lang}
          theme={binaryTheme}
          confluenceScore={evaluation?.confluenceScore}
          marketBias={evaluation?.marketBias}
          wsStatus={wsStatus}
          latencyMs={latencyMs}
          onOpenDocs={navigateToDocs}
        />

        {/* Scrollable Stage Workspace Content */}
        <div className="flex-1 flex flex-col min-w-0 max-w-full overflow-y-auto overflow-x-hidden">
          <main id="main-content" tabIndex={-1} className="flex-1 w-full max-w-full mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4 transition-all duration-200 focus:outline-none overflow-x-hidden">
            {/* Meja Kerja Trader Workflow Bar (Siklus Harian & Personalisasi) */}
            {isTraderWorkbenchVisible && (
              <TraderWorkflowBar
                currentStage={currentStage}
                onSelectStage={selectStage}
                lang={lang}
                theme={binaryTheme}
                activePersona={traderPersona}
                onPersonaChange={handlePersonaChange}
                workspaceMode={workspaceMode}
                onSelectWorkspaceMode={setWorkspaceModeDirect}
                onTriggerAnalyze={runCurrentAnalysis}
                isAnalyzing={isLoading}
                onClose={toggleTraderWorkbench}
              />
            )}

            {/* Workspace Mode: Launchpad Quad-Grid, Split Master Anchor, or Classic Single Stage */}
            {workspaceMode === 'launchpad' ? (
              <LaunchpadWorkspace
                candles={candles}
                symbol={selectedSymbol}
                symbols={symbols}
                timeframe={selectedTimeframe}
                evaluation={evaluation}
                livePrice={activeDisplayPrice || undefined}
                priceDirection={priceDirection}
                wsStatus={wsStatus}
                latencyMs={latencyMs}
                syncMetrics={syncMetrics}
                recentLiveTrades={recentLiveTrades}
                orderBookBids={orderBookBids}
                orderBookAsks={orderBookAsks}
                bidTotal={bidTotal}
                askTotal={askTotal}
                selectedExchange={selectedExchange}
                selectedMarketType={selectedMarketType}
                onSelectSymbol={handleSymbolChange}
                onSelectExchange={handleExchangeChange}
                onSelectMarketType={handleMarketTypeChange}
                onSelectTimeframe={handleTimeframeChange}
                onTriggerAnalyze={runCurrentAnalysis}
                onNavigateStage={(stage) => {
                  setWorkspaceModeDirect('classic');
                  selectStage(stage);
                }}
                isLoading={isLoading}
                lang={lang}
                theme={binaryTheme}
              />
            ) : (
          <div className="space-y-4">
            {/* Error Notification Banner */}
            {errorNotice && (
              <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-red-300 text-xs font-mono flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{errorNotice}</span>
                </div>
                <button
                  onClick={runCurrentAnalysis}
                  className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded border border-red-500/30 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>{lang === 'id' ? 'Ulangi' : 'Retry'}</span>
                </button>
              </div>
            )}

            {/* Stage Screen Content: Split Master-Detail vs Full Stage View */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStage}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="w-full"
              >
                {isLoading && !evaluation && currentStage !== 'journal' && currentStage !== 'bot' && currentStage !== 'backtest' ? (
                  <div className={`p-16 rounded-xl border flex flex-col items-center justify-center space-y-4 font-mono ${
                    isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-sm'
                  }`}>
                    <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs text-cyan-400 animate-pulse">
                      {lang === 'id' ? 'Memuat data kuantitatif terminal...' : 'Computing quantitative terminal matrix...'}
                    </span>
                  </div>
                ) : (
                  workspaceMode === 'split' && currentStage !== 'ticker' ? (
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
                      {/* Master Anchor: Chart & Live Ticker (Pinned on Left) */}
                      <div className="xl:col-span-5 sticky top-2 z-10 min-w-0">
                        <MasterAnchorChart
                          candles={candles}
                          symbol={selectedSymbol}
                          timeframe={selectedTimeframe}
                          evaluation={evaluation}
                          livePrice={activeDisplayPrice || undefined}
                          priceDirection={priceDirection}
                          wsStatus={wsStatus}
                          latencyMs={latencyMs}
                          syncMetrics={syncMetrics}
                          selectedExchange={selectedExchange}
                          selectedMarketType={selectedMarketType}
                          onSelectTimeframe={handleTimeframeChange}
                          onSelectExchange={handleExchangeChange}
                          onSelectMarketType={handleMarketTypeChange}
                          onTriggerAnalyze={runCurrentAnalysis}
                          onNavigateToStage={selectStage}
                          isLoading={isLoading}
                          lang={lang}
                          theme={binaryTheme}
                          onCloseSplit={() => setWorkspaceModeDirect('classic')}
                        />
                      </div>

                      {/* Detail Column: Active Selected Stage Module */}
                      <div className="xl:col-span-7 min-w-0 space-y-4">
                        {currentStage === 'signal' && (
                          <SignalPage
                            currentSymbol={selectedSymbol}
                            onSelectSymbol={(sym) => {
                              handleSymbolChange(sym);
                              selectStage('ticker');
                            }}
                            onNavigateToTrade={(sym) => {
                              handleSymbolChange(sym);
                              selectStage('manual_trading');
                            }}
                            selectedExchange={selectedExchange}
                            theme={binaryTheme}
                            lang={lang}
                          />
                        )}
                        {currentStage === 'market_heatmap' && (
                          <MarketHeatmapView
                            onSelectCoin={(sym) => {
                              handleSymbolChange(sym);
                              selectStage('ticker');
                            }}
                            onNavigateToTrade={(sym) => {
                              handleSymbolChange(sym);
                              selectStage('manual_trading');
                            }}
                            theme={binaryTheme}
                            lang={lang}
                          />
                        )}
                        {currentStage === 'gainers_losers' && (
                          <GainersLosersView
                            onSelectCoin={(sym) => {
                              handleSymbolChange(sym);
                              selectStage('ticker');
                            }}
                            onNavigateToTrade={(sym) => {
                              handleSymbolChange(sym);
                              selectStage('manual_trading');
                            }}
                            theme={binaryTheme}
                            lang={lang}
                          />
                        )}
                        {currentStage === 'screening' && (
                          <ScreeningPage
                            currentSymbol={selectedSymbol}
                            onSelectSymbol={(sym) => {
                              handleSymbolChange(sym);
                              selectStage('ticker');
                            }}
                            onNavigateToTrade={(sym) => {
                              handleSymbolChange(sym);
                              selectStage('manual_trading');
                            }}
                            onAddToWatchlist={(sym) => {
                              handleSymbolChange(sym);
                            }}
                            selectedExchange={selectedExchange}
                            theme={binaryTheme}
                            lang={lang}
                          />
                        )}
                        {currentStage === 'watchlist' && (
                          <WatchlistPage
                            currentSymbol={selectedSymbol}
                            onSelectSymbol={(sym) => {
                              handleSymbolChange(sym);
                              selectStage('ticker');
                            }}
                            onNavigateToTrade={(sym) => {
                              handleSymbolChange(sym);
                              selectStage('manual_trading');
                            }}
                            selectedExchange={selectedExchange}
                            theme={binaryTheme}
                            lang={lang}
                          />
                        )}
                        {currentStage === 'btc_dominance' && (
                          <MacroDominanceView
                            theme={binaryTheme}
                            lang={lang}
                          />
                        )}
                        {currentStage === 'onchain_data' && (
                          <OnChainDataView
                            theme={binaryTheme}
                            lang={lang}
                          />
                        )}
                        {currentStage === 'economic_calendar' && (
                          <EconomicCalendarView
                            theme={binaryTheme}
                            lang={lang}
                          />
                        )}
                        {currentStage === 'scanner' && (
                          <ScannerPage
                            onSelectCoin={(sym) => {
                              handleSymbolChange(sym);
                              selectStage('ticker');
                            }}
                            selectedExchange={selectedExchange}
                            selectedMarketType={selectedMarketType}
                            lang={lang}
                            theme={binaryTheme}
                          />
                        )}
                        {currentStage === 'mtf_screener' && (
                          <MtfScreenerView
                            onSelectCoin={(sym) => {
                              handleSymbolChange(sym);
                              selectStage('ticker');
                            }}
                            onNavigateToTrade={(sym) => {
                              handleSymbolChange(sym);
                              selectStage('manual_trading');
                            }}
                            theme={binaryTheme}
                            lang={lang}
                          />
                        )}
                        {currentStage === 'orderflow' && (
                          <OrderflowHeatmapPage
                            symbol={selectedSymbol}
                            evaluation={evaluation}
                            candles={candles}
                            timeframe={selectedTimeframe}
                            selectedExchange={selectedExchange}
                            selectedMarketType={selectedMarketType}
                            lang={lang}
                            theme={binaryTheme}
                          />
                        )}
                        {currentStage === 'volatility_scanner' && (
                          <VolatilityScannerView
                            onSelectCoin={(sym) => {
                              handleSymbolChange(sym);
                              selectStage('ticker');
                            }}
                            theme={binaryTheme}
                            lang={lang}
                          />
                        )}
                        {currentStage === 'correlation_beta' && (
                          <CorrelationBetaView
                            theme={binaryTheme}
                            lang={lang}
                          />
                        )}
                        {currentStage === 'return_distribution' && (
                          <ReturnDistributionView
                            theme={binaryTheme}
                            lang={lang}
                          />
                        )}
                        {currentStage === 'active_orders' && (
                          <ActiveOrdersView
                            onNavigateToTrade={(sym) => {
                              handleSymbolChange(sym);
                              selectStage('manual_trading');
                            }}
                            theme={binaryTheme}
                            lang={lang}
                          />
                        )}
                        {currentStage === 'position_sizing' && (
                          <PositionSizingView
                            currentSymbol={selectedSymbol}
                            currentPrice={activeDisplayPrice || 88500}
                            onNavigateToTrade={(sym) => {
                              handleSymbolChange(sym);
                              selectStage('manual_trading');
                            }}
                            theme={binaryTheme}
                            lang={lang}
                          />
                        )}
                        {currentStage === 'multi_exchange' && (
                          <MultiExchangeManagerView
                            theme={binaryTheme}
                            lang={lang}
                          />
                        )}
                        {currentStage === 'alerts' && (
                          <AlertBuilderView
                            currentSymbol={selectedSymbol}
                            theme={binaryTheme}
                            lang={lang}
                          />
                        )}
                        {currentStage === 'indicators' && (
                          evaluation ? (
                            <IndicatorsPage
                              indicators={evaluation.indicators}
                              onOpenBacktest={openBacktest}
                              lang={lang}
                              theme={binaryTheme}
                            />
                          ) : (
                            <PendingAnalysisCard
                              symbol={selectedSymbol}
                              timeframe={selectedTimeframe}
                              onTriggerAnalyze={runCurrentAnalysis}
                              onGoToChart={() => selectStage('ticker')}
                              isLoading={isLoading}
                              lang={lang}
                              theme={binaryTheme}
                            />
                          )
                        )}
                        {currentStage === 'confluence' && (
                          evaluation ? (
                            <ConfluencePage
                              score={evaluation.confluenceScore}
                              bias={evaluation.marketBias}
                              bullishCount={evaluation.bullishCount}
                              bearishCount={evaluation.bearishCount}
                              neutralCount={evaluation.neutralCount}
                              indicators={evaluation.indicators}
                              lang={lang}
                              theme={binaryTheme}
                            />
                          ) : (
                            <PendingAnalysisCard
                              symbol={selectedSymbol}
                              timeframe={selectedTimeframe}
                              onTriggerAnalyze={runCurrentAnalysis}
                              onGoToChart={() => selectStage('ticker')}
                              isLoading={isLoading}
                              lang={lang}
                              theme={binaryTheme}
                            />
                          )
                        )}
                        {currentStage === 'sentiment' && (
                          <SentimentNewsPage
                            onSelectCoin={(sym) => {
                              handleSymbolChange(sym);
                              selectStage('ticker');
                            }}
                            theme={binaryTheme}
                          />
                        )}
                        {currentStage === 'risk' && (
                          evaluation ? (
                            <RiskPage
                              initialRiskPlan={evaluation.riskPlan}
                              symbol={selectedSymbol}
                              indicators={evaluation.indicators}
                              currentPrice={activeDisplayPrice || evaluation.riskPlan?.currentPrice}
                              lang={lang}
                              theme={binaryTheme}
                            />
                          ) : (
                            <PendingAnalysisCard
                              symbol={selectedSymbol}
                              timeframe={selectedTimeframe}
                              onTriggerAnalyze={runCurrentAnalysis}
                              onGoToChart={() => selectStage('ticker')}
                              isLoading={isLoading}
                              lang={lang}
                              theme={binaryTheme}
                            />
                          )
                        )}
                        {(currentStage === 'trading' ||
                          currentStage === 'manual_trading' ||
                          currentStage === 'bot' ||
                          currentStage === 'journal' ||
                          currentStage === 'portfolio' ||
                          currentStage === 'reports') && (
                          <TradingHubPage
                            currentSymbol={selectedSymbol}
                            currentPrice={activeDisplayPrice || 88500}
                            currentScore={evaluation?.confluenceScore || 80}
                            selectedExchange={selectedExchange}
                            selectedMarketType={selectedMarketType}
                            currentStage={currentStage}
                            onSelectStage={selectStage}
                            onSelectSymbol={handleSymbolChange}
                            theme={binaryTheme}
                            lang={lang}
                          />
                        )}
                        {currentStage === 'backtest' && (
                          <BacktestPage
                            symbol={selectedSymbol}
                            timeframe={selectedTimeframe}
                            currentCandles={candles}
                            initialIndicator={backtestIndicator}
                            lang={lang}
                            theme={binaryTheme}
                            isFullWidth={isFullWidth}
                            isFullscreen={isFullscreen}
                            onToggleFullscreen={toggleFullscreen}
                            onToggleFullWidth={toggleFullWidth}
                          />
                        )}
                        {currentStage === 'output' && (
                          evaluation ? (
                            <OutputPage
                              evaluation={evaluation}
                              markdownNarrative={evaluation.executiveNarrative}
                              jsonPayload={evaluation.machinePayloadJson}
                              symbol={evaluation.symbol}
                              timeframe={evaluation.timeframe}
                              aiEngine={evaluation.aiEngine}
                              currentPrice={activeDisplayPrice || evaluation.riskPlan?.currentPrice}
                              onNavigateToStage={selectStage}
                              lang={lang}
                              theme={binaryTheme}
                            />
                          ) : (
                            <PendingAnalysisCard
                              symbol={selectedSymbol}
                              timeframe={selectedTimeframe}
                              onTriggerAnalyze={runCurrentAnalysis}
                              onGoToChart={() => selectStage('ticker')}
                              isLoading={isLoading}
                              lang={lang}
                              theme={binaryTheme}
                            />
                          )
                        )}
                        {currentStage === 'settings' && (
                          <SettingsPage
                            lang={lang}
                            onToggleLang={toggleLang}
                            theme={theme}
                            onToggleTheme={toggleTheme}
                            onSelectTheme={setEngineTheme}
                            customThemeColor={customThemeColor}
                            onUpdateCustomColor={setCustomThemeColor}
                            customThemeBg={customThemeBg}
                            onUpdateCustomBg={setCustomThemeBg}
                            isFullscreen={isFullscreen}
                            onToggleFullscreen={toggleFullscreen}
                            isFullWidth={isFullWidth}
                            onToggleFullWidth={toggleFullWidth}
                            workspaceMode={workspaceMode}
                            onToggleWorkspaceMode={toggleWorkspaceMode}
                            onNavigateToStage={selectStage}
                          />
                        )}
                      </div>
                    </div>
                  ) : (
                  <>
                    {currentStage === 'ticker' && (
                      <TickerPage
                        symbol={selectedSymbol}
                        timeframe={selectedTimeframe}
                        evaluation={evaluation}
                        candles={candles}
                        lang={lang}
                        theme={binaryTheme}
                        livePrice={activeDisplayPrice || undefined}
                        priceDirection={priceDirection}
                        wsStatus={wsStatus}
                        latencyMs={latencyMs}
                        syncMetrics={syncMetrics}
                        recentLiveTrades={recentLiveTrades}
                        orderBookBids={orderBookBids}
                        orderBookAsks={orderBookAsks}
                        bidTotal={bidTotal}
                        askTotal={askTotal}
                        selectedExchange={selectedExchange}
                        selectedMarketType={selectedMarketType}
                        onSelectExchange={handleExchangeChange}
                        onSelectMarketType={handleMarketTypeChange}
                      />
                    )}
                    {currentStage === 'signal' && (
                      <SignalPage
                        currentSymbol={selectedSymbol}
                        onSelectSymbol={(sym) => {
                          handleSymbolChange(sym);
                          selectStage('ticker');
                        }}
                        onNavigateToTrade={(sym) => {
                          handleSymbolChange(sym);
                          selectStage('manual_trading');
                        }}
                        selectedExchange={selectedExchange}
                        theme={binaryTheme}
                        lang={lang}
                      />
                    )}
                    {currentStage === 'market_heatmap' && (
                      <MarketHeatmapView
                        onSelectCoin={(sym) => {
                          handleSymbolChange(sym);
                          selectStage('ticker');
                        }}
                        onNavigateToTrade={(sym) => {
                          handleSymbolChange(sym);
                          selectStage('manual_trading');
                        }}
                        theme={binaryTheme}
                        lang={lang}
                      />
                    )}
                    {currentStage === 'gainers_losers' && (
                      <GainersLosersView
                        onSelectCoin={(sym) => {
                          handleSymbolChange(sym);
                          selectStage('ticker');
                        }}
                        onNavigateToTrade={(sym) => {
                          handleSymbolChange(sym);
                          selectStage('manual_trading');
                        }}
                        theme={binaryTheme}
                        lang={lang}
                      />
                    )}
                    {currentStage === 'screening' && (
                      <ScreeningPage
                        currentSymbol={selectedSymbol}
                        onSelectSymbol={(sym) => {
                          handleSymbolChange(sym);
                          selectStage('ticker');
                        }}
                        onNavigateToTrade={(sym) => {
                          handleSymbolChange(sym);
                          selectStage('manual_trading');
                        }}
                        onAddToWatchlist={(sym) => {
                          handleSymbolChange(sym);
                        }}
                        selectedExchange={selectedExchange}
                        theme={binaryTheme}
                        lang={lang}
                      />
                    )}
                    {currentStage === 'watchlist' && (
                      <WatchlistPage
                        currentSymbol={selectedSymbol}
                        onSelectSymbol={(sym) => {
                          handleSymbolChange(sym);
                          selectStage('ticker');
                        }}
                        onNavigateToTrade={(sym) => {
                          handleSymbolChange(sym);
                          selectStage('manual_trading');
                        }}
                        selectedExchange={selectedExchange}
                        theme={binaryTheme}
                        lang={lang}
                      />
                    )}
                    {currentStage === 'btc_dominance' && (
                      <MacroDominanceView
                        theme={binaryTheme}
                        lang={lang}
                      />
                    )}
                    {currentStage === 'onchain_data' && (
                      <OnChainDataView
                        theme={binaryTheme}
                        lang={lang}
                      />
                    )}
                    {currentStage === 'economic_calendar' && (
                      <EconomicCalendarView
                        theme={binaryTheme}
                        lang={lang}
                      />
                    )}
                    {currentStage === 'scanner' && (
                      <ScannerPage
                        onSelectCoin={(sym) => {
                          handleSymbolChange(sym);
                          selectStage('ticker');
                        }}
                        selectedExchange={selectedExchange}
                        selectedMarketType={selectedMarketType}
                        lang={lang}
                        theme={binaryTheme}
                      />
                    )}
                    {currentStage === 'mtf_screener' && (
                      <MtfScreenerView
                        onSelectCoin={(sym) => {
                          handleSymbolChange(sym);
                          selectStage('ticker');
                        }}
                        onNavigateToTrade={(sym) => {
                          handleSymbolChange(sym);
                          selectStage('manual_trading');
                        }}
                        theme={binaryTheme}
                        lang={lang}
                      />
                    )}
                    {currentStage === 'orderflow' && (
                      <OrderflowHeatmapPage
                        symbol={selectedSymbol}
                        evaluation={evaluation}
                        candles={candles}
                        timeframe={selectedTimeframe}
                        selectedExchange={selectedExchange}
                        selectedMarketType={selectedMarketType}
                        lang={lang}
                        theme={binaryTheme}
                      />
                    )}
                    {currentStage === 'volatility_scanner' && (
                      <VolatilityScannerView
                        onSelectCoin={(sym) => {
                          handleSymbolChange(sym);
                          selectStage('ticker');
                        }}
                        theme={binaryTheme}
                        lang={lang}
                      />
                    )}
                    {currentStage === 'correlation_beta' && (
                      <CorrelationBetaView
                        theme={binaryTheme}
                        lang={lang}
                      />
                    )}
                    {currentStage === 'return_distribution' && (
                      <ReturnDistributionView
                        theme={binaryTheme}
                        lang={lang}
                      />
                    )}
                    {currentStage === 'active_orders' && (
                      <ActiveOrdersView
                        onNavigateToTrade={(sym) => {
                          handleSymbolChange(sym);
                          selectStage('manual_trading');
                        }}
                        theme={binaryTheme}
                        lang={lang}
                      />
                    )}
                    {currentStage === 'position_sizing' && (
                      <PositionSizingView
                        currentSymbol={selectedSymbol}
                        currentPrice={activeDisplayPrice || 88500}
                        onNavigateToTrade={(sym) => {
                          handleSymbolChange(sym);
                          selectStage('manual_trading');
                        }}
                        theme={binaryTheme}
                        lang={lang}
                      />
                    )}
                    {currentStage === 'multi_exchange' && (
                      <MultiExchangeManagerView
                        theme={binaryTheme}
                        lang={lang}
                      />
                    )}
                    {currentStage === 'alerts' && (
                      <AlertBuilderView
                        currentSymbol={selectedSymbol}
                        theme={binaryTheme}
                        lang={lang}
                      />
                    )}
                    {currentStage === 'indicators' && (
                      evaluation ? (
                        <IndicatorsPage
                          indicators={evaluation.indicators}
                          onOpenBacktest={openBacktest}
                          lang={lang}
                          theme={binaryTheme}
                        />
                      ) : (
                        <PendingAnalysisCard
                          symbol={selectedSymbol}
                          timeframe={selectedTimeframe}
                          onTriggerAnalyze={runCurrentAnalysis}
                          onGoToChart={() => selectStage('ticker')}
                          isLoading={isLoading}
                          lang={lang}
                          theme={binaryTheme}
                        />
                      )
                    )}
                    {currentStage === 'confluence' && (
                      evaluation ? (
                        <ConfluencePage
                          score={evaluation.confluenceScore}
                          bias={evaluation.marketBias}
                          bullishCount={evaluation.bullishCount}
                          bearishCount={evaluation.bearishCount}
                          neutralCount={evaluation.neutralCount}
                          indicators={evaluation.indicators}
                          lang={lang}
                          theme={binaryTheme}
                        />
                      ) : (
                        <PendingAnalysisCard
                          symbol={selectedSymbol}
                          timeframe={selectedTimeframe}
                          onTriggerAnalyze={runCurrentAnalysis}
                          onGoToChart={() => selectStage('ticker')}
                          isLoading={isLoading}
                          lang={lang}
                          theme={binaryTheme}
                        />
                      )
                    )}
                    {currentStage === 'sentiment' && (
                      <SentimentNewsPage
                        onSelectCoin={(sym) => {
                          handleSymbolChange(sym);
                          selectStage('ticker');
                        }}
                        theme={binaryTheme}
                      />
                    )}
                    {currentStage === 'risk' && (
                      evaluation ? (
                        <RiskPage
                          initialRiskPlan={evaluation.riskPlan}
                          symbol={selectedSymbol}
                          indicators={evaluation.indicators}
                          currentPrice={activeDisplayPrice || evaluation.riskPlan?.currentPrice}
                          lang={lang}
                          theme={binaryTheme}
                        />
                      ) : (
                        <PendingAnalysisCard
                          symbol={selectedSymbol}
                          timeframe={selectedTimeframe}
                          onTriggerAnalyze={runCurrentAnalysis}
                          onGoToChart={() => selectStage('ticker')}
                          isLoading={isLoading}
                          lang={lang}
                          theme={binaryTheme}
                        />
                      )
                    )}
                    {(currentStage === 'trading' ||
                      currentStage === 'manual_trading' ||
                      currentStage === 'bot' ||
                      currentStage === 'journal' ||
                      currentStage === 'portfolio' ||
                      currentStage === 'reports') && (
                      <TradingHubPage
                        currentSymbol={selectedSymbol}
                        currentPrice={activeDisplayPrice || 88500}
                        currentScore={evaluation?.confluenceScore || 80}
                        selectedExchange={selectedExchange}
                        selectedMarketType={selectedMarketType}
                        currentStage={currentStage}
                        onSelectStage={selectStage}
                        onSelectSymbol={handleSymbolChange}
                        theme={binaryTheme}
                        lang={lang}
                      />
                    )}
                    {currentStage === 'backtest' && (
                      <BacktestPage
                        symbol={selectedSymbol}
                        timeframe={selectedTimeframe}
                        currentCandles={candles}
                        initialIndicator={backtestIndicator}
                        lang={lang}
                        theme={binaryTheme}
                        isFullWidth={isFullWidth}
                        isFullscreen={isFullscreen}
                        onToggleFullscreen={toggleFullscreen}
                        onToggleFullWidth={toggleFullWidth}
                      />
                    )}
                    {currentStage === 'output' && (
                      evaluation ? (
                        <OutputPage
                          evaluation={evaluation}
                          markdownNarrative={evaluation.executiveNarrative}
                          jsonPayload={evaluation.machinePayloadJson}
                          symbol={evaluation.symbol}
                          timeframe={evaluation.timeframe}
                          aiEngine={evaluation.aiEngine}
                          currentPrice={activeDisplayPrice || evaluation.riskPlan?.currentPrice}
                          onNavigateToStage={selectStage}
                          lang={lang}
                          theme={binaryTheme}
                        />
                      ) : (
                        <PendingAnalysisCard
                          symbol={selectedSymbol}
                          timeframe={selectedTimeframe}
                          onTriggerAnalyze={runCurrentAnalysis}
                          onGoToChart={() => selectStage('ticker')}
                          isLoading={isLoading}
                          lang={lang}
                          theme={binaryTheme}
                        />
                      )
                    )}
                    {currentStage === 'settings' && (
                      <SettingsPage
                        lang={lang}
                        onToggleLang={toggleLang}
                        theme={theme}
                        onToggleTheme={toggleTheme}
                        onSelectTheme={setEngineTheme}
                        customThemeColor={customThemeColor}
                        onUpdateCustomColor={setCustomThemeColor}
                        customThemeBg={customThemeBg}
                        onUpdateCustomBg={setCustomThemeBg}
                        isFullscreen={isFullscreen}
                        onToggleFullscreen={toggleFullscreen}
                        isFullWidth={isFullWidth}
                        onToggleFullWidth={toggleFullWidth}
                        workspaceMode={workspaceMode}
                        onToggleWorkspaceMode={toggleWorkspaceMode}
                        onNavigateToStage={selectStage}
                      />
                    )}
                  </>
                )
              )}
            </motion.div>
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Real-Time Terminal Status Bar (Sticky Bottom) */}
      <TerminalStatusBar
        selectedSymbol={selectedSymbol}
        selectedTimeframe={selectedTimeframe}
        selectedExchange={selectedExchange}
        selectedMarketType={selectedMarketType}
        livePrice={activeDisplayPrice}
        priceDirection={priceDirection}
        wsStatus={wsStatus}
        latencyMs={latencyMs}
        syncMetrics={syncMetrics}
        workspaceMode={workspaceMode}
        onToggleWorkspaceMode={toggleWorkspaceMode}
        onOpenCommandBar={() => setIsCommandBarOpen(true)}
        onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
        onOpenSystemHealth={navigateToSystemHealth}
        lang={lang}
        theme={binaryTheme}
        isFullWidth={isFullWidth}
      />

      {/* Footer with Standards & Specifications */}
      <footer id="terminal-footer" className={`w-full border-t py-4 text-xs font-mono transition-colors duration-200 ${
        isDark ? 'border-[#1e293b] bg-[#0b0f19] text-slate-400' : 'border-slate-200 bg-slate-100 text-slate-700'
      }`}>
        <div className="w-full mx-auto px-3 sm:px-4 lg:px-8 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
            {/* Brand and Status Pill */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              <div className="flex items-center gap-2">
                <AkiraQuLogo size={20} theme={binaryTheme} variant="symbol" />
                <span className={`font-bold tracking-wider text-sm ${isDark ? 'text-[#F89DB5]' : 'text-[#21242B]'}`}>
                  AKIRAQU
                </span>
              </div>
              <span className={isDark ? 'text-slate-600' : 'text-slate-400'}>•</span>
              <span className={`text-[11px] sm:text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {lang === 'id' ? 'Alat Kuantitatif & Terminal Presisi' : 'Analytic Quantitative Crypto Tools'}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-[2px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold ml-auto sm:ml-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>ONLINE</span>
              </span>
            </div>

            {/* Quick Links with Mobile Wrap */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] sm:text-xs">
              <button
                type="button"
                onClick={navigateToSystemHealth}
                className={`flex items-center gap-1 py-1 px-2 rounded-[2px] border transition-all cursor-pointer ${
                  isDark
                    ? 'bg-cyan-950/40 border-cyan-500/30 text-cyan-400 hover:bg-cyan-900/50 hover:text-cyan-200'
                    : 'bg-cyan-50 border-cyan-300 text-cyan-700 hover:bg-cyan-100'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span className="font-semibold">{lang === 'id' ? 'Status Sistem' : 'System Health'}</span>
              </button>
              <button
                type="button"
                onClick={navigateToLanding}
                className={`py-1 px-2 rounded-[2px] transition-colors cursor-pointer ${
                  isDark ? 'hover:bg-slate-800 text-slate-300 hover:text-white' : 'hover:bg-slate-200 text-slate-700 hover:text-black'
                }`}
              >
                {lang === 'id' ? 'Halaman Depan' : 'Landing'}
              </button>
              <button
                type="button"
                onClick={navigateToLogin}
                className={`py-1 px-2 rounded-[2px] transition-colors cursor-pointer ${
                  isDark ? 'hover:bg-slate-800 text-slate-300 hover:text-white' : 'hover:bg-slate-200 text-slate-700 hover:text-black'
                }`}
              >
                {lang === 'id' ? 'Akun Google' : 'Google Auth'}
              </button>
              <button
                type="button"
                onClick={() => setIsAssuranceModalOpen(true)}
                className={`py-1 px-2 rounded-[2px] transition-colors cursor-pointer ${
                  isDark ? 'hover:bg-slate-800 text-slate-300 hover:text-white' : 'hover:bg-slate-200 text-slate-700 hover:text-black'
                }`}
              >
                {t.footer.assuranceLink}
              </button>
              <button
                type="button"
                onClick={() => setIsExportModalOpen(true)}
                className={`py-1 px-2 rounded-[2px] transition-colors cursor-pointer ${
                  isDark ? 'hover:bg-slate-800 text-slate-300 hover:text-white' : 'hover:bg-slate-200 text-slate-700 hover:text-black'
                }`}
              >
                {t.footer.privacyLink}
              </button>
            </div>
          </div>

          {/* Disclaimer: Penafian */}
          <div className={`pt-2.5 border-t text-[11px] leading-relaxed flex items-start sm:items-center gap-2 ${
            isDark ? 'border-[#1e293b]/70 text-slate-400' : 'border-slate-200 text-slate-600'
          }`}>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
            <p className="font-mono">
              <span className="font-bold text-amber-400 mr-1.5">Disclaimer: Penafian</span>
              <span>
                {lang === 'id'
                  ? 'Segala informasi yang terdapat di halaman ini tidak boleh dianggap sebagai nasihat keuangan. Anda harus melakukan riset sendiri sebelum mengambil keputusan apa pun.'
                  : 'All information provided on this platform is for analytical purposes only and must not be considered financial advice. Always conduct your own research.'}
              </span>
            </p>
          </div>
        </div>
      </footer>
        </div>
      </div>

      {/* Export & Privacy Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        evaluation={evaluation || undefined}
        lang={lang}
      />

      {/* Assurance & NFR Verification Modal */}
      <AssuranceModal
        isOpen={isAssuranceModalOpen}
        onClose={() => setIsAssuranceModalOpen(false)}
        lang={lang}
        theme={binaryTheme}
      />

      {/* Quick Search & Command Bar Modal */}
      <CommandBarModal
        isOpen={isCommandBarOpen}
        onClose={() => setIsCommandBarOpen(false)}
        symbols={symbols}
        selectedSymbol={selectedSymbol}
        selectedTimeframe={selectedTimeframe}
        selectedExchange={selectedExchange}
        workspaceMode={workspaceMode}
        onSelectSymbol={(sym) => {
          handleSymbolChange(sym);
          selectStage('ticker');
        }}
        onSelectTimeframe={handleTimeframeChange}
        onSelectExchange={handleExchangeChange}
        onSelectStage={selectStage}
        onSelectWorkspaceMode={setWorkspaceModeDirect}
        onToggleFullscreen={toggleFullscreen}
        onToggleTheme={toggleTheme}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenAssuranceModal={() => setIsAssuranceModalOpen(true)}
        onOpenShortcutsModal={() => setIsShortcutsModalOpen(true)}
        onOpenDocsModal={navigateToDocs}
        lang={lang}
        theme={binaryTheme}
      />

      {/* Keyboard Shortcuts Cheat Sheet */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
        lang={lang}
        theme={binaryTheme}
      />

      {/* Unified Alert Center Modal: Sinyal Trading, Penyaring Koin, & Berita Sentimen */}
      <AlertCenterModal
        lang={lang}
        theme={binaryTheme}
      />

      {/* Floating Real-Time Alert HUD Toast */}
      <AlertToastContainer
        lang={lang}
        theme={binaryTheme}
      />
    </div>
  );
}

export default function App() {
  return (
    <TerminalProvider>
      <AlertProvider>
        <TerminalApp />
      </AlertProvider>
    </TerminalProvider>
  );
}
