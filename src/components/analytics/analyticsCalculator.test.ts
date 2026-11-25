import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { id as idLocale } from 'date-fns/locale';
import { calculateAnalytics, calculateCashFlowTrend } from './analyticsCalculator';
import type { Category, Transaction } from '../../types';

const categories: Category[] = [
  { id: 'cat-food', name: 'Makanan', icon: 'Utensils', color: '#f97316', type: 'expense', createdAt: '2026-11-01T00:00:00Z' },
  { id: 'cat-inc-salary', name: 'Gaji', icon: 'Briefcase', color: '#10b981', type: 'income', createdAt: '2026-11-01T00:00:00Z' },
];

const mixedTransactions: Transaction[] = [
  {
    id: 'tx-exp-1',
    amount: 150000,
    date: '2026-11-10T10:00:00.000Z',
    categoryId: 'cat-food',
    createdAt: '2026-11-10T10:00:00.000Z',
  },
  {
    id: 'tx-inc-1',
    amount: 5000000,
    date: '2026-11-10T09:00:00.000Z',
    categoryId: 'cat-inc-salary',
    type: 'income',
    createdAt: '2026-11-10T09:00:00.000Z',
  },
];

const currentInterval = {
  start: new Date(2026, 10, 1, 0, 0, 0, 0),
  end: new Date(2026, 10, 30, 23, 59, 59, 999),
};
const previousInterval = {
  start: new Date(2026, 9, 1, 0, 0, 0, 0),
  end: new Date(2026, 9, 31, 23, 59, 59, 999),
};

describe('analyticsCalculator cash flow & type filtering', () => {
  it('filters calculateAnalytics strictly by transactionType (defaulting to expense)', () => {
    const expAnalytics = calculateAnalytics(
      mixedTransactions,
      categories,
      currentInterval,
      previousInterval,
      'Nov 2026',
      'custom',
      idLocale
    );
    assert.equal(expAnalytics.currentTotal, 150000);
    assert.equal(expAnalytics.txCount, 1);

    const incAnalytics = calculateAnalytics(
      mixedTransactions,
      categories,
      currentInterval,
      previousInterval,
      'Nov 2026',
      'custom',
      idLocale,
      'income'
    );
    assert.equal(incAnalytics.currentTotal, 5000000);
    assert.equal(incAnalytics.txCount, 1);
    assert.equal(incAnalytics.categoryData[0].id, 'cat-inc-salary');
  });

  it('computes dual-series income and expense cash flow trend buckets', () => {
    const trend = calculateCashFlowTrend(
      mixedTransactions,
      currentInterval,
      'custom',
      idLocale
    );
    assert.equal(trend.length, 30);

    const day10 = trend.find((b) => b.income > 0 || b.expense > 0);
    assert.ok(day10);
    assert.equal(day10.income, 5000000);
    assert.equal(day10.expense, 150000);
    assert.equal(day10.net, 4850000);
  });
});
