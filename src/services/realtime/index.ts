import { ConnectionManager } from './connectionManager';
import { SubscriptionManager } from './subscriptionManager';
import { useTickerStore } from '../../stores/useTickerStore';
import { useOrderBookStore } from '../../stores/useOrderBookStore';
import { RealtimeChannel } from './types';

export * from './types';
export * from './connectionManager';
export * from './subscriptionManager';

const BINANCE_WS_BASE = 'wss://stream.binance.com:9443/ws';

export function getWsEndpoint(): string {
  if (typeof window !== 'undefined' && window.location && window.location.host) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Primary: Server-side Express WS Proxy to bypass ISP geoblocking / TrustPositif censorship
    return `${protocol}//${window.location.host}/ws/market`;
  }
  return BINANCE_WS_BASE;
}

let connectionInstance: ConnectionManager | null = null;
let subscriptionInstance: SubscriptionManager | null = null;

export function getRealtimeService() {
  if (!connectionInstance && typeof window !== 'undefined') {
    const initialUrl = getWsEndpoint();
    connectionInstance = new ConnectionManager(initialUrl, (rawJson) => {
      try {
        const data = JSON.parse(rawJson);

        // Server-Side WS Proxy Greeting Frame
        if (data.type === 'PROXY_CONNECTED') {
          useTickerStore.getState().setWsStatus('connected');
          useTickerStore.getState().setLatency(data.latencyMs || 15);
          return;
        }

        // Handle Binance 24hr ticker stream
        if (data.e === '24hrTicker') {
          const rawSym = data.s; // e.g. BTCUSDT
          const price = parseFloat(data.c);
          const change = parseFloat(data.P);
          const vol = `$${(parseFloat(data.q) / 1e6).toFixed(1)}M`;
          const standardSymbol = `${rawSym.replace('USDT', '')}/USDT`;

          useTickerStore.getState().updateTick(standardSymbol, price, change, vol);
        }

        // Handle Binance partial depth stream
        if (data.bids && data.asks) {
          const bids: [number, number][] = data.bids.map((b: string[]) => [parseFloat(b[0]), parseFloat(b[1])]);
          const asks: [number, number][] = data.asks.map((a: string[]) => [parseFloat(a[0]), parseFloat(a[1])]);
          const symbol = useOrderBookStore.getState().symbol;
          useOrderBookStore.getState().setOrderBook(symbol, bids, asks);
        }

        // Handle Binance trade stream
        if (data.e === 'trade') {
          const trade = {
            id: String(data.t),
            price: parseFloat(data.p),
            amount: parseFloat(data.q),
            side: data.m ? ('sell' as const) : ('buy' as const),
            time: Number(data.T),
          };
          useOrderBookStore.getState().addTrade(trade);
        }
      } catch (_err) {
        // Ignore unparsed frames
      }
    });

    // Update connection status in ticker store
    connectionInstance.subscribeStatus((status, latency) => {
      const storeStatus = status === 'open' ? 'connected' : status === 'connecting' ? 'connecting' : 'error';
      useTickerStore.getState().setWsStatus(storeStatus);
      if (latency !== undefined) {
        useTickerStore.getState().setLatency(latency);
      }
    });

    subscriptionInstance = new SubscriptionManager(connectionInstance);
    connectionInstance.connect();
  }

  return {
    connection: connectionInstance,
    subscriptions: subscriptionInstance,
  };
}

/**
 * Convenient subscription hook helper
 */
export function subscribeMarketChannel(
  symbol: string,
  channel: RealtimeChannel,
  exchange: string = 'BINANCE',
  interval?: string
): () => void {
  const service = getRealtimeService();
  if (!service.subscriptions) return () => {};

  return service.subscriptions.subscribe(
    {
      exchange,
      channel,
      symbol,
      interval,
    },
    () => {}
  );
}
