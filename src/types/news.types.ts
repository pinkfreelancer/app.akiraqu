// News & Macroeconomic Sentiment Domain Contracts
export type NewsSourceType =
  | 'CRYPTOCOMPARE'
  | 'COINGECKO'
  | 'COINDESK'
  | 'THE_BLOCK'
  | 'TWITTER_X'
  | 'REDDIT'
  | 'FED_CENTRAL_BANK'
  | 'GLOBAL_MACRO_REUTERS';

export type NewsCategory =
  | 'ALL'
  | 'CRYPTO_NEWS'
  | 'SOCIAL_X_REDDIT'
  | 'MACRO_FED'
  | 'REGULATION'
  | 'WHALE_FLOW';

export type SentimentImpact = 'VERY_BULLISH' | 'BULLISH' | 'NEUTRAL' | 'BEARISH' | 'VERY_BEARISH';

export interface ComprehensiveNewsItem {
  id: string;
  sourceType: NewsSourceType;
  sourceName: string;
  category: NewsCategory;
  title: string;
  summary: string;
  url?: string;
  authorOrHandle?: string;
  publishedAt: string;
  timestamp: number;
  sentiment: SentimentImpact;
  sentimentScore: number; // -1.0 to +1.0
  impactLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  relevantSymbols: string[];
  keywords: string[];
  engagement?: {
    likes?: number;
    retweets?: number;
    upvotes?: number;
    commentsCount?: number;
  };
  macroMetadata?: {
    indicatorName?: string;
    actualValue?: string;
    forecastValue?: string;
    previousValue?: string;
    fedImpact?: string;
  };
  aiInsight: {
    analysis: string;
    actionableTakeaway: string;
    affectedTimeframes: string[];
    confluenceWeight: number; // e.g. +12 or -8
  };
}

export interface MacroeconomicIndicator {
  id: string;
  name: string;
  code: string;
  category: 'FED_RATES' | 'INFLATION' | 'LIQUIDITY' | 'GLOBAL_ASSET';
  currentValue: number | string;
  unit: string;
  change24hOrPeriod: number | string;
  isBullishForCrypto: boolean;
  correlationWithBtc: number; // -1.0 to 1.0
  impactSummary: string;
  lastUpdated: string;
}

export interface SocialSentimentBreakdown {
  twitterBullishPct: number;
  twitterBearishPct: number;
  twitterVolume24h: string;
  redditBullishPct: number;
  redditBearishPct: number;
  redditHotThreadsCount: number;
  topTrendingKeywords: { keyword: string; count: number; sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL' }[];
  whaleMentions24h: number;
}

export interface ComprehensiveSentimentMetrics {
  fearGreedIndex: number;
  fearGreedClassification: string;
  socialSentimentScore: number; // 0-100
  socialClassification: string;
  macroLiquidityScore: number; // 0-100
  macroClassification: string;
  btcDominancePct: number;
  btcDominanceChange24h: number;
  totalMarketCapUsd: number;
  totalMarketCapChange24h: number;
  stablecoinInflow24hUsd: number;
  aggregateOiChange24h: number;
  fedFundsRatePct: number;
  cpiInflationYoYPct: number;
  dxyIndex: number;
  us10yYieldPct: number;
  goldPriceUsd: number;
  nasdaqIndex: number;
  aiMarketConsensus: string;
  aiKeyRisks: string[];
  aiTailwinds: string[];
  socialBreakdown: SocialSentimentBreakdown;
  macroIndicators: MacroeconomicIndicator[];
}
