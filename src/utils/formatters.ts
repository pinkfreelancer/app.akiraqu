import { useState, useEffect } from 'react';
import { NumberFormatOption, CurrencySymbolOption } from '../types/settings.types';

/**
 * Institutional Cryptocurrency Price & Number Formatting Utilities
 * Standardized decimal and significant digits formatting for all market caps:
 * - Ultra-low microcap & meme tokens (e.g. TOSHI 0.000116, PEPE 0.00000331, SHIB 0.00000522)
 * - Low-priced altcoins (e.g. ADA 0.2076, XRP 1.362)
 * - Mid & Large caps (e.g. SOL 101.51, ETH 2,511.45, BTC 77,230.00)
 *
 * Fully supports international and localized number formatting:
 * - US (Internasional): Ribuan [,] Koma | Desimal [.] Titik -> e.g. 1,234,567.89
 * - ID (Indonesia):     Ribuan [.] Titik | Desimal [,] Koma -> e.g. 1.234.567,89
 * - EU (Eropa):         Ribuan [ ] Spasi | Desimal [,] Koma -> e.g. 1 234 567,89
 */

const STORAGE_KEY = 'imasbtc_master_user_settings';

let cachedNumberFormat: NumberFormatOption | null = null;
let cachedCurrencySymbol: CurrencySymbolOption | null = null;

/**
 * Get active NumberFormatOption ('US' | 'ID' | 'EU')
 */
export function getActiveNumberFormat(): NumberFormatOption {
  if (cachedNumberFormat) return cachedNumberFormat;
  try {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.regional?.numberFormat) {
          cachedNumberFormat = parsed.regional.numberFormat as NumberFormatOption;
          return cachedNumberFormat;
        }
      }
    }
  } catch {}
  return 'US';
}

/**
 * Get active Reference Currency ('USD' | 'IDR' | 'EUR' | 'USDT')
 */
export function getActiveCurrencySymbol(): CurrencySymbolOption {
  if (cachedCurrencySymbol) return cachedCurrencySymbol;
  try {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.regional?.currencySymbol) {
          cachedCurrencySymbol = parsed.regional.currencySymbol as CurrencySymbolOption;
          return cachedCurrencySymbol;
        }
      }
    }
  } catch {}
  return 'USD';
}

/**
 * Update cached settings
 */
export function setGlobalNumberFormat(format: NumberFormatOption): void {
  cachedNumberFormat = format;
}

export function setGlobalCurrencySymbol(currency: CurrencySymbolOption): void {
  cachedCurrencySymbol = currency;
}

if (typeof window !== 'undefined') {
  window.addEventListener('imasbtc_settings_updated', (e: any) => {
    if (e?.detail?.regional?.numberFormat) {
      cachedNumberFormat = e.detail.regional.numberFormat;
    }
    if (e?.detail?.regional?.currencySymbol) {
      cachedCurrencySymbol = e.detail.regional.currencySymbol;
    }
  });
  window.addEventListener('storage', () => {
    cachedNumberFormat = null;
    cachedCurrencySymbol = null;
  });
}

/**
 * React hook to subscribe to real-time number and currency format changes
 */
export function useNumberFormat() {
  const [format, setFormat] = useState<NumberFormatOption>(() => getActiveNumberFormat());
  const [currency, setCurrency] = useState<CurrencySymbolOption>(() => getActiveCurrencySymbol());

  useEffect(() => {
    const handleUpdate = (e: any) => {
      setFormat(e?.detail?.regional?.numberFormat || getActiveNumberFormat());
      setCurrency(e?.detail?.regional?.currencySymbol || getActiveCurrencySymbol());
    };
    window.addEventListener('imasbtc_settings_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('imasbtc_settings_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  return { format, currency };
}

/**
 * Determine precision step count for crypto pricing
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
  numberFormat?: NumberFormatOption;
}

/**
 * Core number formatting engine with configurable thousand and decimal separators
 */
export function formatNumberWithSeparators(
  num: number,
  minDec = 2,
  maxDec = 2,
  format: NumberFormatOption = getActiveNumberFormat(),
  trimTrailingZeros = false
): string {
  if (num === 0 || isNaN(num) || !isFinite(num)) {
    return format === 'ID' || format === 'EU' ? '0,00' : '0.00';
  }
  const sign = num < 0 ? '-' : '';
  const abs = Math.abs(num);

  // Determine thousand and decimal separator
  const thousandSep = format === 'ID' ? '.' : format === 'EU' ? ' ' : ',';
  const decSep = format === 'ID' || format === 'EU' ? ',' : '.';

  // Generate fixed string up to maxDec
  let fixedStr = abs.toFixed(maxDec);

  if (minDec < maxDec || trimTrailingZeros) {
    const parts = fixedStr.split('.');
    let dec = parts[1] || '';
    if (trimTrailingZeros) {
      dec = dec.replace(/0+$/, '');
      while (dec.length < minDec) {
        dec += '0';
      }
    } else {
      while (dec.length > minDec && dec.endsWith('0')) {
        dec = dec.slice(0, -1);
      }
    }
    fixedStr = dec.length > 0 ? `${parts[0]}.${dec}` : parts[0];
  }

  const [intPart, decPart] = fixedStr.split('.');
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSep);
  return sign + (decPart !== undefined && decPart.length > 0 ? formattedInt + decSep + decPart : formattedInt);
}

/**
 * Format cryptocurrency prices according to industry precision standards and regional separators
 * Prevents truncating sub-cent microcap coins while properly formatting high-value assets.
 */
export function formatCryptoPrice(price: number, options?: FormatPriceOptions): string {
  const format = options?.numberFormat ?? getActiveNumberFormat();

  if (price === 0 || isNaN(price) || !isFinite(price)) {
    return format === 'ID' || format === 'EU' ? '0,00' : '0.00';
  }

  const abs = Math.abs(price);
  const trim = options?.trimZeros !== false;

  if (abs >= 1000) {
    return formatNumberWithSeparators(price, 2, 2, format, false);
  }
  if (abs >= 1) {
    return formatNumberWithSeparators(price, 2, 4, format, trim);
  }
  if (abs >= 0.1) {
    return formatNumberWithSeparators(price, 4, 5, format, trim);
  }
  if (abs >= 0.01) {
    return formatNumberWithSeparators(price, 4, 6, format, trim);
  }
  if (abs >= 0.0001) {
    return formatNumberWithSeparators(price, 6, 8, format, trim);
  }

  // Microcaps (< 0.0001) like SHIB, PEPE, BONK
  const prec = options?.maxPrecision ?? getCryptoPrecision(abs);
  return formatNumberWithSeparators(price, 6, prec, format, trim);
}

export interface FormatCurrencyOptions {
  currency?: CurrencySymbolOption;
  numberFormat?: NumberFormatOption;
  isPnl?: boolean;
  isCrypto?: boolean;
}

/**
 * Format currency amounts in USD, IDR, EUR, or USDT with proper regional separators
 */
export function formatCurrency(amount: number, options?: FormatCurrencyOptions): string {
  if (isNaN(amount) || !isFinite(amount)) return '$0.00';

  const currency = options?.currency ?? getActiveCurrencySymbol();
  const format = options?.numberFormat ?? getActiveNumberFormat();
  const isPnl = options?.isPnl ?? false;
  const sign = amount < 0 ? '-' : isPnl && amount > 0 ? '+' : '';
  const abs = Math.abs(amount);

  let formattedNum = '';
  if (currency === 'IDR') {
    // IDR is typically whole number or 2 decimal places if converted
    formattedNum = abs >= 1000
      ? formatNumberWithSeparators(abs, 0, 2, format, true)
      : formatNumberWithSeparators(abs, 2, 2, format, false);
    return `${sign}Rp ${formattedNum}`;
  }

  if (currency === 'EUR') {
    formattedNum = formatCryptoPrice(abs, { numberFormat: format });
    return `${sign}€${formattedNum}`;
  }

  if (currency === 'USDT') {
    formattedNum = formatCryptoPrice(abs, { numberFormat: format });
    return `${sign}₮${formattedNum}`;
  }

  // Default USD
  formattedNum = formatCryptoPrice(abs, { numberFormat: format });
  return `${sign}$${formattedNum}`;
}

/**
 * Format currency amounts in USD ($1,234.56, +$245.10, -$12.50, or $0.000116)
 * Backward-compatible helper with regional separator support
 */
export function formatUsd(amount: number, options?: { isPnl?: boolean; numberFormat?: NumberFormatOption }): string {
  return formatCurrency(amount, {
    currency: 'USD',
    isPnl: options?.isPnl,
    numberFormat: options?.numberFormat,
  });
}

/**
 * Parse formatted string back to float (e.g. "87.450,25" (ID) or "1,234.56" (US) or "1 234,56" (EU))
 */
export function parseFormattedNumber(str: string, format: NumberFormatOption = getActiveNumberFormat()): number {
  if (!str) return 0;
  let cleaned = str.trim();
  if (format === 'ID') {
    // In ID: remove '.' (thousands), replace ',' with '.' (decimal)
    cleaned = cleaned.replace(/\./g, '').replace(/,/g, '.');
  } else if (format === 'EU') {
    // In EU: remove whitespace, replace ',' with '.'
    cleaned = cleaned.replace(/\s+/g, '').replace(/,/g, '.');
  } else {
    // In US: remove ',' (thousands)
    cleaned = cleaned.replace(/,/g, '');
  }
  const val = parseFloat(cleaned);
  return isNaN(val) ? 0 : val;
}
