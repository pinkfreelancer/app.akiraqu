import { useState, useEffect, useCallback, useMemo } from 'react';
import { CryptoSymbolInfo } from '../types/crypto.types';
import { SUPPORTED_SYMBOLS } from '../services/marketData';
import { useMarketDataStore } from '../stores/useMarketDataStore';

export interface TerminalHealthStatus {
  uptime: number;
  latency: number;
  ok: boolean;
}

export interface UseTerminalSystemReturn {
  symbols: CryptoSymbolInfo[];
  setSymbols: React.Dispatch<React.SetStateAction<CryptoSymbolInfo[]>>;
  healthStatus: TerminalHealthStatus;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  isFullWidth: boolean;
  toggleFullWidth: () => void;
}

const ZERO_MOCK_INITIAL_SYMBOLS: CryptoSymbolInfo[] = SUPPORTED_SYMBOLS.map((sym) => ({
  ...sym,
  basePrice: 0,
  change24h: 0,
}));

export function useTerminalSystem(): UseTerminalSystemReturn {
  const [catalogSymbols, setCatalogSymbols] = useState<CryptoSymbolInfo[]>(ZERO_MOCK_INITIAL_SYMBOLS);
  const ssotTickers = useMarketDataStore((s) => s.tickers);

  const [healthStatus, setHealthStatus] = useState<TerminalHealthStatus>({
    uptime: 0,
    latency: 0,
    ok: true,
  });

  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => {
    return typeof document !== 'undefined' && !!document.fullscreenElement;
  });

  const [isFullWidth, setIsFullWidth] = useState<boolean>(() => {
    const saved = localStorage.getItem('nexus_fullwidth');
    return saved !== null ? saved === 'true' : true;
  });

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch((err) => {
        console.warn('Fullscreen request failed:', err);
      });
    } else {
      document.exitFullscreen?.().catch((err) => {
        console.warn('Exit fullscreen failed:', err);
      });
    }
  }, []);

  const toggleFullWidth = useCallback(() => {
    setIsFullWidth((prev) => {
      const next = !prev;
      localStorage.setItem('nexus_fullwidth', String(next));
      return next;
    });
  }, []);

  useEffect(() => {
    fetch('/api/v1/health')
      .then((res) => res.json())
      .then((data) => {
        setHealthStatus({
          uptime: data.uptime || 1,
          latency: data.latency || 4,
          ok: data.status === 'ok',
        });
      })
      .catch(() => {
        setHealthStatus({ uptime: 0, latency: 10, ok: false });
      });

    const refreshSymbols = () => {
      fetch('/api/v1/symbols')
        .then((res) => res.json())
        .then((res) => {
          if (res.status === 'success' && Array.isArray(res.data)) {
            if (res.meta?.isLiveFeed === true) {
              useMarketDataStore.getState().ingestBatchTickers(
                res.data
                  .filter((item: CryptoSymbolInfo) => Number.isFinite(item.basePrice) && item.basePrice > 0)
                  .map((item: CryptoSymbolInfo) => ({
                    symbol: item.symbol,
                    price: item.basePrice,
                    change24h: item.change24h,
                    volume24h: item.volume24h,
                  })),
                'REST'
              );
              setCatalogSymbols(res.data);
            }
          }
        })
        .catch(() => {});
    };

    refreshSymbols();
    const tickerInterval = setInterval(refreshSymbols, 15000);
    return () => clearInterval(tickerInterval);
  }, []);

  // Overlay Single Source of Truth live prices onto the symbol catalog so every consumer sees identical live prices
  const symbols = useMemo(() => {
    return catalogSymbols.map((sym) => {
      const liveTick = ssotTickers[sym.symbol];
      if (!liveTick) return sym;
      return {
        ...sym,
        basePrice: liveTick.price,
        change24h: liveTick.change24h,
        volume24h: liveTick.volume24h || sym.volume24h,
      };
    });
  }, [catalogSymbols, ssotTickers]);

  return {
    symbols,
    setSymbols: setCatalogSymbols,
    healthStatus,
    isFullscreen,
    toggleFullscreen,
    isFullWidth,
    toggleFullWidth,
  };
}
