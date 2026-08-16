import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  CreditCard,
  AlignLeft,
  Check,
  Plus,
  Tag,
  Banknote,
  Smartphone,
  Landmark,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import type { Category, Transaction, PaymentMethodType } from '../../types';
import { DynamicIcon } from '../common/IconPicker';
import { ConfirmModal } from '../common/ConfirmModal';
import { format } from 'date-fns';
import type { Language, Translations } from '../../constants/translations';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id' | 'createdAt'>, id?: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  categories: Category[];
  initialData?: Transaction | null;
  onOpenCategoryManager?: () => void;
  lang?: Language;
  t: Translations;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  categories,
  initialData,
  onOpenCategoryManager,
  onDelete,
  t,
}) => {
  const [amountStr, setAmountStr] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [dateStr, setDateStr] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('E-Wallet');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [error, setError] = useState('');

  const paymentMethodsList: { id: PaymentMethodType; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'E-Wallet', label: t.paymentEWallet, icon: Smartphone },
    { id: 'Tunai', label: t.paymentCash, icon: Banknote },
    { id: 'Transfer Bank', label: t.paymentBankTransfer, icon: Landmark },
    { id: 'Kartu Debit', label: t.paymentDebit, icon: CreditCard },
    { id: 'Kartu Kredit', label: t.paymentCredit, icon: CreditCard },
    { id: 'Lainnya', label: t.paymentOther, icon: Tag },
  ];

  useEffect(() => {
    if (initialData) {
      setAmountStr(initialData.amount ? initialData.amount.toLocaleString('id-ID') : '');
      setSelectedCategoryId(initialData.categoryId);
      try {
        setDateStr(format(new Date(initialData.date), "yyyy-MM-dd'T'HH:mm"));
      } catch {
        setDateStr(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
      }
      setNotes(initialData.notes || '');
      setPaymentMethod(initialData.paymentMethod || 'E-Wallet');
    } else {
      setAmountStr('');
      setSelectedCategoryId(categories[0]?.id || '');
      setDateStr(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
      setNotes('');
      setPaymentMethod('E-Wallet');
    }
    setError('');
    setIsConfirmDeleteOpen(false);
  }, [initialData, categories, isOpen]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    if (!rawValue) {
      setAmountStr('');
      return;
    }
    const formatted = parseInt(rawValue, 10).toLocaleString('id-ID');
    setAmountStr(formatted);
  };

  const handleResetAmount = () => {
    setAmountStr('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const finalAmount = parseInt(amountStr.replace(/\./g, ''), 10);

    if (isNaN(finalAmount) || finalAmount <= 0) {
      setError(t.errorValidAmount);
      return;
    }

    if (!selectedCategoryId) {
      setError(t.errorSelectCategory);
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave(
        {
          amount: Math.round(finalAmount),
          categoryId: selectedCategoryId,
          date: new Date(dateStr).toISOString(),
          notes: notes.trim(),
          paymentMethod,
        },
        initialData?.id
      );
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl w-full max-w-lg shadow-2xl border border-white/60 dark:border-white/10 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                {initialData ? t.modalEditTitle : t.modalNewTitle}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {initialData ? t.modalEditDesc : t.modalNewDesc}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
            {error && (
              <div className="p-3 text-xs bg-rose-50/90 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300 rounded-2xl">
                {error}
              </div>
            )}

            {/* Amount Display & Input */}
            <div className="bg-slate-100/90 dark:bg-slate-950/80 p-5 rounded-3xl text-slate-900 dark:text-white shadow-inner border border-slate-200/80 dark:border-slate-800/80 relative overflow-hidden transition-colors">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-slate-500 dark:text-slate-400 font-semibold flex items-center space-x-1">
                  <span>{t.amountLabel}</span>
                </label>
                {amountStr && (
                  <button
                    type="button"
                    onClick={handleResetAmount}
                    className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 flex items-center space-x-1 transition-colors font-semibold"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{t.resetBtn}</span>
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">Rp</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={amountStr}
                  onChange={handleAmountChange}
                  placeholder="0"
                  autoFocus
                  className="w-full bg-transparent text-3xl sm:text-4xl font-black text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none tracking-tight"
                />
              </div>
            </div>

            {/* Category Selector (Fixed 3-column grid to prevent text truncation) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                  <Tag className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{t.categoryLabel}</span>
                </label>
                {onOpenCategoryManager && (
                  <button
                    type="button"
                    onClick={onOpenCategoryManager}
                    className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center space-x-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{t.manageCategories}</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-52 overflow-y-auto p-1">
                {categories.map((cat) => {
                  const isSelected = selectedCategoryId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategoryId(cat.id)}
                      className={`flex items-center space-x-2.5 p-2.5 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-500/15 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/30 font-bold shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                        style={{ backgroundColor: cat.color }}
                      >
                        <DynamicIcon name={cat.icon} className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold truncate leading-tight">{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date & Time (Explicit Dark/Light Mode Styling & Color Scheme) */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                <span>{t.dateTimeLabel}</span>
              </label>
              <input
                type="datetime-local"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 [color-scheme:light] dark:[color-scheme:dark] transition-colors"
              />
            </div>

            {/* Payment Method with Icons */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center space-x-1">
                <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
                <span>{t.paymentMethodLabel}</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {paymentMethodsList.map((method) => {
                  const isSelected = paymentMethod === method.id;
                  const IconComponent = method.icon;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id)}
                      className={`py-2.5 px-2 rounded-2xl text-xs font-semibold border transition-all flex items-center justify-center space-x-1.5 ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <IconComponent className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{method.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center space-x-1">
                <AlignLeft className="w-3.5 h-3.5 text-emerald-500" />
                <span>{t.notesLabel}</span>
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t.notesPlaceholder}
                className="w-full px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* Submit Action */}
            <div className="pt-2 flex flex-col space-y-2.5">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2 transition-all active:scale-[0.99] disabled:opacity-50"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{isSubmitting ? t.savingBtn : initialData ? t.updateBtn : t.saveBtn}</span>
              </button>
              {initialData && onDelete && (
                <button
                  type="button"
                  onClick={() => setIsConfirmDeleteOpen(true)}
                  className="w-full py-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-sm border border-rose-500/20 transition-all active:scale-[0.99] flex items-center justify-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{t.deleteConfirmBtn}</span>
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Modern Platform-Integrated Confirmation Modal */}
      <ConfirmModal
        isOpen={isConfirmDeleteOpen}
        title={t.deleteTransactionTitle}
        message={t.deleteTransactionMsg}
        confirmText={t.deleteConfirmBtn}
        cancelText={t.cancelBtn}
        isDanger={true}
        onConfirm={async () => {
          if (initialData && onDelete) {
            setIsConfirmDeleteOpen(false);
            await onDelete(initialData.id);
            onClose();
          }
        }}
        onCancel={() => setIsConfirmDeleteOpen(false)}
      />
    </>
  );
};
