import React, { useState, useMemo } from 'react';
import { ConfluenceEvaluation, SupportedExchange, MarketType, OHLCVCandle, Timeframe } from '../types/crypto.types';
import { LiquidationHeatmapCard } from '../components/LiquidationHeatmapCard';
import { Layers, Flame, ShieldAlert, Waves, TrendingUp, TrendingDown, ArrowDownRight, ArrowUpRight, BarChart3 } from 'lucide-react';
import { formatCryptoPrice } from '../utils/formatters';
import { Language } from '../i18n/translations';
import { generateInstantCandlesForPrice } from '../services/marketData';

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
  const currentPrice = evaluation?.riskPlan?.currentPrice || 68500;
  
  const candles = useMemo(() => {
    if (propCandles && propCandles.length > 0) return propCandles;
    return generateInstantCandlesForPrice(currentPrice, symbol, timeframe, 80);
  }, [propCandles, symbol, currentPrice, timeframe]);

  const [activeTab, setActiveTab] = useState<'heatmap' | 'orderbook' | 'derivatives'>('heatmap');

  const mockOrderBook = useMemo(() => {
    const step = currentPrice * 0.003;
    return {
      bids: [
        { price: +(currentPrice - step * 1).toFixed(2), volumeUsd: 14200000, wallType: 'Institutional Limit Bid' },
        { price: +(currentPrice - step * 2).toFixed(2), volumeUsd: 28500000, wallType: 'Whale Iceberg Buy' },
        { price: +(currentPrice - step * 3).toFixed(2), volumeUsd: 41200000, wallType: 'Major CME Liquidity Wall' },
        { price: +(currentPrice - step * 5).toFixed(2), volumeUsd: 65000000, wallType: 'Multi-Exchange Squeeze Floor' },
      ],
      asks: [
        { price: +(currentPrice + step * 1).toFixed(2), volumeUsd: 12800000, wallType: 'Scalper Limit Ask' },
        { price: +(currentPrice + step * 2).toFixed(2), volumeUsd: 31400000, wallType: 'MM Rebalance Wall' },
        { price: +(currentPrice + step * 3).toFixed(2), volumeUsd: 52000000, wallType: 'Heavy Resistance Cluster' },
        { price: +(currentPrice + step * 5).toFixed(2), volumeUsd: 78000000, wallType: 'Macro Liquidity Sweep Ceil' },
      ]
    };
  }, [currentPrice]);

  return (
    <div id="page-orderflow-heatmap" className="space-y-6">
      {/* Header telemetry */}
      <div className={`p-4 sm:p-5 rounded-2xl border ${isDark ? 'bg-[#0b101f] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Flame className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  Order Flow & Liquidation Heatmap Terminal
                  <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-500/30 font-mono">
                    {selectedExchange} {selectedMarketType}
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  {lang === 'id' 
                    ? 'Institusional Liquidity Cluster, Order Book Delta Imbalance, dan Derivatif Leverage Depth.'
                    : 'Institutional Liquidity Clusters, Order Book Delta Imbalance, and Derivatives Depth.'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(['heatmap', 'orderbook', 'derivatives'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold uppercase transition-colors cursor-pointer ${
                  activeTab === tab
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-[#1e293b] text-slate-300 hover:text-white'
                }`}
              >
                {tab === 'heatmap' ? 'Liquidation Clusters' : tab === 'orderbook' ? 'Order Book Imbalance' : 'Derivatives & OI'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main visualizer */}
      {activeTab === 'heatmap' && (
        <div className="space-y-6">
          <LiquidationHeatmapCard
            candles={candles}
            symbol={symbol}
            timeframe={timeframe}
            currentPrice={currentPrice}
            lang={lang}
            theme={theme}
          />
        </div>
      )}

      {activeTab === 'orderbook' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-sm'}`}>
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              Bid Side Depth (Support Walls)
            </h3>
            <div className="space-y-2 font-mono text-xs">
              <div className="flex justify-between text-slate-400 pb-1 border-b border-slate-800">
                <span>Price Level</span>
                <span>Depth Volume ($M)</span>
                <span>Wall Type</span>
              </div>
              {mockOrderBook.bids.map((b, idx) => (
                <div key={`of-bid-${b.price}-${idx}`} className="flex justify-between items-center py-1 text-slate-300">
                  <span className="font-bold text-emerald-400">${formatCryptoPrice(b.price)}</span>
                  <span>${(b.volumeUsd / 1e6).toFixed(2)}M</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300">{b.wallType}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-sm'}`}>
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-rose-400" />
              Ask Side Depth (Resistance Walls)
            </h3>
            <div className="space-y-2 font-mono text-xs">
              <div className="flex justify-between text-slate-400 pb-1 border-b border-slate-800">
                <span>Price Level</span>
                <span>Depth Volume ($M)</span>
                <span>Wall Type</span>
              </div>
              {mockOrderBook.asks.map((a, idx) => (
                <div key={`of-ask-${a.price}-${idx}`} className="flex justify-between items-center py-1 text-slate-300">
                  <span className="font-bold text-rose-400">${formatCryptoPrice(a.price)}</span>
                  <span>${(a.volumeUsd / 1e6).toFixed(2)}M</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-950 text-rose-300">{a.wallType}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'derivatives' && (
        <div className={`p-6 rounded-2xl border ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-sm'}`}>
          <h3 className="text-base font-bold mb-4">Derivatives Positioning & Open Interest Matrix</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
            <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#070b14] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="text-xs text-slate-400">Predicted Funding Rate</div>
              <div className="text-lg font-bold text-cyan-400 mt-1">+0.0100% / 8h</div>
            </div>
            <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#070b14] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="text-xs text-slate-400">Long/Short Account Ratio</div>
              <div className="text-lg font-bold mt-1">1.48 (Net Long)</div>
            </div>
            <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#070b14] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="text-xs text-slate-400">Open Interest 24h Δ</div>
              <div className="text-lg font-bold text-emerald-400 mt-1">+4.82% ($12.4B)</div>
            </div>
            <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#070b14] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="text-xs text-slate-400">Top Trader Sentiment</div>
              <div className="text-lg font-bold text-purple-400 mt-1">62% Bullish</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
