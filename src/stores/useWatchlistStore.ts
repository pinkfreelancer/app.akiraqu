import { create } from 'zustand';
import { WatchlistFolder, WatchlistItem } from '../types/crypto.types';
import { normalizeSymbol } from '../services/marketDataValidator';

const STORAGE_KEY = 'akiraqu_watchlist_v1';

export const INITIAL_WATCHLIST_FOLDERS: WatchlistFolder[] = [
  {
    id: 'fav-core',
    name: 'Favorit Utama',
    icon: '⭐',
    description: 'Aset inti kapitalisasi pasar tinggi dan likuiditas teratas',
    color: 'text-amber-400',
  },
  {
    id: 'momentum-hot',
    name: 'High Momentum',
    icon: '🚀',
    description: 'Koin yang sedang mengalami lonjakan volume dan breakout tren',
    color: 'text-cyan-400',
  },
  {
    id: 'defi-ai',
    name: 'DeFi & AI Gems',
    icon: '💎',
    description: 'Proyek berfundamental kuat sektor Artificial Intelligence dan DeFi',
    color: 'text-purple-400',
  },
  {
    id: 'futures-scalp',
    name: 'Futures Scalping',
    icon: '🔥',
    description: 'Pasangan dengan spread tipis untuk eksekusi intraday dan leverage',
    color: 'text-rose-400',
  },
];

export const INITIAL_WATCHLIST_ITEMS: WatchlistItem[] = [
  {
    id: 'w-1',
    folderId: 'fav-core',
    symbol: 'BTC/USDT',
    name: 'Bitcoin',
    category: 'Layer 1',
    currentPrice: 0,
    change24h: 0,
    high24h: 0,
    low24h: 0,
    volume24h: 38450000000,
    marketCap: 1620000000000,
    confluenceScore: 86,
    sparkline: [0.97, 0.98, 0.99, 1.0, 0.995, 1.005, 1.0],
    notes: 'Pantau area keseimbangan VWAP dan konfirmasi candle 4H.',
    addedAt: '2026-06-10',
  },
  {
    id: 'w-2',
    folderId: 'fav-core',
    symbol: 'ETH/USDT',
    name: 'Ethereum',
    category: 'Layer 1',
    currentPrice: 0,
    change24h: 0,
    high24h: 0,
    low24h: 0,
    volume24h: 18450000000,
    marketCap: 340000000000,
    confluenceScore: 78,
    sparkline: [1.01, 1.02, 1.0, 0.99, 1.005, 0.995, 1.0],
    notes: 'Pantau reaksi likuiditas FVG support utama.',
    addedAt: '2026-06-11',
  },
  {
    id: 'w-3',
    folderId: 'momentum-hot',
    symbol: 'SOL/USDT',
    name: 'Solana',
    category: 'Layer 1',
    currentPrice: 0,
    change24h: 0,
    high24h: 0,
    low24h: 0,
    volume24h: 7820000000,
    marketCap: 82400000000,
    confluenceScore: 88,
    sparkline: [0.94, 0.96, 0.97, 0.98, 0.99, 0.995, 1.0],
    notes: 'Momentum likuiditas tinggi lintas bursa.',
    addedAt: '2026-06-12',
  },
  {
    id: 'w-4',
    folderId: 'momentum-hot',
    symbol: 'SUI/USDT',
    name: 'Sui Network',
    category: 'Layer 1',
    currentPrice: 0,
    change24h: 0,
    high24h: 0,
    low24h: 0,
    volume24h: 1850000000,
    marketCap: 9800000000,
    confluenceScore: 85,
    sparkline: [0.92, 0.94, 0.96, 0.98, 0.97, 0.99, 1.0],
    notes: 'Pantau kelanjutan momentum breakout intraday.',
    addedAt: '2026-06-12',
  },
  {
    id: 'w-5',
    folderId: 'defi-ai',
    symbol: 'NEAR/USDT',
    name: 'NEAR Protocol',
    category: 'AI & Big Data',
    currentPrice: 0,
    change24h: 0,
    high24h: 0,
    low24h: 0,
    volume24h: 980000000,
    marketCap: 8200000000,
    confluenceScore: 84,
    sparkline: [0.93, 0.95, 0.97, 0.96, 0.98, 0.99, 1.0],
    notes: 'Sektor AI & Big Data dengan likuiditas kuat.',
    addedAt: '2026-06-13',
  },
  {
    id: 'w-6',
    folderId: 'defi-ai',
    symbol: 'FET/USDT',
    name: 'Artificial Superintelligence',
    category: 'AI & Big Data',
    currentPrice: 0,
    change24h: 0,
    high24h: 0,
    low24h: 0,
    volume24h: 380000000,
    marketCap: 3800000000,
    confluenceScore: 83,
    sparkline: [0.91, 0.93, 0.96, 0.95, 0.98, 0.99, 1.0],
    notes: 'Pantau volume delta spot pada sesi aktif.',
    addedAt: '2026-06-13',
  },
  {
    id: 'w-7',
    folderId: 'futures-scalp',
    symbol: 'PEPE/USDT',
    name: 'Pepe',
    category: 'Meme',
    currentPrice: 0,
    change24h: 0,
    high24h: 0,
    low24h: 0,
    volume24h: 1450000000,
    marketCap: 4540000000,
    confluenceScore: 80,
    sparkline: [0.9, 0.93, 0.95, 0.94, 0.97, 0.99, 1.0],
    notes: 'Volatilitas tinggi untuk scalping cepat 15m.',
    addedAt: '2026-06-14',
  },
];

function loadPersistedWatchlist(): { folders: WatchlistFolder[]; items: WatchlistItem[] } {
  if (typeof window === 'undefined') {
    return { folders: INITIAL_WATCHLIST_FOLDERS, items: INITIAL_WATCHLIST_ITEMS };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed?.folders) && Array.isArray(parsed?.items)) {
        return { folders: parsed.folders, items: parsed.items };
      }
    }
  } catch {
    // Ignore storage read error
  }
  return { folders: INITIAL_WATCHLIST_FOLDERS, items: INITIAL_WATCHLIST_ITEMS };
}

function persistWatchlist(folders: WatchlistFolder[], items: WatchlistItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ folders, items }));
  } catch {
    // Ignore quota errors
  }
}

export interface ToggleWatchlistInput {
  symbol: string;
  name?: string;
  price?: number;
  change24h?: number;
  volume24h?: number;
  marketCap?: number;
  confluenceScore?: number;
  folderId?: string;
}

export interface WatchlistStoreState {
  folders: WatchlistFolder[];
  items: WatchlistItem[];
  setFolders: (folders: WatchlistFolder[]) => void;
  setItems: (items: WatchlistItem[]) => void;
  toggleSymbol: (input: ToggleWatchlistInput) => { added: boolean; symbol: string };
  isSymbolWatched: (symbol: string) => boolean;
}

const initial = loadPersistedWatchlist();

export const useWatchlistStore = create<WatchlistStoreState>((set, get) => ({
  folders: initial.folders,
  items: initial.items,

  setFolders: (folders) => {
    set((state) => {
      persistWatchlist(folders, state.items);
      return { folders };
    });
  },

  setItems: (items) => {
    set((state) => {
      persistWatchlist(state.folders, items);
      return { items };
    });
  },

  isSymbolWatched: (symbol: string) => {
    const norm = normalizeSymbol(symbol);
    if (!norm) return false;
    return get().items.some((item) => normalizeSymbol(item.symbol) === norm);
  },

  toggleSymbol: (input: ToggleWatchlistInput) => {
    const norm = normalizeSymbol(input.symbol);
    const state = get();
    const exists = state.items.some((i) => normalizeSymbol(i.symbol) === norm);

    if (exists) {
      const nextItems = state.items.filter((i) => normalizeSymbol(i.symbol) !== norm);
      persistWatchlist(state.folders, nextItems);
      set({ items: nextItems });
      return { added: false, symbol: norm };
    }

    const price = typeof input.price === 'number' && input.price > 0 ? input.price : 0;
    const targetFolderId = input.folderId || state.folders[0]?.id || 'fav-core';
    const newItem: WatchlistItem = {
      id: `w-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      folderId: targetFolderId,
      symbol: norm,
      name: input.name || norm.split('/')[0],
      category: 'Perpetual USDT-M',
      currentPrice: price,
      change24h: typeof input.change24h === 'number' ? input.change24h : 0,
      high24h: price > 0 ? price * 1.03 : 0,
      low24h: price > 0 ? price * 0.97 : 0,
      volume24h: typeof input.volume24h === 'number' && input.volume24h > 0 ? input.volume24h : 50_000_000,
      marketCap: typeof input.marketCap === 'number' && input.marketCap > 0 ? input.marketCap : 0,
      confluenceScore:
        typeof input.confluenceScore === 'number' ? Math.round(input.confluenceScore) : 75,
      sparkline: [0.96, 0.97, 0.98, 0.99, 1.0],
      notes: 'Ditambahkan dari Screener MTF.',
      addedAt: new Date().toISOString().slice(0, 10),
    };

    const nextItems = [newItem, ...state.items];
    persistWatchlist(state.folders, nextItems);
    set({ items: nextItems });
    return { added: true, symbol: norm };
  },
}));
