import type { Category, Transaction, TransactionType } from '../types';

export const INCOME_TRACKING_STORAGE_KEY = 'duit_income_tracking_enabled';

export type CashFlowStatus = 'surplus' | 'boncos' | 'even' | 'no_income';

export interface CashFlowSummary {
  totalIncome: number;
  totalExpense: number;
  netCashFlow: number;
  status: CashFlowStatus;
  expenseRatioPct: number;
  savingRatePct: number;
}

interface StorageLike {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}

/**
 * Returns the normalized type of a transaction, treating legacy omitted values as 'expense'.
 */
export function getTransactionType(tx: Pick<Transaction, 'type'> | null | undefined): TransactionType {
  return tx?.type === 'income' ? 'income' : 'expense';
}

/**
 * Returns the normalized type of a category, treating legacy omitted values as 'expense'.
 */
export function getCategoryType(cat: Pick<Category, 'type'> | null | undefined): TransactionType {
  return cat?.type === 'income' ? 'income' : 'expense';
}

export function filterTransactionsByType(
  transactions: Transaction[],
  type: TransactionType
): Transaction[] {
  return transactions.filter((tx) => getTransactionType(tx) === type);
}

export function filterCategoriesByType(
  categories: Category[],
  type: TransactionType
): Category[] {
  return categories.filter((cat) => getCategoryType(cat) === type);
}

export function isIncomeTrackingEnabled(storage?: StorageLike): boolean {
  try {
    const target = storage ?? (typeof localStorage !== 'undefined' ? localStorage : undefined);
    return target?.getItem(INCOME_TRACKING_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setIncomeTrackingEnabled(enabled: boolean, storage?: StorageLike): void {
  try {
    const target = storage ?? (typeof localStorage !== 'undefined' ? localStorage : undefined);
    target?.setItem(INCOME_TRACKING_STORAGE_KEY, String(enabled));
  } catch {
    // Ignore storage errors (e.g. private browsing restrictions)
  }
}

/**
 * Computes monthly/period cash flow status (Surplus vs Boncos) from mixed transactions.
 */
export function calculateCashFlowSummary(transactions: Transaction[]): CashFlowSummary {
  let totalIncome = 0;
  let totalExpense = 0;

  for (const tx of transactions) {
    const amt = Number(tx.amount) || 0;
    if (getTransactionType(tx) === 'income') {
      totalIncome += amt;
    } else {
      totalExpense += amt;
    }
  }

  const netCashFlow = totalIncome - totalExpense;

  let status: CashFlowStatus;
  if (totalIncome === 0 && totalExpense > 0) {
    status = 'no_income';
  } else if (netCashFlow > 0) {
    status = 'surplus';
  } else if (netCashFlow < 0) {
    status = 'boncos';
  } else {
    status = 'even';
  }

  const expenseRatioPct = totalIncome > 0 ? Math.round((totalExpense / totalIncome) * 100) : 0;
  const savingRatePct =
    totalIncome > 0 && netCashFlow > 0 ? Math.round((netCashFlow / totalIncome) * 100) : 0;

  return {
    totalIncome,
    totalExpense,
    netCashFlow,
    status,
    expenseRatioPct,
    savingRatePct,
  };
}
