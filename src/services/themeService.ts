import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import type { ThemeSettings, AccentPreset } from '../types/theme';

const STORAGE_KEY = 'duit_theme_settings';
const LEGACY_STORAGE_KEY = 'theme';

export const ACCENT_PRESETS: AccentPreset[] = [
  {
    id: 'emerald',
    name: 'Emerald Green',
    primaryHex: '#10b981',
    previewColor: '#10b981',
    shades: {
      50: '240 253 244',
      100: '220 252 231',
      200: '187 247 208',
      300: '134 239 172',
      400: '74 222 128',
      500: '34 197 94',
      600: '22 163 74',
      700: '21 128 61',
      800: '22 101 52',
      900: '20 83 45',
      950: '5 46 22',
    },
  },
  {
    id: 'blue',
    name: 'Ocean Blue',
    primaryHex: '#0284c7',
    previewColor: '#0284c7',
    shades: {
      50: '240 249 255',
      100: '224 242 254',
      200: '186 230 253',
      300: '125 211 252',
      400: '56 189 248',
      500: '14 165 233',
      600: '2 132 199',
      700: '3 105 161',
      800: '7 89 133',
      900: '12 74 110',
      950: '8 47 73',
    },
  },
  {
    id: 'purple',
    name: 'Royal Violet',
    primaryHex: '#8b5cf6',
    previewColor: '#8b5cf6',
    shades: {
      50: '245 243 255',
      100: '237 233 254',
      200: '221 214 254',
      300: '196 181 253',
      400: '167 139 250',
      500: '139 92 246',
      600: '124 58 237',
      700: '109 40 217',
      800: '91 33 182',
      900: '76 29 149',
      950: '46 16 101',
    },
  },
  {
    id: 'amber',
    name: 'Sunset Amber',
    primaryHex: '#f59e0b',
    previewColor: '#f59e0b',
    shades: {
      50: '255 251 235',
      100: '254 243 199',
      200: '253 230 138',
      300: '252 211 77',
      400: '251 191 36',
      500: '245 158 11',
      600: '217 119 6',
      700: '180 83 9',
      800: '146 64 14',
      900: '120 53 15',
      950: '69 26 3',
    },
  },
  {
    id: 'rose',
    name: 'Rose Pink',
    primaryHex: '#f43f5e',
    previewColor: '#f43f5e',
    shades: {
      50: '255 241 242',
      100: '255 228 230',
      200: '254 205 211',
      300: '253 164 175',
      400: '251 113 133',
      500: '244 63 94',
      600: '225 29 72',
      700: '190 18 60',
      800: '159 18 57',
      900: '136 19 55',
      950: '76 5 25',
    },
  },
  {
    id: 'teal',
    name: 'Cyan Teal',
    primaryHex: '#06b6d4',
    previewColor: '#06b6d4',
    shades: {
      50: '236 254 255',
      100: '207 250 254',
      200: '165 243 252',
      300: '103 232 249',
      400: '34 211 238',
      500: '6 182 212',
      600: '8 145 178',
      700: '14 116 144',
      800: '21 94 117',
      900: '22 78 99',
      950: '8 51 68',
    },
  },
  {
    id: 'indigo',
    name: 'Modern Indigo',
    primaryHex: '#6366f1',
    previewColor: '#6366f1',
    shades: {
      50: '238 242 255',
      100: '224 231 255',
      200: '199 210 254',
      300: '165 180 252',
      400: '129 140 248',
      500: '99 102 241',
      600: '79 70 229',
      700: '67 56 202',
      800: '55 48 163',
      900: '49 46 129',
      950: '30 27 75',
    },
  },
];

export const DEFAULT_THEME_SETTINGS: ThemeSettings = {
  mode: 'system',
  surfaceTone: 'default',
  accentPresetId: 'emerald',
  accentColor: '#10b981',
  radius: 'rounded',
  fontFamily: 'jakarta',
};

// Convert Hex to HSL
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  let cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map((c) => c + c).join('');
  }
  const num = parseInt(cleanHex, 16);
  if (isNaN(num) || cleanHex.length !== 6) {
    return { h: 142, s: 0.71, l: 0.45 }; // fallback emerald
  }
  const r = ((num >> 16) & 255) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return { h: h * 360, s, l };
}

// Convert HSL back to RGB triplet string "r g b"
function hslToRgbTriplet(h: number, s: number, l: number): string {
  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const normH = h / 360;
    r = hue2rgb(p, q, normH + 1 / 3);
    g = hue2rgb(p, q, normH);
    b = hue2rgb(p, q, normH - 1 / 3);
  }

  return `${Math.round(r * 255)} ${Math.round(g * 255)} ${Math.round(b * 255)}`;
}

// Generate complete Tailwind 50-950 palette from any Hex color
export function generatePaletteFromHex(hex: string): Record<number, string> {
  const { h, s } = hexToHsl(hex);
  // Adjusted lightness scale for natural contrast and depth
  const lightnessMap: Record<number, number> = {
    50: 0.96,
    100: 0.91,
    200: 0.82,
    300: 0.70,
    400: 0.58,
    500: 0.47,
    600: 0.38,
    700: 0.29,
    800: 0.21,
    900: 0.14,
    950: 0.08,
  };

  const shades: Record<number, string> = {};
  for (const [key, targetL] of Object.entries(lightnessMap)) {
    // Preserve rich saturation in middle and dark ranges, slightly softened at 50/100
    const shadeNum = Number(key);
    const adjustedS = shadeNum < 200 ? Math.min(s, 0.75) : s;
    shades[shadeNum] = hslToRgbTriplet(h, adjustedS, targetL);
  }
  return shades;
}

type ThemeListener = (settings: ThemeSettings, isDarkMode: boolean) => void;

class ThemeService {
  private currentSettings: ThemeSettings;
  private listeners: Set<ThemeListener> = new Set();
  private systemMediaQuery: MediaQueryList | null = null;

  constructor() {
    this.currentSettings = this.loadSettings();
  }

  public getSettings(): ThemeSettings {
    return { ...this.currentSettings };
  }

  public isDark(): boolean {
    if (this.currentSettings.mode === 'dark') return true;
    if (this.currentSettings.mode === 'light') return false;
    return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  public init(): void {
    if (typeof window === 'undefined') return;

    // Listen to OS system color changes
    this.systemMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.systemMediaQuery.addEventListener('change', this.handleSystemThemeChange);

    // Initial application
    this.applyTheme(this.currentSettings);
  }

  public cleanup(): void {
    if (this.systemMediaQuery) {
      this.systemMediaQuery.removeEventListener('change', this.handleSystemThemeChange);
    }
  }

  public subscribe(listener: ThemeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public updateSettings(partial: Partial<ThemeSettings>): ThemeSettings {
    const updated: ThemeSettings = { ...this.currentSettings, ...partial };
    this.currentSettings = updated;
    this.saveSettings(updated);
    this.applyTheme(updated);
    this.notify();
    return updated;
  }

  public resetToDefault(): ThemeSettings {
    return this.updateSettings(DEFAULT_THEME_SETTINGS);
  }

  private handleSystemThemeChange = () => {
    if (this.currentSettings.mode === 'system') {
      this.applyTheme(this.currentSettings);
      this.notify();
    }
  };

  private notify() {
    const isDark = this.isDark();
    this.listeners.forEach((listener) => listener({ ...this.currentSettings }, isDark));
  }

  private loadSettings(): ThemeSettings {
    if (typeof window === 'undefined') return DEFAULT_THEME_SETTINGS;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_THEME_SETTINGS, ...parsed };
      }

      // Check legacy 'theme' storage key
      const legacyTheme = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacyTheme === 'dark' || legacyTheme === 'light') {
        const migrated: ThemeSettings = {
          ...DEFAULT_THEME_SETTINGS,
          mode: legacyTheme,
        };
        this.saveSettings(migrated);
        return migrated;
      }
    } catch (e) {
      console.warn('Failed to load theme settings from localStorage', e);
    }

    return DEFAULT_THEME_SETTINGS;
  }

  private saveSettings(settings: ThemeSettings): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      // Keep legacy key synced for fallback compatibility
      const isDark =
        settings.mode === 'dark' ||
        (settings.mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      localStorage.setItem(LEGACY_STORAGE_KEY, isDark ? 'dark' : 'light');
    } catch (e) {
      console.warn('Failed to save theme settings to localStorage', e);
    }
  }

  public applyTheme(settings: ThemeSettings): void {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    const isDark = this.isDark();

    // 1. Dark Mode Class
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // 2. Data Attributes for Surface, Radius, and Font
    root.setAttribute('data-surface', settings.surfaceTone);
    root.setAttribute('data-radius', settings.radius);
    root.setAttribute('data-font', settings.fontFamily);

    // 3. Resolve Accent Palette
    let shades: Record<number, string>;
    const preset = ACCENT_PRESETS.find((p) => p.id === settings.accentPresetId);

    if (preset && settings.accentPresetId !== 'custom') {
      shades = preset.shades;
    } else {
      shades = generatePaletteFromHex(settings.accentColor);
    }

    // Set CSS Variables on document.documentElement
    for (const [shade, rgbTriplet] of Object.entries(shades)) {
      root.style.setProperty(`--brand-${shade}`, rgbTriplet);
    }
    root.style.setProperty('--brand-primary', settings.accentColor);

    // 4. Update Meta Theme Color & Native StatusBar
    let bgHex = isDark ? '#0f172a' : '#f8fafc';
    if (isDark && settings.surfaceTone === 'oled') {
      bgHex = '#000000';
    } else if (settings.surfaceTone === 'warm') {
      bgHex = isDark ? '#171513' : '#faf7f2';
    }

    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', bgHex);
    }

    if (Capacitor.isNativePlatform()) {
      StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light }).catch((e) =>
        console.warn('StatusBar style set error', e)
      );
      StatusBar.setOverlaysWebView({ overlay: true }).catch((e) =>
        console.warn('StatusBar overlay set error', e)
      );
    }
  }
}

export const themeService = new ThemeService();
