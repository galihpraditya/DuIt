import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Filter, ArrowDownRight, Calendar as CalendarIcon, Tag, RotateCcw, CalendarDays, Smartphone, Banknote, Landmark, CreditCard } from 'lucide-react';
import type { Category, Transaction, PaymentMethodType } from '../../types';
import { DynamicIcon } from '../common/IconPicker';
import { formatIDR, formatRelativeDateIndo, formatTimeOnly, getMonthWeeks } from '../../utils/formatters';
import { format, parseISO, isWithinInterval } from 'date-fns';
import type { Language, Translations } from '../../constants/translations';

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
  selectedMonthFilter: string;
  onSelectMonthFilter?: (month: string) => void;
  onEditTransaction: (transaction: Transaction) => void;
  onDeleteTransaction?: (id: string) => void;
  onOpenNewTransaction: () => void;
  lang?: Language;
  t: Translations;
}

const getPaymentBadge = (method?: PaymentMethodType) => {
  switch (method) {
    case 'E-Wallet':
      return { label: 'E-Wallet', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40', icon: Smartphone };
    case 'Tunai':
      return { label: 'Tunai', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800/40', icon: Banknote };
    case 'Transfer Bank':
      return { label: 'Transfer', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800/40', icon: Landmark };
    case 'Kartu Debit':
      return { label: 'Debit', color: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800/40', icon: CreditCard };
    case 'Kartu Kredit':
      return { label: 'Kredit', color: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800/40', icon: CreditCard };
    default:
      return null;
  }
};

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  categories,
  selectedMonthFilter,
  onSelectMonthFilter,
  onEditTransaction,
  onOpenNewTransaction,
  lang = 'id',
  t,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [selectedWeekFilter, setSelectedWeekFilter] = useState<string>('ALL');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener: Press '/' to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const categoryMap = useMemo(() => {
    return new Map(categories.map((c) => [c.id, c]));
  }, [categories]);

  const isAllTime = selectedMonthFilter === 'ALL';

  // Default to current month for week partitioning if 'ALL' is selected
  const activeMonthForWeeks = useMemo(() => {
    return isAllTime ? format(new Date(), 'yyyy-MM') : selectedMonthFilter;
  }, [selectedMonthFilter, isAllTime]);

  // Available weeks in active month
  const availableWeeks = useMemo(() => {
    if (isAllTime) return [];
    return getMonthWeeks(activeMonthForWeeks, lang);
  }, [activeMonthForWeeks, isAllTime, lang]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // 1. Search query filter
      const cat = categoryMap.get(tx.categoryId);
      const catName = cat?.name.toLowerCase() || '';
      const notes = (tx.notes || '').toLowerCase();
      const payment = (tx.paymentMethod || '').toLowerCase();
      const query = searchQuery.toLowerCase().trim();

      const matchesSearch =
        !query ||
        notes.includes(query) ||
        catName.includes(query) ||
        payment.includes(query) ||
        tx.amount.toString().includes(query);

      // 2. Category filter
      const matchesCategory = selectedCategoryFilter === 'ALL' || tx.categoryId === selectedCategoryFilter;

      // 3. Month filter
      let matchesMonth = true;
      if (selectedMonthFilter !== 'ALL') {
        try {
          const monthKey = format(parseISO(tx.date), 'yyyy-MM');
          matchesMonth = monthKey === selectedMonthFilter;
        } catch {
          matchesMonth = false;
        }
      }

      // 4. Week filter (only if not ALL time)
      let matchesWeek = true;
      if (!isAllTime && selectedWeekFilter !== 'ALL') {
        const matchedWeek = availableWeeks.find((w) => w.id === selectedWeekFilter);
        if (matchedWeek) {
          try {
            const txDate = parseISO(tx.date);
            const start = parseISO(`${matchedWeek.startDate}T00:00:00`);
            const end = parseISO(`${matchedWeek.endDate}T23:59:59`);
            matchesWeek = isWithinInterval(txDate, { start, end });
          } catch {
            matchesWeek = false;
          }
        }
      }

      return matchesSearch && matchesCategory && matchesMonth && matchesWeek;
    });
  }, [
    transactions,
    searchQuery,
    selectedCategoryFilter,
    selectedMonthFilter,
    selectedWeekFilter,
    availableWeeks,
    categoryMap,
    isAllTime,
  ]);

  // Group by date (YYYY-MM-DD)
  const groupedTransactions = useMemo(() => {
    const groups: { [dateKey: string]: { dateStr: string; items: Transaction[]; subtotal: number } } = {};

    filteredTransactions.forEach((tx) => {
      try {
        const dateKey = format(parseISO(tx.date), 'yyyy-MM-dd');
        if (!groups[dateKey]) {
          groups[dateKey] = {
            dateStr: tx.date,
            items: [],
            subtotal: 0,
          };
        }
        groups[dateKey].items.push(tx);
        groups[dateKey].subtotal += tx.amount;
      } catch {}
    });

    return Object.keys(groups)
      .sort((a, b) => b.localeCompare(a))
      .map((key) => groups[key]);
  }, [filteredTransactions]);

  const totalFilteredExpense = useMemo(() => {
    return filteredTransactions.reduce((acc, tx) => acc + tx.amount, 0);
  }, [filteredTransactions]);

  const hasActiveFilters =
    searchQuery !== '' ||
    selectedCategoryFilter !== 'ALL' ||
    (!isAllTime && selectedWeekFilter !== 'ALL');

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategoryFilter('ALL');
    setSelectedWeekFilter('ALL');
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="glass-card p-3.5 rounded-3xl space-y-3">
        {/* Search Input (Fixed padding: pl-10 pr-9 to prevent icon overlap, with keyboard shortcut) */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-10 pr-12 py-2.5 text-xs sm:text-sm rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 dark:text-slate-100 placeholder-slate-400"
            />
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                ✕
              </button>
            ) : (
              <kbd className="hidden sm:inline-block absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-200/60 dark:bg-slate-700/60 rounded border border-slate-300/60 dark:border-slate-600/60 pointer-events-none">
                /
              </kbd>
            )}
          </div>
        </div>

        {/* Filter Badges & Period Selector */}
        <div className="flex items-center gap-2 pt-1 overflow-x-auto whitespace-nowrap scrollbar-none pb-1">
          <div className="flex items-center shrink-0 text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">
            <Filter className="w-3.5 h-3.5 mr-1 text-emerald-500" />
            <span>{t.filter}</span>
          </div>

          {/* Quick Period Switcher (Bulan Ini vs Seluruh Transaksi) */}
          {onSelectMonthFilter && (
            <div className="flex items-center shrink-0 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
              <button
                type="button"
                onClick={() => onSelectMonthFilter(format(new Date(), 'yyyy-MM'))}
                className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  !isAllTime
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {t.thisMonthBadge}
              </button>
              <button
                type="button"
                onClick={() => onSelectMonthFilter('ALL')}
                className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  isAllTime
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {t.allTransactions}
              </button>
            </div>
          )}

          {/* Category Dropdown */}
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="shrink-0 text-xs py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="ALL">{t.allCategories}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Weekly Filter Dropdown (Only available when filtering a specific month) */}
          {!isAllTime && (
            <div className="flex items-center shrink-0 space-x-1">
              <select
                value={selectedWeekFilter}
                onChange={(e) => setSelectedWeekFilter(e.target.value)}
                className="shrink-0 text-xs py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="ALL">{t.allWeeks}</option>
                {availableWeeks.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Clear Filters Shortcut */}
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="shrink-0 text-xs py-1.5 px-3 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center space-x-1 font-semibold transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{t.resetFilter}</span>
            </button>
          )}

          {/* Filter Result Counter */}
          <div className="ml-auto shrink-0 text-xs font-medium text-slate-500 dark:text-slate-400 pl-2">
            {filteredTransactions.length} {lang === 'en' ? 'txs' : 'transaksi'} (Total:{' '}
            <span className="font-bold text-rose-600 dark:text-rose-400">
              {formatIDR(totalFilteredExpense, false, lang)}
            </span>
            )
          </div>
        </div>
      </div>

      {/* Transaction List Grouped by Date */}
      {transactions.length === 0 ? (
        /* Empty Database State */
        <div className="glass-card rounded-3xl p-12 text-center space-y-1">
          <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center mx-auto mb-4 text-emerald-600 dark:text-emerald-400">
            <Tag className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">{t.noTransactionsYet}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-6">
            {t.noTransactionsDesc}
          </p>
          <button
            onClick={onOpenNewTransaction}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors active:scale-95 cursor-pointer"
          >
            {t.recordFirstTransaction}
          </button>
        </div>
      ) : filteredTransactions.length === 0 ? (
        /* Filtered 0 Results State */
        <div className="glass-card rounded-3xl p-10 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center mx-auto">
            <CalendarDays className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{t.noMatchFilter}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
              {t.noMatchFilterDesc}
            </p>
          </div>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
          >
            {t.resetAllFilters}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedTransactions.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-2">
              {/* Date Group Header with Subtotal */}
              <div className="flex items-center justify-between px-2 pt-1">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                  <CalendarIcon className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{formatRelativeDateIndo(group.dateStr, lang)}</span>
                </div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  − {formatIDR(group.subtotal, false, lang)}
                </div>
              </div>

              {/* Transaction Cards in Date Group */}
              <div className="glass-card rounded-2xl divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                {group.items.map((tx) => {
                  const cat = categoryMap.get(tx.categoryId) || {
                    name: 'Lain-lain',
                    icon: 'CircleEllipsis',
                    color: '#64748b',
                  };
                  const paymentBadge = getPaymentBadge(tx.paymentMethod);

                  return (
                    <button
                      key={tx.id}
                      onClick={() => onEditTransaction(tx)}
                      className="w-full text-left p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/90 dark:hover:bg-slate-800/50 transition-all group focus:outline-none focus:bg-slate-50 dark:focus:bg-slate-800/50 active:bg-slate-100 dark:active:bg-slate-800/70"
                    >
                      {/* Left: Icon & Info */}
                      <div className="flex items-center space-x-3 min-w-0 pr-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
                          style={{ backgroundColor: cat.color }}
                        >
                          <DynamicIcon name={cat.icon} className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                              {cat.name}
                            </span>
                            {paymentBadge && (
                              <span className={`hidden sm:inline-flex items-center space-x-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border ${paymentBadge.color}`}>
                                <paymentBadge.icon className="w-3 h-3" />
                                <span>{paymentBadge.label}</span>
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            <span>{formatTimeOnly(tx.date)}</span>
                            {tx.notes && (
                              <>
                                <span>•</span>
                                <span className="truncate text-slate-600 dark:text-slate-300 font-medium">{tx.notes}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Amount */}
                      <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
                        <div className="text-right">
                          <div className="text-sm sm:text-base font-extrabold text-rose-600 dark:text-rose-400 flex items-center justify-end">
                            <ArrowDownRight className="w-3.5 h-3.5 mr-0.5 inline" />
                            <span>{formatIDR(tx.amount, false, lang)}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

