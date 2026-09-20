import {
  MasterUserSettings,
  AIModelConfig,
  NotificationChannel,
} from '../types/settings.types';
import { loadExchangeCredentials, CREDENTIALS_STORAGE_KEY } from './credentialStorageService';
import { loadJournalTrades, loadJournalNotes, JOURNAL_TRADES_STORAGE_KEY, JOURNAL_NOTES_STORAGE_KEY } from './journalStorageService';

export const DEFAULT_AI_MODELS: AIModelConfig[] = [
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google DeepMind',
    status: 'ACTIVE',
    description: 'Sub-second real-time inference optimized for high-frequency quantitative market analysis.',
    speed: '~280ms',
    reasoningDepth: 'High Conviction Multi-Factor',
    maxTokens: 1048576,
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro (Deep Think)',
    provider: 'Google DeepMind',
    status: 'ACTIVE',
    description: 'Complex macro synthesis, order flow footprint analysis, and institutional risk matrix deduction.',
    speed: '~1.2s',
    reasoningDepth: 'Institutional Full Chain-of-Thought',
    maxTokens: 2097152,
  },
  {
    id: 'deepseek-r1',
    name: 'DeepSeek-R1 (Quantitative)',
    provider: 'DeepSeek AI',
    status: 'COMING_SOON',
    description: 'Specialized open-weights reasoning model for algorithmic arbitrage and market microstructure math.',
    speed: '~2.1s (Segera)',
    reasoningDepth: 'Mathematical Proof Sizing',
    maxTokens: 128000,
  },
  {
    id: 'claude-3-7-sonnet',
    name: 'Claude 3.7 Sonnet (Hybrid Think)',
    provider: 'Anthropic',
    status: 'COMING_SOON',
    description: 'Extended thinking reasoning model with granular risk invalidation parameters.',
    speed: '~1.8s (Segera)',
    reasoningDepth: 'Adaptive Thinking Depth',
    maxTokens: 200000,
  },
  {
    id: 'gpt-4-5-preview',
    name: 'GPT-4.5 Ultra Quant',
    provider: 'OpenAI',
    status: 'COMING_SOON',
    description: 'Next-generation frontier multi-modal reasoning and pattern classification engine.',
    speed: '~2.5s (Segera)',
    reasoningDepth: 'Deep Market Microstructure',
    maxTokens: 128000,
  },
];

const STORAGE_KEY = 'imasbtc_master_user_settings';

export const getDefaultMasterSettings = (email?: string, displayName?: string): MasterUserSettings => ({
  account: {
    displayName: displayName || 'Institutional Trader',
    email: email || 'nintynine.coin@gmail.com',
    userId: 'IMAS-99-' + Math.floor(100000 + Math.random() * 900000),
    role: 'PRO_TRADER',
    memberSince: 'September 2024',
    twoFactorEnabled: true,
    ipWhitelistEnabled: false,
    autoLockMinutes: 30,
  },
  regional: {
    language: 'id',
    timezone: 'WIB',
    numberFormat: 'US',
    currencySymbol: 'USD',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
  },
  display: {
    themeMode: 'dark',
    accentColor: 'cyan',
    isFullscreen: false,
    isFullWidth: true,
    workspaceMode: 'classic',
    chartAnimation: true,
    soundAlerts: true,
    compactTable: false,
  },
  notifications: {
    email: {
      enabled: true,
      connected: true,
      target: email || 'nintynine.coin@gmail.com',
      minConfluenceScore: 80,
      alertOnTP: true,
      alertOnSL: true,
      alertOnWhale: true,
      alertOnHighImpactNews: true,
      verifiedAt: new Date().toLocaleDateString(),
    },
    telegram: {
      enabled: false,
      connected: false,
      target: '@imasbtc_signals_bot',
      botToken: '',
      chatId: '',
      minConfluenceScore: 85,
      alertOnTP: true,
      alertOnSL: true,
      alertOnWhale: true,
      alertOnHighImpactNews: true,
    },
    whatsapp: {
      enabled: false,
      connected: false,
      target: '+6281234567890',
      apiKey: '',
      countryCode: '+62',
      minConfluenceScore: 90,
      alertOnTP: true,
      alertOnSL: true,
      alertOnWhale: false,
      alertOnHighImpactNews: true,
    },
  },
  aiIntegrations: {
    selectedAIModel: 'gemini-2.5-flash',
    aiTemperature: 0.2,
    reasoningEffort: 'high',
    institutionalPrompting: true,
  },
});

export const loadMasterUserSettings = (email?: string, displayName?: string): MasterUserSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Merge with defaults to ensure all nested keys exist
      const defaults = getDefaultMasterSettings(email, displayName);
      return {
        ...defaults,
        ...parsed,
        account: { ...defaults.account, ...parsed.account, email: email || parsed.account?.email || defaults.account.email },
        regional: { ...defaults.regional, ...parsed.regional },
        display: { ...defaults.display, ...parsed.display },
        notifications: {
          email: { ...defaults.notifications.email, ...parsed.notifications?.email },
          telegram: { ...defaults.notifications.telegram, ...parsed.notifications?.telegram },
          whatsapp: { ...defaults.notifications.whatsapp, ...parsed.notifications?.whatsapp },
        },
        aiIntegrations: { ...defaults.aiIntegrations, ...parsed.aiIntegrations },
      };
    }
  } catch (err) {
    console.warn('Failed to load user settings from localStorage:', err);
  }
  return getDefaultMasterSettings(email, displayName);
};

export const saveMasterUserSettings = (settings: MasterUserSettings): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('imasbtc_settings_updated', { detail: settings }));
    }
  } catch (err) {
    console.error('Failed to save master user settings:', err);
  }
};

export const exportAllAppDataAsJson = (): string => {
  const exportData = {
    exportedAt: new Date().toISOString(),
    version: '2.5.0',
    terminal: 'AKIRAQU Institutional Quantitative Terminal',
    settings: loadMasterUserSettings(),
    exchangeCredentials: loadExchangeCredentials(),
    journalTrades: loadJournalTrades(),
    journalNotes: loadJournalNotes(),
    backtests: JSON.parse(localStorage.getItem('nexus_backtest_runs') || '[]'),
    paperTrades: JSON.parse(localStorage.getItem('imasbtc_manual_positions') || localStorage.getItem('nexus_paper_positions') || '[]'),
    tradingBots: JSON.parse(localStorage.getItem('nexus_trading_bots') || '[]'),
  };
  return JSON.stringify(exportData, null, 2);
};

export const clearAllAppData = (): void => {
  try {
    localStorage.removeItem(JOURNAL_TRADES_STORAGE_KEY);
    localStorage.removeItem(JOURNAL_NOTES_STORAGE_KEY);
    localStorage.removeItem('nexus_journal_trades');
    localStorage.removeItem('nexus_trading_journal');
    localStorage.removeItem(CREDENTIALS_STORAGE_KEY);
    localStorage.removeItem('imasbtc_exchange_credentials');
    localStorage.removeItem('nexus_exchange_credentials');
    localStorage.removeItem('nexus_backtest_runs');
    localStorage.removeItem('nexus_paper_positions');
    localStorage.removeItem('imasbtc_manual_positions');
    localStorage.removeItem('imasbtc_manual_orders');
    localStorage.removeItem('nexus_trading_bots');
    localStorage.removeItem('nexus_bot_trades');
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Clear app data error', e);
  }
};
