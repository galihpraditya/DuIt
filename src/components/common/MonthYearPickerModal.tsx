import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Calendar, CalendarCheck } from 'lucide-react';
import type { Language } from '../../constants/translations';
import { format } from 'date-fns';

interface MonthYearPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMonth: string; // 'yyyy-MM' or 'ALL'
  onSelectMonth: (monthStr: string) => void;
  lang: Language;
}

const MONTHS_ID = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

const MONTHS_EN = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export const MonthYearPickerModal: React.FC<MonthYearPickerModalProps> = ({
  isOpen,
  onClose,
  selectedMonth,
  onSelectMonth,
  lang,
}) => {
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    if (selectedMonth && selectedMonth !== 'ALL') {
      const [y] = selectedMonth.split('-');
      return parseInt(y) || new Date().getFullYear();
    }
    return new Date().getFullYear();
  });

  const [activeMonthNum, setActiveMonthNum] = useState<number | null>(() => {
    if (selectedMonth && selectedMonth !== 'ALL') {
      const [, m] = selectedMonth.split('-');
      return parseInt(m) || new Date().getMonth() + 1;
    }
    return null;
  });

  useEffect(() => {
    if (isOpen) {
      if (selectedMonth && selectedMonth !== 'ALL') {
        const [y, m] = selectedMonth.split('-');
        setSelectedYear(parseInt(y) || new Date().getFullYear());
        setActiveMonthNum(parseInt(m) || new Date().getMonth() + 1);
      } else {
        setSelectedYear(new Date().getFullYear());
        setActiveMonthNum(null);
      }
    }
  }, [isOpen, selectedMonth]);

  if (!isOpen) return null;

  const monthsList = lang === 'en' ? MONTHS_EN : MONTHS_ID;
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const handlePickMonth = (monthIndex: number) => {
    const monthNum = monthIndex + 1;
    const formatted = `${selectedYear}-${String(monthNum).padStart(2, '0')}`;
    onSelectMonth(formatted);
    onClose();
  };

  const handleSelectCurrentMonth = () => {
    const formatted = format(new Date(), 'yyyy-MM');
    onSelectMonth(formatted);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-sm glass-modal rounded-3xl p-5 shadow-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-4 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
              {lang === 'en' ? 'Select Month & Year' : 'Pilih Bulan & Tahun'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Year Navigator */}
        <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-900/80 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60">
          <button
            onClick={() => setSelectedYear((prev) => prev - 1)}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-all active:scale-95 shadow-sm hover:shadow"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
          </button>
          <span className="font-extrabold text-base tracking-wide text-slate-800 dark:text-slate-100">
            {selectedYear}
          </span>
          <button
            onClick={() => setSelectedYear((prev) => prev + 1)}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-all active:scale-95 shadow-sm hover:shadow"
          >
            <ChevronRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Month Grid (12 Months) */}
        <div className="grid grid-cols-3 gap-2">
          {monthsList.map((mName, idx) => {
            const monthNum = idx + 1;
            const isSelected =
              selectedMonth !== 'ALL' &&
              selectedYear === parseInt(selectedMonth.split('-')[0]) &&
              monthNum === activeMonthNum;
            const isCurrent =
              selectedYear === currentYear && monthNum === currentMonth;

            return (
              <button
                key={mName}
                onClick={() => handlePickMonth(idx)}
                className={`py-3 px-2 rounded-2xl text-xs font-bold transition-all duration-150 relative active:scale-95 ${
                  isSelected
                    ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/25 ring-2 ring-emerald-400'
                    : isCurrent
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                    : 'bg-white dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {mName}
                {isCurrent && !isSelected && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                )}
              </button>
            );
          })}
        </div>

        {/* Quick Current Month Button */}
        <button
          onClick={handleSelectCurrentMonth}
          className="w-full py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-900/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-center space-x-1.5"
        >
          <CalendarCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>{lang === 'en' ? 'Go to Current Month' : 'Ke Bulan Ini'}</span>
        </button>
      </div>
    </div>
  );
};
