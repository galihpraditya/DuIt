import React from 'react';
import { Wallet, Settings, Plus, User } from 'lucide-react';
import type { Translations } from '../../constants/translations';
import type { UserProfile } from '../../services/authService';

interface NavbarProps {
  onOpenSettings: () => void;
  onOpenNewTransaction: () => void;
  onOpenAuth: () => void;
  currentUser: UserProfile | null;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  t: Translations;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSettings,
  onOpenNewTransaction,
  onOpenAuth,
  currentUser,
  activeTab,
  onSelectTab,
  t,
}) => {
  const navItems = [
    { id: 'transactions', label: t.transactions },
    { id: 'analytics', label: t.analytics },
    { id: 'budget', label: t.budget },
    { id: 'categories', label: t.categories },
  ];

  return (
    <header className="sticky top-0 z-30 pt-safe">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Floating Bar — efek kaca lewat border & shadow */}
        <div className="relative flex items-center justify-between h-14 sm:h-16 mt-3 px-3 sm:px-4 rounded-2xl glass-panel">
          {/* Logo & Brand: "DuIt" with serif "It" */}
          <div
            className="flex items-center space-x-2.5 cursor-pointer group select-none"
            onClick={() => onSelectTab('transactions')}
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] flex items-center justify-center text-white group-hover:bg-emerald-700 transition-colors">
              <Wallet className="w-5 h-5" />
            </div>
            <div className="flex items-baseline">
              <span className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
                Du<span className="font-serif font-black not-italic text-emerald-500 dark:text-emerald-400 ml-0.5 text-2xl">It</span>
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links - Centered Absolutely */}
          <nav className="hidden md:flex items-center space-x-1 absolute left-1/2 -translate-x-1/2 bg-slate-900/5 dark:bg-white/10 p-1 rounded-xl">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`px-4 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all relative ${
                    isActive
                      ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 font-bold shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-2.5">
            {/* User Profile / Auth Button */}
            <button
              onClick={() => currentUser ? onOpenSettings() : onOpenAuth()}
              className={`p-2.5 rounded-2xl border transition-all flex items-center justify-center space-x-2 active:scale-95 ${
                currentUser 
                  ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/40 shadow-sm' 
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-sm'
              }`}
              title={currentUser ? (currentUser.displayName || currentUser.email) : t.authSignIn}
              aria-label={currentUser ? (currentUser.displayName || currentUser.email) : t.authSignIn}
            >
              {currentUser ? (
                <div className="w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[10px] font-extrabold">
                  {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : (currentUser.email ? currentUser.email.charAt(0).toUpperCase() : 'U')}
                </div>
              ) : (
                <User className="w-4 h-4" />
              )}
            </button>

            {/* Settings Button (Gear icon with tooltip) */}
            <button
              onClick={onOpenSettings}
              className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all shadow-sm active:scale-95 flex items-center justify-center group"
              title={`${t.settings} (S)`}
              aria-label={t.settings}
            >
              <Settings className="w-4 h-4 text-slate-600 dark:text-slate-300 group-hover:rotate-45 transition-transform duration-300" />
            </button>

            {/* Primary Action Button (Tambah Pengeluaran) */}
            <button
              onClick={onOpenNewTransaction}
              className="hidden sm:flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors active:scale-[0.98]"
              title={`${t.recordNew} (N)`}
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{t.recordNew}</span>
              <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-semibold bg-white/20 rounded-md text-white/90 ml-1 border border-white/25">N</kbd>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
