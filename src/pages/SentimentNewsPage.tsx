import React, { useState, useEffect, useMemo } from 'react';
import {
  ComprehensiveNewsItem,
  ComprehensiveSentimentMetrics,
  NewsCategory,
  NewsSourceType,
  SentimentImpact,
} from '../types/crypto.types';
import { fetchLiveComprehensiveNewsAndSentiment } from '../services/newsSentimentService';
import { Language, getTranslation } from '../i18n/translations';
import {
  Newspaper,
  Sparkles,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Flame,
  Globe,
  Search,
  Filter,
  Twitter,
  MessageSquare,
  Landmark,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  AlertTriangle,
  Zap,
  DollarSign,
  Activity,
  Layers,
  HelpCircle,
  Share2,
} from 'lucide-react';

interface SentimentNewsPageProps {
  onSelectCoin: (symbol: string) => void;
  lang?: Language;
  theme?: 'light' | 'dark';
}

export const SentimentNewsPage: React.FC<SentimentNewsPageProps> = ({
  onSelectCoin,
  lang = 'id',
  theme = 'dark',
}) => {
  const t = getTranslation(lang);
  const isDark = theme === 'dark';
  const isId = lang === 'id';

  const [metrics, setMetrics] = useState<ComprehensiveSentimentMetrics | null>(null);
  const [news, setNews] = useState<ComprehensiveNewsItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory>('ALL');
  const [selectedSentiment, setSelectedSentiment] = useState<'ALL' | SentimentImpact>('ALL');
  const [selectedSymbolFilter, setSelectedSymbolFilter] = useState<string>('ALL');
  const [savedNewsIds, setSavedNewsIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('nexus_saved_news_ids');
      return saved ? new Set(JSON.parse(saved)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });
  const [showSavedOnly, setShowSavedOnly] = useState<boolean>(false);
  const [autoRefreshSec, setAutoRefreshSec] = useState<number>(60);

  // Load news and sentiment data
  const loadData = async () => {
    setIsLoading(true);
    try {
      // First try backend API endpoint
      const res = await fetch('/api/v1/news-sentiment');
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setMetrics(json.data.metrics);
          setNews(json.data.news);
          setIsLoading(false);
          return;
        }
      }
      // Fallback to client-side service
      const clientRes = await fetchLiveComprehensiveNewsAndSentiment();
      setMetrics(clientRes.metrics);
      setNews(clientRes.news);
    } catch (err) {
      console.error('Failed to load comprehensive news & sentiment:', err);
      // Fallback to client service
      const clientRes = await fetchLiveComprehensiveNewsAndSentiment();
      setMetrics(clientRes.metrics);
      setNews(clientRes.news);
    } finally {
      setIsLoading(false);
      setAutoRefreshSec(60);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Auto-refresh countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setAutoRefreshSec((prev) => {
        if (prev <= 1) {
          loadData();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Toggle bookmark / saved news
  const toggleSaveNews = (id: string) => {
    setSavedNewsIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      try {
        localStorage.setItem('nexus_saved_news_ids', JSON.stringify(Array.from(next)));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  // Filtered news items
  const filteredNews = useMemo(() => {
    return news.filter((item) => {
      // Saved filter
      if (showSavedOnly && !savedNewsIds.has(item.id)) return false;

      // Category filter
      if (selectedCategory !== 'ALL') {
        if (selectedCategory === 'CRYPTO_NEWS') {
          if (!['CRYPTOCOMPARE', 'COINGECKO', 'COINDESK', 'THE_BLOCK'].includes(item.sourceType)) return false;
        } else if (selectedCategory === 'SOCIAL_X_REDDIT') {
          if (!['TWITTER_X', 'REDDIT'].includes(item.sourceType)) return false;
        } else if (selectedCategory === 'MACRO_FED') {
          if (!['FED_CENTRAL_BANK', 'GLOBAL_MACRO_REUTERS'].includes(item.sourceType)) return false;
        } else if (item.category !== selectedCategory) {
          return false;
        }
      }

      // Sentiment filter
      if (selectedSentiment !== 'ALL' && item.sentiment !== selectedSentiment) {
        return false;
      }

      // Coin filter
      if (selectedSymbolFilter !== 'ALL') {
        const hasSymbol = item.relevantSymbols.some((s) => s.includes(selectedSymbolFilter));
        if (!hasSymbol) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchSummary = item.summary.toLowerCase().includes(q);
        const matchSource = item.sourceName.toLowerCase().includes(q);
        const matchKeywords = item.keywords.some((k) => k.toLowerCase().includes(q));
        const matchSymbols = item.relevantSymbols.some((s) => s.toLowerCase().includes(q));
        if (!matchTitle && !matchSummary && !matchSource && !matchKeywords && !matchSymbols) {
          return false;
        }
      }

      return true;
    });
  }, [news, selectedCategory, selectedSentiment, selectedSymbolFilter, searchQuery, showSavedOnly, savedNewsIds]);

  // Source icon helper
  const getSourceIcon = (type: NewsSourceType) => {
    switch (type) {
      case 'TWITTER_X':
        return <Twitter className="w-4 h-4 text-sky-400" />;
      case 'REDDIT':
        return <MessageSquare className="w-4 h-4 text-orange-400" />;
      case 'FED_CENTRAL_BANK':
        return <Landmark className="w-4 h-4 text-amber-400" />;
      case 'GLOBAL_MACRO_REUTERS':
        return <Globe className="w-4 h-4 text-emerald-400" />;
      case 'COINDESK':
      case 'THE_BLOCK':
        return <Newspaper className="w-4 h-4 text-cyan-400" />;
      default:
        return <Activity className="w-4 h-4 text-blue-400" />;
    }
  };

  // Sentiment badge style
  const getSentimentBadge = (sentiment: SentimentImpact) => {
    switch (sentiment) {
      case 'VERY_BULLISH':
        return isDark
          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 shadow-xs'
          : 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'BULLISH':
        return isDark
          ? 'bg-teal-950/70 text-teal-300 border-teal-500/40'
          : 'bg-teal-100 text-teal-800 border-teal-300';
      case 'BEARISH':
        return isDark
          ? 'bg-rose-950/70 text-rose-300 border-rose-500/40'
          : 'bg-rose-100 text-rose-800 border-rose-300';
      case 'VERY_BEARISH':
        return isDark
          ? 'bg-red-950/90 text-red-300 border-red-500/60 shadow-xs'
          : 'bg-red-100 text-red-800 border-red-400';
      default:
        return isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-200 text-slate-700 border-slate-300';
    }
  };

  return (
    <div id="page-sentiment-news" className="space-y-6">
      {/* Top Header & Overview Banner */}
      <div
        className={`p-5 sm:p-6 rounded-2xl border transition-all ${
          isDark
            ? 'bg-gradient-to-r from-[#0b1329] via-[#0f172a] to-[#0d1b2a] border-[#1e293b]'
            : 'bg-gradient-to-r from-blue-50 via-white to-cyan-50 border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Newspaper className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold font-mono tracking-tight flex items-center gap-2">
                  <span className={isDark ? 'text-white' : 'text-slate-900'}>
                    {isId ? 'Berita & Sentimen Pasar Multi-Sumber' : 'Multi-Source Market Sentiment & News'}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold hidden sm:inline">
                    Real-Time Feed
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 font-sans mt-0.5">
                  {isId
                    ? 'Agregator otomatis: CryptoCompare, CoinGecko, CoinDesk, The Block, Twitter/X V2, Reddit & The Fed Macro.'
                    : 'Automated aggregator: CryptoCompare, CoinGecko, CoinDesk, The Block, Twitter/X V2, Reddit & Fed Macro.'}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Refresh & Auto-Sync Status */}
          <div className="flex items-center gap-2.5 self-stretch sm:self-auto justify-between sm:justify-end">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono ${
                isDark ? 'bg-[#070b14] border-[#1e293b] text-slate-300' : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>
              <span>Auto-refresh: {autoRefreshSec}s</span>
            </div>

            <button
              onClick={loadData}
              disabled={isLoading}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-mono text-xs font-semibold transition-all cursor-pointer shadow-xs min-h-[36px] ${
                isDark
                  ? 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                  : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border-cyan-300'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
              <span>{isLoading ? (isId ? 'Memuat...' : 'Syncing...') : (isId ? 'Segarkan' : 'Refresh')}</span>
            </button>
          </div>
        </div>

        {/* Macro Sentiment Overview Gauges */}
        {metrics && (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-5">
            {/* 1. Fear & Greed */}
            <div
              className={`p-3.5 rounded-xl border ${
                isDark ? 'bg-[#070b14]/80 border-[#1e293b]' : 'bg-white/90 border-slate-200 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1 font-mono">
                <span>Fear & Greed Index</span>
                <Flame className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-amber-400">{metrics.fearGreedIndex}/100</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-500/20">
                  {metrics.fearGreedClassification}
                </span>
              </div>
            </div>

            {/* 2. Twitter & Reddit Social Alpha Score */}
            <div
              className={`p-3.5 rounded-xl border ${
                isDark ? 'bg-[#070b14]/80 border-[#1e293b]' : 'bg-white/90 border-slate-200 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1 font-mono">
                <span>Social Sentiment (X/Reddit)</span>
                <Twitter className="w-4 h-4 text-sky-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-sky-400">{metrics.socialSentimentScore}%</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-sky-950/60 text-sky-300 border border-sky-500/20">
                  {metrics.socialBreakdown.twitterBullishPct}% Bullish
                </span>
              </div>
            </div>

            {/* 3. Macro Liquidity & Fed Rate Score */}
            <div
              className={`p-3.5 rounded-xl border ${
                isDark ? 'bg-[#070b14]/80 border-[#1e293b]' : 'bg-white/90 border-slate-200 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1 font-mono">
                <span>The Fed Macro Tailwinds</span>
                <Landmark className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-emerald-400">{metrics.macroLiquidityScore}/100</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/20">
                  Dovish Bias
                </span>
              </div>
            </div>

            {/* 4. Stablecoin Net Inflow 24h */}
            <div
              className={`p-3.5 rounded-xl border ${
                isDark ? 'bg-[#070b14]/80 border-[#1e293b]' : 'bg-white/90 border-slate-200 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1 font-mono">
                <span>Stablecoin 24h Inflow</span>
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-cyan-400">
                  +${(metrics.stablecoinInflow24hUsd / 1e9).toFixed(2)}B
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/20">
                  Spot Fuel
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI Market Consensus & Macro Impact Synthesis */}
      {metrics && (
        <div
          className={`p-5 rounded-2xl border transition-all ${
            isDark
              ? 'bg-gradient-to-r from-cyan-950/30 via-[#0f172a] to-blue-950/30 border-cyan-500/30'
              : 'bg-cyan-50/70 border-cyan-200 shadow-xs'
          }`}
        >
          <div className="flex items-center gap-2 mb-2.5">
            <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
            <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-cyan-400">
              {isId ? 'Sintesis AI: Konsensus Pasar & Arah Likuiditas Makro' : 'AI Market Consensus & Macro Liquidity Synthesis'}
            </h3>
          </div>
          <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
            {metrics.aiMarketConsensus}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-700/30">
            {/* Tailwinds */}
            <div className={`p-3 rounded-xl border ${isDark ? 'bg-emerald-950/20 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'}`}>
              <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5 mb-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                {isId ? 'Katalis Positif Utama (Tailwinds)' : 'Key Positive Tailwinds'}
              </span>
              <ul className="space-y-1">
                {metrics.aiTailwinds.map((t, idx) => (
                  <li key={idx} className="text-xs text-slate-300 flex items-start gap-1.5">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Key Risks */}
            <div className={`p-3 rounded-xl border ${isDark ? 'bg-amber-950/20 border-amber-500/20' : 'bg-amber-50 border-amber-200'}`}>
              <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5 mb-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                {isId ? 'Faktor Risiko & Waspada (Key Risks)' : 'Key Risk Factors'}
              </span>
              <ul className="space-y-1">
                {metrics.aiKeyRisks.map((r, idx) => (
                  <li key={idx} className="text-xs text-slate-300 flex items-start gap-1.5">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Macroeconomic Indicators Matrix (Federal Reserve, CPI, DXY, US10Y, Gold, Nasdaq) */}
      {metrics && metrics.macroIndicators && (
        <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Landmark className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold font-mono text-white">
                {isId ? 'Pemicu Makroekonomi & Korelasi Pasar Global' : 'Macroeconomic Drivers & Global Correlations'}
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">
              {isId ? 'Sumber: The Fed, BLS, Reuters & Bloomberg Financial' : 'Sources: The Fed, BLS, Reuters & Bloomberg'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {metrics.macroIndicators.map((macro) => (
              <div
                key={macro.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  isDark ? 'bg-[#070b14] border-[#1e293b] hover:border-cyan-500/30' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono font-bold text-slate-300">{macro.name}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                      macro.isBullishForCrypto
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-950 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {macro.isBullishForCrypto ? 'Bullish Kripto' : 'Bearish Kripto'}
                  </span>
                </div>

                <div className="flex items-baseline gap-2 font-mono my-1.5">
                  <span className="text-xl font-bold text-white">{macro.currentValue}</span>
                  <span className={`text-xs ${macro.isBullishForCrypto ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {macro.change24hOrPeriod}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800">
                  <span>Korelasi BTC:</span>
                  <span
                    className={`font-bold ${
                      macro.correlationWithBtc > 0 ? 'text-cyan-400' : 'text-amber-400'
                    }`}
                  >
                    {macro.correlationWithBtc > 0 ? `+${macro.correlationWithBtc}` : `${macro.correlationWithBtc}`}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 mt-1.5 leading-snug line-clamp-2">
                  {macro.impactSummary}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Social Alpha Tracker (Twitter/X & Reddit Trends) */}
      {metrics && metrics.socialBreakdown && (
        <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'}`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <Twitter className="w-5 h-5 text-sky-400" />
              <h3 className="text-base font-bold font-mono text-white">
                {isId ? 'Radar Sentimen Sosial Twitter/X & Reddit' : 'Twitter/X & Reddit Social Sentiment Radar'}
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span>{metrics.socialBreakdown.twitterVolume24h}</span>
              <span>•</span>
              <span>{metrics.socialBreakdown.redditHotThreadsCount} Thread Aktif</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono text-slate-400 uppercase font-bold mr-1">Trending Keywords:</span>
            {metrics.socialBreakdown.topTrendingKeywords.map((item, idx) => (
              <button
                key={idx}
                onClick={() => setSearchQuery(item.keyword)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono border transition-all cursor-pointer ${
                  isDark
                    ? 'bg-[#070b14] hover:bg-slate-800 border-[#1e293b] text-slate-300'
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                }`}
              >
                <span className="font-bold text-cyan-400">#{item.keyword}</span>
                <span className="text-[10px] text-slate-400">({(item.count / 1000).toFixed(1)}k)</span>
                {item.sentiment === 'BULLISH' ? (
                  <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                ) : (
                  <ArrowDownRight className="w-3 h-3 text-rose-400" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Filter & Search Navigation Bar */}
      <div className={`p-4 rounded-2xl border space-y-3 ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'}`}>
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 lg:pb-0">
            {[
              { id: 'ALL', label: isId ? 'Semua Berita' : 'All Sources', icon: Newspaper },
              { id: 'CRYPTO_NEWS', label: isId ? 'Media Kripto (CoinDesk/The Block)' : 'Crypto Media', icon: Activity },
              { id: 'SOCIAL_X_REDDIT', label: isId ? 'Sosial (Twitter/X & Reddit)' : 'Social (X & Reddit)', icon: Twitter },
              { id: 'MACRO_FED', label: isId ? 'The Fed & Makro' : 'Fed & Macro', icon: Landmark },
              { id: 'REGULATION', label: isId ? 'Regulasi' : 'Regulation', icon: ShieldCheck },
              { id: 'WHALE_FLOW', label: isId ? 'Whale Alert' : 'Whale Alerts', icon: Flame },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id as NewsCategory)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shrink-0 border ${
                    isActive
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-xs'
                      : isDark
                      ? 'bg-[#070b14] text-slate-400 border-[#1e293b] hover:text-slate-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:text-slate-950'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Bookmarks Toggle Button */}
          <button
            onClick={() => setShowSavedOnly((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shrink-0 border ${
              showSavedOnly
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs'
                : isDark
                ? 'bg-[#070b14] text-slate-300 border-[#1e293b] hover:border-amber-500/40'
                : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>{isId ? 'Tersimpan' : 'Saved'}</span>
            <span className="text-[10px] opacity-80">({savedNewsIds.size})</span>
          </button>
        </div>

        {/* Secondary Filters: Coin Filter, Sentiment Filter, Search Input */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-700/30">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {/* Coin selector */}
            <select
              value={selectedSymbolFilter}
              onChange={(e) => setSelectedSymbolFilter(e.target.value)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-mono border focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer ${
                isDark ? 'bg-[#070b14] border-[#1e293b] text-slate-200' : 'bg-white border-slate-300 text-slate-800'
              }`}
            >
              <option value="ALL">{isId ? 'Semua Koin' : 'All Coins'}</option>
              <option value="BTC">BTC (Bitcoin)</option>
              <option value="ETH">ETH (Ethereum)</option>
              <option value="SOL">SOL (Solana)</option>
              <option value="DOGE">DOGE / PEPE (Memes)</option>
              <option value="XRP">XRP / ADA</option>
            </select>

            {/* Sentiment rating filter */}
            <div className="flex items-center gap-1">
              {(['ALL', 'VERY_BULLISH', 'BULLISH', 'NEUTRAL', 'BEARISH'] as const).map((sent) => (
                <button
                  key={sent}
                  onClick={() => setSelectedSentiment(sent)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-mono font-semibold transition-colors cursor-pointer ${
                    selectedSentiment === sent
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : isDark
                      ? 'bg-[#070b14] text-slate-400 hover:text-white border border-[#1e293b]'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {sent === 'ALL' ? 'Semua' : sent.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Search box */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isId ? 'Cari berita, keyword, akun...' : 'Search news, tweets, keyword...'}
              className={`w-full pl-8 pr-3 py-1.5 rounded-xl text-xs font-mono border focus:outline-none focus:ring-1 focus:ring-cyan-400 ${
                isDark ? 'bg-[#070b14] border-[#1e293b] text-slate-200' : 'bg-white border-slate-300 text-slate-800'
              }`}
            />
          </div>
        </div>
      </div>

      {/* News Feed Stream */}
      <div className="space-y-4">
        {filteredNews.length === 0 ? (
          <div
            className={`p-12 text-center rounded-2xl border ${
              isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200'
            }`}
          >
            <Newspaper className="w-10 h-10 text-slate-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-300">
              {isId ? 'Tidak ada berita yang cocok dengan filter.' : 'No news found matching your active filters.'}
            </p>
            <button
              onClick={() => {
                setSelectedCategory('ALL');
                setSelectedSentiment('ALL');
                setSelectedSymbolFilter('ALL');
                setSearchQuery('');
                setShowSavedOnly(false);
              }}
              className="mt-3 px-3 py-1.5 rounded-xl bg-cyan-500 text-slate-950 text-xs font-mono font-bold cursor-pointer"
            >
              {isId ? 'Reset Semua Filter' : 'Reset All Filters'}
            </button>
          </div>
        ) : (
          filteredNews.map((item) => {
            const isSaved = savedNewsIds.has(item.id);
            return (
              <div
                key={item.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isDark
                    ? 'bg-[#0f172a] border-[#1e293b] hover:border-cyan-500/40'
                    : 'bg-white border-slate-200 hover:border-cyan-400 shadow-xs'
                }`}
              >
                {/* Header: Source, Author, Sentiment Pill, Impact Badge, Bookmark */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${
                        isDark ? 'bg-[#070b14] border-[#1e293b] text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-800'
                      }`}
                    >
                      {getSourceIcon(item.sourceType)}
                      <span>{item.sourceName}</span>
                    </div>

                    {item.authorOrHandle && (
                      <span className="text-xs font-mono text-cyan-400">
                        {item.authorOrHandle}
                      </span>
                    )}

                    <span className="text-xs font-mono text-slate-400">
                      • {item.publishedAt}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Sentiment Score Pill */}
                    <span
                      className={`text-[11px] px-2.5 py-0.5 rounded-md font-mono font-bold border ${getSentimentBadge(
                        item.sentiment
                      )}`}
                    >
                      {item.sentiment.replace('_', ' ')} (
                      {item.sentimentScore > 0 ? `+${item.sentimentScore.toFixed(2)}` : item.sentimentScore.toFixed(2)})
                    </span>

                    {/* Impact Level */}
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase ${
                        item.impactLevel === 'CRITICAL'
                          ? 'bg-rose-500 text-slate-950 animate-pulse'
                          : item.impactLevel === 'HIGH'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {item.impactLevel} IMPACT
                    </span>

                    {/* Bookmark Action */}
                    <button
                      onClick={() => toggleSaveNews(item.id)}
                      className={`p-1 rounded-lg border transition-colors cursor-pointer ${
                        isSaved
                          ? 'bg-amber-500/20 border-amber-400 text-amber-400'
                          : isDark
                          ? 'bg-[#070b14] border-[#1e293b] text-slate-400 hover:text-white'
                          : 'bg-slate-100 border-slate-200 text-slate-600'
                      }`}
                      title={isSaved ? 'Hapus dari tersimpan' : 'Simpan berita ini'}
                    >
                      {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* News Title */}
                <h4 className={`text-base font-bold mb-1.5 leading-snug ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {item.title}
                </h4>

                {/* News Summary */}
                <p className={`text-xs sm:text-sm leading-relaxed mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {item.summary}
                </p>

                {/* Macro Metadata if applicable */}
                {item.macroMetadata && (
                  <div
                    className={`p-2.5 rounded-xl border mb-3 flex flex-wrap items-center gap-4 text-xs font-mono ${
                      isDark ? 'bg-[#070b14] border-[#1e293b]' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span className="text-amber-400 font-bold">🏛️ {item.macroMetadata.indicatorName}:</span>
                    <span>Nilai Riil: <strong className="text-white">{item.macroMetadata.actualValue}</strong></span>
                    {item.macroMetadata.forecastValue && (
                      <span>Proyeksi: <strong className="text-slate-300">{item.macroMetadata.forecastValue}</strong></span>
                    )}
                    {item.macroMetadata.fedImpact && (
                      <span className="text-emerald-400 font-bold">Respon: {item.macroMetadata.fedImpact}</span>
                    )}
                  </div>
                )}

                {/* AI Impact Synthesis & Actionable Takeaway */}
                {item.aiInsight && (
                  <div
                    className={`p-3 rounded-xl border mb-3 ${
                      isDark ? 'bg-[#070b14]/90 border-cyan-500/20' : 'bg-cyan-50/60 border-cyan-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-400 mb-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isId ? 'Analisis Sentimen Kuantitatif AI' : 'AI Quantitative Sentiment Synthesis'}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-normal">
                        Bobot Konfluensi: {item.aiInsight.confluenceWeight > 0 ? `+${item.aiInsight.confluenceWeight}%` : `${item.aiInsight.confluenceWeight}%`}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed mb-1.5">
                      {item.aiInsight.analysis}
                    </p>

                    <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400">
                      <Zap className="w-3.5 h-3.5 shrink-0" />
                      <span><strong>Rekomendasi Aksi:</strong> {item.aiInsight.actionableTakeaway}</span>
                    </div>
                  </div>
                )}

                {/* Footer: Relevant Coins, Keywords & Direct Chart Action */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-800/60">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-mono text-slate-400 font-bold">Koin Terkait:</span>
                    {item.relevantSymbols.map((sym) => (
                      <button
                        key={sym}
                        onClick={() => onSelectCoin(sym)}
                        className="px-2 py-0.5 rounded bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold transition cursor-pointer flex items-center gap-1"
                      >
                        <span>{sym}</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    ))}

                    {item.keywords && item.keywords.length > 0 && (
                      <div className="flex items-center gap-1 ml-2 flex-wrap">
                        {item.keywords.map((k, i) => (
                          <span key={i} className="text-[10px] font-mono text-slate-400 bg-slate-800/60 px-1.5 py-0.5 rounded">
                            #{k}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* External URL link if present */}
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      <span>{isId ? 'Buka Sumber Asli' : 'View Source'}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
