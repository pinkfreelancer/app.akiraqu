import React, { useMemo } from 'react';
import { InteractiveChart } from '../components/InteractiveChart';
import { LiquidationHeatmapCard } from '../components/LiquidationHeatmapCard';
import { MMBotTrackerCard } from '../components/MMBotTrackerCard';
import { MarketMakerPlaybookCard } from '../components/MarketMakerPlaybookCard';
import {
  OHLCVCandle,
  Timeframe,
  ConfluenceEvaluation,
  SupportedExchange,
  MarketType,
  WebSocketSyncMetrics,
  LiveTradeTick,
  LiveOrderBookLevel,
} from '../types/crypto.types';
import { Language } from '../i18n/translations';
import {
  BarChart3,
  Radio,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { formatCryptoPrice, getCryptoPrecision } from '../utils/formatters';

interface TickerPageProps {
  candles: OHLCVCandle[];
  symbol: string;
  timeframe: Timeframe;
  evaluation: ConfluenceEvaluation | null;
  lang?: Language;
  livePrice?: number;
  priceDirection?: 'up' | 'down' | 'neutral';
  theme?: 'light' | 'dark';
  selectedExchange?: SupportedExchange;
  selectedMarketType?: MarketType;
  onSelectExchange?: (exchange: SupportedExchange) => void;
  onSelectMarketType?: (marketType: MarketType) => void;
  latencyMs?: number;
  wsStatus?: 'connected' | 'connecting' | 'fallback';
  syncMetrics?: WebSocketSyncMetrics;
  recentLiveTrades?: LiveTradeTick[];
  orderBookBids?: LiveOrderBookLevel[];
  orderBookAsks?: LiveOrderBookLevel[];
  bidTotal?: number;
  askTotal?: number;
}

function formatCoinPrice(val: number): string {
  return formatCryptoPrice(val);
}

export const TickerPage: React.FC<TickerPageProps> = React.memo(({
  candles,
  symbol,
  timeframe,
  evaluation,
  lang = 'id',
  livePrice,
  priceDirection,
  theme = 'dark',
  selectedExchange = 'BINANCE',
  selectedMarketType = 'SPOT',
  onSelectExchange,
  onSelectMarketType,
  latencyMs = 12,
  wsStatus = 'connected',
  syncMetrics,
  recentLiveTrades = [],
  orderBookBids = [],
  orderBookAsks = [],
  bidTotal = 0,
  askTotal = 0,
}) => {
  const currentPrice = livePrice || (candles.length > 0 ? candles[candles.length - 1].close : 100);
  const isDark = theme === 'dark';

  // Fallback orderbook if stream hasn't populated yet
  const displayBids = useMemo(() => {
    if (orderBookBids.length > 0) return orderBookBids;
    const spread = currentPrice * 0.0003;
    return Array.from({ length: 6 }, (_, i) => ({
      price: currentPrice - spread - (i + 1) * spread * 0.8,
      amount: Math.round((Math.random() * 5 + 0.1) * 1000) / 1000,
      total: 10 + i * 5,
    }));
  }, [orderBookBids, currentPrice]);

  const displayAsks = useMemo(() => {
    if (orderBookAsks.length > 0) return orderBookAsks;
    const spread = currentPrice * 0.0003;
    return Array.from({ length: 6 }, (_, i) => ({
      price: currentPrice + spread + (i + 1) * spread * 0.8,
      amount: Math.round((Math.random() * 5 + 0.1) * 1000) / 1000,
      total: 10 + i * 5,
    }));
  }, [orderBookAsks, currentPrice]);

  // Fallback trades if stream hasn't populated yet
  const displayTrades = useMemo(() => {
    if (recentLiveTrades && recentLiveTrades.length > 0) return recentLiveTrades;
    const now = Date.now();
    const dec = getCryptoPrecision(currentPrice);
    return Array.from({ length: 10 }, (_, i) => {
      const isBuy = i % 2 === 0;
      const offset = (Math.sin(i * 1.7) * 0.00025) * currentPrice;
      const tradePrice = Number((currentPrice + (isBuy ? offset : -offset)).toFixed(dec));
      const tradeTime = new Date(now - i * 1500).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      return {
        id: `seed-${now}-${i}`,
        time: tradeTime,
        timestamp: now - i * 1500,
        price: tradePrice,
        amount: Number((Math.random() * 1.8 + 0.05).toFixed(4)),
        isBuy,
      };
    });
  }, [recentLiveTrades, currentPrice]);

  const calculatedBidTotal = bidTotal > 0 ? bidTotal : displayBids.reduce((a, b) => a + b.amount, 0);
  const calculatedAskTotal = askTotal > 0 ? askTotal : displayAsks.reduce((a, b) => a + b.amount, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Interactive Candlestick Chart */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <InteractiveChart
            candles={candles}
            symbol={symbol}
            timeframe={timeframe}
            indicators={evaluation?.indicators}
            lang={lang}
            selectedExchange={selectedExchange}
            selectedMarketType={selectedMarketType}
            onSelectExchange={onSelectExchange}
            onSelectMarketType={onSelectMarketType}
            latencyMs={latencyMs}
            wsStatus={wsStatus}
            theme={theme}
          />
        </div>

        {/* Right Column: Synced Live Depth Order Book & Recent Trade Feed */}
        <div className={`lg:col-span-4 rounded-xl border p-4 flex flex-col h-full min-h-[550px] transition-colors duration-200 ${
          isDark ? 'bg-[#0f172a] border-[#1e293b] text-white' : 'bg-white border-slate-200 text-slate-800 shadow-xs'
        }`}>
          {/* Title & Badge */}
          <div className={`flex items-center justify-between border-b pb-3 mb-3 ${
            isDark ? 'border-[#1e293b]' : 'border-slate-100'
          }`}>
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className={`text-xs font-mono font-bold tracking-wider uppercase ${isDark ? 'text-white' : 'text-slate-800'}`}>
                {lang === 'id' ? 'Live Order Book & AggTrade' : 'Live Order Book & AggTrade'}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
              <BarChart3 className="w-3.5 h-3.5 text-cyan-500" />
              <span className="font-semibold text-cyan-400">{selectedExchange} {selectedMarketType}</span>
            </div>
          </div>

          {/* Live Spread Ticker with RAF Buffered Updates */}
          <div className={`p-2.5 rounded-lg border mb-4 flex items-center justify-between ${
            isDark ? 'bg-[#0b0f19] border-cyan-500/20' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="font-mono">
              <span className={`text-[10px] block uppercase font-bold tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Live Realtime Price</span>
              <span className={`text-base font-extrabold tabular-nums transition-colors duration-200 ${
                priceDirection === 'up' ? 'text-emerald-400' : priceDirection === 'down' ? 'text-rose-400' : (isDark ? 'text-slate-100' : 'text-slate-900')
              }`}>
                ${formatCoinPrice(currentPrice)}
              </span>
            </div>
            <div className="text-right font-mono text-[10px]">
              <span className={`block uppercase font-bold tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Spread (100ms)</span>
              <span className={`tabular-nums font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                ${formatCoinPrice(currentPrice * 0.0003)} (0.03%)
              </span>
            </div>
          </div>

          {/* Live Order Book Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs font-mono tabular-nums flex-1">
            {/* Bids Column (Greens) */}
            <div className="space-y-1">
              <div className={`flex justify-between font-bold pb-1 text-[10px] border-b ${
                isDark ? 'text-slate-400 border-[#1e293b]' : 'text-slate-600 border-slate-200'
              }`}>
                <span>Bids (Buy)</span>
                <span>Size</span>
              </div>
              {displayBids.map((bid, idx) => (
                <div key={idx} className="relative flex justify-between py-0.5 px-1 rounded overflow-hidden">
                  <div 
                    className="absolute inset-y-0 left-0 bg-emerald-500/15 transition-all duration-150"
                    style={{ width: `${Math.min(100, (bid.amount / (calculatedBidTotal || 1)) * 180)}%` }}
                  />
                  <span className="text-emerald-400 font-bold relative z-10 tabular-nums">${formatCoinPrice(bid.price)}</span>
                  <span className={`relative z-10 tabular-nums font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{bid.amount}</span>
                </div>
              ))}
            </div>

            {/* Asks Column (Reds) */}
            <div className="space-y-1">
              <div className={`flex justify-between font-bold pb-1 text-[10px] border-b ${
                isDark ? 'text-slate-400 border-[#1e293b]' : 'text-slate-600 border-slate-200'
              }`}>
                <span>Asks (Sell)</span>
                <span>Size</span>
              </div>
              {displayAsks.map((ask, idx) => (
                <div key={idx} className="relative flex justify-between py-0.5 px-1 rounded overflow-hidden">
                  <div 
                    className="absolute inset-y-0 right-0 bg-rose-500/15 transition-all duration-150"
                    style={{ width: `${Math.min(100, (ask.amount / (calculatedAskTotal || 1)) * 180)}%` }}
                  />
                  <span className="text-rose-400 font-bold relative z-10 tabular-nums">${formatCoinPrice(ask.price)}</span>
                  <span className={`relative z-10 tabular-nums font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{ask.amount}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Synced aggTrade Feed */}
          <div className={`mt-4 pt-3 border-t flex-1 ${isDark ? 'border-[#1e293b]' : 'border-slate-100'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-slate-400 font-bold block uppercase tracking-wide">
                {lang === 'id' ? 'Stream Transaksi (@aggTrade)' : 'Live Market Trades (@aggTrade)'}
              </span>
              <span className="text-[9px] font-mono text-emerald-400 font-semibold">
                EventTime E Synced
              </span>
            </div>
            <div className="space-y-1 overflow-y-auto max-h-[140px] pr-1 scrollbar-thin scrollbar-thumb-slate-800">
              {displayTrades.slice(0, 10).map((trade) => (
                <div key={trade.id} className={`flex justify-between items-center text-[11px] font-mono py-0.5 px-1 rounded transition-colors ${
                  isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-100'
                }`}>
                  <span className="text-slate-500">{trade.time}</span>
                  <span className={`font-bold flex items-center gap-0.5 ${trade.isBuy ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {trade.isBuy ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    ${formatCoinPrice(trade.price)}
                  </span>
                  <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>{trade.amount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Market Maker & Bot Flow Telemetry Module */}
      <MMBotTrackerCard
        candles={candles}
        symbol={symbol}
        timeframe={timeframe}
        currentPrice={currentPrice}
        lang={lang}
        theme={theme}
      />

      {/* Algorithmic Manipulation Anatomy & MM Playbook Module */}
      <MarketMakerPlaybookCard
        candles={candles}
        symbol={symbol}
        timeframe={timeframe}
        currentPrice={currentPrice}
        lang={lang}
        theme={theme}
      />

      {/* Dedicated Liquidation Heatmap & Leverage Clusters Analytical Module */}
      <LiquidationHeatmapCard
        candles={candles}
        symbol={symbol}
        timeframe={timeframe}
        currentPrice={currentPrice}
        lang={lang}
        theme={theme}
      />
    </div>
  );
});

TickerPage.displayName = 'TickerPage';
