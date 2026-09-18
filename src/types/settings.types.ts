import { SupportedExchange, MarketType } from './market.types';

export type DisplayThemeMode = 'light' | 'dark' | 'classic' | 'custom';
export type AccentColor = 'cyan' | 'emerald' | 'amber' | 'violet' | 'rose';
export type TimezoneOption = 'WIB' | 'WITA' | 'WIT' | 'UTC' | 'EST' | 'SGT' | 'TOKYO';
export type NumberFormatOption = 'US' | 'EU' | 'ID';
export type CurrencySymbolOption = 'USD' | 'IDR' | 'EUR' | 'USDT';

export interface UserAccountSettings {
  displayName: string;
  email: string;
  photoURL?: string;
  userId: string;
  role: 'PRO_TRADER' | 'INSTITUTIONAL' | 'VIP_QUANT';
  memberSince: string;
  twoFactorEnabled: boolean;
  ipWhitelistEnabled: boolean;
  autoLockMinutes: number;
}

export interface RegionalPreferences {
  language: 'id' | 'en';
  timezone: TimezoneOption;
  numberFormat: NumberFormatOption;
  currencySymbol: CurrencySymbolOption;
  dateFormat: 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'MM/DD/YYYY';
  timeFormat: '24h' | '12h';
}

export interface DisplayPreferences {
  themeMode: DisplayThemeMode;
  accentColor: AccentColor;
  isFullscreen: boolean;
  isFullWidth: boolean;
  workspaceMode: 'classic' | 'launchpad';
  chartAnimation: boolean;
  soundAlerts: boolean;
  compactTable: boolean;
}

export interface NotificationChannel {
  enabled: boolean;
  connected: boolean;
  target: string;
  minConfluenceScore: number;
  alertOnTP: boolean;
  alertOnSL: boolean;
  alertOnWhale: boolean;
  alertOnHighImpactNews: boolean;
  verifiedAt?: string;
}

export interface NotificationSettings {
  email: NotificationChannel;
  telegram: NotificationChannel & { botToken?: string; chatId?: string };
  whatsapp: NotificationChannel & { apiKey?: string; countryCode?: string };
}

export interface AIModelConfig {
  id: string;
  name: string;
  provider: string;
  status: 'ACTIVE' | 'COMING_SOON' | 'BETA';
  description: string;
  speed: string;
  reasoningDepth: string;
  maxTokens: number;
}

export interface ApiIntegrationsSettings {
  selectedAIModel: string;
  aiTemperature: number;
  reasoningEffort: 'low' | 'medium' | 'high';
  institutionalPrompting: boolean;
}

export interface MasterUserSettings {
  account: UserAccountSettings;
  regional: RegionalPreferences;
  display: DisplayPreferences;
  notifications: NotificationSettings;
  aiIntegrations: ApiIntegrationsSettings;
}
