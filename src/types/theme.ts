export type ThemeMode = 'light' | 'dark' | 'system';
export type SurfaceTone = 'default' | 'oled' | 'warm';
export type CornerRadius = 'rounded' | 'crisp';
export type FontFamilyOption = 'jakarta' | 'nunito' | 'lora' | 'inter' | 'outfit';

export interface AccentPreset {
  id: string;
  name: string;
  primaryHex: string;
  previewColor: string;
  shades: Record<number, string>; // 50 to 950 RGB triplets: "r g b"
}

export interface ThemeSettings {
  mode: ThemeMode;
  surfaceTone: SurfaceTone;
  accentPresetId: string; // 'emerald' | 'blue' | 'purple' | 'amber' | 'rose' | 'teal' | 'indigo' | 'custom'
  accentColor: string; // Primary Hex string (e.g. '#10b981')
  radius: CornerRadius;
  fontFamily: FontFamilyOption;
}
