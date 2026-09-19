import React, { useState, useMemo } from 'react';
import { InteractiveChart } from '../components/InteractiveChart';
import { LiquidationHeatmapCard } from '../components/LiquidationHeatmapCard';
import { MMBotTrackerCard } from '../components/MMBotTrackerCard';
import { MarketMakerPlaybookCard } from '../components/MarketMakerPlaybookCard';
import { FocusableFrame } from '../components/FocusableFrame';
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
  Bot,
  Flame,
  Sparkles,
  Layers,
  Zap,
  Activity,
  Sliders,
  Maximize2,
  Minimize2,
  TrendingUp,
  ShieldCheck,
  RotateCcw,
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
  visibleFrames?: Record<string, boolean>;
  focusedFrame?: string | null;
  onSetFocusedFrame?: (frameId: string | null) => void;
  accountMode?: 'DEMO' | 'REAL';
  demoBalance?: number;
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
  visibleFrames = { chart: true, orderbook: true, mmbot: true, playbook: true, liquidation: true },
  focusedFrame = null,
  onSetFocusedFrame,
  accountMode = 'DEMO',
  demoBalance = 100000,
}) => {
  const currentPrice = livePrice || (candles.length > 0 ? candles[candles.length - 1].close : 100);
  const isDark = theme === 'dark';
  const isId = lang === 'id';

  // Responsive mobile active tab filter
  const [mobileActiveTab, setMobileActiveTab] = useState<'all' | 'chart' | 'orderbook' | 'mmbot' | 'playbook' | 'liquidation'>('all');

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

  const toggleFocus = (frameId: string) => {
    if (onSetFocusedFrame) {
      onSetFocusedFrame(focusedFrame === frameId ? null : frameId);
    }
  };

  const isVisible = (frameKey: string) => {
    if (mobileActiveTab !== 'all' && mobileActiveTab !== frameKey) return false;
    return visibleFrames[frameKey] !== false;
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Mobile/Tablet Adaptive Frame Switcher Tabs */}
      <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { key: 'all', label: isId ? 'Semua Grid' : 'All Grid' },
          { key: 'chart', label: isId ? 'Grafik' : 'Chart' },
          { key: 'orderbook', label: isId ? 'Order Book' : 'Order Book' },
          { key: 'mmbot', label: isId ? 'Bot MM' : 'MM Bot' },
          { key: 'playbook', label: isId ? 'Playbook' : 'Playbook' },
          { key: 'liquidation', label: isId ? 'Likuidasi' : 'Liquidation' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setMobileActiveTab(tab.key as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition-all cursor-pointer border ${
              mobileActiveTab === tab.key
                ? isDark
                  ? 'bg-[#F89DB5]/20 border-[#F89DB5]/50 text-[#F89DB5]'
                  : 'bg-pink-100 border-pink-300 text-pink-700 font-bold'
                : isDark
                ? 'bg-[#323232] border-[#484848] text-slate-400 hover:text-white'
                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Grid: Interactive Candlestick Chart & Synced Order Book */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Frame 1: Interactive Candlestick Chart */}
        {isVisible('chart') && (
          <div className={`${isVisible('orderbook') ? 'lg:col-span-8' : 'lg:col-span-12'} flex flex-col`}>
            <FocusableFrame
              id="chart-frame"
              title={`${symbol} ${isId ? 'Grafik Candlestick' : 'Candlestick Chart'}`}
              subtitle={`${selectedExchange} • ${selectedMarketType} • ${timeframe}`}
              icon={BarChart3}
              badge={selectedMarketType === 'FUTURES' ? 'PERPETUAL' : 'SPOT'}
              badgeVariant={selectedMarketType === 'FUTURES' ? 'pink' : 'default'}
              isFocused={focusedFrame === 'chart'}
              onToggleFocus={() => toggleFocus('chart')}
              onCloseFocus={() => onSetFocusedFrame?.(null)}
              lang={lang}
              isDark={isDark}
              accountMode={accountMode}
              marketType={selectedMarketType}
              quickActions={
                <div className="hidden sm:flex items-center gap-1">
                  <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md ${
                    isDark ? 'bg-[#262626] text-slate-300' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {candles.length} Candles
                  </span>
                </div>
              }
            >
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
            </FocusableFrame>
          </div>
        )}

        {/* Frame 2: Synced Live Depth Order Book & Recent Trade Feed */}
        {isVisible('orderbook') && (
          <div className={`${isVisible('chart') ? 'lg:col-span-4' : 'lg:col-span-12'} flex flex-col h-full`}>
            <FocusableFrame
              id="orderbook-frame"
              title={isId ? 'Live Order Book & AggTrade' : 'Live Order Book & AggTrade'}
              subtitle={`${selectedExchange} • Realtime WebSocket`}
              icon={Radio}
              badge={wsStatus === 'connected' ? 'LIVE SYNC' : 'CONNECTING'}
              badgeVariant={wsStatus === 'connected' ? 'success' : 'warning'}
              isFocused={focusedFrame === 'orderbook'}
              onToggleFocus={() => toggleFocus('orderbook')}
              onCloseFocus={() => onSetFocusedFrame?.(null)}
              lang={lang}
              isDark={isDark}
              accountMode={accountMode}
              marketType={selectedMarketType}
              quickActions={
                <span className="text-[10px] font-mono text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-emerald-500/10">
                  {latencyMs}ms
                </span>
              }
            >
              <div className="flex flex-col h-full space-y-3">
                {/* Live Spread Ticker with Realtime Updates */}
                <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                  isDark ? 'bg-[#262626] border-[#444]' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="font-mono">
                    <span className={`text-[10px] block uppercase font-bold tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {isId ? 'Harga Terkini' : 'Realtime Price'}
                    </span>
                    <span className={`text-base font-extrabold tabular-nums transition-colors duration-200 ${
                      priceDirection === 'up' ? 'text-emerald-400' : priceDirection === 'down' ? 'text-rose-400' : (isDark ? 'text-white' : 'text-slate-900')
                    }`}>
                      ${formatCoinPrice(currentPrice)}
                    </span>
                  </div>
                  <div className="text-right font-mono text-[10px]">
                    <span className={`block uppercase font-bold tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Spread (0.03%)
                    </span>
                    <span className={`tabular-nums font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      ${formatCoinPrice(currentPrice * 0.0003)}
                    </span>
                  </div>
                </div>

                {/* Live Order Book Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs font-mono tabular-nums">
                  {/* Bids Column */}
                  <div className="space-y-1">
                    <div className={`flex justify-between font-bold pb-1 text-[10px] border-b ${
                      isDark ? 'text-slate-400 border-[#404040]' : 'text-slate-600 border-slate-200'
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

                  {/* Asks Column */}
                  <div className="space-y-1">
                    <div className={`flex justify-between font-bold pb-1 text-[10px] border-b ${
                      isDark ? 'text-slate-400 border-[#404040]' : 'text-slate-600 border-slate-200'
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
                <div className={`pt-2.5 border-t ${isDark ? 'border-[#404040]' : 'border-slate-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono text-slate-400 font-bold block uppercase tracking-wide">
                      {isId ? 'Stream Transaksi (@aggTrade)' : 'Live Market Trades (@aggTrade)'}
                    </span>
                    <span className="text-[9px] font-mono text-emerald-400 font-semibold">
                      Synced
                    </span>
                  </div>
                  <div className="space-y-1 overflow-y-auto max-h-[140px] pr-1">
                    {displayTrades.slice(0, 10).map((trade) => (
                      <div key={trade.id} className={`flex justify-between items-center text-[11px] font-mono py-0.5 px-1 rounded transition-colors ${
                        isDark ? 'hover:bg-[#383838]' : 'hover:bg-slate-100'
                      }`}>
                        <span className="text-slate-400">{trade.time}</span>
                        <span className={`font-bold flex items-center gap-0.5 ${trade.isBuy ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {trade.isBuy ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          ${formatCoinPrice(trade.price)}
                        </span>
                        <span className={isDark ? 'text-slate-200' : 'text-slate-600'}>{trade.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </FocusableFrame>
          </div>
        )}
      </div>

      {/* Frame 3: Market Maker & Bot Flow Telemetry Module */}
      {isVisible('mmbot') && (
        <FocusableFrame
          id="mmbot-frame"
          title={isId ? 'MM Bot Tracker & Kecepatan Flow Institusional' : 'MM Bot Tracker & Institutional Velocity'}
          subtitle={isId ? 'Deteksi Algoritmik Spoofing, High-Frequency Trading & Velocity Delta' : 'Algorithmic Spoofing Detection, HFT Activity & Delta Velocity'}
          icon={Bot}
          badge="QUANT FLUX"
          badgeVariant="purple"
          isFocused={focusedFrame === 'mmbot'}
          onToggleFocus={() => toggleFocus('mmbot')}
          onCloseFocus={() => onSetFocusedFrame?.(null)}
          lang={lang}
          isDark={isDark}
          accountMode={accountMode}
          marketType={selectedMarketType}
        >
          <MMBotTrackerCard
            candles={candles}
            symbol={symbol}
            timeframe={timeframe}
            currentPrice={currentPrice}
            lang={lang}
            theme={theme}
          />
        </FocusableFrame>
      )}

      {/* Frame 4: Algorithmic Manipulation Anatomy & MM Playbook Module */}
      {isVisible('playbook') && (
        <FocusableFrame
          id="playbook-frame"
          title={isId ? 'Anatomi Manipulasi MM & Strategi Playbook' : 'MM Manipulation Anatomy & Strategy Playbook'}
          subtitle={isId ? 'Fase Siklus Wyckoff, Liquidity Sweep & Skenario Probabilitas Eksekusi' : 'Wyckoff Cycle Phases, Liquidity Sweep & Probability Playbook'}
          icon={Sparkles}
          badge="SMART MONEY"
          badgeVariant="pink"
          isFocused={focusedFrame === 'playbook'}
          onToggleFocus={() => toggleFocus('playbook')}
          onCloseFocus={() => onSetFocusedFrame?.(null)}
          lang={lang}
          isDark={isDark}
          accountMode={accountMode}
          marketType={selectedMarketType}
        >
          <MarketMakerPlaybookCard
            candles={candles}
            symbol={symbol}
            timeframe={timeframe}
            currentPrice={currentPrice}
            lang={lang}
            theme={theme}
          />
        </FocusableFrame>
      )}

      {/* Frame 5: Dedicated Liquidation Heatmap & Leverage Clusters Analytical Module */}
      {isVisible('liquidation') && (
        <FocusableFrame
          id="liquidation-frame"
          title={isId ? 'Heatmap Likuidasi & Cluster Leverage' : 'Liquidation Heatmap & Leverage Clusters'}
          subtitle={isId ? 'Peta Kluster Likuidasi 25x, 50x, 100x & Zona Magnet Squeeze' : '25x, 50x, 100x Liquidation Levels & Squeeze Magnet Proximity'}
          icon={Flame}
          badge="DERIVATIVES RISK"
          badgeVariant="warning"
          isFocused={focusedFrame === 'liquidation'}
          onToggleFocus={() => toggleFocus('liquidation')}
          onCloseFocus={() => onSetFocusedFrame?.(null)}
          lang={lang}
          isDark={isDark}
          accountMode={accountMode}
          marketType={selectedMarketType}
        >
          <LiquidationHeatmapCard
            candles={candles}
            symbol={symbol}
            timeframe={timeframe}
            currentPrice={currentPrice}
            lang={lang}
            theme={theme}
          />
        </FocusableFrame>
      )}
    </div>
  );
});

TickerPage.displayName = 'TickerPage';
