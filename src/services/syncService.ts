// src/services/syncService.ts
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { db, DEFAULT_CATEGORIES } from '../db/database';
import type { Category, Transaction, Budget, RecurringExpense } from '../types';

let ongoingSync: Promise<{ success: boolean; error?: string }> | null = null;

export const syncService = {
  /**
   * Menyelaraskan seluruh data lokal dengan Supabase Cloud secara cepat dan konkuren
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
        // Jalankan sinkronisasi seluruh tabel secara paralel (Promise.all) agar jauh lebih cepat
        await Promise.all([
          this.syncCategories(userId),
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
   * Sinkronisasi Kategori Dua Arah (High Performance with bulkPut)
   */
  async syncCategories(userId: string) {
    const { data: cloudCats, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;

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
        await supabase.from('categories').upsert(payload);
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
      await supabase.from('categories').upsert(payload);
    }
  },

  /**
   * Sinkronisasi Transaksi Dua Arah (High Performance with bulkPut)
   */
  async syncTransactions(userId: string) {
    const { data: cloudTxs, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;

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

      // 2. Unggah transaksi lokal yang belum ada di cloud
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
        await supabase.from('transactions').upsert(payload);
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
      await supabase.from('transactions').upsert(payload);
    }
  },

  /**
   * Sinkronisasi Anggaran (Budgets - High Performance with bulkPut)
   */
  async syncBudgets(userId: string) {
    const { data: cloudBudgets, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;

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
        await supabase.from('budgets').upsert(payload);
      }
    } else if (localBudgets.length > 0) {
      const payload = localBudgets.map((b) => ({
        id: b.id,
        user_id: userId,
        category_id: b.categoryId || null,
        amount: b.amount,
        month: b.month,
      }));
      await supabase.from('budgets').upsert(payload);
    }
  },

  /**
   * Sinkronisasi Pengeluaran Berulang (Recurring Expenses - High Performance with bulkPut)
   */
  async syncRecurringExpenses(userId: string) {
    const { data: cloudRec, error } = await supabase
      .from('recurring_expenses')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;

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
        await supabase.from('recurring_expenses').upsert(payload);
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
      await supabase.from('recurring_expenses').upsert(payload);
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
      await supabase.from('transactions').upsert({
        id: tx.id,
        user_id: userId,
        amount: tx.amount,
        date: tx.date,
        category_id: tx.categoryId,
        notes: tx.notes || null,
        payment_method: tx.paymentMethod || null,
        tags: tx.tags || null,
        created_at: tx.createdAt,
      });
    } catch (e) {
      console.warn('pushTransaction error:', e);
    }
  },

  /**
   * Hapus satu transaksi dari cloud
   */
  async deleteTransaction(id: string, userId: string) {
    if (!isSupabaseConfigured || !userId) return;
    try {
      await supabase.from('transactions').delete().eq('id', id).eq('user_id', userId);
    } catch (e) {
      console.warn('deleteTransaction error:', e);
    }
  },

  /**
   * Upload / Update satu kategori ke cloud
   */
  async pushCategory(cat: Category, userId: string) {
    if (!isSupabaseConfigured || !userId) return;
    try {
      await supabase.from('categories').upsert({
        id: cat.id,
        user_id: userId,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        budget_limit: cat.budgetLimit || 0,
        is_default: cat.isDefault || false,
        created_at: cat.createdAt,
      });
    } catch (e) {
      console.warn('pushCategory error:', e);
    }
  },

  /**
   * Hapus kategori dari cloud
   */
  async deleteCategory(id: string, userId: string) {
    if (!isSupabaseConfigured || !userId) return;
    try {
      await supabase.from('categories').delete().eq('id', id).eq('user_id', userId);
    } catch (e) {
      console.warn('deleteCategory error:', e);
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
