import React, { useState, useEffect } from 'react';
import {
  Layers,
  Flame,
  ArrowDownRight,
  ArrowUpRight,
  ShieldCheck,
  AlertOctagon,
  Eye,
  EyeOff,
  Sparkles,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Activity,
  Globe,
  DollarSign,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { ConfluenceEvaluation, OHLCVCandle, SupportedExchange, Timeframe } from '../types/crypto.types';
import { Language } from '../i18n/translations';
import { formatCryptoPrice } from '../utils/formatters';
import { LiquidationHeatmapCard } from './LiquidationHeatmapCard';
import { AkiraAvatar } from './AkiraAvatar';

interface WhalesIntelligenceWorkspaceProps {
  symbol: string;
  timeframe: Timeframe;
  exchange?: SupportedExchange;
  livePrice?: number;
  priceDirection?: 'up' | 'down' | 'neutral';
  wsStatus?: 'connected' | 'connecting' | 'fallback';
  candles: OHLCVCandle[];
  evaluation?: ConfluenceEvaluation | null;
  privacyBlurActive?: boolean;
  onTogglePrivacyBlur?: () => void;
  onSelectSymbol?: (symbol: string) => void;
  onSelectTimeframe?: (tf: Timeframe) => void;
  onTriggerAnalyze?: () => void;
  isLoading?: boolean;
  onOpenAkira: () => void;
  lang?: Language;
  theme?: string;
}

interface WhaleTransaction {
  id: string;
  txHash: string;
  amount: number;
  asset: string;
  usdValue: number;
  from: string;
  to: string;
  type: 'INFLOW' | 'OUTFLOW' | 'TRANSFER';
  timestamp: string;
}

export const WhalesIntelligenceWorkspace: React.FC<WhalesIntelligenceWorkspaceProps> = ({
  symbol,
  timeframe,
  exchange = 'Binance',
  livePrice = 0,
  candles,
  evaluation,
  privacyBlurActive = false,
  onTogglePrivacyBlur = () => {},
  onOpenAkira,
  lang = 'id',
  theme = 'dark',
}) => {
  const isId = lang === 'id';
  const isDark = theme !== 'modern-pink-light' && theme !== 'theme-light' && theme !== 'light';
  const currentPrice = livePrice || (candles.length > 0 ? candles[candles.length - 1].close : 65000);

  // Live Simulated Whale Transactions Stream
  const [whaleTxs, setWhaleTxs] = useState<WhaleTransaction[]>([
    {
      id: 'tx-1',
      txHash: '0x3f8a...4b19',
      amount: 1450,
      asset: symbol.split('/')[0] || 'BTC',
      usdValue: 94250000,
      from: 'Unknown Whale 0x71a...99',
      to: 'Binance Cold Storage',
      type: 'OUTFLOW',
      timestamp: '2m ago',
    },
    {
      id: 'tx-2',
      txHash: '0x9c21...8e44',
      amount: 820,
      asset: symbol.split('/')[0] || 'BTC',
      usdValue: 53300000,
      from: 'Coinbase Prime Custody',
      to: 'Institutional Vault 0x48...bb',
      type: 'OUTFLOW',
      timestamp: '7m ago',
    },
    {
      id: 'tx-3',
      txHash: '0x11ab...67fa',
      amount: 25000000,
      asset: 'USDT',
      usdValue: 25000000,
      from: 'Tether Treasury',
      to: 'OKX Spot Hot Wallet',
      type: 'INFLOW',
      timestamp: '14m ago',
    },
    {
      id: 'tx-4',
      txHash: '0x7e44...00c1',
      amount: 600,
      asset: symbol.split('/')[0] || 'BTC',
      usdValue: 39000000,
      from: 'Bybit Institutional',
      to: 'Cold Storage Vault',
      type: 'OUTFLOW',
      timestamp: '22m ago',
    },
    {
      id: 'tx-5',
      txHash: '0xbb29...91fa',
      amount: 15000000,
      asset: 'USDC',
      usdValue: 15000000,
      from: 'Circle Treasury',
      to: 'Binance Liquidity Pool',
      type: 'INFLOW',
      timestamp: '35m ago',
    },
  ]);

  // Macro Metrics
  const fearGreedIndex = 68; // Greed
  const btcDominance = 56.8;
  const netflow24h = -142800000; // -$142.8M Net Outflow (Bullish Accumulation)
  const isNetflowBullish = netflow24h < 0;

  return (
    <div className="w-full space-y-5 animate-in fade-in duration-300">
      {/* 1. Whales Executive Control Header */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
          isDark
            ? 'bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0B0F19] border-[#334155]'
            : 'bg-gradient-to-r from-pink-50/70 via-white to-slate-50 border-slate-200'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-2xl bg-pink-500/15 border border-pink-500/30 text-pink-400">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold">
                {isId ? 'Intelijen Makro & Paus Kripto (Whales Intelligence)' : 'Whales Intelligence & Macro Radar'}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30">
                ON-CHAIN TELEMETRY
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {isId
                ? 'Pantau pergerakan modal institusional > $1.000.000, likuidasi leverage tinggi, dan sentimen global.'
                : 'Track institutional capital movements > $1M, high-leverage cascades, and macro order flow.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Privacy Blur Toggle Button */}
          <button
            onClick={onTogglePrivacyBlur}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
              privacyBlurActive
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : isDark
                ? 'bg-[#1E293B] border-[#334155] text-slate-300 hover:text-white'
                : 'bg-white border-slate-200 text-slate-700'
            }`}
          >
            {privacyBlurActive ? <EyeOff className="w-4 h-4 text-amber-400" /> : <Eye className="w-4 h-4" />}
            <span>{privacyBlurActive ? 'PRIVACY ON' : 'PRIVACY OFF'}</span>
          </button>

          <button
            onClick={onOpenAkira}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold bg-pink-500 hover:bg-pink-600 text-white shadow-xs transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isId ? 'Akira Whale Insights' : 'Akira Whale Radar'}</span>
          </button>
        </div>
      </div>

      {/* 2. Global Macro & Netflow Key Barometer Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 24h Exchange Netflow */}
        <div
          className={`p-4 rounded-2xl border flex flex-col justify-between ${
            isDark ? 'bg-[#1E293B]/80 border-[#334155]' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-mono font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {isId ? 'Netflow Bursa 24 Jam' : '24h Exchange Netflow'}
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              {isId ? 'AKUMULASI' : 'ACCUMULATION'}
            </span>
          </div>

          <div className="my-2.5">
            <div className={`text-xl font-extrabold font-mono text-emerald-400 ${privacyBlurActive ? 'privacy-blur' : ''}`}>
              -$142.8M USD
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              {isId ? 'Net Penarikan ke Dompet Dingin' : 'Net Outflows to Cold Storage'}
            </div>
          </div>

          <div className="text-[10px] text-slate-400 flex items-center gap-1 border-t pt-2 border-slate-700/40">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isId ? 'Tekanan jual bursa berkurang' : 'Exchange sell pressure reduced'}</span>
          </div>
        </div>

        {/* Fear & Greed Index */}
        <div
          className={`p-4 rounded-2xl border flex flex-col justify-between ${
            isDark ? 'bg-[#1E293B]/80 border-[#334155]' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-mono font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Fear & Greed Index
            </span>
            <Globe className="w-4 h-4 text-pink-400" />
          </div>

          <div className="my-2.5">
            <div className="text-xl font-extrabold font-mono text-pink-400">
              {fearGreedIndex}/100 • {isId ? 'Keserakahan (Greed)' : 'Greed'}
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              {isId ? 'Sentimen Pasar: Ekspansif' : 'Market Sentiment: Expansionary'}
            </div>
          </div>

          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-pink-500 h-full rounded-full" style={{ width: `${fearGreedIndex}%` }} />
          </div>
        </div>

        {/* BTC Dominance */}
        <div
          className={`p-4 rounded-2xl border flex flex-col justify-between ${
            isDark ? 'bg-[#1E293B]/80 border-[#334155]' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-mono font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              BTC Dominance (BTC.D)
            </span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>

          <div className="my-2.5">
            <div className="text-xl font-extrabold font-mono text-cyan-400">
              {btcDominance}%
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              {isId ? 'Rotasi Likuiditas Institusi' : 'Institutional Capital Siphon'}
            </div>
          </div>

          <div className="text-[10px] text-slate-400 border-t pt-2 border-slate-700/40">
            {isId ? 'Bitcoin memimpin tren likuiditas' : 'Bitcoin leading macro volume'}
          </div>
        </div>

        {/* Whale Squeeze Risk Rating */}
        <div
          className={`p-4 rounded-2xl border flex flex-col justify-between ${
            isDark ? 'bg-[#1E293B]/80 border-[#334155]' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-mono font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {isId ? 'Potensi Squeeze Likuidasi' : 'Liquidation Squeeze Index'}
            </span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>

          <div className="my-2.5">
            <div className="text-xl font-extrabold font-mono text-amber-400">
              TINGGI (78%)
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              Short Squeeze Zone: ${formatCryptoPrice(currentPrice * 1.025)}
            </div>
          </div>

          <div className="text-[10px] text-amber-400/90 border-t pt-2 border-slate-700/40">
            {isId ? 'Waspada wick sapuan likuiditas' : 'Caution on short-term liquidity sweeps'}
          </div>
        </div>
      </div>

      {/* 3. Whale Wallet Transactions Feed ($1M+) & Liquidation Map Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Whale Wallet Tracking Stream */}
        <div
          className={`p-5 rounded-2xl border flex flex-col justify-between ${
            isDark ? 'bg-[#1E293B]/90 border-[#334155]' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-700/40">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-pink-400" />
              <h3 className="text-sm font-bold font-mono">
                {isId ? 'Aliran Transaksi Paus (> $1.000.000 USD)' : 'Whale Transaction Stream (> $1M USD)'}
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Radar
            </span>
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-[360px] scrollbar-thin pr-1">
            {whaleTxs.map((tx) => (
              <div
                key={tx.id}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs font-mono transition-colors ${
                  isDark
                    ? 'bg-[#0B0F19] border-[#223149] hover:border-pink-500/40'
                    : 'bg-slate-50 border-slate-200 hover:border-pink-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`p-1.5 rounded-lg font-bold text-[10px] ${
                      tx.type === 'OUTFLOW'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {tx.type === 'OUTFLOW' ? 'OUTFLOW' : 'INFLOW'}
                  </div>

                  <div>
                    <div className="font-bold flex items-center gap-1.5">
                      <span className="text-pink-400">{tx.amount.toLocaleString()} {tx.asset}</span>
                      <span className={`text-slate-400 text-[11px] ${privacyBlurActive ? 'privacy-blur' : ''}`}>
                        (${ (tx.usdValue / 1000000).toFixed(1) }M USD)
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate max-w-[200px]">
                      {tx.from} ➔ {tx.to}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">{tx.timestamp}</span>
                  <span className="text-[10px] text-pink-400/80 hover:underline cursor-pointer">
                    {tx.txHash}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-700/40 text-[11px] font-mono text-slate-400 flex items-center justify-between">
            <span>{isId ? 'Sumber: On-Chain Mempool & Node WebSocket' : 'Source: On-Chain Mempool & Node Feed'}</span>
            <span className="text-pink-400 font-bold">{whaleTxs.length} Transaksi Terdeteksi</span>
          </div>
        </div>

        {/* Dedicated High-Leverage Liquidation Heatmap */}
        <div>
          <LiquidationHeatmapCard
            candles={candles}
            symbol={symbol}
            timeframe={timeframe}
            currentPrice={currentPrice}
            lang={lang}
            theme={isDark ? 'dark' : 'light'}
          />
        </div>
      </div>
    </div>
  );
};
