import React, { useState, useMemo } from 'react';
import { ConfluenceEvaluation, SupportedExchange, MarketType, OHLCVCandle, Timeframe } from '../types/crypto.types';
import { LiquidationHeatmapCard } from '../components/LiquidationHeatmapCard';
import { Flame, BarChart3 } from 'lucide-react';
import { Language } from '../i18n/translations';
import { useMarketDataStore } from '../stores/useMarketDataStore';
import { formatSmartCryptoPrice } from '../services/marketDataValidator';
import { DataStatusBadge } from '../components/ui/DataStatusBadge';

interface OrderflowHeatmapPageProps {
  symbol: string;
  evaluation: ConfluenceEvaluation | null;
  candles?: OHLCVCandle[];
  timeframe?: Timeframe;
  selectedExchange: SupportedExchange;
  selectedMarketType: MarketType;
  lang?: Language;
  theme?: 'light' | 'dark';
}

function formatDepthUsd(volumeUsd: number): string {
  if (volumeUsd >= 1_000_000) return `$${(volumeUsd / 1_000_000).toFixed(2)}M`;
  if (volumeUsd >= 1_000) return `$${(volumeUsd / 1_000).toFixed(1)}K`;
  return `$${volumeUsd.toFixed(0)}`;
}

export const OrderflowHeatmapPage: React.FC<OrderflowHeatmapPageProps> = ({
  symbol,
  evaluation,
  candles: propCandles,
  timeframe = '1H',
  selectedExchange,
  selectedMarketType,
  lang = 'id',
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const isId = lang === 'id';

  const ssotTicker = useMarketDataStore((s) => s.tickers[symbol]);
  const ssotOrderBook = useMarketDataStore((s) => s.orderBook);

  const currentPrice =
    ssotTicker?.price ??
    (evaluation?.symbol === symbol && evaluation?.riskPlan?.currentPrice
      ? evaluation.riskPlan.currentPrice
      : 0);

  const candles = useMemo(() => {
    if (propCandles && propCandles.length > 0) return propCandles;
    return [];
  }, [propCandles]);

  const [activeTab, setActiveTab] = useState<'heatmap' | 'orderbook' | 'derivatives'>('heatmap');

  const liveDepthWalls = useMemo(() => {
    if (ssotOrderBook.symbol !== symbol) {
      return { bids: [], asks: [] };
    }
    const mapLevels = (levels: { price: number; amount: number }[], side: 'BID' | 'ASK') => {
      const enriched = levels
        .filter((lvl) => lvl.price > 0 && lvl.amount > 0)
        .map((lvl) => ({
          price: lvl.price,
          amount: lvl.amount,
          volumeUsd: lvl.price * lvl.amount,
        }));
      const avgVol =
        enriched.length > 0
          ? enriched.reduce((sum, item) => sum + item.volumeUsd, 0) / enriched.length
          : 1;

      return enriched.slice(0, 8).map((item) => {
        const ratio = avgVol > 0 ? item.volumeUsd / avgVol : 1;
        const wallType =
          ratio >= 2.2
            ? side === 'BID'
              ? 'Institutional Absorption Bid'
              : 'Heavy Supply Wall'
            : ratio >= 1.3
            ? side === 'BID'
              ? 'MM Support Cluster'
              : 'MM Ask Cluster'
            : side === 'BID'
            ? 'Active Limit Bid'
            : 'Active Limit Ask';
        return { ...item, wallType };
      });
    };

    return {
      bids: mapLevels(ssotOrderBook.bids, 'BID'),
      asks: mapLevels(ssotOrderBook.asks, 'ASK'),
    };
  }, [ssotOrderBook, symbol]);

  return (
    <div id="page-orderflow-heatmap" className="space-y-6">
      {/* Header telemetry */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border ${
          isDark ? 'bg-[#0b101f] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Flame className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold flex flex-wrap items-center gap-2">
                  <span>Order Flow & Liquidation Heatmap Terminal</span>
                  <span className="text-xs px-2 py-0.5 rounded-[2px] bg-cyan-950 text-cyan-400 border border-cyan-500/30 font-mono">
                    {selectedExchange} {selectedMarketType} • {symbol}{' '}
                    {currentPrice > 0 ? `$${formatSmartCryptoPrice(currentPrice)}` : ''}
                  </span>
                  <DataStatusBadge symbol={symbol} scope="orderbook" lang={lang} compact />
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isId
                    ? 'Klaster likuiditas institusional, Order Book L2 real-time tervalidasi, dan struktur derivatif.'
                    : 'Institutional liquidity clusters, validated live L2 Order Book walls, and derivatives positioning.'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(['heatmap', 'orderbook', 'derivatives'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold uppercase transition-colors cursor-pointer ${
                  activeTab === tab
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-[#1e293b] text-slate-300 hover:text-white'
                }`}
              >
                {tab === 'heatmap'
                  ? 'Liquidation Clusters'
                  : tab === 'orderbook'
                  ? 'Order Book Imbalance'
                  : 'Derivatives & OI'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main visualizer */}
      {activeTab === 'heatmap' && (
        <div className="space-y-6">
          {candles.length > 0 && currentPrice > 0 ? (
            <LiquidationHeatmapCard
              candles={candles}
              symbol={symbol}
              timeframe={timeframe}
              currentPrice={currentPrice}
              lang={lang}
              theme={theme}
            />
          ) : (
            <div
              className={`p-8 rounded-2xl border text-center font-mono text-xs text-slate-400 ${
                isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200'
              }`}
            >
              {isId
                ? `Menunggu sinkronisasi candle & harga live untuk ${symbol}...`
                : `Waiting for live candle & price synchronization for ${symbol}...`}
            </div>
          )}
        </div>
      )}

      {activeTab === 'orderbook' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div
            className={`p-5 rounded-2xl border ${
              isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              Bid Side Depth ({symbol} Support)
            </h3>
            <div className="space-y-2 font-mono tabular-nums text-xs">
              <div className="flex justify-between text-slate-400 pb-1 border-b border-slate-800">
                <span>Price Level</span>
                <span>Notional USD</span>
                <span>Wall Type</span>
              </div>
              {liveDepthWalls.bids.length === 0 ? (
                <div className="py-6 text-center text-slate-500">
                  {isId ? `Sinkronisasi L2 Bid ${symbol}...` : `Syncing ${symbol} L2 Bids...`}
                </div>
              ) : (
                liveDepthWalls.bids.map((b, idx) => (
                  <div
                    key={`of-bid-${b.price}-${idx}`}
                    className="flex justify-between items-center py-1 text-slate-300"
                  >
                    <span className="font-bold text-emerald-400">
                      ${formatSmartCryptoPrice(b.price)}
                    </span>
                    <span>{formatDepthUsd(b.volumeUsd)}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300">
                      {b.wallType}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div
            className={`p-5 rounded-2xl border ${
              isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-rose-400" />
              Ask Side Depth ({symbol} Resistance)
            </h3>
            <div className="space-y-2 font-mono tabular-nums text-xs">
              <div className="flex justify-between text-slate-400 pb-1 border-b border-slate-800">
                <span>Price Level</span>
                <span>Notional USD</span>
                <span>Wall Type</span>
              </div>
              {liveDepthWalls.asks.length === 0 ? (
                <div className="py-6 text-center text-slate-500">
                  {isId ? `Sinkronisasi L2 Ask ${symbol}...` : `Syncing ${symbol} L2 Asks...`}
                </div>
              ) : (
                liveDepthWalls.asks.map((a, idx) => (
                  <div
                    key={`of-ask-${a.price}-${idx}`}
                    className="flex justify-between items-center py-1 text-slate-300"
                  >
                    <span className="font-bold text-rose-400">
                      ${formatSmartCryptoPrice(a.price)}
                    </span>
                    <span>{formatDepthUsd(a.volumeUsd)}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-950 text-rose-300">
                      {a.wallType}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'derivatives' && (
        <div
          className={`p-6 rounded-2xl border ${
            isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <h3 className="text-base font-bold mb-4">Derivatives Positioning & Open Interest Matrix</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono tabular-nums">
            <div
              className={`p-3 rounded-xl border ${
                isDark ? 'bg-[#070b14] border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="text-xs text-slate-400">Reference Mark Price</div>
              <div className="text-lg font-bold text-cyan-400 mt-1">
                {currentPrice > 0 ? `$${formatSmartCryptoPrice(currentPrice)}` : '--'}
              </div>
            </div>
            <div
              className={`p-3 rounded-xl border ${
                isDark ? 'bg-[#070b14] border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="text-xs text-slate-400">24h Price Momentum</div>
              <div
                className={`text-lg font-bold mt-1 ${
                  (ssotTicker?.change24h ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {typeof ssotTicker?.change24h === 'number'
                  ? `${ssotTicker.change24h >= 0 ? '+' : ''}${ssotTicker.change24h.toFixed(2)}%`
                  : '--'}
              </div>
            </div>
            <div
              className={`p-3 rounded-xl border ${
                isDark ? 'bg-[#070b14] border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="text-xs text-slate-400">L2 Bid / Ask Ratio</div>
              <div className="text-lg font-bold text-emerald-400 mt-1">
                {liveDepthWalls.bids.length > 0 && liveDepthWalls.asks.length > 0
                  ? (
                      liveDepthWalls.bids.reduce((s, b) => s + b.volumeUsd, 0) /
                      Math.max(1, liveDepthWalls.asks.reduce((s, a) => s + a.volumeUsd, 0))
                    ).toFixed(2)
                  : '--'}
              </div>
            </div>
            <div
              className={`p-3 rounded-xl border ${
                isDark ? 'bg-[#070b14] border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="text-xs text-slate-400">Confluence Bias</div>
              <div className="text-lg font-bold text-purple-400 mt-1">
                {evaluation?.symbol === symbol ? evaluation.marketBias : '--'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
