import React, { useState, useRef, useEffect, useMemo } from 'react';
import { OHLCVCandle, IndicatorsSnapshot, Timeframe, LiquidationCluster, SupportedExchange, MarketType } from '../types/crypto.types';
import { Eye, EyeOff, Layers, Maximize2, Minimize2, Flame, Waves, X } from 'lucide-react';
import { Language, getTranslation } from '../i18n/translations';
import { computeLiquidationHeatmap } from '../services/liquidation/liquidationEngine';
import { computeAnchoredVWAPs } from '../services/marketMaker/mmEngine';
import { formatCryptoPrice } from '../utils/formatters';
import { ExchangeMarketSelector } from './ExchangeMarketSelector';

function formatChartPrice(val: number): string {
  return formatCryptoPrice(val);
}

function formatAxisPrice(val: number): string {
  if (isNaN(val) || val === 0) return '0';
  if (val >= 1000) return val.toLocaleString(undefined, { maximumFractionDigits: 0 });
  return formatCryptoPrice(val);
}

interface InteractiveChartProps {
  candles: OHLCVCandle[];
  symbol: string;
  timeframe: Timeframe;
  indicators?: IndicatorsSnapshot;
  lang?: Language;
  selectedExchange?: SupportedExchange;
  selectedMarketType?: MarketType;
  onSelectExchange?: (exchange: SupportedExchange) => void;
  onSelectMarketType?: (marketType: MarketType) => void;
  latencyMs?: number;
  wsStatus?: 'connected' | 'connecting' | 'fallback';
  theme?: 'light' | 'dark';
}

export const InteractiveChart: React.FC<InteractiveChartProps> = React.memo(({
  candles,
  symbol,
  timeframe,
  indicators,
  lang = 'id',
  selectedExchange = 'BINANCE',
  selectedMarketType = 'SPOT',
  onSelectExchange,
  onSelectMarketType,
  latencyMs = 18,
  wsStatus = 'connected',
  theme = 'dark',
}) => {
  const t = getTranslation(lang);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 750, height: 440 });
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [isChartFullscreen, setIsChartFullscreen] = useState(false);

  // Overlay Toggles
  const [showVWAP, setShowVWAP] = useState(true);
  const [showAVWAP, setShowAVWAP] = useState(true);
  const [showSMC, setShowSMC] = useState(true);
  const [showFib, setShowFib] = useState(true);
  const [showSR, setShowSR] = useState(true);
  const [showLiqHeatmap, setShowLiqHeatmap] = useState(true);

  // Compute real-time liquidation clusters & squeeze magnets
  const liqSummary = useMemo(() => {
    return computeLiquidationHeatmap(candles, symbol);
  }, [candles, symbol]);

  // Compute Multi-Anchor Anchored VWAP (Daily Session, Weekly, Swing High/Low)
  const avwapSummary = useMemo(() => {
    const lastPrice = candles.length > 0 ? candles[candles.length - 1].close : 0;
    return computeAnchoredVWAPs(candles, lastPrice);
  }, [candles]);

  // Handle escape key to exit fullscreen chart mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isChartFullscreen) {
        setIsChartFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isChartFullscreen]);

  // Measure container dimensions dynamically with responsive height calculation
  useEffect(() => {
    if (!containerRef.current) return;
    const updateDimensions = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const currentWidth = Math.max(300, rect.width || containerRef.current.clientWidth);
      
      let computedHeight = 440;
      if (isChartFullscreen) {
        computedHeight = Math.max(480, window.innerHeight - 170);
      } else if (currentWidth < 640) {
        computedHeight = 320;
      } else if (currentWidth < 1024) {
        computedHeight = 380;
      } else {
        computedHeight = 450;
      }

      setDimensions({
        width: currentWidth,
        height: computedHeight,
      });
    };

    updateDimensions();

    const observer = new ResizeObserver(() => {
      updateDimensions();
    });
    observer.observe(containerRef.current);
    window.addEventListener('resize', updateDimensions);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateDimensions);
    };
  }, [isChartFullscreen]);

  if (!candles || candles.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 bg-[#0f172a] rounded-xl border border-[#1e293b] text-slate-400">
        Loading real-time candlestick telemetry...
      </div>
    );
  }

  // Chart coordinate calculations
  const padding = { top: 25, right: 65, bottom: 50, left: 15 };
  const chartWidth = dimensions.width - padding.left - padding.right;
  const chartHeight = dimensions.height - padding.top - padding.bottom;
  const priceChartHeight = chartHeight * 0.78;
  const volumeChartHeight = chartHeight * 0.20;
  const volumeTop = padding.top + priceChartHeight + 10;

  // Min & Max Price
  const allHighs = candles.map((c) => c.high);
  const allLows = candles.map((c) => c.low);
  const rawMinPrice = Math.min(...allLows);
  const rawMaxPrice = Math.max(...allHighs);
  const priceMargin = (rawMaxPrice - rawMinPrice) * 0.08 || 1;
  const minPrice = rawMinPrice - priceMargin;
  const maxPrice = rawMaxPrice + priceMargin;
  const priceRange = maxPrice - minPrice || 1;

  // Max Volume
  const maxVolume = Math.max(...candles.map((c) => c.volume), 1);

  // Coordinate scales
  const candleCount = candles.length;
  const candleStep = chartWidth / candleCount;
  const candleWidth = Math.max(2, Math.min(14, candleStep * 0.72));

  const getY = (price: number) => {
    return padding.top + (1 - (price - minPrice) / priceRange) * priceChartHeight;
  };

  const getX = (index: number) => {
    return padding.left + index * candleStep + candleStep / 2;
  };

  // Active candle for inspect
  const activeCandle = (hoverIndex !== null && hoverIndex >= 0 && hoverIndex < candles.length) 
    ? candles[hoverIndex] 
    : candles[candles.length - 1];
  const isUpActive = activeCandle ? activeCandle.close >= activeCandle.open : true;
  const pctChange = activeCandle ? (((activeCandle.close - activeCandle.open) / (activeCandle.open || 1)) * 100).toFixed(2) : '0.00';

  // VWAP points for polyline
  const vwapValue = indicators?.vwap.vwap;
  const vwapPoints = candles
    .map((_c, i) => {
      // Calculate micro-trend vwap curve based on VWAP indicator
      const progress = i / (candles.length - 1);
      const curveVal = (vwapValue || candles[i].close) * (0.995 + progress * 0.01);
      return `${getX(i)},${getY(curveVal)}`;
    })
    .join(' ');

  return (
    <div className={`flex flex-col bg-[#0f172a] rounded-xl border border-[#1e293b] p-3 sm:p-4 shadow-md transition-all duration-200 ${
      isChartFullscreen ? 'fixed inset-0 z-50 rounded-none border-none p-4 sm:p-6 overflow-y-auto bg-[#090d16]' : 'relative'
    }`}>
      {/* Optional Top Exchange and Market Type Selector */}
      {onSelectExchange && onSelectMarketType && (
        <div className="mb-2.5">
          <ExchangeMarketSelector
            selectedExchange={selectedExchange}
            selectedMarketType={selectedMarketType}
            onSelectExchange={onSelectExchange}
            onSelectMarketType={onSelectMarketType}
            latencyMs={latencyMs}
            wsStatus={wsStatus}
            theme={theme}
          />
        </div>
      )}

      {/* Chart Top Bar & Overlays Controller */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-[#1e293b]">
        {/* Active Candle Telemetry */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5 font-bold text-white text-sm">
            <span>{symbol}</span>
            <span className="px-1.5 py-0.5 rounded-[2px] text-[11px] bg-slate-800 text-pink-400 border border-slate-700">
              {timeframe}
            </span>
          </div>
          <div className="text-slate-400">
            O: <span className="text-slate-200">${formatChartPrice(activeCandle.open)}</span>
          </div>
          <div className="text-slate-400">
            H: <span className="text-emerald-400">${formatChartPrice(activeCandle.high)}</span>
          </div>
          <div className="text-slate-400">
            L: <span className="text-rose-400">${formatChartPrice(activeCandle.low)}</span>
          </div>
          <div className="text-slate-400">
            C: <span className={isUpActive ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
              ${formatChartPrice(activeCandle.close)}
            </span>
          </div>
          <div className={`font-semibold ${isUpActive ? 'text-emerald-400' : 'text-rose-400'}`}>
            ({isUpActive ? '+' : ''}{pctChange}%)
          </div>
          <div className="text-slate-400 hidden sm:inline-block">
            Vol: {activeCandle.volume.toLocaleString()}
          </div>
        </div>

        {/* Toggle Overlays and Maximize Controls */}
        <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 text-xs font-mono">
          <button
            id="chart-toggle-vwap"
            type="button"
            onClick={() => setShowVWAP(!showVWAP)}
            className={`px-2.5 py-1 rounded-[2px] text-xs font-medium transition-colors cursor-pointer border min-h-[32px] ${
              showVWAP ? 'bg-pink-500/20 text-pink-300 border-pink-500/40' : 'text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            VWAP
          </button>
          <button
            id="chart-toggle-avwap"
            type="button"
            onClick={() => setShowAVWAP(!showAVWAP)}
            className={`px-2.5 py-1 rounded-[2px] text-xs font-medium transition-colors cursor-pointer border min-h-[32px] flex items-center gap-1 ${
              showAVWAP ? 'bg-indigo-950/60 text-indigo-300 border-indigo-500/50' : 'text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title="Anchored VWAP (Daily Session, Swing High, Swing Low)"
          >
            <Waves className="w-3.5 h-3.5 text-indigo-400" />
            <span>AVWAP</span>
          </button>
          <button
            id="chart-toggle-smc"
            type="button"
            onClick={() => setShowSMC(!showSMC)}
            className={`px-2.5 py-1 rounded-[2px] text-xs font-medium transition-colors cursor-pointer border min-h-[32px] ${
              showSMC ? 'bg-amber-950/60 text-amber-300 border-amber-500/50' : 'text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            SMC / OB
          </button>
          <button
            id="chart-toggle-fib"
            type="button"
            onClick={() => setShowFib(!showFib)}
            className={`px-2.5 py-1 rounded-[2px] text-xs font-medium transition-colors cursor-pointer border min-h-[32px] ${
              showFib ? 'bg-slate-800 text-pink-300 border-pink-500/40' : 'text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            Fib GP
          </button>
          <button
            id="chart-toggle-sr"
            type="button"
            onClick={() => setShowSR(!showSR)}
            className={`px-2.5 py-1 rounded-[2px] text-xs font-medium transition-colors cursor-pointer border min-h-[32px] ${
              showSR ? 'bg-slate-800 text-slate-200 border-slate-600' : 'text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            S/R
          </button>
          <button
            id="chart-toggle-liq-heatmap"
            type="button"
            onClick={() => setShowLiqHeatmap(!showLiqHeatmap)}
            className={`px-2.5 py-1 rounded-[2px] text-xs font-medium transition-colors cursor-pointer border flex items-center gap-1 min-h-[32px] ${
              showLiqHeatmap
                ? 'bg-amber-950/60 text-amber-300 border-amber-500/50'
                : 'text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title={lang === 'id' ? 'Tampilkan Heatmap Klaster Likuidasi' : 'Toggle Liquidation Heatmap Overlay'}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Liq Heatmap</span>
          </button>

          {/* Fullscreen Chart Toggle */}
          <button
            id="btn-chart-maximize"
            type="button"
            onClick={() => setIsChartFullscreen(!isChartFullscreen)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-[2px] text-xs font-medium transition-colors cursor-pointer border min-h-[32px] ${
              isChartFullscreen
                ? 'bg-slate-700 text-white font-semibold border-slate-500'
                : 'text-slate-300 hover:text-white bg-slate-800/80 border-slate-700 hover:border-slate-500'
            }`}
            title={isChartFullscreen ? (lang === 'id' ? 'Kecilkan Grafik (ESC)' : 'Exit Fullscreen Chart (ESC)') : (lang === 'id' ? 'Maksimalkan Grafik Layar Penuh' : 'Maximize Chart View')}
          >
            {isChartFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">
              {isChartFullscreen ? (lang === 'id' ? 'Kecilkan' : 'Exit Full') : (lang === 'id' ? 'Layar Penuh' : 'Fullscreen')}
            </span>
          </button>
        </div>
      </div>

      {/* SVG Canvas */}
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden select-none cursor-crosshair pt-2"
        onMouseMove={(e) => {
          if (!containerRef.current) return;
          const rect = containerRef.current.getBoundingClientRect();
          const mouseX = e.clientX - rect.left - padding.left;
          const idx = Math.floor(mouseX / candleStep);
          if (idx >= 0 && idx < candleCount) {
            setHoverIndex(idx);
          }
        }}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <svg
          width={dimensions.width}
          height={dimensions.height}
          className="w-full block overflow-visible"
        >
          <defs>
            {/* Grid line pattern */}
            <linearGradient id="volUp" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="volDown" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Background Grid Lines & Price Labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const p = minPrice + ratio * priceRange;
            const y = getY(p);
            return (
              <g key={ratio}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={dimensions.width - padding.right}
                  y2={y}
                  stroke="#1e293b"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <text
                  x={dimensions.width - padding.right + 8}
                  y={y + 3}
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="JetBrains Mono, monospace"
                >
                  ${formatAxisPrice(p)}
                </text>
              </g>
            );
          })}

          {/* Fibonacci Golden Pocket Overlay */}
          {showFib && indicators?.fibonacci && (
            <g>
              {/* Golden Pocket Shade (0.5 to 0.618) */}
              <rect
                x={padding.left}
                y={getY(indicators.fibonacci.goldenPocket.max)}
                width={chartWidth}
                height={Math.max(2, getY(indicators.fibonacci.goldenPocket.min) - getY(indicators.fibonacci.goldenPocket.max))}
                fill="#f59e0b"
                fillOpacity="0.08"
              />
              <line
                x1={padding.left}
                y1={getY(indicators.fibonacci.goldenPocket.max)}
                x2={dimensions.width - padding.right}
                y2={getY(indicators.fibonacci.goldenPocket.max)}
                stroke="#f59e0b"
                strokeWidth="1"
                strokeDasharray="4 2"
              />
              <text
                x={padding.left + 5}
                y={getY(indicators.fibonacci.goldenPocket.max) - 4}
                fill="#f59e0b"
                fontSize="9"
                fontFamily="JetBrains Mono, monospace"
              >
                Fib 0.618 Golden Pocket (${formatChartPrice(indicators.fibonacci.goldenPocket.max)})
              </text>
            </g>
          )}

          {/* SMC Order Blocks Highlight */}
          {showSMC && indicators?.smc && (
            <g>
              {indicators.smc.orderBlocks.map((ob, i) => {
                const isBull = ob.type === 'BULLISH_OB';
                const yTop = getY(ob.high);
                const yBottom = getY(ob.low);
                const h = Math.max(3, yBottom - yTop);
                return (
                  <g key={i}>
                    <rect
                      x={padding.left + chartWidth * 0.4}
                      y={yTop}
                      width={chartWidth * 0.6}
                      height={h}
                      fill={isBull ? '#00F2FE' : '#FF3366'}
                      fillOpacity="0.12"
                      stroke={isBull ? '#00F2FE' : '#FF3366'}
                      strokeWidth="1"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={padding.left + chartWidth * 0.42}
                      y={yTop + 11}
                      fill={isBull ? '#00F2FE' : '#FF3366'}
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {isBull ? 'Unmitigated Bullish OB' : 'Bearish Supply OB'}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* Key Support & Resistance Lines (Clipped to visible price canvas) */}
          {showSR && indicators?.priceAction && (() => {
            const yRes = getY(indicators.priceAction.keyResistance);
            const ySup = getY(indicators.priceAction.keySupport);
            const resVisible = yRes >= padding.top && yRes <= padding.top + priceChartHeight;
            const supVisible = ySup >= padding.top && ySup <= padding.top + priceChartHeight;

            return (
              <g>
                {resVisible && (
                  <>
                    <line
                      x1={padding.left}
                      y1={yRes}
                      x2={dimensions.width - padding.right}
                      y2={yRes}
                      stroke="#ef4444"
                      strokeWidth="1.2"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={dimensions.width - padding.right - 80}
                      y={yRes - 4}
                      fill="#ef4444"
                      fontSize="9"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      Major Resistance
                    </text>
                  </>
                )}

                {supVisible && (
                  <>
                    <line
                      x1={padding.left}
                      y1={ySup}
                      x2={dimensions.width - padding.right}
                      y2={ySup}
                      stroke="#10b981"
                      strokeWidth="1.2"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={dimensions.width - padding.right - 70}
                      y={ySup + 12}
                      fill="#10b981"
                      fontSize="9"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {t.chart.support}
                    </text>
                  </>
                )}
              </g>
            );
          })()}

          {/* Institutional VWAP Polyline */}
          {showVWAP && vwapValue && (
            <polyline
              points={vwapPoints}
              fill="none"
              stroke="#06b6d4"
              strokeWidth="1.8"
              strokeOpacity="0.85"
            />
          )}

          {/* Multi-Anchor Anchored VWAP (AVWAP) Overlays */}
          {showAVWAP && avwapSummary && (() => {
            const yHighAnchor = getY(avwapSummary.swingHighAVWAP.vwap);
            const yLowAnchor = getY(avwapSummary.swingLowAVWAP.vwap);
            const ySession = getY(avwapSummary.sessionVWAP.vwap);

            return (
              <g className="avwap-overlays">
                {/* Swing High Resistance AVWAP */}
                {yHighAnchor >= padding.top && yHighAnchor <= padding.top + priceChartHeight && (
                  <g>
                    <line
                      x1={padding.left}
                      y1={yHighAnchor}
                      x2={dimensions.width - padding.right}
                      y2={yHighAnchor}
                      stroke="#f43f5e"
                      strokeWidth="1.5"
                      strokeDasharray="6 3"
                    />
                    <rect
                      x={padding.left + 8}
                      y={yHighAnchor - 10}
                      width={145}
                      height={18}
                      fill="#0f172a"
                      stroke="#f43f5e"
                      strokeWidth="0.8"
                      rx="2"
                    />
                    <text
                      x={padding.left + 12}
                      y={yHighAnchor + 3}
                      fill="#f43f5e"
                      fontSize="11"
                      fontWeight="bold"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      AVWAP High: ${formatChartPrice(avwapSummary.swingHighAVWAP.vwap)}
                    </text>
                  </g>
                )}

                {/* Swing Low Support AVWAP */}
                {yLowAnchor >= padding.top && yLowAnchor <= padding.top + priceChartHeight && (
                  <g>
                    <line
                      x1={padding.left}
                      y1={yLowAnchor}
                      x2={dimensions.width - padding.right}
                      y2={yLowAnchor}
                      stroke="#10b981"
                      strokeWidth="1.5"
                      strokeDasharray="6 3"
                    />
                    <rect
                      x={padding.left + 8}
                      y={yLowAnchor - 10}
                      width={145}
                      height={18}
                      fill="#0f172a"
                      stroke="#10b981"
                      strokeWidth="0.8"
                      rx="2"
                    />
                    <text
                      x={padding.left + 12}
                      y={yLowAnchor + 3}
                      fill="#10b981"
                      fontSize="11"
                      fontWeight="bold"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      AVWAP Low: ${formatChartPrice(avwapSummary.swingLowAVWAP.vwap)}
                    </text>
                  </g>
                )}
              </g>
            );
          })()}

          {/* Volume Histogram (Bottom 20%) */}
          {candles.map((candle, idx) => {
            const x = getX(idx);
            const isUp = candle.close >= candle.open;
            const barHeight = (candle.volume / maxVolume) * volumeChartHeight;
            const y = volumeTop + volumeChartHeight - barHeight;

            return (
              <rect
                key={`vol-${idx}`}
                x={x - candleWidth / 2}
                y={y}
                width={candleWidth}
                height={Math.max(1, barHeight)}
                fill={isUp ? 'url(#volUp)' : 'url(#volDown)'}
                rx="1"
              />
            );
          })}

          {/* Liquidation Heatmap Overlay Bands & Magnets */}
          {showLiqHeatmap && (
            <g className="liquidation-heatmap-overlay">
              {liqSummary.clusters.map((cluster) => {
                const y = getY(cluster.price);
                if (y < padding.top || y > padding.top + priceChartHeight) return null;
                const isShort = cluster.type === 'SHORT_LIQUIDATION';
                const bandHeight = Math.max(3, Math.min(10, (cluster.intensity / 100) * 10));
                const opacity = 0.12 + (cluster.intensity / 100) * 0.28;
                const color = isShort ? '#f97316' : '#06b6d4';

                return (
                  <g key={cluster.id} className="transition-opacity duration-200">
                    {/* Heatmap Glow Band */}
                    <rect
                      x={padding.left}
                      y={y - bandHeight / 2}
                      width={chartWidth}
                      height={bandHeight}
                      fill={color}
                      fillOpacity={opacity}
                      rx="2"
                    />
                    {/* Heat Intensity Bar on right boundary */}
                    <rect
                      x={padding.left + chartWidth - 36}
                      y={y - bandHeight / 2}
                      width={(cluster.intensity / 100) * 36}
                      height={bandHeight}
                      fill={color}
                      fillOpacity={0.75}
                      rx="1"
                    />
                  </g>
                );
              })}

              {/* Major Short Magnet Highlight */}
              {liqSummary.majorShortMagnet && (() => {
                const m = liqSummary.majorShortMagnet;
                const y = getY(m.price);
                if (y < padding.top || y > padding.top + priceChartHeight) return null;
                return (
                  <g>
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={dimensions.width - padding.right}
                      y2={y}
                      stroke="#f97316"
                      strokeWidth="1.2"
                      strokeDasharray="4 2"
                    />
                    <rect
                      x={padding.left + 6}
                      y={y - 14}
                      width={195}
                      height={15}
                      fill="#7c2d12"
                      fillOpacity="0.88"
                      stroke="#ea580c"
                      strokeWidth="0.8"
                      rx="3"
                    />
                    <text
                      x={padding.left + 10}
                      y={y - 3}
                      fill="#fed7aa"
                      fontSize="8.5"
                      fontFamily="JetBrains Mono, monospace"
                      fontWeight="bold"
                    >
                      🔥 Short Liq: ${formatChartPrice(m.price)} (${m.estimatedVolumeUsd}M)
                    </text>
                  </g>
                );
              })()}

              {/* Major Long Magnet Highlight */}
              {liqSummary.majorLongMagnet && (() => {
                const m = liqSummary.majorLongMagnet;
                const y = getY(m.price);
                if (y < padding.top || y > padding.top + priceChartHeight) return null;
                return (
                  <g>
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={dimensions.width - padding.right}
                      y2={y}
                      stroke="#06b6d4"
                      strokeWidth="1.2"
                      strokeDasharray="4 2"
                    />
                    <rect
                      x={padding.left + 6}
                      y={y + 2}
                      width={195}
                      height={15}
                      fill="#164e63"
                      fillOpacity="0.88"
                      stroke="#0891b2"
                      strokeWidth="0.8"
                      rx="3"
                    />
                    <text
                      x={padding.left + 10}
                      y={y + 13}
                      fill="#cffafe"
                      fontSize="8.5"
                      fontFamily="JetBrains Mono, monospace"
                      fontWeight="bold"
                    >
                      💧 Long Liq: ${formatChartPrice(m.price)} (${m.estimatedVolumeUsd}M)
                    </text>
                  </g>
                );
              })()}
            </g>
          )}

          {/* Candlestick Wicks & Bodies */}
          {candles.map((candle, idx) => {
            const x = getX(idx);
            const isUp = candle.close >= candle.open;
            const yHigh = getY(candle.high);
            const yLow = getY(candle.low);
            const yOpen = getY(candle.open);
            const yClose = getY(candle.close);

            const bodyY = Math.min(yOpen, yClose);
            const bodyH = Math.max(1.5, Math.abs(yClose - yOpen));
            const color = isUp ? '#10b981' : '#ef4444';

            return (
              <g key={`candle-${idx}`}>
                {/* Wick */}
                <line
                  x1={x}
                  y1={yHigh}
                  x2={x}
                  y2={yLow}
                  stroke={color}
                  strokeWidth="1.2"
                />
                {/* Body */}
                <rect
                  x={x - candleWidth / 2}
                  y={bodyY}
                  width={candleWidth}
                  height={bodyH}
                  fill={color}
                  rx="1"
                />
              </g>
            );
          })}

          {/* Real-time Current Price Line & Right Axis Pill */}
          {candles.length > 0 && (
            <g>
              <line
                x1={padding.left}
                y1={getY(candles[candles.length - 1].close)}
                x2={dimensions.width - padding.right}
                y2={getY(candles[candles.length - 1].close)}
                stroke={candles[candles.length - 1].close >= candles[candles.length - 1].open ? '#10b981' : '#ef4444'}
                strokeWidth="1.2"
                strokeDasharray="4 2"
                opacity="0.85"
              />
              <rect
                x={dimensions.width - padding.right + 2}
                y={getY(candles[candles.length - 1].close) - 8}
                width={62}
                height={16}
                fill={candles[candles.length - 1].close >= candles[candles.length - 1].open ? '#059669' : '#dc2626'}
                rx="2"
              />
              <text
                x={dimensions.width - padding.right + 5}
                y={getY(candles[candles.length - 1].close) + 4}
                fill="#ffffff"
                fontSize="9"
                fontFamily="JetBrains Mono, monospace"
                fontWeight="bold"
              >
                ${formatChartPrice(candles[candles.length - 1].close)}
              </text>
            </g>
          )}

          {/* Crosshair on Hover */}
          {hoverIndex !== null && (
            <g>
              {/* Vertical line */}
              <line
                x1={getX(hoverIndex)}
                y1={padding.top}
                x2={getX(hoverIndex)}
                y2={dimensions.height - padding.bottom}
                stroke="#94a3b8"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              {/* Horizontal price line */}
              <line
                x1={padding.left}
                y1={getY(activeCandle.close)}
                x2={dimensions.width - padding.right}
                y2={getY(activeCandle.close)}
                stroke="#94a3b8"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              {/* Price badge on right axis */}
              <rect
                x={dimensions.width - padding.right + 2}
                y={getY(activeCandle.close) - 8}
                width={62}
                height={16}
                fill="#0284c7"
                rx="2"
              />
              <text
                x={dimensions.width - padding.right + 5}
                y={getY(activeCandle.close) + 4}
                fill="#ffffff"
                fontSize="9"
                fontFamily="JetBrains Mono, monospace"
                fontWeight="bold"
              >
                ${formatChartPrice(activeCandle.close)}
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Liquidation Telemetry Bar (Active when Liq Heatmap is toggled) */}
      {showLiqHeatmap && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-amber-500/20 text-[11px] font-mono my-1">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-amber-400 font-semibold">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              {lang === 'id' ? 'Imbalance Likuidasi:' : 'Liquidation Imbalance:'}
            </span>
            <span className={liqSummary.imbalanceBias === 'SHORT_SQUEEZE_RISK' ? 'text-amber-400 font-bold' : liqSummary.imbalanceBias === 'LONG_SQUEEZE_RISK' ? 'text-cyan-400 font-bold' : 'text-slate-300'}>
              {liqSummary.imbalanceBias === 'SHORT_SQUEEZE_RISK'
                ? (lang === 'id' ? `Peluang Short Squeeze (${liqSummary.squeezeProbability}%)` : `Short Squeeze Risk (${liqSummary.squeezeProbability}%)`)
                : liqSummary.imbalanceBias === 'LONG_SQUEEZE_RISK'
                ? (lang === 'id' ? `Peluang Long Squeeze (${liqSummary.squeezeProbability}%)` : `Long Squeeze Risk (${liqSummary.squeezeProbability}%)`)
                : (lang === 'id' ? 'Seimbang (Netral)' : 'Balanced Pool')}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-amber-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-xs bg-amber-500" />
              Shorts: <span className="font-bold">${liqSummary.totalShortLiqUsd}M</span> ({liqSummary.shortLiqRatio}%)
            </span>
            <span className="text-cyan-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-xs bg-cyan-500" />
              Longs: <span className="font-bold">${liqSummary.totalLongLiqUsd}M</span> ({liqSummary.longLiqRatio}%)
            </span>
          </div>
        </div>
      )}

      {/* Footer Notes */}
      <div className="flex items-center justify-between pt-2 border-t border-[#1e293b]/60 text-xs text-slate-400 font-mono">
        <span>
          {lang === 'id'
            ? `Menampilkan ${candles.length} periode • Sumber: Umpan Bursa Langsung (Binance) + Cache Algoritma`
            : `Displaying ${candles.length} periods • Source: Live Exchange Feed + Algo Cache`}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
          {lang === 'id' ? 'Garis Silang Interaktif Aktif' : 'Interactive Crosshair Active'}
        </span>
      </div>
    </div>
  );
});
