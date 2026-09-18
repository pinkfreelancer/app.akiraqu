/**
 * Institutional Cryptocurrency Price & Number Formatting Utilities
 * Standardized decimal and significant digits formatting for all market caps:
 * - Ultra-low microcap & meme tokens (e.g. TOSHI $0.000116, PEPE $0.00000331, SHIB $0.00000522)
 * - Low-priced altcoins (e.g. ADA $0.2076, XRP $1.362)
 * - Mid & Large caps (e.g. SOL $101.51, ETH $2,511.45, BTC $77,230.00)
 */

export function getCryptoPrecision(price: number): number {
  if (!price || isNaN(price) || !isFinite(price)) return 2;
  const abs = Math.abs(price);
  if (abs >= 1000) return 2;
  if (abs >= 1) return 4;
  if (abs >= 0.1) return 5;
  if (abs >= 0.01) return 6;
  if (abs >= 0.0001) return 8; // e.g. TOSHI 0.00011600 provides fine-grained 8 decimal steps
  if (abs >= 0.000001) return 10; // e.g. SHIB 0.00000522
  const exponent = Math.floor(Math.log10(abs));
  return Math.min(12, Math.max(8, Math.abs(exponent) + 4));
}

export interface FormatPriceOptions {
  maxPrecision?: number;
  trimZeros?: boolean;
}

/**
 * Format cryptocurrency prices according to industry precision standards
 * Prevents truncating sub-cent microcap coins while properly formatting high-value assets.
 */
export function formatCryptoPrice(price: number, options?: FormatPriceOptions): string {
  if (price === 0 || isNaN(price) || !isFinite(price)) return '0.00';
  const sign = price < 0 ? '-' : '';
  const abs = Math.abs(price);

  if (abs >= 1000) {
    return sign + abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (abs >= 1) {
    return sign + abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  }
  if (abs >= 0.1) {
    return sign + abs.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 5 });
  }
  if (abs >= 0.01) {
    return sign + abs.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 6 });
  }
  if (abs >= 0.0001) {
    // e.g. TOSHI 0.000116
    return sign + abs.toLocaleString('en-US', { minimumFractionDigits: 6, maximumFractionDigits: 8 });
  }

  // For sub-0.0001 microcaps (SHIB, PEPE, BONK, etc.)
  const prec = options?.maxPrecision ?? getCryptoPrecision(abs);
  const fixed = abs.toFixed(prec);
  const trimmed = options?.trimZeros !== false ? fixed.replace(/(\.\d{6,}?)0+$/, '$1') : fixed;
  return sign + trimmed;
}

/**
 * Format currency amounts in USD ($1,234.56, +$245.10, -$12.50, or $0.000116)
 */
export function formatUsd(amount: number, options?: { isPnl?: boolean }): string {
  if (isNaN(amount) || !isFinite(amount)) return '$0.00';
  const sign = amount < 0 ? '-' : options?.isPnl && amount > 0 ? '+' : '';
  const abs = Math.abs(amount);
  if (abs === 0) return '$0.00';
  if (abs >= 1000) {
    return `${sign}$${abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (abs >= 1) {
    return `${sign}$${abs.toFixed(2)}`;
  }
  if (abs >= 0.01) {
    return `${sign}$${abs.toFixed(4)}`;
  }
  return `${sign}$${formatCryptoPrice(abs)}`;
}
