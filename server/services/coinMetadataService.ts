import fs from 'fs';
import os from 'os';
import path from 'path';
import coinLogoOverridesRaw from '../../src/data/coinLogoOverrides.json';
import { mtfScreenerEngine } from './mtfScreenerEngine';

export interface CoinMetaRecord {
  id: string;
  symbol: string;
  name: string;
  image: string;
  market_cap_rank: number | null;
}

interface PersistedCoinMetaCache {
  updatedAt: number;
  items: CoinMetaRecord[];
}

interface CoinListEntry {
  id: string;
  symbol: string;
  name: string;
}

const coinLogoOverrides: Record<string, string> = coinLogoOverridesRaw as Record<string, string>;

// Cache TTL configuration (Step B: 6-24h fresh TTL + stale-while-revalidate)
const FRESH_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const STALE_WHILE_REVALIDATE_MS = 72 * 60 * 60 * 1000; // 72 hours
const COIN_LIST_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const PER_PAGE = 250;
const TARGET_PAGES = 4; // 4 x 250 = 1,000 top coins by market cap (>= 500 required)

function stripExchangePrefixAndSuffix(rawSymbol: string): string {
  if (!rawSymbol) return '';
  let token = rawSymbol.trim().toUpperCase();
  token = token.replace(/[-_:](SWAP|PERP)$/i, '');
  token = token.replace(/:(USDT|USDC|USD|BUSD|FDUSD)$/i, '');

  if (/[\/\-_]/.test(token)) {
    token = token.split(/[\/\-_]/)[0] || token;
  } else {
    const standalone = new Set(['USDT', 'USDC', 'FDUSD', 'BUSD', 'TUSD', 'USDE', 'DAI', 'PYUSD', 'USD']);
    if (!standalone.has(token)) {
      const suffixes = ['USDT', 'USDC', 'FDUSD', 'BUSD', 'TUSD', 'PERP', 'SWAP', 'USD'];
      for (const suffix of suffixes) {
        if (token.endsWith(suffix) && token.length > suffix.length) {
          token = token.slice(0, -suffix.length);
          break;
        }
      }
      for (const quote of ['USDT', 'USDC', 'USD']) {
        if (token.endsWith(quote) && token.length > quote.length && !standalone.has(token)) {
          token = token.slice(0, -quote.length);
          break;
        }
      }
    }
  }

  const multiplierPatterns = [
    /^1000000([A-Z0-9]{2,})$/,
    /^100000([A-Z0-9]{2,})$/,
    /^10000([A-Z0-9]{2,})$/,
    /^1000([A-Z0-9]{2,})$/,
    /^1M([A-Z]{2,})$/,
  ];
  for (const pattern of multiplierPatterns) {
    const match = token.match(pattern);
    if (match?.[1]) {
      token = match[1];
      break;
    }
  }

  return token;
}

function isValidCoinGeckoImageUrl(image: unknown): image is string {
  if (typeof image !== 'string' || !image.startsWith('https://')) return false;
  try {
    const parsed = new URL(image);
    return (
      parsed.hostname === 'coin-images.coingecko.com' ||
      parsed.hostname === 'assets.coingecko.com'
    );
  } catch {
    return false;
  }
}

function sanitizeCoinMetaRecord(raw: any): CoinMetaRecord | null {
  if (!raw || typeof raw !== 'object') return null;
  const id = typeof raw.id === 'string' ? raw.id.trim() : '';
  const symbol = typeof raw.symbol === 'string' ? raw.symbol.trim().toLowerCase() : '';
  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  const image = raw.image;
  if (!id || !symbol || !name || !isValidCoinGeckoImageUrl(image)) {
    return null;
  }
  const rank =
    typeof raw.market_cap_rank === 'number' &&
    Number.isFinite(raw.market_cap_rank) &&
    raw.market_cap_rank > 0
      ? Math.round(raw.market_cap_rank)
      : null;

  // Store ONLY the 5 permitted static metadata fields (Step B)
  return {
    id,
    symbol,
    name,
    image,
    market_cap_rank: rank,
  };
}

class CoinMetadataService {
  private items: CoinMetaRecord[] = [];
  private updatedAt = 0;
  private refreshPromise: Promise<void> | null = null;
  private backoffUntil = 0;
  private consecutiveFailures = 0;
  private lastError: string | null = null;
  private completedPages = new Set<number>();
  private supplementalCompleted = false;
  private retryTimer: NodeJS.Timeout | null = null;

  private coinListBySymbol = new Map<string, string[]>();
  private coinListFetchedAt = 0;

  private readonly primaryCachePath = path.join(
    process.cwd(),
    'server',
    'data',
    'coingecko-coins-meta.cache.json'
  );
  private readonly fallbackCachePath = path.join(
    os.tmpdir(),
    'akiraqu-coingecko-coins-meta.cache.json'
  );

  constructor() {
    this.loadDiskCacheSync();
  }

  private loadDiskCacheSync(): void {
    for (const candidatePath of [this.primaryCachePath, this.fallbackCachePath]) {
      try {
        if (!fs.existsSync(candidatePath)) continue;
        const raw = fs.readFileSync(candidatePath, 'utf8');
        const parsed = JSON.parse(raw) as PersistedCoinMetaCache;
        if (parsed && Array.isArray(parsed.items) && parsed.items.length > 0) {
          const valid = parsed.items
            .map(sanitizeCoinMetaRecord)
            .filter((item): item is CoinMetaRecord => item !== null);
          if (valid.length > 0) {
            this.items = valid;
            this.updatedAt = Number(parsed.updatedAt) || Date.now();
            const fullPages = Math.min(TARGET_PAGES, Math.floor(valid.length / (PER_PAGE - 15)));
            for (let p = 1; p <= fullPages; p++) {
              this.completedPages.add(p);
            }
            return;
          }
        }
      } catch {
        // Ignore unreadable disk cache and continue
      }
    }
  }

  private persistDiskCache(items: CoinMetaRecord[], updatedAt: number): void {
    const payload = JSON.stringify({ updatedAt, items });
    try {
      fs.mkdirSync(path.dirname(this.primaryCachePath), { recursive: true });
      fs.writeFileSync(this.primaryCachePath, payload, 'utf8');
      return;
    } catch {
      // Fallback to OS temp dir in read-only serverless environments (e.g. Vercel)
    }

    try {
      fs.writeFileSync(this.fallbackCachePath, payload, 'utf8');
    } catch {
      // Ignore if tmp is also unavailable; in-memory cache remains active
    }
  }

  private getCoinGeckoConfig(): { baseUrl: string; headers: Record<string, string>; hasKey: boolean } {
    const proKey = process.env.COINGECKO_PRO_API_KEY?.trim();
    const demoKey = process.env.COINGECKO_API_KEY?.trim();

    const headers: Record<string, string> = {
      Accept: 'application/json',
      'User-Agent': 'AKIRAQU-Terminal/1.0',
    };

    if (proKey) {
      headers['x-cg-pro-api-key'] = proKey;
      return {
        baseUrl: 'https://pro-api.coingecko.com/api/v3',
        headers,
        hasKey: true,
      };
    }

    if (demoKey) {
      headers['x-cg-demo-api-key'] = demoKey;
      return {
        baseUrl: 'https://api.coingecko.com/api/v3',
        headers,
        hasKey: true,
      };
    }

    return {
      baseUrl: 'https://api.coingecko.com/api/v3',
      headers,
      hasKey: false,
    };
  }

  private registerBackoff(status: number, retryAfterHeader: string | null, reason: string): void {
    this.consecutiveFailures = Math.min(8, this.consecutiveFailures + 1);
    const retryAfterSec = retryAfterHeader ? parseInt(retryAfterHeader, 10) : NaN;
    const baseMs =
      Number.isFinite(retryAfterSec) && retryAfterSec > 0
        ? retryAfterSec * 1000
        : status === 429
        ? Math.min(300_000, 30_000 * Math.pow(2, this.consecutiveFailures - 1))
        : Math.min(180_000, 15_000 * Math.pow(2, this.consecutiveFailures - 1));
    const jitterMs = Math.round(baseMs * (0.85 + Math.random() * 0.3));
    this.backoffUntil = Math.max(this.backoffUntil, Date.now() + jitterMs);
    this.lastError = reason;
    console.warn(`[CoinMetadataService] ${reason} — backing off for ${Math.round(jitterMs / 1000)}s`);

    if ((this.items.length < 750 || !this.supplementalCompleted) && !this.retryTimer) {
      const waitMs = Math.max(2000, this.backoffUntil - Date.now() + 1500);
      this.retryTimer = setTimeout(() => {
        this.retryTimer = null;
        if (this.items.length >= 750) {
          void this.ensureScreenerCoverage();
        } else {
          void this.triggerBackgroundRefresh(false);
        }
      }, waitMs);
      this.retryTimer.unref?.();
    }
  }

  private async sleep(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async fetchMarketsBatch(url: string, headers: Record<string, string>): Promise<CoinMetaRecord[] | null> {
    try {
      const response = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(8000),
      });

      if (response.status === 429 || response.status >= 500) {
        this.registerBackoff(
          response.status,
          response.headers.get('retry-after'),
          `CoinGecko HTTP ${response.status}`
        );
        return null;
      }

      if (!response.ok) {
        this.lastError = `CoinGecko HTTP ${response.status}`;
        return null;
      }

      const json = await response.json();
      if (!Array.isArray(json)) return null;

      return json
        .map(sanitizeCoinMetaRecord)
        .filter((item): item is CoinMetaRecord => item !== null);
    } catch (err: any) {
      this.registerBackoff(503, null, `CoinGecko network error: ${err?.message || 'timeout'}`);
      return null;
    }
  }

  private async ensureCoinListCatalog(baseUrl: string, headers: Record<string, string>): Promise<void> {
    const now = Date.now();
    if (this.coinListBySymbol.size > 0 && now - this.coinListFetchedAt < COIN_LIST_TTL_MS) {
      return;
    }
    if (now < this.backoffUntil) return;

    try {
      const res = await fetch(`${baseUrl}/coins/list?include_platform=false`, {
        headers,
        signal: AbortSignal.timeout(9000),
      });
      if (res.status === 429 || res.status >= 500) {
        this.registerBackoff(res.status, res.headers.get('retry-after'), `CoinGecko /coins/list HTTP ${res.status}`);
        return;
      }
      if (!res.ok) return;

      const list = (await res.json()) as CoinListEntry[];
      if (!Array.isArray(list) || list.length === 0) return;

      const nextMap = new Map<string, string[]>();
      for (const entry of list) {
        if (!entry?.id || !entry?.symbol) continue;
        const sym = entry.symbol.trim().toLowerCase();
        if (!sym) continue;
        // Skip Bridged / Wrapped derivative noise when indexing supplemental candidates
        const idLower = entry.id.toLowerCase();
        if (idLower.includes('bridged-') || idLower.includes('-wormhole') || idLower.includes('binance-peg-')) {
          continue;
        }
        const bucket = nextMap.get(sym) || [];
        if (bucket.length < 4) {
          bucket.push(entry.id);
          nextMap.set(sym, bucket);
        }
      }

      this.coinListBySymbol = nextMap;
      this.coinListFetchedAt = now;
    } catch {
      // Optional supplemental index — safe to skip on failure
    }
  }

  private async collectSupplementaryIds(
    existingById: Map<string, CoinMetaRecord>,
    existingSymbols: Set<string>,
    baseUrl: string,
    headers: Record<string, string>
  ): Promise<string[]> {
    const neededIds = new Set<string>();

    // 1. Ensure every curated override ID in coinLogoOverrides.json is present
    for (const overrideId of Object.values(coinLogoOverrides)) {
      if (overrideId && !existingById.has(overrideId)) {
        neededIds.add(overrideId);
      }
    }

    // 2. Check active 240-coin MTF Screener symbols for any mid-cap futures coins outside top 1,000
    try {
      const screenerSnapshot = await mtfScreenerEngine.getSnapshot();
      const missingScreenerSymbols = new Set<string>();

      for (const row of screenerSnapshot.rows) {
        const normSym = stripExchangePrefixAndSuffix(row.baseAsset || row.symbol);
        if (!normSym) continue;
        const overrideId = coinLogoOverrides[normSym];
        if (overrideId) {
          if (!existingById.has(overrideId)) neededIds.add(overrideId);
          continue;
        }
        if (!existingSymbols.has(normSym.toLowerCase())) {
          missingScreenerSymbols.add(normSym.toLowerCase());
        }
      }

      if (missingScreenerSymbols.size > 0) {
        await this.ensureCoinListCatalog(baseUrl, headers);
        for (const sym of missingScreenerSymbols) {
          const candidates = this.coinListBySymbol.get(sym);
          if (candidates) {
            for (const candidateId of candidates) {
              if (!existingById.has(candidateId)) {
                neededIds.add(candidateId);
              }
            }
          }
        }
      }
    } catch {
      // Screener may still be warming up; safe to ignore
    }

    return Array.from(neededIds).slice(0, 220);
  }

  private mergeAndPersist(byId: Map<string, CoinMetaRecord>): void {
    if (byId.size === 0) return;
    for (const prev of this.items) {
      if (!byId.has(prev.id)) {
        byId.set(prev.id, prev);
      }
    }
    const merged = Array.from(byId.values()).sort((a, b) => {
      const rankA = a.market_cap_rank ?? Number.MAX_SAFE_INTEGER;
      const rankB = b.market_cap_rank ?? Number.MAX_SAFE_INTEGER;
      if (rankA !== rankB) return rankA - rankB;
      return a.id.localeCompare(b.id);
    });
    this.items = merged;
    this.updatedAt = Date.now();
    this.persistDiskCache(merged, this.updatedAt);
  }

  private async performRefresh(): Promise<void> {
    if (Date.now() < this.backoffUntil) {
      return;
    }

    // If cache TTL expired completely, refresh all 4 pages; otherwise resume missing pages
    if (this.updatedAt > 0 && Date.now() - this.updatedAt > FRESH_TTL_MS) {
      this.completedPages.clear();
    }

    const { baseUrl, headers, hasKey } = this.getCoinGeckoConfig();
    const byId = new Map<string, CoinMetaRecord>(this.items.map((item) => [item.id, item]));
    const seenSymbols = new Set<string>(this.items.map((item) => item.symbol));
    const pageDelayMs = hasKey ? 150 : 2200;

    for (let page = 1; page <= TARGET_PAGES; page++) {
      if (this.completedPages.has(page)) continue;
      if (Date.now() < this.backoffUntil) break;

      const url = `${baseUrl}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${PER_PAGE}&page=${page}&sparkline=false`;
      const pageItems = await this.fetchMarketsBatch(url, headers);
      if (!pageItems) {
        break;
      }

      this.completedPages.add(page);
      for (const item of pageItems) {
        byId.set(item.id, item);
        seenSymbols.add(item.symbol);
      }

      // Persist incrementally after each 250-coin page so coverage grows immediately
      this.mergeAndPersist(byId);
      this.consecutiveFailures = 0;
      this.lastError = null;

      if (page < TARGET_PAGES) {
        await this.sleep(pageDelayMs);
      }
    }

    // Supplement any override IDs or active 240-coin screener symbols outside top 1,000
    if (byId.size >= PER_PAGE && Date.now() >= this.backoffUntil && !this.supplementalCompleted) {
      await this.sleep(pageDelayMs);
      // Step 1: Curated override IDs missing from top 1,000 (zero /coins/list request needed)
      const missingOverrideIds = Array.from(
        new Set(Object.values(coinLogoOverrides).filter((id) => id && !byId.has(id)))
      ).slice(0, 220);

      if (missingOverrideIds.length > 0 && Date.now() >= this.backoffUntil) {
        const supUrl = `${baseUrl}/coins/markets?vs_currency=usd&ids=${encodeURIComponent(
          missingOverrideIds.join(',')
        )}&per_page=250&page=1&sparkline=false`;
        const supItems = await this.fetchMarketsBatch(supUrl, headers);
        if (supItems && supItems.length > 0) {
          for (const item of supItems) {
            byId.set(item.id, item);
            seenSymbols.add(item.symbol);
          }
          this.mergeAndPersist(byId);
          this.supplementalCompleted = true;
          this.consecutiveFailures = 0;
          this.lastError = null;
        }
      } else {
        this.supplementalCompleted = true;
      }

      // Step 2: Any remaining non-override dynamic screener coins via /coins/list
      const extraIds = await this.collectSupplementaryIds(byId, seenSymbols, baseUrl, headers);
      if (extraIds.length > 0 && Date.now() >= this.backoffUntil) {
        await this.sleep(pageDelayMs);
        const extraUrl = `${baseUrl}/coins/markets?vs_currency=usd&ids=${encodeURIComponent(
          extraIds.join(',')
        )}&per_page=250&page=1&sparkline=false`;
        const extraItems = await this.fetchMarketsBatch(extraUrl, headers);
        if (extraItems && extraItems.length > 0) {
          for (const item of extraItems) {
            byId.set(item.id, item);
          }
          this.mergeAndPersist(byId);
        }
      }
    }
  }

  public triggerBackgroundRefresh(force = false): Promise<void> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }
    if (!force && Date.now() < this.backoffUntil) {
      return Promise.resolve();
    }
    if (force) {
      this.completedPages.clear();
      this.supplementalCompleted = false;
    }

    this.refreshPromise = this.performRefresh().finally(() => {
      this.refreshPromise = null;
    });
    return this.refreshPromise;
  }

  public warmUp(): void {
    const age = Date.now() - this.updatedAt;
    const hasMissingOverrides = Object.values(coinLogoOverrides).some(
      (id) => id && !this.items.some((item) => item.id === id)
    );
    if (this.items.length < 500 || age > FRESH_TTL_MS || hasMissingOverrides) {
      // Stagger 1.5s after boot so /global in marketOverviewService does not burst-collide on public CoinGecko IP
      setTimeout(() => {
        void this.triggerBackgroundRefresh(false);
      }, 1500).unref?.();
    }
    // Re-check once MTF Screener finishes initial universe discovery (~18s after boot)
    setTimeout(() => {
      if (this.items.length > 0 && Date.now() >= this.backoffUntil) {
        void this.ensureScreenerCoverage();
      }
    }, 18_000).unref?.();
  }

  private async ensureScreenerCoverage(): Promise<void> {
    if (this.refreshPromise || Date.now() < this.backoffUntil) return;
    const { baseUrl, headers, hasKey } = this.getCoinGeckoConfig();
    const pageDelayMs = hasKey ? 150 : 2200;
    const byId = new Map(this.items.map((i) => [i.id, i]));
    const seenSymbols = new Set(this.items.map((i) => i.symbol));

    // Step 1: Fetch any missing curated override IDs in one lightweight batch
    const missingOverrideIds = Array.from(
      new Set(Object.values(coinLogoOverrides).filter((id) => id && !byId.has(id)))
    ).slice(0, 220);

    if (missingOverrideIds.length > 0) {
      const supUrl = `${baseUrl}/coins/markets?vs_currency=usd&ids=${encodeURIComponent(
        missingOverrideIds.join(',')
      )}&per_page=250&page=1&sparkline=false`;
      const supItems = await this.fetchMarketsBatch(supUrl, headers);
      if (supItems && supItems.length > 0) {
        for (const item of supItems) {
          byId.set(item.id, item);
          seenSymbols.add(item.symbol);
        }
        this.mergeAndPersist(byId);
        this.supplementalCompleted = true;
        this.consecutiveFailures = 0;
        this.lastError = null;
      }
      await this.sleep(pageDelayMs);
    } else {
      this.supplementalCompleted = true;
    }

    if (Date.now() < this.backoffUntil) return;

    // Step 2: Check if any active screener symbol is still missing outside top 1,000 + overrides
    const missingIds = await this.collectSupplementaryIds(byId, seenSymbols, baseUrl, headers);
    if (missingIds.length === 0 || Date.now() < this.backoffUntil) return;

    await this.sleep(pageDelayMs);
    const idsParam = encodeURIComponent(missingIds.join(','));
    const extraUrl = `${baseUrl}/coins/markets?vs_currency=usd&ids=${idsParam}&per_page=250&page=1&sparkline=false`;
    const extraItems = await this.fetchMarketsBatch(extraUrl, headers);
    if (extraItems && extraItems.length > 0) {
      for (const item of extraItems) {
        byId.set(item.id, item);
      }
      this.mergeAndPersist(byId);
      this.consecutiveFailures = 0;
      this.lastError = null;
    }
  }

  public async getCoinsMetadata(options?: { force?: boolean }): Promise<{
    items: CoinMetaRecord[];
    updatedAt: number;
    stale: boolean;
    degraded: boolean;
    cacheAgeSec: number;
    lastError: string | null;
  }> {
    const now = Date.now();
    const ageMs = this.updatedAt > 0 ? now - this.updatedAt : Number.MAX_SAFE_INTEGER;
    const hasCache = this.items.length > 0;

    if (options?.force) {
      await this.triggerBackgroundRefresh(true);
    } else if (!hasCache) {
      // First cold request with empty cache: await initial fetch (respecting timeout/backoff)
      await this.triggerBackgroundRefresh(false);
    } else if (ageMs > FRESH_TTL_MS || this.items.length < 500) {
      // Stale-while-revalidate or partial warm-up: serve cached data immediately and continue filling asynchronously
      void this.triggerBackgroundRefresh(false);
    }

    const finalNow = Date.now();
    const finalAgeMs = this.updatedAt > 0 ? finalNow - this.updatedAt : 0;
    const isStale = this.items.length === 0 || finalAgeMs > FRESH_TTL_MS;
    const isDegraded =
      this.items.length === 0 ||
      finalAgeMs > STALE_WHILE_REVALIDATE_MS ||
      (finalNow < this.backoffUntil && this.items.length < 500);

    return {
      items: this.items,
      updatedAt: this.updatedAt || finalNow,
      stale: isStale,
      degraded: isDegraded,
      cacheAgeSec: Math.max(0, Math.round(finalAgeMs / 1000)),
      lastError: this.lastError,
    };
  }
}

export const coinMetadataService = new CoinMetadataService();
