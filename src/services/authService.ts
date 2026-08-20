// src/services/authService.ts
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { generateId } from '../utils/formatters';

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  createdAt: string;
  requiresEmailConfirmation?: boolean;
}

const USERS_STORAGE_KEY = 'duit_users_db';
const SESSION_STORAGE_KEY = 'duit_active_session';

function getLocalUsersDb(): UserProfile[] {
  const data = localStorage.getItem(USERS_STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

function saveLocalUsersDb(users: UserProfile[]) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

export const authService = {
  /**
   * Mendaftarkan pengguna baru via Supabase Auth (atau Local Mock jika offline/belum dikonfigurasi)
   */
  async registerWithEmail(email: string, password: string, name?: string): Promise<UserProfile> {
    const cleanEmail = email.trim().toLowerCase();
    const displayName = name?.trim() || cleanEmail.split('@')[0];

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            display_name: displayName,
          },
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

      // Simpan ke local cache pengguna
      const localUsers = getLocalUsersDb();
      if (!localUsers.find((u) => u.email.toLowerCase() === cleanEmail)) {
        localUsers.push(userProfile);
        saveLocalUsersDb(localUsers);
      }

      if (hasActiveSession) {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(userProfile));
      }

      return userProfile;
    }

    // --- FALLBACK OFFLINE LOCAL STORAGE MOCK ---
    await new Promise((resolve) => setTimeout(resolve, 400));
    const users = getLocalUsersDb();

    if (users.find((u) => u.email.toLowerCase() === cleanEmail)) {
      throw new Error('Email sudah terdaftar. Silakan gunakan menu Masuk.');
    }

    const mockPasswords = JSON.parse(localStorage.getItem('duit_mock_passwords') || '{}');
    const newUser: UserProfile = {
      id: generateId('user'),
      email: cleanEmail,
      displayName: displayName,
      createdAt: new Date().toISOString(),
      requiresEmailConfirmation: false,
    };

    users.push(newUser);
    saveLocalUsersDb(users);

    mockPasswords[newUser.id] = password;
    localStorage.setItem('duit_mock_passwords', JSON.stringify(mockPasswords));
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newUser));

    return newUser;
  },

  /**
   * Masuk dengan email & password
   */
  async loginWithEmail(email: string, password: string): Promise<UserProfile> {
    const cleanEmail = email.trim().toLowerCase();

    if (isSupabaseConfigured) {
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

      // Update local cache
      const localUsers = getLocalUsersDb();
      const existingIdx = localUsers.findIndex((u) => u.email.toLowerCase() === cleanEmail);
      if (existingIdx >= 0) {
        localUsers[existingIdx] = userProfile;
      } else {
        localUsers.push(userProfile);
      }
      saveLocalUsersDb(localUsers);

      return userProfile;
    }

    // --- FALLBACK OFFLINE LOCAL STORAGE MOCK ---
    await new Promise((resolve) => setTimeout(resolve, 300));
    const users = getLocalUsersDb();
    const user = users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      throw new Error('Akun belum terdaftar. Silakan lakukan pendaftaran.');
    }

    const mockPasswords = JSON.parse(localStorage.getItem('duit_mock_passwords') || '{}');
    if (mockPasswords[user.id] !== password) {
      throw new Error('Kata sandi salah.');
    }

    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    return user;
  },

  /**
   * Mendapatkan pengguna yang sedang aktif (current session)
   */
  async getCurrentUser(): Promise<UserProfile | null> {
    if (isSupabaseConfigured) {
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
        }
      } catch (e) {
        console.warn('Supabase getSession error:', e);
      }
    }

    try {
      const data = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!data) return null;
      return JSON.parse(data) as UserProfile;
    } catch {
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

        // Sign out dari Supabase
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Supabase delete account error:', err);
      }
    }

    // Bersihkan dari local mock DB jika ada
    try {
      if (userId) {
        const users = getLocalUsersDb();
        const remaining = users.filter((u) => u.id !== userId);
        saveLocalUsersDb(remaining);

        const mockPasswords = JSON.parse(localStorage.getItem('duit_mock_passwords') || '{}');
        delete mockPasswords[userId];
        localStorage.setItem('duit_mock_passwords', JSON.stringify(mockPasswords));
      }
    } catch (e) {
      console.warn('Local delete user error:', e);
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
