import React, { useState, useMemo } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
  Grid,
  Tag,
  DollarSign,
  Sparkles,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import type { Category, CategorySortMode, Transaction } from '../../types';
import { DynamicIcon, IconPicker } from '../common/IconPicker';
import { ConfirmModal } from '../common/ConfirmModal';
import { CategoryDetailModal } from './CategoryDetailModal';
import { formatIDR } from '../../utils/formatters';
import type { Language, Translations } from '../../constants/translations';
import {
  sortCategories,
  getStoredCategorySortMode,
  setStoredCategorySortMode,
  reassignCategoryOrders,
  moveCategoryOrder,
} from '../../utils/categorySorter';
import { db } from '../../db/database';

interface CategoryManagerProps {
  categories: Category[];
  transactions: Transaction[];
  onSaveCategory: (category: Omit<Category, 'id' | 'createdAt'>, id?: string) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
  onBatchMoveTransactions?: (transactionIds: string[], targetCategoryId: string) => Promise<void>;
  sortMode?: CategorySortMode;
  onChangeSortMode?: (mode: CategorySortMode) => void;
  onReorderCategories?: (reorderedCategories: Category[]) => Promise<void>;
  hideNominals?: boolean;
  lang?: Language;
  t: Translations;
}

const PRESET_COLORS = [
  '#f97316',
  '#0ea5e9',
  '#ec4899',
  '#eab308',
  '#a855f7',
  '#ef4444',
  '#14b8a6',
  '#64748b',
  '#10b981',
  '#6366f1',
  '#84cc16',
  '#d946ef',
  '#f43f5e',
  '#3b82f6',
  '#8b5cf6',
];

export const CategoryManager: React.FC<CategoryManagerProps> = ({
  categories,
  transactions,
  onSaveCategory,
  onDeleteCategory,
  onBatchMoveTransactions,
  sortMode,
  onChangeSortMode,
  onReorderCategories,
  hideNominals = false,
  lang = 'id',
  t,
}) => {
  const [internalSortMode, setInternalSortMode] = useState<CategorySortMode>(() => getStoredCategorySortMode());
  const activeSortMode = sortMode ?? internalSortMode;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCat, setDeletingCat] = useState<Category | null>(null);
  const [selectedCategoryForDetail, setSelectedCategoryForDetail] = useState<Category | null>(null);

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('Utensils');
  const [color, setColor] = useState('#f97316');
  const [budgetLimitStr, setBudgetLimitStr] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReordering, setIsReordering] = useState(false);

  const sortedCategories = useMemo(() => {
    return sortCategories(categories, activeSortMode, transactions);
  }, [categories, activeSortMode, transactions]);

  const handleSortChange = async (newMode: CategorySortMode) => {
    if (newMode === 'manual') {
      const hasUnsetOrders = categories.some((c) => typeof c.order !== 'number');
      if (hasUnsetOrders) {
        const reassigned = reassignCategoryOrders(sortedCategories);
        if (onReorderCategories) {
          await onReorderCategories(reassigned);
        } else {
          await db.categories.bulkPut(reassigned);
        }
      }
    }
    setInternalSortMode(newMode);
    setStoredCategorySortMode(newMode);
    onChangeSortMode?.(newMode);
  };

  const handleMove = async (catId: string, direction: 'up' | 'down') => {
    try {
      setIsReordering(true);
      const reordered = moveCategoryOrder(sortedCategories, catId, direction);
      if (onReorderCategories) {
        await onReorderCategories(reordered);
      } else {
        await db.categories.bulkPut(reordered);
      }
    } catch (err) {
      console.error('Error reordering category:', err);
    } finally {
      setIsReordering(false);
    }
  };

  const openAddModal = () => {
    setEditingCategory(null);
    setName('');
    setIcon('Utensils');
    setColor('#f97316');
    setBudgetLimitStr('');
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setIcon(cat.icon);
    setColor(cat.color);
    setBudgetLimitStr(cat.budgetLimit ? cat.budgetLimit.toString() : '');
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(t.errorCategoryName);
      return;
    }

    try {
      setIsSubmitting(true);
      const cleanStr = budgetLimitStr.replace(/[^0-9]/g, '');
      const budgetLimit = cleanStr ? parseInt(cleanStr, 10) : undefined;
      await onSaveCategory(
        {
          name: name.trim(),
          icon,
          color,
          budgetLimit: isNaN(budgetLimit as number) ? undefined : budgetLimit,
          order: editingCategory ? editingCategory.order : categories.length,
        },
        editingCategory?.id
      );
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categorySpendingMap = useMemo(() => {
    const map = new Map<string, number>();
    transactions.forEach((tx) => {
      map.set(tx.categoryId, (map.get(tx.categoryId) || 0) + tx.amount);
    });
    return map;
  }, [transactions]);

  return (
    <div className="space-y-4">
      {/* Unified Compact Header Card - Mobile Ergonomic */}
      <div className="glass-card p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        {/* Left: Icon, Title & Category Count Badge */}
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-10 h-10 rounded-xl sm:rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Grid className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 truncate">
                {t.categoryHeaderTitle}
              </h2>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/90 px-2 py-0.5 rounded-full border border-slate-200/60 dark:border-slate-700/60 shrink-0">
                {categories.length}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 hidden sm:block truncate">
              {t.categoryHeaderDesc}
            </p>
          </div>
        </div>

        {/* Right Controls: Sort Selector & Add Button */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Integrated Sort Selector */}
          <div className="relative flex-1 sm:flex-initial min-w-0">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500">
              <ArrowUpDown className="w-3.5 h-3.5" />
            </div>
            <select
              id="category-sort-select"
              value={activeSortMode}
              onChange={(e) => handleSortChange(e.target.value as CategorySortMode)}
              className="w-full sm:w-auto text-xs font-semibold pl-8 pr-7 py-2.5 sm:py-2 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer transition-all appearance-none truncate"
              title={t.categorySortBy}
            >
              <option value="most_used">{t.sortModeMostUsed}</option>
              <option value="highest_amount">{t.sortModeHighestAmount}</option>
              <option value="name_asc">{t.sortModeNameAsc}</option>
              <option value="name_desc">{t.sortModeNameDesc}</option>
              <option value="newest">{t.sortModeNewest}</option>
              <option value="manual">{t.sortModeManual}</option>
            </select>
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500">
              <ChevronDown className="w-3 h-3 stroke-[2.5]" />
            </div>
          </div>

          {/* Add Category Button */}
          <button
            type="button"
            onClick={openAddModal}
            className="px-3.5 sm:px-4 py-2.5 sm:py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center space-x-1.5 transition-all active:scale-95 cursor-pointer shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden xs:inline">{t.newCategoryBtn}</span>
            <span className="xs:hidden">{lang === 'en' ? 'Add' : 'Tambah'}</span>
          </button>
        </div>
      </div>

      {/* Manual Reordering Hint (Only when in manual mode) */}
      {activeSortMode === 'manual' && (
        <div className="px-3.5 sm:px-4 py-2 rounded-2xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 animate-in fade-in duration-200">
          <span className="flex items-center space-x-2 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span>
              {lang === 'en'
                ? 'Custom order mode active. Use the arrows (↑ ↓) on each card to reorder.'
                : 'Mode urutan kustom aktif. Gunakan tombol panah (↑ ↓) pada kartu untuk mengubah susunan.'}
            </span>
          </span>
        </div>
      )}

      {/* Categories Grid - Mobile Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {sortedCategories.map((cat, index) => {
          const totalSpent = categorySpendingMap.get(cat.id) || 0;
          const isFirst = index === 0;
          const isLast = index === sortedCategories.length - 1;

          return (
            <div
              key={cat.id}
              onClick={() => setSelectedCategoryForDetail(cat)}
              className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-5 hover:border-emerald-500/40 dark:hover:border-emerald-500/40 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group relative"
              title={t.categoryDetails}
            >
              <div>
                {/* Header Row: Icon + Title + Action Buttons */}
                <div className="flex items-center justify-between gap-2.5">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div
                      className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm group-hover:scale-105 transition-transform"
                      style={{ backgroundColor: cat.color }}
                    >
                      <DynamicIcon name={cat.icon} className="w-5 h-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {cat.name}
                      </h4>
                    </div>
                  </div>

                  {/* Isolated Action Buttons (Does not trigger card onClick) */}
                  <div className="flex items-center space-x-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {activeSortMode === 'manual' && (
                      <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5 mr-0.5 border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
                        <button
                          type="button"
                          disabled={isFirst || isReordering}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMove(cat.id, 'up');
                          }}
                          className="p-1.5 sm:p-1 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-white dark:hover:bg-slate-700 transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500 cursor-pointer disabled:cursor-not-allowed"
                          title={t.moveUp}
                          aria-label={t.moveUp}
                        >
                          <ChevronUp className="w-3.5 h-3.5 stroke-[2.5]" />
                        </button>
                        <button
                          type="button"
                          disabled={isLast || isReordering}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMove(cat.id, 'down');
                          }}
                          className="p-1.5 sm:p-1 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-white dark:hover:bg-slate-700 transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500 cursor-pointer disabled:cursor-not-allowed"
                          title={t.moveDown}
                          aria-label={t.moveDown}
                        >
                          <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
                        </button>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(cat);
                      }}
                      className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer active:scale-95"
                      title={t.editCategoryTitle}
                      aria-label={t.editCategoryTitle}
                    >
                      <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingCat(cat);
                      }}
                      className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer active:scale-95"
                      title={t.deleteCategoryTitle}
                      aria-label={t.deleteCategoryTitle}
                    >
                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Row: Spending Metric & Budget Limit */}
              <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs gap-2">
                <div className="min-w-0">
                  <span className="text-slate-400 text-[11px] block">{lang === 'en' ? 'Total spent' : 'Total terpakai'}</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400 text-xs sm:text-sm">
                    {formatIDR(totalSpent, false, lang, hideNominals)}
                  </span>
                </div>

                {cat.budgetLimit ? (
                  <div className="text-right min-w-0">
                    <span className="text-slate-400 text-[11px] block">{t.budgetLimitPerMonth}</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm">
                      {formatIDR(cat.budgetLimit, false, lang, hideNominals)}
                    </span>
                  </div>
                ) : (
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 italic">
                      {lang === 'en' ? 'No limit' : 'Tanpa limit'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Category Modal (Mobile Sheet + Desktop Dialog) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex sm:items-center items-end justify-center sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="glass-modal rounded-t-3xl sm:rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[90vh] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                {editingCategory ? t.editCategoryTitle : t.newCategoryModalTitle}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                title={t.cancelBtn}
                aria-label={t.cancelBtn}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-5 sm:p-6 overflow-y-auto overscroll-contain flex-1 space-y-4">
                {error && (
                  <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300 rounded-xl">
                    {error}
                  </div>
                )}

                {/* Preview Badge */}
                <div className="flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md transition-all"
                      style={{ backgroundColor: color }}
                    >
                      <DynamicIcon name={icon} className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        {name || 'Category Name'}
                      </span>
                      <p className="text-[11px] text-slate-400">{t.previewDisplay}</p>
                    </div>
                  </div>
                </div>

                {/* Category Name */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center space-x-1">
                    <Tag className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{t.categoryNameLabel}</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t.categoryNamePlaceholder}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                    autoFocus
                  />
                </div>

                {/* Color Picker with Touch-Friendly Swatches */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{t.pickColorLabel}</span>
                  </label>
                  <div className="flex flex-wrap gap-2.5 items-center">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={`w-8 h-8 sm:w-7 sm:h-7 rounded-xl transition-all cursor-pointer active:scale-95 ${
                          color === c
                            ? 'scale-110 ring-2 ring-offset-2 ring-emerald-500 shadow-md'
                            : 'hover:scale-105 opacity-85 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c }}
                        aria-label={`Color ${c}`}
                      />
                    ))}
                    <label
                      className="w-8 h-8 sm:w-7 sm:h-7 rounded-xl cursor-pointer border border-slate-300 dark:border-slate-600 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-500 overflow-hidden relative active:scale-95"
                      title={t.pickColorLabel}
                    >
                      <span>+</span>
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
                      />
                    </label>
                  </div>
                </div>

                {/* Icon Picker */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                    {t.pickIconLabel}
                  </label>
                  <IconPicker selectedIcon={icon} onSelectIcon={setIcon} />
                </div>

                {/* Optional Budget Limit */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center space-x-1">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{t.monthlyLimitOptionalLabel}</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={budgetLimitStr}
                      onChange={(e) => {
                        const clean = e.target.value.replace(/[^0-9]/g, '');
                        setBudgetLimitStr(clean);
                      }}
                      placeholder="Contoh: 1500000"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Sticky Footer Action Buttons */}
              <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs sm:text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer active:scale-95 text-center"
                >
                  {t.cancelBtn}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 transition-colors active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm shadow-emerald-600/30 text-center"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{isSubmitting ? '...' : t.saveCategoryBtn}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modern Confirmation Modal for Category Deletion */}
      <ConfirmModal
        isOpen={Boolean(deletingCat)}
        title={t.deleteCategoryTitle}
        message={t.deleteCategoryMsg}
        confirmText={t.deleteCategoryConfirmBtn}
        cancelText={t.cancelBtn}
        isDanger={true}
        onConfirm={() => {
          if (deletingCat) {
            onDeleteCategory(deletingCat.id);
            setDeletingCat(null);
          }
        }}
        onCancel={() => setDeletingCat(null)}
      />

      {/* Category Detail Modal */}
      <CategoryDetailModal
        isOpen={!!selectedCategoryForDetail}
        onClose={() => setSelectedCategoryForDetail(null)}
        category={selectedCategoryForDetail}
        categories={sortedCategories}
        transactions={transactions}
        onBatchMoveTransactions={async (txIds, targetCatId) => {
          if (onBatchMoveTransactions) {
            await onBatchMoveTransactions(txIds, targetCatId);
          }
        }}
        lang={lang}
        t={t}
      />
    </div>
  );
};
