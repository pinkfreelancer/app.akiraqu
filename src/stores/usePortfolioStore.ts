import { create } from 'zustand';

export interface Position {
  id: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  size: number;
  entryPrice: number;
  markPrice: number;
  pnl: number;
  pnlPercent: number;
  leverage: number;
  liquidationPrice: number;
  timestamp: number;
}

export interface PortfolioState {
  balances: Record<string, { free: number; used: number; total: number }>;
  totalEquityUsd: number;
  unrealizedPnlUsd: number;
  unrealizedPnlPercent: number;
  activePositions: Position[];
  marginLevel: number;
  lastUpdated: number;

  // Actions
  setBalances: (balances: Record<string, { free: number; used: number; total: number }>) => void;
  setTotalEquity: (equity: number) => void;
  updatePositions: (positions: Position[]) => void;
  addPosition: (pos: Position) => void;
  closePosition: (id: string) => void;
}

export const usePortfolioStore = create<PortfolioState>((set) => ({
  balances: {
    USDT: { free: 8500, used: 1500, total: 10000 },
    BTC: { free: 0.12, used: 0.05, total: 0.17 },
  },
  totalEquityUsd: 10000,
  unrealizedPnlUsd: 245.8,
  unrealizedPnlPercent: 2.45,
  activePositions: [
    {
      id: 'pos-btc-1',
      symbol: 'BTC/USDT',
      side: 'LONG',
      size: 0.05,
      entryPrice: 65200,
      markPrice: 67450,
      pnl: 112.5,
      pnlPercent: 3.45,
      leverage: 3,
      liquidationPrice: 48000,
      timestamp: Date.now() - 3600000,
    },
  ],
  marginLevel: 28.5,
  lastUpdated: Date.now(),

  setBalances: (balances) => set({ balances, lastUpdated: Date.now() }),
  setTotalEquity: (totalEquityUsd) => set({ totalEquityUsd, lastUpdated: Date.now() }),
  updatePositions: (activePositions) => {
    const totalPnl = activePositions.reduce((acc, p) => acc + p.pnl, 0);
    set((state) => ({
      activePositions,
      unrealizedPnlUsd: totalPnl,
      unrealizedPnlPercent: state.totalEquityUsd > 0 ? (totalPnl / state.totalEquityUsd) * 100 : 0,
      lastUpdated: Date.now(),
    }));
  },
  addPosition: (pos) => {
    set((state) => {
      const updated = [pos, ...state.activePositions];
      const totalPnl = updated.reduce((acc, p) => acc + p.pnl, 0);
      return {
        activePositions: updated,
        unrealizedPnlUsd: totalPnl,
        unrealizedPnlPercent: state.totalEquityUsd > 0 ? (totalPnl / state.totalEquityUsd) * 100 : 0,
        lastUpdated: Date.now(),
      };
    });
  },
  closePosition: (id) => {
    set((state) => {
      const updated = state.activePositions.filter((p) => p.id !== id);
      const totalPnl = updated.reduce((acc, p) => acc + p.pnl, 0);
      return {
        activePositions: updated,
        unrealizedPnlUsd: totalPnl,
        unrealizedPnlPercent: state.totalEquityUsd > 0 ? (totalPnl / state.totalEquityUsd) * 100 : 0,
        lastUpdated: Date.now(),
      };
    });
  },
}));
