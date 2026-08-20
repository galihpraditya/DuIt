import React, { useState, useMemo } from 'react';
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
  DollarSign,
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
  isWithinInterval,
  parseISO,
  format,
  eachDayOfInterval,
  eachMonthOfInterval,
  differenceInCalendarDays,
} from 'date-fns';
import { id as idLocale, enUS as enLocale } from 'date-fns/locale';
import type { Language, Translations } from '../../constants/translations';

interface AnalyticsViewProps {
  transactions: Transaction[];
  categories: Category[];
  darkMode?: boolean;
  lang?: Language;
  t: Translations;
}

type PeriodOption = 'today' | '7days' | '30days' | 'this_month' | 'last_month' | 'this_year' | 'custom';

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  transactions,
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

  const categoryMap = useMemo(() => {
    return new Map(categories.map((c) => [c.id, c]));
  }, [categories]);

  // Compute current date interval and previous date interval for comparison
  const { currentInterval, previousInterval, periodLabel } = useMemo(() => {
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

  // Filter transactions in current and previous periods
  const currentPeriodTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      try {
        const d = parseISO(tx.date);
        return isWithinInterval(d, currentInterval);
      } catch {
        return false;
      }
    });
  }, [transactions, currentInterval]);

  const previousPeriodTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      try {
        const d = parseISO(tx.date);
        return isWithinInterval(d, previousInterval);
      } catch {
        return false;
      }
    });
  }, [transactions, previousInterval]);

  // KPI Metrics
  const currentTotal = useMemo(() => {
    return currentPeriodTransactions.reduce((acc, tx) => acc + tx.amount, 0);
  }, [currentPeriodTransactions]);

  const previousTotal = useMemo(() => {
    return previousPeriodTransactions.reduce((acc, tx) => acc + tx.amount, 0);
  }, [previousPeriodTransactions]);

  const percentageChange = useMemo(() => {
    if (previousTotal === 0) return currentTotal > 0 ? 100 : 0;
    return Math.round(((currentTotal - previousTotal) / previousTotal) * 100);
  }, [currentTotal, previousTotal]);

  const highestExpense = useMemo(() => {
    if (currentPeriodTransactions.length === 0) return 0;
    return Math.max(...currentPeriodTransactions.map((tx) => tx.amount));
  }, [currentPeriodTransactions]);

  const averagePerDay = useMemo(() => {
    const now = new Date();
    let days = 1;

    if (selectedPeriod === 'today') {
      days = 1;
    } else if (selectedPeriod === '7days') {
      days = 7;
    } else if (selectedPeriod === '30days') {
      days = 30;
    } else if (selectedPeriod === 'this_month') {
      // Days elapsed so far this month (matching transactions view)
      days = Math.max(1, now.getDate());
    } else if (selectedPeriod === 'last_month') {
      days = Math.max(1, currentInterval.end.getDate());
    } else if (selectedPeriod === 'this_year') {
      // Days elapsed so far this year
      days = Math.max(1, differenceInCalendarDays(now, currentInterval.start) + 1);
    } else if (selectedPeriod === 'custom') {
      const effectiveEnd = currentInterval.end > now ? now : currentInterval.end;
      if (effectiveEnd >= currentInterval.start) {
        days = Math.max(1, differenceInCalendarDays(effectiveEnd, currentInterval.start) + 1);
      } else {
        days = Math.max(1, differenceInCalendarDays(currentInterval.end, currentInterval.start) + 1);
      }
    } else {
      days = Math.max(1, differenceInCalendarDays(currentInterval.end, currentInterval.start) + 1);
    }

    return Math.round(currentTotal / days);
  }, [currentTotal, selectedPeriod, currentInterval]);

  // Category Distribution Data (Donut Chart)
  const categoryData = useMemo(() => {
    const map = new Map<
      string,
      { id: string; name: string; icon: string; color: string; total: number; count: number }
    >();

    currentPeriodTransactions.forEach((tx) => {
      const cat = categoryMap.get(tx.categoryId) || {
        id: 'other',
        name: 'Lain-lain',
        icon: 'CircleEllipsis',
        color: '#64748b',
      };
      const existing = map.get(cat.id) || {
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        total: 0,
        count: 0,
      };
      existing.total += tx.amount;
      existing.count += 1;
      map.set(cat.id, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [currentPeriodTransactions, categoryMap]);

  // Time Trend Data (Bar / Area Chart)
  const trendData = useMemo(() => {
    if (selectedPeriod === 'this_year') {
      const months = eachMonthOfInterval(currentInterval);
      return months.map((m) => {
        const monthKey = format(m, 'yyyy-MM');
        const monthLabel = format(m, 'MMM', { locale });
        const total = currentPeriodTransactions
          .filter((tx) => format(parseISO(tx.date), 'yyyy-MM') === monthKey)
          .reduce((acc, tx) => acc + tx.amount, 0);

        return {
          label: monthLabel,
          total,
        };
      });
    } else {
      const days = eachDayOfInterval(currentInterval);
      return days.map((d) => {
        const dayKey = format(d, 'yyyy-MM-dd');
        const dayLabel = format(d, 'dd MMM', { locale });
        const total = currentPeriodTransactions
          .filter((tx) => format(parseISO(tx.date), 'yyyy-MM-dd') === dayKey)
          .reduce((acc, tx) => acc + tx.amount, 0);

        return {
          label: dayLabel,
          total,
        };
      });
    }
  }, [selectedPeriod, currentInterval, currentPeriodTransactions, locale]);

  const tooltipStyle = useMemo(() => {
    return {
      borderRadius: '16px',
      border: darkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
      backgroundColor: darkMode ? '#0f172a' : '#ffffff',
      color: darkMode ? '#f8fafc' : '#0f172a',
      fontSize: '12px',
      fontWeight: '600',
    };
  }, [darkMode]);

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
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm font-bold'
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
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-4 sm:p-5 text-white shadow-lg shadow-emerald-600/15 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute right-2 -bottom-4 opacity-10 text-white pointer-events-none">
            <DollarSign className="w-24 h-24" />
          </div>
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
            {currentPeriodTransactions.length} <span className="text-xs font-normal text-slate-400">{t.kpiTimes}</span>
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
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
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
                    <Bar dataKey="total" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                ) : (
                  <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
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
