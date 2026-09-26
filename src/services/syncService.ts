// src/services/syncService.ts
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { db, DEFAULT_CATEGORIES } from '../db/database';
import type { Category, Transaction, Budget, RecurringExpense } from '../types';

let ongoingSync: Promise<{ success: boolean; error?: string }> | null = null;

/**
 * Melakukan upsert data ke Supabase secara aman.
 * Mendukung skema baru (composite PK: id, user_id) dengan fallback otomatis
 * ke skema legacy (single PK: id) jika backend belum dimigrasi.
 * Melempar error jika operasi gagal agar proses sync tidak berjalan 'silent fail'.
 */
export async function safeUpsert(table: string, payload: any[]) {
  if (!payload || payload.length === 0) return;

  // 1. Coba upsert dengan onConflict: 'id, user_id' (skema modern multi-user)
  const { error: primaryError } = await supabase
    .from(table)
    .upsert(payload, { onConflict: 'id, user_id' });

  if (!primaryError) {
    return;
  }

  // 2. Jika skema database belum memiliki constraint composite (id, user_id) -> PostgreSQL error 42P10
  if (primaryError.code === '42P10') {
    const { error: fallbackError } = await supabase
      .from(table)
      .upsert(payload, { onConflict: 'id' });

    if (fallbackError) {
      console.error(`[SyncService] Fallback upsert failed on ${table}:`, fallbackError);
      throw new Error(`Gagal menyinkronkan ${table}: ${fallbackError.message}`);
    }
    return;
  }

  console.error(`[SyncService] Upsert error on ${table}:`, primaryError);
  throw new Error(`Gagal menyinkronkan ${table}: ${primaryError.message}`);
}

export const syncService = {
  /**
   * Menyelaraskan seluruh data lokal dengan Supabase Cloud secara cepat dan terurut aman.
   * Kategori disinkronkan terlebih dahulu agar transaksi yang merujuk category_id tidak gagal.
   */
  async syncAll(userId: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured || !userId) {
      return { success: true };
    }

    // Jika proses sinkronisasi sedang berjalan, gunakan promise yang sama (deduplikasi in-flight)
    if (ongoingSync) {
      return ongoingSync;
    }

    ongoingSync = (async () => {
      try {
        // 1. Sinkronisasi Kategori DAHULU agar relasi kategori valid untuk transaksi & anggaran
        await this.syncCategories(userId);

        // 2. Sinkronisasi Transaksi, Anggaran, dan Pengeluaran Berulang secara konkuren
        await Promise.all([
          this.syncTransactions(userId),
          this.syncBudgets(userId),
          this.syncRecurringExpenses(userId),
        ]);

        return { success: true };
      } catch (err: any) {
        console.error('Data sync failed:', err);
        return { success: false, error: err.message || 'Gagal menyelaraskan data cloud' };
      } finally {
        ongoingSync = null;
      }
    })();

    return ongoingSync;
  },

  /**
   * Sinkronisasi Kategori Dua Arah (High Performance with bulkPut & safeUpsert)
   */
  async syncCategories(userId: string) {
    const { data: cloudCats, error: fetchErr } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId);

    if (fetchErr) {
      console.error('[SyncService] Fetch cloud categories error:', fetchErr);
      throw fetchErr;
    }

    const localCats = await db.categories.toArray();

    if (cloudCats && cloudCats.length > 0) {
      const cloudIds = new Set(cloudCats.map((c) => c.id));
      const localMap = new Map(localCats.map((l) => [l.id, l]));

      // Update/Insert kategori dari cloud ke local Dexie secara atomic dengan bulkPut
      const catObjects: Category[] = cloudCats.map((cc) => {
        const localExisting = localMap.get(cc.id);
        return {
          id: cc.id,
          name: cc.name,
          icon: cc.icon,
          color: cc.color,
          budgetLimit: cc.budget_limit ? Number(cc.budget_limit) : undefined,
          isDefault: cc.is_default,
          order: typeof cc.order_index === 'number' ? cc.order_index : localExisting?.order,
          createdAt: cc.created_at,
        };
      });
      await db.categories.bulkPut(catObjects);

      // Unggah kategori kustom lokal yang belum ada di cloud
      const unsyncedLocal = localCats.filter((l) => !cloudIds.has(l.id));
      if (unsyncedLocal.length > 0) {
        const payload = unsyncedLocal.map((cat) => ({
          id: cat.id,
          user_id: userId,
          name: cat.name,
          icon: cat.icon,
          color: cat.color,
          budget_limit: cat.budgetLimit || 0,
          is_default: cat.isDefault || false,
          order_index: typeof cat.order === 'number' ? cat.order : 0,
          created_at: cat.createdAt || new Date().toISOString(),
        }));
        await safeUpsert('categories', payload);
      }
    } else if (localCats.length > 0) {
      // Jika cloud masih kosong, upload seluruh data lokal ke cloud
      const payload = localCats.map((cat) => ({
        id: cat.id,
        user_id: userId,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        budget_limit: cat.budgetLimit || 0,
        is_default: cat.isDefault || false,
        order_index: typeof cat.order === 'number' ? cat.order : 0,
        created_at: cat.createdAt || new Date().toISOString(),
      }));
      await safeUpsert('categories', payload);
    }
  },

  /**
   * Sinkronisasi Transaksi Dua Arah (High Performance with bulkPut & safeUpsert)
   * Menyimpan transaksi lokal (termasuk yang dicatat saat guest) ke cloud saat pengguna login.
   */
  async syncTransactions(userId: string) {
    const { data: cloudTxs, error: fetchErr } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId);

    if (fetchErr) {
      console.error('[SyncService] Fetch cloud transactions error:', fetchErr);
      throw fetchErr;
    }

    const localTxs = await db.transactions.toArray();
    const cloudIds = new Set((cloudTxs || []).map((t) => t.id));

    if (cloudTxs && cloudTxs.length > 0) {
      // 1. Simpan/perbarui data dari cloud ke lokal secara atomic dalam 1 transaksi IndexedDB
      const txObjects: Transaction[] = cloudTxs.map((ctx) => ({
        id: ctx.id,
        amount: Number(ctx.amount),
        date: ctx.date,
        categoryId: ctx.category_id,
        notes: ctx.notes || undefined,
        paymentMethod: ctx.payment_method || undefined,
        tags: ctx.tags || undefined,
        createdAt: ctx.created_at,
      }));
      await db.transactions.bulkPut(txObjects);

      // 2. Unggah transaksi lokal (misal dibuat saat guest) yang belum ada di cloud
      const unsyncedLocal = localTxs.filter((l) => !cloudIds.has(l.id));
      if (unsyncedLocal.length > 0) {
        const payload = unsyncedLocal.map((tx) => ({
          id: tx.id,
          user_id: userId,
          amount: tx.amount,
          date: tx.date,
          category_id: tx.categoryId,
          notes: tx.notes || null,
          payment_method: tx.paymentMethod || null,
          tags: tx.tags || null,
          created_at: tx.createdAt || new Date().toISOString(),
        }));
        await safeUpsert('transactions', payload);
      }
    } else if (localTxs.length > 0) {
      // Jika cloud masih kosong, unggah seluruh transaksi lokal
      const payload = localTxs.map((tx) => ({
        id: tx.id,
        user_id: userId,
        amount: tx.amount,
        date: tx.date,
        category_id: tx.categoryId,
        notes: tx.notes || null,
        payment_method: tx.paymentMethod || null,
        tags: tx.tags || null,
        created_at: tx.createdAt || new Date().toISOString(),
      }));
      await safeUpsert('transactions', payload);
    }
  },

  /**
   * Sinkronisasi Anggaran (Budgets - High Performance with bulkPut & safeUpsert)
   */
  async syncBudgets(userId: string) {
    const { data: cloudBudgets, error: fetchErr } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId);

    if (fetchErr) {
      console.error('[SyncService] Fetch cloud budgets error:', fetchErr);
      throw fetchErr;
    }

    const localBudgets = await db.budgets.toArray();

    if (cloudBudgets && cloudBudgets.length > 0) {
      const cloudIds = new Set(cloudBudgets.map((b) => b.id));
      const budgetObjects: Budget[] = cloudBudgets.map((cb) => ({
        id: cb.id,
        categoryId: cb.category_id || undefined,
        amount: Number(cb.amount),
        month: cb.month,
      }));
      await db.budgets.bulkPut(budgetObjects);

      const unsyncedBudgets = localBudgets.filter((b) => !cloudIds.has(b.id));
      if (unsyncedBudgets.length > 0) {
        const payload = unsyncedBudgets.map((b) => ({
          id: b.id,
          user_id: userId,
          category_id: b.categoryId || null,
          amount: b.amount,
          month: b.month,
        }));
        await safeUpsert('budgets', payload);
      }
    } else if (localBudgets.length > 0) {
      const payload = localBudgets.map((b) => ({
        id: b.id,
        user_id: userId,
        category_id: b.categoryId || null,
        amount: b.amount,
        month: b.month,
      }));
      await safeUpsert('budgets', payload);
    }
  },

  /**
   * Sinkronisasi Pengeluaran Berulang (Recurring Expenses - High Performance with bulkPut & safeUpsert)
   */
  async syncRecurringExpenses(userId: string) {
    const { data: cloudRec, error: fetchErr } = await supabase
      .from('recurring_expenses')
      .select('*')
      .eq('user_id', userId);

    if (fetchErr) {
      console.error('[SyncService] Fetch cloud recurring expenses error:', fetchErr);
      throw fetchErr;
    }

    const localRec = await db.recurringExpenses.toArray();

    if (cloudRec && cloudRec.length > 0) {
      const cloudIds = new Set(cloudRec.map((r) => r.id));
      const recObjects: RecurringExpense[] = cloudRec.map((cr) => ({
        id: cr.id,
        title: cr.title,
        amount: Number(cr.amount),
        categoryId: cr.category_id,
        frequency: cr.frequency as any,
        nextDueDate: cr.next_due_date,
        isActive: cr.is_active,
        notes: cr.notes || undefined,
      }));
      await db.recurringExpenses.bulkPut(recObjects);

      const unsyncedRec = localRec.filter((r) => !cloudIds.has(r.id));
      if (unsyncedRec.length > 0) {
        const payload = unsyncedRec.map((r) => ({
          id: r.id,
          user_id: userId,
          title: r.title,
          amount: r.amount,
          category_id: r.categoryId,
          frequency: r.frequency,
          next_due_date: r.nextDueDate,
          is_active: r.isActive,
          notes: r.notes || null,
        }));
        await safeUpsert('recurring_expenses', payload);
      }
    } else if (localRec.length > 0) {
      const payload = localRec.map((r) => ({
        id: r.id,
        user_id: userId,
        title: r.title,
        amount: r.amount,
        category_id: r.categoryId,
        frequency: r.frequency,
        next_due_date: r.nextDueDate,
        is_active: r.isActive,
        notes: r.notes || null,
      }));
      await safeUpsert('recurring_expenses', payload);
    }
  },

  /**
   * Langganan Real-Time WebSocket Supabase
   * Otomatis sinkron saat ada perubahan data di device lain
   */
  subscribeToRealtime(userId: string, onDataChanged: () => void) {
    if (!isSupabaseConfigured || !userId) {
      return () => {};
    }

    const channel = supabase
      .channel(`duit-realtime-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${userId}` },
        () => onDataChanged()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories', filter: `user_id=eq.${userId}` },
        () => onDataChanged()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'budgets', filter: `user_id=eq.${userId}` },
        () => onDataChanged()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'recurring_expenses', filter: `user_id=eq.${userId}` },
        () => onDataChanged()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  /**
   * Upload / Update satu transaksi ke cloud
   */
  async pushTransaction(tx: Transaction, userId: string) {
    if (!isSupabaseConfigured || !userId) return;
    try {
      const payload = {
        id: tx.id,
        user_id: userId,
        amount: tx.amount,
        date: tx.date,
        category_id: tx.categoryId,
        notes: tx.notes || null,
        payment_method: tx.paymentMethod || null,
        tags: tx.tags || null,
        created_at: tx.createdAt,
      };
      await safeUpsert('transactions', [payload]);
    } catch (e) {
      console.warn('[SyncService] pushTransaction error:', e);
    }
  },

  /**
   * Hapus satu transaksi dari cloud
   */
  async deleteTransaction(id: string, userId: string) {
    if (!isSupabaseConfigured || !userId) return;
    try {
      const { error } = await supabase.from('transactions').delete().eq('id', id).eq('user_id', userId);
      if (error) console.warn('[SyncService] deleteTransaction error:', error);
    } catch (e) {
      console.warn('[SyncService] deleteTransaction exception:', e);
    }
  },

  /**
   * Upload / Update satu kategori ke cloud
   */
  async pushCategory(cat: Category, userId: string) {
    if (!isSupabaseConfigured || !userId) return;
    try {
      const payload = {
        id: cat.id,
        user_id: userId,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        budget_limit: cat.budgetLimit || 0,
        is_default: cat.isDefault || false,
        created_at: cat.createdAt,
      };
      await safeUpsert('categories', [payload]);
    } catch (e) {
      console.warn('[SyncService] pushCategory error:', e);
    }
  },

  /**
   * Hapus kategori dari cloud
   */
  async deleteCategory(id: string, userId: string) {
    if (!isSupabaseConfigured || !userId) return;
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id).eq('user_id', userId);
      if (error) console.warn('[SyncService] deleteCategory error:', error);
    } catch (e) {
      console.warn('[SyncService] deleteCategory exception:', e);
    }
  },

  /**
   * Reset data lokal ke kondisi awal (dipakai saat logout)
   */
  async resetLocalDataToDefaults() {
    await db.transaction('rw', db.transactions, db.categories, db.budgets, db.recurringExpenses, async () => {
      await db.transactions.clear();
      await db.budgets.clear();
      await db.recurringExpenses.clear();
      await db.categories.clear();
      await db.categories.bulkPut(DEFAULT_CATEGORIES);
    });
  }
};
