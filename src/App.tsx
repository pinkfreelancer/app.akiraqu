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
import { AlertCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AkiraQuLogo } from './components/AkiraQuLogo';
import { TerminalProvider, useTerminal } from './contexts/TerminalContext';

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

function TerminalApp() {
  const {
    viewMode,
    currentStage,
    backtestIndicator,
    navigateToLanding,
    navigateToLogin,
    navigateToTerminal,
    selectStage,
    openBacktest,

    lang,
    toggleLang,
    theme,
    setEngineTheme,
    customThemeColor,
    setCustomThemeColor,
    toggleTheme,
    isDark,
    t,

    workspaceMode,
    toggleWorkspaceMode,
    setWorkspaceModeDirect,
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

  // Sidebar Open/Collapse State
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('imasbtc_sidebar_open');
      if (saved !== null) return JSON.parse(saved);
    } catch {}
    return true; // Default open
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
        onNavigateToTerminal={navigateToTerminal}
        onNavigateToLogin={navigateToLogin}
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

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
      isDark ? 'bg-[#06090e] text-slate-100' : 'bg-slate-50 text-slate-900'
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
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        isFullWidth={isFullWidth}
        onToggleFullWidth={toggleFullWidth}
        workspaceMode={workspaceMode}
        onToggleWorkspaceMode={toggleWorkspaceMode}
        onOpenCommandBar={() => setIsCommandBarOpen(true)}
        onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
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
        />

        {/* Scrollable Stage Workspace Content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <main className={`flex-1 w-full mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4 transition-all duration-200 ${
            isFullWidth ? 'max-w-none' : 'max-w-7xl'
          }`}>
        {/* Workspace Mode: Launchpad Quad-Grid or Classic Stage Stepper */}
        {workspaceMode === 'launchpad' ? (
          <LaunchpadWorkspace
            candles={candles}
            symbol={selectedSymbol}
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
            onSelectExchange={handleExchangeChange}
            onSelectMarketType={handleMarketTypeChange}
            onSelectTimeframe={handleTimeframeChange}
            onTriggerAnalyze={runCurrentAnalysis}
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

            {/* Stage Screen Content */}
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
        lang={lang}
        theme={binaryTheme}
        isFullWidth={isFullWidth}
      />

      {/* Footer with Standards & Specifications */}
      <footer className={`w-full border-t py-3 text-xs font-mono transition-colors duration-200 ${
        isDark ? 'border-[#1e293b] bg-[#0b0f19] text-slate-400' : 'border-slate-200 bg-slate-100 text-slate-700'
      }`}>
        <div className={`mx-auto px-3 sm:px-4 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 ${
          isFullWidth ? 'w-full' : 'max-w-7xl'
        }`}>
          <div className="flex items-center gap-2.5">
            <AkiraQuLogo size={20} theme={binaryTheme} variant="symbol" />
            <span className={`font-bold tracking-wider ${isDark ? 'text-[#F89DB5]' : 'text-[#21242B]'}`}>
              AKIRAQU
            </span>
            <span className={isDark ? 'text-slate-600' : 'text-slate-400'}>•</span>
            <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Analytic Quantitative Crypto Tools</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={navigateToLanding}
              className={`transition-colors cursor-pointer ${isDark ? 'hover:text-cyan-300' : 'hover:text-cyan-700'}`}
            >
              {lang === 'id' ? 'Halaman Depan (Landing)' : 'Landing Page'}
            </button>
            <button
              onClick={navigateToLogin}
              className={`transition-colors cursor-pointer ${isDark ? 'hover:text-cyan-300' : 'hover:text-cyan-700'}`}
            >
              {lang === 'id' ? 'Akun Gmail' : 'Gmail Account'}
            </button>
            <button
              onClick={() => setIsAssuranceModalOpen(true)}
              className={`transition-colors cursor-pointer ${isDark ? 'hover:text-cyan-300' : 'hover:text-cyan-700'}`}
            >
              {t.footer.assuranceLink}
            </button>
            <button
              onClick={() => setIsExportModalOpen(true)}
              className={`transition-colors cursor-pointer ${isDark ? 'hover:text-cyan-300' : 'hover:text-cyan-700'}`}
            >
              {t.footer.privacyLink}
            </button>
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
    </div>
  );
}

export default function App() {
  return (
    <TerminalProvider>
      <TerminalApp />
    </TerminalProvider>
  );
}
