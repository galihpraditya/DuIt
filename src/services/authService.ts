// src/services/authService.ts
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { generateId } from '../utils/formatters';

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  createdAt: string;
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
   * Mendaftarkan pengguna baru via Supabase Auth (atau Local Mock jika belum dikonfigurasi)
   */
  async registerWithEmail(email: string, password: string, name?: string): Promise<UserProfile> {
    if (isSupabaseConfigured) {
      const displayName = name?.trim() || email.split('@')[0];
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            display_name: displayName,
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.user) {
        throw new Error('Gagal membuat akun. Silakan periksa kembali email Anda.');
      }

      const userProfile: UserProfile = {
        id: data.user.id,
        email: data.user.email || email,
        displayName: displayName,
        createdAt: data.user.created_at || new Date().toISOString(),
      };

      // Simpan / upsert ke tabel profiles
      try {
        await supabase.from('profiles').upsert({
          id: userProfile.id,
          email: userProfile.email,
          display_name: userProfile.displayName,
          updated_at: new Date().toISOString(),
        });
      } catch (profileErr) {
        console.warn('Upsert profile notice:', profileErr);
      }

      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(userProfile));
      return userProfile;
    }

    // --- FALLBACK OFFLINE LOCAL STORAGE MOCK ---
    await new Promise((resolve) => setTimeout(resolve, 500));
    const users = getLocalUsersDb();

    if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('Email sudah terdaftar. Silakan gunakan email lain atau masuk akun.');
    }

    const mockPasswords = JSON.parse(localStorage.getItem('duit_mock_passwords') || '{}');
    const newUser: UserProfile = {
      id: generateId('user'),
      email: email.toLowerCase(),
      displayName: name || email.split('@')[0],
      createdAt: new Date().toISOString(),
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
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        throw new Error(error.message === 'Invalid login credentials' ? 'Email atau kata sandi salah.' : error.message);
      }

      if (!data.user) {
        throw new Error('Login gagal. Silakan coba kembali.');
      }

      const userProfile: UserProfile = {
        id: data.user.id,
        email: data.user.email || email,
        displayName: data.user.user_metadata?.display_name || email.split('@')[0],
        avatarUrl: data.user.user_metadata?.avatar_url,
        createdAt: data.user.created_at || new Date().toISOString(),
      };

      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(userProfile));
      return userProfile;
    }

    // --- FALLBACK OFFLINE LOCAL STORAGE MOCK ---
    await new Promise((resolve) => setTimeout(resolve, 400));
    const users = getLocalUsersDb();
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      throw new Error('Email atau sandi salah.');
    }

    const mockPasswords = JSON.parse(localStorage.getItem('duit_mock_passwords') || '{}');
    if (mockPasswords[user.id] !== password) {
      throw new Error('Email atau sandi salah.');
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
