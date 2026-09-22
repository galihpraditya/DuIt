import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  ReferenceLine,
} from 'recharts';
import { BarChart3, Zap } from 'lucide-react';
import type { TrendDataEntry } from './analyticsCalculator';
import { formatIDR } from '../../utils/formatters';
import type { Language, Translations } from '../../constants/translations';

interface TrendChartProps {
  trendData: TrendDataEntry[];
  averagePerDay?: number;
  chartType: 'bar' | 'area';
  onChangeChartType: (type: 'bar' | 'area') => void;
  darkMode?: boolean;
  lang?: Language;
  t: Translations;
}

export const TrendChart: React.FC<TrendChartProps> = React.memo(({
  trendData,
  averagePerDay,
  chartType,
  onChangeChartType,
  darkMode = false,
  lang = 'id',
  t,
}) => {
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

  return (
    <div className="glass-card p-5 rounded-3xl space-y-4 h-full flex flex-col justify-between">
      {/* Chart Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 text-emerald-500" />
            <span>{t.trendChartTitle}</span>
          </h3>
          <p className="text-xs text-slate-400">{t.trendChartDesc}</p>
        </div>

        {/* Chart Type Toggle */}
        <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => onChangeChartType('bar')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              chartType === 'bar'
                ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            {t.chartBar}
          </button>
          <button
            onClick={() => onChangeChartType('area')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              chartType === 'area'
                ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            {t.chartArea}
          </button>
        </div>
      </div>

      {/* Chart Visualizer */}
      <div className="h-64 sm:h-72 w-full pt-2 min-h-[256px]">
        {trendData.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-xs text-slate-400 space-y-2">
            <Zap className="w-6 h-6 text-slate-300 dark:text-slate-600" />
            <span>{t.noDataPeriod}</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
            {chartType === 'bar' ? (
              <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  minTickGap={24}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                />
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
                {averagePerDay && averagePerDay > 0 && (
                  <ReferenceLine
                    y={averagePerDay}
                    stroke="#f59e0b"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{
                      value: `${t.avgReferenceLineLabel}: ${formatIDR(averagePerDay, true, lang)}`,
                      fill: '#f59e0b',
                      fontSize: 10,
                      fontWeight: 600,
                      position: 'insideTopRight',
                    }}
                  />
                )}
                <Bar
                  dataKey="total"
                  fill="#10b981"
                  radius={[6, 6, 0, 0]}
                  isAnimationActive={false}
                />
              </BarChart>
            ) : (
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  minTickGap={24}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                />
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
                {averagePerDay && averagePerDay > 0 && (
                  <ReferenceLine
                    y={averagePerDay}
                    stroke="#f59e0b"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{
                      value: `${t.avgReferenceLineLabel}: ${formatIDR(averagePerDay, true, lang)}`,
                      fill: '#f59e0b',
                      fontSize: 10,
                      fontWeight: 600,
                      position: 'insideTopRight',
                    }}
                  />
                )}
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#10b981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorExpense)"
                  isAnimationActive={false}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
});

TrendChart.displayName = 'TrendChart';
