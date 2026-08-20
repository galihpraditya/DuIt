import {
  format,
  parseISO,
  isToday,
  isYesterday,
  differenceInCalendarDays,
  endOfMonth,
  startOfMonth,
} from 'date-fns';
import { id as idLocale, enUS as enLocale } from 'date-fns/locale';
import type { Language } from '../constants/translations';

// Cached Intl formatters for high performance across large lists and dashboards
const idCurrencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const enCurrencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatIDR(amount: number, compact = false, lang: Language = 'id'): string {
  if (compact && Math.abs(amount) >= 1000000) {
    const unit = lang === 'en' ? 'M' : 'jt';
    return `Rp ${(amount / 1000000).toFixed(1).replace(/\.0$/, '')} ${unit}`;
  }
  if (compact && Math.abs(amount) >= 1000) {
    const unit = lang === 'en' ? 'k' : 'rb';
    return `Rp ${(amount / 1000).toFixed(0)} ${unit}`;
  }

  return lang === 'en' ? enCurrencyFormatter.format(amount) : idCurrencyFormatter.format(amount);
}

export function formatDateIndo(dateStr: string, formatStr = 'dd MMMM yyyy', lang: Language = 'id'): string {
  try {
    const date = parseISO(dateStr);
    return format(date, formatStr, { locale: lang === 'en' ? enLocale : idLocale });
  } catch {
    return dateStr;
  }
}

export function formatRelativeDateIndo(dateStr: string, lang: Language = 'id'): string {
  try {
    const date = parseISO(dateStr);
    if (isToday(date)) return lang === 'en' ? 'Today' : 'Hari Ini';
    if (isYesterday(date)) return lang === 'en' ? 'Yesterday' : 'Kemarin';
    return format(date, 'EEEE, dd MMM yyyy', { locale: lang === 'en' ? enLocale : idLocale });
  } catch {
    return dateStr;
  }
}

export function formatTimeOnly(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    return format(date, 'HH:mm');
  } catch {
    return '';
  }
}

export function getRemainingDaysInCurrentMonth(): number {
  const now = new Date();
  const end = endOfMonth(now);
  return Math.max(1, differenceInCalendarDays(end, now) + 1);
}

export interface MonthWeekOption {
  id: string;
  label: string;
  startDay: number;
  endDay: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

/**
 * Splits a month (YYYY-MM) into exactly 4 weekly periods:
 * Week 1: 1 - 7
 * Week 2: 8 - 14
 * Week 3: 15 - 21
 * Week 4: 22 - End of Month (adaptive: 28/29/30/31)
 */
export function getMonthWeeks(yearMonthStr: string, lang: Language = 'id'): MonthWeekOption[] {
  if (!yearMonthStr || yearMonthStr === 'ALL') return [];
  try {
    const [yearStr, monthStr] = yearMonthStr.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1;
    if (isNaN(year) || isNaN(month)) return [];

    const firstDate = startOfMonth(new Date(year, month, 1));
    const lastDate = endOfMonth(firstDate);
    const totalDays = lastDate.getDate();

    const monthShort = format(firstDate, 'MMM', { locale: lang === 'en' ? enLocale : idLocale });
    const weekWord = lang === 'en' ? 'Week' : 'Minggu';

    const weekRanges = [
      { start: 1, end: 7 },
      { start: 8, end: 14 },
      { start: 15, end: 21 },
      { start: 22, end: totalDays }, // Week 4 adapts to the end of the month
    ];

    return weekRanges.map((w, idx) => {
      const startStr = `${yearStr}-${monthStr.padStart(2, '0')}-${String(w.start).padStart(2, '0')}`;
      const endStr = `${yearStr}-${monthStr.padStart(2, '0')}-${String(w.end).padStart(2, '0')}`;

      return {
        id: `week-${idx + 1}`,
        label: `${weekWord} ${idx + 1} (${w.start} - ${w.end} ${monthShort})`,
        startDay: w.start,
        endDay: w.end,
        startDate: startStr,
        endDate: endStr,
      };
    });
  } catch {
    return [];
  }
}

export function safeEvaluateMathExpression(input: string): number {
  if (!input || !input.trim()) return 0;

  let expr = input.replace(/[^0-9+\-*/.]/g, '').trim();
  if (!expr) return 0;

  expr = expr.replace(/[+\-*/.]+$/, '');
  if (!expr) return 0;

  try {
    const tokens: (number | string)[] = [];
    let currentNumber = '';

    for (let i = 0; i < expr.length; i++) {
      const char = expr[i];
      if ('+-*/'.includes(char)) {
        if (currentNumber !== '') {
          tokens.push(parseFloat(currentNumber));
          currentNumber = '';
        } else if (char === '-' && (tokens.length === 0 || typeof tokens[tokens.length - 1] === 'string')) {
          currentNumber = '-';
          continue;
        }
        tokens.push(char);
      } else {
        currentNumber += char;
      }
    }
    if (currentNumber !== '') {
      tokens.push(parseFloat(currentNumber));
    }

    if (tokens.length === 0) return 0;

    const processedTokens: (number | string)[] = [];
    let idx = 0;
    while (idx < tokens.length) {
      const token = tokens[idx];
      if (token === '*' || token === '/') {
        const prevNum = processedTokens.pop() as number;
        const nextNum = tokens[idx + 1] as number;
        if (typeof prevNum === 'number' && typeof nextNum === 'number') {
          const res = token === '*' ? prevNum * nextNum : nextNum !== 0 ? prevNum / nextNum : 0;
          processedTokens.push(res);
          idx += 2;
          continue;
        }
      }
      processedTokens.push(token);
      idx++;
    }

    let result = typeof processedTokens[0] === 'number' ? (processedTokens[0] as number) : 0;
    idx = 1;
    while (idx < processedTokens.length) {
      const op = processedTokens[idx];
      const nextNum = processedTokens[idx + 1] as number;
      if (typeof nextNum === 'number') {
        if (op === '+') result += nextNum;
        if (op === '-') result -= nextNum;
      }
      idx += 2;
    }

    return isNaN(result) ? 0 : Math.round(result);
  } catch {
    const fallback = parseFloat(input.replace(/[^0-9.]/g, ''));
    return isNaN(fallback) ? 0 : fallback;
  }
}

/**
 * Generates collision-resistant unique identifiers for entities and UI notifications.
 */
export function generateId(prefix = 'id'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
}
