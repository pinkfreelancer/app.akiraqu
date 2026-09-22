export type EngineThemeId =
  | 'theme-light'
  | 'theme-dark'
  | 'theme-terminal'
  | 'theme-glassnode'
  | 'theme-custom'
  // Legacy aliases for backward compatibility:
  | 'modern-pink-light'
  | 'cyber-pink-dark'
  | 'classic-terminal'
  | 'glassnode'
  | 'custom';

export interface ThemeOption {
  id: EngineThemeId;
  name: string;
  nameId: string;
  category: 'Light' | 'Dark' | 'Terminal' | 'Custom' | 'Institutional';
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
    id: 'theme-glassnode',
    name: 'Glassnode Research (Soft Pink)',
    nameId: 'Konsol Riset Glassnode (Soft Pink)',
    category: 'Institutional',
    concept: 'Institutional Bloomberg terminal aesthetic: Cool cloud canvas (#EDEFF2), pure white cards (#FFFFFF) with 1px mist hairline borders (#DEDFE1), sharp 2px radii, and subtle Soft Pink accent wash.',
    conceptId: 'Estetika konsol riset institusional: Kanvas Cloud (#EDEFF2), kartu White (#FFFFFF) dengan border hairline Mist 1px (#DEDFE1), radius tegas 2px, dan aksen Soft Pink wash.',
    isDark: false,
    accentColor: '#F472B6',
    bgColor: '#EDEFF2',
    surfaceColor: '#FFFFFF',
    textColor: '#1A1A1A',
    badgeLabel: 'Glassnode 2px',
  },
  {
    id: 'theme-light',
    name: 'Light Theme',
    nameId: 'Light Theme',
    category: 'Light',
    concept: 'Slate 50 background (#F8FAFC) with pure white cards (#FFFFFF), subtle borders (#E2E8F0), and Soft Pink accent (#F472B6).',
    conceptId: 'Background Slate 50 (#F8FAFC), Surface/Card #FFFFFF berborder halus (#E2E8F0), dan aksen Soft Pink #F472B6 (Pink 400).',
    isDark: false,
    accentColor: '#F472B6',
    bgColor: '#F8FAFC',
    surfaceColor: '#FFFFFF',
    textColor: '#0F172A',
    badgeLabel: 'Soft Pink 400',
  },
  {
    id: 'theme-dark',
    name: 'Dark Theme (Default)',
    nameId: 'Dark Theme (Default)',
    category: 'Dark',
    concept: 'Deep Navy background (#0B0F19) with Slate 800 cards (#1E293B, backdrop-blur-md) and glowing Soft Pink accent (#EC4899).',
    conceptId: 'Background Deep Navy (#0B0F19), Surface/Card #1E293B berfitur glassmorphism tipis, dan aksen Soft Pink glow #EC4899 (Pink 500).',
    isDark: true,
    accentColor: '#EC4899',
    bgColor: '#0B0F19',
    surfaceColor: '#1E293B',
    textColor: '#F8FAFC',
    badgeLabel: 'Default Dark',
  },
  {
    id: 'theme-terminal',
    name: 'Terminal Theme',
    nameId: 'Terminal Theme',
    category: 'Terminal',
    concept: 'Pitch black background (#030712), surface card (#0B0F19) with monochromatic green-pink border, Cyber Pink (#FF007A) & JetBrains Mono.',
    conceptId: 'Background Pitch Black (#030712), Card #0B0F19 berborder hijau-pink monokromatik, Cyber Pink (#FF007A) & JetBrains Mono.',
    isDark: true,
    accentColor: '#FF007A',
    bgColor: '#030712',
    surfaceColor: '#0B0F19',
    textColor: '#F8FAFC',
    badgeLabel: 'JetBrains Mono',
  },
  {
    id: 'theme-custom',
    name: 'Custom Theme',
    nameId: 'Custom Theme',
    category: 'Custom',
    concept: 'Personalized mini color picker to adjust Soft Pink saturation and background contrast for custom eye ergonomics.',
    conceptId: 'Color Picker mini untuk mengatur sendiri tingkat saturasi Soft Pink dan kontras background sesuai kenyamanan mata.',
    isDark: true,
    accentColor: '#EC4899',
    bgColor: '#0B0F19',
    surfaceColor: '#1E293B',
    textColor: '#F8FAFC',
    badgeLabel: 'Mini Picker',
  },
];

export const PRESET_SOFT_PINK_COLORS = [
  { name: 'Soft Pink 400', hex: '#F472B6', desc: 'Light & Fresh' },
  { name: 'Soft Pink 500', hex: '#EC4899', desc: 'Vibrant Glow' },
  { name: 'Deep Magenta', hex: '#DB2777', desc: 'Rich Contrast' },
  { name: 'Cyber Pink', hex: '#FF007A', desc: 'Neon Quant' },
  { name: 'Pastel Blush', hex: '#F9A8D4', desc: 'Gentle Tone' },
  { name: 'Rose Quartz', hex: '#FB7185', desc: 'Warm Rose' },
];

export const SOFT_PINK_SHADES = PRESET_SOFT_PINK_COLORS;

export const PRESET_BACKGROUND_CONTRASTS = [
  { name: 'Pitch Black', hex: '#030712', surfaceHex: '#0B0F19', desc: 'Ultra Dark (Terminal)' },
  { name: 'Deep Navy (Default)', hex: '#0B0F19', surfaceHex: '#1E293B', desc: 'Slate 950 Eye-Comfort' },
  { name: 'Slate Night', hex: '#0F172A', surfaceHex: '#1E293B', desc: 'Muted Dark' },
  { name: 'Charcoal Dark', hex: '#18181B', surfaceHex: '#27272A', desc: 'Neutral Balance' },
  { name: 'Slate Light', hex: '#F8FAFC', surfaceHex: '#FFFFFF', desc: 'Clean Off-White' },
];

export const PRESET_CUSTOM_COLORS = [
  { name: 'Soft Pink 400', hex: '#F472B6' },
  { name: 'Soft Pink 500', hex: '#EC4899' },
  { name: 'Cyber Pink', hex: '#FF007A' },
  { name: 'Electric Cyan', hex: '#06B6D4' },
  { name: 'Phosphor Green', hex: '#22C55E' },
  { name: 'Quantum Purple', hex: '#A855F7' },
  { name: 'Solar Amber', hex: '#F59E0B' },
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
 * Normalizes theme strings to the 4 canonical Engine Theme IDs:
 * theme-light | theme-dark (default) | theme-terminal | theme-custom
 */
export function normalizeEngineTheme(theme: string | null | undefined): EngineThemeId {
  if (!theme) return 'theme-dark';
  if (theme === 'theme-glassnode' || theme === 'glassnode') return 'theme-glassnode';
  if (theme === 'theme-light' || theme === 'modern-pink-light' || theme === 'light') return 'theme-light';
  if (theme === 'theme-terminal' || theme === 'classic-terminal' || theme === 'classic' || theme === 'terminal') return 'theme-terminal';
  if (theme === 'theme-custom' || theme === 'custom') return 'theme-custom';
  if (theme === 'theme-dark' || theme === 'cyber-pink-dark' || theme === 'dark') return 'theme-dark';
  return 'theme-dark';
}

/**
 * Checks if a given theme ID is dark
 */
export function isDarkEngineTheme(theme: EngineThemeId): boolean {
  const norm = normalizeEngineTheme(theme);
  if (norm === 'theme-light' || norm === 'theme-glassnode') return false;
  if (norm === 'theme-custom' && typeof window !== 'undefined') {
    const customBg = document.documentElement.style.getPropertyValue('--custom-bg-hex');
    if (customBg) {
      const rgb = hexToRgb(customBg);
      if (rgb) {
        return getRelativeLuminance(rgb.r, rgb.g, rgb.b) <= 0.45;
      }
    }
  }
  return true;
}

/**
 * Applies CSS custom properties and classes to document root for the chosen theme
 */
export function applyThemeToDocument(
  theme: EngineThemeId,
  customHex = '#EC4899',
  customBg = '#0B0F19'
): void {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;
  const norm = normalizeEngineTheme(theme);
  const isDark = isDarkEngineTheme(norm);

  // Set canonical data-theme attribute
  root.setAttribute('data-theme', norm);

  // Clear previous theme classes to prevent style clashes
  const allThemeClasses = [
    'theme-light',
    'theme-dark',
    'theme-terminal',
    'theme-glassnode',
    'theme-custom',
    'theme-modern-pink-light',
    'theme-cyber-pink-dark',
    'theme-classic-terminal',
    'modern-pink-light',
    'cyber-pink-dark',
    'classic-terminal',
    'glassnode',
    'custom',
  ];
  root.classList.remove(...allThemeClasses);

  // Add active theme class
  root.classList.add(norm);
  // Add legacy class alias for any CSS selectors expecting legacy class names
  if (norm === 'theme-glassnode') root.classList.add('theme-glassnode');
  if (norm === 'theme-light') root.classList.add('theme-modern-pink-light');
  if (norm === 'theme-dark') root.classList.add('theme-cyber-pink-dark');
  if (norm === 'theme-terminal') root.classList.add('theme-classic-terminal');
  if (norm === 'theme-custom') root.classList.add('theme-custom');

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

  // Handle custom color variables for theme-custom
  if (norm === 'theme-custom') {
    const accentRgb = hexToRgb(customHex) || { r: 236, g: 72, b: 153 };
    const bgRgb = hexToRgb(customBg) || { r: 11, g: 15, b: 25 };
    const contrastText = getContrastTextColor(customHex);
    const bgLuminance = getRelativeLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
    const isCustomBgDark = bgLuminance <= 0.45;

    // Calculate harmonious surface and border colors based on bg contrast
    const surfaceHex = isCustomBgDark
      ? bgLuminance < 0.05
        ? '#0B0F19'
        : '#1E293B'
      : '#FFFFFF';
    const borderHex = isCustomBgDark ? 'rgba(51, 65, 85, 0.7)' : '#E2E8F0';
    const textMainHex = isCustomBgDark ? '#F8FAFC' : '#0F172A';

    root.style.setProperty('--custom-accent-hex', customHex);
    root.style.setProperty('--custom-accent-rgb', `${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}`);
    root.style.setProperty('--custom-accent-contrast', contrastText);
    root.style.setProperty('--custom-accent-subtle', `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, 0.15)`);
    root.style.setProperty('--custom-accent-border', `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, 0.45)`);
    root.style.setProperty('--custom-accent-glow', `0 0 14px rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, 0.4)`);

    root.style.setProperty('--custom-bg-hex', customBg);
    root.style.setProperty('--custom-surface-hex', surfaceHex);
    root.style.setProperty('--custom-border-hex', borderHex);
    root.style.setProperty('--custom-text-main', textMainHex);
  } else {
    root.style.removeProperty('--custom-accent-hex');
    root.style.removeProperty('--custom-accent-rgb');
    root.style.removeProperty('--custom-accent-contrast');
    root.style.removeProperty('--custom-accent-subtle');
    root.style.removeProperty('--custom-accent-border');
    root.style.removeProperty('--custom-accent-glow');
    root.style.removeProperty('--custom-bg-hex');
    root.style.removeProperty('--custom-surface-hex');
    root.style.removeProperty('--custom-border-hex');
    root.style.removeProperty('--custom-text-main');
  }
}
