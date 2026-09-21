import React, { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { Zap, Sparkles } from 'lucide-react';
import { formatIDR } from '../../utils/formatters';
import type { Category, Transaction } from '../../types';
import { DynamicIcon } from '../common/IconPicker';
import type { Language, Translations } from '../../constants/translations';

export interface QuickPresetItem {
  label: string;
  amount: number;
  categoryId: string;
  notes: string;
  isHabit?: boolean;
  frequency?: number;
}

interface QuickPresetsProps {
  categories: Category[];
  transactions?: Transaction[];
  onSelectPreset: (preset: QuickPresetItem) => void;
  lang?: Language;
  t: Translations;
}

const EMPTY_TXS: Transaction[] = [];

export const QuickPresets: React.FC<QuickPresetsProps> = ({
  categories,
  transactions: fallbackTransactions,
  onSelectPreset,
  lang = 'id',
  t,
}) => {
  // DEXIE LIMIT QUERY: Ambil maksimal 100 transaksi terbaru untuk deteksi kebiasaan (ultra cepat)
  const recentTransactions = useLiveQuery(
    () => db.transactions.orderBy('date').reverse().limit(100).toArray(),
    []
  );

  const transactions = recentTransactions ?? fallbackTransactions ?? EMPTY_TXS;

  const categoryMap = useMemo(() => {
    return new Map(categories.map((c) => [c.id, c]));
  }, [categories]);

  const presets: QuickPresetItem[] = useMemo(() => {
    if (!categories || categories.length === 0) return [];

    // Helper to find category by name keywords
    const findCat = (keywords: string[]) => {
      const match = categories.find((c) =>
        keywords.some((k) => c.name.toLowerCase().includes(k.toLowerCase()))
      );
      return match?.id || categories[0]?.id || '';
    };

    const userHabits: QuickPresetItem[] = [];

    // 1. ANALYZE USER TRANSACTION HABITS (Frequency & Pattern Detection)
    if (transactions && transactions.length > 0) {
      const habitMap = new Map<string, {
        notes: string;
        categoryId: string;
        amounts: number[];
        count: number;
        lastDate: string;
      }>();

      for (const tx of transactions) {
        const rawNote = (tx.notes || '').trim();
        // Use note as key, or if empty, fallback to category name
        const cat = categoryMap.get(tx.categoryId);
        const label = rawNote || (cat ? cat.name : 'Pengeluaran');
        const key = `${label.toLowerCase()}__${tx.categoryId}`;

        const existing = habitMap.get(key);
        if (existing) {
          existing.count += 1;
          existing.amounts.push(tx.amount);
          if (tx.date > existing.lastDate) {
            existing.lastDate = tx.date;
          }
        } else {
          habitMap.set(key, {
            notes: label,
            categoryId: tx.categoryId,
            amounts: [tx.amount],
            count: 1,
            lastDate: tx.date,
          });
        }
      }

      // Sort habits by frequency (descending) and recency
      const sortedHabits = Array.from(habitMap.values()).sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return b.lastDate.localeCompare(a.lastDate);
      });

      for (const h of sortedHabits.slice(0, 6)) {
        // Calculate median or most frequent amount
        const amountFreq = new Map<number, number>();
        h.amounts.forEach((amt) => {
          amountFreq.set(amt, (amountFreq.get(amt) || 0) + 1);
        });
        const mostCommonAmount = Array.from(amountFreq.entries()).sort((a, b) => b[1] - a[1])[0][0];

        userHabits.push({
          label: h.notes,
          amount: mostCommonAmount,
          categoryId: h.categoryId,
          notes: h.notes,
          isHabit: true,
          frequency: h.count,
        });
      }
    }

    // 2. DEFAULT STARTER PRESETS (Used when new user or backfilling)
    const foodCatId = findCat(['makan', 'food', 'kuliner', 'minum']);
    const transportCatId = findCat(['transport', 'bensin', 'kendaraan', 'ojol']);
    const shoppingCatId = findCat(['belanja', 'shopping', 'kebutuhan']);

    const defaultStarters: QuickPresetItem[] = [
      { label: t.presetLunch || 'Makan Siang', amount: 35000, categoryId: foodCatId, notes: lang === 'en' ? 'Lunch' : 'Makan siang' },
      { label: t.presetFuel || 'Bensin', amount: 50000, categoryId: transportCatId, notes: lang === 'en' ? 'Fuel refill' : 'Isi bensin' },
      { label: t.presetCoffee || 'Kopi', amount: 20000, categoryId: foodCatId, notes: lang === 'en' ? 'Coffee' : 'Beli kopi' },
      { label: t.presetGroceries || 'Belanja', amount: 75000, categoryId: shoppingCatId, notes: lang === 'en' ? 'Daily groceries' : 'Belanja kebutuhan' },
      { label: t.presetParking || 'Parkir', amount: 10000, categoryId: transportCatId, notes: lang === 'en' ? 'Parking / Toll' : 'Parkir & tol' },
      { label: t.presetSnacks || 'Camilan', amount: 25000, categoryId: foodCatId, notes: lang === 'en' ? 'Snacks' : 'Camilan sore' },
    ];

    // Combine user habits first, then backfill with non-duplicate starters up to 6 items
    const combined: QuickPresetItem[] = [...userHabits];
    const existingLabels = new Set(userHabits.map((h) => h.label.toLowerCase()));

    for (const starter of defaultStarters) {
      if (combined.length >= 6) break;
      if (!existingLabels.has(starter.label.toLowerCase())) {
        combined.push(starter);
      }
    }

    return combined;
  }, [categories, transactions, categoryMap, lang, t]);

  if (presets.length === 0) return null;

  const hasHabits = presets.some((p) => p.isHabit);

  return (
    <div className="flex items-center space-x-2 overflow-x-auto pb-1.5 scrollbar-none">
      <div className="flex items-center text-xs font-bold text-slate-500 dark:text-slate-400 pl-1 shrink-0">
        {hasHabits ? (
          <>
            <Sparkles className="w-3.5 h-3.5 mr-1 text-emerald-500" />
            <span>{lang === 'en' ? 'Recommended:' : 'Rekomendasi:'}</span>
          </>
        ) : (
          <>
            <Zap className="w-3.5 h-3.5 mr-1 text-amber-500" />
            <span>{t.shortcuts}</span>
          </>
        )}
      </div>
      {presets.map((preset, index) => {
        const cat = categoryMap.get(preset.categoryId);
        return (
          <button
            key={`${preset.label}-${index}`}
            onClick={() => onSelectPreset(preset)}
            className="shrink-0 text-xs px-3 py-1.5 rounded-lg glass-pill hover:border-emerald-500 dark:hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all flex items-center space-x-2 active:scale-95 group cursor-pointer"
            title={preset.isHabit ? (lang === 'en' ? `Recorded ${preset.frequency} times` : `Sering dicatat (${preset.frequency}x)`) : undefined}
          >
            {cat && (
              <span
                className="w-4 h-4 rounded-md flex items-center justify-center text-white shrink-0 text-[10px]"
                style={{ backgroundColor: cat.color }}
              >
                <DynamicIcon name={cat.icon} className="w-2.5 h-2.5" />
              </span>
            )}
            <span className="font-medium text-slate-600 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
              {preset.label}
            </span>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              {formatIDR(preset.amount, true, lang)}
            </span>
          </button>
        );
      })}
    </div>
  );
};
