import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { Target, AlertTriangle, CheckCircle2, Edit2, Calendar, Sparkles } from 'lucide-react';
import type { Category, Transaction } from '../../types';
import { DynamicIcon } from '../common/IconPicker';
import { formatIDR, getRemainingDaysInCurrentMonth } from '../../utils/formatters';
import { startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import type { Language, Translations } from '../../constants/translations';

interface BudgetManagerProps {
  categories: Category[];
  transactions?: Transaction[];
  onUpdateCategoryBudget: (categoryId: string, limit: number | undefined) => Promise<void>;
  lang?: Language;
  t: Translations;
}

export const BudgetManager: React.FC<BudgetManagerProps> = ({
  categories,
  transactions,
  onUpdateCategoryBudget,
  lang = 'id',
  t,
}) => {
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editLimitStr, setEditLimitStr] = useState('');

  // Current month interval
  const monthInterval = useMemo(() => {
    const now = new Date();
    return {
      start: startOfMonth(now),
      end: endOfMonth(now),
    };
  }, []);

  const remainingDays = useMemo(() => {
    return getRemainingDaysInCurrentMonth();
  }, []);

  // DEXIE INDEXED QUERY: Hanya query data transaksi bulan aktif langsung dari storage
  const dexieMonthTxs = useLiveQuery(() => {
    const start = monthInterval.start.toISOString();
    const end = monthInterval.end.toISOString();
    return db.transactions.where('date').between(start, end, true, true).toArray();
  }, [monthInterval]);

  // Filter current month transactions (prioritaskan hasil Dexie Indexed query)
  const currentMonthTransactions = useMemo(() => {
    if (dexieMonthTxs !== undefined) return dexieMonthTxs;
    if (!transactions) return [];
    return transactions.filter((tx) => {
      try {
        const d = parseISO(tx.date);
        return isWithinInterval(d, monthInterval);
      } catch {
        return false;
      }
    });
  }, [dexieMonthTxs, transactions, monthInterval]);

  // Compute spending per category this month
  const categorySpendingThisMonth = useMemo(() => {
    const map = new Map<string, number>();
    currentMonthTransactions.forEach((tx) => {
      map.set(tx.categoryId, (map.get(tx.categoryId) || 0) + tx.amount);
    });
    return map;
  }, [currentMonthTransactions]);

  // Total budget & spending
  const totalBudget = useMemo(() => {
    return categories.reduce((acc, c) => acc + (c.budgetLimit || 0), 0);
  }, [categories]);

  const totalSpentThisMonth = useMemo(() => {
    return currentMonthTransactions.reduce((acc, tx) => acc + tx.amount, 0);
  }, [currentMonthTransactions]);

  const overallPercentage = totalBudget > 0 ? (totalSpentThisMonth / totalBudget) * 100 : 0;
  const remainingBudget = totalBudget - totalSpentThisMonth;

  // Safe daily allowance
  const safeDailyAllowance = useMemo(() => {
    if (remainingBudget <= 0) return 0;
    return Math.round(remainingBudget / remainingDays);
  }, [remainingBudget, remainingDays]);

  const handleSaveBudget = async (categoryId: string) => {
    const cleanStr = editLimitStr.replace(/[^0-9]/g, '');
    const num = cleanStr ? parseInt(cleanStr, 10) : undefined;
    await onUpdateCategoryBudget(categoryId, isNaN(num as number) ? undefined : num);
    setEditingCatId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Summary Card (Liquid Glass) */}
      <div className="glass-card rounded-3xl p-5 sm:p-6 text-slate-900 dark:text-white relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Target className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">{t.budgetHeaderTitle}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t.budgetHeaderDesc}</p>
            </div>
          </div>
          <div className="sm:text-right">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold tracking-wide block">{t.totalSpentThisMonth}</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5">
              {formatIDR(totalSpentThisMonth, false, lang)}
            </div>
          </div>
        </div>

        {/* Big Overall Progress Bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-slate-500 dark:text-slate-400 font-semibold">
              {overallPercentage.toFixed(1)}% {t.spentOfTarget} {formatIDR(totalBudget, false, lang)}
            </span>
            <span
              className={`font-bold px-2.5 py-0.5 rounded-md ${
                totalSpentThisMonth > totalBudget && totalBudget > 0
                  ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
              }`}
            >
              {totalBudget > totalSpentThisMonth
                ? `${t.remaining} ${formatIDR(remainingBudget, false, lang)}`
                : totalBudget > 0
                ? `${t.overBy} ${formatIDR(totalSpentThisMonth - totalBudget, false, lang)}`
                : t.noLimitSet}
            </span>
          </div>

          <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                overallPercentage >= 100
                  ? 'bg-rose-500'
                  : overallPercentage >= 80
                  ? 'bg-amber-400'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(overallPercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Financial Insight Pill: Daily Safe-to-Spend Allowance */}
        {totalBudget > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300 font-medium">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span>
                <strong className="text-slate-800 dark:text-slate-100">{t.safeDailyAllowanceTitle}</strong> {t.safeDailyAllowanceDesc}{' '}
                <span className="font-bold text-emerald-600 dark:text-emerald-400 ml-1">
                  {formatIDR(safeDailyAllowance, false, lang)} / {lang === 'en' ? 'day' : 'hari'}
                </span>
              </span>
            </div>
            <div className="flex items-center space-x-1.5 text-slate-500 dark:text-slate-400 font-semibold text-[11px] w-fit">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {remainingDays} {t.daysRemainingInMonth}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Categories Budget Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((cat) => {
          const spent = categorySpendingThisMonth.get(cat.id) || 0;
          const limit = cat.budgetLimit || 0;
          const pct = limit > 0 ? (spent / limit) * 100 : 0;
          const isOver = limit > 0 && spent > limit;
          const isWarning = limit > 0 && pct >= 80 && pct < 100;
          const isEditing = editingCatId === cat.id;

          return (
            <div
              key={cat.id}
              className="glass-card rounded-3xl p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm"
                      style={{ backgroundColor: cat.color }}
                    >
                      <DynamicIcon name={cat.icon} className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{cat.name}</h4>
                      <p className="text-xs text-slate-400">
                        {lang === 'en' ? 'Spent:' : 'Terpakai:'}{' '}
                        <span className="font-semibold text-slate-700 dark:text-slate-200">
                          {formatIDR(spent, false, lang)}
                        </span>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (isEditing) {
                        setEditingCatId(null);
                      } else {
                        setEditingCatId(cat.id);
                        setEditLimitStr(cat.budgetLimit ? cat.budgetLimit.toString() : '');
                      }
                    }}
                    className="p-2 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer active:scale-95"
                    title={t.setBudgetLimit}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Edit Inline Form */}
                {isEditing && (
                  <div className="mt-3 p-3.5 bg-slate-50/90 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 animate-in fade-in">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      {t.maxLimitPerMonth}
                    </label>
                    <div className="flex items-center space-x-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                        <input
                          type="number"
                          value={editLimitStr}
                          onChange={(e) => setEditLimitStr(e.target.value)}
                          placeholder="Contoh: 1500000"
                          className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                          autoFocus
                        />
                      </div>
                      <button
                        onClick={() => handleSaveBudget(cat.id)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shrink-0 active:scale-95 cursor-pointer"
                      >
                        {t.save}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Progress Section */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                {limit > 0 ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-1">
                        {isOver ? (
                          <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center">
                            <AlertTriangle className="w-3.5 h-3.5 mr-1 shrink-0" /> {t.overBudget} ({pct.toFixed(0)}%)
                          </span>
                        ) : isWarning ? (
                          <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center">
                            <AlertTriangle className="w-3.5 h-3.5 mr-1 shrink-0" /> {t.nearingLimit} ({pct.toFixed(0)}%)
                          </span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1 shrink-0" /> {t.controlled} ({pct.toFixed(0)}%)
                          </span>
                        )}
                      </div>
                      <span className="text-slate-500 dark:text-slate-400 font-medium">
                        {t.limitLabel} {formatIDR(limit, false, lang)}
                      </span>
                    </div>

                    <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isOver ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{t.noBudgetLimitYet}</span>
                    <button
                      onClick={() => {
                        setEditingCatId(cat.id);
                        setEditLimitStr('');
                      }}
                      className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                    >
                      {t.setBudgetLimit}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
