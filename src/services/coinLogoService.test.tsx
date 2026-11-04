import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getCoinFallbackInitials,
  getCoinFallbackPaletteClass,
  getCoinLogo,
  getUnmappedCoinSymbols,
  markCoinLogoFailed,
  normalizeCoinSymbol,
  resetCoinLogoRuntimeState,
  resolveCoinMeta,
  selectCoinGeckoImageSize,
} from './coinLogoService';
import {
  buildCoinMetaLookup,
  CoinMetaEntry,
  ensureCoinMetadataLoaded,
  isGenuineCoinGeckoImageUrl,
  useCoinMetaStore,
} from '../stores/useCoinMetaStore';
import { CoinLogo } from '../components/ui/CoinLogo';

const SAMPLE_COINS: CoinMetaEntry[] = [
  {
    id: 'bitcoin',
    symbol: 'btc',
    name: 'Bitcoin',
    image: 'https://coin-images.coingecko.com/coins/images/1/large/bitcoin.png?1696501400',
    market_cap_rank: 1,
  },
  {
    id: 'pepe',
    symbol: 'pepe',
    name: 'Pepe',
    image: 'https://coin-images.coingecko.com/coins/images/29850/large/pepe-token.jpeg?1696528776',
    market_cap_rank: 28,
  },
  {
    id: 'pepe-copycat',
    symbol: 'pepe',
    name: 'Fake Pepe Low Rank',
    image: 'https://coin-images.coingecko.com/coins/images/99999/large/fake-pepe.png?1700000000',
    market_cap_rank: 950,
  },
  {
    id: 'the-open-network',
    symbol: 'ton',
    name: 'Toncoin',
    image: 'https://coin-images.coingecko.com/coins/images/17980/large/ton_symbol.png?1696517498',
    market_cap_rank: 12,
  },
  {
    id: 'tokamak-network',
    symbol: 'ton',
    name: 'Tokamak Network',
    image: 'https://coin-images.coingecko.com/coins/images/10620/large/tokamak.png?1696510600',
    market_cap_rank: 620,
  },
  {
    id: 'beam-2',
    symbol: 'beam',
    name: 'Beam',
    image: 'https://coin-images.coingecko.com/coins/images/32417/large/chain-logo.png?1698114384',
    market_cap_rank: 95,
  },
  {
    id: 'raydium',
    symbol: 'ray',
    name: 'Raydium',
    image: 'https://coin-images.coingecko.com/coins/images/13928/large/PSigc4ie_400x400.jpg?1696513668',
    market_cap_rank: 78,
  },
  {
    id: 'baby-doge-coin',
    symbol: 'babydoge',
    name: 'Baby Doge Coin',
    image: 'https://coin-images.coingecko.com/coins/images/16125/large/babydoge.jpg?1696515731',
    market_cap_rank: 160,
  },
];

describe('coinLogoService & <CoinLogo />', () => {
  beforeEach(() => {
    useCoinMetaStore.getState().resetForTests();
    resetCoinLogoRuntimeState();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('normalizeCoinSymbol', () => {
    it('normalizes spot pairs, futures contracts, and multiplier denominations accurately', () => {
      expect(normalizeCoinSymbol('BTCUSDT')).toBe('BTC');
      expect(normalizeCoinSymbol('1000PEPEUSDT')).toBe('PEPE');
      expect(normalizeCoinSymbol('1000000MOGUSDT')).toBe('MOG');
      expect(normalizeCoinSymbol('1MBABYDOGEUSDT')).toBe('BABYDOGE');
      expect(normalizeCoinSymbol('BTC/USDT')).toBe('BTC');
      expect(normalizeCoinSymbol('BTC-USDT-SWAP')).toBe('BTC');
      expect(normalizeCoinSymbol('SOL:USDT')).toBe('SOL');
      expect(normalizeCoinSymbol('ETHUSDTPERP')).toBe('ETH');
      expect(normalizeCoinSymbol('1INCHUSDT')).toBe('1INCH');
      expect(normalizeCoinSymbol('WUSDT')).toBe('W');
      expect(normalizeCoinSymbol('BTC (Bitcoin)')).toBe('BTC');
    });

    it('preserves standalone quote stablecoins and handles empty inputs cleanly', () => {
      expect(normalizeCoinSymbol('USDT')).toBe('USDT');
      expect(normalizeCoinSymbol('USDC')).toBe('USDC');
      expect(normalizeCoinSymbol('')).toBe('');
      expect(normalizeCoinSymbol('   ')).toBe('');
    });
  });

  describe('selectCoinGeckoImageSize & URL validation', () => {
    const rawApiUrl =
      'https://coin-images.coingecko.com/coins/images/1/large/bitcoin.png?1696501400';

    it('derives thumb, small, and large strictly from CoinGecko API image URLs', () => {
      expect(selectCoinGeckoImageSize(rawApiUrl, 16)).toBe(
        'https://coin-images.coingecko.com/coins/images/1/thumb/bitcoin.png?1696501400'
      );
      expect(selectCoinGeckoImageSize(rawApiUrl, 20)).toBe(
        'https://coin-images.coingecko.com/coins/images/1/thumb/bitcoin.png?1696501400'
      );
      expect(selectCoinGeckoImageSize(rawApiUrl, 24)).toBe(
        'https://coin-images.coingecko.com/coins/images/1/small/bitcoin.png?1696501400'
      );
      expect(selectCoinGeckoImageSize(rawApiUrl, 32)).toBe(
        'https://coin-images.coingecko.com/coins/images/1/small/bitcoin.png?1696501400'
      );
      expect(selectCoinGeckoImageSize(rawApiUrl, 48)).toBe(
        'https://coin-images.coingecko.com/coins/images/1/large/bitcoin.png?1696501400'
      );
    });

    it('rejects non-CoinGecko or malformed URLs without fabricating paths', () => {
      expect(isGenuineCoinGeckoImageUrl('https://example.com/btc.png')).toBe(false);
      expect(isGenuineCoinGeckoImageUrl('http://coin-images.coingecko.com/btc.png')).toBe(false);
      expect(selectCoinGeckoImageSize('https://example.com/btc.png', 24)).toBe('');
      expect(selectCoinGeckoImageSize('', 24)).toBe('');
    });
  });

  describe('ambiguous symbol disambiguation & override mapping', () => {
    it('selects highest market_cap_rank when duplicate symbols exist and honors overrides', () => {
      const lookup = buildCoinMetaLookup(SAMPLE_COINS);

      // Duplicate symbol PEPE -> rank 28 wins over rank 950
      const pepe = resolveCoinMeta('1000PEPEUSDT', lookup);
      expect(pepe?.id).toBe('pepe');
      expect(pepe?.name).toBe('Pepe');

      // Duplicate symbol TON -> override & rank 12 resolve to Toncoin (the-open-network)
      const ton = resolveCoinMeta('TON/USDT', lookup);
      expect(ton?.id).toBe('the-open-network');

      // Exchange-specific tickers BEAMX and RAYSOL resolve via coinLogoOverrides.json
      expect(resolveCoinMeta('BEAMXUSDT', lookup)?.id).toBe('beam-2');
      expect(resolveCoinMeta('RAYSOL/USDT', lookup)?.id).toBe('raydium');
      expect(resolveCoinMeta('1MBABYDOGEUSDT', lookup)?.id).toBe('baby-doge-coin');
    });
  });

  describe('getCoinLogo & unknown/failed symbol fallback', () => {
    it('returns { url, name } for mapped coins and logs unknown symbols at most once', () => {
      useCoinMetaStore.getState().setMetadata(SAMPLE_COINS, Date.now(), false);

      const btc = getCoinLogo('BTC/USDT', 'md');
      expect(btc).toEqual({
        url: 'https://coin-images.coingecko.com/coins/images/1/small/bitcoin.png?1696501400',
        name: 'Bitcoin',
      });

      // Unknown symbol returns null and logs once without spamming
      expect(getCoinLogo('UNKNOWNXYZ/USDT', 'md')).toBeNull();
      expect(getCoinLogo('UNKNOWNXYZUSDT', 'sm')).toBeNull();
      expect(getUnmappedCoinSymbols()).toEqual(['UNKNOWNXYZ']);
    });

    it('falls back to null when an image URL has previously failed to load', () => {
      useCoinMetaStore.getState().setMetadata(SAMPLE_COINS, Date.now(), false);
      const resolved = getCoinLogo('BTCUSDT', 'xs');
      expect(resolved).not.toBeNull();

      markCoinLogoFailed(resolved!.url);
      expect(getCoinLogo('BTCUSDT', 'xs')).toBeNull();
    });

    it('computes deterministic monogram initials and Tailwind palette classes', () => {
      expect(getCoinFallbackInitials('1000PEPEUSDT', 'md')).toBe('PE');
      expect(getCoinFallbackInitials('1000PEPEUSDT', 'xs')).toBe('P');
      expect(getCoinFallbackInitials('', 'md')).toBe('?');

      const firstPalette = getCoinFallbackPaletteClass('UNKNOWNXYZ/USDT');
      const secondPalette = getCoinFallbackPaletteClass('UNKNOWNXYZUSDT');
      expect(firstPalette).toBe(secondPalette);
      expect(firstPalette).toContain('bg-');
    });
  });

  describe('<CoinLogo /> rendering & CLS-free fallback behavior', () => {
    it('renders circular <img> with explicit width/height and accessible alt text when mapped', () => {
      useCoinMetaStore.getState().setMetadata(SAMPLE_COINS, Date.now(), false);

      const html = renderToStaticMarkup(<CoinLogo symbol="BTC/USDT" size="md" priority />);
      expect(html).toContain(
        'src="https://coin-images.coingecko.com/coins/images/1/small/bitcoin.png?1696501400"'
      );
      expect(html).toContain('width="24"');
      expect(html).toContain('height="24"');
      expect(html).toContain('alt="Logo Bitcoin"');
    });

    it('renders empty alt and aria-hidden when decorative prop is enabled beside coin text', () => {
      useCoinMetaStore.getState().setMetadata(SAMPLE_COINS, Date.now(), false);

      const html = renderToStaticMarkup(
        <CoinLogo symbol="1000PEPEUSDT" size="sm" priority decorative />
      );
      expect(html).toContain('width="20"');
      expect(html).toContain('height="20"');
      expect(html).toContain('alt=""');
      expect(html).toContain('aria-hidden="true"');
    });

    it('renders clean initial-letter monogram fallback with zero broken <img> for unknown symbols', () => {
      useCoinMetaStore.getState().setMetadata(SAMPLE_COINS, Date.now(), false);

      const html = renderToStaticMarkup(<CoinLogo symbol="MYSTERYCOIN/USDT" size="lg" />);
      expect(html).not.toContain('<img');
      expect(html).toContain('role="img"');
      expect(html).toContain('aria-label="Logo MYSTERYCOIN"');
      expect(html).toContain('>MY<');
    });

    it('renders circular pulse skeleton during cold-boot metadata loading (CLS = 0)', () => {
      useCoinMetaStore.setState({ status: 'loading' });

      const html = renderToStaticMarkup(<CoinLogo symbol="BTC/USDT" size="md" />);
      expect(html).not.toContain('<img');
      expect(html).toContain('animate-pulse');
      expect(html).toContain('w-6 h-6');
    });
  });

  describe('ensureCoinMetadataLoaded single-flight & HTTP 429 resilience', () => {
    it('makes at most 1 /api/coins/meta network request across concurrent calls', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          status: 'success',
          updatedAt: Date.now(),
          data: SAMPLE_COINS,
        }),
      });
      vi.stubGlobal('fetch', fetchMock);

      await Promise.all([
        ensureCoinMetadataLoaded(),
        ensureCoinMetadataLoaded(),
        ensureCoinMetadataLoaded(),
      ]);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(useCoinMetaStore.getState().status).toBe('ready');
      expect(getCoinLogo('BTC/USDT', 'sm')?.name).toBe('Bitcoin');
    });

    it('degrades gracefully when CoinGecko / proxy returns HTTP 429 without breaking UI', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ error: 'Too Many Requests' }),
      });
      vi.stubGlobal('fetch', fetchMock);

      await ensureCoinMetadataLoaded();

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(useCoinMetaStore.getState().status).toBe('degraded');

      const fallbackHtml = renderToStaticMarkup(<CoinLogo symbol="BTC/USDT" size="md" />);
      expect(fallbackHtml).not.toContain('<img');
      expect(fallbackHtml).toContain('>BT<');
    });
  });
});
