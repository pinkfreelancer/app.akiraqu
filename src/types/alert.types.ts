// Unified Market Alert Types: Sinyal Trading, Penyaring Koin, & Berita Sentimen

export type AlertCategory = 'SIGNAL' | 'SCREENER' | 'SENTIMENT';

export type AlertSeverity = 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL';

export interface MarketAlertItem {
  id: string;
  category: AlertCategory;
  title: string;
  subtitle?: string;
  message: string;
  symbol?: string;
  timestamp: string;
  createdAtMs: number;
  isRead: boolean;
  severity: AlertSeverity;
  data?: {
    // Sinyal Trading payload
    signalId?: string;
    direction?: 'LONG' | 'SHORT';
    timeframe?: string;
    entryPrice?: number;
    targetPrice?: number;
    stopLoss?: number;
    confluenceScore?: number;
    signalStatus?: string;
    strategyName?: string;
    // Penyaring Koin payload
    screenerTrigger?: 'RSI_OVERSOLD' | 'RSI_OVERBOUGHT' | 'VOLUME_SURGE' | 'GOLDEN_CROSS' | 'HIGH_CONFLUENCE' | 'SUPERTREND_FLIP' | 'FUNDING_SQUEEZE';
    price?: number;
    change24h?: number;
    rsi14?: number;
    volumeSurgePct?: number;
    screenerMetricText?: string;
    // Berita Sentimen payload
    sentimentImpact?: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    sentimentScore?: number;
    newsSource?: string;
    newsCategory?: string;
    url?: string;
  };
  actionStage: 'signal' | 'screening' | 'sentiment';
}

export interface AlertFilterPreferences {
  enableSignalAlerts: boolean;
  enableScreenerAlerts: boolean;
  enableSentimentAlerts: boolean;
  soundEnabled: boolean;
  autoShowToast: boolean;
  minConfluenceFilter: number;
}
