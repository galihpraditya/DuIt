import React, { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, X, Check, Grid, Tag, DollarSign, Sparkles } from 'lucide-react';
import type { Category, Transaction } from '../../types';
import { DynamicIcon, IconPicker } from '../common/IconPicker';
import { ConfirmModal } from '../common/ConfirmModal';
import { formatIDR } from '../../utils/formatters';
import type { Language, Translations } from '../../constants/translations';

interface CategoryManagerProps {
  categories: Category[];
  transactions: Transaction[];
  onSaveCategory: (category: Omit<Category, 'id' | 'createdAt'>, id?: string) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
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
  lang = 'id',
  t,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCat, setDeletingCat] = useState<Category | null>(null);

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('Utensils');
  const [color, setColor] = useState('#f97316');
  const [budgetLimitStr, setBudgetLimitStr] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    <div className="space-y-5">
      {/* Header & Add Button */}
      <div className="glass-card p-5 rounded-3xl flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
            <Grid className="w-5 h-5 text-emerald-500" />
            <span>{t.categoryHeaderTitle}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t.categoryHeaderDesc}
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold shadow-md shadow-emerald-500/25 flex items-center space-x-1.5 transition-transform active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>{t.newCategoryBtn}</span>
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {categories.map((cat) => {
          const totalSpent = categorySpendingMap.get(cat.id) || 0;
          return (
            <div
              key={cat.id}
              className="glass-card rounded-3xl p-5 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3 min-w-0">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm"
                    style={{ backgroundColor: cat.color }}
                  >
                    <DynamicIcon name={cat.icon} className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                      {cat.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Total:{' '}
                      <span className="font-semibold text-rose-600 dark:text-rose-400">
                        {formatIDR(totalSpent, false, lang)}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => openEditModal(cat)}
                    className="p-2 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title={t.editCategoryTitle}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeletingCat(cat)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title={t.deleteCategoryTitle}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {cat.budgetLimit && (
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                  <span>{t.budgetLimitPerMonth}</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatIDR(cat.budgetLimit, false, lang)} / {lang === 'en' ? 'mo' : 'bln'}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="glass-modal rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                {editingCategory ? t.editCategoryTitle : t.newCategoryModalTitle}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  autoFocus
                />
              </div>

              {/* Color Picker */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{t.pickColorLabel}</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-xl transition-transform ${
                        color === c ? 'scale-110 ring-2 ring-offset-2 ring-emerald-500' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-7 h-7 rounded-xl cursor-pointer border-0 bg-transparent p-0"
                    title={t.pickColorLabel}
                  />
                </div>
              </div>

              {/* Icon Picker */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                  {t.pickIconLabel}
                </label>
                <IconPicker selectedIcon={icon} onSelectIcon={setIcon} />
              </div>

              {/* Optional Budget Limit */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center space-x-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{t.monthlyLimitOptionalLabel}</span>
                </label>
                <input
                  type="number"
                  value={budgetLimitStr}
                  onChange={(e) => setBudgetLimitStr(e.target.value)}
                  placeholder="Contoh: 1500000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm shadow-md shadow-emerald-500/25 flex items-center justify-center space-x-2 transition-transform active:scale-[0.99] disabled:opacity-50"
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
    </div>
  );
};
