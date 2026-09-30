import React, { useState, useEffect, useMemo } from 'react';
import {
  getCoinBaseAsset,
  getCoinIconCandidateUrls,
  getCachedIconUrl,
  recordWorkingIconUrl,
  recordFailedIconUrl,
  isUrlKnownFailed,
  getDeterministicCoinStyle,
  TOP_COIN_COLORS,
} from '../../services/cryptoIconService';

export type CryptoIconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;

export interface CryptoIconProps {
  symbol: string;
  size?: CryptoIconSize;
  className?: string;
  variant?: 'color' | 'mono' | 'badge';
  rounded?: 'full' | 'sm' | 'md' | 'none';
  showGlow?: boolean;
  altText?: string;
}

// Inline pure vector paths for instant, 0-latency rendering of top crypto assets
const EMBEDDED_VECTOR_ICONS: Record<string, React.ReactNode> = {
  BTC: (
    <svg viewBox="0 0 32 32" className="w-full h-full fill-current">
      <circle cx="16" cy="16" r="16" fill="#F7931A" />
      <path
        fill="#FFFFFF"
        d="M23.189 14.02c.314-2.096-1.283-3.223-3.465-3.975l.708-2.84-1.728-.43-.69 2.765c-.454-.114-.92-.22-1.385-.326l.695-2.783L15.596 6l-.708 2.839c-.376-.086-.746-.17-1.104-.26l.002-.009-2.384-.595-.46 1.846s1.283.294 1.256.312c.7.175.826.638.805 1.006l-.806 3.235c.048.012.11.03.18.057l-.183-.045-1.13 4.532c-.086.212-.303.531-.793.41.018.025-1.256-.313-1.256-.313l-.858 1.978 2.25.561c.418.105.828.215 1.231.318l-.715 2.872 1.727.43.708-2.84c.472.127.93.245 1.378.357l-.706 2.828 1.728.43.715-2.866c2.948.558 5.164.333 6.097-2.333.752-2.146-.037-3.385-1.588-4.192 1.13-.26 1.98-1.003 2.207-2.538zm-3.95 5.537c-.535 2.146-4.148.986-5.318.695l.95-3.805c1.17.292 4.92.872 4.368 3.11zm.535-5.567c-.488 1.954-3.495.962-4.47.718l.86-3.45c.976.244 4.116.7 3.61 2.732z"
      />
    </svg>
  ),
  ETH: (
    <svg viewBox="0 0 32 32" className="w-full h-full fill-current">
      <circle cx="16" cy="16" r="16" fill="#627EEA" />
      <g fill="#FFFFFF" fillRule="evenodd">
        <path d="M16.498 4v8.87l7.497 3.35z" opacity=".602" />
        <path d="M16.498 4L9 16.22l7.498-3.35z" />
        <path d="M16.498 21.968v6.027L24 17.616z" opacity=".602" />
        <path d="M16.498 27.995v-6.027L9 17.616z" />
        <path d="M16.498 20.573l7.497-4.353-7.497-3.348z" opacity=".2" />
        <path d="M9 16.22l7.498 4.353v-7.701z" opacity=".602" />
      </g>
    </svg>
  ),
  SOL: (
    <svg viewBox="0 0 32 32" className="w-full h-full">
      <circle cx="16" cy="16" r="16" fill="#000000" />
      <defs>
        <linearGradient id="sol-g1" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#00FFA3" />
          <stop offset="100%" stopColor="#DC1FFF" />
        </linearGradient>
      </defs>
      <g fill="url(#sol-g1)" transform="translate(6, 8)">
        <path d="M3.2 0h13.6c.4 0 .7.3.7.7 0 .2-.1.4-.2.5l-3.2 3.2c-.2.2-.4.2-.7.2H0c-.4 0-.7-.3-.7-.7 0-.2.1-.4.2-.5l3.2-3.2c.2-.2.4-.2.5-.2z" />
        <path d="M.5 5.8h13.6c.4 0 .7.3.7.7 0 .2-.1.4-.2.5l-3.2 3.2c-.2.2-.4.2-.7.2H-2.7c-.4 0-.7-.3-.7-.7 0-.2.1-.4.2-.5l3.2-3.2c.2-.2.4-.2.7-.2z" transform="translate(2.7, 0)" />
        <path d="M3.2 11.6h13.6c.4 0 .7.3.7.7 0 .2-.1.4-.2.5l-3.2 3.2c-.2.2-.4.2-.7.2H0c-.4 0-.7-.3-.7-.7 0-.2.1-.4.2-.5l3.2-3.2c.2-.2.4-.2.5-.2z" />
      </g>
    </svg>
  ),
  BNB: (
    <svg viewBox="0 0 32 32" className="w-full h-full">
      <circle cx="16" cy="16" r="16" fill="#F3BA2F" />
      <path
        fill="#FFFFFF"
        d="M16 6.5l3.7 3.7-5.5 5.5-3.7-3.7L16 6.5zm-5.8 5.8l3.7 3.7-3.7 3.7-3.7-3.7 3.7-3.7zm11.6 0l3.7 3.7-3.7 3.7-3.7-3.7 3.7-3.7zm-5.8 5.8l3.7 3.7-5.5 5.5-3.7-3.7 5.5-5.5z"
      />
    </svg>
  ),
  XRP: (
    <svg viewBox="0 0 32 32" className="w-full h-full">
      <circle cx="16" cy="16" r="16" fill="#23292F" />
      <path
        fill="#FFFFFF"
        d="M23.8 8h2.3l-5.6 5.5c-2.5 2.4-6.5 2.4-9 0L5.9 8h2.3l4.5 4.3c1.7 1.6 4.4 1.6 6 0L23.8 8zM8.2 24H5.9l5.6-5.5c2.5-2.4 6.5-2.4 9 0l5.6 5.5h-2.3l-4.5-4.3c-1.7-1.6-4.4-1.6-6 0L8.2 24z"
      />
    </svg>
  ),
  DOGE: (
    <svg viewBox="0 0 32 32" className="w-full h-full">
      <circle cx="16" cy="16" r="16" fill="#C2A633" />
      <path
        fill="#FFFFFF"
        d="M12.5 9h5.2c4.1 0 7.3 2.9 7.3 7s-3.2 7-7.3 7h-5.2V9zm4 10.8h1.2c2.4 0 4.1-1.7 4.1-3.8s-1.7-3.8-4.1-3.8h-1.2v7.6zm-1.8-4.4h6v1.4h-6v-1.4z"
      />
    </svg>
  ),
  AVAX: (
    <svg viewBox="0 0 32 32" className="w-full h-full">
      <circle cx="16" cy="16" r="16" fill="#E84142" />
      <path
        fill="#FFFFFF"
        d="M17.4 8.5c-.7-1.2-2.1-1.2-2.8 0L6.4 22.8c-.7 1.2 0 2.2 1.4 2.2h4.5c.7 0 1.5-.4 1.9-1.1l3.8-6.6c.4-.7 1.2-.7 1.6 0l1.7 3c.4.7 1.2 1.1 1.9 1.1h2.5c1.4 0 2.1-1 1.4-2.2L17.4 8.5z"
      />
    </svg>
  ),
  ADA: (
    <svg viewBox="0 0 32 32" className="w-full h-full">
      <circle cx="16" cy="16" r="16" fill="#0033AD" />
      <circle cx="16" cy="16" r="3.2" fill="#FFFFFF" />
      <circle cx="16" cy="8" r="1.5" fill="#FFFFFF" />
      <circle cx="16" cy="24" r="1.5" fill="#FFFFFF" />
      <circle cx="9.1" cy="12" r="1.5" fill="#FFFFFF" />
      <circle cx="22.9" cy="12" r="1.5" fill="#FFFFFF" />
      <circle cx="9.1" cy="20" r="1.5" fill="#FFFFFF" />
      <circle cx="22.9" cy="20" r="1.5" fill="#FFFFFF" />
    </svg>
  ),
  SUI: (
    <svg viewBox="0 0 32 32" className="w-full h-full">
      <circle cx="16" cy="16" r="16" fill="#4DA2FF" />
      <path
        fill="#FFFFFF"
        d="M16 7c-4.97 0-9 4.03-9 9 0 4.08 2.71 7.53 6.46 8.62l.54-3.15c-2.22-.85-3.8-3.03-3.8-5.47 0-3.31 2.69-6 6-6s6 2.69 6 6c0 2.44-1.58 4.62-3.8 5.47l.54 3.15C22.29 23.53 25 20.08 25 16c0-4.97-4.03-9-9-9z"
      />
    </svg>
  ),
  PEPE: (
    <svg viewBox="0 0 32 32" className="w-full h-full">
      <circle cx="16" cy="16" r="16" fill="#55AC5E" />
      <path
        fill="#FFFFFF"
        d="M9 14c0-2.2 1.8-4 4-4s4 1.8 4 4c0 .5-.1 1-.3 1.5 1.1-.3 2.2-.3 3.3 0-.2-.5-.3-1-.3-1.5 0-2.2 1.8-4 4-4s4 1.8 4 4c0 2.2-1.8 4-4 4h-14c-2.2 0-4-1.8-4-4zm4 2c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm10 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-12 6c1.5 1.8 4.2 3 7 3s5.5-1.2 7-3h-14z"
      />
    </svg>
  ),
  SHIB: (
    <svg viewBox="0 0 32 32" className="w-full h-full">
      <circle cx="16" cy="16" r="16" fill="#FFA409" />
      <path
        fill="#FFFFFF"
        d="M9 10l3.5 4L16 12l3.5 2L23 10l-1.5 7.5L16 23l-5.5-5.5L9 10zm4.5 4.5L12 16l2.5 1.5-1-3zm6 0l-1 3 2.5-1.5-1.5-1.5zm-3.5 4l-1.5 1.5 1.5 1 1.5-1-1.5-1.5z"
      />
    </svg>
  ),
  DOT: (
    <svg viewBox="0 0 32 32" className="w-full h-full">
      <circle cx="16" cy="16" r="16" fill="#E6007A" />
      <circle cx="16" cy="12" r="4.5" fill="#FFFFFF" />
      <circle cx="16" cy="22" r="2.5" fill="#FFFFFF" />
    </svg>
  ),
  LINK: (
    <svg viewBox="0 0 32 32" className="w-full h-full">
      <circle cx="16" cy="16" r="16" fill="#375BD2" />
      <path
        fill="#FFFFFF"
        d="M16 7l-7 4v9l7 4 7-4v-9l-7-4zm4.2 11.6l-4.2 2.4-4.2-2.4v-4.8l4.2-2.4 4.2 2.4v4.8z"
      />
    </svg>
  ),
  NEAR: (
    <svg viewBox="0 0 32 32" className="w-full h-full">
      <circle cx="16" cy="16" r="16" fill="#000000" />
      <path
        fill="#FFFFFF"
        d="M22.7 8.5L18.2 15l5.1 7.8c.4.6.1 1.4-.6 1.7-.6.3-1.4.1-1.7-.5L16 16.3l-4.5 6.5-2.2-1.3L16 11.2l-4.2-6.5c-.4-.6-.1-1.4.6-1.7.6-.3 1.4-.1 1.7.5L19 11.2l3.7-5.5 2.1 1.2c.7.4.9 1.1.6 1.6z"
      />
    </svg>
  ),
  TON: (
    <svg viewBox="0 0 32 32" className="w-full h-full">
      <circle cx="16" cy="16" r="16" fill="#0098EA" />
      <path
        fill="#FFFFFF"
        d="M16 6.5l8.5 6.2-3.2 11.3H10.7L7.5 12.7 16 6.5zm-5 7.8l5 6.8 5-6.8-5-3.6-5 3.6z"
      />
    </svg>
  ),
  SEI: (
    <svg viewBox="0 0 32 32" className="w-full h-full">
      <circle cx="16" cy="16" r="16" fill="#9B1D22" />
      <path
        fill="#FFFFFF"
        d="M12.5 8.5c2.5-1.5 6.5-1.2 8.5 1 2 2.2 1.5 5.5-.5 7.2l-5 4.3c-1.5 1.2-1.8 2.8-.5 4 1.2 1.2 3.2.8 4.5-.5l1.5 1.5c-2 2-5 2.5-7 1-2.2-1.8-2-5 .2-6.8l5-4.2c1.5-1.2 1.8-3 .5-4.2-1.2-1.2-3.5-.8-4.8.5l-1.9-1.8z"
      />
    </svg>
  ),
  ARB: (
    <svg viewBox="0 0 32 32" className="w-full h-full">
      <circle cx="16" cy="16" r="16" fill="#28A0F0" />
      <path
        fill="#FFFFFF"
        d="M16 7.5L8 22.5h3.5l1.8-3.4h5.4l1.8 3.4H24L16 7.5zm0 5.2l2 3.8h-4l2-3.8z"
      />
    </svg>
  ),
  OP: (
    <svg viewBox="0 0 32 32" className="w-full h-full">
      <circle cx="16" cy="16" r="16" fill="#FF0420" />
      <path
        fill="#FFFFFF"
        d="M11.5 10c-3.3 0-6 2.7-6 6s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6zm0 9c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3zm9-9h4c3.3 0 6 2.7 6 6s-2.7 6-6 6h-4V10zm4 9c1.7 0 3-1.3 3-3s-1.3-3-3-3h-1v6h1z"
      />
    </svg>
  ),
  UNI: (
    <svg viewBox="0 0 32 32" className="w-full h-full">
      <circle cx="16" cy="16" r="16" fill="#FF007A" />
      <path
        fill="#FFFFFF"
        d="M10 8c1.5 0 2.8 1 3.2 2.4.6 2.2 2.5 3.6 4.8 3.6 2.8 0 5-2.2 5-5 0-.6.5-1 1-1s1 .4 1 1c0 3.9-3.1 7-7 7-3.2 0-6-2-6.8-5-.3-1-1.2-1.8-2.2-1.8-.6 0-1-.4-1-1s.4-1.2 1-1.2zm-2 9c.6 0 1 .4 1 1 0 4.4 3.6 8 8 8s8-3.6 8-8c0-.6.4-1 1-1s1 .4 1 1c0 5.5-4.5 10-10 10S7 23.5 7 18c0-.6.4-1 1-1z"
      />
    </svg>
  ),
  USDT: (
    <svg viewBox="0 0 32 32" className="w-full h-full">
      <circle cx="16" cy="16" r="16" fill="#26A17B" />
      <path
        fill="#FFFFFF"
        d="M18 10.5h5V8.5H9v2h5v3.2c-4.2.4-7.4 1.7-7.4 3.3 0 1.9 4.3 3.5 9.4 3.5s9.4-1.6 9.4-3.5c0-1.6-3.2-2.9-7.4-3.3v-3.2zm0 5.4c3.8.3 6.6 1.3 6.6 2.4 0 1.2-3.1 2.2-7 2.2-3.9 0-7-1-7-2.2 0-1.1 2.8-2.1 6.6-2.4v2.7h1.6v-2.7h-.8v-.0z"
      />
    </svg>
  ),
  USDC: (
    <svg viewBox="0 0 32 32" className="w-full h-full">
      <circle cx="16" cy="16" r="16" fill="#2775CA" />
      <path
        fill="#FFFFFF"
        d="M16 6C10.5 6 6 10.5 6 16s4.5 10 10 10 10-4.5 10-10S21.5 6 16 6zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8zm1-13h-2v1.1c-1.8.3-3 1.6-3 3.1 0 1.9 1.4 2.8 3.5 3.3 1.5.3 2 .8 2 1.5 0 .8-.7 1.4-1.8 1.4-1.2 0-2-.5-2.4-1.3l-1.6.8c.6 1.4 1.8 2.2 3.3 2.5v1.2h2v-1.2c1.9-.3 3.1-1.6 3.1-3.2 0-2-1.4-2.9-3.6-3.4-1.4-.3-1.9-.7-1.9-1.4 0-.7.6-1.3 1.6-1.3 1 0 1.7.4 2.1 1l1.5-.9c-.6-1.1-1.6-1.8-2.8-2.1V11z"
      />
    </svg>
  ),
};

const SIZE_MAP: Record<string, { container: string; text: string; px: number }> = {
  xs: { container: 'w-4 h-4', text: 'text-[9px]', px: 16 },
  sm: { container: 'w-5 h-5', text: 'text-[10px]', px: 20 },
  md: { container: 'w-7 h-7', text: 'text-xs', px: 28 },
  lg: { container: 'w-9 h-9', text: 'text-xs', px: 36 },
  xl: { container: 'w-12 h-12', text: 'text-sm', px: 48 },
};

export const CryptoIcon: React.FC<CryptoIconProps> = React.memo(({
  symbol,
  size = 'md',
  className = '',
  variant = 'color',
  rounded = 'full',
  showGlow = false,
  altText,
}) => {
  const baseAsset = useMemo(() => getCoinBaseAsset(symbol), [symbol]);
  const candidateUrls = useMemo(() => getCoinIconCandidateUrls(baseAsset), [baseAsset]);
  const cachedUrl = useMemo(() => getCachedIconUrl(baseAsset), [baseAsset]);

  // Initial candidate index: start with cached if valid, or index 0
  const [candidateIndex, setCandidateIndex] = useState<number>(0);
  const [hasImageLoaded, setHasImageLoaded] = useState<boolean>(false);
  const [isAllExhausted, setIsAllExhausted] = useState<boolean>(false);

  // Check if we have an instant embedded SVG vector
  const embeddedVector = EMBEDDED_VECTOR_ICONS[baseAsset];

  // Reset state on symbol change
  useEffect(() => {
    setCandidateIndex(0);
    setHasImageLoaded(false);
    setIsAllExhausted(false);
  }, [baseAsset]);

  const deterministicStyle = useMemo(() => getDeterministicCoinStyle(baseAsset), [baseAsset]);

  // Compute size styles
  const sizeConfig = typeof size === 'string' && SIZE_MAP[size] ? SIZE_MAP[size] : null;
  const customPx = typeof size === 'number' ? size : sizeConfig?.px || 28;
  const containerSizeClass = sizeConfig ? sizeConfig.container : '';
  const textSizeClass = sizeConfig ? sizeConfig.text : 'text-xs';

  const roundedClass =
    rounded === 'full'
      ? 'rounded-full'
      : rounded === 'md'
      ? 'rounded-[4px]'
      : rounded === 'sm'
      ? 'rounded-[2px]'
      : 'rounded-none';

  // Handle image error -> step to next candidate CDN
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.currentTarget;
    recordFailedIconUrl(target.src);

    if (candidateIndex < candidateUrls.length - 1) {
      setCandidateIndex((prev) => prev + 1);
    } else {
      setIsAllExhausted(true);
    }
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setHasImageLoaded(true);
    recordWorkingIconUrl(baseAsset, e.currentTarget.src);
  };

  // 1. TIER 1: Instant Embedded Vector SVG (0ms, 0 HTTP requests)
  if (embeddedVector && variant === 'color') {
    return (
      <div
        className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden ${containerSizeClass} ${roundedClass} ${className}`}
        style={{
          width: sizeConfig ? undefined : `${customPx}px`,
          height: sizeConfig ? undefined : `${customPx}px`,
          boxShadow: showGlow ? `0 0 10px ${deterministicStyle.glow}` : undefined,
        }}
        title={altText || `${baseAsset} Icon`}
        aria-label={altText || baseAsset}
      >
        {embeddedVector}
      </div>
    );
  }

  // Active image URL candidate
  const activeUrl = cachedUrl || (candidateIndex < candidateUrls.length ? candidateUrls[candidateIndex] : null);

  // 2. TIER 2: Dynamic Image Fetching with Error Handling
  if (activeUrl && !isAllExhausted && !isUrlKnownFailed(activeUrl)) {
    return (
      <div
        className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden ${containerSizeClass} ${roundedClass} ${className}`}
        style={{
          width: sizeConfig ? undefined : `${customPx}px`,
          height: sizeConfig ? undefined : `${customPx}px`,
          boxShadow: showGlow ? `0 0 10px ${deterministicStyle.glow}` : undefined,
          backgroundColor: '#0b0f19',
        }}
        title={altText || `${baseAsset} Icon`}
      >
        <img
          src={activeUrl}
          alt={altText || baseAsset}
          className={`w-full h-full object-contain transition-opacity duration-150 ${
            hasImageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onError={handleImageError}
          onLoad={handleImageLoad}
          loading="lazy"
          decoding="async"
        />

        {/* Placeholder beneath while image is loading in background */}
        {!hasImageLoaded && (
          <div
            className="absolute inset-0 flex items-center justify-center font-mono font-bold select-none uppercase"
            style={{
              backgroundColor: deterministicStyle.bg,
              color: deterministicStyle.text,
              fontSize: `${Math.max(8, Math.floor(customPx * 0.38))}px`,
            }}
          >
            {baseAsset.slice(0, 3)}
          </div>
        )}
      </div>
    );
  }

  // 3. TIER 3: Deterministic Monogram / Placeholder Badge
  // Guarantees UI never breaks, assigns harmonic distinct hues to any token
  const monogramText = baseAsset.slice(0, 3).toUpperCase();
  const fontSizePx = Math.max(8, Math.floor(customPx * 0.38));

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 font-mono font-extrabold select-none uppercase tracking-tight border ${containerSizeClass} ${roundedClass} ${textSizeClass} ${className}`}
      style={{
        width: sizeConfig ? undefined : `${customPx}px`,
        height: sizeConfig ? undefined : `${customPx}px`,
        backgroundColor: deterministicStyle.bg,
        borderColor: deterministicStyle.border,
        color: deterministicStyle.text,
        fontSize: `${fontSizePx}px`,
        boxShadow: showGlow ? `0 0 8px ${deterministicStyle.glow}` : undefined,
      }}
      title={altText || `${baseAsset} (${baseAsset}/USDT)`}
      aria-label={altText || baseAsset}
    >
      <span>{monogramText}</span>
    </div>
  );
});

CryptoIcon.displayName = 'CryptoIcon';
