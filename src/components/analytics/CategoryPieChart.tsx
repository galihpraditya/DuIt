import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';
import type { CategoryDataEntry } from './analyticsCalculator';
import { getSmartPieSlices } from './analyticsCalculator';
import { formatIDR } from '../../utils/formatters';
import type { Language, Translations } from '../../constants/translations';

interface CategoryPieChartProps {
  categoryData: CategoryDataEntry[];
  currentTotal: number;
  darkMode?: boolean;
  lang?: Language;
  t: Translations;
}

export const CategoryPieChart: React.FC<CategoryPieChartProps> = React.memo(({
  categoryData,
  currentTotal,
  darkMode = false,
  lang = 'id',
  t,
}) => {
  const othersLabel = lang === 'en' ? 'Others' : 'Lainnya';

  // Smart Slicing: Batasi maksimal 6 slice visual utama + "Lainnya" agar render SVG Recharts selalu 60 FPS
  const smartSlices = useMemo(() => {
    return getSmartPieSlices(categoryData, 6, othersLabel);
  }, [categoryData, othersLabel]);

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

  const hasData = categoryData.length > 0 && currentTotal > 0;

  return (
    <div className="glass-card p-5 rounded-3xl flex flex-col justify-between h-full">
      <div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
          <PieIcon className="w-4 h-4 text-teal-500" />
          <span>{t.categoryDistTitle}</span>
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">{t.categoryDistDesc}</p>
      </div>

      <div className="h-56 relative my-2 min-h-[224px] w-full">
        {!hasData ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400">
            {t.noDataPeriod}
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
              <PieChart>
                <Pie
                  data={smartSlices}
                  dataKey="total"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={smartSlices.length > 1 ? 3 : 0}
                  isAnimationActive={false}
                >
                  {smartSlices.map((entry, index) => (
                    <Cell key={`slice-${entry.id || index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [formatIDR(Number(val), false, lang), 'Total']}
                  contentStyle={tooltipStyle}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Center Donut Label with pointer-events-none to prevent hover flicker */}
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
          const pct = currentTotal > 0 ? ((cat.total / currentTotal) * 100).toFixed(1) : '0';
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
  );
});

CategoryPieChart.displayName = 'CategoryPieChart';
