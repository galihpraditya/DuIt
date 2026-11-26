import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { aiService, detectTransactionType } from './aiService';
import type { TransactionType } from '../types';

const sampleCategories: Array<{
  id: string;
  name: string;
  isDefault?: boolean;
  type?: TransactionType;
}> = [
  { id: 'cat-food', name: 'Makanan & Minuman', isDefault: true, type: 'expense' },
  { id: 'cat-transport', name: 'Transportasi & Bensin', isDefault: true, type: 'expense' },
  { id: 'cat-others', name: 'Lain-lain', isDefault: true, type: 'expense' },
  { id: 'cat-inc-salary', name: 'Gaji', isDefault: true, type: 'income' },
  { id: 'cat-inc-bonus', name: 'Bonus & THR', isDefault: true, type: 'income' },
  { id: 'cat-inc-freelance', name: 'Freelance & Usaha', isDefault: true, type: 'income' },
  { id: 'cat-inc-invest', name: 'Investasi & Dividen', isDefault: true, type: 'income' },
  { id: 'cat-inc-others', name: 'Pemasukan Lain', isDefault: true, type: 'income' },
];

describe('aiService income parsing', () => {
  it('detects income keywords when allowIncome is true and forces expense when false', () => {
    assert.equal(detectTransactionType('gaji bulan november 8jt transfer bca', true), 'income');
    assert.equal(detectTransactionType('dapat bonus proyek 1.5jt', true), 'income');
    assert.equal(detectTransactionType('terima fee freelance 750rb', true), 'income');
    assert.equal(detectTransactionType('makan siang 35rb qris', true), 'expense');
    assert.equal(detectTransactionType('gaji bulan november 8jt', false), 'expense');
  });

  it('parses local natural income input to income type and income category when allowIncome is true', async () => {
    const results = await aiService.parseNaturalTransactions(
      'gaji 8jt transfer bca, bakso 20rb tunai',
      sampleCategories,
      { allowIncome: true }
    );

    assert.equal(results.length, 2);
    assert.equal(results[0].type, 'income');
    assert.equal(results[0].amount, 8000000);
    assert.equal(results[0].categoryId, 'cat-inc-salary');
    assert.equal(results[0].paymentMethod, 'Transfer Bank');

    assert.equal(results[1].type, 'expense');
    assert.equal(results[1].amount, 20000);
    assert.equal(results[1].categoryId, 'cat-food');
  });

  it('never assigns income type or income category when allowIncome is false', async () => {
    const results = await aiService.parseNaturalTransactions(
      'gaji 8jt transfer bca',
      sampleCategories.filter((c) => c.type !== 'income'),
      { allowIncome: false }
    );

    assert.equal(results.length, 1);
    assert.equal(results[0].type, 'expense');
    assert.equal(results[0].categoryId, 'cat-others');
  });
});
