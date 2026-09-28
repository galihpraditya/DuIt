import type { Transaction } from '../types';
import type { Translations } from '../constants/translations';
import { format } from 'date-fns';

const STORAGE_KEY_ENABLED = 'duit_daily_reminder_enabled';
const STORAGE_KEY_TIME = 'duit_daily_reminder_time';
const STORAGE_KEY_LAST_DATE = 'duit_daily_reminder_last_date';

export interface ReminderSettings {
  enabled: boolean;
  time: string; // 'HH:mm' format
}

class ReminderService {
  /**
   * Cek apakah Web Notification API didukung di browser ini
   */
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  /**
   * Ambil status izin notifikasi saat ini
   */
  getPermission(): NotificationPermission | 'unsupported' {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission;
  }

  /**
   * Minta izin notifikasi ke browser
   */
  async requestPermission(): Promise<NotificationPermission | 'unsupported'> {
    if (!this.isSupported()) return 'unsupported';
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch {
      return this.getPermission();
    }
  }

  /**
   * Baca preferensi pengingat dari localStorage
   */
  getSettings(): ReminderSettings {
    if (typeof window === 'undefined') {
      return { enabled: false, time: '20:00' };
    }
    const enabled = localStorage.getItem(STORAGE_KEY_ENABLED) === 'true';
    const time = localStorage.getItem(STORAGE_KEY_TIME) || '20:00';
    return { enabled, time };
  }

  /**
   * Simpan preferensi pengingat ke localStorage
   */
  saveSettings(settings: ReminderSettings): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY_ENABLED, String(settings.enabled));
    localStorage.setItem(STORAGE_KEY_TIME, settings.time || '20:00');
  }

  /**
   * Kirim notifikasi sistem (mengutamakan Service Worker jika ada, fallback ke Web Notification)
   */
  private async dispatchNotification(title: string, options: NotificationOptions): Promise<void> {
    if (this.getPermission() !== 'granted') return;

    // Coba via ServiceWorkerRegistration (PWA compliant)
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration && typeof registration.showNotification === 'function') {
          await registration.showNotification(title, options);
          return;
        }
      } catch {
        // Fallback ke window.Notification
      }
    }

    // Fallback Web Notification API langsung
    try {
      const notification = new Notification(title, options);
      notification.onclick = () => {
        try {
          window.focus();
        } catch {}
        window.dispatchEvent(new CustomEvent('duit:open-new-transaction'));
        notification.close();
      };
    } catch (err) {
      console.warn('[ReminderService] Notification dispatch failed:', err);
    }
  }

  /**
   * Kirim notifikasi pengujian langsung
   */
  async sendTestNotification(t: Translations): Promise<boolean> {
    if (!this.isSupported()) return false;

    let permission = this.getPermission();
    if (permission !== 'granted') {
      permission = await this.requestPermission();
    }

    if (permission !== 'granted') {
      return false;
    }

    await this.dispatchNotification(t.reminderNotificationTitle, {
      body: t.reminderTestSuccess,
      icon: '/wallet-icon.svg',
      badge: '/wallet-icon.svg',
      tag: 'duit-reminder-test',
    });

    return true;
  }

  /**
   * Cek berkala apakah waktu pengingat telah tiba dan belum ada transaksi hari ini
   */
  async checkAndTriggerDailyReminder(
    transactions: Transaction[],
    t: Translations
  ): Promise<void> {
    const settings = this.getSettings();
    if (!settings.enabled) return;
    if (this.getPermission() !== 'granted') return;

    const now = new Date();
    const todayStr = format(now, 'yyyy-MM-dd');
    const lastDate = localStorage.getItem(STORAGE_KEY_LAST_DATE);

    // Sudah dikirim hari ini
    if (lastDate === todayStr) return;

    // Cek apakah waktu sekarang sudah mencapai atau melewati waktu pengingat
    const [targetH, targetM] = settings.time.split(':').map((v) => parseInt(v, 10));
    if (isNaN(targetH) || isNaN(targetM)) return;

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const targetMinutes = targetH * 60 + targetM;

    if (currentMinutes < targetMinutes) {
      // Belum masuk jam pengingat
      return;
    }

    // Cek apakah pengguna sudah memiliki transaksi hari ini
    const hasTodayTransaction = transactions.some((tx) => {
      try {
        return tx.date.startsWith(todayStr);
      } catch {
        return false;
      }
    });

    if (hasTodayTransaction) {
      // Pengguna sudah mencatat pengeluaran hari ini, tandai agar tidak diingatkan lagi hari ini
      localStorage.setItem(STORAGE_KEY_LAST_DATE, todayStr);
      return;
    }

    // Belum mencatat transaksi dan waktu pengingat sudah tiba: kirim notifikasi!
    await this.dispatchNotification(t.reminderNotificationTitle, {
      body: t.reminderNotificationBody,
      icon: '/wallet-icon.svg',
      badge: '/wallet-icon.svg',
      tag: 'duit-daily-reminder',
    });

    localStorage.setItem(STORAGE_KEY_LAST_DATE, todayStr);
  }
}

export const reminderService = new ReminderService();
