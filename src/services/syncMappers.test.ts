import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  mapCloudCategoryToLocal,
  mapCloudTransactionToLocal,
  findSameTypeCategoryMatch,
  mapLocalCategoryToCloudPayload,
  mapLocalTransactionToCloudPayload,
} from './syncMappers';
import type { Category, Transaction } from '../types';

describe('syncMappers', () => {
  it('maps cloud category and transaction rows defaulting omitted type to expense', () => {
    const legacyCloudCat = {
      id: 'cat-food',
      name: 'Makanan',
      icon: 'Utensils',
      color: '#f97316',
      budget_limit: 0,
      is_default: true,
      order_index: 0,
      created_at: '2026-11-26T00:00:00Z',
    };
    const mappedLegacyCat = mapCloudCategoryToLocal(legacyCloudCat, undefined);
    assert.equal(mappedLegacyCat.type, 'expense');

    const incomeCloudCat = {
      id: 'cat-inc-salary',
      name: 'Gaji',
      icon: 'Briefcase',
      color: '#10b981',
      type: 'income',
      budget_limit: 0,
      is_default: true,
      order_index: 0,
      created_at: '2026-11-26T00:00:00Z',
    };
    const mappedIncomeCat = mapCloudCategoryToLocal(incomeCloudCat, undefined);
    assert.equal(mappedIncomeCat.type, 'income');

    const mappedLegacyTx = mapCloudTransactionToLocal(
      { id: 'tx-1', amount: 25000, date: '2026-11-26T10:00:00Z', category_id: 'cat-food' },
      'cat-food'
    );
    assert.equal(mappedLegacyTx.type, 'expense');

    const mappedIncomeTx = mapCloudTransactionToLocal(
      { id: 'tx-2', amount: 5000000, date: '2026-11-26T10:00:00Z', category_id: 'cat-inc-salary', type: 'income' },
      'cat-inc-salary'
    );
    assert.equal(mappedIncomeTx.type, 'income');
  });

  it('matches categories for reconciliation only within the same transaction type', () => {
    const cloudCats = [
      { id: 'cloud-exp', name: 'Lainnya', type: 'expense' },
      { id: 'cloud-inc', name: 'Bonus', type: 'income' },
    ];

    const localSameNameDifferentType: Category = {
      id: 'local-inc-lainnya',
      name: 'Lainnya',
      icon: 'CircleEllipsis',
      color: '#64748b',
      type: 'income',
      createdAt: '2026-11-26T00:00:00Z',
    };
    assert.equal(findSameTypeCategoryMatch(localSameNameDifferentType, cloudCats), undefined);

    const localExpenseLainnya: Category = {
      ...localSameNameDifferentType,
      id: 'local-exp-lainnya',
      type: 'expense',
    };
    assert.equal(findSameTypeCategoryMatch(localExpenseLainnya, cloudCats), 'cloud-exp');

    const localIncomeBonus: Category = {
      id: 'local-inc-bonus',
      name: ' bonus ',
      icon: 'Gift',
      color: '#14b8a6',
      type: 'income',
      createdAt: '2026-11-26T00:00:00Z',
    };
    assert.equal(findSameTypeCategoryMatch(localIncomeBonus, cloudCats), 'cloud-inc');
  });

  it('preserves local income type when cloud row omits type (un-migrated Supabase schema)', () => {
    const localIncomeCat: Category = {
      id: 'cat-custom-inc',
      name: 'Side Hustle',
      icon: 'Laptop',
      color: '#10b981',
      type: 'income',
      createdAt: '2026-11-26T00:00:00Z',
    };
    const unmigratedCloudCat = {
      id: 'cat-custom-inc',
      name: 'Side Hustle',
      icon: 'Laptop',
      color: '#10b981',
      budget_limit: 0,
      created_at: '2026-11-26T00:00:00Z',
    };
    assert.equal(mapCloudCategoryToLocal(unmigratedCloudCat, localIncomeCat).type, 'income');

    const defaultIncFromCloud = mapCloudCategoryToLocal(
      { id: 'cat-inc-salary', name: 'Gaji', icon: 'Briefcase', color: '#10b981' },
      undefined
    );
    assert.equal(defaultIncFromCloud.type, 'income');

    const localIncomeTx: Transaction = {
      id: 'tx-inc-1',
      amount: 5000000,
      date: '2026-11-26T10:00:00Z',
      categoryId: 'cat-custom-inc',
      type: 'income',
      createdAt: '2026-11-26T10:00:00Z',
    };
    const unmigratedCloudTx = {
      id: 'tx-inc-1',
      amount: 5000000,
      date: '2026-11-26T10:00:00Z',
      category_id: 'cat-custom-inc',
    };
    assert.equal(
      mapCloudTransactionToLocal(unmigratedCloudTx, 'cat-custom-inc', localIncomeTx).type,
      'income'
    );
    assert.equal(
      mapCloudTransactionToLocal(unmigratedCloudTx, 'cat-custom-inc', undefined, 'income').type,
      'income'
    );
  });

  it('includes normalized type in cloud payloads', () => {
    const cat: Category = {
      id: 'cat-inc-salary',
      name: 'Gaji',
      icon: 'Briefcase',
      color: '#10b981',
      type: 'income',
      createdAt: '2026-11-26T00:00:00Z',
    };
    const catPayload = mapLocalCategoryToCloudPayload(cat, 'user-1');
    assert.equal(catPayload.type, 'income');

    const tx: Transaction = {
      id: 'tx-1',
      amount: 100000,
      date: '2026-11-26T10:00:00Z',
      categoryId: 'cat-food',
      createdAt: '2026-11-26T10:00:00Z',
    };
    const txPayload = mapLocalTransactionToCloudPayload(tx, 'user-1', 'cat-food');
    assert.equal(txPayload.type, 'expense');
  });
});
