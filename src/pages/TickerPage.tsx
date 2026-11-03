import React, { useMemo } from 'react';
import { InteractiveChart } from '../components/InteractiveChart';
import { CandleSizeProjectionCard } from '../components/CandleSizeProjectionCard';
import { LiquidationHeatmapCard } from '../components/LiquidationHeatmapCard';
import { MMBotTrackerCard } from '../components/MMBotTrackerCard';
import { MarketMakerPlaybookCard } from '../components/MarketMakerPlaybookCard';
import { analyzeMarketMakerPlaybook } from '../services/marketMaker/mmEngine';
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
import { formatCryptoPrice } from '../utils/formatters';
import { CryptoIcon } from '../components/ui/CryptoIcon';
import { useMarketDataStore } from '../stores/useMarketDataStore';
import { DataStatusBadge } from '../components/ui/DataStatusBadge';

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
  wsStatus?: 'connected' | 'connecting' | 'fallback' | 'disconnected';
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

function formatPrice(val: number): string {
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
  const ssotPrice = useMarketDataStore((s) => s.tickers[symbol]?.price ?? null);
  const ssotOrderBook = useMarketDataStore((s) => (s.orderBook.symbol === symbol ? s.orderBook : null));
  const ssotTrades = useMarketDataStore((s) => (s.activeSymbol === symbol ? s.recentTrades : []));

  const currentPrice =
    ssotPrice ?? livePrice ?? (candles.length > 0 ? candles[candles.length - 1].close : 0);
  const isDark = theme === 'dark';

  const displayBids = ssotOrderBook ? ssotOrderBook.bids : orderBookBids;
  const displayAsks = ssotOrderBook ? ssotOrderBook.asks : orderBookAsks;
  const displayTrades = ssotTrades.length > 0 ? ssotTrades : recentLiveTrades;

  const calculatedBidTotal =
    ssotOrderBook && ssotOrderBook.bidTotal > 0
      ? ssotOrderBook.bidTotal
      : bidTotal > 0
        ? bidTotal
        : displayBids.reduce((a, b) => a + b.amount, 0);
  const calculatedAskTotal =
    ssotOrderBook && ssotOrderBook.askTotal > 0
      ? ssotOrderBook.askTotal
      : askTotal > 0
        ? askTotal
        : displayAsks.reduce((a, b) => a + b.amount, 0);

  const bestBid = displayBids.length > 0 ? displayBids[0].price : 0;
  const bestAsk = displayAsks.length > 0 ? displayAsks[0].price : 0;
  const realSpread = bestBid > 0 && bestAsk > bestBid ? bestAsk - bestBid : 0;
  const realSpreadPct = bestBid > 0 && realSpread > 0 ? (realSpread / bestBid) * 100 : 0;

  const candleCount = candles.length;
  const lastCandleTime = candleCount > 0 ? candles[candleCount - 1].time : 0;

  const sharedMMData = useMemo(() => {
    return analyzeMarketMakerPlaybook(candles, currentPrice, symbol, timeframe, displayBids, displayAsks);
  }, [candles, candleCount, lastCandleTime, currentPrice, symbol, timeframe, displayBids, displayAsks]);

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
        <div className={`lg:col-span-4 rounded-[2px] border p-4 flex flex-col h-full min-h-[550px] transition-colors duration-200 ${
          isDark ? 'bg-[#0f172a] border-[#1e293b] text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-xs'
        }`}>
          {/* Title & Badge */}
          <div className={`flex items-center justify-between border-b pb-3 mb-3 ${
            isDark ? 'border-slate-800/80' : 'border-slate-200'
          }`}>
            <div className="flex items-center gap-2">
              <CryptoIcon symbol={symbol} size="sm" className="rounded-full shadow-xs shrink-0" />
              <span className={`text-xs font-mono font-bold tracking-wider uppercase ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                {symbol} {lang === 'id' ? 'Live Order Book' : 'Live Order Book'}
              </span>
            </div>
            <DataStatusBadge symbol={symbol} scope="orderbook" lang={lang} compact />
          </div>

          {/* Live Spread Ticker with Validated SSOT Price & Real L2 Spread */}
          <div className={`p-2.5 rounded-[2px] border mb-4 flex items-center justify-between ${
            isDark ? 'bg-[#0b0f19] border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="font-mono">
              <span className={`text-[10px] block uppercase font-bold tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Live Realtime Price</span>
              <span className={`text-base font-extrabold tabular-nums transition-colors duration-200 ${
                priceDirection === 'up' ? 'text-emerald-400' : priceDirection === 'down' ? 'text-rose-400' : (isDark ? 'text-slate-100' : 'text-slate-900')
              }`}>
                {currentPrice > 0 ? `$${formatCoinPrice(currentPrice)}` : '—'}
              </span>
            </div>
            <div className="text-right font-mono text-[10px]">
              <span className={`block uppercase font-bold tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Spread (L2 Live)</span>
              <span className={`tabular-nums font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                {realSpread > 0 ? `$${formatCoinPrice(realSpread)} (${realSpreadPct.toFixed(3)}%)` : '—'}
              </span>
            </div>
          </div>

          {/* Live Order Book Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs font-mono tabular-nums flex-1">
            {/* Bids Column (Greens) */}
            <div className="space-y-1">
              <div className={`flex justify-between font-bold pb-1 text-[10px] border-b ${
                isDark ? 'text-slate-400 border-slate-800' : 'text-slate-600 border-slate-200'
              }`}>
                <span>Bids (Buy)</span>
                <span>Size</span>
              </div>
              {displayBids.length === 0 ? (
                <div className="py-4 text-center text-slate-500 text-[10px]">
                  {lang === 'id' ? 'Sinkronisasi buku order...' : 'Syncing order book...'}
                </div>
              ) : (
                displayBids.slice(0, 6).map((bid, idx) => (
                  <div key={`bid-${bid.price}-${idx}`} className="relative flex justify-between py-0.5 px-1 rounded-[2px] overflow-hidden">
                    <div 
                      className="absolute inset-y-0 left-0 bg-emerald-500/15 transition-all duration-150"
                      style={{ width: `${Math.min(100, (bid.amount / (calculatedBidTotal || 1)) * 180)}%` }}
                    />
                    <span className="text-emerald-400 font-bold relative z-10 tabular-nums">${formatCoinPrice(bid.price)}</span>
                    <span className={`relative z-10 tabular-nums font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{bid.amount}</span>
                  </div>
                ))
              )}
            </div>

            {/* Asks Column (Reds) */}
            <div className="space-y-1">
              <div className={`flex justify-between font-bold pb-1 text-[10px] border-b ${
                isDark ? 'text-slate-400 border-slate-800' : 'text-slate-600 border-slate-200'
              }`}>
                <span>Asks (Sell)</span>
                <span>Size</span>
              </div>
              {displayAsks.length === 0 ? (
                <div className="py-4 text-center text-slate-500 text-[10px]">
                  {lang === 'id' ? 'Sinkronisasi buku order...' : 'Syncing order book...'}
                </div>
              ) : (
                displayAsks.slice(0, 6).map((ask, idx) => (
                  <div key={`ask-${ask.price}-${idx}`} className="relative flex justify-between py-0.5 px-1 rounded-[2px] overflow-hidden">
                    <div 
                      className="absolute inset-y-0 right-0 bg-rose-500/15 transition-all duration-150"
                      style={{ width: `${Math.min(100, (ask.amount / (calculatedAskTotal || 1)) * 180)}%` }}
                    />
                    <span className="text-rose-400 font-bold relative z-10 tabular-nums">${formatCoinPrice(ask.price)}</span>
                    <span className={`relative z-10 tabular-nums font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{ask.amount}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Synced aggTrade Feed */}
          <div className={`mt-4 pt-3 border-t flex-1 ${isDark ? 'border-slate-800/80' : 'border-slate-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-slate-400 font-bold block uppercase tracking-wide">
                {lang === 'id' ? 'Stream Transaksi (@aggTrade)' : 'Live Market Trades (@aggTrade)'}
              </span>
              <span className="text-[9px] font-mono text-emerald-400 font-semibold">
                EventTime E Synced
              </span>
            </div>
            <div className="space-y-1 overflow-y-auto max-h-[140px] pr-1 scrollbar-thin">
              {displayTrades.length === 0 ? (
                <div className="py-4 text-center text-slate-500 text-[10px]">
                  {lang === 'id' ? 'Sinkronisasi data transaksi...' : 'Syncing live trades...'}
                </div>
              ) : (
                displayTrades.slice(0, 10).map((trade, idx) => (
                  <div key={`trade-${trade.id || 't'}-${trade.timestamp || idx}-${idx}`} className={`flex justify-between items-center text-[11px] font-mono py-0.5 px-1 rounded-[2px] transition-colors ${
                    isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-100'
                  }`}>
                    <span className="text-slate-500">{trade.time}</span>
                    <span className={`font-bold flex items-center gap-0.5 ${trade.isBuy ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {trade.isBuy ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      ${formatPrice(trade.price)}
                    </span>
                    <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>{trade.amount}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Candle Size Projection, Targets & Re-entry Zone Telemetry Module */}
      <CandleSizeProjectionCard
        candles={candles}
        symbol={symbol}
        timeframe={timeframe}
        currentPrice={currentPrice}
        lang={lang}
        theme={theme}
      />

      {/* Market Maker & Bot Flow Telemetry Module */}
      <MMBotTrackerCard
        candles={candles}
        symbol={symbol}
        timeframe={timeframe}
        currentPrice={currentPrice}
        mmData={sharedMMData}
        orderBookBids={orderBookBids}
        orderBookAsks={orderBookAsks}
        lang={lang}
        theme={theme}
      />

      {/* Algorithmic Manipulation Anatomy & MM Playbook Module */}
      <MarketMakerPlaybookCard
        candles={candles}
        symbol={symbol}
        timeframe={timeframe}
        currentPrice={currentPrice}
        mmData={sharedMMData}
        orderBookBids={orderBookBids}
        orderBookAsks={orderBookAsks}
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
