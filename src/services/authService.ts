// src/services/authService.ts
import { Capacitor } from '@capacitor/core';
import { supabase, isSupabaseConfigured } from './supabaseClient';

// Domain produksi untuk redirect link verifikasi email.
// Di web memakai origin aktif; di native (Capacitor) memakai VITE_APP_URL karena
// origin aplikasi adalah https://localhost yang tidak bisa diakses dari email.
const PROD_APP_URL = 'https://duit-wallet.vercel.app';

const getEmailRedirectUrl = (): string => {
  if (Capacitor.isNativePlatform()) {
    const envUrl = import.meta.env.VITE_APP_URL as string | undefined;
    return `${(envUrl && envUrl.trim()) || PROD_APP_URL}`.replace(/\/+$/, '') + '/';
  }
  return `${window.location.origin}/`;
};

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  createdAt: string;
  requiresEmailConfirmation?: boolean;
}

const SESSION_STORAGE_KEY = 'duit_active_session';

export const authService = {
  /**
   * Mendaftarkan pengguna baru via Supabase Auth
   */
  async registerWithEmail(email: string, password: string, name?: string): Promise<UserProfile> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase belum dikonfigurasi. Silakan periksa file .env Anda.');
    }

    const cleanEmail = email.trim().toLowerCase();
    const displayName = name?.trim() || cleanEmail.split('@')[0];

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          display_name: displayName,
        },
        emailRedirectTo: getEmailRedirectUrl(),
      },
    });

    if (error) {
      if (error.message.includes('already registered') || error.message.includes('User already registered')) {
        throw new Error('Email ini sudah terdaftar. Silakan gunakan menu Masuk.');
      }
      if (error.message.includes('Password should be')) {
        throw new Error('Kata sandi terlalu pendek. Gunakan minimal 6 karakter.');
      }
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('Gagal membuat akun. Silakan periksa kembali email Anda.');
    }

    // Deteksi jika email sudah pernah terdaftar (Supabase mengembalikan user dengan identities kosong)
    if (Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      throw new Error('Email ini sudah terdaftar. Silakan masuk menggunakan kata sandi Anda.');
    }

    const hasActiveSession = Boolean(data.session);

    const userProfile: UserProfile = {
      id: data.user.id,
      email: data.user.email || cleanEmail,
      displayName: displayName,
      createdAt: data.user.created_at || new Date().toISOString(),
      requiresEmailConfirmation: !hasActiveSession,
    };

    if (hasActiveSession) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(userProfile));
    }

    return userProfile;
  },

  /**
   * Masuk dengan email & password
   */
  async loginWithEmail(email: string, password: string): Promise<UserProfile> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase belum dikonfigurasi. Silakan periksa file .env Anda.');
    }

    const cleanEmail = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('email not confirmed')) {
        throw new Error(
          'Email belum dikonfirmasi! Silakan periksa inbox email Anda untuk klik link verifikasi, atau matikan opsi "Confirm email" di Dashboard Supabase (Authentication > Providers > Email) agar bisa langsung login.'
        );
      }
      if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
        throw new Error('Email atau kata sandi salah. Pastikan email dan sandi sudah benar.');
      }
      if (msg.includes('rate limit')) {
        throw new Error('Terlalu banyak percobaan masuk. Silakan tunggu beberapa saat.');
      }
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('Login gagal. Silakan coba kembali.');
    }

    const userProfile: UserProfile = {
      id: data.user.id,
      email: data.user.email || cleanEmail,
      displayName: data.user.user_metadata?.display_name || cleanEmail.split('@')[0],
      avatarUrl: data.user.user_metadata?.avatar_url,
      createdAt: data.user.created_at || new Date().toISOString(),
      requiresEmailConfirmation: false,
    };

    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(userProfile));

    return userProfile;
  },

  /**
   * Mendapatkan pengguna yang sedang aktif (current session)
   */
  async getCurrentUser(): Promise<UserProfile | null> {
    if (!isSupabaseConfigured) return null;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const user = session.user;
        const userProfile: UserProfile = {
          id: user.id,
          email: user.email || '',
          displayName: user.user_metadata?.display_name || user.email?.split('@')[0],
          avatarUrl: user.user_metadata?.avatar_url,
          createdAt: user.created_at || new Date().toISOString(),
          requiresEmailConfirmation: false,
        };
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(userProfile));
        return userProfile;
      } else {
        // Sesi Supabase tidak aktif / null, bersihkan active session di local
        localStorage.removeItem(SESSION_STORAGE_KEY);
        return null;
      }
    } catch (e) {
      console.warn('Supabase getSession error:', e);
      return null;
    }
  },

  /**
   * Keluar dari akun (Sign Out)
   */
  async logout(): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Supabase signOut error:', e);
      }
    }
    localStorage.removeItem(SESSION_STORAGE_KEY);
  },

  /**
   * Menghapus akun pengguna secara permanen beserta data cloud terkait
   */
  async deleteAccount(userId?: string): Promise<void> {
    if (isSupabaseConfigured && userId) {
      try {
        // Hapus data pengguna di tabel-tabel Supabase
        await supabase.from('transactions').delete().eq('user_id', userId);
        await supabase.from('categories').delete().eq('user_id', userId);
        await supabase.from('budgets').delete().eq('user_id', userId);
        await supabase.from('recurring_expenses').delete().eq('user_id', userId);
        await supabase.from('profiles').delete().eq('id', userId);

        // Hapus auth.users secara permanen via RPC
        const { error } = await supabase.rpc('delete_user');
        if (error) {
          console.warn('Gagal menghapus auth.users via RPC:', error);
        }

        // Sign out dari Supabase
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Supabase delete account error:', err);
      }
    }

    localStorage.removeItem(SESSION_STORAGE_KEY);
  },

  /**
   * Memantau perubahan status autentikasi secara realtime
   */
  onAuthStateChange(callback: (user: UserProfile | null) => void) {
    if (isSupabaseConfigured) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const userProfile: UserProfile = {
            id: session.user.id,
            email: session.user.email || '',
            displayName: session.user.user_metadata?.display_name || session.user.email?.split('@')[0],
            avatarUrl: session.user.user_metadata?.avatar_url,
            createdAt: session.user.created_at || new Date().toISOString(),
            requiresEmailConfirmation: false,
          };
          localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(userProfile));
          callback(userProfile);
        } else {
          localStorage.removeItem(SESSION_STORAGE_KEY);
          callback(null);
        }
      });
      return () => subscription.unsubscribe();
    }
    return () => {};
  },
};
