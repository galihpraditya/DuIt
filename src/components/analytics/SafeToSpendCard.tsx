import React from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  ChevronRight,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import type { SafeToSpendData } from './analyticsCalculator';
import type { Language, Translations } from '../../constants/translations';
import { formatIDR } from '../../utils/formatters';

interface SafeToSpendCardProps {
  safeData: SafeToSpendData;
  isCurrentMonth: boolean;
  onNavigateToBudget?: () => void;
  lang?: Language;
  t: Translations;
}

export const SafeToSpendCard: React.FC<SafeToSpendCardProps> = ({
  safeData,
  isCurrentMonth,
  onNavigateToBudget,
  lang = 'id',
  t,
}) => {
  const {
    totalMonthlyBudget,
    currentSpent,
    remainingBudget,
    daysRemaining,
    budgetSpentPercentage,
    safeDailyLimit,
    projectedTotal,
    projectedVariance,
    status,
    hasBudget,
  } = safeData;

  // 1. Fallback jika belum ada limit anggaran
  if (!hasBudget) {
    return (
      <div className="glass-card rounded-3xl p-5 border border-dashed border-slate-300 dark:border-slate-700/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            {t.safeToSpendTitle}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t.setBudgetPrompt}
          </p>
        </div>
        {onNavigateToBudget && (
          <button
            onClick={onNavigateToBudget}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all cursor-pointer shrink-0 active:scale-95"
          >
            <span>{t.btnSetBudget}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  // 2. Rekapitulasi jika melihat periode lampau
  if (!isCurrentMonth) {
    const isSurplus = remainingBudget >= 0;
    return (
      <div className="glass-card rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            {t.pastPeriodRecapTitle}
          </h3>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
              isSurplus
                ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                : 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400'
            }`}
          >
            {isSurplus ? t.recapSurplus : t.recapDeficit}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <span className="text-slate-400 block mb-0.5">Target</span>
            <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
              {formatIDR(totalMonthlyBudget, false, lang)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">{t.kpiTotalExpense}</span>
            <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
              {formatIDR(currentSpent, false, lang)}
            </span>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <span className="text-slate-400 block mb-0.5">Selisih</span>
            <span
              className={`font-bold text-sm ${
                isSurplus
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {isSurplus ? '+' : '-'} {formatIDR(Math.abs(remainingBudget), false, lang)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 3. Tampilan Minimalis Bulan Berjalan
  const statusConfig = {
    healthy: {
      badge: t.statusHealthy,
      badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      icon: <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
      barColor: 'bg-emerald-500',
    },
    warning: {
      badge: t.statusWarning,
      badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      icon: <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
      barColor: 'bg-amber-500',
    },
    critical: {
      badge: t.statusCritical,
      badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      icon: <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />,
      barColor: 'bg-rose-500',
    },
    no_budget: {
      badge: t.statusNoBudget,
      badgeClass: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
      icon: null,
      barColor: 'bg-slate-400',
    },
  }[status];

  return (
    <div className="glass-card rounded-3xl p-5 md:p-6 shadow-sm space-y-4">
      {/* Clean Header: Title + Status Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {statusConfig.icon}
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            {t.safeDailyLimitLabel}
          </h3>
        </div>
        <span
          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide border ${statusConfig.badgeClass}`}
        >
          {statusConfig.badge}
        </span>
      </div>

      {/* Hero Metric: Big Safe Daily Limit */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
            {formatIDR(safeDailyLimit, false, lang)}
          </span>
          <span className="text-xs font-semibold text-slate-400">/ hari</span>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          untuk sisa <span className="font-semibold text-slate-700 dark:text-slate-200">{daysRemaining} hari</span> lagi
        </span>
      </div>

      {/* Clean Single Progress Bar */}
      <div className="space-y-1.5 pt-1">
        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
          <span>
            Terpakai: <span className="text-slate-700 dark:text-slate-200 font-semibold">{formatIDR(currentSpent, true, lang)}</span> ({budgetSpentPercentage}%)
          </span>
          <span>
            Sisa: <span className={`font-semibold ${remainingBudget < 0 ? 'text-rose-500' : 'text-slate-700 dark:text-slate-200'}`}>{formatIDR(remainingBudget, true, lang)}</span>
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700/60 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${statusConfig.barColor}`}
            style={{ width: `${Math.min(100, Math.max(0, budgetSpentPercentage))}%` }}
          />
        </div>
      </div>

      {/* 2 Compact Secondary Stats */}
      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
        <div>
          <span className="text-slate-400 block mb-0.5">{t.remainingBudgetLabel}</span>
          <span
            className={`font-bold text-sm ${
              remainingBudget < 0
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-slate-800 dark:text-slate-100'
            }`}
          >
            {formatIDR(remainingBudget, false, lang)}
          </span>
        </div>

        <div>
          <span className="text-slate-400 block mb-0.5">{t.projectedTotalLabel}</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
              {formatIDR(projectedTotal, false, lang)}
            </span>
            {projectedVariance > 0 ? (
              <span className="text-[10px] text-rose-500 font-semibold flex items-center">
                <TrendingUp className="w-3 h-3 inline mr-0.5" />+{formatIDR(projectedVariance, true, lang)}
              </span>
            ) : (
              <span className="text-[10px] text-emerald-500 font-semibold flex items-center">
                <TrendingDown className="w-3 h-3 inline mr-0.5" />{formatIDR(Math.abs(projectedVariance), true, lang)} hemat
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
