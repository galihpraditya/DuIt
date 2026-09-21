import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { Loader2, PieChart as PieIcon } from 'lucide-react';
import type { Category, Transaction } from '../../types';
import { subDays, format } from 'date-fns';
import { id as idLocale, enUS as enLocale } from 'date-fns/locale';
import type { Language, Translations } from '../../constants/translations';
import {
  type PeriodOption,
  calculatePeriodIntervals,
  calculateAnalytics,
} from './analyticsCalculator';
import { KpiCards } from './KpiCards';
import { TrendChart } from './TrendChart';
import { CategoryPieChart } from './CategoryPieChart';
import { CategoryRankingTable } from './CategoryRankingTable';

interface AnalyticsViewProps {
  transactions?: Transaction[];
  categories: Category[];
  darkMode?: boolean;
  lang?: Language;
  t: Translations;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  transactions: fallbackTransactions,
  categories,
  darkMode = false,
  lang = 'id',
  t,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>('this_month');
  const [customStartDate, setCustomStartDate] = useState(() => format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [customEndDate, setCustomEndDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [chartType, setChartType] = useState<'bar' | 'area'>('bar');

  const locale = lang === 'en' ? enLocale : idLocale;

  // 1. Hitung Rentang Tanggal Aktif & Rentang Pembanding (Previous Interval)
  const { currentInterval, previousInterval, periodLabel } = useMemo(() => {
    return calculatePeriodIntervals(selectedPeriod, customStartDate, customEndDate, t, locale);
  }, [selectedPeriod, customStartDate, customEndDate, t, locale]);

  // 2. Data Transaksi: Gunakan fallbackTransactions dari props jika tersedia, atau query Dexie secara mandiri
  const dexieTransactions = useLiveQuery(
    () => (fallbackTransactions !== undefined ? undefined : db.transactions.toArray()),
    [fallbackTransactions]
  );

  const activeTransactions = fallbackTransactions ?? dexieTransactions;

  // 3. Kalkulasi Data Analitik secara Sinkron & Cepat (0ms) di useMemo tanpa Unmount Thrashing
  const analyticsData = useMemo(() => {
    if (!activeTransactions) return null;
    return calculateAnalytics(
      activeTransactions,
      categories,
      currentInterval,
      previousInterval,
      periodLabel,
      selectedPeriod,
      locale
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

  // Hanya tampilkan loader jika data awal Dexie belum tersedia sama sekali pada cold load
  if (!analyticsData) {
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
    <div className="space-y-6">
      {/* Timeframe Selector Header */}
      <div className="glass-card p-5 rounded-3xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
              <PieIcon className="w-5 h-5 text-emerald-500" />
              <span>{t.analyticsHeaderTitle}</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t.activePeriodLabel}{' '}
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">{periodLabel}</span>
            </p>
          </div>

          {/* Quick Period Buttons */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-x-auto whitespace-nowrap scrollbar-none">
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
                onClick={() => setSelectedPeriod(tab.id as PeriodOption)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedPeriod === tab.id
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Range Picker */}
        {selectedPeriod === 'custom' && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-slate-500 dark:text-slate-400">{t.fromLabel}</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200"
              />
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-slate-500 dark:text-slate-400">{t.toLabel}</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>
        )}
      </div>

      {/* KPI Cards Grid (Memoized) */}
      <KpiCards
        currentTotal={currentTotal}
        percentageChange={percentageChange}
        averagePerDay={averagePerDay}
        highestExpense={highestExpense}
        txCount={txCount}
        lang={lang}
        t={t}
      />

      {/* Charts Section: 2 Columns with min-w-0 for reliable CSS grid rendering */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Trend Over Time (Memoized) */}
        <div className="lg:col-span-7 min-w-0">
          <TrendChart
            trendData={trendData}
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
        lang={lang}
        t={t}
      />
    </div>
  );
};
