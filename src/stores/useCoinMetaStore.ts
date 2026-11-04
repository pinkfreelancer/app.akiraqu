import { create } from 'zustand';
import coinLogoOverridesRaw from '../data/coinLogoOverrides.json';

export interface CoinMetaEntry {
  id: string;
  symbol: string;
  name: string;
  image: string;
  market_cap_rank: number | null;
}

export interface CoinMetaLookupIndex {
  byId: Map<string, CoinMetaEntry>;
  bySymbol: Map<string, CoinMetaEntry>;
}

export type CoinMetaLoadStatus = 'idle' | 'loading' | 'ready' | 'degraded';

const STORAGE_KEY = 'akiraqu_coin_meta_cache_v1';
const LOCAL_FRESH_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const LOCAL_MAX_STALE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days offline resilience

export const DEFAULT_COIN_OVERRIDES: Record<string, string> = coinLogoOverridesRaw as Record<
  string,
  string
>;

export function isGenuineCoinGeckoImageUrl(url: unknown): url is string {
  if (typeof url !== 'string' || !url.startsWith('https://')) return false;
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === 'coin-images.coingecko.com' ||
      parsed.hostname === 'assets.coingecko.com'
    );
  } catch {
    return false;
  }
}

/**
 * Builds O(1) lookup maps by CoinGecko `id` and lowercase `symbol`.
 * When multiple coins share the same ticker symbol (e.g. UNI, TON, PEPE, CAT),
 * the coin with the best (lowest positive) `market_cap_rank` always wins.
 */
export function buildCoinMetaLookup(entries: CoinMetaEntry[]): CoinMetaLookupIndex {
  const byId = new Map<string, CoinMetaEntry>();
  const bySymbol = new Map<string, CoinMetaEntry>();

  for (const entry of entries) {
    if (!entry?.id || !entry?.symbol || !isGenuineCoinGeckoImageUrl(entry.image)) {
      continue;
    }

    const normalizedEntry: CoinMetaEntry = {
      id: entry.id.trim(),
      symbol: entry.symbol.trim().toLowerCase(),
      name: entry.name?.trim() || entry.symbol.toUpperCase(),
      image: entry.image.trim(),
      market_cap_rank:
        typeof entry.market_cap_rank === 'number' &&
        Number.isFinite(entry.market_cap_rank) &&
        entry.market_cap_rank > 0
          ? Math.round(entry.market_cap_rank)
          : null,
    };

    byId.set(normalizedEntry.id, normalizedEntry);

    const existing = bySymbol.get(normalizedEntry.symbol);
    if (!existing) {
      bySymbol.set(normalizedEntry.symbol, normalizedEntry);
    } else {
      const existingRank = existing.market_cap_rank ?? Number.MAX_SAFE_INTEGER;
      const candidateRank = normalizedEntry.market_cap_rank ?? Number.MAX_SAFE_INTEGER;
      if (candidateRank < existingRank) {
        bySymbol.set(normalizedEntry.symbol, normalizedEntry);
      }
    }
  }

  return { byId, bySymbol };
}

function readLocalCache(): { entries: CoinMetaEntry[]; updatedAt: number } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.entries) || parsed.entries.length === 0) return null;
    const updatedAt = Number(parsed.updatedAt) || 0;
    if (Date.now() - updatedAt > LOCAL_MAX_STALE_MS) return null;
    return { entries: parsed.entries, updatedAt };
  } catch {
    return null;
  }
}

function writeLocalCache(entries: CoinMetaEntry[], updatedAt: number): void {
  if (typeof window === 'undefined' || entries.length === 0) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ updatedAt, entries }));
  } catch {
    // Ignore storage quota errors
  }
}

export interface CoinMetaStoreState {
  status: CoinMetaLoadStatus;
  version: number;
  updatedAt: number;
  count: number;
  lookup: CoinMetaLookupIndex;
  setMetadata: (entries: CoinMetaEntry[], updatedAt?: number, persist?: boolean) => void;
  markDegraded: () => void;
  resetForTests: () => void;
}

const initialLocal = readLocalCache();
const initialLookup = initialLocal
  ? buildCoinMetaLookup(initialLocal.entries)
  : { byId: new Map<string, CoinMetaEntry>(), bySymbol: new Map<string, CoinMetaEntry>() };

export const useCoinMetaStore = create<CoinMetaStoreState>((set) => ({
  status: initialLocal && initialLookup.byId.size > 0 ? 'ready' : 'idle',
  version: initialLocal && initialLookup.byId.size > 0 ? 1 : 0,
  updatedAt: initialLocal?.updatedAt || 0,
  count: initialLookup.byId.size,
  lookup: initialLookup,

  setMetadata: (entries, updatedAt = Date.now(), persist = true) => {
    const lookup = buildCoinMetaLookup(entries);
    if (persist && lookup.byId.size > 0) {
      writeLocalCache(Array.from(lookup.byId.values()), updatedAt);
    }
    set((prev) => ({
      status: lookup.byId.size > 0 ? 'ready' : 'degraded',
      version: prev.version + 1,
      updatedAt,
      count: lookup.byId.size,
      lookup,
    }));
  },

  markDegraded: () => {
    set((prev) => ({
      status: prev.count > 0 ? 'ready' : 'degraded',
      version: prev.version + 1,
    }));
  },

  resetForTests: () => {
    hasFetchedInSession = false;
    inFlightMetaFetch = null;
    set({
      status: 'idle',
      version: 0,
      updatedAt: 0,
      count: 0,
      lookup: { byId: new Map(), bySymbol: new Map() },
    });
  },
}));

let inFlightMetaFetch: Promise<void> | null = null;
let hasFetchedInSession = false;

/**
 * Loads coin logo metadata AT MOST ONCE per app session (Step F).
 * Uses fresh localStorage cache immediately when < 12h old without even making a network call,
 * or performs a single `/api/coins/meta` fetch with browser Cache-Control support.
 */
export function ensureCoinMetadataLoaded(force = false): Promise<void> {
  if (typeof fetch === 'undefined') {
    return Promise.resolve();
  }

  const state = useCoinMetaStore.getState();
  const isFreshLocal =
    !force &&
    state.count >= 500 &&
    state.updatedAt > 0 &&
    Date.now() - state.updatedAt < LOCAL_FRESH_TTL_MS;

  if (isFreshLocal) {
    hasFetchedInSession = true;
    return Promise.resolve();
  }

  if (!force && hasFetchedInSession) {
    return inFlightMetaFetch || Promise.resolve();
  }

  if (inFlightMetaFetch) {
    return inFlightMetaFetch;
  }

  hasFetchedInSession = true;
  if (state.count === 0) {
    useCoinMetaStore.setState({ status: 'loading' });
  }

  inFlightMetaFetch = (async () => {
    try {
      const response = await fetch(force ? '/api/coins/meta?force=true' : '/api/coins/meta', {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        useCoinMetaStore.getState().markDegraded();
        return;
      }
      const payload = await response.json();
      const rows: CoinMetaEntry[] = Array.isArray(payload?.data) ? payload.data : [];
      if (rows.length > 0) {
        useCoinMetaStore
          .getState()
          .setMetadata(rows, Number(payload?.updatedAt) || Date.now(), true);
      } else {
        useCoinMetaStore.getState().markDegraded();
      }
    } catch {
      useCoinMetaStore.getState().markDegraded();
    } finally {
      inFlightMetaFetch = null;
    }
  })();

  return inFlightMetaFetch;
}
