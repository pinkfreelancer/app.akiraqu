import React from 'react';
import {
  CandlestickChart,
  Flame,
  Newspaper,
  Layers,
  Gauge,
  FlaskConical,
  FileText,
  ShieldCheck,
  Bot,
  BookOpen,
  Wallet,
  Star,
  BarChart3,
  Sliders,
  Activity,
  Zap,
  Compass,
  TrendingUp,
  Radio,
  Globe,
  Database,
  Calendar,
  Network,
  Calculator,
  BellRing,
  Clock,
  PieChart,
  Settings as SettingsIcon,
} from 'lucide-react';
import { StageId } from '../types/market.types';

export type CategoryKey =
  | 'all'
  | 'macro'
  | 'market'
  | 'technical'
  | 'research'
  | 'execution'
  | 'connection'
  | 'evaluation'
  | 'system';

export interface NavItemConfig {
  id: StageId;
  stepNumber: string;
  labelId: string;
  labelEn: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
  category: CategoryKey;
}

export interface NavGroupConfig {
  key: CategoryKey;
  groupNameId: string;
  groupNameEn: string;
  icon: React.ElementType;
  isSystemDivider?: boolean;
  items: NavItemConfig[];
}

export const SIDEBAR_NAV_GROUPS: NavGroupConfig[] = [
  // 1. 🌐 DATA MAKRO & KONTEKS (Buka Sesi)
  {
    key: 'macro',
    groupNameId: '🌐 1. DATA MAKRO & KONTEKS',
    groupNameEn: '🌐 1. MACRO & CONTEXT DATA',
    icon: Globe,
    items: [
      {
        id: 'btc_dominance',
        stepNumber: '01',
        labelId: 'Dominasi BTC/Altcoin',
        labelEn: 'BTC/Altcoin Dominance',
        icon: PieChart,
        category: 'macro',
      },
      {
        id: 'onchain_data',
        stepNumber: '02',
        labelId: 'Data On-Chain',
        labelEn: 'On-Chain Data',
        icon: Database,
        category: 'macro',
      },
      {
        id: 'economic_calendar',
        stepNumber: '03',
        labelId: 'Kalender Ekonomi & Crypto',
        labelEn: 'Economic & Crypto Calendar',
        icon: Calendar,
        category: 'macro',
      },
      {
        id: 'sentiment',
        stepNumber: '04',
        labelId: 'Berita & Sentimen',
        labelEn: 'News & Sentiment',
        icon: Newspaper,
        badge: 'Alert',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        category: 'macro',
      },
    ],
  },

  // 2. 📊 PASAR & SCREENING (Cari Peluang)
  {
    key: 'market',
    groupNameId: '📊 2. PASAR & SCREENING',
    groupNameEn: '📊 2. MARKET & SCREENING',
    icon: Compass,
    items: [
      {
        id: 'market_heatmap',
        stepNumber: '05',
        labelId: 'Heatmap Pasar',
        labelEn: 'Market Heatmap',
        icon: Flame,
        category: 'market',
      },
      {
        id: 'gainers_losers',
        stepNumber: '06',
        labelId: 'Top Gainers & Losers',
        labelEn: 'Top Gainers & Losers',
        icon: TrendingUp,
        category: 'market',
      },
      {
        id: 'screening',
        stepNumber: '07',
        labelId: 'Penyaring Koin',
        labelEn: 'Coin Screener',
        icon: BarChart3,
        badge: 'Filter',
        badgeColor: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
        category: 'market',
      },
      {
        id: 'watchlist',
        stepNumber: '08',
        labelId: 'Watchlist',
        labelEn: 'Watchlist',
        icon: Star,
        category: 'market',
      },
      {
        id: 'signal',
        stepNumber: '09',
        labelId: 'Sinyal Trading',
        labelEn: 'Trading Signals',
        icon: Radio,
        badge: 'LIVE',
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        category: 'market',
      },
    ],
  },

  // 3. 🔍 INDIKATOR & SCREENING TEKNIKAL (Validasi Sinyal)
  {
    key: 'technical',
    groupNameId: '🔍 3. INDIKATOR & TEKNIKAL',
    groupNameEn: '🔍 3. INDICATORS & TECHNICAL',
    icon: Layers,
    items: [
      {
        id: 'ticker',
        stepNumber: '10',
        labelId: 'Grafik Utama',
        labelEn: 'Main Chart',
        icon: CandlestickChart,
        category: 'technical',
      },
      {
        id: 'indicators',
        stepNumber: '11',
        labelId: '12 Indikator',
        labelEn: '12 Indicators',
        icon: Layers,
        category: 'technical',
      },
      {
        id: 'confluence',
        stepNumber: '12',
        labelId: 'Skor Konfluensi',
        labelEn: 'Confluence Score',
        icon: Gauge,
        category: 'technical',
      },
      {
        id: 'mtf_screener',
        stepNumber: '13',
        labelId: 'Screener Multi-Timeframe',
        labelEn: 'Multi-Timeframe Screener',
        icon: Layers,
        category: 'technical',
      },
      {
        id: 'orderflow',
        stepNumber: '14',
        labelId: 'Order Flow & Likuiditas',
        labelEn: 'Order Flow & Liquidity',
        icon: Flame,
        category: 'technical',
      },
      {
        id: 'volatility_scanner',
        stepNumber: '15',
        labelId: 'Volatility Scanner',
        labelEn: 'Volatility Scanner',
        icon: Activity,
        category: 'technical',
      },
      {
        id: 'correlation_beta',
        stepNumber: '16',
        labelId: 'Correlation & Beta Analyzer',
        labelEn: 'Correlation & Beta Analyzer',
        icon: Network,
        category: 'technical',
      },
    ],
  },

  // 4. 🧪 RISET & STRATEGI (Hitung Risiko)
  {
    key: 'research',
    groupNameId: '🧪 4. RISET & STRATEGI',
    groupNameEn: '🧪 4. RESEARCH & STRATEGY',
    icon: FlaskConical,
    items: [
      {
        id: 'risk',
        stepNumber: '17',
        labelId: 'Kalkulator Risiko',
        labelEn: 'Risk Calculator',
        icon: ShieldCheck,
        category: 'research',
      },
      {
        id: 'backtest',
        stepNumber: '18',
        labelId: 'Backtest Lab',
        labelEn: 'Backtest Lab',
        icon: FlaskConical,
        category: 'research',
      },
      {
        id: 'return_distribution',
        stepNumber: '19',
        labelId: 'Statistik & Distribusi Return',
        labelEn: 'Return Stats & Distribution',
        icon: BarChart3,
        category: 'research',
      },
      {
        id: 'output',
        stepNumber: '20',
        labelId: 'Laporan AI',
        labelEn: 'AI Report',
        icon: FileText,
        badge: 'AI',
        badgeColor: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
        category: 'research',
      },
    ],
  },

  // 5. ⚡ EKSEKUSI AKTIF (Eksekusi)
  {
    key: 'execution',
    groupNameId: '⚡ 5. EKSEKUSI AKTIF',
    groupNameEn: '⚡ 5. ACTIVE EXECUTION',
    icon: Zap,
    items: [
      {
        id: 'manual_trading',
        stepNumber: '21',
        labelId: 'Trading Manual',
        labelEn: 'Manual Trading',
        icon: Zap,
        badge: 'Live',
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        category: 'execution',
      },
      {
        id: 'bot',
        stepNumber: '22',
        labelId: 'Trading Bot',
        labelEn: 'Trading Bot',
        icon: Bot,
        category: 'execution',
      },
      {
        id: 'position_sizing',
        stepNumber: '23',
        labelId: 'Position Sizing Otomatis',
        labelEn: 'Automated Position Sizing',
        icon: Calculator,
        category: 'execution',
      },
      {
        id: 'active_orders',
        stepNumber: '24',
        labelId: 'Manajemen Order Aktif',
        labelEn: 'Active Orders Management',
        icon: Clock,
        category: 'execution',
      },
    ],
  },

  // 6. 🔧 KONEKSI & ALERT (Pantau)
  {
    key: 'connection',
    groupNameId: '🔧 6. KONEKSI & ALERT',
    groupNameEn: '🔧 6. CONNECTIONS & ALERTS',
    icon: BellRing,
    items: [
      {
        id: 'alerts',
        stepNumber: '25',
        labelId: 'Alert & Notifikasi Builder',
        labelEn: 'Alert & Notification Builder',
        icon: BellRing,
        category: 'connection',
      },
      {
        id: 'portfolio',
        stepNumber: '26',
        labelId: 'Portofolio',
        labelEn: 'Portfolio',
        icon: Wallet,
        category: 'connection',
      },
      {
        id: 'multi_exchange',
        stepNumber: '27',
        labelId: 'Multi-Exchange Manager',
        labelEn: 'Multi-Exchange Manager',
        icon: Layers,
        category: 'connection',
      },
    ],
  },

  // 7. 📈 EVALUASI & RIWAYAT (Evaluasi)
  {
    key: 'evaluation',
    groupNameId: '📈 7. EVALUASI & RIWAYAT',
    groupNameEn: '📈 7. EVALUATION & HISTORY',
    icon: BookOpen,
    items: [
      {
        id: 'journal',
        stepNumber: '28',
        labelId: 'Jurnal Trading',
        labelEn: 'Trading Journal',
        icon: BookOpen,
        category: 'evaluation',
      },
      {
        id: 'reports',
        stepNumber: '29',
        labelId: 'Laporan Kinerja',
        labelEn: 'Performance Reports',
        icon: FileText,
        badge: 'CSV',
        badgeColor: 'bg-slate-800/80 text-slate-300 border-slate-700/60',
        category: 'evaluation',
      },
    ],
  },

  // 8. ⚙️ SISTEM
  {
    key: 'system',
    groupNameId: '⚙️ SISTEM',
    groupNameEn: '⚙️ SYSTEM',
    icon: SettingsIcon,
    isSystemDivider: true,
    items: [
      {
        id: 'settings',
        stepNumber: '30',
        labelId: 'Pengaturan',
        labelEn: 'Settings',
        icon: Sliders,
        category: 'system',
      },
    ],
  },
];

export const CATEGORY_TABS: Array<{ key: CategoryKey; labelId: string; labelEn: string }> = [
  { key: 'all', labelId: 'Semua', labelEn: 'All' },
  { key: 'macro', labelId: '1. Makro', labelEn: '1. Macro' },
  { key: 'market', labelId: '2. Pasar', labelEn: '2. Market' },
  { key: 'technical', labelId: '3. Teknikal', labelEn: '3. Technical' },
  { key: 'research', labelId: '4. Riset', labelEn: '4. Research' },
  { key: 'execution', labelId: '5. Eksekusi', labelEn: '5. Execution' },
  { key: 'connection', labelId: '6. Pantau', labelEn: '6. Monitor' },
  { key: 'evaluation', labelId: '7. Evaluasi', labelEn: '7. History' },
  { key: 'system', labelId: 'Sistem', labelEn: 'System' },
];
