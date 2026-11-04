import React, { useState, useMemo } from 'react';
import {
  CryptoScreenerCoin,
  ScreenerFilterState,
  CryptoCategory,
  SupportedExchange,
} from '../types/crypto.types';
import {
  Filter,
  Search,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Download,
  CheckCircle2,
  SlidersHorizontal,
  Flame,
  Zap,
  Star,
  Eye,
  Layers,
  BarChart3,
  RefreshCw,
  ChevronRight,
  ShieldAlert,
  Bell,
  BellRing,
} from 'lucide-react';
import { formatCryptoPrice } from '../utils/formatters';
import { Language } from '../i18n/translations';
import { useAlerts } from '../contexts/AlertContext';
import { useMarketDataStore } from '../stores/useMarketDataStore';
import { useTerminal } from '../contexts/TerminalContext';
import { formatSmartCryptoPrice } from '../services/marketDataValidator';
import { DataStatusBadge } from '../components/ui/DataStatusBadge';
import { CoinLogo } from '../components/ui/CoinLogo';

interface ScreeningPageProps {
  currentSymbol?: string;
  onSelectSymbol?: (symbol: string) => void;
  onNavigateToTrade?: (symbol: string) => void;
  onAddToWatchlist?: (symbol: string) => void;
  selectedExchange?: SupportedExchange;
  theme?: 'light' | 'dark';
  lang?: Language;
}

const SCREENER_COIN_TEMPLATES: CryptoScreenerCoin[] = [
  {
    symbol: 'BTC/USDT',
    name: 'Bitcoin',
    category: 'Layer 1',
    price: 0,
    change24h: 0,
    change7d: 4.2,
    volume24hUsd: 38450000000,
    marketCapUsd: 1620000000000,
    rsi14: 54.4,
    macdStatus: 'NEUTRAL',
    supertrend: 'BULLISH',
    fundingRate8h: 0.008,
    fundingBias: 'NEUTRAL',
    openInterestChange24h: 3.4,
    volatilityAtrPct: 2.8,
    confluenceScore: 76,
    sparkline: [0.97, 0.98, 0.99, 1.0, 0.995, 1.005, 1.0],
    signalGrade: 'BUY',
  },
  {
    symbol: 'ETH/USDT',
    name: 'Ethereum',
    category: 'Layer 1',
    price: 0,
    change24h: 0,
    change7d: 2.1,
    volume24hUsd: 18450000000,
    marketCapUsd: 340000000000,
    rsi14: 48.6,
    macdStatus: 'NEUTRAL',
    supertrend: 'BEARISH',
    fundingRate8h: 0.005,
    fundingBias: 'NEUTRAL',
    openInterestChange24h: -2.1,
    volatilityAtrPct: 3.4,
    confluenceScore: 74,
    sparkline: [1.01, 1.02, 1.0, 0.99, 1.005, 0.995, 1.0],
    signalGrade: 'NEUTRAL',
  },
  {
    symbol: 'SOL/USDT',
    name: 'Solana',
    category: 'Layer 1',
    price: 0,
    change24h: 0,
    change7d: 8.5,
    volume24hUsd: 7820000000,
    marketCapUsd: 82400000000,
    rsi14: 61.2,
    macdStatus: 'BULLISH_CROSS',
    supertrend: 'BULLISH',
    fundingRate8h: -0.012,
    fundingBias: 'EXTREME_NEGATIVE',
    openInterestChange24h: 9.8,
    volatilityAtrPct: 5.6,
    confluenceScore: 84,
    sparkline: [0.94, 0.96, 0.97, 0.98, 0.99, 0.995, 1.0],
    signalGrade: 'BUY',
  },
  {
    symbol: 'SUI/USDT',
    name: 'Sui Network',
    category: 'Layer 1',
    price: 0,
    change24h: 0,
    change7d: 14.4,
    volume24hUsd: 1850000000,
    marketCapUsd: 9800000000,
    rsi14: 64.8,
    macdStatus: 'BULLISH',
    supertrend: 'BULLISH',
    fundingRate8h: 0.015,
    fundingBias: 'POSITIVE',
    openInterestChange24h: 12.4,
    volatilityAtrPct: 7.8,
    confluenceScore: 83,
    sparkline: [0.92, 0.94, 0.96, 0.98, 0.97, 0.99, 1.0],
    signalGrade: 'BUY',
  },
  {
    symbol: 'NEAR/USDT',
    name: 'NEAR Protocol',
    category: 'AI & Big Data',
    price: 0,
    change24h: 0,
    change7d: 11.1,
    volume24hUsd: 980000000,
    marketCapUsd: 8200000000,
    rsi14: 62.4,
    macdStatus: 'BULLISH_CROSS',
    supertrend: 'BULLISH',
    fundingRate8h: -0.008,
    fundingBias: 'NEGATIVE',
    openInterestChange24h: 11.5,
    volatilityAtrPct: 6.2,
    confluenceScore: 85,
    sparkline: [0.93, 0.95, 0.97, 0.96, 0.98, 0.99, 1.0],
    signalGrade: 'BUY',
  },
  {
    symbol: 'PEPE/USDT',
    name: 'Pepe',
    category: 'Meme',
    price: 0,
    change24h: 0,
    change7d: 15.2,
    volume24hUsd: 1450000000,
    marketCapUsd: 4540000000,
    rsi14: 66.2,
    macdStatus: 'BULLISH',
    supertrend: 'BULLISH',
    fundingRate8h: 0.018,
    fundingBias: 'POSITIVE',
    openInterestChange24h: 18.2,
    volatilityAtrPct: 12.4,
    confluenceScore: 80,
    sparkline: [0.9, 0.93, 0.95, 0.94, 0.97, 0.99, 1.0],
    signalGrade: 'BUY',
  },
  {
    symbol: 'AVAX/USDT',
    name: 'Avalanche',
    category: 'Layer 1',
    price: 0,
    change24h: 0,
    change7d: 1.4,
    volume24hUsd: 650000000,
    marketCapUsd: 14800000000,
    rsi14: 41.2,
    macdStatus: 'BEARISH_CROSS',
    supertrend: 'BEARISH',
    fundingRate8h: -0.004,
    fundingBias: 'NEGATIVE',
    openInterestChange24h: -4.5,
    volatilityAtrPct: 4.8,
    confluenceScore: 71,
    sparkline: [1.04, 1.02, 1.03, 1.01, 1.0, 1.01, 1.0],
    signalGrade: 'SELL',
  },
  {
    symbol: 'LINK/USDT',
    name: 'Chainlink',
    category: 'DeFi',
    price: 0,
    change24h: 0,
    change7d: 7.2,
    volume24hUsd: 580000000,
    marketCapUsd: 9200000000,
    rsi14: 58.4,
    macdStatus: 'BULLISH',
    supertrend: 'BULLISH',
    fundingRate8h: 0.006,
    fundingBias: 'NEUTRAL',
    openInterestChange24h: 8.2,
    volatilityAtrPct: 4.1,
    confluenceScore: 82,
    sparkline: [0.95, 0.96, 0.98, 0.97, 0.99, 0.995, 1.0],
    signalGrade: 'BUY',
  },
  {
    symbol: 'TON/USDT',
    name: 'Toncoin',
    category: 'Layer 1',
    price: 0,
    change24h: 0,
    change7d: 6.8,
    volume24hUsd: 420000000,
    marketCapUsd: 14400000000,
    rsi14: 52.8,
    macdStatus: 'NEUTRAL',
    supertrend: 'BULLISH',
    fundingRate8h: 0.003,
    fundingBias: 'NEUTRAL',
    openInterestChange24h: 2.1,
    volatilityAtrPct: 3.6,
    confluenceScore: 79,
    sparkline: [0.96, 0.97, 0.98, 0.975, 0.99, 0.995, 1.0],
    signalGrade: 'BUY',
  },
  {
    symbol: 'DOGE/USDT',
    name: 'Dogecoin',
    category: 'Meme',
    price: 0,
    change24h: 0,
    change7d: 9.2,
    volume24hUsd: 2150000000,
    marketCapUsd: 27100000000,
    rsi14: 60.1,
    macdStatus: 'BULLISH',
    supertrend: 'BULLISH',
    fundingRate8h: 0.011,
    fundingBias: 'POSITIVE',
    openInterestChange24h: 11.1,
    volatilityAtrPct: 8.5,
    confluenceScore: 81,
    sparkline: [0.93, 0.95, 0.97, 0.96, 0.98, 0.99, 1.0],
    signalGrade: 'BUY',
  },
  {
    symbol: 'FET/USDT',
    name: 'Artificial Superintelligence',
    category: 'AI & Big Data',
    price: 0,
    change24h: 0,
    change7d: 14.8,
    volume24hUsd: 380000000,
    marketCapUsd: 3800000000,
    rsi14: 63.2,
    macdStatus: 'BULLISH_CROSS',
    supertrend: 'BULLISH',
    fundingRate8h: -0.01,
    fundingBias: 'NEGATIVE',
    openInterestChange24h: 14.8,
    volatilityAtrPct: 9.2,
    confluenceScore: 86,
    sparkline: [0.91, 0.93, 0.96, 0.95, 0.98, 0.99, 1.0],
    signalGrade: 'BUY',
  },
  {
    symbol: 'BNB/USDT',
    name: 'BNB',
    category: 'Layer 1',
    price: 0,
    change24h: 0,
    change7d: 5.4,
    volume24hUsd: 1420000000,
    marketCapUsd: 96000000000,
    rsi14: 57.8,
    macdStatus: 'BULLISH',
    supertrend: 'BULLISH',
    fundingRate8h: 0.007,
    fundingBias: 'NEUTRAL',
    openInterestChange24h: 4.8,
    volatilityAtrPct: 2.9,
    confluenceScore: 82,
    sparkline: [0.96, 0.97, 0.98, 0.975, 0.99, 0.995, 1.0],
    signalGrade: 'BUY',
  },
];

const PRESETS = [
  {
    id: 'ALL',
    name: 'Semua Pasar',
    icon: Layers,
    desc: 'Tampilkan seluruh koin tanpa filter khusus',
  },
  {
    id: 'MOMENTUM_BREAKOUT',
    name: '🚀 Momentum & Vol Volume',
    icon: Flame,
    desc: 'SuperTrend Bullish + Volume 24h & Perubahan Harga Tinggi',
  },
  {
    id: 'OVERSOLD_REBOUND',
    name: '⚡ Oversold RSI (<45)',
    icon: Zap,
    desc: 'Peluang pantulan harga bawah (Bottom Fishing)',
  },
  {
    id: 'SHORT_SQUEEZE',
    name: '🧲 Funding Rate Squeeze',
    icon: Sparkles,
    desc: 'Funding rate negatif ekstrim dengan Open Interest meningkat',
  },
  {
    id: 'AI_TOP_CONFLUENCE',
    name: '💎 Skor Konfluensi 90+',
    icon: Star,
    desc: 'Koin dengan skor sinyal multi-indikator terbaik',
  },
];

export const ScreeningPage: React.FC<ScreeningPageProps> = ({
  currentSymbol,
  onSelectSymbol,
  onNavigateToTrade,
  onAddToWatchlist,
  selectedExchange = 'BINANCE',
  theme = 'dark',
  lang = 'id',
}) => {
  const isDark = theme === 'dark';
  const isId = lang === 'id';

  // Filters state
  const [activePreset, setActivePreset] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedMarketCapTier, setSelectedMarketCapTier] = useState<string>('ALL');
  const [selectedRsiRange, setSelectedRsiRange] = useState<string>('ALL');
  const [selectedSupertrend, setSelectedSupertrend] = useState<string>('ALL');
  const [minConfluence, setMinConfluence] = useState<number>(70);
  const [sortBy, setSortBy] = useState<keyof CryptoScreenerCoin>('confluenceScore');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [downloadNotification, setDownloadNotification] = useState<boolean>(false);
  const [addedWatchlistCoin, setAddedWatchlistCoin] = useState<string | null>(null);
  const [addedAlertCoin, setAddedAlertCoin] = useState<string | null>(null);

  const { addAlert, openAlertCenter, unreadCountByCategory, triggerSimulatedUpdate } = useAlerts();
  const ssotTickers = useMarketDataStore((s) => s.tickers);
  const { evaluation, selectedSymbol } = useTerminal();

  const liveScreenerCoins = useMemo(() => {
    const parseVol = (v?: string | number | null): number => {
      if (typeof v === 'number' && Number.isFinite(v)) return v;
      if (typeof v === 'string') {
        const clean = v.replace(/[^0-9.BMK]/gi, '').toUpperCase();
        const num = parseFloat(clean);
        if (!Number.isFinite(num)) return 0;
        if (clean.endsWith('B')) return num * 1e9;
        if (clean.endsWith('M')) return num * 1e6;
        if (clean.endsWith('K')) return num * 1e3;
        return num;
      }
      return 0;
    };
    return SCREENER_COIN_TEMPLATES.map((tpl) => {
      const ssot = ssotTickers[tpl.symbol];
      const livePrice = ssot?.price ?? 0;
      const liveChange = ssot?.change24h ?? 0;
      const parsedVol = parseVol(ssot?.volume24h);
      const liveVol = parsedVol > 0 ? parsedVol : tpl.volume24hUsd;

      let confluenceScore = tpl.confluenceScore;
      let supertrend = tpl.supertrend;
      let signalGrade = tpl.signalGrade;

      if (tpl.symbol === selectedSymbol && evaluation && evaluation.symbol === selectedSymbol) {
        confluenceScore = evaluation.confluenceScore;
        const isBear = evaluation.marketBias.toLowerCase().includes('bear');
        const isBull = evaluation.marketBias.toLowerCase().includes('bull');
        supertrend = isBear ? 'BEARISH' : isBull ? 'BULLISH' : tpl.supertrend;
        signalGrade = isBear
          ? confluenceScore <= 30
            ? 'STRONG_SELL'
            : 'SELL'
          : isBull
          ? confluenceScore >= 75
            ? 'STRONG_BUY'
            : 'BUY'
          : 'NEUTRAL';
      } else if (ssot) {
        supertrend = liveChange >= 0 ? 'BULLISH' : 'BEARISH';
      }

      const scaledSparkline =
        livePrice > 0
          ? tpl.sparkline.map((ratio, idx) =>
              idx === tpl.sparkline.length - 1 ? livePrice : livePrice * ratio
            )
          : tpl.sparkline;

      return {
        ...tpl,
        price: livePrice,
        change24h: Number(liveChange.toFixed(2)),
        volume24hUsd: liveVol,
        confluenceScore,
        supertrend,
        signalGrade,
        sparkline: scaledSparkline,
      };
    });
  }, [ssotTickers, selectedSymbol, evaluation]);

  const handleCreateCoinAlert = (coin: CryptoScreenerCoin) => {
    addAlert({
      category: 'SCREENER',
      title: `Penyaring Koin: ${coin.symbol} (${coin.signalGrade})`,
      subtitle: `RSI ${coin.rsi14} • Supertrend ${coin.supertrend} • Konfluensi ${coin.confluenceScore}/100`,
      message: `Alert koin terpasang: ${coin.name} (${coin.symbol}) berada pada harga $${formatCryptoPrice(coin.price)} dengan pergerakan 24H ${coin.change24h >= 0 ? '+' : ''}${coin.change24h}% dan status MACD ${coin.macdStatus}.`,
      symbol: coin.symbol,
      timestamp: isId ? 'Baru saja' : 'Just now',
      severity: 'WARNING',
      actionStage: 'screening',
      data: {
        screenerTrigger: coin.rsi14 < 45 ? 'RSI_OVERSOLD' : coin.confluenceScore > 90 ? 'HIGH_CONFLUENCE' : 'VOLUME_SURGE',
        price: coin.price,
        change24h: coin.change24h,
        rsi14: coin.rsi14,
        screenerMetricText: `Konfluensi ${coin.confluenceScore}/100 | RSI ${coin.rsi14}`,
      },
    });
    setAddedAlertCoin(coin.symbol);
    setTimeout(() => setAddedAlertCoin(null), 2500);
  };

  // Apply preset
  const handlePresetSelect = (presetId: string) => {
    setActivePreset(presetId);
    if (presetId === 'ALL') {
      setSelectedRsiRange('ALL');
      setSelectedSupertrend('ALL');
      setMinConfluence(70);
    } else if (presetId === 'MOMENTUM_BREAKOUT') {
      setSelectedSupertrend('BULLISH');
      setMinConfluence(80);
      setSortBy('change24h');
      setSortOrder('desc');
    } else if (presetId === 'OVERSOLD_REBOUND') {
      setSelectedRsiRange('OVERSOLD');
      setMinConfluence(70);
      setSortBy('rsi14');
      setSortOrder('asc');
    } else if (presetId === 'SHORT_SQUEEZE') {
      setSelectedRsiRange('ALL');
      setMinConfluence(80);
      setSortBy('change24h');
      setSortOrder('desc');
    } else if (presetId === 'AI_TOP_CONFLUENCE') {
      setMinConfluence(90);
      setSortBy('confluenceScore');
      setSortOrder('desc');
    }
  };

  // Filtered & Sorted Coins
  const filteredCoins = useMemo(() => {
    return liveScreenerCoins.filter((coin) => {
      if (search) {
        const q = search.toLowerCase();
        if (!coin.symbol.toLowerCase().includes(q) && !coin.name.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (selectedCategory !== 'ALL' && coin.category !== selectedCategory) return false;
      if (selectedMarketCapTier === 'LARGE' && coin.marketCapUsd < 10000000000) return false;
      if (selectedMarketCapTier === 'MID' && (coin.marketCapUsd < 1000000000 || coin.marketCapUsd > 10000000000)) return false;
      if (selectedMarketCapTier === 'SMALL' && coin.marketCapUsd > 1000000000) return false;

      if (selectedRsiRange === 'OVERSOLD' && coin.rsi14 >= 45) return false;
      if (selectedRsiRange === 'OVERBOUGHT' && coin.rsi14 <= 70) return false;
      if (selectedRsiRange === 'NORMAL' && (coin.rsi14 < 45 || coin.rsi14 > 70)) return false;

      if (selectedSupertrend !== 'ALL' && coin.supertrend !== selectedSupertrend) return false;
      if (coin.confluenceScore < minConfluence) return false;

      return true;
    }).sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
      }
      return 0;
    });
  }, [
    liveScreenerCoins,
    search,
    selectedCategory,
    selectedMarketCapTier,
    selectedRsiRange,
    selectedSupertrend,
    minConfluence,
    sortBy,
    sortOrder,
  ]);

  const handleSort = (column: keyof CryptoScreenerCoin) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const handleExportCsv = () => {
    const csvRows = [
      ['Symbol', 'Name', 'Category', 'Price', '24h Change %', '24h Vol USD', 'Market Cap USD', 'RSI 14', 'MACD', 'SuperTrend', 'Funding Rate %', 'Confluence Score'].join(','),
      ...filteredCoins.map((c) =>
        [c.symbol, c.name, c.category, c.price, `${c.change24h}%`, c.volume24hUsd, c.marketCapUsd, c.rsi14, c.macdStatus, c.supertrend, `${c.fundingRate8h}%`, c.confluenceScore].join(',')
      ),
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IMASBTC_Market_Screen_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloadNotification(true);
    setTimeout(() => setDownloadNotification(false), 3000);
  };

  const handleAddWatchlist = (coin: CryptoScreenerCoin) => {
    if (onAddToWatchlist) onAddToWatchlist(coin.symbol);
    setAddedWatchlistCoin(coin.symbol);
    setTimeout(() => setAddedWatchlistCoin(null), 2500);
  };

  return (
    <div className="space-y-4">
      {/* Top Screener Header */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 ${
          isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-pink-500/15 border border-pink-500/30 text-pink-400">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className={`font-mono font-bold text-lg sm:text-xl ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {isId ? 'Penyaring Pasar Kripto (Screening)' : 'Crypto Market Screener'}
            </h1>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              {isId
                ? 'Penyaring kuantitatif multi-faktor: RSI, SuperTrend, MACD, Volume Spikes, dan Funding Rate Arbitrage'
                : 'Institutional multi-factor scanner: RSI, SuperTrend, order flow funding rate squeeze & volume'}
            </p>
          </div>
        </div>

        {/* Export & Summary */}
        <div className="flex flex-wrap items-center gap-2">
          <DataStatusBadge scope="screener" lang={lang} compact />
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
            <span className="text-slate-400">Hasil: </span>
            <strong className="text-pink-400">{filteredCoins.length}</strong> Koin
          </div>

          <button
            onClick={() => openAlertCenter('SCREENER')}
            className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 hover:bg-amber-500/25 font-mono text-xs font-semibold transition cursor-pointer"
            title={isId ? 'Buka Pusat Alert Penyaring' : 'Open Screener Alerts'}
          >
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            <span>{isId ? 'Alert Screener' : 'Screener Alerts'}</span>
            {unreadCountByCategory.SCREENER > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-bold">
                {unreadCountByCategory.SCREENER}
              </span>
            )}
          </button>

          <button
            onClick={() => triggerSimulatedUpdate('SCREENER')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-mono text-xs transition cursor-pointer"
            title={isId ? 'Simulasi deteksi anomali screener baru' : 'Simulate screener anomaly'}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">{isId ? 'Scan Anomali' : 'Scan Anomaly'}</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-mono font-bold text-xs transition cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isId ? 'Unduh CSV' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {downloadNotification && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-300 font-mono text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Hasil screening pasar berhasil diekspor ke file CSV!</span>
        </div>
      )}

      {addedWatchlistCoin && (
        <div className="p-3 bg-amber-950/80 border border-amber-500/50 rounded-xl text-amber-300 font-mono text-xs flex items-center gap-2 animate-in fade-in">
          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span><strong>{addedWatchlistCoin}</strong> berhasil ditambahkan ke daftar Watchlist Anda!</span>
        </div>
      )}

      {addedAlertCoin && (
        <div className="p-3 bg-amber-950/80 border border-amber-500/50 rounded-xl text-amber-300 font-mono text-xs flex items-center gap-2 animate-in fade-in">
          <BellRing className="w-4 h-4 text-amber-400" />
          <span>Alert Penyaring berhasil diaktifkan untuk <strong>{addedAlertCoin}</strong>! Masuk ke Pusat Alert Terpadu.</span>
        </div>
      )}

      {/* Preset Strategy Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {PRESETS.map((p) => {
          const Icon = p.icon;
          const isActive = activePreset === p.id;
          return (
            <button
              key={p.id}
              onClick={() => handlePresetSelect(p.id)}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer font-mono ${
                isActive
                  ? 'bg-pink-500/15 border-pink-500 text-pink-300 shadow-md shadow-pink-500/10'
                  : 'bg-[#0f172a] border-[#1e293b] text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between pb-1">
                <span className="font-bold text-xs flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 text-pink-400" />
                  {p.name}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 line-clamp-1">{p.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Filter Matrix Controls */}
      <div
        className={`p-4 rounded-2xl border space-y-3 ${
          isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 font-mono text-xs">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari simbol atau koin..."
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-500 text-xs"
            />
          </div>

          {/* Category */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-cyan-500"
            >
              <option value="ALL">Semua Sektor / Kategori</option>
              <option value="Layer 1">Layer 1 (L1)</option>
              <option value="DeFi">DeFi</option>
              <option value="AI & Big Data">AI & Big Data</option>
              <option value="Meme">Meme Coins</option>
            </select>
          </div>

          {/* Market Cap Tier */}
          <div>
            <select
              value={selectedMarketCapTier}
              onChange={(e) => setSelectedMarketCapTier(e.target.value)}
              className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-cyan-500"
            >
              <option value="ALL">Semua Market Cap</option>
              <option value="LARGE">Large Cap (&gt; $10 Miliar)</option>
              <option value="MID">Mid Cap ($1B - $10B)</option>
              <option value="SMALL">Small Cap (&lt; $1B)</option>
            </select>
          </div>

          {/* RSI Range */}
          <div>
            <select
              value={selectedRsiRange}
              onChange={(e) => setSelectedRsiRange(e.target.value)}
              className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-cyan-500"
            >
              <option value="ALL">Semua Range RSI</option>
              <option value="OVERSOLD">Oversold (RSI &lt; 45)</option>
              <option value="NORMAL">Normal Zone (45 - 70)</option>
              <option value="OVERBOUGHT">Overbought (RSI &gt; 70)</option>
            </select>
          </div>

          {/* SuperTrend */}
          <div>
            <select
              value={selectedSupertrend}
              onChange={(e) => setSelectedSupertrend(e.target.value)}
              className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-cyan-500"
            >
              <option value="ALL">Semua Tren SuperTrend</option>
              <option value="BULLISH">SuperTrend Bullish (Hijau)</option>
              <option value="BEARISH">SuperTrend Bearish (Merah)</option>
            </select>
          </div>
        </div>

        {/* Bottom slider for score */}
        <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-800/80 font-mono text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Ambang Skor Konfluensi Minimum:</span>
            <span className="text-cyan-400 font-bold text-sm">{minConfluence}/100</span>
          </div>
          <input
            type="range"
            min={60}
            max={95}
            step={5}
            value={minConfluence}
            onChange={(e) => setMinConfluence(Number(e.target.value))}
            className="w-48 accent-cyan-400 cursor-pointer"
          />
        </div>
      </div>

      {/* Screener Results Table */}
      <div
        className={`p-4 rounded-2xl border ${
          isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3 cursor-pointer hover:text-white" onClick={() => handleSort('symbol')}>
                  <div className="flex items-center gap-1">
                    <span>Aset & Pasangan</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="pb-3 cursor-pointer hover:text-white" onClick={() => handleSort('price')}>
                  <div className="flex items-center gap-1">
                    <span>Harga Terkini</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="pb-3 cursor-pointer hover:text-white" onClick={() => handleSort('change24h')}>
                  <div className="flex items-center gap-1">
                    <span>24h Change</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="pb-3 cursor-pointer hover:text-white" onClick={() => handleSort('volume24hUsd')}>
                  <div className="flex items-center gap-1">
                    <span>Volume 24h</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="pb-3 cursor-pointer hover:text-white" onClick={() => handleSort('rsi14')}>
                  <div className="flex items-center gap-1">
                    <span>RSI (14)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="pb-3">SuperTrend & MACD</th>
                <th className="pb-3">Funding Rate</th>
                <th className="pb-3 cursor-pointer hover:text-white" onClick={() => handleSort('confluenceScore')}>
                  <div className="flex items-center gap-1">
                    <span>Konfluensi AI</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="pb-3">Trend 7D</th>
                <th className="pb-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredCoins.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    Tidak ada aset yang cocok dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredCoins.map((coin) => {
                  const isBullish = coin.change24h >= 0;
                  const isRsiHigh = coin.rsi14 >= 70;
                  const isRsiLow = coin.rsi14 <= 35;
                  const isSqueeze = coin.fundingRate8h < 0;

                  return (
                    <tr key={coin.symbol} className="hover:bg-slate-800/30 transition-colors">
                      {/* Asset & Name */}
                      <td className="py-3">
                        <div className="flex items-center gap-2.5">
                          <CoinLogo symbol={coin.symbol} size="sm" decorative />
                          <div>
                            <div className="font-bold text-white text-sm flex items-center gap-1.5">
                              <span>{coin.symbol}</span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                                {coin.category}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400">{coin.name}</div>
                          </div>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-3 text-white font-bold text-sm tabular-nums">
                        {coin.price > 0
                          ? `$${formatSmartCryptoPrice(coin.price)}`
                          : isId
                          ? 'Sinkron...'
                          : 'Syncing...'}
                      </td>

                      {/* 24h Change */}
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold text-[11px] inline-flex items-center gap-0.5 ${
                            isBullish
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {isBullish ? '+' : ''}{coin.change24h}%
                        </span>
                      </td>

                      {/* Volume 24h */}
                      <td className="py-3">
                        <div className="text-slate-200 font-bold">${(coin.volume24hUsd / 1e6).toFixed(1)}M</div>
                        <div className="text-[10px] text-slate-400">MCap: ${(coin.marketCapUsd / 1e9).toFixed(2)}B</div>
                      </td>

                      {/* RSI 14 */}
                      <td className="py-3">
                        <span
                          className={`font-bold ${
                            isRsiHigh
                              ? 'text-rose-400'
                              : isRsiLow
                              ? 'text-emerald-400'
                              : 'text-slate-300'
                          }`}
                        >
                          {coin.rsi14.toFixed(1)}
                        </span>
                        <div className="text-[9px] text-slate-400">
                          {isRsiHigh ? 'Overbought' : isRsiLow ? 'Oversold' : 'Neutral'}
                        </div>
                      </td>

                      {/* SuperTrend & MACD */}
                      <td className="py-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              coin.supertrend === 'BULLISH' ? 'bg-emerald-400' : 'bg-rose-400'
                            }`}
                          />
                          <span className="text-slate-200 text-[11px]">{coin.supertrend}</span>
                        </div>
                        <div className="text-[10px] text-cyan-400">{coin.macdStatus}</div>
                      </td>

                      {/* Funding Rate */}
                      <td className="py-3">
                        <div
                          className={`font-bold ${
                            isSqueeze ? 'text-amber-400' : 'text-slate-300'
                          }`}
                        >
                          {coin.fundingRate8h > 0 ? '+' : ''}{coin.fundingRate8h}%
                        </div>
                        {isSqueeze && (
                          <div className="text-[9px] text-amber-400 font-bold">⚡ Short Squeeze</div>
                        )}
                      </td>

                      {/* Confluence Score */}
                      <td className="py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-cyan-400 text-sm">{coin.confluenceScore}</span>
                          <span className="text-[10px] text-slate-400">/100</span>
                        </div>
                        <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                          <div
                            style={{ width: `${coin.confluenceScore}%` }}
                            className="bg-cyan-400 h-full rounded-full"
                          />
                        </div>
                      </td>

                      {/* Sparkline mini chart */}
                      <td className="py-3">
                        <svg className="w-20 h-6 overflow-visible" viewBox="0 0 100 30">
                          <polyline
                            fill="none"
                            stroke={isBullish ? '#34d399' : '#f87171'}
                            strokeWidth="2"
                            points={coin.sparkline
                              .map((val, idx) => {
                                const min = Math.min(...coin.sparkline);
                                const max = Math.max(...coin.sparkline);
                                const range = max - min || 1;
                                const x = (idx / (coin.sparkline.length - 1)) * 100;
                                const y = 30 - ((val - min) / range) * 26;
                                return `${x},${y}`;
                              })
                              .join(' ')}
                          />
                        </svg>
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleCreateCoinAlert(coin)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-400 transition cursor-pointer"
                            title={isId ? 'Pasang Alert untuk Koin Ini' : 'Set Alert for Coin'}
                          >
                            <Bell className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleAddWatchlist(coin)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 transition cursor-pointer"
                            title="Tambah ke Watchlist"
                          >
                            <Star className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              if (onSelectSymbol) onSelectSymbol(coin.symbol);
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 transition cursor-pointer"
                            title="Buka Analisis"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              if (onSelectSymbol) onSelectSymbol(coin.symbol);
                              if (onNavigateToTrade) onNavigateToTrade(coin.symbol);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[11px] transition cursor-pointer"
                          >
                            Trade
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
