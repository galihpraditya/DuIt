// src/services/syncService.ts
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { db, DEFAULT_CATEGORIES } from '../db/database';
import type { Category, Transaction, Budget, RecurringExpense } from '../types';

let ongoingSync: Promise<{ success: boolean; error?: string }> | null = null;

const DELETED_CATS_KEY = 'duit_deleted_category_ids';

/**
 * Mendapatkan daftar ID kategori yang pernah dihapus pengguna pada perangkat ini
 * untuk mencegah kategori terhapus bangkit kembali (resurrection) saat sync multi-device.
 */
export function getDeletedCategoryIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_CATS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

/**
 * Menandai ID kategori sebagai terhapus.
 */
export function markCategoryDeleted(id: string) {
  try {
    const set = getDeletedCategoryIds();
    set.add(id);
    localStorage.setItem(DELETED_CATS_KEY, JSON.stringify(Array.from(set)));
  } catch (e) {
    console.warn('[SyncService] Failed to mark category as deleted in localStorage:', e);
  }
}

/**
 * Melakukan upsert data ke Supabase secara aman dengan self-healing.
 * 1. Mendukung skema baru (composite PK: id, user_id) dengan fallback otomatis
 *    ke skema legacy (single PK: id) jika backend belum dimigrasi.
 * 2. Menangani error PostgREST (42P10, PGRST100, pesan text onConflict).
 * 3. Self-healing pada PostgreSQL error 23503 (foreign_key_violation) jika transaksi/anggaran
 *    merujuk ke category_id yang belum ada atau telah dihapus di Supabase.
 */
export async function safeUpsert(table: string, payload: any[]) {
  if (!payload || payload.length === 0) return;

  const isConflictSpecificationError = (err: any) =>
    err?.code === '42P10' ||
    err?.code === 'PGRST100' ||
    (typeof err?.message === 'string' && (
      err.message.includes('ON CONFLICT specification') ||
      err.message.includes('unique or exclusion constraint') ||
      err.message.includes('on_conflict')
    ));

  // 1. Coba upsert dengan onConflict: 'id, user_id' (skema modern multi-user)
  const { error: primaryError } = await supabase
    .from(table)
    .upsert(payload, { onConflict: 'id, user_id' });

  if (!primaryError) {
    return;
  }

  // 2. Jika skema database belum memiliki constraint composite (id, user_id) -> PostgreSQL 42P10 / PostgREST PGRST100
  if (isConflictSpecificationError(primaryError)) {
    const { error: fallbackError } = await supabase
      .from(table)
      .upsert(payload, { onConflict: 'id' });

    if (!fallbackError) {
      return;
    }

    // Jika fallback gagal karena foreign key violation (23503), lanjutkan ke self-healing di bawah
    if (fallbackError.code !== '23503') {
      console.error(`[SyncService] Fallback upsert failed on ${table}:`, fallbackError);
      throw new Error(`Gagal menyinkronkan ${table}: ${fallbackError.message}`);
    }
  }

  // 3. Self-healing jika terjadi foreign key error (23503) pada relasi category_id
  if (primaryError?.code === '23503' && (table === 'transactions' || table === 'budgets' || table === 'recurring_expenses')) {
    console.warn(`[SyncService] FK constraint error (23503) on ${table}. Self-healing orphaned category IDs to cat-others...`);
    const healedPayload = payload.map((item) => ({
      ...item,
      category_id: table === 'budgets' ? (item.category_id ? 'cat-others' : null) : 'cat-others',
    }));

    // Coba simpan kembali dengan payload yang telah disembuhkan
    const { error: healError } = await supabase
      .from(table)
      .upsert(healedPayload, { onConflict: 'id, user_id' });

    if (!healError) {
      return;
    }

    if (isConflictSpecificationError(healError)) {
      const { error: healFallbackError } = await supabase
        .from(table)
        .upsert(healedPayload, { onConflict: 'id' });
      if (!healFallbackError) {
        return;
      }
    }
  }

  console.error(`[SyncService] Upsert error on ${table}:`, primaryError);
  throw new Error(`Gagal menyinkronkan ${table}: ${primaryError.message}`);
}

export const syncService = {
  markCategoryDeleted,
  getDeletedCategoryIds,

  /**
   * Menyelaraskan seluruh data lokal dengan Supabase Cloud secara cepat dan terurut aman.
   * Kategori disinkronkan terlebih dahulu agar relasi kategori valid untuk transaksi & anggaran.
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
   * Sinkronisasi Kategori Dua Arah dengan Rekonsiliasi Duplikasi & Anti-Resurrection
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
    const deletedIds = getDeletedCategoryIds();

    // Pastikan kategori jangkar 'cat-others' selalu terdaftar di local database
    const hasOthers = localCats.some((c) => c.id === 'cat-others');
    if (!hasOthers) {
      const defaultOthers: Category = {
        id: 'cat-others',
        name: 'Lain-lain',
        icon: 'CircleEllipsis',
        color: '#64748b',
        isDefault: true,
        order: 999,
        createdAt: new Date().toISOString(),
      };
      await db.categories.put(defaultOthers);
      localCats.push(defaultOthers);
    }

    if (cloudCats && cloudCats.length > 0) {
      const cloudIds = new Set(cloudCats.map((c) => c.id));
      const localMap = new Map(localCats.map((l) => [l.id, l]));

      // 1. Rekonsiliasi Kategori dengan Nama Sama (Case-insensitive trim):
      // Jika lokal memiliki kategori bernama sama dengan cloud tapi beda ID (misal dari guest/import),
      // alihkan transaksi lokal ke ID cloud dan hapus duplikat lokalnya.
      const cloudByName = new Map<string, string>();
      cloudCats.forEach((c) => {
        if (c.name) cloudByName.set(c.name.trim().toLowerCase(), c.id);
      });

      for (const localCat of localCats) {
        const normName = (localCat.name || '').trim().toLowerCase();
        const matchedCloudId = cloudByName.get(normName);
        if (matchedCloudId && matchedCloudId !== localCat.id) {
          const relTxs = await db.transactions.where('categoryId').equals(localCat.id).toArray();
          for (const tx of relTxs) {
            await db.transactions.update(tx.id, { categoryId: matchedCloudId });
          }
          const relRec = await db.recurringExpenses.where('categoryId').equals(localCat.id).toArray();
          for (const r of relRec) {
            await db.recurringExpenses.update(r.id, { categoryId: matchedCloudId });
          }
          await db.categories.delete(localCat.id);
        }
      }

      // 2. Simpan/perbarui kategori cloud ke Dexie lokal secara atomic dengan bulkPut
      const legacyDummyBudgetMap: Record<string, number> = {
        'cat-food': 2500000,
        'cat-transport': 1000000,
        'cat-shopping': 1500000,
        'cat-bills': 1200000,
        'cat-entertainment': 800000,
        'cat-health': 500000,
        'cat-education': 500000,
      };

      const catObjects: Category[] = cloudCats.map((cc) => {
        const localExisting = localMap.get(cc.id);
        const rawLimit = cc.budget_limit ? Number(cc.budget_limit) : undefined;
        // Jika nilai limit di cloud masih bernilai dummy bawaan template, bersihkan menjadi undefined
        const isLegacyDummy = rawLimit !== undefined && legacyDummyBudgetMap[cc.id] === rawLimit;
        const effectiveLimit = isLegacyDummy ? undefined : rawLimit;

        return {
          id: cc.id,
          name: cc.name || 'Kategori',
          icon: cc.icon || 'Tag',
          color: cc.color || '#64748b',
          budgetLimit: effectiveLimit,
          isDefault: Boolean(cc.is_default),
          order: typeof cc.order_index === 'number' ? cc.order_index : (localExisting?.order ?? 0),
          createdAt: cc.created_at || new Date().toISOString(),
        };
      });
      await db.categories.bulkPut(catObjects);

      // Bersihkan batas anggaran dummy di cloud jika terdeteksi
      const legacyDummyCloudCats = cloudCats.filter((cc) => {
        const rawLimit = cc.budget_limit ? Number(cc.budget_limit) : undefined;
        return rawLimit !== undefined && legacyDummyBudgetMap[cc.id] === rawLimit;
      });
      if (legacyDummyCloudCats.length > 0) {
        const cleanupPayload = legacyDummyCloudCats.map((cc) => ({
          id: cc.id,
          user_id: userId,
          name: cc.name || 'Kategori',
          icon: cc.icon || 'Tag',
          color: cc.color || '#64748b',
          budget_limit: 0,
          is_default: Boolean(cc.is_default),
          order_index: typeof cc.order_index === 'number' ? cc.order_index : 0,
          created_at: cc.created_at || new Date().toISOString(),
        }));
        safeUpsert('categories', cleanupPayload).catch((e) =>
          console.warn('[SyncService] Failed to clean legacy dummy budget on cloud:', e)
        );
      }

      // 3. Bersihkan kategori lokal yang pernah dihapus agar tidak bangkit kembali
      const refreshedLocalCats = await db.categories.toArray();
      for (const l of refreshedLocalCats) {
        if (deletedIds.has(l.id)) {
          await db.categories.delete(l.id);
        }
      }

      // 4. Unggah kategori kustom lokal yang belum ada di cloud (dan bukan yang pernah dihapus)
      const unsyncedLocal = refreshedLocalCats.filter(
        (l) => !cloudIds.has(l.id) && !deletedIds.has(l.id)
      );

      if (unsyncedLocal.length > 0) {
        const payload = unsyncedLocal.map((cat) => ({
          id: cat.id,
          user_id: userId,
          name: cat.name || 'Kategori',
          icon: cat.icon || 'Tag',
          color: cat.color || '#64748b',
          budget_limit: cat.budgetLimit || 0,
          is_default: Boolean(cat.isDefault),
          order_index: typeof cat.order === 'number' ? cat.order : 0,
          created_at: cat.createdAt || new Date().toISOString(),
        }));
        await safeUpsert('categories', payload);
      }
    } else if (localCats.length > 0) {
      // Jika cloud masih kosong, upload seluruh data lokal ke cloud (kecuali yang ditandai terhapus)
      const validLocalCats = localCats.filter((cat) => !deletedIds.has(cat.id));
      if (validLocalCats.length > 0) {
        const payload = validLocalCats.map((cat) => ({
          id: cat.id,
          user_id: userId,
          name: cat.name || 'Kategori',
          icon: cat.icon || 'Tag',
          color: cat.color || '#64748b',
          budget_limit: cat.budgetLimit || 0,
          is_default: Boolean(cat.isDefault),
          order_index: typeof cat.order === 'number' ? cat.order : 0,
          created_at: cat.createdAt || new Date().toISOString(),
        }));
        await safeUpsert('categories', payload);
      }
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

    // Kumpulan kategori valid (lokal) untuk memastikan transaksi tidak mereferensi kategori kosong
    const availableCats = await db.categories.toArray();
    const validCatIds = new Set(availableCats.map((c) => c.id));
    const fallbackCatId = validCatIds.has('cat-others') ? 'cat-others' : (availableCats[0]?.id || 'cat-others');

    if (cloudTxs && cloudTxs.length > 0) {
      // 1. Simpan/perbarui data dari cloud ke lokal secara atomic dalam 1 transaksi IndexedDB
      const txObjects: Transaction[] = cloudTxs.map((ctx) => {
        const effectiveCatId = ctx.category_id && validCatIds.has(ctx.category_id)
          ? ctx.category_id
          : fallbackCatId;

        return {
          id: ctx.id,
          amount: Number(ctx.amount) || 0,
          date: ctx.date || new Date().toISOString(),
          categoryId: effectiveCatId,
          notes: ctx.notes || undefined,
          paymentMethod: ctx.payment_method || undefined,
          tags: Array.isArray(ctx.tags) ? ctx.tags : undefined,
          createdAt: ctx.created_at || new Date().toISOString(),
        };
      });
      await db.transactions.bulkPut(txObjects);

      // 2. Unggah transaksi lokal (misal dibuat saat guest) yang belum ada di cloud
      const unsyncedLocal = localTxs.filter((l) => !cloudIds.has(l.id));
      if (unsyncedLocal.length > 0) {
        const payload = unsyncedLocal.map((tx) => {
          const effectiveCatId = tx.categoryId && validCatIds.has(tx.categoryId)
            ? tx.categoryId
            : fallbackCatId;

          return {
            id: tx.id,
            user_id: userId,
            amount: Number(tx.amount) || 0,
            date: tx.date || new Date().toISOString(),
            category_id: effectiveCatId,
            notes: tx.notes || null,
            payment_method: tx.paymentMethod || null,
            tags: tx.tags || null,
            created_at: tx.createdAt || new Date().toISOString(),
          };
        });
        await safeUpsert('transactions', payload);
      }
    } else if (localTxs.length > 0) {
      // Jika cloud masih kosong, unggah seluruh transaksi lokal
      const payload = localTxs.map((tx) => {
        const effectiveCatId = tx.categoryId && validCatIds.has(tx.categoryId)
          ? tx.categoryId
          : fallbackCatId;

        return {
          id: tx.id,
          user_id: userId,
          amount: Number(tx.amount) || 0,
          date: tx.date || new Date().toISOString(),
          category_id: effectiveCatId,
          notes: tx.notes || null,
          payment_method: tx.paymentMethod || null,
          tags: tx.tags || null,
          created_at: tx.createdAt || new Date().toISOString(),
        };
      });
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
    const availableCats = await db.categories.toArray();
    const validCatIds = new Set(availableCats.map((c) => c.id));

    if (cloudBudgets && cloudBudgets.length > 0) {
      const cloudIds = new Set(cloudBudgets.map((b) => b.id));
      const budgetObjects: Budget[] = cloudBudgets.map((cb) => ({
        id: cb.id,
        categoryId: cb.category_id && validCatIds.has(cb.category_id) ? cb.category_id : undefined,
        amount: Number(cb.amount) || 0,
        month: cb.month,
      }));
      await db.budgets.bulkPut(budgetObjects);

      const unsyncedBudgets = localBudgets.filter((b) => !cloudIds.has(b.id));
      if (unsyncedBudgets.length > 0) {
        const payload = unsyncedBudgets.map((b) => ({
          id: b.id,
          user_id: userId,
          category_id: b.categoryId && validCatIds.has(b.categoryId) ? b.categoryId : null,
          amount: Number(b.amount) || 0,
          month: b.month,
        }));
        await safeUpsert('budgets', payload);
      }
    } else if (localBudgets.length > 0) {
      const payload = localBudgets.map((b) => ({
        id: b.id,
        user_id: userId,
        category_id: b.categoryId && validCatIds.has(b.categoryId) ? b.categoryId : null,
        amount: Number(b.amount) || 0,
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
    const availableCats = await db.categories.toArray();
    const validCatIds = new Set(availableCats.map((c) => c.id));
    const fallbackCatId = validCatIds.has('cat-others') ? 'cat-others' : (availableCats[0]?.id || 'cat-others');

    if (cloudRec && cloudRec.length > 0) {
      const cloudIds = new Set(cloudRec.map((r) => r.id));
      const recObjects: RecurringExpense[] = cloudRec.map((cr) => ({
        id: cr.id,
        title: cr.title || 'Pengeluaran Berulang',
        amount: Number(cr.amount) || 0,
        categoryId: cr.category_id && validCatIds.has(cr.category_id) ? cr.category_id : fallbackCatId,
        frequency: cr.frequency as any,
        nextDueDate: cr.next_due_date,
        isActive: Boolean(cr.is_active),
        notes: cr.notes || undefined,
      }));
      await db.recurringExpenses.bulkPut(recObjects);

      const unsyncedRec = localRec.filter((r) => !cloudIds.has(r.id));
      if (unsyncedRec.length > 0) {
        const payload = unsyncedRec.map((r) => ({
          id: r.id,
          user_id: userId,
          title: r.title || 'Pengeluaran Berulang',
          amount: Number(r.amount) || 0,
          category_id: r.categoryId && validCatIds.has(r.categoryId) ? r.categoryId : fallbackCatId,
          frequency: r.frequency,
          next_due_date: r.nextDueDate,
          is_active: Boolean(r.isActive),
          notes: r.notes || null,
        }));
        await safeUpsert('recurring_expenses', payload);
      }
    } else if (localRec.length > 0) {
      const payload = localRec.map((r) => ({
        id: r.id,
        user_id: userId,
        title: r.title || 'Pengeluaran Berulang',
        amount: Number(r.amount) || 0,
        category_id: r.categoryId && validCatIds.has(r.categoryId) ? r.categoryId : fallbackCatId,
        frequency: r.frequency,
        next_due_date: r.nextDueDate,
        is_active: Boolean(r.isActive),
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
        amount: Number(tx.amount) || 0,
        date: tx.date || new Date().toISOString(),
        category_id: tx.categoryId,
        notes: tx.notes || null,
        payment_method: tx.paymentMethod || null,
        tags: tx.tags || null,
        created_at: tx.createdAt || new Date().toISOString(),
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
        name: cat.name || 'Kategori',
        icon: cat.icon || 'Tag',
        color: cat.color || '#64748b',
        budget_limit: cat.budgetLimit || 0,
        is_default: Boolean(cat.isDefault),
        order_index: typeof cat.order === 'number' ? cat.order : 0,
        created_at: cat.createdAt || new Date().toISOString(),
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
      markCategoryDeleted(id);
      const { error } = await supabase.from('categories').delete().eq('id', id).eq('user_id', userId);
      if (error) console.warn('[SyncService] deleteCategory error:', error);
    } catch (e) {
      console.warn('[SyncService] deleteCategory exception:', e);
    }
  },

  /**
   * Upload / Update satu pengeluaran berulang ke cloud
   */
  async pushRecurringExpense(rec: RecurringExpense, userId: string) {
    if (!isSupabaseConfigured || !userId) return;
    try {
      const payload = {
        id: rec.id,
        user_id: userId,
        title: rec.title || 'Pengeluaran Berulang',
        amount: Number(rec.amount) || 0,
        category_id: rec.categoryId,
        frequency: rec.frequency,
        next_due_date: rec.nextDueDate,
        is_active: Boolean(rec.isActive),
        notes: rec.notes || null,
      };
      await safeUpsert('recurring_expenses', [payload]);
    } catch (e) {
      console.warn('[SyncService] pushRecurringExpense error:', e);
    }
  },

  /**
   * Hapus anggaran terkait kategori tertentu dari cloud
   */
  async deleteBudgetByCategory(categoryId: string, userId: string) {
    if (!isSupabaseConfigured || !userId) return;
    try {
      const { error } = await supabase.from('budgets').delete().eq('category_id', categoryId).eq('user_id', userId);
      if (error) console.warn('[SyncService] deleteBudgetByCategory error:', error);
    } catch (e) {
      console.warn('[SyncService] deleteBudgetByCategory exception:', e);
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


