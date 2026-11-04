import React, { useState, useRef, useEffect, useMemo } from 'react';
import { OHLCVCandle, IndicatorsSnapshot, Timeframe, SupportedExchange, MarketType } from '../types/crypto.types';
import {
  Maximize2,
  Minimize2,
  Flame,
  Waves,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Activity,
  Layers,
  Sparkles,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { Language, getTranslation } from '../i18n/translations';
import { computeLiquidationHeatmap } from '../services/liquidation/liquidationEngine';
import { computeAnchoredVWAPs } from '../services/marketMaker/mmEngine';
import { formatCryptoPrice } from '../utils/formatters';
import { ExchangeMarketSelector } from './ExchangeMarketSelector';
import { DataStatusBadge } from './ui/DataStatusBadge';
import { CoinLogo } from './ui/CoinLogo';

function formatChartPrice(val: number): string {
  return formatCryptoPrice(val);
}

function formatAxisPrice(val: number): string {
  if (isNaN(val) || val === 0) return '0';
  if (val >= 1000) return val.toLocaleString(undefined, { maximumFractionDigits: 0 });
  return formatCryptoPrice(val);
}

function formatCandleTime(timestamp: number, tf: Timeframe): string {
  if (!timestamp || isNaN(timestamp)) return '';
  const d = new Date(timestamp);
  if (tf === '1D' || tf === '1W') {
    const day = d.getDate();
    const month = d.toLocaleString('default', { month: 'short' });
    return `${day} ${month}`;
  }
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatFullDateTime(timestamp: number): string {
  if (!timestamp || isNaN(timestamp)) return '';
  const d = new Date(timestamp);
  return `${d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`;
}

// Compute RSI 14 Series across all candles
function computeRSISeries(candles: OHLCVCandle[], period: number = 14) {
  if (candles.length <= period) return [];
  const rsiValues: { index: number; rsi: number }[] = [];
  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;
  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  rsiValues.push({ index: period, rsi: 100 - 100 / (1 + rs) });

  for (let i = period + 1; i < candles.length; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsiValues.push({ index: i, rsi: 100 - 100 / (1 + rs) });
  }

  return rsiValues;
}

// Compute MACD Series (12, 26, 9)
function computeMACDSeries(candles: OHLCVCandle[]) {
  if (candles.length < 26) return [];
  const k12 = 2 / (12 + 1);
  const k26 = 2 / (26 + 1);
  const k9 = 2 / (9 + 1);

  let ema12 = candles[0].close;
  let ema26 = candles[0].close;
  const macdLine: number[] = [];

  for (let i = 0; i < candles.length; i++) {
    ema12 = candles[i].close * k12 + ema12 * (1 - k12);
    ema26 = candles[i].close * k26 + ema26 * (1 - k26);
    macdLine.push(ema12 - ema26);
  }

  let signal = macdLine[0];
  const macdData: { index: number; macd: number; signal: number; histogram: number }[] = [];

  for (let i = 0; i < macdLine.length; i++) {
    signal = macdLine[i] * k9 + signal * (1 - k9);
    macdData.push({
      index: i,
      macd: macdLine[i],
      signal,
      histogram: macdLine[i] - signal,
    });
  }

  return macdData;
}

export type SubPaneType = 'volume' | 'rsi' | 'macd' | 'none';

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
  wsStatus?: 'connected' | 'connecting' | 'fallback' | 'disconnected';
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
  const isDark = theme === 'dark';
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 750, height: 460 });
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [cursorY, setCursorY] = useState<number | null>(null);
  const [isChartFullscreen, setIsChartFullscreen] = useState(false);

  // Zoom and Pan Viewport
  const [zoomFactor, setZoomFactor] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const dragStartXRef = useRef<number>(0);
  const dragStartPanRef = useRef<number>(0);

  // Overlay Studies Toggles
  const [showVWAP, setShowVWAP] = useState(true);
  const [showAVWAP, setShowAVWAP] = useState(true);
  const [showSMC, setShowSMC] = useState(true);
  const [showFib, setShowFib] = useState(true);
  const [showSR, setShowSR] = useState(true);
  const [showLiqHeatmap, setShowLiqHeatmap] = useState(true);

  // Sub-pane selector (Volume, RSI, MACD, None)
  const [subPane, setSubPane] = useState<SubPaneType>('volume');

  // Throttle heavy computations to candle count / last candle time
  const lastCandleTime = candles.length > 0 ? candles[candles.length - 1].time : 0;
  const candleCount = candles.length;

  // Compute real-time liquidation clusters & squeeze magnets
  const liqSummary = useMemo(() => {
    return computeLiquidationHeatmap(candles, symbol);
  }, [candleCount, lastCandleTime, symbol]);

  // Check data fidelity status across candles
  const isDataSimulated = useMemo(() => {
    return candles.some((c) => c.isSimulated);
  }, [candleCount, lastCandleTime]);

  // Compute Multi-Anchor Anchored VWAP (Daily Session, Weekly, Swing High/Low)
  const avwapSummary = useMemo(() => {
    const lastPrice = candles.length > 0 ? candles[candles.length - 1].close : 0;
    return computeAnchoredVWAPs(candles, lastPrice);
  }, [candleCount, lastCandleTime]);

  // Compute Cumulative Standard VWAP per candle
  const cumulativeVwapSeries = useMemo(() => {
    if (candles.length === 0) return [];
    let cumTPV = 0;
    let cumV = 0;
    return candles.map((c, idx) => {
      const tp = (c.high + c.low + c.close) / 3;
      cumTPV += tp * c.volume;
      cumV += c.volume;
      return {
        index: idx,
        vwap: cumTPV / (cumV || 1),
      };
    });
  }, [candleCount, lastCandleTime]);

  // Compute RSI series
  const rsiSeries = useMemo(() => {
    return computeRSISeries(candles, 14);
  }, [candleCount, lastCandleTime]);

  // Compute MACD series
  const macdSeries = useMemo(() => {
    return computeMACDSeries(candles);
  }, [candleCount, lastCandleTime]);

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

      let computedHeight = subPane !== 'none' ? 480 : 420;
      if (isChartFullscreen) {
        computedHeight = Math.max(520, window.innerHeight - 180);
      } else if (currentWidth < 640) {
        computedHeight = subPane !== 'none' ? 380 : 320;
      } else if (currentWidth < 1024) {
        computedHeight = subPane !== 'none' ? 440 : 380;
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
  }, [isChartFullscreen, subPane]);

  // Calculate visible candle slice based on zoom and pan
  const totalCount = candles.length;
  const visibleCount = Math.max(15, Math.min(totalCount, Math.round(totalCount / zoomFactor)));
  const maxPanOffset = 0;
  const minPanOffset = -(totalCount - visibleCount);
  const clampedPan = Math.max(minPanOffset, Math.min(maxPanOffset, panOffset));

  const startIdx = Math.max(0, totalCount - visibleCount + clampedPan);
  const endIdx = Math.min(totalCount, startIdx + visibleCount);
  const visibleCandles = candles.slice(startIdx, endIdx);

  // Zoom handlers
  const handleZoomIn = () => {
    setZoomFactor((prev) => Math.min(4, Number((prev * 1.3).toFixed(2))));
  };
  const handleZoomOut = () => {
    setZoomFactor((prev) => {
      const next = Math.max(1, Number((prev / 1.3).toFixed(2)));
      if (next === 1) setPanOffset(0);
      return next;
    });
  };
  const handleZoomReset = () => {
    setZoomFactor(1);
    setPanOffset(0);
  };

  if (!candles || candles.length === 0) {
    return (
      <div className={`flex items-center justify-center h-80 rounded-xl border font-mono text-xs ${
        isDark ? 'bg-[#0f172a] border-[#1e293b] text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
      }`}>
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 animate-spin text-pink-500" />
          <span>{lang === 'id' ? 'Menyinkronkan data grafik lilin bursa...' : 'Synchronizing exchange candlestick telemetry...'}</span>
        </div>
      </div>
    );
  }

  // Chart layout geometry
  const padding = { top: 22, right: 68, bottom: 32, left: 12 };
  const chartWidth = Math.max(50, dimensions.width - padding.left - padding.right);
  const totalAvailableHeight = Math.max(120, dimensions.height - padding.top - padding.bottom);

  // Sub-pane partitioning
  const hasSubPane = subPane !== 'none';
  const priceChartHeight = hasSubPane ? totalAvailableHeight * 0.72 : totalAvailableHeight;
  const subPaneHeight = hasSubPane ? totalAvailableHeight * 0.22 : 0;
  const subPaneTop = padding.top + priceChartHeight + 14;

  // Min & Max Price for visible slice
  const visibleHighs = visibleCandles.map((c) => c.high);
  const visibleLows = visibleCandles.map((c) => c.low);
  const rawMinPrice = Math.min(...visibleLows);
  const rawMaxPrice = Math.max(...visibleHighs);
  const priceMargin = (rawMaxPrice - rawMinPrice) * 0.08 || 1;
  const minPrice = rawMinPrice - priceMargin;
  const maxPrice = rawMaxPrice + priceMargin;
  const priceRange = maxPrice - minPrice || 1;

  // Max Volume for visible slice
  const maxVolume = Math.max(...visibleCandles.map((c) => c.volume), 1);

  // Coordinate scales for visible candles
  const visibleTotal = visibleCandles.length;
  const candleStep = chartWidth / (visibleTotal || 1);
  const candleWidth = Math.max(2, Math.min(14, candleStep * 0.72));

  const getY = (price: number) => {
    return padding.top + (1 - (price - minPrice) / priceRange) * priceChartHeight;
  };

  const getPriceFromY = (y: number) => {
    const clampedY = Math.max(padding.top, Math.min(padding.top + priceChartHeight, y));
    const ratio = 1 - (clampedY - padding.top) / priceChartHeight;
    return minPrice + ratio * priceRange;
  };

  const getX = (globalIndex: number) => {
    const visibleIndex = globalIndex - startIdx;
    return padding.left + visibleIndex * candleStep + candleStep / 2;
  };

  // Active candle for inspection
  const resolvedHoverIndex = hoverIndex !== null && hoverIndex >= startIdx && hoverIndex < endIdx ? hoverIndex : null;
  const activeCandle = resolvedHoverIndex !== null ? candles[resolvedHoverIndex] : candles[candles.length - 1];
  const isUpActive = activeCandle ? activeCandle.close >= activeCandle.open : true;
  const pctChange = activeCandle ? (((activeCandle.close - activeCandle.open) / (activeCandle.open || 1)) * 100).toFixed(2) : '0.00';

  // Hover pointer handlers (desktop & touch)
  const handlePointerCoord = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = clientX - rect.left - padding.left;
    const mouseY = clientY - rect.top;

    const relIndex = Math.floor(mouseX / candleStep);
    const globalIdx = startIdx + relIndex;

    if (globalIdx >= startIdx && globalIdx < endIdx) {
      setHoverIndex(globalIdx);
    }
    setCursorY(Math.max(padding.top, Math.min(padding.top + priceChartHeight, mouseY)));
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    dragStartXRef.current = e.clientX;
    dragStartPanRef.current = panOffset;
    handlePointerCoord(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDraggingRef.current && zoomFactor > 1) {
      const deltaX = e.clientX - dragStartXRef.current;
      const candleShift = Math.round(deltaX / candleStep);
      setPanOffset(Math.max(minPanOffset, Math.min(maxPanOffset, dragStartPanRef.current + candleShift)));
    }
    handlePointerCoord(e.clientX, e.clientY);
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  const handlePointerLeave = () => {
    isDraggingRef.current = false;
    setHoverIndex(null);
    setCursorY(null);
  };

  // Keyboard navigation for accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setHoverIndex((prev) => (prev === null ? endIdx - 1 : Math.max(startIdx, prev - 1)));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setHoverIndex((prev) => (prev === null ? startIdx : Math.min(endIdx - 1, prev + 1)));
    }
  };

  // Build Real Cumulative VWAP polyline for visible window
  const vwapPoints = useMemo(() => {
    if (!showVWAP || cumulativeVwapSeries.length === 0) return '';
    return cumulativeVwapSeries
      .filter((pt) => pt.index >= startIdx && pt.index < endIdx)
      .map((pt) => `${getX(pt.index)},${getY(pt.vwap)}`)
      .join(' ');
  }, [showVWAP, cumulativeVwapSeries, startIdx, endIdx, candleStep, minPrice, priceRange, priceChartHeight]);

  // Build Anchored VWAP polylines for visible window
  const avwapPolylines = useMemo(() => {
    if (!showAVWAP || !avwapSummary) return [];
    const anchors = [
      { data: avwapSummary.swingHighAVWAP, color: '#f43f5e', label: 'AVWAP High' },
      { data: avwapSummary.swingLowAVWAP, color: '#10b981', label: 'AVWAP Low' },
      { data: avwapSummary.sessionVWAP, color: '#8b5cf6', label: 'Session VWAP' },
    ];

    return anchors.map((a) => {
      if (!a.data.series || a.data.series.length === 0) return null;
      const pts = a.data.series
        .filter((pt) => pt.index >= startIdx && pt.index < endIdx)
        .map((pt) => `${getX(pt.index)},${getY(pt.vwap)}`)
        .join(' ');
      return {
        ...a,
        points: pts,
        lastPoint: a.data.series[a.data.series.length - 1],
      };
    }).filter(Boolean);
  }, [showAVWAP, avwapSummary, startIdx, endIdx, candleStep, minPrice, priceRange, priceChartHeight]);

  // X-Axis Timestamp Ticks along Bottom
  const xAxisTicks = useMemo(() => {
    const ticks: { index: number; x: number; label: string }[] = [];
    const count = 5;
    const step = Math.floor(visibleTotal / count) || 1;

    for (let i = 0; i < visibleTotal; i += step) {
      const globalIdx = startIdx + i;
      if (globalIdx < totalCount) {
        const c = candles[globalIdx];
        if (c && c.time) {
          ticks.push({
            index: globalIdx,
            x: getX(globalIdx),
            label: formatCandleTime(c.time, timeframe),
          });
        }
      }
    }
    return ticks;
  }, [visibleTotal, startIdx, totalCount, candles, timeframe, candleStep]);

  // RSI Coordinates for Sub-Pane
  const rsiPoints = useMemo(() => {
    if (subPane !== 'rsi' || rsiSeries.length === 0) return '';
    return rsiSeries
      .filter((pt) => pt.index >= startIdx && pt.index < endIdx)
      .map((pt) => {
        const x = getX(pt.index);
        const y = subPaneTop + subPaneHeight - (pt.rsi / 100) * subPaneHeight;
        return `${x},${y}`;
      })
      .join(' ');
  }, [subPane, rsiSeries, startIdx, endIdx, candleStep, subPaneTop, subPaneHeight]);

  // MACD Coordinates for Sub-Pane
  const macdData = useMemo(() => {
    if (subPane !== 'macd' || macdSeries.length === 0) return null;
    const visibleMACD = macdSeries.filter((pt) => pt.index >= startIdx && pt.index < endIdx);
    if (visibleMACD.length === 0) return null;

    const maxVal = Math.max(...visibleMACD.map((m) => Math.max(Math.abs(m.macd), Math.abs(m.signal), Math.abs(m.histogram))), 1);
    const midY = subPaneTop + subPaneHeight / 2;

    const macdPts = visibleMACD.map((m) => `${getX(m.index)},${midY - (m.macd / maxVal) * (subPaneHeight * 0.45)}`).join(' ');
    const signalPts = visibleMACD.map((m) => `${getX(m.index)},${midY - (m.signal / maxVal) * (subPaneHeight * 0.45)}`).join(' ');

    const histBars = visibleMACD.map((m) => {
      const x = getX(m.index);
      const h = Math.abs((m.histogram / maxVal) * (subPaneHeight * 0.45));
      const y = m.histogram >= 0 ? midY - h : midY;
      return {
        x,
        y,
        h: Math.max(1, h),
        isUp: m.histogram >= 0,
      };
    });

    return { macdPts, signalPts, histBars, midY };
  }, [subPane, macdSeries, startIdx, endIdx, candleStep, subPaneTop, subPaneHeight]);

  // Truthful per-data status badge (LIVE / DELAYED / STALE / OFFLINE + relative age)
  const renderStatusBadge = () => {
    return (
      <div className="px-2 py-0.5 rounded bg-slate-900/70 border border-slate-800 flex items-center gap-2 shrink-0">
        <DataStatusBadge symbol={symbol} scope="ticker" lang={lang} />
        <span className="text-[10px] font-mono tabular-nums text-slate-500 hidden sm:inline">
          · {selectedExchange} ({latencyMs}ms)
        </span>
      </div>
    );
  };

  return (
    <div className={`flex flex-col rounded-xl border transition-all duration-200 overflow-hidden shadow-md ${
      isDark ? 'bg-[#0b0f19] border-[#1e293b] text-slate-100' : 'bg-white border-slate-200 text-slate-900'
    } ${
      isChartFullscreen ? 'fixed inset-0 z-50 rounded-none border-none p-4 sm:p-6 overflow-y-auto ' + (isDark ? 'bg-[#070b14]' : 'bg-[#f8fafc]') : 'relative'
    }`}>
      {/* Optional Top Exchange and Market Type Selector */}
      {onSelectExchange && onSelectMarketType && (
        <div className="p-2 sm:p-3 border-b border-slate-800/60 bg-slate-950/40">
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

      {/* Row 1: Primary Ticker Bar & Essential Window Controls */}
      <div className={`px-3 py-2 flex flex-wrap items-center justify-between gap-2 border-b shrink-0 ${
        isDark ? 'border-slate-800/80 bg-[#0e1626]/80' : 'border-slate-200 bg-slate-50/90'
      }`}>
        {/* Left: Symbol & Live OHLCV Telemetry */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap font-mono text-xs">
          <div className={`flex items-center gap-2 font-bold text-sm ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            <CoinLogo symbol={symbol} size="sm" priority decorative showTooltip />
            <span>{symbol}</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${
              isDark ? 'bg-pink-950/60 text-pink-400 border-pink-500/40' : 'bg-pink-50 text-pink-700 border-pink-200'
            }`}>
              {timeframe}
            </span>
          </div>

          <div className="flex items-center gap-1 font-bold text-sm">
            <span className={isUpActive ? 'text-emerald-400' : 'text-rose-400'}>
              ${formatChartPrice(activeCandle.close)}
            </span>
            <span className={`text-[11px] font-semibold px-1 py-0.2 rounded ${
              isUpActive ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'
            }`}>
              {isUpActive ? '+' : ''}{pctChange}%
            </span>
          </div>

          {/* Compact OHLC Telemetry */}
          <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400">
            <span>O <span className={isDark ? 'text-slate-200' : 'text-slate-700'}>${formatChartPrice(activeCandle.open)}</span></span>
            <span>H <span className="text-emerald-400">${formatChartPrice(activeCandle.high)}</span></span>
            <span>L <span className="text-rose-400">${formatChartPrice(activeCandle.low)}</span></span>
            <span>Vol <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>{activeCandle.volume.toLocaleString()}</span></span>
          </div>
        </div>

        {/* Right: Live Status Badge, Zoom, and Fullscreen Controls */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          {renderStatusBadge()}

          {/* Zoom Buttons */}
          <div className="flex items-center gap-0.5 bg-slate-900/80 p-0.5 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
              title="Zoom In (+)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
              title="Zoom Out (-)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            {zoomFactor > 1 && (
              <button
                type="button"
                onClick={handleZoomReset}
                className="p-1 text-pink-400 hover:text-pink-200 rounded hover:bg-slate-800 transition-colors"
                title="Reset Zoom (100%)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={() => setIsChartFullscreen(!isChartFullscreen)}
            className="p-1.5 rounded-lg border border-slate-700 bg-slate-800/80 text-slate-300 hover:text-pink-300 hover:border-pink-500/40 transition-colors cursor-pointer"
            title={isChartFullscreen ? (lang === 'id' ? 'Kecilkan Layar (ESC)' : 'Exit Fullscreen') : (lang === 'id' ? 'Layar Penuh' : 'Fullscreen')}
          >
            {isChartFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Row 2: Indicator Studies & Sub-Pane Toolbar (Dedicated, Sleek & Uncluttered) */}
      <div className={`px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 border-b text-xs font-mono shrink-0 ${
        isDark ? 'bg-[#090d16] border-slate-800/60' : 'bg-slate-100/70 border-slate-200'
      }`}>
        {/* Left: Study / Overlay Toggles */}
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-[10px] text-slate-500 uppercase font-bold mr-1 hidden sm:inline">
            {lang === 'id' ? 'Indikator:' : 'Studies:'}
          </span>

          <button
            type="button"
            onClick={() => setShowVWAP(!showVWAP)}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer border ${
              showVWAP
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-xs'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            VWAP
          </button>

          <button
            type="button"
            onClick={() => setShowAVWAP(!showAVWAP)}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer border flex items-center gap-1 ${
              showAVWAP
                ? 'bg-pink-500/20 text-pink-300 border-pink-500/40 shadow-xs'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Waves className="w-3 h-3" />
            <span>AVWAP</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSMC(!showSMC)}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer border ${
              showSMC
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-xs'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            SMC / OB
          </button>

          <button
            type="button"
            onClick={() => setShowFib(!showFib)}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer border ${
              showFib
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-xs'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            Fib GP
          </button>

          <button
            type="button"
            onClick={() => setShowSR(!showSR)}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer border ${
              showSR
                ? 'bg-slate-700/60 text-slate-200 border-slate-500/40 shadow-xs'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            S/R
          </button>

          <button
            type="button"
            onClick={() => setShowLiqHeatmap(!showLiqHeatmap)}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer border flex items-center gap-1 ${
              showLiqHeatmap
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-xs'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Flame className="w-3 h-3 text-amber-400" />
            <span>Liq Heatmap</span>
          </button>
        </div>

        {/* Right: Sub-Pane Segmented Control */}
        <div className="flex items-center gap-1 ml-auto shrink-0">
          <span className="text-[10px] text-slate-500 uppercase font-bold mr-1 hidden md:inline">
            Panel:
          </span>
          <div className="flex items-center bg-slate-900/80 p-0.5 rounded-lg border border-slate-800">
            {(['volume', 'rsi', 'macd', 'none'] as SubPaneType[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setSubPane(mode)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all ${
                  subPane === mode
                    ? 'bg-pink-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {mode === 'none' ? 'OFF' : mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SVG Canvas with In-Chart Floating HUD & High-Precision Interactivity */}
      <div
        ref={containerRef}
        role="region"
        aria-label={`Interactive Candlestick Chart for ${symbol} on ${timeframe}`}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="relative w-full flex-1 overflow-hidden select-none cursor-crosshair touch-none outline-none focus:ring-1 focus:ring-pink-500/50 min-h-[320px]"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
      >
        {/* Floating Top-Left In-Chart Legend (Clean TradingView Style) */}
        <div className="absolute top-2 left-3 z-10 flex flex-wrap items-center gap-3 text-[10px] font-mono pointer-events-none bg-slate-950/70 backdrop-blur-xs px-2 py-1 rounded border border-slate-800/60 shadow-xs">
          {showVWAP && cumulativeVwapSeries.length > 0 && (
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              <span className="text-indigo-300 font-semibold">VWAP:</span>
              <span className="text-slate-200">${formatChartPrice(cumulativeVwapSeries[cumulativeVwapSeries.length - 1].vwap)}</span>
            </div>
          )}
          {showAVWAP && avwapSummary && (
            <>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                <span className="text-rose-300 font-semibold">AVWAP H:</span>
                <span className="text-slate-200">${formatChartPrice(avwapSummary.swingHighAVWAP.vwap)}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-emerald-300 font-semibold">AVWAP L:</span>
                <span className="text-slate-200">${formatChartPrice(avwapSummary.swingLowAVWAP.vwap)}</span>
              </div>
            </>
          )}
          {indicators?.rsi && subPane === 'rsi' && (
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
              <span className="text-pink-300 font-semibold">RSI(14):</span>
              <span className="text-slate-200">{indicators.rsi.rsi14.toFixed(1)}</span>
            </div>
          )}
          {indicators?.macd && subPane === 'macd' && (
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span className="text-cyan-300 font-semibold">MACD:</span>
              <span className="text-slate-200">{indicators.macd.macdLine.toFixed(2)} / {indicators.macd.signalLine.toFixed(2)}</span>
            </div>
          )}
        </div>

        <svg
          width={dimensions.width}
          height={dimensions.height}
          className="w-full block overflow-visible"
        >
          <defs>
            <linearGradient id="volUp" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.15" />
            </linearGradient>
            <linearGradient id="volDown" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.15" />
            </linearGradient>
          </defs>

          {/* 1. Background Grid Lines & Price Labels */}
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
                  stroke={isDark ? '#1e293b' : '#e2e8f0'}
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <text
                  x={dimensions.width - padding.right + 8}
                  y={y + 3}
                  fill={isDark ? '#64748b' : '#64748b'}
                  fontSize="10"
                  fontFamily="JetBrains Mono, monospace"
                >
                  ${formatAxisPrice(p)}
                </text>
              </g>
            );
          })}

          {/* 2. Background Shaded Zones: Fibonacci Golden Pocket (0.5 to 0.618) */}
          {showFib && indicators?.fibonacci && (
            <g>
              <rect
                x={padding.left}
                y={getY(indicators.fibonacci.goldenPocket.max)}
                width={chartWidth}
                height={Math.max(2, getY(indicators.fibonacci.goldenPocket.min) - getY(indicators.fibonacci.goldenPocket.max))}
                fill="#f59e0b"
                fillOpacity={isDark ? 0.06 : 0.10}
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
                x={dimensions.width - padding.right - 105}
                y={getY(indicators.fibonacci.goldenPocket.max) - 4}
                fill="#f59e0b"
                fontSize="8.5"
                fontFamily="JetBrains Mono, monospace"
              >
                Fib 0.618 GP
              </text>
            </g>
          )}

          {/* 3. Background Shaded Zones: SMC Order Blocks (Clean Translucent) */}
          {showSMC && indicators?.smc && (
            <g>
              {indicators.smc.orderBlocks?.map((ob, i) => {
                const isBull = ob.type === 'BULLISH_OB';
                const yTop = getY(ob.high);
                const yBottom = getY(ob.low);
                const h = Math.max(3, yBottom - yTop);

                const startX = ob.startIndex !== undefined ? Math.max(padding.left, getX(ob.startIndex)) : padding.left + chartWidth * 0.3;
                const endX = ob.mitigatedIndex !== undefined
                  ? Math.min(padding.left + chartWidth, getX(ob.mitigatedIndex))
                  : padding.left + chartWidth;
                const width = Math.max(12, endX - startX);

                const color = isBull ? '#10b981' : '#f43f5e';
                const labelText = ob.mitigated
                  ? (isBull ? 'Mitigated Bull OB' : 'Mitigated Bear OB')
                  : (isBull ? 'Bullish OB' : 'Bearish OB');

                return (
                  <g key={i}>
                    <rect
                      x={startX}
                      y={yTop}
                      width={width}
                      height={h}
                      fill={color}
                      fillOpacity={ob.mitigated ? 0.04 : 0.09}
                      stroke={color}
                      strokeWidth="1"
                      strokeDasharray={ob.mitigated ? '4 3' : '3 1'}
                    />
                    <text
                      x={startX + 4}
                      y={yTop + 9}
                      fill={color}
                      fontSize="8"
                      fontWeight="bold"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {labelText}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* 4. Background Shaded Zones: Liquidation Heatmap Intensity Bands */}
          {showLiqHeatmap && (
            <g className="liquidation-heatmap-overlay">
              {liqSummary.clusters.map((cluster) => {
                const y = getY(cluster.price);
                if (y < padding.top || y > padding.top + priceChartHeight) return null;
                const isShort = cluster.type === 'SHORT_LIQUIDATION';
                const bandHeight = Math.max(3, Math.min(8, (cluster.intensity / 100) * 8));
                const opacity = 0.08 + (cluster.intensity / 100) * 0.18;
                const color = isShort ? '#f97316' : '#06b6d4';

                return (
                  <g key={cluster.id}>
                    <rect
                      x={padding.left}
                      y={y - bandHeight / 2}
                      width={chartWidth}
                      height={bandHeight}
                      fill={color}
                      fillOpacity={opacity}
                    />
                    <rect
                      x={padding.left + chartWidth - 30}
                      y={y - bandHeight / 2}
                      width={(cluster.intensity / 100) * 30}
                      height={bandHeight}
                      fill={color}
                      fillOpacity={0.65}
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
                    <text
                      x={dimensions.width - padding.right - 120}
                      y={y - 4}
                      fill="#ea580c"
                      fontSize="8"
                      fontFamily="JetBrains Mono, monospace"
                      fontWeight="bold"
                    >
                      🔥 Short Liq (~${m.estimatedVolumeUsd}M)
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
                    <text
                      x={dimensions.width - padding.right - 120}
                      y={y + 10}
                      fill="#0891b2"
                      fontSize="8"
                      fontFamily="JetBrains Mono, monospace"
                      fontWeight="bold"
                    >
                      💧 Long Liq (~${m.estimatedVolumeUsd}M)
                    </text>
                  </g>
                );
              })()}
            </g>
          )}

          {/* 5. Key Support & Resistance Lines */}
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
                      stroke="#f43f5e"
                      strokeWidth="1.2"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={dimensions.width - padding.right - 100}
                      y={yRes - 4}
                      fill="#f43f5e"
                      fontSize="8.5"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      Res: ${formatChartPrice(indicators.priceAction.keyResistance)}
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
                      x={dimensions.width - padding.right - 100}
                      y={ySup + 11}
                      fill="#10b981"
                      fontSize="8.5"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      Sup: ${formatChartPrice(indicators.priceAction.keySupport)}
                    </text>
                  </>
                )}
              </g>
            );
          })()}

          {/* 6. Dynamic Cumulative Institutional VWAP Curve */}
          {showVWAP && vwapPoints && (
            <g>
              <polyline
                points={vwapPoints}
                fill="none"
                stroke="#6366f1"
                strokeWidth="2"
                strokeOpacity="0.95"
              />
            </g>
          )}

          {/* 7. Dynamic Anchored VWAP (AVWAP) Curves starting at origin anchor candles */}
          {showAVWAP && avwapPolylines.map((a, idx) => (
            <g key={`avwap-${idx}`}>
              <polyline
                points={a.points}
                fill="none"
                stroke={a.color}
                strokeWidth="1.8"
                strokeDasharray="5 2"
                strokeOpacity="0.95"
              />
              {a.lastPoint && (
                <circle
                  cx={getX(a.lastPoint.index)}
                  cy={getY(a.lastPoint.vwap)}
                  r="3.5"
                  fill={a.color}
                />
              )}
            </g>
          ))}

          {/* 8. Candlestick Wicks & Bodies (Crystal Clear Foreground) */}
          {visibleCandles.map((candle, idx) => {
            const globalIdx = startIdx + idx;
            const x = getX(globalIdx);
            const isUp = candle.close >= candle.open;
            const yHigh = getY(candle.high);
            const yLow = getY(candle.low);
            const yOpen = getY(candle.open);
            const yClose = getY(candle.close);

            const bodyY = Math.min(yOpen, yClose);
            const bodyH = Math.max(1.5, Math.abs(yClose - yOpen));
            const color = isUp ? '#10b981' : '#f43f5e';

            return (
              <g key={`candle-${globalIdx}`}>
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
                  stroke={color}
                  strokeWidth="0.5"
                  rx="1"
                />
              </g>
            );
          })}

          {/* 9. Real-time Current Price Line & Right Axis Pill */}
          {candles.length > 0 && (
            <g>
              <line
                x1={padding.left}
                y1={getY(candles[candles.length - 1].close)}
                x2={dimensions.width - padding.right}
                y2={getY(candles[candles.length - 1].close)}
                stroke={candles[candles.length - 1].close >= candles[candles.length - 1].open ? '#10b981' : '#f43f5e'}
                strokeWidth="1.2"
                strokeDasharray="4 2"
                opacity="0.9"
              />
              <rect
                x={dimensions.width - padding.right + 2}
                y={getY(candles[candles.length - 1].close) - 8}
                width={66}
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

          {/* 10. Sub-Pane Rendering (Volume, RSI, or MACD) */}
          {subPane === 'volume' && (
            <g className="subpane-volume">
              <line
                x1={padding.left}
                y1={subPaneTop - 6}
                x2={dimensions.width - padding.right}
                y2={subPaneTop - 6}
                stroke={isDark ? '#334155' : '#cbd5e1'}
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <text
                x={padding.left + 4}
                y={subPaneTop + 6}
                fill={isDark ? '#64748b' : '#94a3b8'}
                fontSize="8.5"
                fontFamily="JetBrains Mono, monospace"
              >
                Volume (24h)
              </text>

              {/* Volume Bars */}
              {visibleCandles.map((candle, idx) => {
                const globalIdx = startIdx + idx;
                const x = getX(globalIdx);
                const isUp = candle.close >= candle.open;
                const barHeight = (candle.volume / maxVolume) * subPaneHeight;
                const y = subPaneTop + subPaneHeight - barHeight;

                return (
                  <rect
                    key={`vol-${globalIdx}`}
                    x={x - candleWidth / 2}
                    y={y}
                    width={candleWidth}
                    height={Math.max(1, barHeight)}
                    fill={isUp ? 'url(#volUp)' : 'url(#volDown)'}
                    rx="1"
                  />
                );
              })}
            </g>
          )}

          {subPane === 'rsi' && (
            <g className="subpane-rsi">
              <line
                x1={padding.left}
                y1={subPaneTop - 6}
                x2={dimensions.width - padding.right}
                y2={subPaneTop - 6}
                stroke={isDark ? '#334155' : '#cbd5e1'}
                strokeWidth="1"
              />
              {/* 70 Level */}
              <line
                x1={padding.left}
                y1={subPaneTop + subPaneHeight * 0.3}
                x2={dimensions.width - padding.right}
                y2={subPaneTop + subPaneHeight * 0.3}
                stroke="#f43f5e"
                strokeWidth="0.8"
                strokeDasharray="3 3"
                opacity="0.5"
              />
              {/* 30 Level */}
              <line
                x1={padding.left}
                y1={subPaneTop + subPaneHeight * 0.7}
                x2={dimensions.width - padding.right}
                y2={subPaneTop + subPaneHeight * 0.7}
                stroke="#10b981"
                strokeWidth="0.8"
                strokeDasharray="3 3"
                opacity="0.5"
              />
              <text
                x={padding.left + 4}
                y={subPaneTop + 8}
                fill="#ec4899"
                fontSize="8.5"
                fontFamily="JetBrains Mono, monospace"
                fontWeight="bold"
              >
                RSI (14)
              </text>
              <text
                x={dimensions.width - padding.right + 6}
                y={subPaneTop + subPaneHeight * 0.3 + 3}
                fill="#f43f5e"
                fontSize="8"
                fontFamily="JetBrains Mono, monospace"
              >
                70
              </text>
              <text
                x={dimensions.width - padding.right + 6}
                y={subPaneTop + subPaneHeight * 0.7 + 3}
                fill="#10b981"
                fontSize="8"
                fontFamily="JetBrains Mono, monospace"
              >
                30
              </text>

              {/* RSI Polyline */}
              {rsiPoints && (
                <polyline
                  points={rsiPoints}
                  fill="none"
                  stroke="#ec4899"
                  strokeWidth="1.8"
                />
              )}
            </g>
          )}

          {subPane === 'macd' && macdData && (
            <g className="subpane-macd">
              <line
                x1={padding.left}
                y1={subPaneTop - 6}
                x2={dimensions.width - padding.right}
                y2={subPaneTop - 6}
                stroke={isDark ? '#334155' : '#cbd5e1'}
                strokeWidth="1"
              />
              <line
                x1={padding.left}
                y1={macdData.midY}
                x2={dimensions.width - padding.right}
                y2={macdData.midY}
                stroke={isDark ? '#475569' : '#94a3b8'}
                strokeWidth="0.8"
                strokeDasharray="2 2"
              />
              <text
                x={padding.left + 4}
                y={subPaneTop + 8}
                fill="#06b6d4"
                fontSize="8.5"
                fontFamily="JetBrains Mono, monospace"
                fontWeight="bold"
              >
                MACD (12, 26, 9)
              </text>

              {/* Histogram bars */}
              {macdData.histBars.map((bar, idx) => (
                <rect
                  key={`macd-hist-${idx}`}
                  x={bar.x - candleWidth / 2}
                  y={bar.y}
                  width={candleWidth}
                  height={bar.h}
                  fill={bar.isUp ? '#10b981' : '#f43f5e'}
                  opacity="0.75"
                />
              ))}

              {/* MACD Line & Signal Line */}
              <polyline
                points={macdData.macdPts}
                fill="none"
                stroke="#06b6d4"
                strokeWidth="1.5"
              />
              <polyline
                points={macdData.signalPts}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="1.5"
              />
            </g>
          )}

          {/* 11. X-Axis Timestamp Ticks along Bottom */}
          {xAxisTicks.map((tick, idx) => (
            <g key={`xtick-${idx}`}>
              <line
                x1={tick.x}
                y1={dimensions.height - padding.bottom}
                x2={tick.x}
                y2={dimensions.height - padding.bottom + 4}
                stroke={isDark ? '#334155' : '#cbd5e1'}
                strokeWidth="1"
              />
              <text
                x={tick.x}
                y={dimensions.height - padding.bottom + 15}
                textAnchor="middle"
                fill={isDark ? '#64748b' : '#94a3b8'}
                fontSize="9"
                fontFamily="JetBrains Mono, monospace"
              >
                {tick.label}
              </text>
            </g>
          ))}

          {/* 12. True 2-Way Crosshair on Hover / Touch */}
          {resolvedHoverIndex !== null && (
            <g>
              {/* Vertical line through candle */}
              <line
                x1={getX(resolvedHoverIndex)}
                y1={padding.top}
                x2={getX(resolvedHoverIndex)}
                y2={dimensions.height - padding.bottom}
                stroke={isDark ? '#94a3b8' : '#64748b'}
                strokeWidth="1"
                strokeDasharray="2 2"
              />

              {/* Horizontal price line at exact cursor Y */}
              {cursorY !== null && (
                <>
                  <line
                    x1={padding.left}
                    y1={cursorY}
                    x2={dimensions.width - padding.right}
                    y2={cursorY}
                    stroke={isDark ? '#94a3b8' : '#64748b'}
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                  {/* Exact Cursor Price badge on right axis */}
                  <rect
                    x={dimensions.width - padding.right + 2}
                    y={cursorY - 8}
                    width={66}
                    height={16}
                    fill="#0284c7"
                    rx="2"
                  />
                  <text
                    x={dimensions.width - padding.right + 5}
                    y={cursorY + 4}
                    fill="#ffffff"
                    fontSize="9"
                    fontFamily="JetBrains Mono, monospace"
                    fontWeight="bold"
                  >
                    ${formatChartPrice(getPriceFromY(cursorY))}
                  </text>
                </>
              )}

              {/* Time badge at bottom axis */}
              {activeCandle && activeCandle.time && (
                <g>
                  <rect
                    x={getX(resolvedHoverIndex) - 45}
                    y={dimensions.height - padding.bottom + 4}
                    width={90}
                    height={16}
                    fill={isDark ? '#1e293b' : '#334155'}
                    stroke={isDark ? '#475569' : '#1e293b'}
                    strokeWidth="0.8"
                    rx="2"
                  />
                  <text
                    x={getX(resolvedHoverIndex)}
                    y={dimensions.height - padding.bottom + 15}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="8.5"
                    fontFamily="JetBrains Mono, monospace"
                    fontWeight="bold"
                  >
                    {formatFullDateTime(activeCandle.time)}
                  </text>
                </g>
              )}
            </g>
          )}
        </svg>
      </div>

      {/* Liquidation Telemetry Bar (~Estimated Heuristic Notice) */}
      {showLiqHeatmap && (
        <div className={`flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 border-t text-[11px] font-mono ${
          isDark ? 'bg-[#090d16] border-slate-800/80 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
        }`}>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-amber-500 font-semibold">
              <Flame className="w-3.5 h-3.5" />
              {lang === 'id' ? 'Imbalance Likuidasi (~Est):' : 'Liquidation Imbalance (~Est):'}
            </span>
            <span className={liqSummary.imbalanceBias === 'SHORT_SQUEEZE_RISK' ? 'text-amber-400 font-bold' : liqSummary.imbalanceBias === 'LONG_SQUEEZE_RISK' ? 'text-pink-400 font-bold' : 'text-slate-400'}>
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
              Shorts: <span className="font-bold">~${liqSummary.totalShortLiqUsd}M</span> ({liqSummary.shortLiqRatio}%)
            </span>
            <span className="text-cyan-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-xs bg-cyan-500" />
              Longs: <span className="font-bold">~${liqSummary.totalLongLiqUsd}M</span> ({liqSummary.longLiqRatio}%)
            </span>
          </div>
        </div>
      )}

      {/* Footer Notes & Dynamic Telemetry */}
      <div className={`flex flex-wrap items-center justify-between px-3 py-1.5 border-t text-[11px] font-mono gap-2 ${
        isDark ? 'border-slate-800/80 bg-[#090d16]/50 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-600'
      }`}>
        <span className="flex items-center gap-2">
          <span>
            {lang === 'id'
              ? `Menampilkan ${visibleCandles.length} bar (dari ${candles.length}) • ${selectedExchange} (${selectedMarketType})`
              : `Displaying ${visibleCandles.length} bars (of ${candles.length}) • ${selectedExchange} (${selectedMarketType})`}
          </span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${wsStatus === 'connected' && !isDataSimulated ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          <span>
            {wsStatus === 'connected' && !isDataSimulated
              ? (lang === 'id' ? `Presisi ${candles.length}-Bar Stream Aktif` : `${candles.length}-Bar Live Stream Active`)
              : isDataSimulated
              ? (lang === 'id' ? 'Modus Estimasi Algoritmik' : 'Algorithmic Estimation Mode')
              : (lang === 'id' ? 'Modus Polling Fallback (Sinkron 2s)' : 'Polling Fallback Mode (2s Sync)')}
          </span>
        </span>
      </div>
    </div>
  );
});
