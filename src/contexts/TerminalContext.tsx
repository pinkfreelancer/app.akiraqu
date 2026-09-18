import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  ConfluenceEvaluation,
  CryptoSymbolInfo,
  IndicatorKey,
  OHLCVCandle,
  Timeframe,
  SupportedExchange,
  MarketType,
  WebSocketSyncMetrics,
  LiveTradeTick,
  LiveOrderBookLevel,
  StageId,
} from '../types/crypto.types';
import { Language, getTranslation, Translations } from '../i18n/translations';
import { useTerminalSystem, TerminalHealthStatus } from '../hooks/useTerminalSystem';
import { useAnalysisEngine } from '../hooks/useAnalysisEngine';
import { useMarketData } from '../hooks/useMarketData';
import { fetchFastCandles } from '../services/marketData';
import { useTerminalNavigation, TerminalViewMode } from '../hooks/useTerminalNavigation';
import { useTerminalKeyboardShortcuts } from '../hooks/useTerminalKeyboardShortcuts';

export interface TerminalContextValue {
  // Navigation & View Domain
  viewMode: TerminalViewMode;
  currentStage: StageId;
  backtestIndicator: IndicatorKey;
  navigateToLanding: () => void;
  navigateToLogin: () => void;
  navigateToTerminal: (stage?: StageId) => void;
  selectStage: (stage: StageId) => void;
  openBacktest: (indicatorKey?: IndicatorKey) => void;

  // Localization & Theming Domain
  lang: Language;
  toggleLang: (newLang: Language) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  isDark: boolean;
  t: Translations;

  // Display & Ergonomics Domain
  workspaceMode: 'classic' | 'launchpad';
  toggleWorkspaceMode: () => void;
  setWorkspaceModeDirect: (mode: 'classic' | 'launchpad') => void;
  isFullWidth: boolean;
  toggleFullWidth: () => void;
  isFullscreen: boolean;
  toggleFullscreen: () => void;

  // Trading & Market Parameters Domain
  symbols: CryptoSymbolInfo[];
  selectedSymbol: string;
  selectedTimeframe: Timeframe;
  selectedExchange: SupportedExchange;
  selectedMarketType: MarketType;
  handleSymbolChange: (sym: string) => void;
  handleTimeframeChange: (tf: Timeframe) => void;
  handleExchangeChange: (ex: SupportedExchange) => void;
  handleMarketTypeChange: (mt: MarketType) => void;
  handlePrevSymbol: () => void;
  handleNextSymbol: () => void;

  // Real-Time Streaming & Market Data Domain
  livePrice: number | null;
  activeDisplayPrice: number | null | undefined;
  priceDirection: 'up' | 'down' | 'neutral';
  wsStatus: 'connected' | 'connecting' | 'fallback';
  latencyMs: number;
  syncMetrics: WebSocketSyncMetrics;
  recentLiveTrades: LiveTradeTick[];
  orderBookBids: LiveOrderBookLevel[];
  orderBookAsks: LiveOrderBookLevel[];
  bidTotal: number;
  askTotal: number;
  candles: OHLCVCandle[];

  // Institutional Engine & Analysis Domain
  evaluation: ConfluenceEvaluation | null;
  hasEvaluation: boolean;
  isLoading: boolean;
  errorNotice: string | null;
  runCurrentAnalysis: () => Promise<void>;
  healthStatus: TerminalHealthStatus;

  // Modals & Omnibar Domain
  isCommandBarOpen: boolean;
  setIsCommandBarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isShortcutsModalOpen: boolean;
  setIsShortcutsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isExportModalOpen: boolean;
  setIsExportModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isAssuranceModalOpen: boolean;
  setIsAssuranceModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const TerminalContext = createContext<TerminalContextValue | null>(null);

export const TerminalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('nexus_theme') as 'light' | 'dark') || 'dark';
  });

  const isDark = theme === 'dark';

  // Language state
  const [lang, setLang] = useState<Language>('id');
  const t = useMemo(() => getTranslation(lang), [lang]);

  // System hook (health status, symbols list, fullscreen, fullwidth)
  const {
    symbols,
    healthStatus,
    isFullscreen,
    toggleFullscreen,
    isFullWidth,
    toggleFullWidth,
  } = useTerminalSystem();

  // Navigation hook
  const {
    viewMode,
    currentStage,
    backtestIndicator,
    navigateToLanding,
    navigateToLogin,
    navigateToTerminal,
    selectStage,
    openBacktest,
  } = useTerminalNavigation();

  // Trading parameters state
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTC/USDT');
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('1H');
  const [selectedExchange, setSelectedExchange] = useState<SupportedExchange>(() => {
    return (localStorage.getItem('nexus_exchange') as SupportedExchange) || 'BINANCE';
  });
  const [selectedMarketType, setSelectedMarketType] = useState<MarketType>(() => {
    return (localStorage.getItem('nexus_market_type') as MarketType) || 'SPOT';
  });

  // Workspace Mode (Classic vs Launchpad)
  const [workspaceMode, setWorkspaceMode] = useState<'classic' | 'launchpad'>(() => {
    const saved = localStorage.getItem('nexus_workspace_mode');
    return saved === 'launchpad' || saved === 'classic' ? saved : 'launchpad';
  });

  // Modal dialog states
  const [isCommandBarOpen, setIsCommandBarOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isAssuranceModalOpen, setIsAssuranceModalOpen] = useState(false);

  // Sync theme to DOM & localStorage
  useEffect(() => {
    localStorage.setItem('nexus_theme', theme);
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const toggleWorkspaceMode = useCallback(() => {
    setWorkspaceMode((prev) => {
      const next = prev === 'launchpad' ? 'classic' : 'launchpad';
      localStorage.setItem('nexus_workspace_mode', next);
      return next;
    });
  }, []);

  const setWorkspaceModeDirect = useCallback((mode: 'classic' | 'launchpad') => {
    setWorkspaceMode(mode);
    localStorage.setItem('nexus_workspace_mode', mode);
  }, []);

  // Analysis engine business logic hook
  const {
    evaluation,
    setEvaluation,
    isLoading,
    errorNotice,
    runAnalysis,
    checkCache,
    generatePlaceholderCandles,
  } = useAnalysisEngine(lang);

  const currentCoin = useMemo(() => {
    return symbols.find((s) => s.symbol === selectedSymbol);
  }, [symbols, selectedSymbol]);

  // Unified Real-Time Market Data hook
  const {
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
    setCandles,
  } = useMarketData({
    symbol: selectedSymbol,
    timeframe: selectedTimeframe,
    fallbackBasePrice: currentCoin?.basePrice,
    exchange: selectedExchange,
    marketType: selectedMarketType,
  });

  // Initial mount: load chart and run initial analysis once for default setup
  const initialMountedRef = useRef(false);
  useEffect(() => {
    if (!initialMountedRef.current) {
      initialMountedRef.current = true;
      runAnalysis(
        selectedSymbol,
        selectedTimeframe,
        lang,
        selectedExchange,
        selectedMarketType,
        (newCandles) => {
          setCandles(newCandles);
        }
      );
    }
  }, [selectedSymbol, selectedTimeframe, lang, selectedExchange, selectedMarketType, runAnalysis, setCandles]);

  const runCurrentAnalysis = useCallback(async () => {
    await runAnalysis(
      selectedSymbol,
      selectedTimeframe,
      lang,
      selectedExchange,
      selectedMarketType,
      (newCandles) => setCandles(newCandles)
    );
  }, [runAnalysis, selectedSymbol, selectedTimeframe, lang, selectedExchange, selectedMarketType, setCandles]);

  const handleSymbolChange = useCallback((sym: string) => {
    setSelectedSymbol(sym);
    const cacheKey = `${sym}-${selectedTimeframe}-${lang}-${selectedExchange}-${selectedMarketType}`;
    const cached = checkCache(cacheKey);
    if (cached) {
      setEvaluation(cached.evaluation);
      if (cached.candles && cached.candles.length > 0) {
        setCandles(cached.candles);
      }
    } else {
      const targetCoin = symbols.find((s) => s.symbol === sym);
      const basePrice = targetCoin ? targetCoin.basePrice : 1.0;
      setCandles(generatePlaceholderCandles(basePrice, sym, selectedTimeframe));
      setEvaluation(null);

      // Fast chart-first load!
      fetchFastCandles(sym, selectedTimeframe, selectedExchange, selectedMarketType).then((newCandles) => {
        if (newCandles && newCandles.length > 0) {
          setCandles(newCandles);
        }
      });
    }
  }, [selectedTimeframe, lang, selectedExchange, selectedMarketType, checkCache, symbols, generatePlaceholderCandles, setCandles, setEvaluation]);

  const handleTimeframeChange = useCallback((tf: Timeframe) => {
    setSelectedTimeframe(tf);
    const cacheKey = `${selectedSymbol}-${tf}-${lang}-${selectedExchange}-${selectedMarketType}`;
    const cached = checkCache(cacheKey);
    if (cached) {
      setEvaluation(cached.evaluation);
      if (cached.candles && cached.candles.length > 0) {
        setCandles(cached.candles);
      }
    } else {
      // Buka dulu chartnya! Load fast candles for the chart immediately without triggering heavy 12-indicator analysis
      const targetCoin = symbols.find((s) => s.symbol === selectedSymbol);
      const basePrice = activeDisplayPrice || (targetCoin ? targetCoin.basePrice : 1.0);
      setCandles(generatePlaceholderCandles(basePrice, selectedSymbol, tf));
      setEvaluation(null);

      // Fetch real historical candles for the chart in background immediately
      fetchFastCandles(selectedSymbol, tf, selectedExchange, selectedMarketType).then((newCandles) => {
        if (newCandles && newCandles.length > 0) {
          setCandles(newCandles);
        }
      });
    }
  }, [selectedSymbol, lang, selectedExchange, selectedMarketType, checkCache, symbols, activeDisplayPrice, generatePlaceholderCandles, setCandles, setEvaluation]);

  const handleExchangeChange = useCallback((ex: SupportedExchange) => {
    setSelectedExchange(ex);
    localStorage.setItem('nexus_exchange', ex);
    const cacheKey = `${selectedSymbol}-${selectedTimeframe}-${lang}-${ex}-${selectedMarketType}`;
    const cached = checkCache(cacheKey);
    if (cached) {
      setEvaluation(cached.evaluation);
      if (cached.candles && cached.candles.length > 0) {
        setCandles(cached.candles);
      }
    } else {
      setEvaluation(null);
      fetchFastCandles(selectedSymbol, selectedTimeframe, ex, selectedMarketType).then((newCandles) => {
        if (newCandles && newCandles.length > 0) {
          setCandles(newCandles);
        }
      });
    }
  }, [selectedSymbol, selectedTimeframe, lang, selectedMarketType, checkCache, setCandles, setEvaluation]);

  const handleMarketTypeChange = useCallback((mt: MarketType) => {
    setSelectedMarketType(mt);
    localStorage.setItem('nexus_market_type', mt);
    const cacheKey = `${selectedSymbol}-${selectedTimeframe}-${lang}-${selectedExchange}-${mt}`;
    const cached = checkCache(cacheKey);
    if (cached) {
      setEvaluation(cached.evaluation);
      if (cached.candles && cached.candles.length > 0) {
        setCandles(cached.candles);
      }
    } else {
      setEvaluation(null);
      fetchFastCandles(selectedSymbol, selectedTimeframe, selectedExchange, mt).then((newCandles) => {
        if (newCandles && newCandles.length > 0) {
          setCandles(newCandles);
        }
      });
    }
  }, [selectedSymbol, selectedTimeframe, lang, selectedExchange, checkCache, setCandles, setEvaluation]);

  const toggleLang = useCallback((newLang: Language) => {
    setLang(newLang);
    runAnalysis(selectedSymbol, selectedTimeframe, newLang, selectedExchange, selectedMarketType, (newCandles) => {
      setCandles(newCandles);
    });
  }, [selectedSymbol, selectedTimeframe, selectedExchange, selectedMarketType, runAnalysis, setCandles]);

  const handlePrevSymbol = useCallback(() => {
    const currentIndex = symbols.findIndex((s) => s.symbol === selectedSymbol);
    if (currentIndex > 0) {
      handleSymbolChange(symbols[currentIndex - 1].symbol);
    } else if (symbols.length > 0) {
      handleSymbolChange(symbols[symbols.length - 1].symbol);
    }
  }, [symbols, selectedSymbol, handleSymbolChange]);

  const handleNextSymbol = useCallback(() => {
    const currentIndex = symbols.findIndex((s) => s.symbol === selectedSymbol);
    if (currentIndex >= 0 && currentIndex < symbols.length - 1) {
      handleSymbolChange(symbols[currentIndex + 1].symbol);
    } else if (symbols.length > 0) {
      handleSymbolChange(symbols[0].symbol);
    }
  }, [symbols, selectedSymbol, handleSymbolChange]);

  // Wire Global Keyboard Shortcuts
  useTerminalKeyboardShortcuts({
    onOpenCommandBar: () => setIsCommandBarOpen(true),
    onOpenShortcuts: () => setIsShortcutsModalOpen(true),
    onCloseModals: () => {
      setIsCommandBarOpen(false);
      setIsShortcutsModalOpen(false);
    },
    onTimeframeChange: handleTimeframeChange,
    onToggleWorkspaceMode: toggleWorkspaceMode,
    onTriggerAnalyze: runCurrentAnalysis,
    onPrevSymbol: handlePrevSymbol,
    onNextSymbol: handleNextSymbol,
  });

  const value = useMemo<TerminalContextValue>(() => ({
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
    handlePrevSymbol,
    handleNextSymbol,

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
    hasEvaluation: Boolean(evaluation),
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
  }), [
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
    handlePrevSymbol,
    handleNextSymbol,
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
    isLoading,
    errorNotice,
    runCurrentAnalysis,
    healthStatus,
    isCommandBarOpen,
    isShortcutsModalOpen,
    isExportModalOpen,
    isAssuranceModalOpen,
  ]);

  return <TerminalContext.Provider value={value}>{children}</TerminalContext.Provider>;
};

export const useTerminal = (): TerminalContextValue => {
  const context = useContext(TerminalContext);
  if (!context) {
    throw new Error('useTerminal must be used within a TerminalProvider');
  }
  return context;
};
