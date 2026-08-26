import Dexie, { type Table } from 'dexie';
import type { Category, Transaction, Budget, RecurringExpense } from '../types';

export class WalletDatabase extends Dexie {
  categories!: Table<Category, string>;
  transactions!: Table<Transaction, string>;
  budgets!: Table<Budget, string>;
  recurringExpenses!: Table<RecurringExpense, string>;

  constructor() {
    super('WalletExpenseDB');
    this.version(1).stores({
      categories: 'id, name, createdAt',
      transactions: 'id, date, categoryId, amount, createdAt',
      budgets: 'id, categoryId, month',
      recurringExpenses: 'id, categoryId, nextDueDate, isActive'
    });
    this.version(2).stores({
      transactions: 'id, date, categoryId, amount, createdAt, [categoryId+date]'
    });
  }
}

export const db = new WalletDatabase();

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-food', name: 'Makanan & Minuman', icon: 'Utensils', color: '#f97316', budgetLimit: 2500000, isDefault: true, createdAt: new Date().toISOString() },
  { id: 'cat-transport', name: 'Transportasi & Bensin', icon: 'Car', color: '#0ea5e9', budgetLimit: 1000000, isDefault: true, createdAt: new Date().toISOString() },
  { id: 'cat-shopping', name: 'Belanja & Kebutuhan', icon: 'ShoppingBag', color: '#ec4899', budgetLimit: 1500000, isDefault: true, createdAt: new Date().toISOString() },
  { id: 'cat-bills', name: 'Tagihan & Utilitas', icon: 'Zap', color: '#eab308', budgetLimit: 1200000, isDefault: true, createdAt: new Date().toISOString() },
  { id: 'cat-entertainment', name: 'Hiburan & Hobi', icon: 'Gamepad2', color: '#a855f7', budgetLimit: 800000, isDefault: true, createdAt: new Date().toISOString() },
  { id: 'cat-health', name: 'Kesehatan & Obat', icon: 'HeartPulse', color: '#ef4444', budgetLimit: 500000, isDefault: true, createdAt: new Date().toISOString() },
  { id: 'cat-education', name: 'Edukasi & Buku', icon: 'GraduationCap', color: '#14b8a6', budgetLimit: 500000, isDefault: true, createdAt: new Date().toISOString() },
  { id: 'cat-others', name: 'Lain-lain', icon: 'CircleEllipsis', color: '#64748b', isDefault: true, createdAt: new Date().toISOString() },
];

export async function initializeDefaultData() {
  // Initialize default base categories if empty
  const categoryCount = await db.categories.count();
  if (categoryCount === 0) {
    await db.categories.bulkPut(DEFAULT_CATEGORIES);
  }

  // Clean up any legacy dummy seed items (tx-1 ... tx-10, rec-1, rec-2) if they were inserted previously
  const legacySeedTxIds = ['tx-1', 'tx-2', 'tx-3', 'tx-4', 'tx-5', 'tx-6', 'tx-7', 'tx-8', 'tx-9', 'tx-10'];
  for (const id of legacySeedTxIds) {
    const existing = await db.transactions.get(id);
    if (existing) {
      await db.transactions.delete(id);
    }
  }

  const legacySeedRecIds = ['rec-1', 'rec-2'];
  for (const id of legacySeedRecIds) {
    const existing = await db.recurringExpenses.get(id);
    if (existing) {
      await db.recurringExpenses.delete(id);
    }
  }
}
