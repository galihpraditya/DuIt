import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, initializeDefaultData, DEFAULT_CATEGORIES } from './db/database';
import type { Category, Transaction } from './types';
import { Navbar } from './components/layout/Navbar';
import { BottomNav } from './components/layout/BottomNav';
import { TransactionList } from './components/transactions/TransactionList';
import { TransactionModal } from './components/transactions/TransactionModal';
import { QuickPresets, type QuickPresetItem } from './components/transactions/QuickPresets';
import { ExcelModal } from './components/excel/ExcelModal';
import { SettingsModal } from './components/settings/SettingsModal';
import { AuthModal } from './components/auth/AuthModal';
import { ToastContainer, type ToastMessage } from './components/common/Toast';
import { formatIDR, generateId } from './utils/formatters';
import { translations, type Language } from './constants/translations';
import { authService, type UserProfile } from './services/authService';
import { Loader2, Calendar, ChevronLeft, ChevronRight, Banknote, Tag } from 'lucide-react';
import {
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  parseISO,
  format,
  addMonths,
  subMonths
} from 'date-fns';
import { id as idLocale, enUS as enLocale } from 'date-fns/locale';

// Code-split heavy views (Recharts & secondary tabs) for ultra-fast initial page load
const AnalyticsView = lazy(() =>
  import('./components/analytics/AnalyticsView').then((m) => ({ default: m.AnalyticsView }))
);
const BudgetManager = lazy(() =>
  import('./components/budget/BudgetManager').then((m) => ({ default: m.BudgetManager }))
);
const CategoryManager = lazy(() =>
  import('./components/categories/CategoryManager').then((m) => ({ default: m.CategoryManager }))
);

const ViewLoaderFallback = () => (
  <div className="flex flex-col items-center justify-center py-20 space-y-3">
    <Loader2 className="w-7 h-7 text-emerald-500 animate-spin" />
    <span className="text-xs text-slate-400 font-medium">Memuat tampilan...</span>
  </div>
);

export function App() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return (
      localStorage.getItem('theme') === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
    );
  });

  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return saved === 'en' ? 'en' : 'id';
  });

  const [activeTab, setActiveTab] = useState<string>('transactions');
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const t = useMemo(() => translations[language], [language]);

  // Toast Helper
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const newToast: ToastMessage = {
      id: generateId('toast'),
      type,
      message,
    };
    setToasts((prev) => [...prev, newToast]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Initialize Default Data on first launch
  useEffect(() => {
    initializeDefaultData();
    authService.getCurrentUser().then(user => {
      setCurrentUser(user);
    });
  }, []);

  // Sync Dark Mode with DOM
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Sync Language with LocalStorage
  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    localStorage.setItem('language', newLang);
    showToast(newLang === 'id' ? 'Bahasa diubah ke Bahasa Indonesia' : 'Language changed to English', 'info');
  };

  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>(() => format(new Date(), 'yyyy-MM'));

  // Live Queries from IndexedDB (Dexie reactively observes DB changes automatically)
  const categoriesRaw = useLiveQuery(() => db.categories.toArray());
  const categories = useMemo(() => categoriesRaw || [], [categoriesRaw]);

  const transactionsRaw = useLiveQuery(() => db.transactions.orderBy('date').reverse().toArray());
  const transactions = useMemo(() => transactionsRaw || [], [transactionsRaw]);

  // Current Month Data Calculation
  const { currentMonthTotal, currentMonthDailyAverage, currentMonthTxCount, currentDate } = useMemo(() => {
    const [year, month] = selectedMonthFilter.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    const start = startOfMonth(date);
    const end = endOfMonth(date);

    const monthTxs = transactions.filter((tx) => {
      try {
        const d = parseISO(tx.date);
        return isWithinInterval(d, { start, end });
      } catch {
        return false;
      }
    });

    const total = monthTxs.reduce((acc, tx) => acc + tx.amount, 0);

    const now = new Date();
    let days = 1;
    if (date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()) {
      days = Math.max(1, now.getDate());
    } else {
      days = Math.max(1, end.getDate());
    }
    const dailyAverage = Math.round(total / days);

    return { 
      currentMonthTotal: total, 
      currentMonthDailyAverage: dailyAverage, 
      currentMonthTxCount: monthTxs.length,
      currentDate: date 
    };
  }, [transactions, selectedMonthFilter]);

  const handlePrevMonth = () => {
    const newDate = subMonths(currentDate, 1);
    setSelectedMonthFilter(format(newDate, 'yyyy-MM'));
  };

  const handleNextMonth = () => {
    const newDate = addMonths(currentDate, 1);
    setSelectedMonthFilter(format(newDate, 'yyyy-MM'));
  };

  // CRUD Handlers for Transactions
  const handleSaveTransaction = async (data: Omit<Transaction, 'id' | 'createdAt'>, id?: string) => {
    if (id) {
      await db.transactions.update(id, {
        ...data,
      });
      showToast(language === 'id' ? 'Catatan pengeluaran berhasil diperbarui!' : 'Expense updated successfully!', 'success');
    } else {
      const newTransaction: Transaction = {
        id: generateId('tx'),
        ...data,
        createdAt: new Date().toISOString(),
      };
      await db.transactions.add(newTransaction);
      showToast(
        language === 'id'
          ? `Berhasil mencatat ${formatIDR(data.amount, false, language)}!`
          : `Recorded ${formatIDR(data.amount, false, language)}!`,
        'success'
      );
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    await db.transactions.delete(id);
    showToast(language === 'id' ? 'Transaksi berhasil dihapus.' : 'Transaction deleted.', 'info');
  };

  // CRUD Handlers for Categories
  const handleSaveCategory = async (data: Omit<Category, 'id' | 'createdAt'>, id?: string) => {
    if (id) {
      await db.categories.update(id, { ...data });
      showToast(
        language === 'id' ? `Kategori "${data.name}" berhasil diperbarui!` : `Category "${data.name}" updated!`,
        'success'
      );
    } else {
      const newCat: Category = {
        id: generateId('cat'),
        ...data,
        createdAt: new Date().toISOString(),
      };
      await db.categories.add(newCat);
      showToast(
        language === 'id' ? `Kategori "${data.name}" berhasil dibuat!` : `Category "${data.name}" created!`,
        'success'
      );
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const remainingCats = categories.filter((c) => c.id !== id);
    let fallbackCatId = remainingCats.find((c) => c.id === 'cat-others')?.id || remainingCats[0]?.id;

    if (!fallbackCatId) {
      const defaultOthers: Category = {
        id: 'cat-others',
        name: 'Lain-lain',
        icon: 'CircleEllipsis',
        color: '#64748b',
        isDefault: true,
        createdAt: new Date().toISOString(),
      };
      await db.categories.add(defaultOthers);
      fallbackCatId = defaultOthers.id;
    }

    const relatedTxs = await db.transactions.where('categoryId').equals(id).toArray();
    for (const tx of relatedTxs) {
      await db.transactions.update(tx.id, { categoryId: fallbackCatId });
    }
    await db.categories.delete(id);
    showToast(
      language === 'id'
        ? 'Kategori berhasil dihapus dan transaksi dialihkan.'
        : 'Category deleted and transactions re-routed.',
      'info'
    );
  };

  const handleUpdateCategoryBudget = async (categoryId: string, limit: number | undefined) => {
    await db.categories.update(categoryId, { budgetLimit: limit });
    showToast(
      language === 'id' ? 'Batas anggaran kategori disimpan!' : 'Category budget limit saved!',
      'success'
    );
  };

  // Reset all application data
  const handleResetAllData = async () => {
    await db.transaction('rw', db.categories, db.transactions, db.budgets, db.recurringExpenses, async () => {
      await db.categories.clear();
      await db.transactions.clear();
      await db.budgets.clear();
      await db.recurringExpenses.clear();
      await db.categories.bulkPut(DEFAULT_CATEGORIES);
    });
    showToast(language === 'id' ? 'Seluruh data berhasil direset.' : 'All data successfully reset.', 'info');
  };

  // Quick Preset Add Handler
  const handleSelectQuickPreset = (preset: QuickPresetItem) => {
    const now = new Date();
    setEditingTransaction({
      id: '',
      amount: preset.amount,
      categoryId: preset.categoryId,
      date: now.toISOString(),
      notes: preset.notes,
      paymentMethod: 'E-Wallet',
      createdAt: now.toISOString(),
    });
    setIsTransactionModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200 relative overflow-x-hidden selection:bg-emerald-500 selection:text-white">
      {/* Ambient Background Aura for Rich Glassmorphism */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full bg-teal-500/10 dark:bg-teal-500/15 blur-[120px]" />
        <div className="absolute -bottom-40 left-1/4 w-[600px] h-[600px] rounded-full bg-emerald-600/5 dark:bg-emerald-600/10 blur-[140px]" />
      </div>

      {/* Top Navbar */}
      <Navbar
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenNewTransaction={() => {
          setEditingTransaction(null);
          setIsTransactionModalOpen(true);
        }}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        currentUser={currentUser}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        t={t}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 pb-24 md:pb-10 space-y-5">
        {/* Top Summary Banner: Clean Minimalist Financial Overview Card (Removed 'Bulan Ini' and 'Tersimpan Offline' badges) */}
        {/* Top Summary Banner: Modern FinTech Hero Card */}
        {activeTab === 'transactions' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 rounded-3xl p-6 sm:p-7 text-white shadow-xl shadow-emerald-600/20 relative overflow-hidden border border-white/15">
              {/* Subtle decorative glows */}
              <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />
              <div className="absolute right-1/3 -bottom-20 w-80 h-80 rounded-full bg-teal-400/10 blur-3xl pointer-events-none" />

              <div className="relative z-10 space-y-5">
                {/* Top Header Row: Prominent Section Label & Month Navigator */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-white/15">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white/20 border border-white/25 flex items-center justify-center text-white backdrop-blur-md shadow-sm shrink-0">
                      <Banknote className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <span className="text-sm sm:text-base font-bold text-white tracking-wide">
                      {t.totalExpenseThisMonth}
                    </span>
                  </div>

                  {/* Month Navigator Pill */}
                  <div className="flex items-center justify-between sm:justify-end space-x-1.5 bg-black/20 dark:bg-black/30 p-1 rounded-2xl border border-white/15 backdrop-blur-md self-start sm:self-auto w-full sm:w-auto">
                    <button
                      onClick={handlePrevMonth}
                      className="p-1.5 hover:bg-white/15 rounded-xl transition-all text-emerald-100 hover:text-white active:scale-95"
                      title={language === 'en' ? 'Previous Month' : 'Bulan Sebelumnya'}
                    >
                      <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                    </button>
                    <span className="text-xs sm:text-sm font-extrabold px-3 text-center text-white min-w-[120px]">
                      {format(currentDate, 'MMMM yyyy', { locale: language === 'en' ? enLocale : idLocale })}
                    </span>
                    <button
                      onClick={handleNextMonth}
                      className="p-1.5 hover:bg-white/15 rounded-xl transition-all text-emerald-100 hover:text-white active:scale-95"
                      title={language === 'en' ? 'Next Month' : 'Bulan Berikutnya'}
                    >
                      <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>
                </div>

                {/* Main Content Grid: Big Balance & Auxiliary Financial Metrics */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-center">
                  {/* Left Column (7 cols): Main Balance */}
                  <div className="lg:col-span-7">
                    <div className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight drop-shadow-sm">
                      {formatIDR(currentMonthTotal, false, language)}
                    </div>
                  </div>

                  {/* Right Column (5 cols): Metrics Grid */}
                  <div className="lg:col-span-5 grid grid-cols-2 gap-3 w-full">
                    {/* Metric 1: Daily Average */}
                    <div className="bg-black/15 dark:bg-black/25 p-3.5 sm:p-4 rounded-2xl border border-white/15 backdrop-blur-md flex flex-col justify-between">
                      <div className="flex items-center space-x-1.5 text-xs font-semibold text-emerald-200">
                        <Calendar className="w-3.5 h-3.5 text-amber-300" />
                        <span className="truncate">{t.kpiDailyAverage}</span>
                      </div>
                      <div className="text-sm sm:text-lg font-black text-white mt-1.5 tracking-tight truncate">
                        {formatIDR(currentMonthDailyAverage, false, language)}
                      </div>
                    </div>

                    {/* Metric 2: Transaction Count */}
                    <div className="bg-black/15 dark:bg-black/25 p-3.5 sm:p-4 rounded-2xl border border-white/15 backdrop-blur-md flex flex-col justify-between">
                      <div className="flex items-center space-x-1.5 text-xs font-semibold text-emerald-200">
                        <Tag className="w-3.5 h-3.5 text-sky-300" />
                        <span className="truncate">{t.kpiFrequency}</span>
                      </div>
                      <div className="text-sm sm:text-lg font-black text-white mt-1.5 tracking-tight">
                        {currentMonthTxCount} <span className="text-xs font-semibold text-emerald-200">{t.kpiTimes}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Presets Bar */}
            <QuickPresets
              categories={categories}
              onSelectPreset={handleSelectQuickPreset}
              lang={language}
              t={t}
            />
          </div>
        )}

        {/* View Switcher Content with Suspense Lazy Loading */}
        {activeTab === 'transactions' && (
          <TransactionList
            transactions={transactions}
            categories={categories}
            selectedMonthFilter={selectedMonthFilter}
            onEditTransaction={(tx) => {
              setEditingTransaction(tx);
              setIsTransactionModalOpen(true);
            }}
            onDeleteTransaction={handleDeleteTransaction}
            onOpenNewTransaction={() => {
              setEditingTransaction(null);
              setIsTransactionModalOpen(true);
            }}
            lang={language}
            t={t}
          />
        )}

        {activeTab === 'analytics' && (
          <Suspense fallback={<ViewLoaderFallback />}>
            <AnalyticsView
              transactions={transactions}
              categories={categories}
              darkMode={darkMode}
              lang={language}
              t={t}
            />
          </Suspense>
        )}

        {activeTab === 'budget' && (
          <Suspense fallback={<ViewLoaderFallback />}>
            <BudgetManager
              categories={categories}
              transactions={transactions}
              onUpdateCategoryBudget={handleUpdateCategoryBudget}
              lang={language}
              t={t}
            />
          </Suspense>
        )}

        {activeTab === 'categories' && (
          <Suspense fallback={<ViewLoaderFallback />}>
            <CategoryManager
              categories={categories}
              transactions={transactions}
              onSaveCategory={handleSaveCategory}
              onDeleteCategory={handleDeleteCategory}
              lang={language}
              t={t}
            />
          </Suspense>
        )}
      </main>

      {/* Mobile Floating Bottom Navigation (Symmetrical 5 Direct Tabs) */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenNewTransaction={() => {
          setEditingTransaction(null);
          setIsTransactionModalOpen(true);
        }}
        t={t}
      />

      {/* Transaction Modal (Add / Edit) */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => {
          setIsTransactionModalOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveTransaction}
        onDelete={handleDeleteTransaction}
        categories={categories}
        initialData={editingTransaction}
        onOpenCategoryManager={() => {
          setIsTransactionModalOpen(false);
          setActiveTab('categories');
        }}
        lang={language}
        t={t}
      />

      {/* Excel Center Modal (Import & Export) */}
      <ExcelModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        transactions={transactions}
        categories={categories}
        lang={language}
        t={t}
        onDataChanged={(msg) => {
          if (msg) showToast(msg, 'success');
        }}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        language={language}
        onChangeLanguage={handleLanguageChange}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onOpenExcelModal={() => setIsExcelModalOpen(true)}
        onResetAllData={handleResetAllData}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={async () => {
          await authService.logout();
          setCurrentUser(null);
          showToast(language === 'id' ? 'Anda telah keluar dari akun.' : 'You have been signed out.', 'info');
        }}
        t={t}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
          setIsAuthModalOpen(false);
          showToast(t.authSuccessLogin, 'success');
        }}
        t={t}
      />

      {/* In-App Toast Feedback Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;
