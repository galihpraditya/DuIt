import React, { useMemo } from 'react';
import { Zap } from 'lucide-react';
import { formatIDR } from '../../utils/formatters';
import type { Category } from '../../types';
import type { Language, Translations } from '../../constants/translations';

export interface QuickPresetItem {
  label: string;
  amount: number;
  categoryId: string;
  notes: string;
}

interface QuickPresetsProps {
  categories: Category[];
  onSelectPreset: (preset: QuickPresetItem) => void;
  lang?: Language;
  t: Translations;
}

export const QuickPresets: React.FC<QuickPresetsProps> = ({
  categories,
  onSelectPreset,
  lang = 'id',
  t,
}) => {
  const presets: QuickPresetItem[] = useMemo(() => {
    if (!categories || categories.length === 0) return [];

    const findCat = (keywords: string[]) => {
      const match = categories.find((c) =>
        keywords.some((k) => c.name.toLowerCase().includes(k.toLowerCase()))
      );
      return match?.id || categories[0].id;
    };

    const foodCatId = findCat(['makan', 'food', 'kuliner', 'minum']);
    const transportCatId = findCat(['transport', 'bensin', 'kendaraan', 'ojol']);
    const shoppingCatId = findCat(['belanja', 'shopping', 'kebutuhan']);

    return [
      { label: t.presetCoffee, amount: 20000, categoryId: foodCatId, notes: lang === 'en' ? 'Daily coffee' : 'Kopi harian' },
      { label: t.presetLunch, amount: 35000, categoryId: foodCatId, notes: lang === 'en' ? 'Lunch' : 'Makan siang' },
      { label: t.presetFuel, amount: 50000, categoryId: transportCatId, notes: lang === 'en' ? 'Fuel refill' : 'Isi bensin' },
      { label: t.presetParking, amount: 15000, categoryId: transportCatId, notes: lang === 'en' ? 'Parking / Toll' : 'Biaya parkir/tol' },
      { label: t.presetGroceries, amount: 75000, categoryId: shoppingCatId, notes: lang === 'en' ? 'Daily necessities' : 'Belanja harian' },
      { label: t.presetSnacks, amount: 25000, categoryId: foodCatId, notes: lang === 'en' ? 'Snacks' : 'Beli camilan' },
    ];
  }, [categories, lang, t]);

  if (presets.length === 0) return null;

  return (
    <div className="flex items-center space-x-2 overflow-x-auto pb-1.5 scrollbar-none">
      <div className="flex items-center text-xs font-semibold text-slate-500 dark:text-slate-400 pl-1 shrink-0">
        <Zap className="w-3.5 h-3.5 mr-1 text-amber-500" />
        <span>{t.shortcuts}</span>
      </div>
      {presets.map((preset, index) => (
        <button
          key={index}
          onClick={() => onSelectPreset(preset)}
          className="shrink-0 text-xs px-3 py-1.5 rounded-full glass-pill hover:border-emerald-500 dark:hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 shadow-sm transition-all flex items-center space-x-1.5 active:scale-95 group"
        >
          <span className="font-medium text-slate-700 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
            {preset.label}
          </span>
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md border border-emerald-100 dark:border-emerald-900/40">
            {formatIDR(preset.amount, true, lang)}
          </span>
        </button>
      ))}
    </div>
  );
};
