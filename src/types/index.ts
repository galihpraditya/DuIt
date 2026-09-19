export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  budgetLimit?: number; // Optional monthly limit in IDR
  isDefault?: boolean;
  order?: number; // Sorting index for manual/custom ordering
  createdAt: string;
}

export type CategorySortMode =
  | 'manual'
  | 'most_used'
  | 'highest_amount'
  | 'name_asc'
  | 'name_desc'
  | 'newest';

export type PaymentMethodType = 'Tunai' | 'Transfer Bank' | 'E-Wallet' | 'QRIS / E-Wallet' | 'Kartu Debit' | 'Kartu Kredit' | 'Lainnya';

export interface Transaction {
  id: string;
  amount: number;
  date: string; // ISO String (YYYY-MM-DDTHH:mm:ss)
  categoryId: string;
  notes?: string;
  paymentMethod?: PaymentMethodType;
  tags?: string[];
  createdAt: string;
}

export interface Budget {
  id: string;
  categoryId?: string; // If undefined, applies to overall monthly spending
  amount: number;
  month: string; // YYYY-MM
}

export interface RecurringExpense {
  id: string;
  title: string;
  amount: number;
  categoryId: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  nextDueDate: string; // YYYY-MM-DD
  isActive: boolean;
  notes?: string;
}

export type TimeframeType = 'today' | 'this_week' | 'this_month' | 'last_month' | 'this_year' | 'custom';

export interface DateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

export interface SpendingSummary {
  total: number;
  transactionCount: number;
  averagePerDay: number;
  highestExpense: number;
  previousPeriodTotal: number;
  percentageChange: number;
}
