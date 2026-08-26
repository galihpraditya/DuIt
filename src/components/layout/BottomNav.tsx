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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-3 pb-safe">
      {/* Floating Dock — efek kaca lewat border & shadow */}
      <div className="max-w-md mx-auto mb-3 glass-panel rounded-3xl px-2 py-1.5">
        <div className="grid grid-cols-5 items-center justify-items-center">
          {mainTabs.map((tab) => {
            if (tab.isSpecial) {
              return (
                <button
                  key="special_add"
                  onClick={onOpenNewTransaction}
                  className="-mt-6 w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-700 shadow-glass shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] text-white flex items-center justify-center active:scale-90 transition-all cursor-pointer"
                  title={t.recordNew}
                  aria-label={t.recordNew}
                >
                  <Plus className="w-6 h-6 stroke-[3]" />
                </button>
              );
            }

            const IconComponent = tab.icon!;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl transition-all w-full min-h-[48px] ${
                  isActive
                    ? 'text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 dark:bg-emerald-500/15'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <IconComponent
                  className={`w-5 h-5 mb-0.5 transition-transform ${
                    isActive ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'
                  }`}
                />
                <span className="text-[10px] tracking-tight">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
