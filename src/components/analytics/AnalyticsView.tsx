import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { Loader2, PieChart as PieIcon } from 'lucide-react';
import type { Category, Transaction } from '../../types';
import { subDays, format, differenceInCalendarDays } from 'date-fns';
import { id as idLocale, enUS as enLocale } from 'date-fns/locale';
import type { Language, Translations } from '../../constants/translations';
import {
  type PeriodOption,
  calculatePeriodIntervals,
  calculateAnalytics,
  calculateCashFlowTrend,
  calculateSafeToSpend,
  parseTxTime,
} from './analyticsCalculator';
import { calculateCashFlowSummary, filterCategoriesByType } from '../../utils/transactionHelpers';
import { KpiCards } from './KpiCards';
import { CashFlowCard } from './CashFlowCard';
import { TrendChart } from './TrendChart';
import { CategoryPieChart } from './CategoryPieChart';
import { CategoryRankingTable } from './CategoryRankingTable';
import { SafeToSpendCard } from './SafeToSpendCard';

type AnalyticsMode = 'cashflow' | 'expense' | 'income';

interface AnalyticsViewProps {
  transactions?: Transaction[];
  categories: Category[];
  incomeEnabled?: boolean;
  hideNominals?: boolean;
  darkMode?: boolean;
  lang?: Language;
  t: Translations;
  onNavigateToBudget?: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  transactions: fallbackTransactions,
  categories,
  incomeEnabled = false,
  hideNominals = false,
  darkMode = false,
  lang = 'id',
  t,
  onNavigateToBudget,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>('this_month');
  const [analyticsMode, setAnalyticsMode] = useState<AnalyticsMode>('cashflow');
  const [customStartDate, setCustomStartDate] = useState(() => format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [customEndDate, setCustomEndDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [chartType, setChartType] = useState<'bar' | 'area'>('bar');

  const effectiveMode: AnalyticsMode = incomeEnabled ? analyticsMode : 'expense';
  const activeBreakdownType = effectiveMode === 'income' ? 'income' : 'expense';

  const locale = lang === 'en' ? enLocale : idLocale;

  // 1. Hitung Rentang Tanggal Aktif & Rentang Pembanding (Previous Interval)
  const { currentInterval, previousInterval, periodLabel } = useMemo(() => {
    return calculatePeriodIntervals(selectedPeriod, customStartDate, customEndDate, t, locale);
  }, [selectedPeriod, customStartDate, customEndDate, t, locale]);

  // 2. Data Transaksi: Gunakan fallbackTransactions dari props jika tersedia, atau query Dexie secara mandiri
  const dexieTransactions = useLiveQuery(
    () => (fallbackTransactions !== undefined ? Promise.resolve([] as Transaction[]) : db.transactions.toArray()),
    [fallbackTransactions]
  );

  const activeTransactions = fallbackTransactions ?? dexieTransactions;

  // 3. Kalkulasi Data Analitik secara Sinkron & Cepat (0ms) di useMemo tanpa Unmount Thrashing
  const expenseAnalytics = useMemo(() => {
    if (!activeTransactions) return null;
    return calculateAnalytics(
      activeTransactions,
      categories,
      currentInterval,
      previousInterval,
      periodLabel,
      selectedPeriod,
      locale,
      'expense'
    );
  }, [
    activeTransactions,
    categories,
    currentInterval,
    previousInterval,
    periodLabel,
    selectedPeriod,
    locale,
  ]);

  const incomeAnalytics = useMemo(() => {
    if (!activeTransactions || !incomeEnabled) return null;
    return calculateAnalytics(
      activeTransactions,
      categories,
      currentInterval,
      previousInterval,
      periodLabel,
      selectedPeriod,
      locale,
      'income'
    );
  }, [
    activeTransactions,
    incomeEnabled,
    categories,
    currentInterval,
    previousInterval,
    periodLabel,
    selectedPeriod,
    locale,
  ]);

  const cashFlowSummary = useMemo(() => {
    if (!activeTransactions || !incomeEnabled) return null;
    const startMs = currentInterval.start.getTime();
    const endMs = currentInterval.end.getTime();
    const inPeriod = activeTransactions.filter((tx) => {
      const time = parseTxTime(tx.date);
      return time !== null && time >= startMs && time <= endMs;
    });
    return calculateCashFlowSummary(inPeriod);
  }, [activeTransactions, incomeEnabled, currentInterval]);

  const cashFlowTrend = useMemo(() => {
    if (!activeTransactions || !incomeEnabled || effectiveMode !== 'cashflow') return [];
    return calculateCashFlowTrend(activeTransactions, currentInterval, selectedPeriod, locale);
  }, [activeTransactions, incomeEnabled, effectiveMode, currentInterval, selectedPeriod, locale]);

  const analyticsData = activeBreakdownType === 'income' ? incomeAnalytics : expenseAnalytics;
  const typedCategories = useMemo(
    () => filterCategoriesByType(categories, activeBreakdownType),
    [categories, activeBreakdownType]
  );

  const isCurrentMonth = selectedPeriod === 'this_month';

  const safeData = useMemo(() => {
    if (!expenseAnalytics) return null;
    return calculateSafeToSpend(
      categories,
      expenseAnalytics.currentTotal,
      expenseAnalytics.averagePerDay,
      isCurrentMonth ? new Date() : currentInterval.start
    );
  }, [categories, expenseAnalytics, isCurrentMonth, currentInterval.start]);

  const budgetTarget = useMemo(() => {
    if (!safeData?.hasBudget || !safeData.totalMonthlyBudget) return 0;
    const totalDays = differenceInCalendarDays(currentInterval.end, currentInterval.start) + 1;
    const isYearly = selectedPeriod === 'this_year' || totalDays > 365;
    const isWeekly = !isYearly && totalDays > 70;

    if (isYearly) {
      return safeData.totalMonthlyBudget;
    }
    if (isWeekly) {
      return Math.round((safeData.totalMonthlyBudget / 30) * 7);
    }
    const daysInMonth = safeData.totalDaysInMonth || 30;
    return Math.round(safeData.totalMonthlyBudget / daysInMonth);
  }, [safeData, currentInterval, selectedPeriod]);

  // Hanya tampilkan loader jika data awal Dexie belum tersedia sama sekali pada cold load
  if (!analyticsData || !safeData) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="w-9 h-9 text-emerald-500 animate-spin" />
        <span className="text-sm text-slate-500 dark:text-slate-400 font-medium animate-pulse">
          {lang === 'en' ? 'Loading analytics...' : 'Memuat analisis...'}
        </span>
      </div>
    );
  }

  const {
    currentTotal,
    highestExpense,
    averagePerDay,
    percentageChange,
    categoryData,
    trendData,
    txCount,
  } = analyticsData;

  return (
    <div className="space-y-5">
      {/* Compact Timeframe & Mode Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-4 rounded-2xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
              <PieIcon className="w-4 h-4 text-emerald-500" />
              <span>{t.analyticsHeaderTitle}</span>
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              {periodLabel}
            </p>
          </div>

          {/* Quick Period Buttons */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto whitespace-nowrap scrollbar-none">
            {[
              { id: 'today', label: t.periodToday },
              { id: '7days', label: t.period7Days },
              { id: '30days', label: t.period30Days },
              { id: 'this_month', label: t.periodThisMonth },
              { id: 'last_month', label: t.periodLastMonth },
              { id: 'this_year', label: t.periodThisYear },
              { id: 'custom', label: t.periodCustom },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedPeriod(tab.id as PeriodOption)}
                className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  selectedPeriod === tab.id
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Analytics Mode Switcher (Only when incomeEnabled) */}
        {incomeEnabled && (
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80 w-fit">
            {[
              { id: 'cashflow', label: t.analyticsModeCashFlow },
              { id: 'expense', label: t.analyticsModeExpense },
              { id: 'income', label: t.analyticsModeIncome },
            ].map((modeTab) => (
              <button
                key={modeTab.id}
                type="button"
                onClick={() => setAnalyticsMode(modeTab.id as AnalyticsMode)}
                className={`min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  effectiveMode === modeTab.id
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {modeTab.label}
              </button>
            ))}
          </div>
        )}

        {/* Custom Range Picker */}
        {selectedPeriod === 'custom' && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-slate-600 dark:text-slate-400">{t.fromLabel}</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200"
              />
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-slate-600 dark:text-slate-400">{t.toLabel}</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>
        )}
      </div>

      {/* Executive Summary Layer: CashFlowCard in Cash Flow mode, KpiCards in single-type modes */}
      {incomeEnabled && effectiveMode === 'cashflow' && cashFlowSummary ? (
        <CashFlowCard
          summary={cashFlowSummary}
          hideNominals={hideNominals}
          lang={lang}
          t={t}
        />
      ) : (
        <KpiCards
          currentTotal={currentTotal}
          percentageChange={percentageChange}
          averagePerDay={averagePerDay}
          highestExpense={highestExpense}
          txCount={txCount}
          variant={activeBreakdownType}
          hideNominals={hideNominals}
          lang={lang}
          t={t}
        />
      )}

      {/* Safe-to-Spend & Forecast Burn Rate Card (Only in expense / cashflow modes) */}
      {effectiveMode !== 'income' && (
        <SafeToSpendCard
          safeData={safeData}
          isCurrentMonth={isCurrentMonth}
          onNavigateToBudget={onNavigateToBudget}
          lang={lang}
          t={t}
        />
      )}

      {/* Charts Section: 2 Columns with min-w-0 for reliable CSS grid rendering */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Trend Over Time (Memoized) */}
        <div className="lg:col-span-7 min-w-0">
          <TrendChart
            trendData={trendData}
            cashFlowData={cashFlowTrend}
            mode={effectiveMode === 'cashflow' ? 'cashflow' : 'single'}
            titleOverride={
              effectiveMode === 'cashflow'
                ? t.cashFlowTrendTitle
                : effectiveMode === 'income'
                ? t.incomeTrendTitle
                : t.trendChartTitle
            }
            seriesLabel={effectiveMode === 'income' ? t.kpiTotalIncome : t.kpiTotalExpense}
            averagePerDay={effectiveMode === 'cashflow' ? undefined : averagePerDay}
            budgetTarget={effectiveMode === 'expense' ? budgetTarget : undefined}
            chartType={chartType}
            onChangeChartType={setChartType}
            darkMode={darkMode}
            lang={lang}
            t={t}
          />
        </div>

        {/* Right Column (5 cols): Donut Chart Breakdown (Memoized with Smart Slicing) */}
        <div className="lg:col-span-5 min-w-0">
          <CategoryPieChart
            categoryData={categoryData}
            currentTotal={currentTotal}
            darkMode={darkMode}
            lang={lang}
            t={t}
          />
        </div>
      </div>

      {/* Top Ranking Categories Detail Table (Memoized) */}
      <CategoryRankingTable
        categoryData={categoryData}
        currentTotal={currentTotal}
        categories={typedCategories}
        lang={lang}
        t={t}
      />
    </div>
  );
};
