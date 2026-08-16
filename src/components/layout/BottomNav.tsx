import React from 'react';
import {
  ReceiptText,
  PieChart,
  Target,
  Plus,
  Grid,
} from 'lucide-react';
import type { Translations } from '../../constants/translations';

interface BottomNavProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenNewTransaction: () => void;
  t: Translations;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenNewTransaction,
  t,
}) => {
  const mainTabs = [
    { id: 'transactions', label: t.transactions, icon: ReceiptText },
    { id: 'analytics', label: t.analytics, icon: PieChart },
    { id: 'add_button', label: t.recordNew, isSpecial: true },
    { id: 'budget', label: t.budget, icon: Target },
    { id: 'categories', label: t.categories, icon: Grid },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-panel border-t border-slate-200/80 dark:border-slate-800/80 px-3 py-1.5 pb-safe shadow-lg">
      <div className="grid grid-cols-5 items-center justify-items-center max-w-md mx-auto">
        {mainTabs.map((tab) => {
          if (tab.isSpecial) {
            return (
              <button
                key="special_add"
                onClick={onOpenNewTransaction}
                className="-mt-5 w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/35 border-4 border-slate-50 dark:border-slate-950 active:scale-95 transition-transform"
                title={t.recordNew}
              >
                <Plus className="w-6 h-6 stroke-[2.8]" />
              </button>
            );
          }

          const IconComponent = tab.icon!;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-2xl transition-all w-full ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <IconComponent
                className={`w-5 h-5 mb-0.5 transition-transform ${
                  isActive ? 'scale-110 stroke-[2.3]' : 'stroke-[1.8]'
                }`}
              />
              <span className="text-[10px] tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
