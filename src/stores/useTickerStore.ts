import { create } from 'zustand';
import { Timeframe } from '../types/crypto.types';

export interface TickerState {
  activeSymbol: string;
  activeTimeframe: Timeframe;
  prices: Record<string, number>;
  priceDirections: Record<string, 'up' | 'down' | 'neutral'>;
  changes24h: Record<string, number>;
  highs24h: Record<string, number>;
  lows24h: Record<string, number>;
  volumes24h: Record<string, string>;
  wsStatus: 'connected' | 'connecting' | 'disconnected' | 'error' | 'fallback';
  latencyMs: number;
  lastUpdated: number;

  // Actions
  setActiveSymbol: (symbol: string) => void;
  setActiveTimeframe: (timeframe: Timeframe) => void;
  setWsStatus: (status: 'connected' | 'connecting' | 'disconnected' | 'error' | 'fallback') => void;
  setLatency: (ms: number) => void;
  updateTick: (symbol: string, newPrice: number, change24h?: number, volume24h?: string) => void;
  setBatchPrices: (ticks: Array<{ symbol: string; price: number; change24h?: number; volume24h?: string }>) => void;
}

export const useTickerStore = create<TickerState>((set) => ({
  activeSymbol: 'BTC/USDT',
  activeTimeframe: '1H',
  prices: {
    'BTC/USDT': 67450.0,
    'ETH/USDT': 3520.0,
    'SOL/USDT': 188.5,
  },
  priceDirections: {},
  changes24h: {},
  highs24h: {},
  lows24h: {},
  volumes24h: {},
  wsStatus: 'connected',
  latencyMs: 24,
  lastUpdated: Date.now(),

  setActiveSymbol: (symbol) => set({ activeSymbol: symbol }),
  setActiveTimeframe: (timeframe) => set({ activeTimeframe: timeframe }),
  setWsStatus: (wsStatus) => set({ wsStatus }),
  setLatency: (latencyMs) => set({ latencyMs }),

  updateTick: (symbol, newPrice, change24h, volume24h) => {
    set((state) => {
      const currentPrice = state.prices[symbol] || newPrice;
      let dir: 'up' | 'down' | 'neutral' = 'neutral';
      if (newPrice > currentPrice) dir = 'up';
      else if (newPrice < currentPrice) dir = 'down';

      return {
        prices: { ...state.prices, [symbol]: newPrice },
        priceDirections: { ...state.priceDirections, [symbol]: dir },
        changes24h: change24h !== undefined ? { ...state.changes24h, [symbol]: change24h } : state.changes24h,
        volumes24h: volume24h !== undefined ? { ...state.volumes24h, [symbol]: volume24h } : state.volumes24h,
        lastUpdated: Date.now(),
      };
    });
  },

  setBatchPrices: (ticks) => {
    set((state) => {
      const nextPrices = { ...state.prices };
      const nextDirs = { ...state.priceDirections };
      const nextChanges = { ...state.changes24h };
      const nextVols = { ...state.volumes24h };

      for (const tick of ticks) {
        const prev = state.prices[tick.symbol] || tick.price;
        if (tick.price > prev) nextDirs[tick.symbol] = 'up';
        else if (tick.price < prev) nextDirs[tick.symbol] = 'down';

        nextPrices[tick.symbol] = tick.price;
        if (tick.change24h !== undefined) nextChanges[tick.symbol] = tick.change24h;
        if (tick.volume24h !== undefined) nextVols[tick.symbol] = tick.volume24h;
      }

      return {
        prices: nextPrices,
        priceDirections: nextDirs,
        changes24h: nextChanges,
        volumes24h: nextVols,
        lastUpdated: Date.now(),
      };
    });
  },
}));
