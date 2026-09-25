import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Check,
  ArrowRightLeft,
  Smartphone,
  Banknote,
  Landmark,
  CreditCard,
  ReceiptText,
  CheckSquare,
  Square,
  Layers,
  Calendar,
} from 'lucide-react';
import type { Category, Transaction, PaymentMethodType } from '../../types';
import { DynamicIcon } from '../common/IconPicker';
import { formatIDR } from '../../utils/formatters';
import { format, parseISO } from 'date-fns';
import type { Language, Translations } from '../../constants/translations';

interface CategoryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
  categories: Category[];
  transactions: Transaction[];
  onBatchMoveTransactions: (transactionIds: string[], targetCategoryId: string) => Promise<void>;
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

export const CategoryDetailModal: React.FC<CategoryDetailModalProps> = ({
  isOpen,
  onClose,
  category,
  categories,
  transactions,
  onBatchMoveTransactions,
  lang = 'id',
  t,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isMovePickerOpen, setIsMovePickerOpen] = useState(false);
  const [targetCatId, setTargetCatId] = useState<string>('');
  const [isSubmittingMove, setIsSubmittingMove] = useState(false);
  const [periodFilter, setPeriodFilter] = useState<'ALL' | 'THIS_MONTH'>('ALL');
  const [moveError, setMoveError] = useState<string | null>(null);

  const currentMonthKey = useMemo(() => format(new Date(), 'yyyy-MM'), []);

  // All transactions belonging to this category across all time
  const categoryAllTransactions = useMemo(() => {
    if (!category) return [];
    return transactions
      .filter((tx) => tx.categoryId === category.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [category, transactions]);

  // Filtered by period: ALL or THIS_MONTH
  const periodFilteredTxs = useMemo(() => {
    if (periodFilter === 'THIS_MONTH') {
      return categoryAllTransactions.filter((tx) => {
        try {
          return format(parseISO(tx.date), 'yyyy-MM') === currentMonthKey;
        } catch {
          return false;
        }
      });
    }
    return categoryAllTransactions;
  }, [categoryAllTransactions, periodFilter, currentMonthKey]);

  // Filtered by search query
  const displayedTxs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return periodFilteredTxs;
    return periodFilteredTxs.filter((tx) => {
      const notes = (tx.notes || '').toLowerCase();
      const amountStr = tx.amount.toString();
      const payment = (tx.paymentMethod || '').toLowerCase();
      return notes.includes(q) || amountStr.includes(q) || payment.includes(q);
    });
  }, [periodFilteredTxs, searchQuery]);

  const displayedTotal = useMemo(() => {
    return displayedTxs.reduce((acc, tx) => acc + tx.amount, 0);
  }, [displayedTxs]);

  // Destination categories (excluding current category)
  const availableTargetCategories = useMemo(() => {
    if (!category) return [];
    return categories.filter((c) => c.id !== category.id);
  }, [categories, category]);

  if (!isOpen || !category) return null;

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === displayedTxs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(displayedTxs.map((tx) => tx.id)));
    }
  };

  const openMovePicker = (specificId?: string) => {
    setMoveError(null);
    if (specificId) {
      setSelectedIds(new Set([specificId]));
    }
    if (availableTargetCategories.length > 0) {
      if (!targetCatId || targetCatId === category.id) {
        setTargetCatId(availableTargetCategories[0].id);
      }
    }
    setIsMovePickerOpen(true);
  };

  const handleConfirmBatchMove = async () => {
    if (!targetCatId || selectedIds.size === 0) return;
    try {
      setIsSubmittingMove(true);
      setMoveError(null);
      await onBatchMoveTransactions(Array.from(selectedIds), targetCatId);
      setSelectedIds(new Set());
      setIsMovePickerOpen(false);
    } catch (err: any) {
      console.error('Error batch moving transactions:', err);
      setMoveError(err?.message || (lang === 'id' ? 'Gagal memindahkan transaksi' : 'Failed to move transactions'));
    } finally {
      setIsSubmittingMove(false);
    }
  };

  const isAllSelected = displayedTxs.length > 0 && selectedIds.size === displayedTxs.length;

  return (
    <>
      <div 
        className="fixed inset-0 z-50 flex sm:items-center items-end justify-center sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div 
          className="glass-modal rounded-t-3xl sm:rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[90vh] animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          
          {/* Header Kategori */}
          <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 shrink-0 space-y-3 sm:space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center space-x-3.5 min-w-0">
                <div
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md"
                  style={{ backgroundColor: category.color }}
                >
                  <DynamicIcon name={category.icon} className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 truncate">
                    {category.name}
                  </h3>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                    <span>
                      Total:{' '}
                      <strong className="text-slate-900 dark:text-slate-100 font-bold">
                        {formatIDR(displayedTotal, false, lang)}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>{displayedTxs.length} {lang === 'en' ? 'records' : 'transaksi'}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title={t.cancelBtn}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Period Switcher & Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
              {/* Segmented Period Switcher */}
              <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start">
                <button
                  type="button"
                  onClick={() => setPeriodFilter('ALL')}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    periodFilter === 'ALL'
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{lang === 'en' ? 'All Time' : 'Semua Waktu'} ({categoryAllTransactions.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodFilter('THIS_MONTH')}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    periodFilter === 'THIS_MONTH'
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{lang === 'en' ? 'This Month' : 'Bulan Ini'}</span>
                </button>
              </div>

              {/* Select All Button */}
              {displayedTxs.length > 0 && (
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors shrink-0 self-start sm:self-auto cursor-pointer"
                >
                  {isAllSelected ? (
                    <>
                      <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>{t.deselectAll}</span>
                    </>
                  ) : (
                    <>
                      <Square className="w-4 h-4 text-slate-400" />
                      <span>{t.selectAll}</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchCategoryTxPlaceholder}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* List Transaksi */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2">
            {displayedTxs.length === 0 ? (
              <div className="py-14 text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                  <ReceiptText className="w-6 h-6" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {searchQuery
                    ? t.noMatchFilter
                    : periodFilter === 'THIS_MONTH'
                    ? (lang === 'en' ? 'No transactions in this category for this month.' : 'Tidak ada transaksi di kategori ini pada bulan ini.')
                    : t.categoryNoTransactions}
                </p>
                {periodFilter === 'THIS_MONTH' && categoryAllTransactions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setPeriodFilter('ALL')}
                    className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer pt-1"
                  >
                    {lang === 'en' ? 'Show all time transactions' : 'Lihat semua transaksi sebelumnya'} ({categoryAllTransactions.length})
                  </button>
                )}
              </div>
            ) : (
              displayedTxs.map((tx) => {
                const isSelected = selectedIds.has(tx.id);
                const paymentBadge = getPaymentBadge(tx.paymentMethod);

                return (
                  <div
                    key={tx.id}
                    onClick={() => handleToggleSelect(tx.id)}
                    className={`p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 shadow-sm'
                        : 'border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    {/* Left: Checkbox + Date & Notes */}
                    <div className="flex items-center space-x-3 min-w-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSelect(tx.id);
                        }}
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 dark:border-slate-600 hover:border-slate-400'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {format(parseISO(tx.date), 'dd MMM yyyy, HH:mm')}
                          </span>
                          {paymentBadge && (
                            <span className={`inline-flex items-center space-x-1 text-[9px] font-semibold px-1.5 py-0.2 rounded-md border ${paymentBadge.color}`}>
                              <paymentBadge.icon className="w-2.5 h-2.5" />
                              <span>{paymentBadge.label}</span>
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate font-medium">
                          {tx.notes || (lang === 'id' ? 'Tanpa catatan' : 'No notes')}
                        </p>
                      </div>
                    </div>

                    {/* Right: Amount & Quick Move Button */}
                    <div className="shrink-0 flex items-center space-x-2">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                        {formatIDR(tx.amount, false, lang)}
                      </span>
                      {availableTargetCategories.length > 0 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openMovePicker(tx.id);
                          }}
                          title={t.moveCategory}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Floating / Sticky Batch Action Bar */}
          {selectedIds.size > 0 && (
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-emerald-500/10 dark:bg-emerald-950/60 flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-200">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                  {selectedIds.size}
                </div>
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                  {t.selectedCount}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedIds(new Set())}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                >
                  {t.cancelBtn}
                </button>
                <button
                  type="button"
                  onClick={() => openMovePicker()}
                  disabled={availableTargetCategories.length === 0}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{t.moveCategory}</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Modal Dialog Pemilih Kategori Tujuan - Z-INDEX 100 to stay firmly above CategoryDetailModal (z-50) */}
      {isMovePickerOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setIsMovePickerOpen(false)}
        >
          <div 
            className="glass-modal rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ArrowRightLeft className="w-4 h-4 text-emerald-500" />
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {t.selectDestinationCategory}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsMovePickerOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3 text-xs">
              {moveError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300 font-medium">
                  {moveError}
                </div>
              )}

              <p className="text-slate-500 dark:text-slate-400">
                {t.destinationCategoryLabel} (<strong>{selectedIds.size} {t.selectedCount}</strong>)
              </p>

              <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-1">
                {availableTargetCategories.map((c) => {
                  const isTarget = targetCatId === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setTargetCatId(c.id)}
                      className={`p-3 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                        isTarget
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 shadow-sm ring-1 ring-emerald-500'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
                          style={{ backgroundColor: c.color }}
                        >
                          <DynamicIcon name={c.icon} className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {c.name}
                        </span>
                      </div>
                      {isTarget && (
                        <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-2 bg-slate-50/50 dark:bg-slate-900/50">
              <button
                type="button"
                onClick={() => setIsMovePickerOpen(false)}
                disabled={isSubmittingMove}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {t.cancelBtn}
              </button>
              <button
                type="button"
                onClick={handleConfirmBatchMove}
                disabled={!targetCatId || isSubmittingMove || selectedIds.size === 0}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{isSubmittingMove ? (lang === 'id' ? 'Memindahkan...' : 'Moving...') : t.confirmMoveBtn}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
