import React from 'react';
import { ArrowUpRight, ArrowDownRight, Scale } from 'lucide-react';
import type { CashFlowSummary } from '../../utils/transactionHelpers';
import { formatIDR } from '../../utils/formatters';
import type { Language, Translations } from '../../constants/translations';

interface CashFlowCardProps {
  summary: CashFlowSummary;
  hideNominals?: boolean;
  lang?: Language;
  t: Translations;
}

export const CashFlowCard: React.FC<CashFlowCardProps> = React.memo(({
  summary,
  hideNominals = false,
  lang = 'id',
  t,
}) => {
  const { totalIncome, totalExpense, netCashFlow, expenseRatioPct, savingRatePct } = summary;

  return (
    <div className="glass-card rounded-2xl p-5 sm:p-6 space-y-4">
      <div className="flex items-center space-x-2.5">
        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
          <Scale className="w-4 h-4" />
        </div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
          {t.cashFlowHealthTitle}
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/25 border border-emerald-200/60 dark:border-emerald-900/40">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{t.totalIncomeLabel}</span>
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-1 tracking-tight">
            {!hideNominals && totalIncome > 0 ? '+' : ''}
            {formatIDR(totalIncome, false, lang, hideNominals)}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/25 border border-rose-200/60 dark:border-rose-900/40">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300">
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>{t.totalExpenseLabel}</span>
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-rose-700 dark:text-rose-400 mt-1 tracking-tight">
            {!hideNominals && totalExpense > 0 ? '−' : ''}
            {formatIDR(totalExpense, false, lang, hideNominals)}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
            <span>{t.netCashFlowLabel}</span>
            {totalIncome > 0 && (
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                {t.savingRateLabel}: {savingRatePct}%
              </span>
            )}
          </div>
          <div
            className={`text-lg sm:text-xl font-extrabold mt-1 tracking-tight ${
              netCashFlow < 0
                ? 'text-rose-600 dark:text-rose-400'
                : netCashFlow > 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-slate-800 dark:text-slate-100'
            }`}
          >
            {!hideNominals && (netCashFlow > 0 ? '+' : netCashFlow < 0 ? '−' : '')}
            {formatIDR(Math.abs(netCashFlow), false, lang, hideNominals)}
          </div>
        </div>
      </div>

      {totalIncome > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>{t.expenseRatioLabel}</span>
            <span className={expenseRatioPct > 100 ? 'text-rose-600 dark:text-rose-400 font-bold' : ''}>
              {expenseRatioPct}% {t.incomeCoveredPct}
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
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
        </div>
      )}
    </div>
  );
});

CashFlowCard.displayName = 'CashFlowCard';
