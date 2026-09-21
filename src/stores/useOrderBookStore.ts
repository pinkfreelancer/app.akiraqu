import { create } from 'zustand';

export interface OrderBookLevel {
  price: number;
  amount: number;
  total?: number;
}

export interface LiveTrade {
  id: string;
  price: number;
  amount: number;
  side: 'buy' | 'sell';
  time: number;
}

export interface OrderBookState {
  symbol: string;
  bids: [number, number][]; // [price, amount]
  asks: [number, number][];
  bidTotal: number;
  askTotal: number;
  spread: number;
  spreadPercentage: number;
  recentTrades: LiveTrade[];
  orderFlowDelta: number;
  lastUpdated: number;

  // Actions
  setOrderBook: (symbol: string, bids: [number, number][], asks: [number, number][]) => void;
  addTrade: (trade: LiveTrade) => void;
  setRecentTrades: (trades: LiveTrade[]) => void;
}

export const useOrderBookStore = create<OrderBookState>((set) => ({
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

  setOrderBook: (symbol, bids, asks) => {
    const bidTotal = bids.reduce((acc, b) => acc + (b[1] || 0), 0);
    const askTotal = asks.reduce((acc, a) => acc + (a[1] || 0), 0);
    const bestBid = bids.length > 0 ? bids[0][0] : 0;
    const bestAsk = asks.length > 0 ? asks[0][0] : 0;
    const spread = bestAsk > bestBid && bestBid > 0 ? bestAsk - bestBid : 0;
    const spreadPercentage = bestBid > 0 ? (spread / bestBid) * 100 : 0;

    set({
      symbol,
      bids,
      asks,
      bidTotal,
      askTotal,
      spread,
      spreadPercentage,
      lastUpdated: Date.now(),
    });
  },

  addTrade: (trade) => {
    set((state) => {
      const deltaImpact = trade.side === 'buy' ? trade.amount : -trade.amount;
      const updatedTrades = [trade, ...state.recentTrades.slice(0, 49)];
      return {
        recentTrades: updatedTrades,
        orderFlowDelta: state.orderFlowDelta + deltaImpact,
        lastUpdated: Date.now(),
      };
    });
  },

  setRecentTrades: (trades) => {
    set({
      recentTrades: trades.slice(0, 50),
      lastUpdated: Date.now(),
    });
  },
}));
