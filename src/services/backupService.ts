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

          if (data.categories.length) await db.categories.bulkAdd(data.categories);
          if (data.transactions.length) await db.transactions.bulkAdd(data.transactions);
          if (data.budgets?.length) await db.budgets.bulkAdd(data.budgets);
          if (data.recurringExpenses?.length) await db.recurringExpenses.bulkAdd(data.recurringExpenses);
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
