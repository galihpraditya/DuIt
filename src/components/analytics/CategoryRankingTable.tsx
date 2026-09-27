import React, { useMemo } from 'react';
import { DynamicIcon } from '../common/IconPicker';
import type { CategoryDataEntry } from './analyticsCalculator';
import type { Category } from '../../types';
import { formatIDR } from '../../utils/formatters';
import type { Language, Translations } from '../../constants/translations';

interface CategoryRankingTableProps {
  categoryData: CategoryDataEntry[];
  currentTotal: number;
  categories?: Category[];
  lang?: Language;
  t: Translations;
}

export const CategoryRankingTable: React.FC<CategoryRankingTableProps> = React.memo(({
  categoryData,
  currentTotal,
  categories = [],
  lang = 'id',
  t,
}) => {
  // Map category ID to budgetLimit
  const budgetMap = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 0; i < categories.length; i++) {
      if (categories[i].budgetLimit && categories[i].budgetLimit! > 0) {
        map.set(categories[i].id, categories[i].budgetLimit!);
      }
    }
    return map;
  }, [categories]);

  return (
    <div className="glass-card rounded-3xl p-5 md:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
          {t.rankingTitle}
        </h3>
        <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
          {categoryData.length} kategori
        </span>
      </div>

      {categoryData.length === 0 ? (
        <p className="text-xs text-slate-400 py-6 text-center">{t.noRankingData}</p>
      ) : (
        <div className="space-y-3.5">
          {categoryData.map((cat, idx) => {
            const percentage = currentTotal > 0 ? (cat.total / currentTotal) * 100 : 0;
            const limit = budgetMap.get(cat.id);
            const isOverLimit = limit !== undefined && cat.total > limit;
            const limitUsagePct = limit !== undefined ? Math.round((cat.total / limit) * 100) : null;

            return (
              <div
                key={cat.id}
                className="p-2.5 -mx-2.5 rounded-2xl hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-all space-y-2 group"
              >
                {/* Row 1: Rank, Icon, Name (Left) & Total Amount (Right) */}
                <div className="flex items-center justify-between text-xs gap-2">
                  <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                    <span className="w-5 text-slate-400 font-bold text-[11px] shrink-0 font-mono">
                      #{idx + 1}
                    </span>
                    <div
                      className="w-7 h-7 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm transition-transform group-hover:scale-105"
                      style={{ backgroundColor: cat.color }}
                    >
                      <DynamicIcon name={cat.icon} className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-semibold text-slate-800 dark:text-slate-100 truncate text-xs sm:text-sm">
                      {cat.name}
                    </span>
                  </div>

                  <span className="font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap text-xs sm:text-sm shrink-0">
                    {formatIDR(cat.total, false, lang)}
                  </span>
                </div>

                {/* Row 2: Metadata (Count + Budget Limit Status) & Share % */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 pl-7 sm:pl-7.5 gap-2">
                  <div className="flex items-center gap-1.5 min-w-0 truncate text-[10px] sm:text-[11px]">
                    <span className="shrink-0">
                      {cat.count} {t.kpiTimes}
                    </span>
                    {limit !== undefined && (
                      <>
                        <span className="shrink-0">•</span>
                        <span
                          className={`truncate ${
                            isOverLimit
                              ? 'text-rose-500 font-semibold'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {isOverLimit ? (lang === 'en' ? 'Over limit' : 'Melebihi limit') : 'Limit'}{' '}
                          <span className="whitespace-nowrap font-medium">
                            {formatIDR(limit, true, lang)}
                          </span>{' '}
                          ({limitUsagePct}%)
                        </span>
                      </>
                    )}
                  </div>

                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0 whitespace-nowrap">
                    {percentage.toFixed(1)}%
                  </span>
                </div>

                {/* Visual Progress Bar */}
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${isOverLimit ? 'bg-rose-500' : ''
                      }`}
                    style={{
                      width: `${Math.min(100, percentage)}%`,
                      backgroundColor: isOverLimit ? undefined : cat.color,
                    }}
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
