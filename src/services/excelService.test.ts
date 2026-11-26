import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseImportType } from './excelService';

describe('excelService parseImportType', () => {
  it('parses Indonesian and English income labels to income and defaults others to expense', () => {
    assert.equal(parseImportType('Pendapatan'), 'income');
    assert.equal(parseImportType('pemasukan'), 'income');
    assert.equal(parseImportType('Income'), 'income');
    assert.equal(parseImportType('Masuk'), 'income');
    assert.equal(parseImportType('Pengeluaran'), 'expense');
    assert.equal(parseImportType('expense'), 'expense');
    assert.equal(parseImportType(''), 'expense');
    assert.equal(parseImportType(undefined), 'expense');
  });
});
