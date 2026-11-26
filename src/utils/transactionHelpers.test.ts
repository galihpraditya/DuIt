import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  INCOME_TRACKING_STORAGE_KEY,
  getTransactionType,
  getCategoryType,
  filterTransactionsByType,
  filterCategoriesByType,
  calculateCashFlowSummary,
  isIncomeTrackingEnabled,
  setIncomeTrackingEnabled,
  resolveBatchMoveTargetCategory,
  resolveActiveCategoryFilter,
} from './transactionHelpers';
import type { Category, Transaction } from '../types';

const makeTx = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 'tx-1',
  amount: 10000,
  date: '2026-11-26T10:00:00.000Z',
  categoryId: 'cat-food',
  createdAt: '2026-11-26T10:00:00.000Z',
  ...overrides,
});

const makeCat = (overrides: Partial<Category> = {}): Category => ({
  id: 'cat-food',
  name: 'Makanan',
  icon: 'Utensils',
  color: '#f97316',
  createdAt: '2026-11-26T10:00:00.000Z',
  ...overrides,
});

describe('transactionHelpers', () => {
  it('defaults undefined transaction and category type to expense', () => {
    assert.equal(getTransactionType(makeTx()), 'expense');
    assert.equal(getTransactionType(makeTx({ type: 'income' })), 'income');
    assert.equal(getCategoryType(makeCat()), 'expense');
    assert.equal(getCategoryType(makeCat({ type: 'income' })), 'income');
  });

  it('filters transactions and categories by type', () => {
    const txs = [
      makeTx({ id: 't1', amount: 25000 }),
      makeTx({ id: 't2', amount: 5000000, type: 'income', categoryId: 'cat-inc-salary' }),
      makeTx({ id: 't3', amount: 50000, type: 'expense' }),
    ];
    const cats = [
      makeCat({ id: 'c1' }),
      makeCat({ id: 'c2', type: 'income' }),
    ];

    assert.deepEqual(
      filterTransactionsByType(txs, 'expense').map((t) => t.id),
      ['t1', 't3']
    );
    assert.deepEqual(
      filterTransactionsByType(txs, 'income').map((t) => t.id),
      ['t2']
    );
    assert.deepEqual(
      filterCategoriesByType(cats, 'expense').map((c) => c.id),
      ['c1']
    );
    assert.deepEqual(
      filterCategoriesByType(cats, 'income').map((c) => c.id),
      ['c2']
    );
  });

  it('calculates surplus, boncos, even, and no_income cashflow states', () => {
    const surplus = calculateCashFlowSummary([
      makeTx({ id: 'i1', amount: 5000000, type: 'income' }),
      makeTx({ id: 'e1', amount: 3000000 }),
    ]);
    assert.deepEqual(surplus, {
      totalIncome: 5000000,
      totalExpense: 3000000,
      netCashFlow: 2000000,
      status: 'surplus',
      expenseRatioPct: 60,
      savingRatePct: 40,
    });

    const boncos = calculateCashFlowSummary([
      makeTx({ id: 'i1', amount: 3000000, type: 'income' }),
      makeTx({ id: 'e1', amount: 3500000, type: 'expense' }),
    ]);
    assert.deepEqual(boncos, {
      totalIncome: 3000000,
      totalExpense: 3500000,
      netCashFlow: -500000,
      status: 'boncos',
      expenseRatioPct: 117,
      savingRatePct: 0,
    });

    const even = calculateCashFlowSummary([
      makeTx({ id: 'i1', amount: 1000000, type: 'income' }),
      makeTx({ id: 'e1', amount: 1000000 }),
    ]);
    assert.equal(even.status, 'even');
    assert.equal(even.netCashFlow, 0);

    const noIncome = calculateCashFlowSummary([
      makeTx({ id: 'e1', amount: 200000 }),
    ]);
    assert.equal(noIncome.status, 'no_income');
    assert.equal(noIncome.expenseRatioPct, 0);
    assert.equal(noIncome.savingRatePct, 0);

    const empty = calculateCashFlowSummary([]);
    assert.equal(empty.status, 'even');
    assert.equal(empty.totalIncome, 0);
    assert.equal(empty.totalExpense, 0);
  });

  it('reads and persists income tracking preference safely in storage', () => {
    const store = new Map<string, string>();
    const mockStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, v);
      },
    };
    assert.equal(isIncomeTrackingEnabled(mockStorage), false);
    setIncomeTrackingEnabled(true, mockStorage);
    assert.equal(store.get(INCOME_TRACKING_STORAGE_KEY), 'true');
    assert.equal(isIncomeTrackingEnabled(mockStorage), true);
    setIncomeTrackingEnabled(false, mockStorage);
    assert.equal(isIncomeTrackingEnabled(mockStorage), false);
  });

  it('prevents cross-type stale target category in batch move and stale filter in list', () => {
    const expCat = makeCat({ id: 'cat-food', type: 'expense' });
    const expCat2 = makeCat({ id: 'cat-transport', type: 'expense' });
    const incCat = makeCat({ id: 'cat-inc-salary', type: 'income' });
    const incCat2 = makeCat({ id: 'cat-inc-bonus', type: 'income' });
    const allCats = [expCat, expCat2, incCat, incCat2];

    // Stale expense target 'cat-food' when moving from income category 'cat-inc-salary' must resolve to 'cat-inc-bonus'
    assert.equal(resolveBatchMoveTargetCategory('cat-food', incCat, allCats), 'cat-inc-bonus');
    // Valid same-type target is preserved
    assert.equal(resolveBatchMoveTargetCategory('cat-inc-bonus', incCat, allCats), 'cat-inc-bonus');
    // No other same-type category returns empty string
    assert.equal(resolveBatchMoveTargetCategory('cat-food', incCat, [expCat, incCat]), '');

    // Stale income category filter when only expense categories are visible falls back to 'ALL'
    assert.equal(resolveActiveCategoryFilter('cat-inc-salary', [expCat, expCat2]), 'ALL');
    assert.equal(resolveActiveCategoryFilter('cat-food', [expCat, expCat2]), 'cat-food');
  });
});
