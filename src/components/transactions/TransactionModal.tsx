import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  ChevronDown,
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

const toLocalInputValue = (d: Date) => format(d, "yyyy-MM-dd'T'HH:mm");

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
  const [dateStr, setDateStr] = useState(toLocalInputValue(new Date()));
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('Tunai');
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [error, setError] = useState('');

  const paymentMethodsList: { id: PaymentMethodType; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'Tunai', label: t.paymentCash, icon: Banknote },
    { id: 'E-Wallet', label: t.paymentEWallet, icon: Smartphone },
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
        setDateStr(toLocalInputValue(new Date(initialData.date)));
      } catch {
        setDateStr(toLocalInputValue(new Date()));
      }
      setNotes(initialData.notes || '');
      setPaymentMethod(initialData.paymentMethod || 'Tunai');
      setIsDetailOpen(false);
    } else {
      setAmountStr('');
      setSelectedCategoryId(categories[0]?.id || '');
      setDateStr(toLocalInputValue(new Date()));
      setNotes('');
      setPaymentMethod('Tunai');
      setIsDetailOpen(false);
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

  // Chip nominal bersifat aditif: menambahkan ke jumlah yang sudah diketik
  const handleAddIncrement = (increment: number) => {
    const current = parseInt(amountStr.replace(/\./g, ''), 10) || 0;
    const next = current + increment;
    setAmountStr(next.toLocaleString('id-ID'));
  };

  const setQuickDate = (dayOffset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    setDateStr(toLocalInputValue(d));
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

      let validIsoDate = new Date().toISOString();
      if (dateStr) {
        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) {
          validIsoDate = parsed.toISOString();
        }
      }

      await onSave(
        {
          amount: Math.round(finalAmount),
          categoryId: selectedCategoryId,
          date: validIsoDate,
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

  // Shortcut nominal aditif: 1k - 100k
  const quickAmounts = [    { label: '+1k', value: 1000 },
    { label: '+2k', value: 2000 },
    { label: '+5k', value: 5000 },
    { label: '+10k', value: 10000 },
    { label: '+20k', value: 20000 },
    { label: '+50k', value: 50000 },
    { label: '+100k', value: 100000 },
  ];

  const isToday = dateStr === toLocalInputValue(new Date());
  const isYesterday = (() => {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    return dateStr === toLocalInputValue(y);
  })();

  const detailSummary = [
    format(new Date(dateStr), 'dd MMM HH:mm'),
    paymentMethod,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <motion.div
              className="glass-modal rounded-3xl w-full max-w-lg shadow-glass-lg overflow-hidden flex flex-col max-h-[92vh]"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ type: 'spring', damping: 26, stiffness: 340 }}
            >
          {/* Header Ringkas */}
          <div className="px-5 py-3.5 border-b border-slate-900/10 dark:border-white/10 flex items-center justify-between shrink-0">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {initialData ? t.modalEditTitle : t.modalNewTitle}
            </h2>
            <button
              onClick={onClose}
              className="p-2 -mr-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Scrollable */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {error && (
              <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300 rounded-lg">
                {error}
              </div>
            )}

            {/* Nominal Hero */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {t.amountLabel}
                </label>
                {amountStr && (
                  <button
                    type="button"
                    onClick={handleResetAmount}
                    className="text-[11px] font-medium text-slate-400 hover:text-rose-500 flex items-center space-x-1 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{t.resetBtn}</span>
                  </button>
                )}
              </div>

              <div className="flex items-baseline space-x-2">
                <span className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">Rp</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={amountStr}
                  onChange={handleAmountChange}
                  placeholder="0"
                  autoFocus
                  className="w-full bg-transparent text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-slate-700 focus:outline-none tracking-tight"
                />
              </div>

              {/* Shortcut Nominal Aditif */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-1 pb-0.5">
                {quickAmounts.map((q) => (
                  <button
                    key={q.value}
                    type="button"
                    onClick={() => handleAddIncrement(q.value)}
                    className="shrink-0 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-700 dark:hover:text-emerald-400 active:scale-95 transition-all cursor-pointer"
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800" />

            {/* Kategori */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                  <Tag className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{t.categoryLabel}</span>
                </label>
                {onOpenCategoryManager && (
                  <button
                    type="button"
                    onClick={onOpenCategoryManager}
                    className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline flex items-center space-x-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{t.manageCategories}</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-0.5">
                {categories.map((cat) => {
                  const isSelected = selectedCategoryId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategoryId(cat.id)}
                      className={`flex items-center space-x-2.5 p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:border-emerald-500'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0"
                        style={{ backgroundColor: cat.color }}
                      >
                        <DynamicIcon name={cat.icon} className="w-4 h-4" />
                      </div>
                      <span
                        className={`text-xs truncate leading-tight ${
                          isSelected
                            ? 'font-bold text-emerald-900 dark:text-emerald-200'
                            : 'font-medium text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Catatan / Keterangan (Di luar detail karena hampir selalu digunakan) */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center space-x-1">
                <AlignLeft className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t.notesLabel}</span>
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t.notesPlaceholder}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>

            {/* Bagian Detail (Lipat) */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <button
                type="button"
                onClick={() => setIsDetailOpen(!isDetailOpen)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
              >
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                  <AlignLeft className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{t.detailSectionLabel}</span>
                </span>
                <span className="flex items-center space-x-2 min-w-0">
                  {!isDetailOpen && (
                    <span className="text-[11px] text-slate-400 truncate hidden sm:inline">{detailSummary}</span>
                  )}
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${isDetailOpen ? 'rotate-180' : ''}`}
                  />
                </span>
              </button>

              {isDetailOpen && (
                <div className="px-3.5 pb-3.5 space-y-3.5 border-t border-slate-100 dark:border-slate-800 pt-3.5">
                  {/* Tanggal & Waktu */}
                  <div>
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{t.dateTimeLabel}</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={dateStr}
                      onChange={(e) => setDateStr(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:border-emerald-500 [color-scheme:light] dark:[color-scheme:dark] transition-colors"
                    />
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <button
                        type="button"
                        onClick={() => setQuickDate(0)}
                        disabled={isToday}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                          isToday
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {t.todayQuickLabel}
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickDate(-1)}
                        disabled={isYesterday}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                          isYesterday
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {t.yesterdayQuickLabel}
                      </button>
                    </div>
                  </div>

                  {/* Metode Pembayaran */}
                  <div>
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center space-x-1">
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>{t.paymentMethodLabel}</span>
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {paymentMethodsList.map((method) => {
                        const isSelected = paymentMethod === method.id;
                        const IconComponent = method.icon;
                        return (
                          <button
                            key={method.id}
                            type="button"
                            onClick={() => setPaymentMethod(method.id)}
                            className={`py-2 px-1.5 rounded-lg text-[11px] font-semibold border transition-all flex items-center justify-center space-x-1 ${
                              isSelected
                                ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 dark:border-emerald-500'
                                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                          >
                            <IconComponent className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{method.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                </div>
              )}
            </div>
          </form>

          {/* Footer Sticky: Aksi Utama */}
          <div className="px-5 py-3.5 border-t border-slate-900/10 dark:border-white/10 shrink-0 pb-safe">
            <button
              type="button"
              onClick={(e) => handleSubmit(e)}
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] text-white font-bold text-sm flex items-center justify-center space-x-2 transition-colors active:scale-[0.99] disabled:opacity-50"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{isSubmitting ? t.savingBtn : initialData ? t.updateBtn : t.saveBtn}</span>
            </button>
            {initialData && onDelete && (
              <button
                type="button"
                onClick={() => setIsConfirmDeleteOpen(true)}
                className="w-full mt-2 py-2.5 rounded-xl text-rose-600 dark:text-rose-400 font-semibold text-xs border border-transparent hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center justify-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t.deleteConfirmBtn}</span>
              </button>
            )}
          </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
