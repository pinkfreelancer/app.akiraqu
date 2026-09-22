import { describe, it, expect, beforeEach } from 'vitest';
import { usePortfolioStore, Position } from './usePortfolioStore';

describe('Portfolio Store (stores/usePortfolioStore)', () => {
  beforeEach(() => {
    // Reset store state
    usePortfolioStore.setState({
      balances: {
        USDT: { free: 10000, used: 0, total: 10000 },
      },
      totalEquityUsd: 10000,
      unrealizedPnlUsd: 0,
      unrealizedPnlPercent: 0,
      activePositions: [],
      marginLevel: 0,
      lastUpdated: Date.now(),
    });
  });

  it('initializes with expected default values', () => {
    const state = usePortfolioStore.getState();
    expect(state.totalEquityUsd).toBe(10000);
    expect(state.balances.USDT.total).toBe(10000);
    expect(state.activePositions).toEqual([]);
  });

  it('updates balances via setBalances', () => {
    usePortfolioStore.getState().setBalances({
      USDC: { free: 5000, used: 1000, total: 6000 },
      ETH: { free: 2, used: 1, total: 3 },
    });

    const state = usePortfolioStore.getState();
    expect(state.balances.USDC.total).toBe(6000);
    expect(state.balances.ETH.free).toBe(2);
  });

  it('updates total equity via setTotalEquity', () => {
    usePortfolioStore.getState().setTotalEquity(25000);
    expect(usePortfolioStore.getState().totalEquityUsd).toBe(25000);
  });

  it('adds position and recalculates unrealized PnL', () => {
    const newPos: Position = {
      id: 'pos-eth-test',
      symbol: 'ETH/USDT',
      side: 'LONG',
      size: 2.5,
      entryPrice: 3000,
      markPrice: 3200,
      pnl: 500,
      pnlPercent: 6.67,
      leverage: 5,
      liquidationPrice: 2500,
      timestamp: Date.now(),
    };

    usePortfolioStore.getState().addPosition(newPos);

    const state = usePortfolioStore.getState();
    expect(state.activePositions.length).toBe(1);
    expect(state.activePositions[0].id).toBe('pos-eth-test');
    expect(state.unrealizedPnlUsd).toBe(500);
    expect(state.unrealizedPnlPercent).toBe(5); // 500 / 10000 * 100
  });

  it('closes a position by id and recalculates unrealized PnL', () => {
    const pos1: Position = {
      id: 'pos-1',
      symbol: 'BTC/USDT',
      side: 'LONG',
      size: 0.1,
      entryPrice: 60000,
      markPrice: 62000,
      pnl: 200,
      pnlPercent: 3.33,
      leverage: 3,
      liquidationPrice: 45000,
      timestamp: Date.now(),
    };

    const pos2: Position = {
      id: 'pos-2',
      symbol: 'SOL/USDT',
      side: 'SHORT',
      size: 10,
      entryPrice: 150,
      markPrice: 140,
      pnl: 100,
      pnlPercent: 6.67,
      leverage: 2,
      liquidationPrice: 200,
      timestamp: Date.now(),
    };

    usePortfolioStore.getState().updatePositions([pos1, pos2]);
    expect(usePortfolioStore.getState().unrealizedPnlUsd).toBe(300);

    usePortfolioStore.getState().closePosition('pos-1');

    const state = usePortfolioStore.getState();
    expect(state.activePositions.length).toBe(1);
    expect(state.activePositions[0].id).toBe('pos-2');
    expect(state.unrealizedPnlUsd).toBe(100);
  });
});
