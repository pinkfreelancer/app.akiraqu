import React from 'react';
import {
  OHLCVCandle,
  Timeframe,
  ConfluenceEvaluation,
  SupportedExchange,
  MarketType,
  WebSocketSyncMetrics,
} from '../../types/crypto.types';
import { Language } from '../../i18n/translations';
import { InteractiveChart } from '../InteractiveChart';
import { formatCryptoPrice } from '../../utils/formatters';
import {
  Maximize2,
  Minimize2,
  Radio,
  Gauge,
  Sparkles,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Layers,
  ChevronRight,
  Zap,
  Activity,
  Sliders,
  Flame,
} from 'lucide-react';

interface MasterAnchorChartProps {
  candles: OHLCVCandle[];
  symbol: string;
  timeframe: Timeframe;
  evaluation: ConfluenceEvaluation | null;
  livePrice?: number;
  priceDirection?: 'up' | 'down' | 'neutral';
  wsStatus?: 'connected' | 'connecting' | 'fallback';
  latencyMs?: number;
  syncMetrics?: WebSocketSyncMetrics;
  selectedExchange?: SupportedExchange;
  selectedMarketType?: MarketType;
  onSelectTimeframe: (tf: Timeframe) => void;
  onSelectExchange?: (ex: SupportedExchange) => void;
  onSelectMarketType?: (mt: MarketType) => void;
  onTriggerAnalyze?: () => void;
  onNavigateToStage?: (stage: string) => void;
  isLoading?: boolean;
  lang?: Language;
  theme?: 'light' | 'dark';
  onCloseSplit?: () => void;
}

export const MasterAnchorChart: React.FC<MasterAnchorChartProps> = ({
  candles,
  symbol,
  timeframe,
  evaluation,
  livePrice,
  priceDirection = 'neutral',
  wsStatus = 'connected',
  latencyMs = 18,
  selectedExchange = 'BINANCE',
  selectedMarketType = 'SPOT',
  onSelectTimeframe,
  onSelectExchange,
  onSelectMarketType,
  onTriggerAnalyze,
  onNavigateToStage,
  isLoading = false,
  lang = 'id',
  theme = 'dark',
  onCloseSplit,
}) => {
  const isDark = theme === 'dark';
  const isId = lang === 'id';

  const TIMEFRAMES: Timeframe[] = ['1m', '5m', '15m', '1H', '4H', '1D'];

  const displayPrice = livePrice || candles[candles.length - 1]?.close || 0;
  const prevPrice = candles[0]?.open || displayPrice;
  const priceChangePct = prevPrice > 0 ? ((displayPrice - prevPrice) / prevPrice) * 100 : 0;
  const isPositive = priceChangePct >= 0;

  return (
    <div
      id="master-anchor-chart-container"
      className={`flex flex-col h-full rounded-2xl border transition-all duration-200 overflow-hidden shadow-lg ${
        isDark ? 'bg-[#090d16] border-[#1e293b] shadow-black/50' : 'bg-white border-slate-200 shadow-sm'
      }`}
    >
      {/* 1. Header Ticker & Control Bar */}
      <div
        className={`px-3 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 border-b shrink-0 ${
          isDark ? 'border-slate-800/80 bg-[#0e1626]/80' : 'border-slate-100 bg-slate-50'
        }`}
      >
        {/* Left: Ticker Symbol & Live Price */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-pink-500/10 border border-pink-500/30 text-pink-400 font-mono text-xs font-bold">
            <Radio className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
            <span>{isId ? 'JANGKAR GRAFIK' : 'ANCHOR CHART'}</span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="font-mono font-bold text-sm sm:text-base text-slate-100">{symbol}</span>
            <span
              className={`font-mono text-sm sm:text-base font-bold ${
                priceDirection === 'up'
                  ? 'text-emerald-400'
                  : priceDirection === 'down'
                  ? 'text-rose-400'
                  : 'text-slate-200'
              }`}
            >
              ${formatCryptoPrice(displayPrice)}
            </span>
            <span
              className={`text-[11px] font-mono font-semibold flex items-center gap-0.5 ${
                isPositive ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {isPositive ? '+' : ''}
              {priceChangePct.toFixed(2)}%
            </span>
          </div>

          {/* Confluence Score Badge */}
          {evaluation && (
            <div
              className={`hidden md:flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold border ${
                evaluation.confluenceScore >= 70
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : evaluation.confluenceScore <= 40
                  ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                  : 'bg-pink-500/15 text-pink-300 border-pink-500/30'
              }`}
              title={isId ? 'Skor Konfluensi Kuantitatif' : 'Quantitative Confluence Score'}
            >
              <Gauge className="w-3 h-3" />
              <span>{evaluation.confluenceScore}/100</span>
              <span className="text-[9px] uppercase opacity-75">({evaluation.marketBias})</span>
            </div>
          )}
        </div>

        {/* Right: Quick Timeframe Selector & Actions */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          {/* Timeframe Pills */}
          <div className="flex items-center gap-0.5 bg-slate-900/60 p-0.5 rounded-lg border border-slate-800">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => onSelectTimeframe(tf)}
                className={`px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-mono font-semibold transition-all cursor-pointer ${
                  timeframe === tf
                    ? 'bg-pink-600 text-white shadow-xs font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Quick Analyze Button */}
          {onTriggerAnalyze && (
            <button
              type="button"
              onClick={onTriggerAnalyze}
              disabled={isLoading}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1 font-mono text-[11px] font-bold ${
                isLoading
                  ? 'bg-pink-500/20 border-pink-500/40 text-pink-300 animate-pulse cursor-not-allowed'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-pink-300 hover:border-pink-500/40'
              }`}
              title={isId ? 'Jalankan Analisis Kuantitatif' : 'Run Quantitative Analysis'}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-pink-400' : 'text-slate-400'}`} />
              <span className="hidden xl:inline">{isId ? 'Scan' : 'Scan'}</span>
            </button>
          )}

          {/* Full Chart Stage Link */}
          {onNavigateToStage && (
            <button
              type="button"
              onClick={() => onNavigateToStage('ticker')}
              className="p-1.5 rounded-lg border border-slate-700 bg-slate-800/80 text-slate-300 hover:text-pink-300 hover:border-pink-500/40 transition-colors cursor-pointer"
              title={isId ? 'Buka Halaman Grafik Penuh' : 'Open Full Chart Stage'}
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Close Split Button */}
          {onCloseSplit && (
            <button
              type="button"
              onClick={onCloseSplit}
              className="p-1.5 rounded-lg border border-slate-700 bg-slate-800/80 text-slate-400 hover:text-rose-300 hover:border-rose-500/40 transition-colors cursor-pointer"
              title={isId ? 'Tutup Tampilan Split (Kembali ke Alur Penuh)' : 'Close Split View'}
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Interactive Chart Body */}
      <div className="flex-1 min-h-[380px] sm:min-h-[440px] p-2 relative">
        <InteractiveChart
          candles={candles}
          symbol={symbol}
          timeframe={timeframe}
          indicators={evaluation?.indicators}
          selectedExchange={selectedExchange}
          selectedMarketType={selectedMarketType}
          onSelectExchange={onSelectExchange}
          onSelectMarketType={onSelectMarketType}
          latencyMs={latencyMs}
          wsStatus={wsStatus}
          lang={lang}
          theme={theme}
        />
      </div>

      {/* 3. Bottom Context Quick Navigation Bar */}
      {onNavigateToStage && (
        <div
          className={`px-3 py-1.5 border-t flex items-center justify-between gap-2 shrink-0 text-xs font-mono ${
            isDark ? 'border-slate-800/80 bg-[#090d16] text-slate-400' : 'border-slate-100 bg-slate-50 text-slate-600'
          }`}
        >
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            <span className="text-[10px] text-slate-500 uppercase font-bold shrink-0">
              {isId ? 'Akses Cepat:' : 'Quick Jump:'}
            </span>
            <button
              type="button"
              onClick={() => onNavigateToStage('confluence')}
              className="px-2 py-0.5 rounded bg-slate-800/60 hover:bg-pink-600/30 text-slate-300 hover:text-pink-300 transition-colors shrink-0"
            >
              Konfluensi
            </button>
            <button
              type="button"
              onClick={() => onNavigateToStage('risk')}
              className="px-2 py-0.5 rounded bg-slate-800/60 hover:bg-pink-600/30 text-slate-300 hover:text-pink-300 transition-colors shrink-0"
            >
              Kalkulator Risiko
            </button>
            <button
              type="button"
              onClick={() => onNavigateToStage('orderflow')}
              className="px-2 py-0.5 rounded bg-slate-800/60 hover:bg-pink-600/30 text-slate-300 hover:text-pink-300 transition-colors shrink-0"
            >
              Order Flow
            </button>
            <button
              type="button"
              onClick={() => onNavigateToStage('manual_trading')}
              className="px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 hover:bg-pink-500/30 transition-colors shrink-0 font-bold"
            >
              Eksekusi Trading
            </button>
          </div>

          <span className="text-[10px] text-slate-500 shrink-0 hidden sm:inline">
            WS: <strong className="text-emerald-400">{latencyMs}ms</strong>
          </span>
        </div>
      )}
    </div>
  );
};
