import React from 'react';
import { CoinLogo, CoinLogoSize } from './CoinLogo';

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

function mapLegacySize(size: CryptoIconSize | undefined): CoinLogoSize {
  if (typeof size === 'string') {
    return size;
  }
  if (typeof size === 'number') {
    if (size <= 17) return 'xs';
    if (size <= 21) return 'sm';
    if (size <= 27) return 'md';
    if (size <= 38) return 'lg';
    return 'xl';
  }
  return 'md';
}

/**
 * Backwards-compatible wrapper around `<CoinLogo />` so every legacy caller
 * automatically uses the single CoinGecko metadata source & `<CoinLogo />` component.
 */
export const CryptoIcon: React.FC<CryptoIconProps> = React.memo(
  ({ symbol, size = 'md', className = '', altText }) => {
    return (
      <CoinLogo
        symbol={symbol}
        size={mapLegacySize(size)}
        className={className}
        showTooltip={Boolean(altText)}
      />
    );
  }
);

CryptoIcon.displayName = 'CryptoIcon';
