import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
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
import { MonthYearPickerModal } from './components/common/MonthYearPickerModal';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { formatIDR, generateId } from './utils/formatters';
import { translations, type Language } from './constants/translations';
import { authService, type UserProfile } from './services/authService';
import { syncService } from './services/syncService';
import { Loader2, Calendar, ChevronLeft, ChevronRight, Banknote, Tag, Layers } from 'lucide-react';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
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
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pathname = location.pathname;

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

  // Track underlying active tab across modal route overlays
  const [lastActiveTab, setLastActiveTab] = useState<string>('transactions');

  useEffect(() => {
    if (pathname.startsWith('/analytics')) {
      setLastActiveTab('analytics');
    } else if (pathname.startsWith('/budget')) {
      setLastActiveTab('budget');
    } else if (pathname.startsWith('/categories')) {
      setLastActiveTab('categories');
    } else if (pathname.startsWith('/transactions') || pathname === '/') {
      setLastActiveTab('transactions');
    }
  }, [pathname]);

  const activeTab = useMemo(() => {
    if (pathname.startsWith('/analytics')) return 'analytics';
    if (pathname.startsWith('/budget')) return 'budget';
    if (pathname.startsWith('/categories')) return 'categories';
    if (pathname.startsWith('/transactions') || pathname === '/') return 'transactions';
    return lastActiveTab;
  }, [pathname, lastActiveTab]);

  // Derive route-based modal states
  const isNewTransactionRoute = pathname === '/transactions/new' || pathname === '/new';
  const editTxMatch = pathname.match(/^\/transactions\/edit\/([^/]+)$/);
  const editTransactionId = editTxMatch ? editTxMatch[1] : null;

  const isSettingsOpen = pathname === '/settings';
  const isExcelModalOpen = pathname === '/excel';
  const isAuthModalOpen = pathname === '/auth';
  const isTransactionModalOpen = isNewTransactionRoute || !!editTransactionId;

  // Preset draft state (when user clicks quick preset)
  const [presetDraft, setPresetDraft] = useState<Transaction | null>(null);
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const t = useMemo(() => translations[language], [language]);

  // Extract selectedMonthFilter from searchParams or default to current month
  const monthQuery = searchParams.get('month');
  const selectedMonthFilter = useMemo(() => {
    if (monthQuery === 'all' || monthQuery === 'ALL') return 'ALL';
    if (monthQuery && /^\d{4}-\d{2}$/.test(monthQuery)) return monthQuery;
    return format(new Date(), 'yyyy-MM');
  }, [monthQuery]);

  const isAllTime = selectedMonthFilter === 'ALL';

  // Helper for closing modals and returning to underlying tab
  const handleCloseModals = useCallback(() => {
    setPresetDraft(null);
    if (activeTab === 'transactions') {
      if (selectedMonthFilter === 'ALL') {
        navigate('/transactions?month=all');
      } else {
        navigate(`/transactions?month=${selectedMonthFilter}`);
      }
    } else {
      navigate(`/${activeTab}`);
    }
  }, [activeTab, selectedMonthFilter, navigate]);

  // Helper for selecting month filter
  const handleSelectMonthFilter = useCallback((newMonth: string) => {
    if (newMonth === 'ALL') {
      navigate('/transactions?month=all');
    } else {
      navigate(`/transactions?month=${newMonth}`);
    }
  }, [navigate]);

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

  // Initialize Default Data on first launch & sync auth state
  useEffect(() => {
    initializeDefaultData();
    authService.getCurrentUser().then((user) => {
      setCurrentUser(user);
      if (user?.id) {
        syncService.syncAll(user.id);
      }
    });

    const unsubscribe = authService.onAuthStateChange((user) => {
      setCurrentUser(user);
      if (user?.id) {
        syncService.syncAll(user.id);
      }
    });

    return () => unsubscribe();
  }, []);

  // Feedback hasil redirect link verifikasi email (?code=... / ?error_code=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.get('code') && !params.get('error') && !params.get('error_code')) return;
    // Bersihkan param agar toast tidak muncul ulang saat remount (StrictMode/HMR)
    window.history.replaceState(null, '', window.location.pathname);
    if (params.get('code')) {
      showToast(language === 'id'
        ? 'Email berhasil diverifikasi! Anda kini sudah masuk.'
        : 'Email verified successfully! You are now signed in.', 'success');
    } else {
      showToast(language === 'id'
        ? 'Tautan verifikasi tidak valid atau sudah kedaluwarsa. Silakan daftar ulang atau masuk.'
        : 'The verification link is invalid or has expired. Please sign up again or sign in.', 'error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Real-time synchronization & App Resume / Window Focus listeners
  useEffect(() => {
    if (!currentUser?.id) return;

    const userId = currentUser.id;

    // 1. Supabase Realtime channel subscription (instant update across web & mobile)
    const unsubscribeRealtime = syncService.subscribeToRealtime(userId, () => {
      syncService.syncAll(userId);
    });

    // 2. Mobile App Resume listener (when returning from background on Android/iOS)
    let appStateHandle: any;
    if (Capacitor.isNativePlatform()) {
      appStateHandle = CapacitorApp.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          syncService.syncAll(userId);
        }
      });
    }

    // 3. Web Window Focus & Visibility Change listener
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncService.syncAll(userId);
      }
    };
    const handleWindowFocus = () => {
      syncService.syncAll(userId);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      unsubscribeRealtime();
      if (appStateHandle) {
        appStateHandle.then((h: any) => h.remove());
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [currentUser?.id]);

  // Sync Dark Mode with DOM, Meta Theme Color, and Native Status Bar
  useEffect(() => {
    const themeBg = darkMode ? '#0f172a' : '#f8fafc';
    
    // Update HTML meta theme-color (affects browser and Android PWA chrome)
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', themeBg);
    }

    const updateStatusBar = async (isDark: boolean) => {
      if (Capacitor.isNativePlatform()) {
        try {
          await StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
          await StatusBar.setOverlaysWebView({ overlay: true });
        } catch (e) {
          console.error('StatusBar not available', e);
        }
      }
    };

    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      updateStatusBar(true);
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      updateStatusBar(false);
    }
  }, [darkMode]);

  // Global Keyboard Shortcuts (N for new transaction, S for settings)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        activeEl?.tagName === 'SELECT';
      if (isInput) return;

      if ((e.key === 'n' || e.key === 'N') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setPresetDraft(null);
        navigate('/transactions/new');
      } else if ((e.key === 's' || e.key === 'S') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        navigate('/settings');
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [navigate]);

  // Sync Language with LocalStorage
  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    localStorage.setItem('language', newLang);
    showToast(newLang === 'id' ? 'Bahasa diubah ke Bahasa Indonesia' : 'Language changed to English', 'info');
  };

  // Live Queries from IndexedDB (Dexie reactively observes DB changes automatically)
  const categoriesRaw = useLiveQuery(() => db.categories.toArray());
  const categories = useMemo(() => categoriesRaw || [], [categoriesRaw]);

  // DEXIE INDEXED QUERY: Ambil data transaksi bulan yang aktif saja dari storage (jika bukan 'ALL')
  const transactionsRaw = useLiveQuery(
    () => {
      if (isAllTime) {
        return db.transactions.orderBy('date').reverse().toArray();
      }
      try {
        const [yearStr, monthStr] = (selectedMonthFilter || '').split('-');
        const y = parseInt(yearStr, 10);
        const m = parseInt(monthStr, 10);
        if (!isNaN(y) && !isNaN(m) && m >= 1 && m <= 12) {
          const start = new Date(y, m - 1, 1, 0, 0, 0, 0).toISOString();
          const end = new Date(y, m, 0, 23, 59, 59, 999).toISOString();
          return db.transactions.where('date').between(start, end, true, true).reverse().sortBy('date');
        }
      } catch {}
      return db.transactions.orderBy('date').reverse().toArray();
    },
    [selectedMonthFilter, isAllTime]
  );
  const transactions = useMemo(() => transactionsRaw || [], [transactionsRaw]);

  // Query editing transaction langsung by ID dari IndexedDB
  const editingTransactionRaw = useLiveQuery(
    () => (editTransactionId ? db.transactions.get(editTransactionId) : undefined),
    [editTransactionId]
  );

  // Find editing transaction from DB if ID is present in route
  const editingTransaction = useMemo(() => {
    if (presetDraft) return presetDraft;
    if (!editTransactionId) return null;
    return editingTransactionRaw || transactions.find((t) => t.id === editTransactionId) || null;
  }, [presetDraft, editTransactionId, editingTransactionRaw, transactions]);

  // Current Month / All-Time Data Calculation
  const { currentMonthTotal, currentMonthDailyAverage, currentMonthTxCount, currentDate } = useMemo(() => {
    let date = new Date();

    if (!isAllTime) {
      try {
        const [yearStr, monthStr] = (selectedMonthFilter || '').split('-');
        const y = parseInt(yearStr, 10);
        const m = parseInt(monthStr, 10);
        if (!isNaN(y) && !isNaN(m) && m >= 1 && m <= 12) {
          date = new Date(y, m - 1, 1);
        }
      } catch {
        date = new Date();
      }
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
    } else {
      // ALL-TIME CALCULATION
      const total = transactions.reduce((acc, tx) => acc + tx.amount, 0);
      const uniqueDays = new Set<string>();
      transactions.forEach((tx) => {
        try {
          uniqueDays.add(tx.date.split('T')[0]);
        } catch {}
      });
      const daysCount = Math.max(1, uniqueDays.size);
      const dailyAverage = Math.round(total / daysCount);

      return {
        currentMonthTotal: total,
        currentMonthDailyAverage: dailyAverage,
        currentMonthTxCount: transactions.length,
        currentDate: new Date(),
      };
    }
  }, [transactions, selectedMonthFilter, isAllTime]);

  const handlePrevMonth = () => {
    if (isAllTime) {
      const cur = format(new Date(), 'yyyy-MM');
      handleSelectMonthFilter(cur);
      return;
    }
    const newDate = subMonths(currentDate, 1);
    handleSelectMonthFilter(format(newDate, 'yyyy-MM'));
  };

  const handleNextMonth = () => {
    if (isAllTime) {
      const cur = format(new Date(), 'yyyy-MM');
      handleSelectMonthFilter(cur);
      return;
    }
    const newDate = addMonths(currentDate, 1);
    handleSelectMonthFilter(format(newDate, 'yyyy-MM'));
  };

  // CRUD Handlers for Transactions
  const handleSaveTransaction = async (data: Omit<Transaction, 'id' | 'createdAt'>, id?: string) => {
    if (id) {
      await db.transactions.update(id, {
        ...data,
      });
      if (currentUser?.id) {
        const updated = await db.transactions.get(id);
        if (updated) syncService.pushTransaction(updated, currentUser.id);
      }
      showToast(language === 'id' ? 'Catatan pengeluaran berhasil diperbarui!' : 'Expense updated successfully!', 'success');
    } else {
      const newTransaction: Transaction = {
        id: generateId('tx'),
        ...data,
        createdAt: new Date().toISOString(),
      };
      await db.transactions.add(newTransaction);
      if (currentUser?.id) {
        syncService.pushTransaction(newTransaction, currentUser.id);
      }
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
    if (currentUser?.id) {
      syncService.deleteTransaction(id, currentUser.id);
    }
    showToast(language === 'id' ? 'Transaksi berhasil dihapus.' : 'Transaction deleted.', 'info');
  };

  // CRUD Handlers for Categories
  const handleSaveCategory = async (data: Omit<Category, 'id' | 'createdAt'>, id?: string) => {
    if (id) {
      await db.categories.update(id, { ...data });
      if (currentUser?.id) {
        const updated = await db.categories.get(id);
        if (updated) syncService.pushCategory(updated, currentUser.id);
      }
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
      if (currentUser?.id) {
        syncService.pushCategory(newCat, currentUser.id);
      }
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

    // Re-route related transactions
    const relatedTxs = await db.transactions.where('categoryId').equals(id).toArray();
    for (const tx of relatedTxs) {
      await db.transactions.update(tx.id, { categoryId: fallbackCatId });
    }

    // Re-route related recurring expenses
    const relatedRecurring = await db.recurringExpenses.where('categoryId').equals(id).toArray();
    for (const rec of relatedRecurring) {
      await db.recurringExpenses.update(rec.id, { categoryId: fallbackCatId });
    }

    // Delete category budget entries
    await db.budgets.where('categoryId').equals(id).delete();

    await db.categories.delete(id);
    if (currentUser?.id) {
      syncService.deleteCategory(id, currentUser.id);
    }
    showToast(
      language === 'id'
        ? 'Kategori berhasil dihapus dan transaksi dialihkan.'
        : 'Category deleted and transactions re-routed.',
      'info'
    );
  };

  const handleUpdateCategoryBudget = async (categoryId: string, limit: number | undefined) => {
    await db.categories.update(categoryId, { budgetLimit: limit });
    if (currentUser?.id) {
      const updated = await db.categories.get(categoryId);
      if (updated) {
        syncService.pushCategory(updated, currentUser.id);
      }
    }
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
    setPresetDraft({
      id: '',
      amount: preset.amount,
      categoryId: preset.categoryId,
      date: now.toISOString(),
      notes: preset.notes,
      paymentMethod: 'Tunai',
      createdAt: now.toISOString(),
    });
    navigate('/transactions/new');
  };

  const handleTabNavigation = (tab: string) => {
    if (tab === 'transactions') {
      if (selectedMonthFilter === 'ALL') {
        navigate('/transactions?month=all');
      } else if (selectedMonthFilter !== format(new Date(), 'yyyy-MM')) {
        navigate(`/transactions?month=${selectedMonthFilter}`);
      } else {
        navigate('/transactions');
      }
    } else {
      navigate(`/${tab}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200 relative overflow-x-hidden selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        onOpenSettings={() => navigate('/settings')}
        onOpenNewTransaction={() => {
          setPresetDraft(null);
          navigate('/transactions/new');
        }}
        onOpenAuth={() => navigate('/auth')}
        currentUser={currentUser}
        activeTab={activeTab}
        onSelectTab={handleTabNavigation}
        t={t}
      />

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 pb-24 md:pb-10 space-y-5">
        {/* Top Summary Banner: Liquid Glass Stats Card */}
        {activeTab === 'transactions' && (
          <div className="space-y-4">
            <div className="glass-card rounded-3xl p-5 sm:p-6">
              {/* Header Row: Label & Month Navigator */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-900/5 dark:border-white/10">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] flex items-center justify-center text-white shrink-0">
                    <Banknote className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 tracking-wide">
                    {isAllTime ? t.totalExpenseAllTime : t.totalExpenseThisMonth}
                  </span>
                </div>

                {/* Month Navigator */}
                <div className="flex items-center justify-between sm:justify-end space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-auto w-full sm:w-auto">
                  <button
                    onClick={handlePrevMonth}
                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    title={language === 'en' ? 'Previous Month' : 'Bulan Sebelumnya'}
                  >
                    <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsMonthPickerOpen(true)}
                    className="flex items-center justify-center space-x-1.5 px-3 py-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-800 dark:text-slate-100 font-bold text-xs sm:text-sm min-w-[120px]"
                    title={language === 'en' ? 'Click to select month & year' : 'Klik untuk memilih bulan & tahun'}
                  >
                    {isAllTime ? (
                      <>
                        <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                        <span>{t.allTransactions}</span>
                      </>
                    ) : (
                      <>
                        <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                        <span>
                          {format(currentDate, 'MMMM yyyy', { locale: language === 'en' ? enLocale : idLocale })}
                        </span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleNextMonth}
                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    title={language === 'en' ? 'Next Month' : 'Bulan Berikutnya'}
                  >
                    <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>

              {/* Main Content: Big Number & Auxiliary Metrics */}
              <div className="pt-4 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8 items-end">
                {/* Left: Total */}
                <div className="lg:col-span-7">
                  <div className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
                    {formatIDR(currentMonthTotal, false, language)}
                  </div>
                </div>

                {/* Right: Inline Metrics */}
                <div className="lg:col-span-5 grid grid-cols-2 gap-x-6 gap-y-3 w-full lg:border-l lg:border-slate-900/10 dark:lg:border-white/10 lg:pl-8">
                  <div>
                    <div className="flex items-center space-x-1.5 text-xs font-medium text-slate-400">
                      <Calendar className="w-3.5 h-3.5 text-amber-500" />
                      <span className="truncate">{t.kpiDailyAverage}</span>
                    </div>
                    <div className="text-base sm:text-xl font-bold text-slate-800 dark:text-slate-100 mt-0.5 tracking-tight truncate">
                      {formatIDR(currentMonthDailyAverage, false, language)}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center space-x-1.5 text-xs font-medium text-slate-400">
                      <Tag className="w-3.5 h-3.5 text-sky-500" />
                      <span className="truncate">{t.kpiFrequency}</span>
                    </div>
                    <div className="text-base sm:text-xl font-bold text-slate-800 dark:text-slate-100 mt-0.5 tracking-tight">
                      {currentMonthTxCount}{' '}
                      <span className="text-xs font-medium text-slate-400">{t.kpiTimes}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Presets Bar */}
            <QuickPresets
              categories={categories}
              transactions={transactions}
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
            onSelectMonthFilter={handleSelectMonthFilter}
            onEditTransaction={(tx) => {
              navigate(`/transactions/edit/${tx.id}`);
            }}
            onDeleteTransaction={handleDeleteTransaction}
            onOpenNewTransaction={() => {
              setPresetDraft(null);
              navigate('/transactions/new');
            }}
            lang={language}
            t={t}
          />
        )}

        {activeTab === 'analytics' && (
          <ErrorBoundary lang={language}>
            <Suspense fallback={<ViewLoaderFallback />}>
              <AnalyticsView
                transactions={transactions}
                categories={categories}
                darkMode={darkMode}
                lang={language}
                t={t}
              />
            </Suspense>
          </ErrorBoundary>
        )}

        {activeTab === 'budget' && (
          <ErrorBoundary lang={language}>
            <Suspense fallback={<ViewLoaderFallback />}>
              <BudgetManager
                categories={categories}
                transactions={transactions}
                onUpdateCategoryBudget={handleUpdateCategoryBudget}
                lang={language}
                t={t}
              />
            </Suspense>
          </ErrorBoundary>
        )}

        {activeTab === 'categories' && (
          <ErrorBoundary lang={language}>
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
          </ErrorBoundary>
        )}
      </main>

      {/* Mobile Floating Bottom Navigation (Symmetrical 5 Direct Tabs) */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={handleTabNavigation}
        onOpenNewTransaction={() => {
          setPresetDraft(null);
          navigate('/transactions/new');
        }}
        t={t}
      />

      {/* Transaction Modal (Add / Edit) */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={handleCloseModals}
        onSave={handleSaveTransaction}
        onDelete={handleDeleteTransaction}
        categories={categories}
        initialData={editingTransaction}
        onOpenCategoryManager={() => {
          navigate('/categories');
        }}
        lang={language}
        t={t}
      />

      {/* Excel Center Modal (Import & Export) */}
      <ExcelModal
        isOpen={isExcelModalOpen}
        onClose={handleCloseModals}
        transactions={transactions}
        categories={categories}
        lang={language}
        t={t}
        onDataChanged={(msg) => {
          if (msg) showToast(msg, 'success');
          if (currentUser?.id) {
            syncService.syncAll(currentUser.id);
          }
        }}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={handleCloseModals}
        language={language}
        onChangeLanguage={handleLanguageChange}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onOpenExcelModal={() => navigate('/excel')}
        onResetAllData={handleResetAllData}
        currentUser={currentUser}
        onOpenAuth={() => navigate('/auth')}
        onLogout={async () => {
          await authService.logout();
          await syncService.resetLocalDataToDefaults();
          setCurrentUser(null);
          showToast(language === 'id' ? 'Anda telah keluar dari akun.' : 'You have been signed out.', 'info');
        }}
        onDeleteAccount={async () => {
          if (currentUser?.id) {
            await authService.deleteAccount(currentUser.id);
          } else {
            await authService.deleteAccount();
          }
          await handleResetAllData();
          setCurrentUser(null);
          showToast(t.authDeleteAccountSuccess || 'Akun berhasil dihapus.', 'info');
        }}
        t={t}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={handleCloseModals}
        onSuccess={async (user) => {
          setCurrentUser(user);
          handleCloseModals();
          showToast(t.authSuccessLogin, 'success');
          if (user?.id) {
            await syncService.syncAll(user.id);
          }
        }}
        t={t}
      />

      {/* Month & Year Picker Modal */}
      <MonthYearPickerModal
        isOpen={isMonthPickerOpen}
        onClose={() => setIsMonthPickerOpen(false)}
        selectedMonth={selectedMonthFilter}
        onSelectMonth={(newMonth) => handleSelectMonthFilter(newMonth)}
        lang={language}
      />

      {/* In-App Toast Feedback Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;




