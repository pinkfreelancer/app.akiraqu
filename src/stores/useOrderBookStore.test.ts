import { describe, it, expect, beforeEach } from 'vitest';
import { useOrderBookStore, LiveTrade } from './useOrderBookStore';

describe('Order Book Store (stores/useOrderBookStore)', () => {
  beforeEach(() => {
    // Reset order book state
    useOrderBookStore.setState({
      symbol: 'BTC/USDT',
      bids: [],
      asks: [],
      bidTotal: 0,
      askTotal: 0,
      spread: 0,
      spreadPercentage: 0,
      recentTrades: [],
      orderFlowDelta: 0,
      lastUpdated: Date.now(),
    });
  });

  it('updates bids, asks, totals, and spread correctly in setOrderBook', () => {
    const bids: [number, number][] = [
      [60000, 1.5],
      [59900, 2.0],
      [59800, 3.5],
    ];
    const asks: [number, number][] = [
      [60050, 1.0],
      [60100, 2.5],
      [60200, 4.0],
    ];

    useOrderBookStore.getState().setOrderBook('BTC/USDT', bids, asks);

    const state = useOrderBookStore.getState();
    expect(state.symbol).toBe('BTC/USDT');
    expect(state.bidTotal).toBe(7.0); // 1.5 + 2.0 + 3.5
    expect(state.askTotal).toBe(7.5); // 1.0 + 2.5 + 4.0
    expect(state.spread).toBe(50); // 60050 - 60000
    expect(state.spreadPercentage).toBeCloseTo((50 / 60000) * 100, 4);
  });

  it('adds trade and dynamically updates orderFlowDelta', () => {
    const buyTrade: LiveTrade = {
      id: 't-1',
      price: 60050,
      amount: 2.0,
      side: 'buy',
      time: Date.now(),
    };

    const sellTrade: LiveTrade = {
      id: 't-2',
      price: 60000,
      amount: 0.5,
      side: 'sell',
      time: Date.now(),
    };

    useOrderBookStore.getState().addTrade(buyTrade);
    expect(useOrderBookStore.getState().orderFlowDelta).toBe(2.0);
    expect(useOrderBookStore.getState().recentTrades.length).toBe(1);

    useOrderBookStore.getState().addTrade(sellTrade);
    expect(useOrderBookStore.getState().orderFlowDelta).toBe(1.5); // 2.0 - 0.5
    expect(useOrderBookStore.getState().recentTrades.length).toBe(2);
    expect(useOrderBookStore.getState().recentTrades[0].id).toBe('t-2');
  });

  it('caps recentTrades list at 50 items', () => {
    const trades: LiveTrade[] = Array.from({ length: 60 }, (_, i) => ({
      id: `trade-${i}`,
      price: 50000 + i,
      amount: 0.1,
      side: i % 2 === 0 ? 'buy' : 'sell',
      time: Date.now() + i,
    }));

    useOrderBookStore.getState().setRecentTrades(trades);
    expect(useOrderBookStore.getState().recentTrades.length).toBe(50);
  });
});
