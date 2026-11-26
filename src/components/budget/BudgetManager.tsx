import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { Target, AlertTriangle, CheckCircle2, Edit2, Calendar, ShieldCheck, ChevronRight } from 'lucide-react';
import { CategoryDetailModal } from '../categories/CategoryDetailModal';
import type { Category, Transaction } from '../../types';
import { filterCategoriesByType, filterTransactionsByType } from '../../utils/transactionHelpers';
import { DynamicIcon } from '../common/IconPicker';
import { formatIDR, getRemainingDaysInCurrentMonth } from '../../utils/formatters';
import { startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import type { Language, Translations } from '../../constants/translations';

interface BudgetManagerProps {
  categories: Category[];
  transactions?: Transaction[];
  allTransactions?: Transaction[];
  onUpdateCategoryBudget: (categoryId: string, limit: number | undefined) => Promise<void>;
  onBatchMoveTransactions?: (transactionIds: string[], targetCategoryId: string) => Promise<void>;
  onEditTransaction?: (transaction: Transaction) => void;
  incomeEnabled?: boolean;
  lang?: Language;
  t: Translations;
}

export const BudgetManager: React.FC<BudgetManagerProps> = ({
  categories,
  transactions,
  allTransactions,
  onUpdateCategoryBudget,
  onBatchMoveTransactions,
  onEditTransaction,
  incomeEnabled = false,
  lang = 'id',
  t,
}) => {
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editLimitStr, setEditLimitStr] = useState('');
  const [selectedCategoryForDetail, setSelectedCategoryForDetail] = useState<Category | null>(null);

  const expenseCategories = useMemo(() => {
    return filterCategoriesByType(categories, 'expense');
  }, [categories]);

  // Fallback Dexie all transactions for category detail modal
  const dexieAllTxs = useLiveQuery(() => db.transactions.toArray());
  const effectiveAllTransactions = useMemo(() => {
    return filterTransactionsByType(allTransactions || transactions || dexieAllTxs || [], 'expense');
  }, [allTransactions, transactions, dexieAllTxs]);

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

  // Raw current month transactions (all types)
  const rawCurrentMonthTransactions = useMemo(() => {
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

  // Filter strictly to expense transactions for budget utilization
  const currentMonthTransactions = useMemo(() => {
    return filterTransactionsByType(rawCurrentMonthTransactions, 'expense');
  }, [rawCurrentMonthTransactions]);

  const currentMonthIncome = useMemo(() => {
    if (!incomeEnabled) return 0;
    return filterTransactionsByType(rawCurrentMonthTransactions, 'income').reduce(
      (acc, tx) => acc + tx.amount,
      0
    );
  }, [rawCurrentMonthTransactions, incomeEnabled]);

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
    return expenseCategories.reduce((acc, c) => acc + (c.budgetLimit || 0), 0);
  }, [expenseCategories]);

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

  const budgetedCategories = useMemo(
    () => expenseCategories.filter((cat) => (cat.budgetLimit || 0) > 0),
    [expenseCategories]
  );

  const unbudgetedCategories = useMemo(
    () => expenseCategories.filter((cat) => !cat.budgetLimit || cat.budgetLimit <= 0),
    [expenseCategories]
  );

  const editingUnbudgetedCat = useMemo(
    () => unbudgetedCategories.find((c) => c.id === editingCatId) || null,
    [unbudgetedCategories, editingCatId]
  );

  return (
    <div className="space-y-5">
      {/* Header Summary Card */}
      <div className="glass-card rounded-2xl p-5 sm:p-6 text-slate-900 dark:text-white relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Target className="w-6 h-6 stroke-[2.5]" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">{t.budgetHeaderTitle}</h2>
          </div>
          <div className="sm:text-right">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold tracking-wide block">{t.totalSpentThisMonth}</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5">
              {formatIDR(totalSpentThisMonth, false, lang)}
            </div>
            {incomeEnabled && currentMonthIncome > 0 && (
              <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                {t.totalIncomeLabel}: {formatIDR(currentMonthIncome, false, lang)}
              </div>
            )}
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
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
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

      {/* Active Budgeted Categories Grid */}
      {budgetedCategories.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgetedCategories.map((cat) => {
            const spent = categorySpendingThisMonth.get(cat.id) || 0;
            const limit = cat.budgetLimit || 0;
            const pct = limit > 0 ? (spent / limit) * 100 : 0;
            const isOver = limit > 0 && spent > limit;
            const isWarning = limit > 0 && pct >= 80 && pct < 100;
            const isEditing = editingCatId === cat.id;

            return (
              <div
                key={cat.id}
                className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:border-emerald-500/40 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedCategoryForDetail(cat)}
                      className="flex items-center space-x-3 min-w-0 flex-1 text-left group cursor-pointer"
                      title={t.categoryDetails}
                    >
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs group-hover:scale-105 transition-transform"
                        style={{ backgroundColor: cat.color }}
                      >
                        <DynamicIcon name={cat.icon} className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                            {cat.name}
                          </h4>
                          <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                          {lang === 'en' ? 'Spent:' : 'Terpakai:'}{' '}
                          <span className="font-semibold text-slate-800 dark:text-slate-100">
                            {formatIDR(spent, false, lang)}
                          </span>
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (isEditing) {
                          setEditingCatId(null);
                        } else {
                          setEditingCatId(cat.id);
                          setEditLimitStr(cat.budgetLimit ? cat.budgetLimit.toString() : '');
                        }
                      }}
                      className="min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                      title={t.setBudgetLimit}
                      aria-label={t.setBudgetLimit}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Edit Inline Form */}
                  {isEditing && (
                    <div className="mt-3 p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                        {t.maxLimitPerMonth}
                      </label>
                      <div className="flex items-center space-x-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-600 dark:text-slate-400">Rp</span>
                          <input
                            type="number"
                            value={editLimitStr}
                            onChange={(e) => setEditLimitStr(e.target.value)}
                            placeholder="Contoh: 1500000"
                            className="w-full min-h-[40px] pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                            autoFocus
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSaveBudget(cat.id)}
                          className="min-h-[40px] px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shrink-0 cursor-pointer"
                        >
                          {t.save}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Progress Section */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-xs gap-2">
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
                    <span className="text-slate-600 dark:text-slate-400 font-medium">
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
              </div>
            );
          })}
        </div>
      )}

      {/* Compact Unbudgeted Categories Strip */}
      {unbudgetedCategories.length > 0 && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              {t.noBudgetLimitYet} ({unbudgetedCategories.length})
            </h3>
          </div>

          <div className="flex flex-wrap gap-2">
            {unbudgetedCategories.map((cat) => {
              const isSelected = editingCatId === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      setEditingCatId(null);
                    } else {
                      setEditingCatId(cat.id);
                      setEditLimitStr('');
                    }
                  }}
                  className={`min-h-[40px] px-3 py-1.5 rounded-xl border text-xs font-semibold inline-flex items-center space-x-2 transition-colors cursor-pointer ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 hover:border-emerald-500/50'
                  }`}
                >
                  <span
                    className="w-5 h-5 rounded-md flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: cat.color }}
                  >
                    <DynamicIcon name={cat.icon} className="w-3 h-3" />
                  </span>
                  <span>{cat.name}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">+</span>
                </button>
              );
            })}
          </div>

          {editingUnbudgetedCat && (
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {editingUnbudgetedCat.name} — {t.maxLimitPerMonth}
                </label>
                <button
                  type="button"
                  onClick={() => setSelectedCategoryForDetail(editingUnbudgetedCat)}
                  className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  {t.categoryDetails}
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-600 dark:text-slate-400">Rp</span>
                  <input
                    type="number"
                    value={editLimitStr}
                    onChange={(e) => setEditLimitStr(e.target.value)}
                    placeholder="Contoh: 1500000"
                    className="w-full min-h-[40px] pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    autoFocus
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleSaveBudget(editingUnbudgetedCat.id)}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shrink-0 cursor-pointer"
                >
                  {t.save}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Category Expenses Detail Modal */}
      <CategoryDetailModal
        isOpen={Boolean(selectedCategoryForDetail)}
        onClose={() => setSelectedCategoryForDetail(null)}
        category={selectedCategoryForDetail}
        categories={categories}
        transactions={effectiveAllTransactions}
        initialPeriodFilter="THIS_MONTH"
        onBatchMoveTransactions={onBatchMoveTransactions}
        onEditTransaction={onEditTransaction}
        lang={lang}
        t={t}
      />
    </div>
  );
};
