import Dexie, { type Table } from 'dexie';
import type { Category, Transaction, Budget, RecurringExpense } from '../types';
import { subDays, format } from 'date-fns';

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
  const categoryCount = await db.categories.count();
  if (categoryCount === 0) {
    await db.categories.bulkPut(DEFAULT_CATEGORIES);

    // Add realistic seed transactions over the past 30 days for rich initial UI preview
    const now = new Date();
    const seedTransactions: Transaction[] = [
      {
        id: 'tx-1',
        amount: 35000,
        date: format(now, "yyyy-MM-dd'T'12:30:00"),
        categoryId: 'cat-food',
        notes: 'Makan siang Nasi Padang + Es Teh',
        paymentMethod: 'QRIS / E-Wallet',
        createdAt: now.toISOString()
      },
      {
        id: 'tx-2',
        amount: 50000,
        date: format(now, "yyyy-MM-dd'T'08:15:00"),
        categoryId: 'cat-transport',
        notes: 'Isi Bensin Pertamax',
        paymentMethod: 'Tunai',
        createdAt: now.toISOString()
      },
      {
        id: 'tx-3',
        amount: 120000,
        date: format(subDays(now, 1), "yyyy-MM-dd'T'19:45:00"),
        categoryId: 'cat-shopping',
        notes: 'Belanja sabun & detergen di minimarket',
        paymentMethod: 'Kartu Debit',
        createdAt: subDays(now, 1).toISOString()
      },
      {
        id: 'tx-4',
        amount: 45000,
        date: format(subDays(now, 1), "yyyy-MM-dd'T'13:00:00"),
        categoryId: 'cat-food',
        notes: 'Kopi & Croissant sore',
        paymentMethod: 'E-Wallet',
        createdAt: subDays(now, 1).toISOString()
      },
      {
        id: 'tx-5',
        amount: 350000,
        date: format(subDays(now, 3), "yyyy-MM-dd'T'10:00:00"),
        categoryId: 'cat-bills',
        notes: 'Token Listrik PLN & Tagihan Air',
        paymentMethod: 'Transfer Bank',
        createdAt: subDays(now, 3).toISOString()
      },
      {
        id: 'tx-6',
        amount: 85000,
        date: format(subDays(now, 4), "yyyy-MM-dd'T'20:15:00"),
        categoryId: 'cat-entertainment',
        notes: 'Tiket Nonton Bioskop XXI',
        paymentMethod: 'E-Wallet',
        createdAt: subDays(now, 4).toISOString()
      },
      {
        id: 'tx-7',
        amount: 150000,
        date: format(subDays(now, 6), "yyyy-MM-dd'T'15:30:00"),
        categoryId: 'cat-health',
        notes: 'Vitamin C & Suplemen',
        paymentMethod: 'QRIS / E-Wallet',
        createdAt: subDays(now, 6).toISOString()
      },
      {
        id: 'tx-8',
        amount: 180000,
        date: format(subDays(now, 9), "yyyy-MM-dd'T'11:00:00"),
        categoryId: 'cat-education',
        notes: 'Buku Pemrograman & Desain',
        paymentMethod: 'Transfer Bank',
        createdAt: subDays(now, 9).toISOString()
      },
      {
        id: 'tx-9',
        amount: 65000,
        date: format(subDays(now, 12), "yyyy-MM-dd'T'18:20:00"),
        categoryId: 'cat-food',
        notes: 'Makan malam Sushi',
        paymentMethod: 'Kartu Debit',
        createdAt: subDays(now, 12).toISOString()
      },
      {
        id: 'tx-10',
        amount: 250000,
        date: format(subDays(now, 15), "yyyy-MM-dd'T'09:00:00"),
        categoryId: 'cat-shopping',
        notes: 'Beli Kemeja & Kaos Polos',
        paymentMethod: 'E-Wallet',
        createdAt: subDays(now, 15).toISOString()
      },
    ];

    await db.transactions.bulkPut(seedTransactions);

    // Initial Recurring Expenses
    const seedRecurring: RecurringExpense[] = [
      {
        id: 'rec-1',
        title: 'Langganan Netflix & Spotify',
        amount: 186000,
        categoryId: 'cat-entertainment',
        frequency: 'monthly',
        nextDueDate: format(now, 'yyyy-MM-28'),
        isActive: true,
        notes: 'Auto debit tanggal 28 tiap bulan'
      },
      {
        id: 'rec-2',
        title: 'Tagihan Internet Wi-Fi Rumah',
        amount: 325000,
        categoryId: 'cat-bills',
        frequency: 'monthly',
        nextDueDate: format(now, 'yyyy-MM-20'),
        isActive: true,
        notes: 'Indihome / Biznet'
      }
    ];

    await db.recurringExpenses.bulkPut(seedRecurring);
  }
}
