import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  COIN_LOGO_SIZE_PX,
  CoinLogoSize,
  getCoinFallbackInitials,
  getCoinFallbackPaletteClass,
  getCoinLogo,
  isCoinLogoUrlLoaded,
  markCoinLogoFailed,
  markCoinLogoLoaded,
  normalizeCoinSymbol,
} from '../../services/coinLogoService';
import { ensureCoinMetadataLoaded, useCoinMetaStore } from '../../stores/useCoinMetaStore';

export type { CoinLogoSize };

export interface CoinLogoProps {
  symbol: string;
  size?: CoinLogoSize;
  className?: string;
  showTooltip?: boolean;
  /**
   * Set true only for above-the-fold primary pair (Header / Main Chart)
   * so it loads eagerly without waiting for IntersectionObserver.
   */
  priority?: boolean;
  /**
   * Set true when coin name or ticker symbol is already rendered right beside the logo
   * so screen readers do not repeat the coin name (`alt=""` + `aria-hidden="true"`).
   */
  decorative?: boolean;
}

const SIZE_CLASSES: Record<CoinLogoSize, { box: string; text: string; px: number }> = {
  xs: { box: 'w-4 h-4', text: 'text-[8px]', px: COIN_LOGO_SIZE_PX.xs },
  sm: { box: 'w-5 h-5', text: 'text-[9px]', px: COIN_LOGO_SIZE_PX.sm },
  md: { box: 'w-6 h-6', text: 'text-[10px]', px: COIN_LOGO_SIZE_PX.md },
  lg: { box: 'w-8 h-8', text: 'text-xs', px: COIN_LOGO_SIZE_PX.lg },
  xl: { box: 'w-12 h-12', text: 'text-sm', px: COIN_LOGO_SIZE_PX.xl },
};

// Shared singleton IntersectionObserver so hundreds of <CoinLogo /> instances
// reuse ONE observer and never trigger image requests for offscreen rows (Step F).
type VisibilityCallback = () => void;
const observerListeners = new WeakMap<Element, VisibilityCallback>();
let sharedObserver: IntersectionObserver | null = null;

function observeElementVisibility(el: Element, onVisible: VisibilityCallback): () => void {
  if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
    onVisible();
    return () => {};
  }

  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting || entry.intersectionRatio > 0) {
            const cb = observerListeners.get(entry.target);
            if (cb) {
              observerListeners.delete(entry.target);
              sharedObserver?.unobserve(entry.target);
              cb();
            }
          }
        }
      },
      {
        rootMargin: '80px 0px',
        threshold: 0.01,
      }
    );
  }

  observerListeners.set(el, onVisible);
  sharedObserver.observe(el);

  return () => {
    observerListeners.delete(el);
    sharedObserver?.unobserve(el);
  };
}

export const CoinLogo: React.FC<CoinLogoProps> = React.memo(
  ({
    symbol,
    size = 'md',
    className = '',
    showTooltip = false,
    priority = false,
    decorative = false,
  }) => {
    const metaVersion = useCoinMetaStore((s) => s.version);
    const metaStatus = useCoinMetaStore((s) => s.status);

    const containerRef = useRef<HTMLSpanElement | null>(null);
    const baseSymbol = useMemo(() => normalizeCoinSymbol(symbol), [symbol]);
    const sizeSpec = SIZE_CLASSES[size] || SIZE_CLASSES.md;

    const resolvedLogo = useMemo(() => {
      void metaVersion;
      return getCoinLogo(symbol, size);
    }, [symbol, size, metaVersion]);

    const alreadyCachedInMemory = Boolean(resolvedLogo && isCoinLogoUrlLoaded(resolvedLogo.url));

    const [isInView, setIsInView] = useState<boolean>(
      () => priority || alreadyCachedInMemory || typeof IntersectionObserver === 'undefined'
    );
    const [isImgLoaded, setIsImgLoaded] = useState<boolean>(() => alreadyCachedInMemory);
    const [hasImgError, setHasImgError] = useState<boolean>(false);

    // Ensure metadata store is initialized (single-flight no-op if already loaded)
    useEffect(() => {
      if (metaStatus === 'idle') {
        void ensureCoinMetadataLoaded();
      }
    }, [metaStatus]);

    // Reset image load/error state if resolved URL changes
    useEffect(() => {
      const cached = Boolean(resolvedLogo && isCoinLogoUrlLoaded(resolvedLogo.url));
      setIsImgLoaded(cached);
      setHasImgError(false);
      if (priority || cached) {
        setIsInView(true);
      }
    }, [resolvedLogo?.url, priority]);

    // Viewport gate for non-priority logos so offscreen rows do not fire HTTP requests
    useEffect(() => {
      if (isInView || priority) return;
      const el = containerRef.current;
      if (!el) return;
      return observeElementVisibility(el, () => {
        setIsInView(true);
      });
    }, [isInView, priority, resolvedLogo?.url]);

    const fallbackPaletteClass = useMemo(
      () => getCoinFallbackPaletteClass(baseSymbol),
      [baseSymbol]
    );
    const fallbackInitials = useMemo(
      () => getCoinFallbackInitials(baseSymbol, size),
      [baseSymbol, size]
    );

    const displayName = resolvedLogo?.name || baseSymbol || 'Koin';
    const tooltipTitle = showTooltip
      ? baseSymbol && displayName.toUpperCase() !== baseSymbol
        ? `${displayName} (${baseSymbol})`
        : displayName
      : undefined;

    const effectiveMetaStatus =
      metaStatus === 'idle' ? useCoinMetaStore.getState().status : metaStatus;
    const isMetaPending = effectiveMetaStatus === 'idle' || effectiveMetaStatus === 'loading';
    const canRenderImage = Boolean(resolvedLogo?.url && !hasImgError);

    // 1. Metadata still loading on initial cold boot -> circular skeleton (CLS = 0)
    if (isMetaPending && !canRenderImage) {
      return (
        <span
          ref={containerRef}
          title={tooltipTitle}
          aria-hidden={decorative ? true : undefined}
          aria-label={decorative ? undefined : `Logo ${displayName}`}
          className={`relative inline-flex items-center justify-center shrink-0 rounded-full border border-white/15 bg-slate-800/90 animate-pulse select-none overflow-hidden ${sizeSpec.box} ${className}`}
        />
      );
    }

    // 2. Valid CoinGecko logo URL available -> circular frame + skeleton until loaded + onError fallback
    if (canRenderImage && resolvedLogo) {
      return (
        <span
          ref={containerRef}
          title={tooltipTitle}
          aria-hidden={decorative ? true : undefined}
          className={`relative inline-flex items-center justify-center shrink-0 rounded-full border border-white/15 bg-slate-900/90 ring-1 ring-inset ring-white/5 select-none overflow-hidden ${sizeSpec.box} ${className}`}
        >
          {!isImgLoaded && (
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-full bg-slate-800/90 animate-pulse"
            />
          )}
          {isInView && (
            <img
              src={resolvedLogo.url}
              alt={decorative ? '' : `Logo ${resolvedLogo.name}`}
              width={sizeSpec.px}
              height={sizeSpec.px}
              loading={priority ? 'eager' : 'lazy'}
              decoding="async"
              referrerPolicy="no-referrer"
              onLoad={() => {
                markCoinLogoLoaded(resolvedLogo.url);
                setIsImgLoaded(true);
              }}
              onError={() => {
                markCoinLogoFailed(resolvedLogo.url);
                setHasImgError(true);
              }}
              className={`w-full h-full rounded-full object-cover transition-opacity duration-150 ${
                isImgLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          )}
        </span>
      );
    }

    // 3. Unmapped coin or image failed -> deterministic hashed-color circular initial badge (never broken image)
    return (
      <span
        ref={containerRef}
        role={decorative ? undefined : 'img'}
        aria-hidden={decorative ? true : undefined}
        aria-label={decorative ? undefined : `Logo ${displayName}`}
        title={tooltipTitle}
        className={`inline-flex items-center justify-center shrink-0 rounded-full border font-mono font-bold uppercase tracking-tight leading-none select-none ${sizeSpec.box} ${sizeSpec.text} ${fallbackPaletteClass} ${className}`}
      >
        {fallbackInitials}
      </span>
    );
  }
);

CoinLogo.displayName = 'CoinLogo';
