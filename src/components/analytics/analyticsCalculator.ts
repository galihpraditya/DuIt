import type { Category, Transaction } from '../../types';
import type { Translations } from '../../constants/translations';
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

export type PeriodOption = 'today' | '7days' | '30days' | 'this_month' | 'last_month' | 'this_year' | 'custom';

export interface CategoryDataEntry {
  id: string;
  name: string;
  icon: string;
  color: string;
  total: number;
  count: number;
}

export interface TrendDataEntry {
  label: string;
  total: number;
}

export interface AnalyticsCalculatedData {
  periodLabel: string;
  currentTotal: number;
  highestExpense: number;
  averagePerDay: number;
  percentageChange: number;
  categoryData: CategoryDataEntry[];
  trendData: TrendDataEntry[];
  txCount: number;
}

export interface SmartPieSlice {
  id: string;
  name: string;
  value: number;
  total: number;
  color: string;
  count: number;
}

export interface SafeToSpendData {
  totalMonthlyBudget: number;
  currentSpent: number;
  remainingBudget: number;
  daysPassed: number;
  daysRemaining: number;
  totalDaysInMonth: number;
  timeElapsedPercentage: number;
  budgetSpentPercentage: number;
  safeDailyLimit: number;
  projectedTotal: number;
  projectedVariance: number;
  status: 'healthy' | 'warning' | 'critical' | 'no_budget';
  hasBudget: boolean;
}

export const parseTxTime = (dateStr: string): number | null => {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    const t = d.getTime();
    if (!isNaN(t)) return t;
    const parsed = parseISO(dateStr);
    const pt = parsed.getTime();
    return isNaN(pt) ? null : pt;
  } catch {
    return null;
  }
};

const getLocalDateKey = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const getLocalMonthKey = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

export function calculatePeriodIntervals(
  selectedPeriod: PeriodOption,
  customStartDate: string,
  customEndDate: string,
  t: Translations,
  locale: any
) {
  const now = new Date();
  let start = startOfMonth(now);
  let end = endOfMonth(now);
  let prevStart = startOfMonth(subMonths(now, 1));
  let prevEnd = endOfMonth(subMonths(now, 1));
  let label = t.periodThisMonth;

  if (selectedPeriod === 'today') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    prevStart = subDays(start, 1);
    prevEnd = subDays(end, 1);
    label = t.periodToday;
  } else if (selectedPeriod === '7days') {
    start = subDays(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0), 6);
    end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    prevStart = subDays(start, 7);
    prevEnd = subDays(start, 1);
    label = t.period7Days;
  } else if (selectedPeriod === '30days') {
    start = subDays(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0), 29);
    end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
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
    start = new Date(parsedStart.getFullYear(), parsedStart.getMonth(), parsedStart.getDate(), 0, 0, 0, 0);
    end = new Date(parsedEnd.getFullYear(), parsedEnd.getMonth(), parsedEnd.getDate(), 23, 59, 59, 999);
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
}

export function calculateAnalytics(
  transactions: Transaction[],
  categories: Category[],
  currentInterval: { start: Date; end: Date },
  previousInterval: { start: Date; end: Date },
  periodLabel: string,
  selectedPeriod: PeriodOption,
  locale: any
): AnalyticsCalculatedData {
  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const start = currentInterval.start;
  const end = currentInterval.end;
  const prevStart = previousInterval.start;
  const prevEnd = previousInterval.end;

  const startTime = start.getTime();
  const endTime = end.getTime();
  const prevStartTime = prevStart.getTime();
  const prevEndTime = prevEnd.getTime();

  const currentPeriodTxs: Transaction[] = [];
  const previousPeriodTxs: Transaction[] = [];
  const currentPeriodTxTimes: number[] = [];

  // 1. Single pass time filtering (Numeric comparison with safe amount parsing)
  for (let i = 0; i < transactions.length; i++) {
    const tx = transactions[i];
    const time = parseTxTime(tx.date);
    if (time === null) continue;

    if (time >= startTime && time <= endTime) {
      currentPeriodTxs.push(tx);
      currentPeriodTxTimes.push(time);
    }
    if (time >= prevStartTime && time <= prevEndTime) {
      previousPeriodTxs.push(tx);
    }
  }

  // 2. KPI Metrics calculation
  let currentTotal = 0;
  let highestExpense = 0;
  for (let i = 0; i < currentPeriodTxs.length; i++) {
    const amt = Number(currentPeriodTxs[i].amount) || 0;
    currentTotal += amt;
    if (amt > highestExpense) highestExpense = amt;
  }

  let previousTotal = 0;
  for (let i = 0; i < previousPeriodTxs.length; i++) {
    previousTotal += Number(previousPeriodTxs[i].amount) || 0;
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

  // 3. Category Breakdown Aggregation
  const catMap = new Map<string, CategoryDataEntry>();
  for (let i = 0; i < currentPeriodTxs.length; i++) {
    const tx = currentPeriodTxs[i];
    const amt = Number(tx.amount) || 0;
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
    existing.total += amt;
    existing.count += 1;
    catMap.set(cat.id, existing);
  }
  const categoryData = Array.from(catMap.values()).sort((a, b) => b.total - a.total);

  // 4. Trend Data Generation (Local Time Synchronized)
  const totalDays = differenceInCalendarDays(end, start) + 1;
  let buckets: { key: string; label: string; total: number }[] = [];

  const isYearly = selectedPeriod === 'this_year' || totalDays > 365;
  const isWeekly = !isYearly && totalDays > 70;

  if (isYearly) {
    buckets = eachMonthOfInterval({ start, end }).map((m) => ({
      key: getLocalMonthKey(m),
      label: format(m, 'MMM', { locale }),
      total: 0,
    }));
  } else if (isWeekly) {
    buckets = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 }).map((w) => ({
      key: getLocalDateKey(w),
      label: format(w, 'dd MMM', { locale }),
      total: 0,
    }));
  } else {
    buckets = eachDayOfInterval({ start, end }).map((d) => ({
      key: getLocalDateKey(d),
      label: format(d, 'dd MMM', { locale }),
      total: 0,
    }));
  }

  if (buckets.length > 0) {
    const keyIndex = new Map<string, number>();
    for (let i = 0; i < buckets.length; i++) {
      keyIndex.set(buckets[i].key, i);
    }

    for (let i = 0; i < currentPeriodTxs.length; i++) {
      const tx = currentPeriodTxs[i];
      const amt = Number(tx.amount) || 0;
      const time = currentPeriodTxTimes[i];
      const txDate = new Date(time);

      let key: string;
      if (isYearly) {
        key = getLocalMonthKey(txDate);
      } else if (!isWeekly) {
        key = getLocalDateKey(txDate);
      } else {
        key = format(startOfWeek(txDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      }

      const idx = keyIndex.get(key);
      if (idx !== undefined && buckets[idx]) {
        buckets[idx].total += amt;
      }
    }
  }

  const trendData = buckets.map(({ label, total }) => ({ label, total }));

  return {
    periodLabel,
    currentTotal,
    highestExpense,
    averagePerDay,
    percentageChange,
    categoryData,
    trendData,
    txCount: currentPeriodTxs.length,
  };
}

/**
 * Smart Slicing for Pie/Donut Chart:
 * Groups small categories into "Lainnya" if count > maxSlices (default: 6)
 * to avoid Recharts SVG lag and visual clutter.
 */
export function getSmartPieSlices(
  categoryData: CategoryDataEntry[],
  maxSlices: number = 6,
  othersLabel: string = 'Lainnya'
): SmartPieSlice[] {
  if (categoryData.length <= maxSlices) {
    return categoryData.map((cat) => ({
      id: cat.id,
      name: cat.name,
      value: cat.total,
      total: cat.total,
      color: cat.color,
      count: cat.count,
    }));
  }

  const topSlices = categoryData.slice(0, maxSlices - 1);
  const otherItems = categoryData.slice(maxSlices - 1);

  let othersTotal = 0;
  let othersCount = 0;
  for (let i = 0; i < otherItems.length; i++) {
    othersTotal += otherItems[i].total;
    othersCount += otherItems[i].count;
  }

  const result: SmartPieSlice[] = topSlices.map((cat) => ({
    id: cat.id,
    name: cat.name,
    value: cat.total,
    total: cat.total,
    color: cat.color,
    count: cat.count,
  }));

  if (othersTotal > 0) {
    result.push({
      id: 'others_aggregated',
      name: othersLabel,
      value: othersTotal,
      total: othersTotal,
      color: '#94a3b8', // Tailwind slate-400
      count: othersCount,
    });
  }

  return result;
}

export function calculateSafeToSpend(
  categories: Category[],
  currentSpent: number,
  averagePerDay: number,
  referenceDate: Date = new Date()
): SafeToSpendData {
  let totalMonthlyBudget = 0;
  for (let i = 0; i < categories.length; i++) {
    totalMonthlyBudget += categories[i].budgetLimit || 0;
  }

  const start = startOfMonth(referenceDate);
  const end = endOfMonth(referenceDate);
  const totalDaysInMonth = Math.max(1, differenceInCalendarDays(end, start) + 1);
  const daysPassed = Math.min(totalDaysInMonth, Math.max(1, referenceDate.getDate()));
  const daysRemaining = Math.max(1, totalDaysInMonth - daysPassed + 1);

  const timeElapsedPercentage = Math.min(100, Math.round((daysPassed / totalDaysInMonth) * 100));
  const remainingBudget = totalMonthlyBudget - currentSpent;
  const budgetSpentPercentage =
    totalMonthlyBudget > 0 ? Math.round((currentSpent / totalMonthlyBudget) * 100) : 0;

  // Safe daily limit for remaining days
  const safeDailyLimit =
    totalMonthlyBudget > 0 && remainingBudget > 0 ? Math.round(remainingBudget / daysRemaining) : 0;

  // Forecasted month-end spending based on current daily run-rate
  const projectedTotal = Math.round(averagePerDay * totalDaysInMonth);
  const projectedVariance = projectedTotal - totalMonthlyBudget;

  let status: 'healthy' | 'warning' | 'critical' | 'no_budget' = 'no_budget';
  if (totalMonthlyBudget > 0) {
    if (remainingBudget <= 0 || projectedTotal > totalMonthlyBudget * 1.05) {
      status = 'critical';
    } else if (projectedTotal > totalMonthlyBudget * 0.9 || budgetSpentPercentage > timeElapsedPercentage + 15) {
      status = 'warning';
    } else {
      status = 'healthy';
    }
  }

  return {
    totalMonthlyBudget,
    currentSpent,
    remainingBudget,
    daysPassed,
    daysRemaining,
    totalDaysInMonth,
    timeElapsedPercentage,
    budgetSpentPercentage,
    safeDailyLimit,
    projectedTotal,
    projectedVariance,
    status,
    hasBudget: totalMonthlyBudget > 0,
  };
}
