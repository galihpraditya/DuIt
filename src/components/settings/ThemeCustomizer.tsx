import React, { useState, useEffect, useId } from 'react';
import {
  Sun,
  Moon,
  Laptop,
  Check,
  RotateCcw,
  Sparkles,
  Zap,
  Coffee,
  Plus,
} from 'lucide-react';
import type { Translations } from '../../constants/translations';
import {
  themeService,
  ACCENT_PRESETS,
} from '../../services/themeService';
import type {
  ThemeSettings,
  ThemeMode,
  SurfaceTone,
  CornerRadius,
  FontFamilyOption,
} from '../../types/theme';

interface ThemeCustomizerProps {
  t: Translations;
  onThemeChanged?: (settings: ThemeSettings) => void;
}

export const ThemeCustomizer: React.FC<ThemeCustomizerProps> = ({ t, onThemeChanged }) => {
  const [settings, setSettings] = useState<ThemeSettings>(() => themeService.getSettings());
  const [customHexInput, setCustomHexInput] = useState<string>(settings.accentColor);
  const [resetFeedback, setResetFeedback] = useState<string | null>(null);
  const colorInputId = useId();

  useEffect(() => {
    const unsubscribe = themeService.subscribe((newSettings) => {
      setSettings(newSettings);
      setCustomHexInput(newSettings.accentColor);
      if (onThemeChanged) onThemeChanged(newSettings);
    });
    return unsubscribe;
  }, [onThemeChanged]);

  const handleUpdate = (partial: Partial<ThemeSettings>) => {
    const updated = themeService.updateSettings(partial);
    setSettings(updated);
    if (onThemeChanged) onThemeChanged(updated);
  };

  const handleSelectPreset = (presetId: string, hex: string) => {
    handleUpdate({
      accentPresetId: presetId,
      accentColor: hex,
    });
    setCustomHexInput(hex);
  };

  const handleCustomHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomHexInput(value);
    if (/^#([0-9A-Fa-f]{3}){1,2}$/.test(value)) {
      handleUpdate({
        accentPresetId: 'custom',
        accentColor: value,
      });
    }
  };

  const handleCustomPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomHexInput(value);
    handleUpdate({
      accentPresetId: 'custom',
      accentColor: value,
    });
  };

  const handleSelectSurfaceTone = (tone: SurfaceTone) => {
    // If user clicks OLED while in light mode, auto-switch to dark mode so OLED is immediately effective
    if (tone === 'oled' && settings.mode === 'light') {
      handleUpdate({ surfaceTone: tone, mode: 'dark' });
    } else {
      handleUpdate({ surfaceTone: tone });
    }
  };

  const handleReset = () => {
    const defaultSettings = themeService.resetToDefault();
    setSettings(defaultSettings);
    setCustomHexInput(defaultSettings.accentColor);
    setResetFeedback(t.themeResetSuccess);
    setTimeout(() => setResetFeedback(null), 3500);
    if (onThemeChanged) onThemeChanged(defaultSettings);
  };

  const getPresetDisplayName = (presetId: string): string => {
    switch (presetId) {
      case 'emerald':
        return t.colorEmerald;
      case 'blue':
        return t.colorBlue;
      case 'purple':
        return t.colorPurple;
      case 'amber':
        return t.colorAmber;
      case 'rose':
        return t.colorRose;
      case 'teal':
        return t.colorTeal;
      case 'indigo':
        return t.colorIndigo;
      default:
        return t.customColorLabel;
    }
  };

  const modeOptions: { id: ThemeMode; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'light', label: t.lightMode, icon: Sun },
    { id: 'dark', label: t.darkMode, icon: Moon },
    { id: 'system', label: t.systemMode, icon: Laptop },
  ];

  const surfaceOptions: {
    id: SurfaceTone;
    label: string;
    description: string;
    icon: React.FC<{ className?: string }>;
  }[] = [
    { id: 'default', label: t.surfaceDefault, description: t.surfaceDefaultDesc, icon: Sparkles },
    {
      id: 'oled',
      label: t.surfaceOled,
      description: t.surfaceOledDesc,
      icon: Zap,
    },
    { id: 'warm', label: t.surfaceWarm, description: t.surfaceWarmDesc, icon: Coffee },
  ];

  const radiusOptions: { id: CornerRadius; label: string }[] = [
    { id: 'rounded', label: t.radiusRounded },
    { id: 'crisp', label: t.radiusCrisp },
  ];

  const fontOptions: {
    id: FontFamilyOption;
    label: string;
    desc: string;
    badge: string;
    sample: string;
    fontFamilyCss: string;
  }[] = [
    {
      id: 'jakarta',
      label: t.fontJakarta,
      desc: t.fontJakartaDesc,
      badge: 'Modern',
      sample: 'Aa 123',
      fontFamilyCss: '"Plus Jakarta Sans", system-ui, sans-serif',
    },
    {
      id: 'nunito',
      label: t.fontNunito,
      desc: t.fontNunitoDesc,
      badge: 'Soft',
      sample: 'Aa 123',
      fontFamilyCss: '"Nunito", system-ui, sans-serif',
    },
    {
      id: 'lora',
      label: t.fontLora,
      desc: t.fontLoraDesc,
      badge: 'Classic',
      sample: 'Aa 123',
      fontFamilyCss: '"Lora", Georgia, serif',
    },
    {
      id: 'inter',
      label: t.fontInter,
      desc: t.fontInterDesc,
      badge: 'Netral',
      sample: 'Aa 123',
      fontFamilyCss: '"Inter", system-ui, sans-serif',
    },
    {
      id: 'outfit',
      label: t.fontOutfit,
      desc: t.fontOutfitDesc,
      badge: 'Stylish',
      sample: 'Aa 123',
      fontFamilyCss: '"Outfit", system-ui, sans-serif',
    },
  ];

  const isCustomActive = settings.accentPresetId === 'custom';

  return (
    <div className="space-y-6">
      {/* 1. Mode Tampilan (Light, Dark, System) */}
      <div className="space-y-2.5">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
          {t.themeModeTitle}
        </label>
        <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
          {modeOptions.map((opt) => {
            const Icon = opt.icon;
            const isSelected = settings.mode === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleUpdate({ mode: opt.id })}
                className={`flex items-center justify-center space-x-1.5 py-2 px-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer select-none ${
                  isSelected
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 ${
                    isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                  }`}
                />
                <span className="truncate">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Karakter Permukaan (Surface Mood) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {t.surfaceMoodTitle}
          </label>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {surfaceOptions.map((surface) => {
            const Icon = surface.icon;
            const isSelected = settings.surfaceTone === surface.id;
            return (
              <button
                key={surface.id}
                type="button"
                onClick={() => handleSelectSurfaceTone(surface.id)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1.5 min-h-[76px] ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-2">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isSelected
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                    />
                    <span className="text-xs font-bold">{surface.label}</span>
                  </div>
                  {isSelected && (
                    <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  {surface.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Warna Aksen Utama (7 Presets + Custom Color) */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
          {t.accentColorTitle}
        </label>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
          {ACCENT_PRESETS.map((preset) => {
            const isSelected = settings.accentPresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset.id, preset.primaryHex)}
                title={preset.name}
                className="group flex flex-col items-center space-y-1.5 cursor-pointer focus:outline-none"
              >
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all shadow-xs ${
                    isSelected
                      ? 'ring-2 ring-offset-2 ring-emerald-500 dark:ring-offset-slate-900 scale-105'
                      : 'hover:scale-105 opacity-90 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: preset.previewColor }}
                >
                  {isSelected && <Check className="w-5 h-5 text-white stroke-[3]" />}
                </div>
                <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400 truncate max-w-full text-center">
                  {getPresetDisplayName(preset.id)}
                </span>
              </button>
            );
          })}

          {/* Tombol Kustom Hex */}
          <div className="flex flex-col items-center space-y-1.5">
            <label
              htmlFor={colorInputId}
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-xs border-2 border-dashed ${
                isCustomActive
                  ? 'ring-2 ring-offset-2 ring-emerald-500 dark:ring-offset-slate-900 border-transparent'
                  : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 hover:scale-105'
              }`}
              style={{
                backgroundColor: isCustomActive ? settings.accentColor : undefined,
              }}
              title={t.customColorLabel}
            >
              {isCustomActive ? (
                <Check className="w-5 h-5 text-white stroke-[3]" />
              ) : (
                <Plus className="w-5 h-5 text-slate-400" />
              )}
            </label>
            <input
              id={colorInputId}
              type="color"
              value={settings.accentColor}
              onChange={handleCustomPickerChange}
              className="sr-only"
            />
            <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400 text-center">
              {t.customColorLabel}
            </span>
          </div>
        </div>

        {/* Input Text Hex saat warna kustom aktif */}
        {isCustomActive && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center space-x-2.5">
              <div
                className="w-7 h-7 rounded-xl shadow-xs shrink-0 border border-black/10"
                style={{ backgroundColor: settings.accentColor }}
              />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t.hexCodeLabel}:
              </span>
            </div>
            <input
              type="text"
              value={customHexInput}
              onChange={handleCustomHexChange}
              placeholder="#10b981"
              maxLength={7}
              className="w-28 px-3 py-1.5 text-xs font-mono font-bold uppercase rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900 dark:text-white text-center"
            />
          </div>
        )}
      </div>

      {/* 4. Gaya Sudut (Corner Radius) */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
          {t.radiusTitle}
        </label>
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 max-w-sm">
          {radiusOptions.map((rad) => {
            const isSelected = settings.radius === rad.id;
            return (
              <button
                key={rad.id}
                type="button"
                onClick={() => handleUpdate({ radius: rad.id })}
                className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer text-center ${
                  isSelected
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {rad.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Gaya Teks & Tipografi */}
      <div className="space-y-2.5">
        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {t.fontTitle}
          </label>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {t.fontSubtitle}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {fontOptions.map((f) => {
            const isSelected = settings.fontFamily === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => handleUpdate({ fontFamily: f.id })}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2.5 ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span
                    className="text-base font-bold tracking-tight text-slate-900 dark:text-white"
                    style={{ fontFamily: f.fontFamilyCss }}
                  >
                    {f.sample}
                  </span>
                  <div className="flex items-center space-x-1.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isSelected
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : 'bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {f.badge}
                    </span>
                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <div
                    className="text-xs font-bold text-slate-900 dark:text-white"
                    style={{ fontFamily: f.fontFamilyCss }}
                  >
                    {f.label}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                    {f.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 6. Footer: Reset Theme Button */}
      <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
        <span className="text-[11px] text-slate-400 dark:text-slate-500">
        </span>
        <button
          type="button"
          onClick={handleReset}
          className="text-xs font-semibold text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 flex items-center space-x-1.5 transition-colors cursor-pointer py-1.5 px-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{t.resetThemeBtn}</span>
        </button>
      </div>

      {resetFeedback && (
        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
          {resetFeedback}
        </div>
      )}
    </div>
  );
};
