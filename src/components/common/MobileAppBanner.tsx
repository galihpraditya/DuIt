import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, Sparkles } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { APP_CONFIG } from '../../constants/appVersion';
import type { Translations } from '../../constants/translations';

const DISMISS_STORAGE_KEY = 'duit_app_banner_dismissed_until';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

interface MobileAppBannerProps {
  t: Translations;
}

export const MobileAppBanner: React.FC<MobileAppBannerProps> = ({ t }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallingPwa, setIsInstallingPwa] = useState(false);

  useEffect(() => {
    // 1. Never show inside native Capacitor app
    if (Capacitor.isNativePlatform()) {
      return;
    }

    // 2. Never show if already running in standalone PWA mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    if (isStandalone) {
      return;
    }

    // 3. Check dismissal timestamp
    const dismissedUntil = localStorage.getItem(DISMISS_STORAGE_KEY);
    if (dismissedUntil && Date.now() < Number(dismissedUntil)) {
      return;
    }

    // 4. Capture PWA beforeinstallprompt if browser triggers it
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Show banner on mobile/tablet viewports
    const checkViewport = () => {
      if (window.innerWidth <= 1024) {
        setIsVisible(true);
      }
    };
    checkViewport();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(DISMISS_STORAGE_KEY, String(Date.now() + SEVEN_DAYS_MS));
  };

  const handleInstallPwa = async () => {
    if (!deferredPrompt) {
      // Fallback: direct to APK download if PWA prompt not supported by this browser
      window.open(APP_CONFIG.latestApkDownloadUrl, '_blank');
      return;
    }
    setIsInstallingPwa(true);
    try {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsVisible(false);
      }
    } catch (e) {
      console.warn('PWA install prompt error', e);
    } finally {
      setIsInstallingPwa(false);
      setDeferredPrompt(null);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="relative w-full">
      <div className="glass-card rounded-2xl p-3 sm:p-3.5 border border-emerald-500/25 bg-gradient-to-r from-emerald-50/80 via-white/80 to-slate-50/80 dark:from-emerald-950/40 dark:via-slate-900/60 dark:to-slate-900/60 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left Info: App Icon & Tagline */}
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] flex items-center justify-center text-white shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="min-w-0 pr-6 sm:pr-0">
            <div className="flex items-center space-x-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                DuIt v{APP_CONFIG.version}
              </span>
              <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                Mobile App
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
              {t.installAppBannerSubtitle || 'Pasang di HP Anda untuk akses offline instan & lebih cepat'}
            </p>
          </div>
        </div>

        {/* Right Actions: PWA Install & Direct APK Download */}
        <div className="flex items-center space-x-2 self-stretch sm:self-auto shrink-0">
          {deferredPrompt && (
            <button
              type="button"
              onClick={handleInstallPwa}
              disabled={isInstallingPwa}
              className="flex-1 sm:flex-initial px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all flex items-center justify-center space-x-1 cursor-pointer active:scale-95"
            >
              <span>{t.installPwaBtn || 'Pasang Cepat'}</span>
            </button>
          )}

          <a
            href={APP_CONFIG.latestApkDownloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            download="DuIt-Wallet-latest.apk"
            className="flex-1 sm:flex-initial px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center space-x-1 cursor-pointer active:scale-95"
            title={`Unduh APK v${APP_CONFIG.version}`}
          >
            <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{t.downloadApkBtn || 'Unduh APK'}</span>
          </a>

          {/* Dismiss button */}
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Tutup pemberitahuan"
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
