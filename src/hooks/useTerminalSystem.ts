import { useState, useEffect, useCallback } from 'react';
import { CryptoSymbolInfo } from '../types/crypto.types';
import { SUPPORTED_SYMBOLS } from '../services/marketData';

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

export function useTerminalSystem(): UseTerminalSystemReturn {
  const [symbols, setSymbols] = useState<CryptoSymbolInfo[]>(SUPPORTED_SYMBOLS);
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

  // Track Native Fullscreen Change (F11, Escape, or programmatic)
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

  // Health check and symbols refresh on mount
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
          if (res.status === 'success' && res.data) {
            setSymbols(res.data);
          }
        })
        .catch(() => {});
    };

    refreshSymbols();
    const tickerInterval = setInterval(refreshSymbols, 15000);
    return () => clearInterval(tickerInterval);
  }, []);

  return {
    symbols,
    setSymbols,
    healthStatus,
    isFullscreen,
    toggleFullscreen,
    isFullWidth,
    toggleFullWidth,
  };
}
