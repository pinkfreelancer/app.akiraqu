import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, Clock, AlertTriangle } from 'lucide-react';
import { useMarketDataStore } from '../../stores/useMarketDataStore';
import { computeFeedStatus, DataFeedStatus, normalizeSymbol } from '../../services/marketDataValidator';

interface DataStatusBadgeProps {
  symbol?: string;
  updatedAtOverride?: number | null;
  scope?: 'ticker' | 'orderbook' | 'screener';
  lang?: 'id' | 'en';
  compact?: boolean;
  className?: string;
}

const STATUS_STYLES: Record<
  DataFeedStatus,
  {
    textClass: string;
    dotClass: string;
    label: string;
  }
> = {
  LIVE: {
    textClass: 'text-emerald-400',
    dotClass: 'bg-emerald-400',
    label: 'LIVE',
  },
  DELAYED: {
    textClass: 'text-amber-400',
    dotClass: 'bg-amber-400',
    label: 'DELAYED',
  },
  STALE: {
    textClass: 'text-orange-400',
    dotClass: 'bg-orange-400',
    label: 'STALE',
  },
  OFFLINE: {
    textClass: 'text-rose-400',
    dotClass: 'bg-rose-500',
    label: 'OFFLINE',
  },
};

export const DataStatusBadge: React.FC<DataStatusBadgeProps> = ({
  symbol,
  updatedAtOverride,
  scope = 'ticker',
  lang = 'id',
  compact = false,
  className = '',
}) => {
  const activeSymbol = useMarketDataStore((s) => s.activeSymbol);
  const targetSymbol = normalizeSymbol(symbol || activeSymbol) || activeSymbol;

  const tickerUpdatedAt = useMarketDataStore((s) => s.tickers[targetSymbol]?.updatedAt ?? null);
  const orderBookUpdatedAt = useMarketDataStore((s) =>
    s.orderBook.symbol === targetSymbol ? s.orderBook.updatedAt : null
  );
  const wsStatus = useMarketDataStore((s) => s.wsStatus);
  const isOnline = useMarketDataStore((s) => s.isOnline);
  const fallbackPollingActive = useMarketDataStore((s) => s.fallbackPollingActive);

  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const effectiveUpdatedAt =
    updatedAtOverride !== undefined
      ? updatedAtOverride
      : scope === 'orderbook'
        ? orderBookUpdatedAt
        : tickerUpdatedAt;

  const { status, ageLabel } = computeFeedStatus({
    updatedAt: effectiveUpdatedAt,
    wsStatus,
    isOnline,
    fallbackPollingActive,
    now,
    liveThresholdMs: scope === 'screener' ? 20_000 : 6000,
    staleThresholdMs: scope === 'screener' ? 45_000 : 15_000,
    lang,
  });

  const cfg = STATUS_STYLES[status];

  const renderIcon = () => {
    if (status === 'OFFLINE') return <WifiOff className="w-3 h-3 shrink-0" aria-hidden="true" />;
    if (status === 'STALE') return <AlertTriangle className="w-3 h-3 shrink-0" aria-hidden="true" />;
    if (status === 'DELAYED') return <Clock className="w-3 h-3 shrink-0" aria-hidden="true" />;
    return <Wifi className="w-3 h-3 shrink-0" aria-hidden="true" />;
  };

  return (
    <span
      role="status"
      aria-live="polite"
      title={`Status data ${targetSymbol}: ${cfg.label} (${ageLabel})`}
      className={`inline-flex items-center gap-1.5 font-mono tabular-nums text-[11px] leading-none select-none ${cfg.textClass} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dotClass}`} aria-hidden="true" />
      {!compact && renderIcon()}
      <span className="font-semibold tracking-tight">{cfg.label}</span>
      <span className="text-slate-500 dark:text-zinc-500" aria-hidden="true">
        ·
      </span>
      <span className="text-slate-600 dark:text-zinc-400 font-normal">{ageLabel}</span>
    </span>
  );
};
