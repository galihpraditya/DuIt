import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { Loader2 } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
} from 'recharts';
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  PieChart as PieIcon,
  BarChart3,
  Zap,
  Tag,
} from 'lucide-react';
import type { Category, Transaction } from '../../types';
import { DynamicIcon } from '../common/IconPicker';
import { formatIDR } from '../../utils/formatters';
import {
  subDays,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  endOfYear,
  startOfWeek,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  differenceInCalendarDays,
  parseISO,
  format,
} from 'date-fns';
import { id as idLocale, enUS as enLocale } from 'date-fns/locale';
import type { Language, Translations } from '../../constants/translations';

interface AnalyticsViewProps {
  transactions?: Transaction[];
  categories: Category[];
  darkMode?: boolean;
  lang?: Language;
  t: Translations;
}

type PeriodOption = 'today' | '7days' | '30days' | 'this_month' | 'last_month' | 'this_year' | 'custom';

interface CategoryDataEntry {
  id: string;
  name: string;
  icon: string;
  color: string;
  total: number;
  count: number;
}

interface TrendDataEntry {
  label: string;
  total: number;
}

interface AnalyticsCalculatedData {
  periodLabel: string;
  currentTotal: number;
  highestExpense: number;
  averagePerDay: number;
  percentageChange: number;
  categoryData: CategoryDataEntry[];
  trendData: TrendDataEntry[];
  txCount: number;
}

// Parse tanggal transaksi secara toleran; kembalikan timestamp (ms) atau null jika tidak valid
const parseTxTime = (dateStr: string): number | null => {
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d.getTime();
  } catch {
    return null;
  }
};

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  transactions: fallbackTransactions,
  categories,
  darkMode = false,
  lang = 'id',
  t,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>('this_month');
  const [customStartDate, setCustomStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [customEndDate, setCustomEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [chartType, setChartType] = useState<'bar' | 'area'>('bar');

  const locale = lang === 'en' ? enLocale : idLocale;

  // In-memory cache agar navigasi antar-periode yang sudah dihitung instan 0ms
  const cacheRef = useRef<Map<string, AnalyticsCalculatedData>>(new Map());

  // 1. Hitung Rentang Tanggal Aktif & Rentang Pembanding (Previous Interval)
  const { currentInterval, previousInterval, periodLabel: computedPeriodLabel } = useMemo(() => {
    const now = new Date();
    let start = startOfMonth(now);
    let end = endOfMonth(now);
    let prevStart = startOfMonth(subMonths(now, 1));
    let prevEnd = endOfMonth(subMonths(now, 1));
    let label = t.periodThisMonth;

    if (selectedPeriod === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      prevStart = subDays(start, 1);
      prevEnd = subDays(end, 1);
      label = t.periodToday;
    } else if (selectedPeriod === '7days') {
      start = subDays(now, 6);
      end = now;
      prevStart = subDays(start, 7);
      prevEnd = subDays(start, 1);
      label = t.period7Days;
    } else if (selectedPeriod === '30days') {
      start = subDays(now, 29);
      end = now;
      prevStart = subDays(start, 30);
      prevEnd = subDays(start, 1);
      label = t.period30Days;
    } else if (selectedPeriod === 'last_month') {
      start = startOfMonth(subMonths(now, 1));
      end = endOfMonth(subMonths(now, 1));
      prevStart = startOfMonth(subMonths(now, 2));
      prevEnd = endOfMonth(subMonths(now, 2));
      label = t.periodLastMonth;
    } else if (selectedPeriod === 'this_year') {
      start = startOfYear(now);
      end = endOfYear(now);
      prevStart = startOfYear(subMonths(now, 12));
      prevEnd = endOfYear(subMonths(now, 12));
      label = t.periodThisYear;
    } else if (selectedPeriod === 'custom') {
      let parsedStart = parseISO(customStartDate);
      let parsedEnd = parseISO(customEndDate);
      if (parsedStart > parsedEnd) {
        const temp = parsedStart;
        parsedStart = parsedEnd;
        parsedEnd = temp;
      }
      start = new Date(parsedStart.getFullYear(), parsedStart.getMonth(), parsedStart.getDate(), 0, 0, 0);
      end = new Date(parsedEnd.getFullYear(), parsedEnd.getMonth(), parsedEnd.getDate(), 23, 59, 59);
      const diffDays = Math.max(1, differenceInCalendarDays(end, start) + 1);
      prevStart = subDays(start, diffDays);
      prevEnd = subDays(start, 1);
      label = `${format(start, 'dd MMM yyyy', { locale })} - ${format(end, 'dd MMM yyyy', { locale })}`;
    }

    return {
      currentInterval: { start, end },
      previousInterval: { start: prevStart, end: prevEnd },
      periodLabel: label,
    };
  }, [selectedPeriod, customStartDate, customEndDate, t, locale]);

  // Batas ISO string untuk IndexedDB range query
  const minDateISO = useMemo(() => {
    const minD = currentInterval.start < previousInterval.start ? currentInterval.start : previousInterval.start;
    return minD.toISOString();
  }, [currentInterval, previousInterval]);

  const maxDateISO = useMemo(() => {
    const maxD = currentInterval.end > previousInterval.end ? currentInterval.end : previousInterval.end;
    return maxD.toISOString();
  }, [currentInterval, previousInterval]);

  // 2. DEXIE INDEXED QUERY: Hanya ambil data transaksi di dalam rentang waktu yang diperlukan
  const dexieQueriedTransactions = useLiveQuery(
    () => db.transactions.where('date').between(minDateISO, maxDateISO, true, true).toArray(),
    [minDateISO, maxDateISO]
  );

  const activeTransactions = dexieQueriedTransactions !== undefined ? dexieQueriedTransactions : fallbackTransactions || [];

  const [isCalculating, setIsCalculating] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsCalculatedData | null>(null);

  useEffect(() => {
    if (dexieQueriedTransactions === undefined && !fallbackTransactions) {
      setIsCalculating(true);
      return;
    }

    const cacheKey = `${selectedPeriod}_${minDateISO}_${maxDateISO}_${activeTransactions.length}`;
    if (cacheRef.current.has(cacheKey)) {
      setAnalyticsData(cacheRef.current.get(cacheKey)!);
      setIsCalculating(false);
      return;
    }

    setIsCalculating(true);

    const timer = setTimeout(() => {
      const categoryMap = new Map(categories.map((c) => [c.id, c]));
      const start = currentInterval.start;
      const end = currentInterval.end;
      const prevStart = previousInterval.start;
      const prevEnd = previousInterval.end;
      const label = computedPeriodLabel;

      const startTime = start.getTime();
      const endTime = end.getTime();
      const prevStartTime = prevStart.getTime();
      const prevEndTime = prevEnd.getTime();

      const currentPeriodTxs: Transaction[] = [];
      const previousPeriodTxs: Transaction[] = [];
      const txTimes = new Map<string, number>();

      for (const tx of activeTransactions) {
        const time = parseTxTime(tx.date);
        if (time === null) continue;
        txTimes.set(tx.id, time);

        if (time >= startTime && time <= endTime) {
          currentPeriodTxs.push(tx);
        }
        if (time >= prevStartTime && time <= prevEndTime) {
          previousPeriodTxs.push(tx);
        }
      }

      // KPI Metrics
      let currentTotal = 0;
      let highestExpense = 0;
      for (const tx of currentPeriodTxs) {
        currentTotal += tx.amount;
        if (tx.amount > highestExpense) highestExpense = tx.amount;
      }

      let previousTotal = 0;
      for (const tx of previousPeriodTxs) {
        previousTotal += tx.amount;
      }

      let percentageChange = 0;
      if (previousTotal === 0) {
        percentageChange = currentTotal > 0 ? 100 : 0;
      } else {
        percentageChange = Math.round(((currentTotal - previousTotal) / previousTotal) * 100);
      }

      const now = new Date();
      let days = 1;
      if (selectedPeriod === 'today') {
        days = 1;
      } else if (selectedPeriod === '7days') {
        days = 7;
      } else if (selectedPeriod === '30days') {
        days = 30;
      } else if (selectedPeriod === 'this_month') {
        days = Math.max(1, now.getDate());
      } else if (selectedPeriod === 'last_month') {
        days = Math.max(1, end.getDate());
      } else if (selectedPeriod === 'this_year') {
        days = Math.max(1, differenceInCalendarDays(now, start) + 1);
      } else if (selectedPeriod === 'custom') {
        const effectiveEnd = end > now ? now : end;
        if (effectiveEnd >= start) {
          days = Math.max(1, differenceInCalendarDays(effectiveEnd, start) + 1);
        } else {
          days = Math.max(1, differenceInCalendarDays(end, start) + 1);
        }
      } else {
        days = Math.max(1, differenceInCalendarDays(end, start) + 1);
      }
      const averagePerDay = Math.round(currentTotal / days);

      // Category Data
      const catMap = new Map<string, CategoryDataEntry>();
      for (const tx of currentPeriodTxs) {
        const cat = categoryMap.get(tx.categoryId) || {
          id: 'other',
          name: 'Lain-lain',
          icon: 'CircleEllipsis',
          color: '#64748b',
        };
        const existing = catMap.get(cat.id) || {
          id: cat.id,
          name: cat.name,
          icon: cat.icon,
          color: cat.color,
          total: 0,
          count: 0,
        };
        existing.total += tx.amount;
        existing.count += 1;
        catMap.set(cat.id, existing);
      }
      const categoryData = Array.from(catMap.values()).sort((a, b) => b.total - a.total);

      // Trend Data (Dioptimasi untuk interval panjang)
      let buckets: { key: string; label: string; total: number }[] = [];
      const totalDays = differenceInCalendarDays(end, start) + 1;

      if (selectedPeriod === 'this_year' || totalDays > 365) {
        buckets = eachMonthOfInterval({ start, end }).map((m) => ({
          key: format(m, 'yyyy-MM'),
          label: format(m, 'MMM', { locale }),
          total: 0,
        }));
      } else if (totalDays > 70) {
        buckets = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 }).map((w) => ({
          key: format(w, 'yyyy-MM-dd'),
          label: format(w, 'dd MMM', { locale }),
          total: 0,
        }));
      } else {
        buckets = eachDayOfInterval({ start, end }).map((d) => ({
          key: format(d, 'yyyy-MM-dd'),
          label: format(d, 'dd MMM', { locale }),
          total: 0,
        }));
      }

      if (buckets.length > 0) {
        const keyIndex = new Map<string, number>();
        buckets.forEach((b, i) => keyIndex.set(b.key, i));

        for (const tx of currentPeriodTxs) {
          const time = txTimes.get(tx.id);
          if (time === undefined || time < startTime || time > endTime) continue;

          let key: string;
          if (selectedPeriod === 'this_year' || totalDays > 365) {
            key = format(time, 'yyyy-MM');
          } else if (keyIndex.has(format(time, 'yyyy-MM-dd'))) {
            key = format(time, 'yyyy-MM-dd');
          } else {
            key = format(startOfWeek(time, { weekStartsOn: 1 }), 'yyyy-MM-dd');
          }

          const idx = keyIndex.get(key);
          if (idx !== undefined && buckets[idx]) {
            buckets[idx].total += tx.amount;
          }
        }
      }
      const trendData = buckets.map(({ label, total }) => ({ label, total }));

      const result: AnalyticsCalculatedData = {
        periodLabel: label,
        currentTotal,
        highestExpense,
        averagePerDay,
        percentageChange,
        categoryData,
        trendData,
        txCount: currentPeriodTxs.length,
      };

      cacheRef.current.set(cacheKey, result);
      setAnalyticsData(result);
      setIsCalculating(false);
    }, 10);

    return () => clearTimeout(timer);
  }, [
    activeTransactions,
    categories,
    selectedPeriod,
    currentInterval,
    previousInterval,
    computedPeriodLabel,
    minDateISO,
    maxDateISO,
    t,
    locale,
    dexieQueriedTransactions,
    fallbackTransactions
  ]);

  const tooltipStyle = useMemo(() => {
    return {
      borderRadius: '14px',
      border: darkMode ? '1px solid rgba(255,255,255,0.12)' : '1px solid #e2e8f0',
      boxShadow: '0 1px 2px rgba(15,23,42,0.06), 0 12px 32px -12px rgba(15,23,42,0.18)',
      backgroundColor: darkMode ? '#0f172a' : '#ffffff',
      color: darkMode ? '#f8fafc' : '#0f172a',
      fontSize: '12px',
      fontWeight: '600',
    };
  }, [darkMode]);

  if (isCalculating || !analyticsData) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="w-9 h-9 text-emerald-500 animate-spin" />
        <span className="text-sm text-slate-500 dark:text-slate-400 font-medium animate-pulse">
          {lang === 'en' ? 'Processing analytics data...' : 'Memproses analisis data...'}
        </span>
      </div>
    );
  }

  const {
    periodLabel,
    currentTotal,
    highestExpense,
    averagePerDay,
    percentageChange,
    categoryData,
    trendData,
    txCount
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
              {t.activePeriodLabel} <span className="font-semibold text-emerald-600 dark:text-emerald-400">{periodLabel}</span>
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
                className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer active:scale-95 ${
                  selectedPeriod === tab.id
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
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

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Spending */}
        <div className="bg-emerald-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_12px_32px_-12px_rgba(5,150,105,0.45)] rounded-3xl p-4 sm:p-5 text-white relative overflow-hidden flex flex-col justify-between">
          <div>
            <span className="text-xs font-medium text-emerald-100 block">{t.kpiTotalExpense}</span>
            <div className="text-xl sm:text-2xl font-extrabold mt-1 tracking-tight">
              {formatIDR(currentTotal, false, lang)}
            </div>
          </div>
          <div className="mt-2 flex items-center text-[11px] font-semibold text-emerald-100">
            {percentageChange > 0 ? (
              <span className="inline-flex items-center text-rose-200 bg-rose-950/60 px-2 py-0.5 rounded-md mr-1.5">
                <TrendingUp className="w-3 h-3 mr-0.5" /> +{percentageChange}%
              </span>
            ) : percentageChange < 0 ? (
              <span className="inline-flex items-center text-emerald-200 bg-emerald-950/60 px-2 py-0.5 rounded-md mr-1.5">
                <TrendingDown className="w-3 h-3 mr-0.5" /> {percentageChange}%
              </span>
            ) : (
              <span className="mr-1.5">0%</span>
            )}
            <span>{t.kpiVsPrevious}</span>
          </div>
        </div>

        {/* Card 2: Daily Average */}
        <div className="glass-card rounded-3xl p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{t.kpiDailyAverage}</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 mt-2">
            {formatIDR(averagePerDay, false, lang)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{t.kpiDailyAvgDesc}</p>
        </div>

        {/* Card 3: Highest Single Expense */}
        <div className="glass-card rounded-3xl p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{t.kpiHighestExpense}</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold text-rose-600 dark:text-rose-400 mt-2">
            {formatIDR(highestExpense, false, lang)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{t.kpiHighestExpenseDesc}</p>
        </div>

        {/* Card 4: Transaction Count */}
        <div className="glass-card rounded-3xl p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{t.kpiFrequency}</span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 mt-2">
            {txCount} <span className="text-xs font-normal text-slate-400">{t.kpiTimes}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{t.kpiFreqDesc}</p>
        </div>
      </div>

      {/* Charts Section: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Trend Over Time */}
        <div className="lg:col-span-7 glass-card p-5 rounded-3xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-emerald-500" />
                <span>{t.trendChartTitle}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">{t.trendChartDesc}</p>
            </div>
            <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setChartType('bar')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  chartType === 'bar'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {t.chartBar}
              </button>
              <button
                onClick={() => setChartType('area')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  chartType === 'area'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {t.chartArea}
              </button>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full pt-2">
            {trendData.length === 0 || currentTotal === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                {t.noDataPeriod}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'bar' ? (
                  <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={24} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                      tickFormatter={(v) => (v >= 1000000 ? `${v / 1000000}jt` : v >= 1000 ? `${v / 1000}k` : v)}
                    />
                    <Tooltip
                      formatter={(val: any) => [formatIDR(Number(val), false, lang), t.kpiTotalExpense]}
                      contentStyle={tooltipStyle}
                    />
                    <Bar dataKey="total" fill="#10b981" radius={[6, 6, 0, 0]} isAnimationActive={trendData.length < 30} />
                  </BarChart>
                ) : (
                  <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={24} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                      tickFormatter={(v) => (v >= 1000000 ? `${v / 1000000}jt` : v >= 1000 ? `${v / 1000}k` : v)}
                    />
                    <Tooltip
                      formatter={(val: any) => [formatIDR(Number(val), false, lang), t.kpiTotalExpense]}
                      contentStyle={tooltipStyle}
                    />
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="#10b981"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorExpense)"
                      isAnimationActive={trendData.length < 30}
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right Column (5 cols): Donut Chart Breakdown */}
        <div className="lg:col-span-5 glass-card p-5 rounded-3xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
              <PieIcon className="w-4 h-4 text-teal-500" />
              <span>{t.categoryDistTitle}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">{t.categoryDistDesc}</p>
          </div>

          <div className="h-56 relative my-2">
            {categoryData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                {t.noDataPeriod}
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="total"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      isAnimationActive={categoryData.length < 20}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [formatIDR(Number(val), false, lang), 'Total']}
                      contentStyle={tooltipStyle}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Donut Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] font-medium text-slate-400">Total</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    {formatIDR(currentTotal, true, lang)}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Mini Legend List */}
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {categoryData.slice(0, 4).map((cat) => {
              const pct = currentTotal > 0 ? ((cat.total / currentTotal) * 100).toFixed(1) : 0;
              return (
                <div
                  key={cat.id}
                  className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50"
                >
                  <div className="flex items-center space-x-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="font-medium text-slate-700 dark:text-slate-300 truncate">{cat.name}</span>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="font-semibold text-slate-800 dark:text-slate-100">
                      {formatIDR(cat.total, true, lang)}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      {pct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Ranking Categories Detail Table */}
      <div className="glass-card rounded-3xl p-5">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">
          {t.rankingTitle}
        </h3>

        {categoryData.length === 0 ? (
          <p className="text-xs text-slate-400">{t.noRankingData}</p>
        ) : (
          <div className="space-y-3">
            {categoryData.map((cat, idx) => {
              const percentage = currentTotal > 0 ? (cat.total / currentTotal) * 100 : 0;
              return (
                <div key={cat.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <span className="w-5 text-slate-400 font-bold text-[11px]">#{idx + 1}</span>
                      <div
                        className="w-7 h-7 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                        style={{ backgroundColor: cat.color }}
                      >
                        <DynamicIcon name={cat.icon} className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">{cat.name}</span>
                      <span className="text-[10px] text-slate-400">
                        ({cat.count} {t.kpiTimes})
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="font-bold text-slate-800 dark:text-slate-100">
                        {formatIDR(cat.total, false, lang)}
                      </span>
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%`, backgroundColor: cat.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
