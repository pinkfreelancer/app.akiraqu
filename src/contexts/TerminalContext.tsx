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
import {
  EngineThemeId,
  normalizeEngineTheme,
  isDarkEngineTheme,
  applyThemeToDocument,
  safeGetLocalStorage,
  safeSetLocalStorage,
} from '../types/theme.types';
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
  navigateToDocs: () => void;
  navigateToSystemHealth: () => void;
  selectStage: (stage: StageId) => void;
  openBacktest: (indicatorKey?: IndicatorKey) => void;

  // Localization & Theming Domain
  lang: Language;
  toggleLang: (newLang: Language) => void;
  theme: EngineThemeId;
  setEngineTheme: (theme: EngineThemeId, customColor?: string, customBg?: string) => void;
  customThemeColor: string;
  setCustomThemeColor: (color: string) => void;
  customThemeBg: string;
  setCustomThemeBg: (bg: string) => void;
  toggleTheme: () => void;
  isDark: boolean;
  t: Translations;

  // Display & Ergonomics Domain
  workspaceMode: 'classic' | 'split' | 'launchpad';
  toggleWorkspaceMode: () => void;
  setWorkspaceModeDirect: (mode: 'classic' | 'split' | 'launchpad') => void;
  isTraderWorkbenchVisible: boolean;
  toggleTraderWorkbench: () => void;
  setTraderWorkbenchVisible: (visible: boolean) => void;
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
  // Navigation hook
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
  } = useTerminalNavigation('ticker');

  // Localization state
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('nexus_lang') as Language | null;
    return saved === 'en' || saved === 'id' ? saved : 'id';
  });
  const t = useMemo(() => getTranslation(lang), [lang]);

  // Terminal System
  const {
    symbols,
    setSymbols,
    healthStatus,
    isFullscreen,
    toggleFullscreen,
    isFullWidth,
    toggleFullWidth,
  } = useTerminalSystem();

  // Workspace Mode (classic = Single Full, split = Master Anchor Split, launchpad = Quad Grid)
  const [workspaceMode, setWorkspaceMode] = useState<'classic' | 'split' | 'launchpad'>(() => {
    const saved = localStorage.getItem('nexus_workspace_mode') as 'classic' | 'split' | 'launchpad' | null;
    return saved === 'launchpad' || saved === 'split' ? saved : 'classic';
  });

  // Meja Kerja Trader visibility state (persistent)
  const [isTraderWorkbenchVisible, setIsTraderWorkbenchVisible] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('akiraqu_trader_workbench_visible');
      if (saved !== null) return saved === 'true';
    } catch {}
    return true;
  });

  const toggleTraderWorkbench = useCallback(() => {
    setIsTraderWorkbenchVisible((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('akiraqu_trader_workbench_visible', String(next));
      } catch {}
      return next;
    });
  }, []);

  const setTraderWorkbenchVisible = useCallback((visible: boolean | any) => {
    const safeVal = typeof visible === 'boolean' ? visible : Boolean(visible);
    setIsTraderWorkbenchVisible(safeVal);
    try {
      localStorage.setItem('akiraqu_trader_workbench_visible', String(safeVal));
    } catch {}
  }, []);

  // Trading parameters
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTC/USDT');
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('1H');
  const [selectedExchange, setSelectedExchange] = useState<SupportedExchange>(() => {
    const saved = localStorage.getItem('nexus_exchange') as SupportedExchange | null;
    return saved === 'BINANCE' || saved === 'BYBIT' || saved === 'OKX' ? saved : 'BINANCE';
  });
  const [selectedMarketType, setSelectedMarketType] = useState<MarketType>(() => {
    const saved = localStorage.getItem('nexus_market_type') as MarketType | null;
    return saved === 'SPOT' || saved === 'FUTURES' ? saved : 'SPOT';
  });

  // Modals state
  const [isCommandBarOpen, setIsCommandBarOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isAssuranceModalOpen, setIsAssuranceModalOpen] = useState(false);

  // Theme state supporting 5 visual engines with Soft Pink accents
  const [theme, setThemeState] = useState<EngineThemeId>(() => {
    const saved = safeGetLocalStorage('akira_theme_engine') || safeGetLocalStorage('nexus_theme');
    return normalizeEngineTheme(saved);
  });

  const [customThemeColor, setCustomThemeColorState] = useState<string>(() => {
    return safeGetLocalStorage('akira_custom_theme_color') || '#EC4899';
  });

  const [customThemeBg, setCustomThemeBgState] = useState<string>(() => {
    return safeGetLocalStorage('akira_custom_theme_bg') || '#0B0F19';
  });

  // Track user's preferred light and dark themes to preserve choices on toggle
  const [preferredLightTheme, setPreferredLightTheme] = useState<EngineThemeId>(() => {
    const saved = safeGetLocalStorage('akira_preferred_light');
    return saved === 'theme-glassnode' ? 'theme-glassnode' : 'theme-light';
  });

  const [preferredDarkTheme, setPreferredDarkTheme] = useState<EngineThemeId>(() => {
    const saved = safeGetLocalStorage('akira_preferred_dark');
    return saved === 'theme-terminal' || saved === 'theme-custom' ? (saved as EngineThemeId) : 'theme-dark';
  });

  // Evaluate isDark synchronously passing customThemeBg
  const isDark = isDarkEngineTheme(theme, customThemeBg);

  const setEngineTheme = useCallback((newTheme: EngineThemeId, customColor?: string, customBg?: string) => {
    const normalized = normalizeEngineTheme(newTheme);
    const effectiveBg = customBg !== undefined ? customBg : customThemeBg;
    const effectiveColor = customColor !== undefined ? customColor : customThemeColor;
    const themeIsDark = isDarkEngineTheme(normalized, effectiveBg);

    setThemeState(normalized);
    safeSetLocalStorage('akira_theme_engine', normalized);
    safeSetLocalStorage('nexus_theme', themeIsDark ? 'dark' : 'light');

    if (themeIsDark) {
      setPreferredDarkTheme(normalized);
      safeSetLocalStorage('akira_preferred_dark', normalized);
    } else {
      setPreferredLightTheme(normalized);
      safeSetLocalStorage('akira_preferred_light', normalized);
    }

    if (customColor) {
      setCustomThemeColorState(customColor);
      safeSetLocalStorage('akira_custom_theme_color', customColor);
    }
    if (customBg) {
      setCustomThemeBgState(customBg);
      safeSetLocalStorage('akira_custom_theme_bg', customBg);
    }

    applyThemeToDocument(normalized, effectiveColor, effectiveBg);
  }, [customThemeBg, customThemeColor]);

  const setCustomThemeColor = useCallback((color: string) => {
    setCustomThemeColorState(color);
    safeSetLocalStorage('akira_custom_theme_color', color);
    applyThemeToDocument(theme, color, customThemeBg);
  }, [theme, customThemeBg]);

  const setCustomThemeBg = useCallback((bg: string) => {
    setCustomThemeBgState(bg);
    safeSetLocalStorage('akira_custom_theme_bg', bg);
    applyThemeToDocument(theme, customThemeColor, bg);
  }, [theme, customThemeColor]);

  const toggleTheme = useCallback(() => {
    if (isDark) {
      setEngineTheme(preferredLightTheme);
    } else {
      setEngineTheme(preferredDarkTheme);
    }
  }, [isDark, preferredLightTheme, preferredDarkTheme, setEngineTheme]);

  // Sync theme to DOM & localStorage exactly once per state transition
  useEffect(() => {
    applyThemeToDocument(theme, customThemeColor, customThemeBg);
  }, [theme, customThemeColor, customThemeBg]);

  const toggleWorkspaceMode = useCallback(() => {
    setWorkspaceMode((prev) => {
      const next: 'classic' | 'split' | 'launchpad' =
        prev === 'classic' ? 'split' : prev === 'split' ? 'launchpad' : 'classic';
      localStorage.setItem('nexus_workspace_mode', next);
      return next;
    });
  }, []);

  const setWorkspaceModeDirect = useCallback((mode: 'classic' | 'split' | 'launchpad' | any) => {
    if (mode === 'classic' || mode === 'split' || mode === 'launchpad') {
      setWorkspaceMode(mode);
      try {
        localStorage.setItem('nexus_workspace_mode', mode);
      } catch {}
    }
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
    onToggleWorkbench: toggleTraderWorkbench,
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
    setTraderWorkbenchVisible,
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
