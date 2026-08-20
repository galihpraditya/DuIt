// src/services/syncService.ts
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { db, DEFAULT_CATEGORIES } from '../db/database';
import type { Category, Transaction, Budget, RecurringExpense } from '../types';

export const syncService = {
  /**
   * Menyelaraskan seluruh data lokal dengan Supabase Cloud
   */
  async syncAll(userId: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured || !userId) {
      return { success: true };
    }

    try {
      // 1. SYNC CATEGORIES
      await this.syncCategories(userId);

      // 2. SYNC TRANSACTIONS
      await this.syncTransactions(userId);

      // 3. SYNC BUDGETS
      await this.syncBudgets(userId);

      // 4. SYNC RECURRING EXPENSES
      await this.syncRecurringExpenses(userId);

      return { success: true };
    } catch (err: any) {
      console.error('Data sync failed:', err);
      return { success: false, error: err.message || 'Gagal menyelaraskan data cloud' };
    }
  },

  /**
   * Sinkronisasi Kategori Dua Arah
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
      
      // Update/Insert kategori dari cloud ke local Dexie
      for (const cc of cloudCats) {
        const catObj: Category = {
          id: cc.id,
          name: cc.name,
          icon: cc.icon,
          color: cc.color,
          budgetLimit: cc.budget_limit ? Number(cc.budget_limit) : undefined,
          isDefault: cc.is_default,
          createdAt: cc.created_at,
        };
        await db.categories.put(catObj);
      }

      // Hapus kategori lokal kustom yang sudah tidak ada di cloud
      for (const localCat of localCats) {
        if (!cloudIds.has(localCat.id) && !localCat.isDefault) {
          await db.categories.delete(localCat.id);
        }
      }
    } else if (localCats.length > 0) {
      // Jika cloud masih kosong (user baru), upload data default lokal ke cloud
      const payload = localCats.map((cat) => ({
        id: cat.id,
        user_id: userId,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        budget_limit: cat.budgetLimit || 0,
        is_default: cat.isDefault || false,
        created_at: cat.createdAt || new Date().toISOString(),
      }));
      await supabase.from('categories').upsert(payload);
    }
  },

  /**
   * Sinkronisasi Transaksi Dua Arah (Reconciliation)
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
      // 1. Simpan/perbarui data dari cloud ke lokal
      for (const ctx of cloudTxs) {
        const txObj: Transaction = {
          id: ctx.id,
          amount: Number(ctx.amount),
          date: ctx.date,
          categoryId: ctx.category_id,
          notes: ctx.notes || undefined,
          paymentMethod: ctx.payment_method || undefined,
          tags: ctx.tags || undefined,
          createdAt: ctx.created_at,
        };
        await db.transactions.put(txObj);
      }

      // 2. Hapus transaksi lokal yang sudah dihapus di cloud
      for (const localTx of localTxs) {
        if (!cloudIds.has(localTx.id)) {
          await db.transactions.delete(localTx.id);
        }
      }
    } else if (localTxs.length > 0) {
      // Jika cloud masih kosong, unggah transaksi offline lokal pertama kali
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
   * Sinkronisasi Anggaran (Budgets)
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
      for (const cb of cloudBudgets) {
        const bObj: Budget = {
          id: cb.id,
          categoryId: cb.category_id || undefined,
          amount: Number(cb.amount),
          month: cb.month,
        };
        await db.budgets.put(bObj);
      }

      for (const lb of localBudgets) {
        if (!cloudIds.has(lb.id)) {
          await db.budgets.delete(lb.id);
        }
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
   * Sinkronisasi Pengeluaran Berulang (Recurring Expenses)
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
      for (const cr of cloudRec) {
        const rObj: RecurringExpense = {
          id: cr.id,
          title: cr.title,
          amount: Number(cr.amount),
          categoryId: cr.category_id,
          frequency: cr.frequency as any,
          nextDueDate: cr.next_due_date,
          isActive: cr.is_active,
          notes: cr.notes || undefined,
        };
        await db.recurringExpenses.put(rObj);
      }

      for (const lr of localRec) {
        if (!cloudIds.has(lr.id)) {
          await db.recurringExpenses.delete(lr.id);
        }
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
