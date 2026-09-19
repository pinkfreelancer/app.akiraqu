export type EngineThemeId =
  | 'modern-pink-light'
  | 'cyber-pink-dark'
  | 'classic-terminal'
  | 'custom'
  | 'theme-light'
  | 'theme-dark'
  | 'theme-terminal'
  | 'theme-custom';

export interface ThemeOption {
  id: EngineThemeId;
  name: string;
  nameId: string;
  category: 'Light' | 'Dark' | 'Retro' | 'Custom';
  concept: string;
  conceptId: string;
  isDark: boolean;
  accentColor: string;
  bgColor: string;
  surfaceColor: string;
  textColor: string;
  badgeLabel: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'modern-pink-light',
    name: 'Light (Soft Pink)',
    nameId: 'Light (Soft Pink)',
    category: 'Light',
    concept: 'Clean off-white base (#F8FAFC) with #FFFFFF cards and #F472B6 soft pink accents.',
    conceptId: 'Latar Slate-50 (#F8FAFC) bersih dengan kartu putih (#FFFFFF) dan aksen soft pink (#F472B6).',
    isDark: false,
    accentColor: '#F472B6',
    bgColor: '#F8FAFC',
    surfaceColor: '#FFFFFF',
    textColor: '#0F172A',
    badgeLabel: 'Slate Light',
  },
  {
    id: 'cyber-pink-dark',
    name: 'Dark (Deep Navy & Pink)',
    nameId: 'Dark (Deep Navy & Pink)',
    category: 'Dark',
    concept: 'Institutional Deep Navy (#0B0F19) with glassmorphism Slate cards (#1E293B) and soft pink glow (#EC4899).',
    conceptId: 'Latar institusional Deep Navy (#0B0F19) dengan kartu kaca (#1E293B) dan aksen soft pink glow (#EC4899).',
    isDark: true,
    accentColor: '#EC4899',
    bgColor: '#0B0F19',
    surfaceColor: '#1E293B',
    textColor: '#F8FAFC',
    badgeLabel: 'Default Dark',
  },
  {
    id: 'classic-terminal',
    name: 'Terminal (Pitch Black)',
    nameId: 'Terminal (Pitch Black)',
    category: 'Retro',
    concept: 'Pitch black (#030712) with #0B0F19 surfaces, Cyber Pink (#FF007A) and JetBrains Mono monospace.',
    conceptId: 'Nuansa pitch black (#030712), aksen Cyber Pink (#FF007A) monokrom, dan tipografi JetBrains Mono.',
    isDark: true,
    accentColor: '#FF007A',
    bgColor: '#030712',
    surfaceColor: '#0B0F19',
    textColor: '#F8FAFC',
    badgeLabel: 'Pitch Black',
  },
  {
    id: 'custom',
    name: 'Custom Saturation & Hue',
    nameId: 'Kustom Saturasi & Warna',
    category: 'Custom',
    concept: 'User-defined Soft Pink saturation level and contrast with automated WCAG AA legibility calculation.',
    conceptId: 'Pengaturan saturasi Soft Pink kustom dan kontras latar dengan kalkulasi otomatis WCAG AA.',
    isDark: true,
    accentColor: '#F89DB5',
    bgColor: '#0B0F19',
    surfaceColor: '#1E293B',
    textColor: '#F8FAFC',
    badgeLabel: 'Custom',
  },
];

export const PRESET_CUSTOM_COLORS = [
  { name: 'Soft Pink (Logo)', hex: '#F89DB5' },
  { name: 'Electric Cyan', hex: '#06b6d4' },
  { name: 'Neon Pink', hex: '#ff2a85' },
  { name: 'Phosphor Green', hex: '#22c55e' },
  { name: 'Quantum Purple', hex: '#a855f7' },
  { name: 'Solar Amber', hex: '#f59e0b' },
  { name: 'Hyper Blue', hex: '#3b82f6' },
  { name: 'Crimson Pulse', hex: '#f43f5e' },
];

/**
 * Parses Hex color to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    return isNaN(r) || isNaN(g) || isNaN(b) ? null : { r, g, b };
  }
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return isNaN(r) || isNaN(g) || isNaN(b) ? null : { r, g, b };
  }
  return null;
}

/**
 * Calculates relative luminance according to WCAG 2.1 specs
 */
export function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r / 255, g / 255, b / 255].map((val) => {
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Automatically calculates readable text contrast color (WCAG AA)
 * Returns dark text for bright backgrounds and white text for dark backgrounds.
 */
export function getContrastTextColor(hexColor: string): string {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return '#ffffff';
  const luminance = getRelativeLuminance(rgb.r, rgb.g, rgb.b);
  return luminance > 0.45 ? '#0f172a' : '#ffffff';
}

/**
 * Normalizes legacy theme strings to the 4 Engine Theme IDs
 */
export function normalizeEngineTheme(theme: string | null | undefined): EngineThemeId {
  if (!theme) return 'cyber-pink-dark';
  if (theme === 'modern-pink-light' || theme === 'theme-light' || theme === 'light') return 'modern-pink-light';
  if (theme === 'classic-terminal' || theme === 'theme-terminal' || theme === 'classic' || theme === 'terminal') return 'classic-terminal';
  if (theme === 'custom' || theme === 'theme-custom') return 'custom';
  if (theme === 'cyber-pink-dark' || theme === 'theme-dark' || theme === 'dark') return 'cyber-pink-dark';
  return 'cyber-pink-dark';
}

/**
 * Checks if a given theme ID is dark
 */
export function isDarkEngineTheme(theme: EngineThemeId): boolean {
  return theme !== 'modern-pink-light' && theme !== 'theme-light';
}

/**
 * Applies CSS custom properties and classes to document root for the chosen theme
 */
export function applyThemeToDocument(theme: EngineThemeId, customHex = '#F89DB5'): void {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;
  const isDark = isDarkEngineTheme(theme);

  // Set data-theme attribute
  root.setAttribute('data-theme', theme);

  // Set dark / light class for standard Tailwind utility compatibility
  if (isDark) {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.add('light');
    root.classList.remove('dark');
  }

  // Synchronize browser tab favicon with active theme
  const faviconLink = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
  if (faviconLink) {
    faviconLink.href = isDark ? '/favicon-dark.svg' : '/favicon-light.svg';
  }
  const appleTouchLink = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement | null;
  if (appleTouchLink) {
    appleTouchLink.href = isDark ? '/favicon-dark.svg' : '/favicon-light.svg';
  }

  // Handle custom color variables
  if (theme === 'custom') {
    const rgb = hexToRgb(customHex) || { r: 248, g: 157, b: 181 };
    const contrastText = getContrastTextColor(customHex);

    root.style.setProperty('--custom-accent-hex', customHex);
    root.style.setProperty('--custom-accent-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
    root.style.setProperty('--custom-accent-contrast', contrastText);
    root.style.setProperty('--custom-accent-subtle', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`);
    root.style.setProperty('--custom-accent-border', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4)`);
  } else {
    root.style.removeProperty('--custom-accent-hex');
    root.style.removeProperty('--custom-accent-rgb');
    root.style.removeProperty('--custom-accent-contrast');
    root.style.removeProperty('--custom-accent-subtle');
    root.style.removeProperty('--custom-accent-border');
  }
}
