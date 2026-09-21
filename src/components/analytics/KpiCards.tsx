import React from 'react';
import { TrendingUp, TrendingDown, Calendar, Zap, Tag } from 'lucide-react';
import { formatIDR } from '../../utils/formatters';
import type { Language, Translations } from '../../constants/translations';

interface KpiCardsProps {
  currentTotal: number;
  percentageChange: number;
  averagePerDay: number;
  highestExpense: number;
  txCount: number;
  lang?: Language;
  t: Translations;
}

export const KpiCards: React.FC<KpiCardsProps> = React.memo(({
  currentTotal,
  percentageChange,
  averagePerDay,
  highestExpense,
  txCount,
  lang = 'id',
  t,
}) => {
  return (
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
  );
});

KpiCards.displayName = 'KpiCards';
