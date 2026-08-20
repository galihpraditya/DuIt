import { db } from '../db/database';
import { format } from 'date-fns';

export async function exportDatabaseBackup() {
  const categories = await db.categories.toArray();
  const transactions = await db.transactions.toArray();
  const budgets = await db.budgets.toArray();
  const recurringExpenses = await db.recurringExpenses.toArray();

  const backupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    categories,
    transactions,
    budgets,
    recurringExpenses
  };

  const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `DuIt_Wallet_Backup_${format(new Date(), 'yyyyMMdd_HHmm')}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importDatabaseBackup(file: File): Promise<{ success: boolean; message: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text);

        if (!data.categories || !data.transactions) {
          resolve({ success: false, message: 'Format file cadangan tidak valid.' });
          return;
        }

        // Restore transactions, categories, etc
        await db.transaction('rw', db.categories, db.transactions, db.budgets, db.recurringExpenses, async () => {
          await db.categories.clear();
          await db.transactions.clear();
          await db.budgets.clear();
          await db.recurringExpenses.clear();

          if (data.categories.length) await db.categories.bulkPut(data.categories);
          if (data.transactions.length) await db.transactions.bulkPut(data.transactions);
          if (data.budgets?.length) await db.budgets.bulkPut(data.budgets);
          if (data.recurringExpenses?.length) await db.recurringExpenses.bulkPut(data.recurringExpenses);
        });

        // Paksa sinkronisasi/timpa ke cloud agar tidak terhapus ulang oleh syncAll
        import('./supabaseClient').then(async ({ supabase, isSupabaseConfigured }) => {
          if (isSupabaseConfigured) {
            import('./authService').then(async ({ authService }) => {
              const user = await authService.getCurrentUser();
              if (user?.id) {
                try {
                  // Hapus data lama di cloud
                  await supabase.from('transactions').delete().eq('user_id', user.id);
                  await supabase.from('categories').delete().eq('user_id', user.id);
                  await supabase.from('budgets').delete().eq('user_id', user.id);
                  await supabase.from('recurring_expenses').delete().eq('user_id', user.id);

                  // Upload ulang seluruh data backup
                  if (data.categories?.length) {
                    const payload = data.categories.map((c: any) => ({
                      id: c.id,
                      user_id: user.id,
                      name: c.name,
                      icon: c.icon,
                      color: c.color,
                      budget_limit: c.budgetLimit || 0,
                      is_default: c.isDefault || false,
                      created_at: c.createdAt,
                    }));
                    await supabase.from('categories').upsert(payload);
                  }
                  if (data.transactions?.length) {
                    const payload = data.transactions.map((tx: any) => ({
                      id: tx.id,
                      user_id: user.id,
                      amount: tx.amount,
                      date: tx.date,
                      category_id: tx.categoryId,
                      notes: tx.notes || null,
                      payment_method: tx.paymentMethod || null,
                      tags: tx.tags || null,
                      created_at: tx.createdAt,
                    }));
                    await supabase.from('transactions').upsert(payload);
                  }
                  if (data.budgets?.length) {
                    const payload = data.budgets.map((b: any) => ({
                      id: b.id,
                      user_id: user.id,
                      category_id: b.categoryId || null,
                      amount: b.amount,
                      month: b.month,
                    }));
                    await supabase.from('budgets').upsert(payload);
                  }
                  if (data.recurringExpenses?.length) {
                    const payload = data.recurringExpenses.map((r: any) => ({
                      id: r.id,
                      user_id: user.id,
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
                } catch (e) {
                  console.warn('Gagal menimpa data backup ke cloud:', e);
                }
              }
            });
          }
        });

        resolve({ success: true, message: 'Data cadangan berhasil dipulihkan!' });
      } catch {
        resolve({ success: false, message: 'Gagal membaca file cadangan JSON.' });
      }
    };

    reader.onerror = () => resolve({ success: false, message: 'Gagal membuka file.' });
    reader.readAsText(file);
  });
}
