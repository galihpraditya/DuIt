import React, { useState } from 'react';
import {
  Settings,
  Globe,
  FileSpreadsheet,
  Check,
  User,
  LogOut,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Database,
  Cloud,
  ShieldAlert,
  Sliders,
  Bell,
  Clock,
  AlertCircle,
  CheckCircle2,
  Send,
  Cpu,
  Eye,
  EyeOff,
  ExternalLink,
  Key,
  Download,
  ArrowUpDown,
} from 'lucide-react';
import { APP_CONFIG } from '../../constants/appVersion';
import type { Language, Translations } from '../../constants/translations';
import { ConfirmModal } from '../common/ConfirmModal';
import type { UserProfile } from '../../services/authService';
import { reminderService, type ReminderSettings } from '../../services/reminderService';
import { aiService } from '../../services/aiService';
import { ThemeCustomizer } from './ThemeCustomizer';

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
  incomeEnabled?: boolean;
  onToggleIncomeEnabled?: (enabled: boolean) => void;
  transactionCount?: number;
  categoryCount?: number;
  t: Translations;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  language,
  onChangeLanguage,
  darkMode: _darkMode,
  onToggleDarkMode: _onToggleDarkMode,
  onOpenExcelModal,
  onResetAllData,
  currentUser,
  onOpenAuth,
  onLogout,
  onDeleteAccount,
  onBackToTransactions,
  incomeEnabled = false,
  onToggleIncomeEnabled,
  transactionCount = 0,
  categoryCount = 0,
  t,
}) => {
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isDeleteAccountConfirmOpen, setIsDeleteAccountConfirmOpen] = useState(false);
  const [isThemeExpanded, setIsThemeExpanded] = useState(false);
  const [isAiExpanded, setIsAiExpanded] = useState(false);
  const [isDataExpanded, setIsDataExpanded] = useState(false);

  // Daily Reminder state
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>(() =>
    reminderService.getSettings()
  );
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'unsupported'>(() =>
    reminderService.getPermission()
  );
  const [isTestingReminder, setIsTestingReminder] = useState(false);
  const [reminderFeedback, setReminderFeedback] = useState<string | null>(null);

  const handleToggleReminder = async () => {
    const nextEnabled = !reminderSettings.enabled;

    if (nextEnabled) {
      const perm = await reminderService.requestPermission();
      setPermissionStatus(perm);
      if (perm !== 'granted') {
        setReminderFeedback(t.reminderPermissionDenied);
        setTimeout(() => setReminderFeedback(null), 5000);
        return;
      }
    }

    const updated = { ...reminderSettings, enabled: nextEnabled };
    reminderService.saveSettings(updated);
    setReminderSettings(updated);
  };

  const handleReminderTimeChange = (newTime: string) => {
    const updated = { ...reminderSettings, time: newTime };
    reminderService.saveSettings(updated);
    setReminderSettings(updated);
  };

  const handleTestReminder = async () => {
    setIsTestingReminder(true);
    setReminderFeedback(null);
    try {
      const success = await reminderService.sendTestNotification(t);
      setPermissionStatus(reminderService.getPermission());
      if (success) {
        setReminderFeedback(t.reminderTestSuccess);
      } else {
        setReminderFeedback(t.reminderPermissionDenied);
      }
    } catch {
      setReminderFeedback(t.reminderPermissionDenied);
    } finally {
      setIsTestingReminder(false);
      setTimeout(() => setReminderFeedback(null), 4000);
    }
  };

  // Groq AI state
  const [groqApiKey, setGroqApiKey] = useState(() => aiService.getUserApiKey());
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTestingAi, setIsTestingAi] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<{ message: string; isError?: boolean } | null>(null);

  const handleSaveApiKey = async () => {
    aiService.saveApiKey(groqApiKey);
    if (!groqApiKey.trim()) {
      if (aiService.hasDefaultEnvApiKey()) {
        setIsTestingAi(true);
        const result = await aiService.testApiKey();
        setIsTestingAi(false);
        setAiFeedback({
          message: `Kunci kustom dihapus. Menggunakan default .env: ${result.message}`,
          isError: !result.success,
        });
      } else {
        setAiFeedback({ message: 'API Key berhasil dihapus', isError: false });
      }
      setTimeout(() => setAiFeedback(null), 4000);
      return;
    }
    setIsTestingAi(true);
    const result = await aiService.testApiKey(groqApiKey);
    setIsTestingAi(false);
    setAiFeedback({ message: result.message, isError: !result.success });
    setTimeout(() => setAiFeedback(null), 6000);
  };

  const handleRemoveApiKey = () => {
    aiService.removeApiKey();
    setGroqApiKey('');
    if (aiService.hasDefaultEnvApiKey()) {
      setAiFeedback({
        message: 'Kunci kustom dihapus. Beralih ke default API Key dari .env',
        isError: false,
      });
    } else {
      setAiFeedback({ message: 'API Key berhasil dihapus', isError: false });
    }
    setTimeout(() => setAiFeedback(null), 3000);
  };

  return (
    <div className="space-y-5 max-w-4xl w-full mx-auto pb-14 animate-in fade-in duration-200">

      {/* Header Banner */}
      <div className="flex items-center justify-between py-1 px-1 sm:px-0">
        <div className="flex items-center space-x-2.5 sm:space-x-3.5">
          {/* Back button on mobile */}
          <button
            type="button"
            onClick={onBackToTransactions}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center sm:hidden rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all cursor-pointer"
            title={t.backToTransactions}
            aria-label={t.backToTransactions}
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
          </button>

          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] flex items-center justify-center text-white shrink-0">
            <Settings className="w-5 h-5 stroke-[2.5]" />
          </div>

          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            {t.settingsTitle}
          </h1>
        </div>

        {/* Back button on desktop */}
        <button
          type="button"
          onClick={onBackToTransactions}
          className="hidden sm:flex items-center space-x-1.5 min-h-[38px] px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer active:scale-95"
          title={t.backToTransactions}
        >
          <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
          <span>{t.backToTransactions}</span>
        </button>
      </div>

      {/* Section 1: Account & Cloud Sync */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] flex items-center justify-center text-white shrink-0">
            <User className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            {t.authAccountSection}
          </h2>
        </div>

        {currentUser ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
            <div className="flex items-center space-x-3.5 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-base shrink-0">
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
                <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{currentUser.email}</p>
                <div className="flex items-center space-x-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    {t.statusConnected || 'Tersinkronisasi'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setIsLogoutConfirmOpen(true)}
                className="min-h-[38px] px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center space-x-1.5 transition-colors cursor-pointer active:scale-95"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t.authLogout}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsDeleteAccountConfirmOpen(true)}
                className="min-h-[38px] px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
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
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  {t.authLoginToSync || 'Masuk untuk mencadangkan data dan sinkronisasi otomatis antar perangkat'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenAuth}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer active:scale-95 shrink-0 self-start sm:self-auto"
            >
              {t.authSignIn}
            </button>
          </div>
        )}
      </div>

      {/* Section 2: Preferences (Language, Income Mode, Daily Reminder, Theme Customizer Accordion) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden">
        {/* Row: Bahasa */}
        <div className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
              <Globe className="w-4 h-4" />
            </div>
            <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
              {t.languageSection}
            </p>
          </div>

          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-auto">
            <button
              type="button"
              onClick={() => onChangeLanguage('id')}
              className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center space-x-1.5 ${language === 'id'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 font-bold shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
            >
              {language === 'id' && <Check className="w-3 h-3 stroke-[3]" />}
              <span>Bahasa Indonesia</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeLanguage('en')}
              className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center space-x-1.5 ${language === 'en'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 font-bold shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
            >
              {language === 'en' && <Check className="w-3 h-3 stroke-[3]" />}
              <span>English</span>
            </button>
          </div>
        </div>

        {/* Row: Fitur Pendapatan & Arus Kas */}
        {onToggleIncomeEnabled && (
          <div className="p-4 sm:px-5 flex items-center justify-between gap-4">
            <div className="flex items-start space-x-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <ArrowUpDown className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  {t.incomeFeatureSection}
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                  {t.incomeFeatureDesc}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onToggleIncomeEnabled(!incomeEnabled)}
              role="switch"
              aria-checked={incomeEnabled}
              aria-label={t.incomeFeatureTitle}
              className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer p-0.5 shrink-0 ${
                incomeEnabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full bg-white shadow-sm transform transition-transform ${
                  incomeEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        )}

        {/* Row: Pengingat Harian */}
        <div className="p-4 sm:px-5 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                {t.reminderSection}
              </h2>
            </div>

            <button
              type="button"
              onClick={handleToggleReminder}
              role="switch"
              aria-checked={reminderSettings.enabled}
              aria-label={t.reminderSection}
              className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer p-0.5 shrink-0 ${reminderSettings.enabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
            >
              <div
                className={`w-6 h-6 rounded-full bg-white shadow-sm transform transition-transform ${reminderSettings.enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
              />
            </button>
          </div>

          {reminderSettings.enabled && (
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                  <span>{t.reminderTime}</span>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                  {['19:00', '20:00', '21:00'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleReminderTimeChange(preset)}
                      className={`min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${reminderSettings.time === preset
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                    >
                      {preset}
                    </button>
                  ))}

                  <input
                    type="time"
                    value={reminderSettings.time}
                    onChange={(e) => handleReminderTimeChange(e.target.value)}
                    className="min-h-[36px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 [color-scheme:light] dark:[color-scheme:dark]"
                  />

                  <button
                    type="button"
                    onClick={handleTestReminder}
                    disabled={isTestingReminder}
                    className="min-h-[36px] px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition-colors shrink-0 cursor-pointer active:scale-95 disabled:opacity-50"
                    title={t.reminderTestBtn}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isTestingReminder ? 'Mengirim...' : t.reminderTestBtn}</span>
                  </button>
                </div>
              </div>

              {permissionStatus === 'denied' && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/40 flex items-start space-x-2.5 text-amber-800 dark:text-amber-200 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  <p>{t.reminderPermissionDenied}</p>
                </div>
              )}

              {reminderFeedback && (
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/40 flex items-center space-x-2 text-emerald-800 dark:text-emerald-200 text-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <p>{reminderFeedback}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Accordion Row: Kustomisasi Tampilan (ThemeCustomizer) */}
        <div>
          <button
            type="button"
            onClick={() => setIsThemeExpanded((prev) => !prev)}
            aria-expanded={isThemeExpanded}
            className="w-full p-4 sm:px-5 min-h-[52px] flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer text-left"
          >
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0">
                <Sliders className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                {t.appearanceAndLanguage}
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-slate-600 dark:text-slate-400 transition-transform ${
                isThemeExpanded ? 'rotate-180' : ''
              }`}
            />
          </button>

          {isThemeExpanded && (
            <div className="px-4 sm:px-5 pb-5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <ThemeCustomizer t={t} />
            </div>
          )}
        </div>
      </div>

      {/* Section 3: Tools, Excel, Data & App */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden">
        {/* Accordion Row: Smart AI Input */}
        <div>
          <button
            type="button"
            onClick={() => setIsAiExpanded((prev) => !prev)}
            aria-expanded={isAiExpanded}
            className="w-full p-4 sm:px-5 min-h-[52px] flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer text-left"
          >
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block">
                  {t.aiSection}
                </span>
                <span className="text-[11px] text-slate-600 dark:text-slate-400">
                  {groqApiKey.trim() || aiService.hasDefaultEnvApiKey() ? t.aiStatusActive : t.aiStatusInactive}
                </span>
              </div>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-slate-600 dark:text-slate-400 transition-transform ${
                isAiExpanded ? 'rotate-180' : ''
              }`}
            />
          </button>

          {isAiExpanded && (
            <div className="px-4 sm:px-5 pb-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                  <Key className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{t.aiApiKeyLabel}</span>
                </label>

                <div className="relative flex items-center">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={groqApiKey}
                    onChange={(e) => setGroqApiKey(e.target.value)}
                    placeholder={
                      aiService.hasDefaultEnvApiKey()
                        ? 'gsk_........'
                        : t.aiApiKeyPlaceholder
                    }
                    className="w-full min-h-[42px] px-3.5 py-2 pr-11 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-500 text-xs sm:text-sm font-mono focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-1 min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
                    title={showApiKey ? 'Sembunyikan' : 'Tampilkan'}
                    aria-label={showApiKey ? 'Sembunyikan' : 'Tampilkan'}
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline py-1"
                >
                  <span>{t.aiGetKeyHelp}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <div className="flex items-center space-x-2 self-end sm:self-auto w-full sm:w-auto">
                  {groqApiKey.trim() && (
                    <button
                      type="button"
                      onClick={handleRemoveApiKey}
                      className="flex-1 sm:flex-none min-h-[38px] px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    >
                      {t.aiRemoveKeyBtn}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleSaveApiKey}
                    disabled={isTestingAi}
                    className="flex-1 sm:flex-none min-h-[38px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-1.5"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{isTestingAi ? 'Menguji...' : t.aiSaveKeyBtn}</span>
                  </button>
                </div>
              </div>

              {aiFeedback && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center space-x-2 ${aiFeedback.isError
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-200'
                    }`}
                >
                  {aiFeedback.isError ? (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                  )}
                  <p>{aiFeedback.message}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Row: Pusat Excel */}
        <div className="p-4 sm:px-5 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
              {t.openExcelCenter}
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenExcelModal}
            className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center space-x-1 transition-colors shrink-0 cursor-pointer active:scale-95"
          >
            <span>{language === 'id' ? 'Buka' : 'Open'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Accordion Row: Data Lokal, Reset & APK */}
        <div>
          <button
            type="button"
            onClick={() => setIsDataExpanded((prev) => !prev)}
            aria-expanded={isDataExpanded}
            className="w-full p-4 sm:px-5 min-h-[52px] flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer text-left"
          >
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block">
                  {t.dataManagementSection}
                </span>
                <span className="text-[11px] text-slate-600 dark:text-slate-400">
                  {transactionCount} {t.transactions} • {categoryCount} {t.categories}
                </span>
              </div>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-slate-600 dark:text-slate-400 transition-transform ${
                isDataExpanded ? 'rotate-180' : ''
              }`}
            />
          </button>

          {isDataExpanded && (
            <div className="px-4 sm:px-5 pb-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-4">
              {/* Native APK Download */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                      {t.downloadApkNativeTitle} ({`v${APP_CONFIG.version}`})
                    </h3>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                      {t.downloadApkNativeDesc}
                    </p>
                  </div>
                </div>

                <a
                  href={APP_CONFIG.latestApkDownloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download="DuIt-Wallet-latest.apk"
                  className="min-h-[38px] px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center justify-center space-x-1.5 cursor-pointer shrink-0 self-start sm:self-auto"
                >
                  <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{t.downloadApkBtn}</span>
                </a>
              </div>

              {/* Danger Zone: Reset */}
              <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {t.resetAllData}
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      {t.resetAllDataDesc}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsResetConfirmOpen(true)}
                  className="min-h-[38px] px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
                >
                  {t.resetConfirmBtn}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* App Version Footer */}
      <div className="pt-2 text-center text-xs text-slate-600 dark:text-slate-400 font-medium">
        {t.versionLabel} • Build {APP_CONFIG.buildNumber}
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
