import React, { useState, useMemo } from 'react';
import {
  OHLCVCandle,
  Timeframe,
  MMPlaybookAnalysis,
  LiveOrderBookLevel,
} from '../types/crypto.types';
import { analyzeMarketMakerPlaybook } from '../services/marketMaker/mmEngine';
import {
  Bot,
  Layers,
  Activity,
  Waves,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  AlertTriangle,
  Radio,
  TrendingUp,
  TrendingDown,
  Info,
} from 'lucide-react';
import { Language } from '../i18n/translations';
import { formatCryptoPrice } from '../utils/formatters';

interface MMBotTrackerCardProps {
  candles: OHLCVCandle[];
  symbol: string;
  timeframe: Timeframe;
  currentPrice?: number;
  mmData?: MMPlaybookAnalysis;
  orderBookBids?: LiveOrderBookLevel[];
  orderBookAsks?: LiveOrderBookLevel[];
  lang?: Language;
  theme?: 'dark' | 'light';
}

export const MMBotTrackerCard: React.FC<MMBotTrackerCardProps> = ({
  candles,
  symbol,
  timeframe,
  currentPrice: overridePrice,
  mmData: precomputedMMData,
  orderBookBids,
  orderBookAsks,
  lang = 'id',
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const isId = lang === 'id';

  const [activeTab, setActiveTab] = useState<'depth' | 'derivatives' | 'avwap'>('depth');

  const livePrice = overridePrice || (candles.length > 0 ? candles[candles.length - 1].close : 0);

  // Compute MM data once, or use precomputed value from parent
  const lastCandleTime = candles.length > 0 ? candles[candles.length - 1].time : 0;
  const candleCount = candles.length;
  const bidsCount = orderBookBids?.length || 0;
  const asksCount = orderBookAsks?.length || 0;

  const mmData: MMPlaybookAnalysis = useMemo(() => {
    if (precomputedMMData) return precomputedMMData;
    return analyzeMarketMakerPlaybook(candles, livePrice, symbol, timeframe, orderBookBids, orderBookAsks);
  }, [precomputedMMData, candleCount, lastCandleTime, livePrice, symbol, timeframe, bidsCount, asksCount]);

  const { orderBookDepth, derivatives, anchoredVWAP } = mmData;

  const formatPrice = (p: number) => formatCryptoPrice(p);

  return (
    <div
      id="mm-bot-tracker-telemetry-card"
      className={`rounded-[2px] border p-5 transition-all duration-200 ${
        isDark ? 'bg-[#0f172a] border-[#1e293b] text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-xs'
      }`}
    >
      {/* Header Bar */}
      <div className={`flex flex-wrap items-center justify-between gap-4 pb-4 border-b ${
        isDark ? 'border-slate-800/80' : 'border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[2px] bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-400 shrink-0 shadow-xs">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-black tracking-tight font-display">
                {isId ? 'Radar Pelacak Aliran Market Maker & Bot' : 'Market Maker & Bot Flow Telemetry'}
              </h3>
              <span className={`inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-[2px] border font-bold ${
                !orderBookDepth.isEstimated
                  ? isDark ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : isDark ? 'bg-amber-500/15 border-amber-500/30 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-700'
              }`}>
                <Radio className="w-3 h-3" />
                {!orderBookDepth.isEstimated
                  ? (isId ? 'Buku Order L2 Live' : 'Live L2 Book')
                  : (isId ? 'Perkiraan (Berbasis Lilin & CVD)' : 'Estimated (Candle & CVD)')}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              {isId
                ? 'Order Book Depth, Delta CVD, Estimasi Open Interest, Funding Rate, & Multi-Anchor VWAP'
                : 'Depth Imbalance, Cumulative Delta (CVD), OI Dynamics, & Anchored VWAPs'}
            </p>
          </div>
        </div>

        {/* Tab Navigation Switches */}
        <div className={`flex items-center p-1 rounded-[2px] border ${
          isDark ? 'bg-[#0b0f19] border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}>
          <button
            onClick={() => setActiveTab('depth')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] text-xs font-mono font-bold transition-all cursor-pointer ${
              activeTab === 'depth'
                ? 'bg-pink-600 text-white shadow-xs font-extrabold'
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Depth & CVD</span>
          </button>

          <button
            onClick={() => setActiveTab('derivatives')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] text-xs font-mono font-bold transition-all cursor-pointer ${
              activeTab === 'derivatives'
                ? 'bg-pink-600 text-white shadow-xs font-extrabold'
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>OI & Funding (~Est)</span>
          </button>

          <button
            onClick={() => setActiveTab('avwap')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] text-xs font-mono font-bold transition-all cursor-pointer ${
              activeTab === 'avwap'
                ? 'bg-pink-600 text-white shadow-xs font-extrabold'
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Waves className="w-3.5 h-3.5" />
            <span>Anchored VWAP</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="mt-5">
        {/* ======================================================== */}
        {/* TAB 1: ORDER BOOK DEPTH & DELTA VOLUME (CVD)             */}
        {/* ======================================================== */}
        {activeTab === 'depth' && (
          <div className="space-y-5">
            {/* Top Metric Strip: Imbalance Gauge & CVD Aggression */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Metric 1: Bid/Ask Imbalance Ratio */}
              <div className={`p-4 rounded-[2px] border ${
                isDark ? 'bg-[#0b0f19] border-slate-800/80' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between text-xs font-mono mb-2">
                  <span className="text-slate-400 font-semibold uppercase flex items-center gap-1">
                    <span>{isId ? 'Bid/Ask Imbalance' : 'Bid/Ask Imbalance'}</span>
                    {orderBookDepth.isEstimated && <span className="text-[10px] text-amber-400">(~Est)</span>}
                  </span>
                  <span className={`font-bold px-2 py-0.5 rounded-[2px] text-[11px] ${
                    orderBookDepth.imbalanceRatio >= 1.2
                      ? isDark ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : orderBookDepth.imbalanceRatio <= 0.8
                      ? isDark ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' : 'bg-rose-50 text-rose-700 border border-rose-200'
                      : isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {orderBookDepth.imbalanceRatio}x {orderBookDepth.imbalanceRatio >= 1 ? 'Buyers' : 'Sellers'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-lg font-black font-mono mb-2">
                  <span className="text-emerald-500">{orderBookDepth.bidPercent}% Beli</span>
                  <span className="text-rose-500">{orderBookDepth.askPercent}% Jual</span>
                </div>

                {/* Imbalance Progress Bar */}
                <div className={`w-full h-2.5 rounded-[2px] overflow-hidden flex ${isDark ? 'bg-rose-500/30' : 'bg-rose-200'}`}>
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${orderBookDepth.bidPercent}%` }}
                  />
                </div>
                <span className={`block mt-2 text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {orderBookDepth.bidPercent > 55
                    ? (isId ? 'Tekanan beli dominan di kedalaman buku order' : 'Buy pressure dominates near bid ladder')
                    : (isId ? 'Tekanan jual menekan ask side' : 'Sell pressure heavy on ask ladder')}
                </span>
              </div>

              {/* Metric 2: Cumulative Volume Delta (CVD) */}
              <div className={`p-4 rounded-[2px] border ${
                isDark ? 'bg-[#0b0f19] border-slate-800/80' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between text-xs font-mono mb-2">
                  <span className="text-slate-400 font-semibold uppercase">{isId ? 'Tren CVD Terkini' : 'Current CVD'}</span>
                  <span className={`font-bold px-2 py-0.5 rounded-[2px] text-[11px] ${
                    orderBookDepth.currentCvd >= 0
                      ? isDark ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : isDark ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    {orderBookDepth.cvdTrend.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="text-2xl font-black font-mono flex items-center gap-1">
                  {orderBookDepth.currentCvd >= 0 ? (
                    <ArrowUpRight className="w-6 h-6 text-emerald-400" />
                  ) : (
                    <ArrowDownRight className="w-6 h-6 text-rose-400" />
                  )}
                  <span className={orderBookDepth.currentCvd >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {orderBookDepth.currentCvd >= 0 ? '+' : ''}{orderBookDepth.currentCvd}
                  </span>
                  <span className="text-xs text-slate-400 font-normal">Delta</span>
                </div>
                <p className={`mt-2 text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {isId
                    ? 'Total selisih volume agresi taker buy dikurangi taker sell'
                    : 'Net cumulative market aggressor buy volume minus sell volume'}
                </p>
              </div>

              {/* Metric 3: Institutional Aggression Meter */}
              <div className={`p-4 rounded-[2px] border ${
                isDark ? 'bg-[#0b0f19] border-slate-800/80' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between text-xs font-mono mb-2">
                  <span className="text-slate-400 font-semibold uppercase">{isId ? 'Skor Agresi Institusi' : 'Inst. Aggression'}</span>
                  <span className="font-bold text-pink-400 text-xs">{orderBookDepth.institutionalAggressionScore}/100</span>
                </div>
                <div className={`text-2xl font-black font-mono mb-2 ${isDark ? 'text-pink-300' : 'text-pink-600'}`}>
                  {orderBookDepth.institutionalAggressionScore > 70
                    ? (isId ? 'Aktivitas Ekstrem' : 'High Activity')
                    : orderBookDepth.institutionalAggressionScore > 40
                    ? (isId ? 'Aktivitas Moderat' : 'Moderate Activity')
                    : (isId ? 'Aktivitas Pasif' : 'Passive Accumulation')}
                </div>
                <div className={`w-full h-2 rounded-[2px] overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                  <div
                    className="h-full bg-pink-500 rounded-[2px] transition-all duration-300"
                    style={{ width: `${orderBookDepth.institutionalAggressionScore}%` }}
                  />
                </div>
                <p className={`mt-2 text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {isId ? 'Intensitas eksekusi order flow algoritma Market Maker' : 'Algorithmic MM and HFT execution velocity'}
                </p>
              </div>
            </div>

            {/* Imbalance Alert Banner if detected */}
            {orderBookDepth.spoofAlert && (
              <div className={`flex items-start gap-3 p-3.5 rounded-[2px] border text-xs font-mono ${
                isDark ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}>
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block uppercase">{isId ? 'Deteksi Imbalance Order Flow' : 'Order Flow Imbalance Alert'}</span>
                  <p className={`mt-0.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{orderBookDepth.spoofAlert}</p>
                </div>
              </div>
            )}

            {/* Order Book Depth Walls Grid (Bid Walls vs Ask Walls) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Bid Depth Walls */}
              <div className={`p-4 rounded-[2px] border ${
                isDark ? 'bg-[#0b0f19] border-slate-800/80' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className={`flex items-center justify-between pb-2 mb-3 border-b ${
                  isDark ? 'border-slate-800' : 'border-slate-200'
                }`}>
                  <span className="text-xs font-bold font-mono text-emerald-400 uppercase flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>{isId ? 'Tembok Beli (Bid Walls)' : 'Bid Walls'}</span>
                    {orderBookDepth.isEstimated && <span className="text-[10px] text-amber-400 font-normal">(~Est)</span>}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">{isId ? 'Jarak / Nominal USD' : 'Distance / USD'}</span>
                </div>

                <div className="space-y-1.5">
                  {orderBookDepth.bidWalls.map((wall, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center justify-between p-2 rounded-[2px] text-xs font-mono transition-colors border ${
                        isDark ? 'bg-slate-900/70 hover:bg-slate-800/80 border-slate-800/60' : 'bg-white hover:bg-slate-100 border-slate-200 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-400 font-bold">${formatPrice(wall.price)}</span>
                        <span className="text-[11px] text-slate-400">(-{wall.distancePct}%)</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>{wall.amount} token</span>
                        <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>${(wall.volumeUsd / 1000).toFixed(0)}K</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ask Depth Walls */}
              <div className={`p-4 rounded-[2px] border ${
                isDark ? 'bg-[#0b0f19] border-slate-800/80' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className={`flex items-center justify-between pb-2 mb-3 border-b ${
                  isDark ? 'border-slate-800' : 'border-slate-200'
                }`}>
                  <span className="text-xs font-bold font-mono text-rose-400 uppercase flex items-center gap-1.5">
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>{isId ? 'Tembok Jual (Ask Walls)' : 'Ask Walls'}</span>
                    {orderBookDepth.isEstimated && <span className="text-[10px] text-amber-400 font-normal">(~Est)</span>}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">{isId ? 'Jarak / Nominal USD' : 'Distance / USD'}</span>
                </div>

                <div className="space-y-1.5">
                  {orderBookDepth.askWalls.map((wall, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center justify-between p-2 rounded-[2px] text-xs font-mono transition-colors border ${
                        isDark ? 'bg-slate-900/70 hover:bg-slate-800/80 border-slate-800/60' : 'bg-white hover:bg-slate-100 border-slate-200 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-rose-400 font-bold">${formatPrice(wall.price)}</span>
                        <span className="text-[11px] text-slate-400">(+{wall.distancePct}%)</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>{wall.amount} token</span>
                        <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>${(wall.volumeUsd / 1000).toFixed(0)}K</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: OPEN INTEREST (OI) & FUNDING RATE (DERIVATIVES)   */}
        {/* ======================================================== */}
        {activeTab === 'derivatives' && (
          <div className="space-y-5">
            {/* Disclaimer Notice */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-[2px] border text-xs font-mono ${
              isDark ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}>
              <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>
                {isId
                  ? 'Catatan: Metrik Open Interest & Funding di bawah dihitung menggunakan model estimasi korelasi volatilitas & tren harga 24 jam.'
                  : 'Notice: Derivatives metrics below are computed using a 24-hour volatility-price correlation estimation model.'}
              </span>
            </div>

            {/* Top 4 Derivatives Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Notional Open Interest */}
              <div className={`p-4 rounded-[2px] border ${
                isDark ? 'bg-[#0b0f19] border-slate-800/80' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className="text-xs text-slate-400 font-mono uppercase font-bold block mb-1">
                  {isId ? 'Open Interest (~Est)' : 'Open Interest (~Est)'}
                </span>
                <div className="text-xl font-black font-mono text-pink-400">
                  ~${(derivatives.openInterestUsd / 1000000000).toFixed(2)}B
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs font-mono">
                  <span className={`font-bold ${derivatives.oiChange24hPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {derivatives.oiChange24hPct >= 0 ? '+' : ''}{derivatives.oiChange24hPct}% (24h)
                  </span>
                  <span className="text-slate-500">|</span>
                  <span className="text-slate-400">{derivatives.oiChange4hPct >= 0 ? '+' : ''}{derivatives.oiChange4hPct}% (4h)</span>
                </div>
              </div>

              {/* Card 2: 8h Funding Rate */}
              <div className={`p-4 rounded-[2px] border ${
                isDark ? 'bg-[#0b0f19] border-slate-800/80' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className="text-xs text-slate-400 font-mono uppercase font-bold block mb-1">
                  {isId ? 'Funding Rate 8h (~Est)' : 'Funding Rate 8h (~Est)'}
                </span>
                <div className={`text-xl font-black font-mono ${
                  derivatives.fundingRate8h > 0.02
                    ? 'text-amber-400'
                    : derivatives.fundingRate8h < 0
                    ? 'text-rose-400'
                    : 'text-emerald-400'
                }`}>
                  {derivatives.fundingRate8h >= 0 ? '+' : ''}{(derivatives.fundingRate8h * 100).toFixed(4)}%
                </div>
                <div className="mt-2 flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>Ann: {derivatives.fundingRateAnnualized}%</span>
                  <span className="text-slate-500">Next: {derivatives.predictedNextFunding >= 0 ? '+' : ''}{(derivatives.predictedNextFunding * 100).toFixed(4)}%</span>
                </div>
              </div>

              {/* Card 3: Long / Short Ratio */}
              <div className={`p-4 rounded-[2px] border ${
                isDark ? 'bg-[#0b0f19] border-slate-800/80' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className="text-xs text-slate-400 font-mono uppercase font-bold block mb-1">
                  {isId ? 'Rasio Long / Short (~Est)' : 'Long/Short Ratio (~Est)'}
                </span>
                <div className={`text-xl font-black font-mono flex items-center justify-between ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                  <span>{derivatives.longShortRatio}</span>
                  <span className="text-xs font-mono text-emerald-400">{derivatives.longPercent}% Long</span>
                </div>
                <div className={`w-full h-2 rounded-[2px] overflow-hidden mt-2 flex ${isDark ? 'bg-rose-500/40' : 'bg-rose-200'}`}>
                  <div
                    className="h-full bg-emerald-500"
                    style={{ width: `${derivatives.longPercent}%` }}
                  />
                </div>
                <div className="mt-1 text-right text-[11px] font-mono text-rose-400">
                  {derivatives.shortPercent}% Short
                </div>
              </div>

              {/* Card 4: Derivatives Market Heat Status */}
              <div className={`p-4 rounded-[2px] border ${
                isDark ? 'bg-[#0b0f19] border-slate-800/80' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className="text-xs text-slate-400 font-mono uppercase font-bold block mb-1">
                  {isId ? 'Status Sentimen Derivatif' : 'Derivatives Sentiment'}
                </span>
                <div className="text-sm font-black font-mono text-amber-400">
                  {derivatives.fundingSentiment.replace(/_/g, ' ')}
                </div>
                <p className={`mt-2 text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {derivatives.fundingRate8h > 0.02
                    ? (isId ? 'Posisi long padat, waspada long squeeze' : 'Crowded longs, long squeeze risk')
                    : (isId ? 'Keseimbangan leverage sehat' : 'Healthy leverage equilibrium')}
                </p>
              </div>
            </div>

            {/* OI vs Price Divergence Master Diagnosis */}
            <div className={`p-5 rounded-[2px] border ${
              isDark ? 'bg-[#0b0f19] border-pink-500/30' : 'bg-pink-50/50 border-pink-200'
            }`}>
              <div className="flex items-center gap-2.5 mb-2">
                <ShieldAlert className="w-5 h-5 text-pink-400" />
                <h4 className="text-sm font-bold font-mono uppercase tracking-wider text-pink-400">
                  {isId ? 'Diagnosis Divergensi Open Interest vs Harga' : 'Open Interest vs Price Divergence Analysis'}
                </h4>
                <span className={`text-[11px] font-mono px-2 py-0.5 rounded-[2px] font-bold ml-auto border ${
                  isDark ? 'bg-pink-500/20 text-pink-300 border-pink-500/30' : 'bg-pink-100 text-pink-800 border-pink-300'
                }`}>
                  {derivatives.oiPriceDivergence.type.replace(/_/g, ' ')}
                </span>
              </div>

              <p className={`text-xs sm:text-sm font-mono leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                {derivatives.oiPriceDivergence.explanation}
              </p>

              <div className={`mt-3 pt-3 border-t flex items-center gap-2 text-xs font-mono ${
                isDark ? 'border-slate-800 text-amber-300' : 'border-pink-200 text-amber-800'
              }`}>
                <span className="font-bold uppercase text-amber-400">{isId ? 'Implikasi Aksi:' : 'Action Rule:'}</span>
                <span>{derivatives.oiPriceDivergence.actionImplication}</span>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: ANCHORED VWAP MULTI-STRUCTURE                     */}
        {/* ======================================================== */}
        {activeTab === 'avwap' && (
          <div className="space-y-5">
            {/* Top Anchor Status Summary */}
            <div className={`p-4 rounded-[2px] border flex flex-wrap items-center justify-between gap-3 ${
              isDark ? 'bg-[#0b0f19] border-slate-800/80' : 'bg-slate-50 border-slate-200'
            }`}>
              <div>
                <span className="text-xs text-slate-400 font-mono uppercase font-bold block">
                  {isId ? 'Zona Penentuan Harga AVWAP' : 'Current AVWAP Zone'}
                </span>
                <span className={`text-base font-black font-mono ${isDark ? 'text-pink-300' : 'text-pink-600'}`}>
                  {anchoredVWAP.currentZone.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="text-right font-mono">
                <span className="text-xs text-slate-400 uppercase font-bold block">
                  {isId ? 'Anchor Dominan' : 'Dominant Anchor'}
                </span>
                <span className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{anchoredVWAP.dominantAnchor}</span>
              </div>
            </div>

            {/* 4 Multi-Anchor Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Anchor 1: Daily Session VWAP */}
              <div className={`p-4 rounded-[2px] border ${
                isDark ? 'bg-[#0b0f19] border-slate-800/80' : 'bg-white border-slate-200 shadow-2xs'
              }`}>
                <div className="flex items-center justify-between mb-2 font-mono">
                  <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>{anchoredVWAP.sessionVWAP.label}</span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-[2px] ${
                    anchoredVWAP.sessionVWAP.distancePct >= 0
                      ? isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : isDark ? 'bg-rose-500/15 text-rose-400' : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    {anchoredVWAP.sessionVWAP.distancePct >= 0 ? '+' : ''}{anchoredVWAP.sessionVWAP.distancePct}%
                  </span>
                </div>
                <div className={`text-xl font-black font-mono mb-2 ${isDark ? 'text-pink-300' : 'text-pink-600'}`}>
                  ${formatPrice(anchoredVWAP.sessionVWAP.vwap)}
                </div>
                <div className={`grid grid-cols-2 gap-2 text-xs font-mono border-t pt-2 ${
                  isDark ? 'text-slate-400 border-slate-800/60' : 'text-slate-600 border-slate-200'
                }`}>
                  <span>+1σ: ${formatPrice(anchoredVWAP.sessionVWAP.upperBand1)}</span>
                  <span>+2σ: ${formatPrice(anchoredVWAP.sessionVWAP.upperBand2)}</span>
                  <span>-1σ: ${formatPrice(anchoredVWAP.sessionVWAP.lowerBand1)}</span>
                  <span>-2σ: ${formatPrice(anchoredVWAP.sessionVWAP.lowerBand2)}</span>
                </div>
              </div>

              {/* Anchor 2: Weekly Anchored VWAP */}
              <div className={`p-4 rounded-[2px] border ${
                isDark ? 'bg-[#0b0f19] border-slate-800/80' : 'bg-white border-slate-200 shadow-2xs'
              }`}>
                <div className="flex items-center justify-between mb-2 font-mono">
                  <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>{anchoredVWAP.weeklyVWAP.label}</span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-[2px] ${
                    anchoredVWAP.weeklyVWAP.distancePct >= 0
                      ? isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : isDark ? 'bg-rose-500/15 text-rose-400' : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    {anchoredVWAP.weeklyVWAP.distancePct >= 0 ? '+' : ''}{anchoredVWAP.weeklyVWAP.distancePct}%
                  </span>
                </div>
                <div className="text-xl font-black font-mono text-indigo-400 mb-2">
                  ${formatPrice(anchoredVWAP.weeklyVWAP.vwap)}
                </div>
                <p className={`text-xs font-mono border-t pt-2 ${
                  isDark ? 'text-slate-400 border-slate-800/60' : 'text-slate-600 border-slate-200'
                }`}>
                  {isId
                    ? 'Titik ekuilibrium volume institusional mingguan (Reset Senin 00:00 UTC)'
                    : 'Weekly volume-weighted institutional baseline (Reset Monday 00:00 UTC)'}
                </p>
              </div>

              {/* Anchor 3: Swing High Anchored VWAP (Resistance Anchor) */}
              <div className={`p-4 rounded-[2px] border ${
                isDark ? 'bg-[#0b0f19] border-slate-800/80' : 'bg-white border-slate-200 shadow-2xs'
              }`}>
                <div className="flex items-center justify-between mb-2 font-mono">
                  <span className="text-xs font-bold text-rose-400">AVWAP Swing High (Resistance)</span>
                  <span className="text-xs font-mono text-slate-400">Anchor: ${formatPrice(anchoredVWAP.swingHighAVWAP.anchorPrice)}</span>
                </div>
                <div className="text-xl font-black font-mono text-rose-400 mb-2">
                  ${formatPrice(anchoredVWAP.swingHighAVWAP.vwap)}
                </div>
                <p className={`text-xs font-mono border-t pt-2 ${
                  isDark ? 'text-slate-400 border-slate-800/60' : 'text-slate-600 border-slate-200'
                }`}>
                  {isId
                    ? 'Rata-rata modal seluruh penjual sejak puncak lokal. Hambatan resistensi utama.'
                    : 'Average cost basis of all sellers since swing high. Major overhead resistance.'}
                </p>
              </div>

              {/* Anchor 4: Swing Low Anchored VWAP (Support Anchor) */}
              <div className={`p-4 rounded-[2px] border ${
                isDark ? 'bg-[#0b0f19] border-slate-800/80' : 'bg-white border-slate-200 shadow-2xs'
              }`}>
                <div className="flex items-center justify-between mb-2 font-mono">
                  <span className="text-xs font-bold text-emerald-400">AVWAP Swing Low (Support)</span>
                  <span className="text-xs font-mono text-slate-400">Anchor: ${formatPrice(anchoredVWAP.swingLowAVWAP.anchorPrice)}</span>
                </div>
                <div className="text-xl font-black font-mono text-emerald-400 mb-2">
                  ${formatPrice(anchoredVWAP.swingLowAVWAP.vwap)}
                </div>
                <p className={`text-xs font-mono border-t pt-2 ${
                  isDark ? 'text-slate-400 border-slate-800/60' : 'text-slate-600 border-slate-200'
                }`}>
                  {isId
                    ? 'Rata-rata modal seluruh pembeli sejak dasar lokal. Landasan support defensif.'
                    : 'Average cost basis of all buyers since swing low. Major defensive support.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
