import React, { useState } from 'react';
import {
  Settings,
  Sun,
  Moon,
  Globe,
  FileSpreadsheet,
  Check,
  User,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Database,
  Cloud,
  Keyboard,
  ShieldAlert,
  Sliders,
} from 'lucide-react';
import type { Language, Translations } from '../../constants/translations';
import { ConfirmModal } from '../common/ConfirmModal';
import type { UserProfile } from '../../services/authService';

export interface SettingsViewProps {
  language: Language;
  onChangeLanguage: (lang: Language) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenExcelModal: () => void;
  onResetAllData: () => Promise<void>;
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  onLogout: () => Promise<void>;
  onDeleteAccount: () => Promise<void>;
  onBackToTransactions: () => void;
  transactionCount?: number;
  categoryCount?: number;
  t: Translations;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  language,
  onChangeLanguage,
  darkMode,
  onToggleDarkMode,
  onOpenExcelModal,
  onResetAllData,
  currentUser,
  onOpenAuth,
  onLogout,
  onDeleteAccount,
  onBackToTransactions,
  transactionCount = 0,
  categoryCount = 0,
  t,
}) => {
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isDeleteAccountConfirmOpen, setIsDeleteAccountConfirmOpen] = useState(false);

  return (
    <div className="space-y-5 max-w-4xl w-full mx-auto pb-14 animate-in fade-in duration-200">
      
      {/* Header Banner — Liquid Glass */}
      <div className="glass-card rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-emerald-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] flex items-center justify-center text-white shrink-0">
            <Settings className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {t.settingsTitle}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              {t.settingsDesc}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onBackToTransactions}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all cursor-pointer self-start sm:self-auto active:scale-95"
          title={t.backToTransactions}
        >
          <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
          <span>{t.backToTransactions}</span>
        </button>
      </div>

      {/* Card 1: Akun & Sinkronisasi Cloud */}
      <div className="glass-card rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] flex items-center justify-center text-white shrink-0">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {t.authAccountSection}
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {currentUser ? (t.statusConnected || 'Tersinkronisasi Cloud') : (t.authLoginToSync || 'Cadangkan data ke Cloud')}
            </p>
          </div>
        </div>

        {currentUser ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
            <div className="flex items-center space-x-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-base shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] shrink-0">
                {currentUser.displayName
                  ? currentUser.displayName.charAt(0).toUpperCase()
                  : currentUser.email
                  ? currentUser.email.charAt(0).toUpperCase()
                  : 'U'}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                  {currentUser.displayName || 'Pengguna'}
                </p>
                <p className="text-xs text-slate-400 truncate">{currentUser.email}</p>
                <div className="flex items-center space-x-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    {t.statusConnected || 'Tersinkronisasi dengan Supabase'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setIsLogoutConfirmOpen(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center space-x-1.5 transition-all cursor-pointer active:scale-95"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t.authLogout}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsDeleteAccountConfirmOpen(true)}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              >
                {t.authDeleteAccount}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {t.authSignIn} / {t.authSignUp}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t.authLoginToSync || 'Masuk untuk mencadangkan data dan sinkronisasi otomatis antar perangkat'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenAuth}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] cursor-pointer active:scale-95 shrink-0 self-start sm:self-auto"
            >
              {t.authSignIn}
            </button>
          </div>
        )}
      </div>

      {/* Card 2: Pengaturan Aplikasi (Bahasa & Tema) */}
      <div className="glass-card rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] flex items-center justify-center text-white shrink-0">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {language === 'id' ? 'Preferensi Tampilan & Bahasa' : 'Appearance & Language'}
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {language === 'id' ? 'Kustomisasi bahasa antarmuka dan tema visual' : 'Customize interface language and visual theme'}
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {/* Row 1: Bahasa */}
          <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 first:pt-1">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {t.languageSection}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {language === 'id' ? 'Bahasa Indonesia aktif' : 'English active'}
                </p>
              </div>
            </div>

            {/* Segmented Switcher for Language */}
            <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-auto">
              <button
                type="button"
                onClick={() => onChangeLanguage('id')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${
                  language === 'id'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {language === 'id' && <Check className="w-3 h-3 stroke-[3]" />}
                <span>Bahasa Indonesia</span>
              </button>
              <button
                type="button"
                onClick={() => onChangeLanguage('en')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${
                  language === 'en'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {language === 'en' && <Check className="w-3 h-3 stroke-[3]" />}
                <span>English</span>
              </button>
            </div>
          </div>

          {/* Row 2: Tema */}
          <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 last:pb-1">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
                {darkMode ? <Moon className="w-4 h-4 text-emerald-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {t.themeSection}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {darkMode ? t.darkMode : t.lightMode}
                </p>
              </div>
            </div>

            {/* Segmented Switcher for Theme */}
            <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  if (darkMode) onToggleDarkMode();
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${
                  !darkMode
                    ? 'bg-white text-emerald-700 font-bold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>{t.lightMode}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!darkMode) onToggleDarkMode();
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${
                  darkMode
                    ? 'bg-slate-700 text-emerald-400 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t.darkMode}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Card 3: Manajemen Data & Excel */}
      <div className="glass-card rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] flex items-center justify-center text-white shrink-0">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {t.dataManagementSection}
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {t.dataManagementDesc}
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {/* Row 1: Pusat Excel */}
          <div className="py-3.5 flex items-center justify-between gap-3 first:pt-1">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  {t.openExcelCenter}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {language === 'id' ? 'Ekspor laporan XLSX, impor transaksi, dan cadangan JSON' : 'Export XLSX reports, import transactions, and JSON backup'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenExcelModal}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center space-x-1 transition-all shrink-0 cursor-pointer active:scale-95"
            >
              <span>{language === 'id' ? 'Buka' : 'Open'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Row 2: Ringkasan Basis Data */}
          <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 last:pb-1">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {t.localDataSummary || 'Penyimpanan Lokal (IndexedDB)'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {language === 'id' ? 'Tersimpan otomatis di browser tanpa batasan kuota' : 'Stored securely in browser with zero quota limit'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 self-start sm:self-auto text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                {transactionCount} {t.transactions}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                {categoryCount} {t.categories}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Card 4: Pintasan Keyboard */}
      <div className="glass-card rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] flex items-center justify-center text-white shrink-0">
            <Keyboard className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {t.keyboardShortcuts}
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {language === 'id' ? 'Pintasan keyboard cepat untuk produktivitas' : 'Quick keyboard shortcuts for productivity'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">{t.shortcutNewTx}</span>
            <kbd className="px-2 py-0.5 text-xs font-mono font-bold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg shadow-2xs">N</kbd>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">{t.shortcutSettings}</span>
            <kbd className="px-2 py-0.5 text-xs font-mono font-bold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg shadow-2xs">S</kbd>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">{t.shortcutSearch}</span>
            <kbd className="px-2 py-0.5 text-xs font-mono font-bold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg shadow-2xs">/</kbd>
          </div>
        </div>
      </div>

      {/* Card 5: Zona Berbahaya (Danger Zone) */}
      <div className="glass-card rounded-3xl p-5 sm:p-6 space-y-3 border-rose-200/60 dark:border-rose-900/40 bg-rose-50/20 dark:bg-rose-950/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                {t.resetAllData}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {t.resetAllDataDesc}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsResetConfirmOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-xs cursor-pointer active:scale-95 shrink-0 self-start sm:self-auto"
          >
            {t.resetConfirmBtn}
          </button>
        </div>
      </div>

      {/* App Version Footer */}
      <div className="pt-2 text-center text-xs text-slate-400 font-medium">
        {t.versionLabel}
      </div>

      {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={isLogoutConfirmOpen}
        title={t.authLogoutConfirmTitle}
        message={t.authLogoutConfirmMsg}
        confirmText={t.authLogout}
        cancelText={t.cancelBtn}
        onConfirm={async () => {
          setIsLogoutConfirmOpen(false);
          await onLogout();
        }}
        onCancel={() => setIsLogoutConfirmOpen(false)}
      />

      <ConfirmModal
        isOpen={isDeleteAccountConfirmOpen}
        title={t.authDeleteAccountConfirmTitle}
        message={t.authDeleteAccountConfirmMsg}
        confirmText={t.authDeleteAccountBtn}
        cancelText={t.cancelBtn}
        isDanger={true}
        onConfirm={async () => {
          setIsDeleteAccountConfirmOpen(false);
          await onDeleteAccount();
        }}
        onCancel={() => setIsDeleteAccountConfirmOpen(false)}
      />

      <ConfirmModal
        isOpen={isResetConfirmOpen}
        title={t.resetConfirmTitle}
        message={t.resetConfirmMsg}
        confirmText={t.resetConfirmBtn}
        cancelText={t.cancelBtn}
        isDanger={true}
        onConfirm={async () => {
          setIsResetConfirmOpen(false);
          await onResetAllData();
        }}
        onCancel={() => setIsResetConfirmOpen(false)}
      />
    </div>
  );
};
