import React from 'react';
import { DynamicIcon } from '../common/IconPicker';
import type { CategoryDataEntry } from './analyticsCalculator';
import { formatIDR } from '../../utils/formatters';
import type { Language, Translations } from '../../constants/translations';

interface CategoryRankingTableProps {
  categoryData: CategoryDataEntry[];
  currentTotal: number;
  lang?: Language;
  t: Translations;
}

export const CategoryRankingTable: React.FC<CategoryRankingTableProps> = React.memo(({
  categoryData,
  currentTotal,
  lang = 'id',
  t,
}) => {
  return (
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
  );
});

CategoryRankingTable.displayName = 'CategoryRankingTable';
