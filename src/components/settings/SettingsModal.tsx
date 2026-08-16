import React, { useState } from 'react';
import {
  Settings,
  X,
  Sun,
  Moon,
  Globe,
  FileSpreadsheet,
  Trash2,
  Check,
  Smartphone,
} from 'lucide-react';
import type { Language, Translations } from '../../constants/translations';
import { ConfirmModal } from '../common/ConfirmModal';
import type { UserProfile } from '../../services/authService';
import { User, LogOut } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onChangeLanguage: (lang: Language) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenExcelModal: () => void;
  onResetAllData: () => Promise<void>;
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  onLogout: () => Promise<void>;
  t: Translations;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  language,
  onChangeLanguage,
  darkMode,
  onToggleDarkMode,
  onOpenExcelModal,
  onResetAllData,
  currentUser,
  onOpenAuth,
  onLogout,
  t,
}) => {
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
        <div className="glass-modal rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/40">
                <Settings className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">{t.settingsTitle}</h3>
                <p className="text-[11px] text-slate-400">{t.settingsDesc}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700 dark:text-slate-300">
            {/* Section 0: Account */}
            <div className="space-y-2">
              <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5 text-xs">
                <User className="w-3.5 h-3.5 text-emerald-500" />
                <span>{t.authAccountSection}</span>
              </label>
              
              {currentUser ? (
                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-3 overflow-hidden pr-3">
                    <div className="w-9 h-9 shrink-0 bg-emerald-500 text-white rounded-xl flex items-center justify-center font-bold">
                      {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : (currentUser.email ? currentUser.email.charAt(0).toUpperCase() : 'U')}
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-slate-800 dark:text-slate-100 truncate">
                        {currentUser.displayName || currentUser.email}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">{currentUser.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsLogoutConfirmOpen(true)}
                    className="shrink-0 p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title={t.authLogout}
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    onClose();
                    onOpenAuth();
                  }}
                  className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center space-x-3 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{t.authSignIn}</p>
                    <p className="text-[11px] text-slate-400">{t.authLoginToSync}</p>
                  </div>
                </button>
              )}
            </div>

            {/* Section 1: Language */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5 text-xs">
                <Globe className="w-3.5 h-3.5 text-emerald-500" />
                <span>{t.languageSection}</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onChangeLanguage('id')}
                  className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                    language === 'id'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold shadow-sm ring-1 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-base">🇮🇩</span>
                    <span>Bahasa Indonesia</span>
                  </div>
                  {language === 'id' && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                </button>

                <button
                  type="button"
                  onClick={() => onChangeLanguage('en')}
                  className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                    language === 'en'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold shadow-sm ring-1 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-base">🇬🇧</span>
                    <span>English</span>
                  </div>
                  {language === 'en' && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                </button>
              </div>
            </div>

            {/* Section 2: Theme (Dark / Light) */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5 text-xs">
                {darkMode ? (
                  <Moon className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                )}
                <span>{t.themeSection}</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (darkMode) onToggleDarkMode();
                  }}
                  className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                    !darkMode
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold shadow-sm ring-1 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span>{t.lightMode}</span>
                  </div>
                  {!darkMode && <Check className="w-4 h-4 text-emerald-600" />}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!darkMode) onToggleDarkMode();
                  }}
                  className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                    darkMode
                      ? 'border-emerald-500 bg-emerald-950/40 text-emerald-200 font-bold shadow-sm ring-1 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Moon className="w-4 h-4 text-emerald-400" />
                    <span>{t.darkMode}</span>
                  </div>
                  {darkMode && <Check className="w-4 h-4 text-emerald-400" />}
                </button>
              </div>
            </div>

            {/* Section 3: Excel & Data Management */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5 text-xs">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                <span>{t.dataManagementSection}</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenExcelModal();
                }}
                className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                      {t.openExcelCenter}
                    </p>
                    <p className="text-[11px] text-slate-400">{t.dataManagementDesc}</p>
                  </div>
                </div>
                <span className="text-slate-400 group-hover:translate-x-0.5 transition-transform">→</span>
              </button>
            </div>

            {/* Section 4: Danger Zone / Reset */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="font-bold text-rose-600 dark:text-rose-400 flex items-center space-x-1.5 text-xs">
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t.dangerZoneSection}</span>
              </label>
              <div className="p-3.5 rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 space-y-2">
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t.resetAllDataDesc}
                </p>
                <button
                  type="button"
                  onClick={() => setIsResetConfirmOpen(true)}
                  className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-sm transition-colors flex items-center space-x-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t.resetAllData}</span>
                </button>
              </div>
            </div>

            {/* App Info / Footer */}
            <div className="pt-2 text-center text-[11px] text-slate-400 flex items-center justify-center space-x-1">
              <Smartphone className="w-3.5 h-3.5 text-slate-400" />
              <span>{t.versionLabel}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Resetting Database */}
      <ConfirmModal
        isOpen={isResetConfirmOpen}
        title={t.resetConfirmTitle}
        message={t.resetConfirmMsg}
        confirmText={t.resetConfirmBtn}
        cancelText={t.cancelBtn}
        isDanger={true}
        onConfirm={async () => {
          setIsResetConfirmOpen(false);
          onClose();
          await onResetAllData();
        }}
        onCancel={() => setIsResetConfirmOpen(false)}
      />

      {/* Confirmation Modal for Logout */}
      <ConfirmModal
        isOpen={isLogoutConfirmOpen}
        title={t.authLogoutConfirmTitle}
        message={t.authLogoutConfirmMsg}
        confirmText={t.authLogout}
        cancelText={t.cancelBtn}
        isDanger={true}
        onConfirm={async () => {
          setIsLogoutConfirmOpen(false);
          await onLogout();
        }}
        onCancel={() => setIsLogoutConfirmOpen(false)}
      />
    </>
  );
};
