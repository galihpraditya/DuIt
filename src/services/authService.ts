// src/services/authService.ts

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  createdAt: string;
}

const USERS_STORAGE_KEY = 'duit_users_db';
const SESSION_STORAGE_KEY = 'duit_active_session';

/**
 * Mendapatkan daftar semua pengguna terdaftar dari LocalStorage.
 * Digunakan sebagai simulasi database.
 */
function getUsersDb(): UserProfile[] {
  const data = localStorage.getItem(USERS_STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

function saveUsersDb(users: UserProfile[]) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

/**
 * Mock Service untuk autentikasi yang bekerja 100% offline (Hybrid Local-First).
 * Semua fungsi ini bersifat Asynchronous (mengembalikan Promise) agar mudah diganti
 * dengan pemanggilan API nyata (Supabase/Firebase) di masa depan tanpa mengubah UI.
 */
export const authService = {
  /**
   * Mendaftarkan pengguna baru
   */
  async registerWithEmail(email: string, password: string, name?: string): Promise<UserProfile> {
    // Simulasi delay jaringan
    await new Promise((resolve) => setTimeout(resolve, 600));

    const users = getUsersDb();
    
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('Email sudah terdaftar. Silakan gunakan email lain atau masuk akun.');
    }

    // CATATAN: Di aplikasi production sungguhan, password TIDAK BOLEH disimpan plain text.
    // Karena ini adalah offline-first mock DB, kita simpan password secara lokal di item terpisah 
    // hanya untuk keperluan demo login antar device mock.
    const mockPasswords = JSON.parse(localStorage.getItem('duit_mock_passwords') || '{}');

    const newUser: UserProfile = {
      id: crypto.randomUUID(),
      email: email.toLowerCase(),
      displayName: name,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    saveUsersDb(users);
    
    mockPasswords[newUser.id] = password;
    localStorage.setItem('duit_mock_passwords', JSON.stringify(mockPasswords));

    // Otomatis login setelah daftar
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newUser));

    return newUser;
  },

  /**
   * Masuk dengan akun yang sudah ada
   */
  async loginWithEmail(email: string, password: string): Promise<UserProfile> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const users = getUsersDb();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

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
   * Mendapatkan pengguna yang sedang aktif
   */
  async getCurrentUser(): Promise<UserProfile | null> {
    try {
      const data = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!data) return null;
      return JSON.parse(data) as UserProfile;
    } catch {
      return null;
    }
  },

  /**
   * Keluar dari sesi
   */
  async logout(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }
};
