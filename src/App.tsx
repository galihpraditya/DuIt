import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, initializeDefaultData, DEFAULT_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from './db/database';
import type { Category, CategorySortMode, Transaction } from './types';
import {
  getCategoryType,
  getTransactionType,
  filterCategoriesByType,
  filterTransactionsByType,
  calculateCashFlowSummary,
  isIncomeTrackingEnabled,
  setIncomeTrackingEnabled,
} from './utils/transactionHelpers';
import { sortCategories, getStoredCategorySortMode, setStoredCategorySortMode } from './utils/categorySorter';
import { Navbar } from './components/layout/Navbar';
import { BottomNav } from './components/layout/BottomNav';
import { TransactionList } from './components/transactions/TransactionList';
import { TransactionModal } from './components/transactions/TransactionModal';
import { QuickPresets, type QuickPresetItem } from './components/transactions/QuickPresets';
import { ToastContainer, type ToastMessage } from './components/common/Toast';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { formatIDR, generateId } from './utils/formatters';
import { translations, type Language } from './constants/translations';
import { authService, type UserProfile } from './services/authService';
import { syncService } from './services/syncService';
import { reminderService } from './services/reminderService';
import { themeService } from './services/themeService';
import { Loader2, Calendar, ChevronLeft, ChevronRight, Banknote, Layers, Eye, EyeOff, Clock, ArrowUpDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
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
const SettingsView = lazy(() =>
  import('./components/settings/SettingsView').then((m) => ({ default: m.SettingsView }))
);
const ExcelModal = lazy(() =>
  import('./components/excel/ExcelModal').then((m) => ({ default: m.ExcelModal }))
);
const AuthModal = lazy(() =>
  import('./components/auth/AuthModal').then((m) => ({ default: m.AuthModal }))
);
const MonthYearPickerModal = lazy(() =>
  import('./components/common/MonthYearPickerModal').then((m) => ({ default: m.MonthYearPickerModal }))
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

  const [darkMode, setDarkMode] = useState<boolean>(() => themeService.isDark());

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
    } else if (pathname.startsWith('/settings')) {
      setLastActiveTab('settings');
    } else if (pathname.startsWith('/transactions') || pathname === '/') {
      setLastActiveTab('transactions');
    }
  }, [pathname]);

  const activeTab = useMemo(() => {
    if (pathname.startsWith('/analytics')) return 'analytics';
    if (pathname.startsWith('/budget')) return 'budget';
    if (pathname.startsWith('/categories')) return 'categories';
    if (pathname.startsWith('/settings')) return 'settings';
    if (pathname.startsWith('/transactions') || pathname === '/') return 'transactions';
    return lastActiveTab;
  }, [pathname, lastActiveTab]);

  // Derive route-based modal states
  const isNewTransactionRoute = pathname === '/transactions/new' || pathname === '/new';
  const editTxMatch = pathname.match(/^\/transactions\/edit\/([^/]+)$/);
  const editTransactionId = editTxMatch ? editTxMatch[1] : null;

  // Settings is now a dedicated page view rendered in main
  const isExcelModalOpen = pathname === '/excel';
  const isAuthModalOpen = pathname === '/auth';
  const isTransactionModalOpen = isNewTransactionRoute || !!editTransactionId;

  // Preset draft state (when user clicks quick preset)
  const [presetDraft, setPresetDraft] = useState<Transaction | null>(null);
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('duit_active_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
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

  // Privacy / Sensor Nominal State (persisted in localStorage)
  const [hideNominals, setHideNominals] = useState<boolean>(() => {
    return localStorage.getItem('duit_hide_nominals') === 'true';
  });

  const handleToggleHideNominals = useCallback(() => {
    setHideNominals((prev) => {
      const next = !prev;
      localStorage.setItem('duit_hide_nominals', String(next));
      return next;
    });
  }, []);

  // Optional Income Tracking Mode State (persisted in localStorage)
  const [incomeEnabled, setIncomeEnabled] = useState<boolean>(() => isIncomeTrackingEnabled());

  const handleToggleIncomeEnabled = useCallback(
    (next: boolean) => {
      setIncomeEnabled(next);
      setIncomeTrackingEnabled(next);
      showToast(next ? t.incomeFeatureEnabledToast : t.incomeFeatureDisabledToast, 'info');
    },
    [showToast, t.incomeFeatureEnabledToast, t.incomeFeatureDisabledToast]
  );

  // Handle Android Native Hardware Back Button (Capacitor)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let isSubscribed = true;
    const backListenerPromise = CapacitorApp.addListener('backButton', () => {
      if (!isSubscribed) return;
      if (isTransactionModalOpen || isExcelModalOpen || isAuthModalOpen || isMonthPickerOpen) {
        if (isMonthPickerOpen) {
          setIsMonthPickerOpen(false);
        } else {
          handleCloseModals();
        }
      } else if (activeTab !== 'transactions') {
        navigate('/transactions');
      } else {
        CapacitorApp.exitApp();
      }
    });

    return () => {
      isSubscribed = false;
      backListenerPromise.then((h) => h.remove());
    };
  }, [
    isTransactionModalOpen,
    isExcelModalOpen,
    isAuthModalOpen,
    isMonthPickerOpen,
    activeTab,
    handleCloseModals,
    navigate,
  ]);

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

  // Initialize theme service & sync with app state
  useEffect(() => {
    themeService.init();
    const unsubscribe = themeService.subscribe((_settings, isDark) => {
      setDarkMode(isDark);
    });
    return () => {
      unsubscribe();
      themeService.cleanup();
    };
  }, []);

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

  // Listen for daily reminder notification click
  useEffect(() => {
    const handleOpenNewTxFromReminder = () => {
      setPresetDraft(null);
      navigate('/transactions/new');
    };
    window.addEventListener('duit:open-new-transaction', handleOpenNewTxFromReminder);
    return () => window.removeEventListener('duit:open-new-transaction', handleOpenNewTxFromReminder);
  }, [navigate]);

  // Sync Language with LocalStorage & DOM
  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    localStorage.setItem('language', newLang);
    document.documentElement.lang = newLang;
    showToast(newLang === 'id' ? 'Bahasa diubah ke Bahasa Indonesia' : 'Language changed to English', 'info');
  };

  // Live Queries from IndexedDB (Dexie reactively observes DB changes automatically)
  const categoriesRaw = useLiveQuery(() => db.categories.toArray());
  const categories = useMemo(() => categoriesRaw || [], [categoriesRaw]);

  // Category Sort Mode & Reordering
  const [categorySortMode, setCategorySortMode] = useState<CategorySortMode>(() => getStoredCategorySortMode());

  const handleSortModeChange = useCallback((mode: CategorySortMode) => {
    setCategorySortMode(mode);
    setStoredCategorySortMode(mode);
  }, []);

  const handleReorderCategories = useCallback(
    async (reordered: Category[]) => {
      await db.transaction('rw', db.categories, async () => {
        await db.categories.bulkPut(reordered);
      });
      showToast(t.categoryOrderUpdated, 'success');
    },
    [showToast, t.categoryOrderUpdated]
  );

  // DEXIE QUERY: Ambil seluruh data transaksi (all-time) untuk Kategori & Pengaturan
  const allTransactionsRaw = useLiveQuery(() => db.transactions.orderBy('date').reverse().toArray());
  const allTransactions = useMemo(() => allTransactionsRaw || [], [allTransactionsRaw]);

  // Kategori terurut sesuai mode preferensi pengguna
  const sortedCategories = useMemo(() => {
    return sortCategories(categories, categorySortMode, allTransactions);
  }, [categories, categorySortMode, allTransactions]);

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

  // Filtered datasets respecting the Income Tracking on/off toggle (without deleting stored records)
  const visibleAllTransactions = useMemo(
    () => (incomeEnabled ? allTransactions : filterTransactionsByType(allTransactions, 'expense')),
    [allTransactions, incomeEnabled]
  );
  const visibleTransactions = useMemo(
    () => (incomeEnabled ? transactions : filterTransactionsByType(transactions, 'expense')),
    [transactions, incomeEnabled]
  );
  const visibleSortedCategories = useMemo(
    () => (incomeEnabled ? sortedCategories : filterCategoriesByType(sortedCategories, 'expense')),
    [sortedCategories, incomeEnabled]
  );

  // Check Daily Expense Reminder periodically across all-time transactions
  useEffect(() => {
    reminderService.checkAndTriggerDailyReminder(allTransactions, t);

    const interval = setInterval(() => {
      reminderService.checkAndTriggerDailyReminder(allTransactions, t);
    }, 60000);

    return () => clearInterval(interval);
  }, [allTransactions, t]);


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
  const {
    currentMonthTotal,
    currentMonthIncome,
    netCashFlow,
    cashFlowStatus,
    expenseRatioPct,
    currentMonthDailyAverage,
    todaySpent,
    highestExpenseInMonth,
    isCurrentMonth,
    currentDate,
  } = useMemo(() => {
    let date = new Date();
    const now = new Date();
    const todayStr = format(now, 'yyyy-MM-dd');
    const expenseVisible = filterTransactionsByType(visibleTransactions, 'expense');

    const todayTotal = expenseVisible
      .filter((tx) => {
        try {
          return tx.date.startsWith(todayStr);
        } catch {
          return false;
        }
      })
      .reduce((acc, tx) => acc + tx.amount, 0);

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

      const monthAllTxs = visibleTransactions.filter((tx) => {
        try {
          const d = parseISO(tx.date);
          return isWithinInterval(d, { start, end });
        } catch {
          return false;
        }
      });
      const monthExpenseTxs = filterTransactionsByType(monthAllTxs, 'expense');
      const cashFlow = calculateCashFlowSummary(monthAllTxs);

      const total = cashFlow.totalExpense;

      const isViewingCurrentMonth =
        date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
      let days = 1;
      if (isViewingCurrentMonth) {
        days = Math.max(1, now.getDate());
      } else {
        days = Math.max(1, end.getDate());
      }
      const dailyAverage = Math.round(total / days);
      const highest = monthExpenseTxs.reduce((max, tx) => Math.max(max, tx.amount), 0);

      return {
        currentMonthTotal: total,
        currentMonthIncome: cashFlow.totalIncome,
        netCashFlow: cashFlow.netCashFlow,
        cashFlowStatus: cashFlow.status,
        expenseRatioPct: cashFlow.expenseRatioPct,
        currentMonthDailyAverage: dailyAverage,
        todaySpent: todayTotal,
        highestExpenseInMonth: highest,
        isCurrentMonth: isViewingCurrentMonth,
        currentDate: date,
      };
    } else {
      // ALL-TIME CALCULATION
      const cashFlow = calculateCashFlowSummary(visibleTransactions);
      const total = cashFlow.totalExpense;
      const uniqueDays = new Set<string>();
      expenseVisible.forEach((tx) => {
        try {
          uniqueDays.add(tx.date.split('T')[0]);
        } catch {}
      });
      const daysCount = Math.max(1, uniqueDays.size);
      const dailyAverage = Math.round(total / daysCount);
      const highest = expenseVisible.reduce((max, tx) => Math.max(max, tx.amount), 0);

      return {
        currentMonthTotal: total,
        currentMonthIncome: cashFlow.totalIncome,
        netCashFlow: cashFlow.netCashFlow,
        cashFlowStatus: cashFlow.status,
        expenseRatioPct: cashFlow.expenseRatioPct,
        currentMonthDailyAverage: dailyAverage,
        todaySpent: todayTotal,
        highestExpenseInMonth: highest,
        isCurrentMonth: true,
        currentDate: new Date(),
      };
    }
  }, [visibleTransactions, selectedMonthFilter, isAllTime]);

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
    const isIncome = getTransactionType(data) === 'income';
    if (id) {
      await db.transactions.update(id, {
        ...data,
      });
      if (currentUser?.id) {
        const updated = await db.transactions.get(id);
        if (updated) syncService.pushTransaction(updated, currentUser.id);
      }
      showToast(
        language === 'id'
          ? isIncome
            ? 'Catatan pendapatan berhasil diperbarui!'
            : 'Catatan pengeluaran berhasil diperbarui!'
          : isIncome
          ? 'Income updated successfully!'
          : 'Expense updated successfully!',
        'success'
      );
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
          ? `Berhasil mencatat ${isIncome ? 'pemasukan' : 'pengeluaran'} ${formatIDR(data.amount, false, language)}!`
          : `Recorded ${isIncome ? 'income' : 'expense'} ${formatIDR(data.amount, false, language)}!`,
        'success'
      );
    }
  };

  const handleSaveBatchTransactions = async (batch: Omit<Transaction, 'id' | 'createdAt'>[]) => {
    if (!batch || batch.length === 0) return;
    const newTransactions: Transaction[] = batch.map((item) => ({
      id: generateId('tx'),
      ...item,
      createdAt: new Date().toISOString(),
    }));

    await db.transactions.bulkAdd(newTransactions);
    if (currentUser?.id) {
      for (const tx of newTransactions) {
        syncService.pushTransaction(tx, currentUser.id);
      }
    }

    const totalAmount = newTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    showToast(
      language === 'id'
        ? `Berhasil mencatat ${newTransactions.length} transaksi (${formatIDR(totalAmount, false, language)})!`
        : `Recorded ${newTransactions.length} transactions (${formatIDR(totalAmount, false, language)})!`,
      'success'
    );
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
        order: typeof data.order === 'number' ? data.order : categories.length,
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
    const deletingCat = categories.find((c) => c.id === id);
    const deletingType = getCategoryType(deletingCat);
    const remainingSameType = categories.filter(
      (c) => c.id !== id && getCategoryType(c) === deletingType
    );

    const anchorId = deletingType === 'income' ? 'cat-inc-others' : 'cat-others';
    let fallbackCatId =
      remainingSameType.find((c) => c.id === anchorId)?.id || remainingSameType[0]?.id;

    if (!fallbackCatId) {
      const defaultAnchor: Category =
        deletingType === 'income'
          ? {
              id: 'cat-inc-others',
              name: 'Pemasukan Lain',
              icon: 'CircleEllipsis',
              color: '#64748b',
              type: 'income',
              isDefault: true,
              createdAt: new Date().toISOString(),
            }
          : {
              id: 'cat-others',
              name: 'Lain-lain',
              icon: 'CircleEllipsis',
              color: '#64748b',
              type: 'expense',
              isDefault: true,
              createdAt: new Date().toISOString(),
            };
      await db.categories.put(defaultAnchor);
      fallbackCatId = defaultAnchor.id;
    }

    // 1. Re-route related transactions locally in Dexie
    const relatedTxs = await db.transactions.where('categoryId').equals(id).toArray();
    for (const tx of relatedTxs) {
      await db.transactions.update(tx.id, { categoryId: fallbackCatId });
    }

    // 2. Re-route related recurring expenses locally in Dexie
    const relatedRecurring = await db.recurringExpenses.where('categoryId').equals(id).toArray();
    for (const rec of relatedRecurring) {
      await db.recurringExpenses.update(rec.id, { categoryId: fallbackCatId });
    }

    // 3. Delete category budget entries locally in Dexie
    await db.budgets.where('categoryId').equals(id).delete();

    // 4. Sync re-routed data to cloud BEFORE deleting category to prevent FK violation & orphaned rows
    if (currentUser?.id) {
      const updatedTxs = await db.transactions.where('id').anyOf(relatedTxs.map((t) => t.id)).toArray();
      for (const tx of updatedTxs) {
        await syncService.pushTransaction(tx, currentUser.id);
      }
      const updatedRecurring = await db.recurringExpenses.where('id').anyOf(relatedRecurring.map((r) => r.id)).toArray();
      for (const rec of updatedRecurring) {
        await syncService.pushRecurringExpense(rec, currentUser.id);
      }
      await syncService.deleteBudgetByCategory(id, currentUser.id);
      await syncService.deleteCategory(id, currentUser.id);
    } else {
      syncService.markCategoryDeleted(id);
    }

    // 5. Delete category locally from Dexie
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
      await db.categories.bulkPut([...DEFAULT_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES]);
    });
    showToast(language === 'id' ? 'Seluruh data berhasil direset.' : 'All data successfully reset.', 'info');
  };

  // Click Date Header Quick Add Handler
  const handleAddTransactionOnDate = useCallback(
    (dateStr: string) => {
      try {
        const targetDate = new Date(dateStr);
        const now = new Date();
        targetDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

        setPresetDraft({
          id: '',
          amount: 0,
          categoryId: filterCategoriesByType(sortedCategories, 'expense')[0]?.id || sortedCategories[0]?.id || '',
          type: 'expense',
          date: targetDate.toISOString(),
          notes: '',
          paymentMethod: 'Tunai',
          createdAt: new Date().toISOString(),
        });
        navigate('/transactions/new');
      } catch {
        navigate('/transactions/new');
      }
    },
    [sortedCategories, navigate]
  );

  // Category Batch Reassignment Handler
  const handleBatchMoveTransactions = useCallback(
    async (transactionIds: string[], targetCategoryId: string) => {
      if (!transactionIds.length || !targetCategoryId) return;

      const targetCategory = categories.find((c) => c.id === targetCategoryId);
      const targetName = targetCategory ? targetCategory.name : 'kategori baru';

      try {
        for (const id of transactionIds) {
          await db.transactions.update(id, { categoryId: targetCategoryId });
        }

        if (currentUser?.id) {
          const updatedTxs = await db.transactions.where('id').anyOf(transactionIds).toArray();
          for (const tx of updatedTxs) {
            await syncService.pushTransaction(tx, currentUser.id);
          }
        }

        const msg = (t.batchMoveSuccess || '{count} transaksi berhasil dipindahkan ke kategori {name}!')
          .replace('{count}', transactionIds.length.toString())
          .replace('{name}', targetName);
        showToast(msg, 'success');
      } catch (err: any) {
        console.error('Error batch moving transactions:', err);
        showToast(
          language === 'id'
            ? 'Gagal memindahkan transaksi: ' + (err?.message || 'Terjadi kesalahan')
            : 'Failed to move transactions: ' + (err?.message || 'An error occurred'),
          'error'
        );
        throw err;
      }
    },
    [categories, currentUser?.id, language, showToast, t.batchMoveSuccess]
  );

  // Quick Preset Add Handler
  const handleSelectQuickPreset = (preset: QuickPresetItem) => {
    const now = new Date();
    setPresetDraft({
      id: '',
      amount: preset.amount,
      categoryId: preset.categoryId,
      type: preset.type || 'expense',
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

  const handleOpenNewTransaction = useCallback(() => {
    setPresetDraft(null);
    navigate('/transactions/new');
  }, [navigate]);

  return (
    <div className="min-h-screen app-surface bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200 relative overflow-x-hidden selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar (hidden on mobile when full-page transaction form or settings is active) */}
      <div className={isTransactionModalOpen || activeTab === 'settings' ? 'hidden md:block' : 'block'}>
        <Navbar
          onOpenSettings={() => navigate('/settings')}
          onOpenNewTransaction={handleOpenNewTransaction}
          activeTab={activeTab}
          onSelectTab={handleTabNavigation}
          t={t}
        />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 pb-24 md:pb-10 space-y-5">
        {/* Top Summary Banner: Liquid Glass Stats Card */}
        {activeTab === 'transactions' && (
          <div className="space-y-4">
            <div className="glass-card rounded-3xl p-5 sm:p-6">
              {/* Header Row: Label & Month Navigator */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-900/5 dark:border-white/10">
                <div className="flex items-center flex-wrap gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] flex items-center justify-center text-white shrink-0">
                    <Banknote className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 tracking-wide">
                    {incomeEnabled
                      ? isAllTime
                        ? t.cashFlowAllTime
                        : t.cashFlowThisMonth
                      : isAllTime
                      ? t.totalExpenseAllTime
                      : t.totalExpenseThisMonth}
                  </span>
                  {incomeEnabled && (
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                        cashFlowStatus === 'surplus'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          : cashFlowStatus === 'boncos'
                          ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                          : cashFlowStatus === 'no_income'
                          ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {cashFlowStatus === 'surplus'
                        ? t.statusSurplus
                        : cashFlowStatus === 'boncos'
                        ? t.statusBoncos
                        : cashFlowStatus === 'no_income'
                        ? t.statusNoIncome
                        : t.statusEven}
                    </span>
                  )}
                  {/* Privacy / Sensor Nominal Toggle Button */}
                  <button
                    type="button"
                    onClick={handleToggleHideNominals}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
                    title={hideNominals ? t.showNominal : t.hideNominal}
                    aria-label={hideNominals ? t.showNominal : t.hideNominal}
                  >
                    {hideNominals ? (
                      <EyeOff className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                  {/* Quick Income Tracking Mode Toggle */}
                  <button
                    type="button"
                    onClick={() => handleToggleIncomeEnabled(!incomeEnabled)}
                    className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                      incomeEnabled
                        ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                    }`}
                    title={incomeEnabled ? t.disableIncomeBtn : t.enableIncomeBtn}
                    aria-label={incomeEnabled ? t.disableIncomeBtn : t.enableIncomeBtn}
                  >
                    <ArrowUpDown className="w-4 h-4" />
                  </button>
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
                {/* Left: Total Expense (OFF) or Net Cash Flow (ON) */}
                <div className="lg:col-span-7 space-y-2.5">
                  {incomeEnabled ? (
                    <>
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          {t.netCashFlowLabel}
                        </span>
                        <div
                          className={`text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-none ${
                            netCashFlow < 0
                              ? 'text-rose-600 dark:text-rose-400'
                              : netCashFlow > 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {!hideNominals && (netCashFlow > 0 ? '+' : netCashFlow < 0 ? '−' : '')}
                          {formatIDR(Math.abs(netCashFlow), false, language, hideNominals)}
                        </div>
                      </div>
                      {currentMonthIncome > 0 && (
                        <div className="max-w-md space-y-1">
                          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                expenseRatioPct > 100
                                  ? 'bg-rose-500'
                                  : expenseRatioPct >= 80
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(100, expenseRatioPct)}%` }}
                            />
                          </div>
                          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            {expenseRatioPct}% {t.incomeCoveredPct}
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
                      {formatIDR(currentMonthTotal, false, language, hideNominals)}
                    </div>
                  )}
                </div>

                {/* Right: Inline Metrics */}
                <div className="lg:col-span-5 grid grid-cols-2 gap-x-6 gap-y-3 w-full lg:border-l lg:border-slate-900/10 dark:lg:border-white/10 lg:pl-8">
                  {incomeEnabled && (
                    <>
                      <div>
                        <div className="flex items-center space-x-1.5 text-xs font-medium text-slate-400">
                          <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="truncate">{t.totalIncomeLabel}</span>
                        </div>
                        <div className="text-base sm:text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 tracking-tight truncate">
                          {!hideNominals && currentMonthIncome > 0 ? '+' : ''}
                          {formatIDR(currentMonthIncome, false, language, hideNominals)}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center space-x-1.5 text-xs font-medium text-slate-400">
                          <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />
                          <span className="truncate">{t.totalExpenseLabel}</span>
                        </div>
                        <div className="text-base sm:text-xl font-bold text-rose-600 dark:text-rose-400 mt-0.5 tracking-tight truncate">
                          {!hideNominals && currentMonthTotal > 0 ? '−' : ''}
                          {formatIDR(currentMonthTotal, false, language, hideNominals)}
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <div className="flex items-center space-x-1.5 text-xs font-medium text-slate-400">
                      <Calendar className="w-3.5 h-3.5 text-amber-500" />
                      <span className="truncate">{t.kpiDailyAverage}</span>
                    </div>
                    <div className="text-base sm:text-xl font-bold text-slate-800 dark:text-slate-100 mt-0.5 tracking-tight truncate">
                      {formatIDR(currentMonthDailyAverage, false, language, hideNominals)}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center space-x-1.5 text-xs font-medium text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="truncate">
                        {isCurrentMonth ? (t.kpiToday || 'Hari Ini') : t.kpiHighestExpense}
                      </span>
                    </div>
                    <div className="text-base sm:text-xl font-bold text-slate-800 dark:text-slate-100 mt-0.5 tracking-tight truncate">
                      {formatIDR(
                        isCurrentMonth ? todaySpent : highestExpenseInMonth,
                        false,
                        language,
                        hideNominals
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Presets Bar */}
            <QuickPresets
              categories={visibleSortedCategories}
              transactions={visibleTransactions}
              onSelectPreset={handleSelectQuickPreset}
              incomeEnabled={incomeEnabled}
              hideNominals={hideNominals}
              lang={language}
              t={t}
            />
          </div>
        )}

        {/* View Switcher Content with Suspense Lazy Loading */}
        {activeTab === 'transactions' && (
          <TransactionList
            transactions={visibleTransactions}
            categories={visibleSortedCategories}
            selectedMonthFilter={selectedMonthFilter}
            onEditTransaction={(tx) => {
              navigate(`/transactions/edit/${tx.id}`);
            }}
            onDeleteTransaction={handleDeleteTransaction}
            onOpenNewTransaction={handleOpenNewTransaction}
            onAddTransactionOnDate={handleAddTransactionOnDate}
            incomeEnabled={incomeEnabled}
            hideNominals={hideNominals}
            lang={language}
            t={t}
          />
        )}

        {activeTab === 'analytics' && (
          <ErrorBoundary lang={language}>
            <Suspense fallback={<ViewLoaderFallback />}>
              <AnalyticsView
                transactions={allTransactionsRaw === undefined ? undefined : visibleAllTransactions}
                categories={visibleSortedCategories}
                darkMode={darkMode}
                lang={language}
                t={t}
                onNavigateToBudget={() => navigate('/budget')}
              />
            </Suspense>
          </ErrorBoundary>
        )}

        {activeTab === 'budget' && (
          <ErrorBoundary lang={language}>
            <Suspense fallback={<ViewLoaderFallback />}>
              <BudgetManager
                categories={visibleSortedCategories}
                transactions={allTransactions}
                allTransactions={allTransactions}
                onUpdateCategoryBudget={handleUpdateCategoryBudget}
                onBatchMoveTransactions={handleBatchMoveTransactions}
                onEditTransaction={(tx) => {
                  navigate(`/transactions/edit/${tx.id}`);
                }}
                incomeEnabled={incomeEnabled}
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
                transactions={visibleAllTransactions}
                onSaveCategory={handleSaveCategory}
                onDeleteCategory={handleDeleteCategory}
                onBatchMoveTransactions={handleBatchMoveTransactions}
                onEditTransaction={(tx) => {
                  navigate(`/transactions/edit/${tx.id}`);
                }}
                sortMode={categorySortMode}
                onChangeSortMode={handleSortModeChange}
                onReorderCategories={handleReorderCategories}
                incomeEnabled={incomeEnabled}
                hideNominals={hideNominals}
                lang={language}
                t={t}
              />
            </Suspense>
          </ErrorBoundary>
        )}

        {activeTab === 'settings' && (
          <ErrorBoundary lang={language}>
            <Suspense fallback={<ViewLoaderFallback />}>
              <SettingsView
                language={language}
                onChangeLanguage={handleLanguageChange}
                darkMode={darkMode}
                onToggleDarkMode={() => {
                  const next = !darkMode;
                  setDarkMode(next);
                  themeService.updateSettings({ mode: next ? 'dark' : 'light' });
                }}
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
                onBackToTransactions={() => handleTabNavigation('transactions')}
                incomeEnabled={incomeEnabled}
                onToggleIncomeEnabled={handleToggleIncomeEnabled}
                transactionCount={visibleAllTransactions.length}
                categoryCount={visibleSortedCategories.length}
                t={t}
              />
            </Suspense>
          </ErrorBoundary>
        )}
      </main>

      {/* Mobile Floating Bottom Navigation (Symmetrical 5 Direct Tabs) */}
      {!isTransactionModalOpen && (
        <BottomNav
          activeTab={activeTab}
          onSelectTab={handleTabNavigation}
          onOpenNewTransaction={handleOpenNewTransaction}
          t={t}
        />
      )}

      {/* Transaction Modal (Add / Edit) */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={handleCloseModals}
        onSave={handleSaveTransaction}
        onSaveBatch={handleSaveBatchTransactions}
        onDelete={handleDeleteTransaction}
        categories={sortedCategories}
        initialData={editingTransaction}
        incomeEnabled={incomeEnabled}
        onOpenCategoryManager={() => {
          navigate('/categories');
        }}
        lang={language}
        t={t}
      />

      {/* Excel Center Modal (Import & Export) */}
      {isExcelModalOpen && (
        <Suspense fallback={null}>
          <ExcelModal
            isOpen={isExcelModalOpen}
            onClose={handleCloseModals}
            transactions={transactions}
            categories={sortedCategories}
            lang={language}
            t={t}
            onDataChanged={(msg) => {
              if (msg) showToast(msg, 'success');
              if (currentUser?.id) {
                syncService.syncAll(currentUser.id);
              }
            }}
          />
        </Suspense>
      )}

      {/* Authentication Modal */}
      {isAuthModalOpen && (
        <Suspense fallback={null}>
          <AuthModal
            isOpen={isAuthModalOpen}
            onClose={handleCloseModals}
            onSuccess={async (user) => {
              setCurrentUser(user);
              handleCloseModals();
              showToast(t.authSuccessLogin, 'success');
              if (user?.id) {
                const syncRes = await syncService.syncAll(user.id);
                if (!syncRes.success) {
                  showToast(syncRes.error || t.cloudSyncFailed, 'error');
                }
              }
            }}
            t={t}
          />
        </Suspense>
      )}

      {/* Month & Year Picker Modal */}
      {isMonthPickerOpen && (
        <Suspense fallback={null}>
          <MonthYearPickerModal
            isOpen={isMonthPickerOpen}
            onClose={() => setIsMonthPickerOpen(false)}
            selectedMonth={selectedMonthFilter}
            onSelectMonth={(newMonth) => handleSelectMonthFilter(newMonth)}
            lang={language}
          />
        </Suspense>
      )}

      {/* In-App Toast Feedback Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;




