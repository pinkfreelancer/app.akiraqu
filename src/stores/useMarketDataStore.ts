import { create } from 'zustand';
import { LiveOrderBookLevel, LiveTradeTick } from '../types/market.types';
import {
  normalizeSymbol,
  RawDepthTuple,
  TransportWsStatus,
  validateOrderBookPayload,
  validatePriceTick,
} from '../services/marketDataValidator';
import { useTickerStore } from './useTickerStore';
import { useOrderBookStore } from './useOrderBookStore';

export type DataSourceKind = 'WS' | 'REST';

export interface ValidatedSymbolTicker {
  symbol: string;
  price: number;
  bid: number | null;
  ask: number | null;
  change24h: number;
  high24h: number | null;
  low24h: number | null;
  volume24h: string | null;
  updatedAt: number;
  source: DataSourceKind;
  direction: 'up' | 'down' | 'neutral';
}

export interface ActiveOrderBookSnapshot {
  symbol: string;
  epoch: number;
  bids: LiveOrderBookLevel[];
  asks: LiveOrderBookLevel[];
  bidTotal: number;
  askTotal: number;
  bestBid: number;
  bestAsk: number;
  spread: number;
  spreadPct: number;
  updatedAt: number | null;
  source: DataSourceKind | null;
}

export interface IngestPriceTickParams {
  symbol: string;
  expectedSymbol?: string;
  price: number;
  bid?: number | null;
  ask?: number | null;
  change24h?: number;
  high24h?: number | null;
  low24h?: number | null;
  volume24h?: string | null;
  source: DataSourceKind;
  allowAnchorReset?: boolean;
  maxDeviationPct?: number;
  now?: number;
}

export interface IngestOrderBookParams {
  payloadSymbol: string;
  epoch?: number;
  bids: RawDepthTuple[];
  asks: RawDepthTuple[];
  source: DataSourceKind;
  now?: number;
}

export interface IngestTradesParams {
  payloadSymbol: string;
  epoch?: number;
  trades: LiveTradeTick[];
  source: DataSourceKind;
  now?: number;
}

export interface MarketDataSSOTState {
  activeSymbol: string;
  symbolEpoch: number;
  tickers: Record<string, ValidatedSymbolTicker>;
  orderBook: ActiveOrderBookSnapshot;
  recentTrades: LiveTradeTick[];
  recentTradesUpdatedAt: number | null;

  wsStatus: TransportWsStatus;
  isOnline: boolean;
  fallbackPollingActive: boolean;
  reconnectAttempt: number;
  latencyMs: number;
  lastWsMessageAt: number | null;

  rejectedPayloadsCount: number;
  lastRejectedReason: string | null;

  // Actions
  switchSymbol: (symbol: string) => number;
  ingestPriceTick: (params: IngestPriceTickParams) => boolean;
  ingestBatchTickers: (
    items: Array<{
      symbol: string;
      price: number;
      change24h?: number;
      high24h?: number;
      low24h?: number;
      volume24h?: string;
    }>,
    source: DataSourceKind,
    now?: number
  ) => number;
  ingestOrderBook: (params: IngestOrderBookParams) => boolean;
  ingestTrades: (params: IngestTradesParams) => boolean;
  setConnectionState: (patch: {
    wsStatus?: TransportWsStatus;
    fallbackPollingActive?: boolean;
    reconnectAttempt?: number;
    latencyMs?: number;
    lastWsMessageAt?: number | null;
  }) => void;
  setOnlineStatus: (isOnline: boolean) => void;
  recordHeartbeat: (latencyMs?: number, now?: number) => void;
  resetStoreForTesting: () => void;
}

function createEmptyOrderBook(symbol: string, epoch: number): ActiveOrderBookSnapshot {
  return {
    symbol,
    epoch,
    bids: [],
    asks: [],
    bidTotal: 0,
    askTotal: 0,
    bestBid: 0,
    bestAsk: 0,
    spread: 0,
    spreadPct: 0,
    updatedAt: null,
    source: null,
  };
}

const initialOnline =
  typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'
    ? navigator.onLine
    : true;

export const useMarketDataStore = create<MarketDataSSOTState>((set, get) => ({
  activeSymbol: 'BTC/USDT',
  symbolEpoch: 1,
  tickers: {},
  orderBook: createEmptyOrderBook('BTC/USDT', 1),
  recentTrades: [],
  recentTradesUpdatedAt: null,

  wsStatus: 'connecting',
  isOnline: initialOnline,
  fallbackPollingActive: false,
  reconnectAttempt: 0,
  latencyMs: 0,
  lastWsMessageAt: null,

  rejectedPayloadsCount: 0,
  lastRejectedReason: null,

  switchSymbol: (rawSymbol: string) => {
    const normalized = normalizeSymbol(rawSymbol) || 'BTC/USDT';
    const current = get();
    const nextEpoch = current.symbolEpoch + 1;

    set({
      activeSymbol: normalized,
      symbolEpoch: nextEpoch,
      orderBook: createEmptyOrderBook(normalized, nextEpoch),
      recentTrades: [],
      recentTradesUpdatedAt: null,
    });

    // Keep legacy stores synchronously cleared so zero stale bids/asks/trades survive symbol switch
    useTickerStore.getState().setActiveSymbol(normalized);
    useOrderBookStore.getState().setOrderBook(normalized, [], []);
    useOrderBookStore.getState().setRecentTrades([]);

    return nextEpoch;
  },

  ingestPriceTick: (params: IngestPriceTickParams) => {
    const now = params.now ?? Date.now();
    const state = get();
    const normCandidate = normalizeSymbol(params.symbol);
    const existing = normCandidate ? state.tickers[normCandidate] : undefined;

    const validation = validatePriceTick({
      payloadSymbol: params.symbol,
      expectedSymbol: params.expectedSymbol,
      price: params.price,
      referencePrice: existing?.price ?? null,
      referenceUpdatedAt: existing?.updatedAt ?? null,
      maxDeviationPct: params.maxDeviationPct ?? 5,
      allowAnchorReset: params.allowAnchorReset ?? false,
      now,
    });

    if (!validation.valid) {
      set((prev) => ({
        rejectedPayloadsCount: prev.rejectedPayloadsCount + 1,
        lastRejectedReason: `${validation.reason || 'INVALID_PRICE'}:${params.symbol}:${params.price}`,
      }));
      return false;
    }

    const sym = validation.normalizedSymbol;
    const prevPrice = existing?.price ?? validation.price;
    let direction: 'up' | 'down' | 'neutral' = existing?.direction ?? 'neutral';
    if (validation.price > prevPrice) direction = 'up';
    else if (validation.price < prevPrice) direction = 'down';

    const updatedTicker: ValidatedSymbolTicker = {
      symbol: sym,
      price: validation.price,
      bid:
        typeof params.bid === 'number' && Number.isFinite(params.bid) && params.bid > 0
          ? params.bid
          : existing?.bid ?? null,
      ask:
        typeof params.ask === 'number' && Number.isFinite(params.ask) && params.ask > 0
          ? params.ask
          : existing?.ask ?? null,
      change24h:
        typeof params.change24h === 'number' && Number.isFinite(params.change24h)
          ? params.change24h
          : existing?.change24h ?? 0,
      high24h:
        typeof params.high24h === 'number' && Number.isFinite(params.high24h) && params.high24h > 0
          ? params.high24h
          : existing?.high24h ?? null,
      low24h:
        typeof params.low24h === 'number' && Number.isFinite(params.low24h) && params.low24h > 0
          ? params.low24h
          : existing?.low24h ?? null,
      volume24h: params.volume24h ?? existing?.volume24h ?? null,
      updatedAt: now,
      source: params.source,
      direction,
    };

    set((prev) => ({
      tickers: {
        ...prev.tickers,
        [sym]: updatedTicker,
      },
      lastWsMessageAt: params.source === 'WS' ? now : prev.lastWsMessageAt,
    }));

    useTickerStore
      .getState()
      .updateTick(sym, updatedTicker.price, updatedTicker.change24h, updatedTicker.volume24h ?? undefined);

    return true;
  },

  ingestBatchTickers: (items, source, now = Date.now()) => {
    if (!Array.isArray(items) || items.length === 0) return 0;

    const state = get();
    const nextTickers = { ...state.tickers };
    const acceptedForLegacy: Array<{
      symbol: string;
      price: number;
      change24h?: number;
      volume24h?: string;
    }> = [];
    let rejected = 0;
    let lastReason = state.lastRejectedReason;

    for (const item of items) {
      const symCandidate = normalizeSymbol(item.symbol);
      if (!symCandidate) continue;
      const existing = nextTickers[symCandidate];

      // If WS updated this symbol within the last 5 seconds, don't overwrite fresher WS price with slower REST batch
      if (source === 'REST' && existing && existing.source === 'WS' && now - existing.updatedAt < 5000) {
        continue;
      }

      const validation = validatePriceTick({
        payloadSymbol: symCandidate,
        price: item.price,
        referencePrice: existing?.price ?? null,
        referenceUpdatedAt: existing?.updatedAt ?? null,
        maxDeviationPct: 5,
        now,
      });

      if (!validation.valid) {
        rejected++;
        lastReason = `${validation.reason || 'INVALID_BATCH_PRICE'}:${symCandidate}:${item.price}`;
        continue;
      }

      const prevPrice = existing?.price ?? validation.price;
      let direction: 'up' | 'down' | 'neutral' = existing?.direction ?? 'neutral';
      if (validation.price > prevPrice) direction = 'up';
      else if (validation.price < prevPrice) direction = 'down';

      nextTickers[symCandidate] = {
        symbol: symCandidate,
        price: validation.price,
        bid: existing?.bid ?? null,
        ask: existing?.ask ?? null,
        change24h:
          typeof item.change24h === 'number' && Number.isFinite(item.change24h)
            ? item.change24h
            : existing?.change24h ?? 0,
        high24h:
          typeof item.high24h === 'number' && Number.isFinite(item.high24h) && item.high24h > 0
            ? item.high24h
            : existing?.high24h ?? null,
        low24h:
          typeof item.low24h === 'number' && Number.isFinite(item.low24h) && item.low24h > 0
            ? item.low24h
            : existing?.low24h ?? null,
        volume24h: item.volume24h ?? existing?.volume24h ?? null,
        updatedAt: now,
        source,
        direction,
      };

      acceptedForLegacy.push({
        symbol: symCandidate,
        price: validation.price,
        change24h: item.change24h,
        volume24h: item.volume24h,
      });
    }

    if (acceptedForLegacy.length > 0 || rejected > 0) {
      set((prev) => ({
        tickers: nextTickers,
        rejectedPayloadsCount: prev.rejectedPayloadsCount + rejected,
        lastRejectedReason: lastReason,
        lastWsMessageAt: source === 'WS' && acceptedForLegacy.length > 0 ? now : prev.lastWsMessageAt,
      }));
    }

    if (acceptedForLegacy.length > 0) {
      useTickerStore.getState().setBatchPrices(acceptedForLegacy);
    }

    return acceptedForLegacy.length;
  },

  ingestOrderBook: (params: IngestOrderBookParams) => {
    const now = params.now ?? Date.now();
    const state = get();

    // Reject stale async callbacks from an older symbol switch epoch
    if (typeof params.epoch === 'number' && params.epoch !== state.symbolEpoch) {
      set((prev) => ({
        rejectedPayloadsCount: prev.rejectedPayloadsCount + 1,
        lastRejectedReason: `STALE_EPOCH:${params.payloadSymbol}:${params.epoch}!=${state.symbolEpoch}`,
      }));
      return false;
    }

    const activeTicker = state.tickers[state.activeSymbol];
    const validation = validateOrderBookPayload({
      payloadSymbol: params.payloadSymbol,
      expectedSymbol: state.activeSymbol,
      bids: params.bids,
      asks: params.asks,
      referencePrice: activeTicker?.price ?? null,
      maxBestQuoteDeviationPct: 5,
      maxLevelDeviationPct: 20,
      maxLevels: 15,
    });

    if (!validation.valid) {
      set((prev) => ({
        rejectedPayloadsCount: prev.rejectedPayloadsCount + 1,
        lastRejectedReason: `${validation.reason || 'INVALID_ORDERBOOK'}:${params.payloadSymbol}`,
      }));
      return false;
    }

    const midPrice = (validation.bestBid + validation.bestAsk) / 2;

    set((prev) => {
      const nextTickers = { ...prev.tickers };
      const currentSymTicker = nextTickers[prev.activeSymbol];
      if (currentSymTicker) {
        nextTickers[prev.activeSymbol] = {
          ...currentSymTicker,
          bid: validation.bestBid,
          ask: validation.bestAsk,
        };
      } else if (midPrice > 0) {
        // Seed reference ticker from validated best bid/ask midpoint if ticker hasn't arrived yet
        nextTickers[prev.activeSymbol] = {
          symbol: prev.activeSymbol,
          price: midPrice,
          bid: validation.bestBid,
          ask: validation.bestAsk,
          change24h: 0,
          high24h: null,
          low24h: null,
          volume24h: null,
          updatedAt: now,
          source: params.source,
          direction: 'neutral',
        };
      }

      return {
        tickers: nextTickers,
        orderBook: {
          symbol: prev.activeSymbol,
          epoch: prev.symbolEpoch,
          bids: validation.bids,
          asks: validation.asks,
          bidTotal: validation.bidTotal,
          askTotal: validation.askTotal,
          bestBid: validation.bestBid,
          bestAsk: validation.bestAsk,
          spread: validation.spread,
          spreadPct: validation.spreadPct,
          updatedAt: now,
          source: params.source,
        },
        lastWsMessageAt: params.source === 'WS' ? now : prev.lastWsMessageAt,
      };
    });

    useOrderBookStore
      .getState()
      .setOrderBook(state.activeSymbol, validation.rawBids, validation.rawAsks);

    return true;
  },

  ingestTrades: (params: IngestTradesParams) => {
    const now = params.now ?? Date.now();
    const state = get();

    if (typeof params.epoch === 'number' && params.epoch !== state.symbolEpoch) {
      set((prev) => ({
        rejectedPayloadsCount: prev.rejectedPayloadsCount + 1,
        lastRejectedReason: `STALE_TRADE_EPOCH:${params.payloadSymbol}`,
      }));
      return false;
    }

    const normSym = normalizeSymbol(params.payloadSymbol);
    if (!normSym || normSym !== state.activeSymbol) {
      set((prev) => ({
        rejectedPayloadsCount: prev.rejectedPayloadsCount + 1,
        lastRejectedReason: `TRADE_SYMBOL_MISMATCH:${params.payloadSymbol}!=${state.activeSymbol}`,
      }));
      return false;
    }

    const refPrice = state.tickers[state.activeSymbol]?.price ?? null;
    const refUpdatedAt = state.tickers[state.activeSymbol]?.updatedAt ?? null;

    const validTrades = params.trades.filter((t) => {
      if (!t || !Number.isFinite(t.price) || t.price <= 0 || !Number.isFinite(t.amount) || t.amount <= 0) {
        return false;
      }
      const check = validatePriceTick({
        payloadSymbol: normSym,
        expectedSymbol: state.activeSymbol,
        price: t.price,
        referencePrice: refPrice,
        referenceUpdatedAt: refUpdatedAt,
        maxDeviationPct: 5,
        now,
      });
      return check.valid;
    });

    if (validTrades.length === 0) {
      if (params.trades.length > 0) {
        set((prev) => ({
          rejectedPayloadsCount: prev.rejectedPayloadsCount + 1,
          lastRejectedReason: `INVALID_TRADES:${normSym}`,
        }));
      }
      return false;
    }

    set((prev) => {
      // Deduplicate by trade id and cap at 30 recent trades
      const seen = new Set<string | number>();
      const merged: LiveTradeTick[] = [];
      for (const tr of [...validTrades, ...prev.recentTrades]) {
        if (!seen.has(tr.id)) {
          seen.add(tr.id);
          merged.push(tr);
          if (merged.length >= 30) break;
        }
      }
      return {
        recentTrades: merged,
        recentTradesUpdatedAt: now,
        lastWsMessageAt: params.source === 'WS' ? now : prev.lastWsMessageAt,
      };
    });

    return true;
  },

  setConnectionState: (patch) => {
    set((prev) => ({
      wsStatus: patch.wsStatus ?? prev.wsStatus,
      fallbackPollingActive: patch.fallbackPollingActive ?? prev.fallbackPollingActive,
      reconnectAttempt: patch.reconnectAttempt ?? prev.reconnectAttempt,
      latencyMs: patch.latencyMs ?? prev.latencyMs,
      lastWsMessageAt:
        patch.lastWsMessageAt !== undefined ? patch.lastWsMessageAt : prev.lastWsMessageAt,
    }));

    if (patch.wsStatus) {
      useTickerStore.getState().setWsStatus(patch.wsStatus);
    }
    if (typeof patch.latencyMs === 'number') {
      useTickerStore.getState().setLatency(patch.latencyMs);
    }
  },

  setOnlineStatus: (isOnline: boolean) => {
    set((prev) => ({
      isOnline,
      wsStatus: !isOnline ? 'disconnected' : prev.wsStatus,
    }));
    if (!isOnline) {
      useTickerStore.getState().setWsStatus('disconnected');
    }
  },

  recordHeartbeat: (latencyMs, now = Date.now()) => {
    set((prev) => ({
      latencyMs: typeof latencyMs === 'number' && latencyMs >= 0 ? latencyMs : prev.latencyMs,
      lastWsMessageAt: now,
    }));
    if (typeof latencyMs === 'number' && latencyMs >= 0) {
      useTickerStore.getState().setLatency(latencyMs);
    }
  },

  resetStoreForTesting: () => {
    set({
      activeSymbol: 'BTC/USDT',
      symbolEpoch: 1,
      tickers: {},
      orderBook: createEmptyOrderBook('BTC/USDT', 1),
      recentTrades: [],
      recentTradesUpdatedAt: null,
      wsStatus: 'connecting',
      isOnline: true,
      fallbackPollingActive: false,
      reconnectAttempt: 0,
      latencyMs: 0,
      lastWsMessageAt: null,
      rejectedPayloadsCount: 0,
      lastRejectedReason: null,
    });
    useOrderBookStore.getState().setOrderBook('BTC/USDT', [], []);
    useOrderBookStore.getState().setRecentTrades([]);
  },
}));
