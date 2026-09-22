import React, { useMemo } from 'react';
import { DynamicIcon } from '../common/IconPicker';
import type { CategoryDataEntry } from './analyticsCalculator';
import type { Category } from '../../types';
import { formatIDR } from '../../utils/formatters';
import type { Language, Translations } from '../../constants/translations';
import { AlertCircle } from 'lucide-react';

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
                <div className="flex items-center justify-between text-xs gap-2">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <span className="w-5 text-slate-400 font-bold text-[11px] shrink-0 font-mono">
                      #{idx + 1}
                    </span>
                    <div
                      className="w-7 h-7 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm transition-transform group-hover:scale-105"
                      style={{ backgroundColor: cat.color }}
                    >
                      <DynamicIcon name={cat.icon} className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                          {cat.name}
                        </span>
                        {isOverLimit && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            <AlertCircle className="w-2.5 h-2.5" />
                            <span>{t.categoryOverbudgetBadge}</span>
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span>
                          {cat.count} {t.kpiTimes}
                        </span>
                        {limit !== undefined && (
                          <>
                            <span>•</span>
                            <span className={isOverLimit ? 'text-rose-500 font-semibold' : 'text-slate-500 dark:text-slate-400'}>
                              {limitUsagePct}% {t.categoryBudgetLimitUsed} ({formatIDR(limit, true, lang)})
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0">
                    <span className="font-bold text-slate-800 dark:text-slate-100">
                      {formatIDR(cat.total, false, lang)}
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Visual Progress Bar */}
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isOverLimit ? 'bg-rose-500' : ''
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
