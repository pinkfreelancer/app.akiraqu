import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { MarketAlertItem, AlertCategory, AlertFilterPreferences } from '../types/alert.types';
import { StageId } from '../types/market.types';

interface AlertContextValue {
  alerts: MarketAlertItem[];
  unreadCount: number;
  unreadCountByCategory: Record<AlertCategory, number>;
  activeToast: MarketAlertItem | null;
  dismissToast: () => void;
  isAlertCenterOpen: boolean;
  openAlertCenter: (category?: AlertCategory) => void;
  closeAlertCenter: () => void;
  selectedCategoryTab: 'ALL' | AlertCategory;
  setSelectedCategoryTab: (cat: 'ALL' | AlertCategory) => void;
  addAlert: (alert: Omit<MarketAlertItem, 'id' | 'createdAtMs' | 'isRead'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: (category?: AlertCategory) => void;
  deleteAlert: (id: string) => void;
  clearAllAlerts: () => void;
  preferences: AlertFilterPreferences;
  updatePreferences: (newPrefs: Partial<AlertFilterPreferences>) => void;
  triggerSimulatedUpdate: (category?: AlertCategory) => void;
  navigateToAlertTarget: (alert: MarketAlertItem) => void;
  setNavigateCallback: (cb: (stage: StageId, symbol?: string) => void) => void;
}

const DEFAULT_PREFERENCES: AlertFilterPreferences = {
  enableSignalAlerts: true,
  enableScreenerAlerts: true,
  enableSentimentAlerts: true,
  soundEnabled: true,
  autoShowToast: true,
  minConfluenceFilter: 75,
};

const INITIAL_ALERTS: MarketAlertItem[] = [
  {
    id: 'ALT-SIG-001',
    category: 'SIGNAL',
    title: 'Sinyal Baru: BTC/USDT (LONG)',
    subtitle: 'SMC Institutional Sweep & FVG Rebound',
    message: 'Konfirmasi FVG Rebound di $88,450 dengan lonjakan CVD spot +$42M. Target 1: $90,200 | SL: $87,100 (R:R 1:3.42).',
    symbol: 'BTC/USDT',
    timestamp: '2 menit yang lalu',
    createdAtMs: Date.now() - 120000,
    isRead: false,
    severity: 'SUCCESS',
    actionStage: 'signal',
    data: {
      signalId: 'SIG-BTC-9401',
      direction: 'LONG',
      timeframe: '1H',
      entryPrice: 88450,
      targetPrice: 90200,
      stopLoss: 87100,
      confluenceScore: 94,
      signalStatus: 'ACTIVE',
      strategyName: 'SMC Institutional Sweep & FVG Rebound',
    },
  },
  {
    id: 'ALT-SCR-002',
    category: 'SCREENER',
    title: 'Penyaring Koin: Anomali Volume AVAX/USDT',
    subtitle: 'RSI Oversold (28.4) + Volume Surge +420%',
    message: 'AVAX/USDT menembus kriteria penyaring kuantitatif: Rebound dari area oversold disertai lonjakan volume 4.2x lipat rata-rata 24 jam.',
    symbol: 'AVAX/USDT',
    timestamp: '5 menit yang lalu',
    createdAtMs: Date.now() - 300000,
    isRead: false,
    severity: 'WARNING',
    actionStage: 'screening',
    data: {
      screenerTrigger: 'VOLUME_SURGE',
      price: 32.65,
      change24h: 4.85,
      rsi14: 28.4,
      volumeSurgePct: 420,
      screenerMetricText: 'Volume 24H: $890M (Surge +420%)',
    },
  },
  {
    id: 'ALT-NEWS-003',
    category: 'SENTIMENT',
    title: 'Berita Sentimen: Rekor Inflow ETF Kripto Institusional',
    subtitle: 'Bloomberg Crypto • Dampak Bullish Tinggi',
    message: 'Aliran dana masuk (net inflow) ETF Bitcoin Spot mencapai rekor +$640 Juta dalam 24 jam terakhir, memicu sentimen pasar kategori Greed.',
    symbol: 'BTC/USDT',
    timestamp: '11 menit yang lalu',
    createdAtMs: Date.now() - 660000,
    isRead: false,
    severity: 'INFO',
    actionStage: 'sentiment',
    data: {
      sentimentImpact: 'BULLISH',
      sentimentScore: 88,
      newsSource: 'Bloomberg Crypto',
      newsCategory: 'INSTITUTIONAL',
    },
  },
  {
    id: 'ALT-SIG-004',
    category: 'SIGNAL',
    title: 'Target Tercapai: SOL/USDT (TP1 Hit)',
    subtitle: 'VWAP Breakout + Whale CVD Divergence',
    message: 'Harga Solana melesat menyentuh Target 1 ($192.00) dengan perolehan profit +5.21%. Trailing stop diaktifkan secara otomatis.',
    symbol: 'SOL/USDT',
    timestamp: '25 menit yang lalu',
    createdAtMs: Date.now() - 1500000,
    isRead: true,
    severity: 'SUCCESS',
    actionStage: 'signal',
    data: {
      signalId: 'SIG-SOL-9102',
      direction: 'LONG',
      timeframe: '4H',
      entryPrice: 184.2,
      targetPrice: 192.0,
      stopLoss: 178.5,
      confluenceScore: 91,
      signalStatus: 'TP1_HIT',
    },
  },
  {
    id: 'ALT-SCR-005',
    category: 'SCREENER',
    title: 'Penyaring Koin: Golden Cross NEAR/USDT',
    subtitle: 'EMA 50 Cross Up EMA 200 + Konfluensi 92/100',
    message: 'NEAR Protocol memenuhi parameter konfluensi tinggi di atas $6.85 dengan struktur bullish multi-timeframe terkonfirmasi.',
    symbol: 'NEAR/USDT',
    timestamp: '40 menit yang lalu',
    createdAtMs: Date.now() - 2400000,
    isRead: true,
    severity: 'INFO',
    actionStage: 'screening',
    data: {
      screenerTrigger: 'GOLDEN_CROSS',
      price: 7.02,
      change24h: 6.12,
      rsi14: 64.2,
      screenerMetricText: 'Skor Konfluensi: 92/100',
    },
  },
  {
    id: 'ALT-NEWS-006',
    category: 'SENTIMENT',
    title: 'Berita Sentimen: Whale Alert Deteksi Outflow Bursa',
    subtitle: 'Whale Alert • Akumulasi Whale',
    message: '14,500 BTC ($1.28 Miliar) ditarik keluar dari bursa Coinbase Prime ke dompet penyimpanan dingin (cold storage), menipiskan pasokan likuid.',
    symbol: 'BTC/USDT',
    timestamp: '1 jam yang lalu',
    createdAtMs: Date.now() - 3600000,
    isRead: true,
    severity: 'INFO',
    actionStage: 'sentiment',
    data: {
      sentimentImpact: 'BULLISH',
      sentimentScore: 82,
      newsSource: 'Whale Alert',
      newsCategory: 'WHALE',
    },
  },
];

const AlertContext = createContext<AlertContextValue | null>(null);

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alerts, setAlerts] = useState<MarketAlertItem[]>(() => {
    try {
      const saved = localStorage.getItem('akiraqu_market_alerts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_ALERTS;
  });

  const [preferences, setPreferences] = useState<AlertFilterPreferences>(() => {
    try {
      const saved = localStorage.getItem('akiraqu_alert_prefs');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_PREFERENCES;
  });

  const [activeToast, setActiveToast] = useState<MarketAlertItem | null>(null);
  const [isAlertCenterOpen, setIsAlertCenterOpen] = useState<boolean>(false);
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<'ALL' | AlertCategory>('ALL');

  // Callback to navigate to stage & symbol
  const [navigateCb, setNavigateCb] = useState<((stage: StageId, symbol?: string) => void) | null>(null);

  // Save alerts to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('akiraqu_market_alerts', JSON.stringify(alerts.slice(0, 50)));
    } catch {
      // ignore
    }
  }, [alerts]);

  // Save prefs
  useEffect(() => {
    try {
      localStorage.setItem('akiraqu_alert_prefs', JSON.stringify(preferences));
    } catch {
      // ignore
    }
  }, [preferences]);

  // Calculate unread counts
  const unreadCount = useMemo(() => alerts.filter((a) => !a.isRead).length, [alerts]);

  const unreadCountByCategory = useMemo(() => {
    return {
      SIGNAL: alerts.filter((a) => !a.isRead && a.category === 'SIGNAL').length,
      SCREENER: alerts.filter((a) => !a.isRead && a.category === 'SCREENER').length,
      SENTIMENT: alerts.filter((a) => !a.isRead && a.category === 'SENTIMENT').length,
    };
  }, [alerts]);

  // Synthesize notification sound
  const playAlertSound = useCallback((category: AlertCategory) => {
    if (!preferences.soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (category === 'SIGNAL') {
        // High-pitch dual chime for Trading Signals
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.15);
      } else if (category === 'SCREENER') {
        // Technical sonar ping for Screener
        osc.type = 'sine';
        osc.frequency.setValueAtTime(740, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.18);
      } else {
        // Broad bell for Sentiment News
        osc.type = 'sine';
        osc.frequency.setValueAtTime(659.25, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(987.77, ctx.currentTime + 0.2);
      }

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.38);
    } catch {
      // Audio restricted before interaction
    }
  }, [preferences.soundEnabled]);

  const addAlert = useCallback((newAlertData: Omit<MarketAlertItem, 'id' | 'createdAtMs' | 'isRead'>) => {
    // Check preferences
    if (newAlertData.category === 'SIGNAL' && !preferences.enableSignalAlerts) return;
    if (newAlertData.category === 'SCREENER' && !preferences.enableScreenerAlerts) return;
    if (newAlertData.category === 'SENTIMENT' && !preferences.enableSentimentAlerts) return;

    const fullAlert: MarketAlertItem = {
      ...newAlertData,
      id: `ALT-${newAlertData.category}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      createdAtMs: Date.now(),
      isRead: false,
    };

    setAlerts((prev) => [fullAlert, ...prev.slice(0, 49)]);

    // Trigger sound
    playAlertSound(fullAlert.category);

    // Show toast if enabled
    if (preferences.autoShowToast) {
      setActiveToast(fullAlert);
    }
  }, [preferences, playAlertSound]);

  const dismissToast = useCallback(() => {
    setActiveToast(null);
  }, []);

  // Auto dismiss toast after 6 seconds
  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => {
      setActiveToast(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [activeToast]);

  const openAlertCenter = useCallback((category?: AlertCategory) => {
    if (category) {
      setSelectedCategoryTab(category);
    }
    setIsAlertCenterOpen(true);
  }, []);

  const closeAlertCenter = useCallback(() => {
    setIsAlertCenterOpen(false);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, isRead: true } : a)));
  }, []);

  const markAllAsRead = useCallback((category?: AlertCategory) => {
    setAlerts((prev) =>
      prev.map((a) => {
        if (!category || a.category === category) {
          return { ...a, isRead: true };
        }
        return a;
      })
    );
  }, []);

  const deleteAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const clearAllAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  const updatePreferences = useCallback((newPrefs: Partial<AlertFilterPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...newPrefs }));
  }, []);

  const setNavigateCallback = useCallback((cb: (stage: StageId, symbol?: string) => void) => {
    setNavigateCb(() => cb);
  }, []);

  const navigateToAlertTarget = useCallback((alert: MarketAlertItem) => {
    markAsRead(alert.id);
    closeAlertCenter();
    dismissToast();
    if (navigateCb) {
      navigateCb(alert.actionStage, alert.symbol);
    }
  }, [markAsRead, closeAlertCenter, dismissToast, navigateCb]);

  // Generator for dynamic simulated updates whenever there is a new update
  const triggerSimulatedUpdate = useCallback((specificCategory?: AlertCategory) => {
    const categories: AlertCategory[] = ['SIGNAL', 'SCREENER', 'SENTIMENT'];
    const chosenCategory = specificCategory || categories[Math.floor(Math.random() * categories.length)];

    if (chosenCategory === 'SIGNAL') {
      const sampleSymbols = ['ETH/USDT', 'SOL/USDT', 'SUI/USDT', 'AVAX/USDT', 'PEPE/USDT', 'NEAR/USDT'];
      const sym = sampleSymbols[Math.floor(Math.random() * sampleSymbols.length)];
      const isLong = Math.random() > 0.3;
      const score = Math.floor(86 + Math.random() * 11);
      const triggers = [
        'MSS Bullish Breakout 15m & Inflow CVD',
        'Order Block Retest dengan Rejection Wick',
        'VWAP +2σ Expansion dengan Lonjakan Beli',
        'Bullish Fair Value Gap (FVG) Sweep',
      ];
      const trigger = triggers[Math.floor(Math.random() * triggers.length)];

      addAlert({
        category: 'SIGNAL',
        title: `Sinyal Baru: ${sym} (${isLong ? 'LONG' : 'SHORT'})`,
        subtitle: `${trigger} • Skor ${score}/100`,
        message: `Terdeteksi setup institusional pada ${sym} dengan konfirmasi volume derivatif. Target dan Stop Loss telah tervalidasi otomatis.`,
        symbol: sym,
        timestamp: 'Baru saja',
        severity: isLong ? 'SUCCESS' : 'WARNING',
        actionStage: 'signal',
        data: {
          direction: isLong ? 'LONG' : 'SHORT',
          timeframe: '15m',
          confluenceScore: score,
          signalStatus: 'ACTIVE',
          strategyName: trigger,
        },
      });
    } else if (chosenCategory === 'SCREENER') {
      const screenerCoins = [
        { sym: 'DOGE/USDT', trigger: 'VOLUME_SURGE' as const, text: 'Lonjakan Volume +380% di Bursa Spot', change: 7.8 },
        { sym: 'RENDER/USDT', trigger: 'RSI_OVERSOLD' as const, text: 'RSI 14 menyentuh level 26.5 (Oversold Extreme)', change: -3.2 },
        { sym: 'APT/USDT', trigger: 'GOLDEN_CROSS' as const, text: 'EMA 20 Menembus ke atas EMA 50 (Golden Cross)', change: 5.4 },
        { sym: 'ARB/USDT', trigger: 'HIGH_CONFLUENCE' as const, text: 'Skor Konfluensi Indikator Menembus 92/100', change: 4.1 },
      ];
      const selected = screenerCoins[Math.floor(Math.random() * screenerCoins.length)];

      addAlert({
        category: 'SCREENER',
        title: `Penyaring Koin: ${selected.sym} Terpicu`,
        subtitle: selected.text,
        message: `${selected.sym} memenuhi kriteria filter kuantitatif penyaring: ${selected.text} dengan perubahan 24 jam ${selected.change > 0 ? '+' : ''}${selected.change}%.`,
        symbol: selected.sym,
        timestamp: 'Baru saja',
        severity: 'INFO',
        actionStage: 'screening',
        data: {
          screenerTrigger: selected.trigger,
          change24h: selected.change,
          screenerMetricText: selected.text,
        },
      });
    } else {
      const newsItems = [
        {
          title: 'Berita Sentimen: ETF Kripto Catat Rekor Volume $4.8B',
          source: 'Reuters Financial',
          sym: 'BTC/USDT',
          impact: 'BULLISH' as const,
          text: 'Volume perdagangan ETF derivatif kripto melonjak drastis didorong permintaan institusi Wall Street.',
        },
        {
          title: 'Berita Sentimen: Upgrade Jaringan Layer 1 Diumumkan',
          source: 'CoinDesk',
          sym: 'SOL/USDT',
          impact: 'BULLISH' as const,
          text: 'Proposal peningkatan efisiensi throughput transaksi 100k TPS berhasil disahkan oleh validator.',
        },
        {
          title: 'Berita Sentimen: Data Inflasi AS Rilis di Bawah Ekspektasi',
          source: 'Bloomberg Macro',
          sym: 'ETH/USDT',
          impact: 'BULLISH' as const,
          text: 'Indeks harga konsumen yang melandai membuka ruang pelonggaran likuiditas global dan aset berisiko.',
        },
      ];
      const selected = newsItems[Math.floor(Math.random() * newsItems.length)];

      addAlert({
        category: 'SENTIMENT',
        title: selected.title,
        subtitle: `${selected.source} • Dampak ${selected.impact}`,
        message: selected.text,
        symbol: selected.sym,
        timestamp: 'Baru saja',
        severity: 'INFO',
        actionStage: 'sentiment',
        data: {
          sentimentImpact: selected.impact,
          newsSource: selected.source,
          sentimentScore: 85,
        },
      });
    }
  }, [addAlert]);

  // Periodic real-time alert simulator: triggers a realistic update every 65 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      // 70% probability to trigger periodic alert in background
      if (Math.random() > 0.25) {
        triggerSimulatedUpdate();
      }
    }, 65000);

    return () => clearInterval(interval);
  }, [triggerSimulatedUpdate]);

  const value = useMemo(
    () => ({
      alerts,
      unreadCount,
      unreadCountByCategory,
      activeToast,
      dismissToast,
      isAlertCenterOpen,
      openAlertCenter,
      closeAlertCenter,
      selectedCategoryTab,
      setSelectedCategoryTab,
      addAlert,
      markAsRead,
      markAllAsRead,
      deleteAlert,
      clearAllAlerts,
      preferences,
      updatePreferences,
      triggerSimulatedUpdate,
      navigateToAlertTarget,
      setNavigateCallback,
    }),
    [
      alerts,
      unreadCount,
      unreadCountByCategory,
      activeToast,
      dismissToast,
      isAlertCenterOpen,
      openAlertCenter,
      closeAlertCenter,
      selectedCategoryTab,
      addAlert,
      markAsRead,
      markAllAsRead,
      deleteAlert,
      clearAllAlerts,
      preferences,
      updatePreferences,
      triggerSimulatedUpdate,
      navigateToAlertTarget,
      setNavigateCallback,
    ]
  );

  return <AlertContext.Provider value={value}>{children}</AlertContext.Provider>;
};

export const useAlerts = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlerts must be used within an AlertProvider');
  }
  return context;
};
