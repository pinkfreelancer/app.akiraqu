import { describe, it, expect, beforeEach } from 'vitest';
import { useMarketDataStore } from './useMarketDataStore';
import { useOrderBookStore } from './useOrderBookStore';
import { useTickerStore } from './useTickerStore';

describe('useMarketDataStore (Single Source of Truth & Symbol Isolation)', () => {
  beforeEach(() => {
    useMarketDataStore.getState().resetStoreForTesting();
  });

  it('starts with zero mock prices and synchronizes BTC/ETH/SOL identically across consumers', () => {
    const initial = useMarketDataStore.getState();
    expect(Object.keys(initial.tickers)).toHaveLength(0);

    const now = Date.now();
    expect(
      initial.ingestPriceTick({
        symbol: 'BTC/USDT',
        price: 80484.25,
        change24h: -1.42,
        source: 'WS',
        now,
      })
    ).toBe(true);
    expect(
      initial.ingestPriceTick({
        symbol: 'ETH/USDT',
        price: 2512.8,
        change24h: 0.85,
        source: 'WS',
        now,
      })
    ).toBe(true);
    expect(
      initial.ingestPriceTick({
        symbol: 'SOL/USDT',
        price: 142.65,
        change24h: 2.1,
        source: 'WS',
        now,
      })
    ).toBe(true);

    const ssot = useMarketDataStore.getState();
    const legacyTicker = useTickerStore.getState();

    expect(ssot.tickers['BTC/USDT'].price).toBe(80484.25);
    expect(ssot.tickers['ETH/USDT'].price).toBe(2512.8);
    expect(ssot.tickers['SOL/USDT'].price).toBe(142.65);

    expect(legacyTicker.prices['BTC/USDT']).toBe(80484.25);
    expect(legacyTicker.prices['ETH/USDT']).toBe(2512.8);
    expect(legacyTicker.prices['SOL/USDT']).toBe(142.65);
  });

  it('leaves zero residual orderbook/trade data across 20 consecutive rapid symbol switches', () => {
    const symbols = [
      'KAS/USDT',
      'BTC/USDT',
      'SAND/USDT',
      'ETH/USDT',
      'STRK/USDT',
      'SOL/USDT',
      'FLOW/USDT',
      'BNB/USDT',
      'DOGE/USDT',
      'BTC/USDT',
      'PEPE/USDT',
      'ARB/USDT',
      'NEAR/USDT',
      'SUI/USDT',
      'KAS/USDT',
      'BTC/USDT',
      'AVAX/USDT',
      'LINK/USDT',
      'STRK/USDT',
      'BTC/USDT',
    ];

    const referencePrices: Record<string, number> = {
      'KAS/USDT': 0.0358,
      'SAND/USDT': 0.0361,
      'STRK/USDT': 0.029,
      'FLOW/USDT': 0.028,
      'DOGE/USDT': 0.284,
      'PEPE/USDT': 0.0000185,
      'ARB/USDT': 0.88,
      'NEAR/USDT': 6.84,
      'SUI/USDT': 3.42,
      'AVAX/USDT': 24.5,
      'LINK/USDT': 14.8,
      'BNB/USDT': 605.2,
      'ETH/USDT': 2515.0,
      'SOL/USDT': 143.2,
      'BTC/USDT': 80484.0,
    };

    const epochs: number[] = [];

    for (let i = 0; i < symbols.length; i++) {
      const sym = symbols[i];
      const price = referencePrices[sym];
      const epoch = useMarketDataStore.getState().switchSymbol(sym);
      epochs.push(epoch);

      // Immediately after switchSymbol, orderBook and recentTrades MUST be completely empty
      const afterSwitch = useMarketDataStore.getState();
      expect(afterSwitch.activeSymbol).toBe(sym);
      expect(afterSwitch.orderBook.bids).toHaveLength(0);
      expect(afterSwitch.orderBook.asks).toHaveLength(0);
      expect(afterSwitch.recentTrades).toHaveLength(0);
      expect(useOrderBookStore.getState().bids).toHaveLength(0);
      expect(useOrderBookStore.getState().asks).toHaveLength(0);

      // Seed live price and depth for this symbol
      afterSwitch.ingestPriceTick({ symbol: sym, price, source: 'WS' });
      const step = price * 0.0005;
      expect(
        useMarketDataStore.getState().ingestOrderBook({
          payloadSymbol: sym,
          epoch,
          bids: [[price - step, 10]],
          asks: [[price + step, 12]],
          source: 'WS',
        })
      ).toBe(true);
    }

    // Attempt to inject a late/delayed KAS/USDT ($0.0358) depth frame from an earlier epoch onto active BTC/USDT
    const staleAccepted = useMarketDataStore.getState().ingestOrderBook({
      payloadSymbol: 'KAS/USDT',
      epoch: epochs[14],
      bids: [[0.0357, 50000]],
      asks: [[0.0359, 50000]],
      source: 'REST',
    });
    expect(staleAccepted).toBe(false);

    // Attempt to inject a mislabeled $0.03 depth frame claiming to be BTC/USDT on the current epoch
    const mislabeledAccepted = useMarketDataStore.getState().ingestOrderBook({
      payloadSymbol: 'BTC/USDT',
      epoch: epochs[epochs.length - 1],
      bids: [[0.0357, 50000]],
      asks: [[0.0359, 50000]],
      source: 'WS',
    });
    expect(mislabeledAccepted).toBe(false);

    // Final active symbol is BTC/USDT and orderBook strictly contains BTC ~$80,484 levels
    const finalState = useMarketDataStore.getState();
    expect(finalState.activeSymbol).toBe('BTC/USDT');
    expect(finalState.orderBook.symbol).toBe('BTC/USDT');
    expect(finalState.orderBook.bestBid).toBeGreaterThan(80000);
    expect(finalState.orderBook.bestAsk).toBeGreaterThan(80000);
  });

  it('recovers cleanly across WS disconnect -> fallback polling -> WS reconnect lifecycle', () => {
    const store = useMarketDataStore.getState();

    // 1. Live WS connected
    store.setConnectionState({ wsStatus: 'connected', fallbackPollingActive: false, reconnectAttempt: 0 });
    expect(useMarketDataStore.getState().wsStatus).toBe('connected');

    // 2. Network drops offline
    store.setOnlineStatus(false);
    expect(useMarketDataStore.getState().isOnline).toBe(false);
    expect(useMarketDataStore.getState().wsStatus).toBe('disconnected');

    // 3. Network comes back online, enters fallback polling while WS reconnects
    store.setOnlineStatus(true);
    store.setConnectionState({ wsStatus: 'fallback', fallbackPollingActive: true, reconnectAttempt: 2 });
    expect(useMarketDataStore.getState().fallbackPollingActive).toBe(true);

    // 4. WS reconnects and receives live heartbeat/tick -> exits fallback automatically
    store.setConnectionState({ wsStatus: 'connected', fallbackPollingActive: false, reconnectAttempt: 0 });
    store.recordHeartbeat(18);
    expect(useMarketDataStore.getState().wsStatus).toBe('connected');
    expect(useMarketDataStore.getState().fallbackPollingActive).toBe(false);
    expect(useMarketDataStore.getState().latencyMs).toBe(18);
  });
});
