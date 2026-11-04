import {
  CoinMetaEntry,
  CoinMetaLookupIndex,
  DEFAULT_COIN_OVERRIDES,
  isGenuineCoinGeckoImageUrl,
  useCoinMetaStore,
} from '../stores/useCoinMetaStore';

export type CoinLogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export const COIN_LOGO_SIZE_PX: Record<CoinLogoSize, number> = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 48,
};

const STANDALONE_QUOTE_COINS = new Set([
  'USDT',
  'USDC',
  'FDUSD',
  'BUSD',
  'TUSD',
  'USDE',
  'DAI',
  'PYUSD',
  'USD',
]);

const QUOTE_AND_CONTRACT_SUFFIXES = [
  'USDT',
  'USDC',
  'FDUSD',
  'BUSD',
  'TUSD',
  'PERP',
  'SWAP',
  'USD',
];

const MULTIPLIER_PREFIX_PATTERNS: RegExp[] = [
  /^1000000([A-Z0-9]{2,})$/,
  /^100000([A-Z0-9]{2,})$/,
  /^10000([A-Z0-9]{2,})$/,
  /^1000([A-Z0-9]{2,})$/,
  /^1M([A-Z]{2,})$/,
];

// Curated 12-color dark-theme Tailwind palette for initial-letter fallback (zero inline styles)
const FALLBACK_TAILWIND_PALETTE: string[] = [
  'bg-pink-950/90 text-pink-200 border-pink-400/35',
  'bg-cyan-950/90 text-cyan-200 border-cyan-400/35',
  'bg-emerald-950/90 text-emerald-200 border-emerald-400/35',
  'bg-amber-950/90 text-amber-200 border-amber-400/35',
  'bg-violet-950/90 text-violet-200 border-violet-400/35',
  'bg-sky-950/90 text-sky-200 border-sky-400/35',
  'bg-rose-950/90 text-rose-200 border-rose-400/35',
  'bg-teal-950/90 text-teal-200 border-teal-400/35',
  'bg-indigo-950/90 text-indigo-200 border-indigo-400/35',
  'bg-fuchsia-950/90 text-fuchsia-200 border-fuchsia-400/35',
  'bg-lime-950/90 text-lime-200 border-lime-400/35',
  'bg-orange-950/90 text-orange-200 border-orange-400/35',
];

const unmappedSymbolsLog = new Set<string>();
const failedLogoUrls = new Set<string>();
const loadedLogoUrls = new Set<string>();

/**
 * Normalizes any exchange trading pair or futures contract ticker into its canonical base coin symbol.
 * Examples:
 * - "BTCUSDT"        -> "BTC"
 * - "1000PEPEUSDT"   -> "PEPE"
 * - "1MBABYDOGEUSDT" -> "BABYDOGE"
 * - "BTC/USDT"       -> "BTC"
 * - "BTC-USDT-SWAP"  -> "BTC"
 * - "SOL:USDT"       -> "SOL"
 * - "USDT"           -> "USDT"
 */
export function normalizeCoinSymbol(rawSymbol: string): string {
  if (!rawSymbol || typeof rawSymbol !== 'string') return '';

  let token = rawSymbol.trim().toUpperCase();
  if (!token) return '';

  // Remove parenthetical annotations e.g. "BTC (Bitcoin)" -> "BTC"
  const spaceIdx = token.indexOf(' ');
  if (spaceIdx > 0) {
    token = token.slice(0, spaceIdx);
  }

  // Strip perpetual settlement suffixes such as -SWAP, -PERP, :USDT
  token = token.replace(/[-_:](SWAP|PERP)$/i, '');
  token = token.replace(/:(USDT|USDC|USD|BUSD|FDUSD)$/i, '');

  if (/[\/\-_]/.test(token)) {
    token = token.split(/[\/\-_]/)[0] || token;
  } else if (!STANDALONE_QUOTE_COINS.has(token)) {
    for (const suffix of QUOTE_AND_CONTRACT_SUFFIXES) {
      if (token.endsWith(suffix) && token.length > suffix.length) {
        token = token.slice(0, -suffix.length);
        break;
      }
    }
    // Handle compound suffixes like BTCUSDTPERP -> BTCUSDT -> BTC
    if (!STANDALONE_QUOTE_COINS.has(token)) {
      for (const quote of ['USDT', 'USDC', 'FDUSD', 'BUSD', 'USD']) {
        if (token.endsWith(quote) && token.length > quote.length) {
          token = token.slice(0, -quote.length);
          break;
        }
      }
    }
  }

  // Strip futures denomination multipliers (1000PEPE -> PEPE, 1MBABYDOGE -> BABYDOGE)
  for (const pattern of MULTIPLIER_PREFIX_PATTERNS) {
    const match = token.match(pattern);
    if (match?.[1]) {
      token = match[1];
      break;
    }
  }

  return token.replace(/[^A-Z0-9]/g, '');
}

/**
 * Selects the optimal CoinGecko CDN variant (`thumb`, `small`, `large`) strictly from an
 * existing API-returned `image` URL without ever constructing or guessing image paths/IDs.
 *
 * - `sizePx <= 20` (`xs` 16px, `sm` 20px) -> `thumb`
 * - `sizePx <= 32` (`md` 24px, `lg` 32px) -> `small`
 * - `sizePx > 32`  (`xl` 48px)            -> `large`
 */
export function selectCoinGeckoImageSize(apiImageUrl: string, sizePx: number): string {
  if (!isGenuineCoinGeckoImageUrl(apiImageUrl)) {
    return '';
  }

  const targetVariant = sizePx <= 20 ? 'thumb' : sizePx <= 32 ? 'small' : 'large';
  return apiImageUrl.replace(/\/(large|small|thumb)\//, `/${targetVariant}/`);
}

/**
 * Pure lookup resolver used by both `getCoinLogo` and unit tests.
 */
export function resolveCoinMeta(
  rawSymbol: string,
  lookup: CoinMetaLookupIndex,
  overrides: Record<string, string> = DEFAULT_COIN_OVERRIDES
): CoinMetaEntry | null {
  const baseSymbol = normalizeCoinSymbol(rawSymbol);
  if (!baseSymbol) return null;

  // 1. Explicit curated override ID (resolves ambiguous tickers & exchange rebrands)
  const overrideId = overrides[baseSymbol];
  if (overrideId) {
    const byOverride = lookup.byId.get(overrideId);
    if (byOverride) return byOverride;
  }

  // 2. Fallback to highest market_cap_rank match on lowercase symbol
  const direct = lookup.bySymbol.get(baseSymbol.toLowerCase());
  if (direct) return direct;

  return null;
}

function recordUnmappedSymbolOnce(baseSymbol: string): void {
  if (!baseSymbol || unmappedSymbolsLog.has(baseSymbol)) return;
  unmappedSymbolsLog.add(baseSymbol);
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') {
    return;
  }
  console.debug(`[CoinLogo] Unmapped symbol fallback: ${baseSymbol}`);
}

export function getUnmappedCoinSymbols(): string[] {
  return Array.from(unmappedSymbolsLog.values());
}

export function clearUnmappedCoinSymbols(): void {
  unmappedSymbolsLog.clear();
}

export function markCoinLogoFailed(url: string): void {
  if (url) failedLogoUrls.add(url);
}

export function isCoinLogoUrlFailed(url: string): boolean {
  return Boolean(url && failedLogoUrls.has(url));
}

export function markCoinLogoLoaded(url: string): void {
  if (url) loadedLogoUrls.add(url);
}

export function isCoinLogoUrlLoaded(url: string): boolean {
  return Boolean(url && loadedLogoUrls.has(url));
}

export function resetCoinLogoRuntimeState(): void {
  unmappedSymbolsLog.clear();
  failedLogoUrls.clear();
  loadedLogoUrls.clear();
}

/**
 * Single authoritative CoinGecko logo lookup function (Step C):
 * `getCoinLogo(symbol, size) -> { url, name } | null`
 */
export function getCoinLogo(
  symbol: string,
  size: CoinLogoSize = 'md'
): { url: string; name: string } | null {
  const baseSymbol = normalizeCoinSymbol(symbol);
  if (!baseSymbol) return null;

  const { lookup, status, count } = useCoinMetaStore.getState();
  const entry = resolveCoinMeta(baseSymbol, lookup, DEFAULT_COIN_OVERRIDES);

  if (!entry) {
    if (status === 'ready' && count > 0) {
      recordUnmappedSymbolOnce(baseSymbol);
    }
    return null;
  }

  const px = COIN_LOGO_SIZE_PX[size] ?? 24;
  const url = selectCoinGeckoImageSize(entry.image, px);
  if (!url || isCoinLogoUrlFailed(url)) {
    return null;
  }

  return {
    url,
    name: entry.name,
  };
}

/**
 * Deterministic hashed Tailwind class set for initial-letter fallback badges.
 */
export function getCoinFallbackPaletteClass(symbol: string): string {
  const base = normalizeCoinSymbol(symbol) || '?';
  let hash = 2166136261;
  for (let i = 0; i < base.length; i++) {
    hash ^= base.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const index = Math.abs(hash) % FALLBACK_TAILWIND_PALETTE.length;
  return FALLBACK_TAILWIND_PALETTE[index];
}

/**
 * Returns 1-2 uppercase initial letters for circular monogram fallback.
 */
export function getCoinFallbackInitials(symbol: string, size: CoinLogoSize = 'md'): string {
  const base = normalizeCoinSymbol(symbol);
  if (!base) return '?';
  return size === 'xs' ? base.slice(0, 1) : base.slice(0, 2);
}

/**
 * Prefetches logos ONLY for high-priority visible symbols (active pair + Watchlist) — Step F.
 */
export function prefetchCoinLogos(symbols: string[], size: CoinLogoSize = 'md'): void {
  if (typeof window === 'undefined' || typeof Image === 'undefined') return;
  const unique = Array.from(new Set(symbols.map((s) => normalizeCoinSymbol(s)).filter(Boolean))).slice(
    0,
    16
  );

  for (const sym of unique) {
    const resolved = getCoinLogo(sym, size);
    if (!resolved || isCoinLogoUrlLoaded(resolved.url) || isCoinLogoUrlFailed(resolved.url)) {
      continue;
    }
    const img = new Image();
    img.decoding = 'async';
    img.referrerPolicy = 'no-referrer';
    img.onload = () => markCoinLogoLoaded(resolved.url);
    img.onerror = () => markCoinLogoFailed(resolved.url);
    img.src = resolved.url;
  }
}
