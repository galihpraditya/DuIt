import type { Transaction, Category, PaymentMethodType, TransactionType } from '../types';
import { db } from '../db/database';
import { format } from 'date-fns';
import { generateId } from '../utils/formatters';
import { getCategoryType, getTransactionType } from '../utils/transactionHelpers';

export interface ExportDataParams {
  transactions: Transaction[];
  categories: Category[];
  includeType?: boolean;
}

export function parseImportType(rawValue: unknown): TransactionType {
  const normalized = String(rawValue ?? '').trim().toLowerCase();
  if (
    normalized === 'income' ||
    normalized === 'pendapatan' ||
    normalized === 'pemasukan' ||
    normalized === 'masuk' ||
    normalized === 'in'
  ) {
    return 'income';
  }
  return 'expense';
}

export async function exportTransactionsToExcel({
  transactions,
  categories,
  includeType = false,
}: ExportDataParams) {
  // Dynamically load XLSX on demand to optimize initial bundle size
  const XLSX = await import('xlsx');
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  // Sheet 1: Transactions Data
  const transactionRows = transactions.map((t, idx) => {
    const txType = getTransactionType(t);
    const baseRow: Record<string, unknown> = {
      No: idx + 1,
      'ID Transaksi': t.id,
      Tanggal: format(new Date(t.date), 'yyyy-MM-dd HH:mm'),
    };
    if (includeType) {
      baseRow['Tipe'] = txType === 'income' ? 'Pendapatan' : 'Pengeluaran';
    }
    baseRow['Kategori'] = categoryMap.get(t.categoryId) || (txType === 'income' ? 'Pemasukan Lain' : 'Lain-lain');
    baseRow['Nominal (IDR)'] = t.amount;
    baseRow['Metode Pembayaran'] = t.paymentMethod || '-';
    baseRow['Catatan'] = t.notes || '-';
    return baseRow;
  });

  const wsTransactions = XLSX.utils.json_to_sheet(transactionRows);

  // Column width styling
  wsTransactions['!cols'] = includeType
    ? [
        { wch: 6 },
        { wch: 15 },
        { wch: 18 },
        { wch: 14 },
        { wch: 22 },
        { wch: 16 },
        { wch: 18 },
        { wch: 35 },
      ]
    : [
        { wch: 6 },
        { wch: 15 },
        { wch: 18 },
        { wch: 22 },
        { wch: 16 },
        { wch: 18 },
        { wch: 35 },
      ];

  // Sheet 2: Category Summary (scoped by type so income & expense percentages stay meaningful)
  const categorySummaryMap = new Map<string, { type: TransactionType; catName: string; count: number; total: number }>();
  let totalExpense = 0;
  let totalIncome = 0;

  transactions.forEach((t) => {
    const txType = getTransactionType(t);
    if (txType === 'income') {
      totalIncome += t.amount;
    } else {
      totalExpense += t.amount;
    }
    const catName = categoryMap.get(t.categoryId) || (txType === 'income' ? 'Pemasukan Lain' : 'Lain-lain');
    const key = `${txType}__${catName}`;
    const existing = categorySummaryMap.get(key) || { type: txType, catName, count: 0, total: 0 };
    categorySummaryMap.set(key, {
      type: txType,
      catName,
      count: existing.count + 1,
      total: existing.total + t.amount,
    });
  });

  const categorySummaryRows = Array.from(categorySummaryMap.values()).map((stats) => {
    const denominator = stats.type === 'income' ? totalIncome : totalExpense;
    const pct = denominator > 0 ? `${((stats.total / denominator) * 100).toFixed(1)}%` : '0%';
    if (includeType) {
      return {
        Tipe: stats.type === 'income' ? 'Pendapatan' : 'Pengeluaran',
        Kategori: stats.catName,
        'Jumlah Transaksi': stats.count,
        'Total Nominal (IDR)': stats.total,
        Persentase: pct,
      };
    }
    return {
      Kategori: stats.catName,
      'Jumlah Transaksi': stats.count,
      'Total Pengeluaran (IDR)': stats.total,
      Persentase: pct,
    };
  });

  const wsSummary = XLSX.utils.json_to_sheet(categorySummaryRows);
  wsSummary['!cols'] = includeType
    ? [{ wch: 14 }, { wch: 25 }, { wch: 18 }, { wch: 24 }, { wch: 14 }]
    : [{ wch: 25 }, { wch: 18 }, { wch: 24 }, { wch: 14 }];

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsTransactions, includeType ? 'Daftar Transaksi' : 'Daftar Pengeluaran');
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Kategori');

  const fileName = includeType
    ? `DuIt_CashFlow_Report_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`
    : `DuIt_Expense_Report_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

export interface ParsedImportRow {
  date: string;
  amount: number;
  type: TransactionType;
  categoryName: string;
  notes?: string;
  paymentMethod?: string;
  isValid: boolean;
  error?: string;
}

function parseFlexibleDate(dateVal: unknown): Date {
  if (dateVal instanceof Date && !isNaN(dateVal.getTime())) {
    return dateVal;
  }

  if (typeof dateVal === 'number' && dateVal > 0) {
    // Excel serial date (days since Dec 30, 1899)
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const millis = excelEpoch.getTime() + dateVal * 86400000;
    const d = new Date(millis);
    if (!isNaN(d.getTime())) return d;
  }

  if (typeof dateVal === 'string' && dateVal.trim() !== '') {
    const raw = dateVal.trim();
    
    // Check DD/MM/YYYY or DD-MM-YYYY with optional time
    const ddmmyyyyMatch = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
    if (ddmmyyyyMatch) {
      const day = parseInt(ddmmyyyyMatch[1], 10);
      const month = parseInt(ddmmyyyyMatch[2], 10) - 1;
      const year = parseInt(ddmmyyyyMatch[3], 10);
      const hours = ddmmyyyyMatch[4] ? parseInt(ddmmyyyyMatch[4], 10) : 12;
      const minutes = ddmmyyyyMatch[5] ? parseInt(ddmmyyyyMatch[5], 10) : 0;
      const seconds = ddmmyyyyMatch[6] ? parseInt(ddmmyyyyMatch[6], 10) : 0;
      const d = new Date(year, month, day, hours, minutes, seconds);
      if (!isNaN(d.getTime())) return d;
    }

    const standardParsed = new Date(raw);
    if (!isNaN(standardParsed.getTime())) {
      return standardParsed;
    }
  }

  return new Date();
}

export async function parseExcelFile(file: File): Promise<ParsedImportRow[]> {
  const XLSX = await import('xlsx');

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        const results: ParsedImportRow[] = rawJson.map((row) => {
          // Flexible key lookup
          const dateVal = row['Tanggal'] || row['Date'] || row['tanggal'] || row['date'];
          const typeVal = row['Tipe'] || row['Type'] || row['Jenis'] || row['tipe'] || row['type'] || row['jenis'];
          const rowType = parseImportType(typeVal);
          const amountVal =
            row['Nominal'] || row['Nominal (IDR)'] || row['Amount'] || row['amount'] || row['Pengeluaran'] || row['Pendapatan'];
          const categoryVal =
            row['Kategori'] || row['Category'] || row['kategori'] || (rowType === 'income' ? 'Pemasukan Lain' : 'Lain-lain');
          const notesVal = row['Catatan'] || row['Keterangan'] || row['Notes'] || row['Description'] || '';
          const paymentVal = row['Metode Pembayaran'] || row['Metode'] || row['Payment Method'] || 'Tunai';

          const parsedAmount = Number(String(amountVal).replace(/[^0-9.-]+/g, ''));
          if (isNaN(parsedAmount) || parsedAmount <= 0) {
            return {
              date: new Date().toISOString(),
              amount: 0,
              type: rowType,
              categoryName: String(categoryVal),
              notes: String(notesVal),
              paymentMethod: String(paymentVal),
              isValid: false,
              error: 'Nominal tidak valid atau kosong',
            };
          }

          const parsedDate = parseFlexibleDate(dateVal);

          // Strip leading/trailing spaces and handle dash '-' as empty string for notes
          const cleanedNotes = String(notesVal || '').trim();
          const finalNotes = cleanedNotes === '-' ? '' : cleanedNotes;

          return {
            date: parsedDate.toISOString(),
            amount: parsedAmount,
            type: rowType,
            categoryName: String(categoryVal).trim() || (rowType === 'income' ? 'Pemasukan Lain' : 'Lain-lain'),
            notes: finalNotes,
            paymentMethod: String(paymentVal).trim() === '-' ? 'Tunai' : String(paymentVal).trim(),
            isValid: true,
          };
        });

        resolve(results);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

const VALID_PAYMENT_METHODS: PaymentMethodType[] = [
  'Tunai',
  'Transfer Bank',
  'E-Wallet',
  'QRIS / E-Wallet',
  'Kartu Debit',
  'Kartu Kredit',
  'Lainnya',
];

export async function importTransactionsToDb(parsedRows: ParsedImportRow[]): Promise<number> {
  const validRows = parsedRows.filter((r) => r.isValid);
  if (validRows.length === 0) return 0;

  const existingCategories = await db.categories.toArray();
  const categoryMap = new Map<string, string>(); // `${type}__${categoryName.toLowerCase()}` -> id
  existingCategories.forEach((c) => categoryMap.set(`${getCategoryType(c)}__${c.name.toLowerCase()}`, c.id));

  const newTransactions: Transaction[] = [];
  const newCategories: Category[] = [];

  for (const row of validRows) {
    const rowType = row.type || 'expense';
    const catLookupKey = `${rowType}__${row.categoryName.toLowerCase()}`;
    let catId = categoryMap.get(catLookupKey);

    // Auto-create category with matching type if doesn't exist
    if (!catId) {
      const newCat: Category = {
        id: generateId('cat'),
        name: row.categoryName,
        icon: rowType === 'income' ? 'Briefcase' : 'Tag',
        color: rowType === 'income' ? '#10b981' : '#6366f1',
        type: rowType,
        createdAt: new Date().toISOString(),
      };
      await db.categories.add(newCat);
      newCategories.push(newCat);
      categoryMap.set(catLookupKey, newCat.id);
      catId = newCat.id;
    }

    const matchedMethod = VALID_PAYMENT_METHODS.find(
      (m) => m.toLowerCase() === (row.paymentMethod || '').toLowerCase()
    ) || 'Tunai';

    newTransactions.push({
      id: generateId('tx'),
      amount: row.amount,
      date: row.date,
      categoryId: catId,
      type: rowType,
      notes: row.notes,
      paymentMethod: matchedMethod,
      createdAt: new Date().toISOString(),
    });
  }

  await db.transactions.bulkAdd(newTransactions);

  // Sync ke cloud secara otomatis agar tidak dihapus oleh syncAll()
  import('./supabaseClient').then(async ({ isSupabaseConfigured }) => {
    if (isSupabaseConfigured) {
      import('./authService').then(async ({ authService }) => {
        const user = await authService.getCurrentUser();
        if (user?.id) {
          try {
            const { safeUpsert } = await import('./syncService');

            // Upload kategori baru terlebih dahulu
            if (newCategories.length > 0) {
              const catPayload = newCategories.map(c => ({
                id: c.id,
                user_id: user.id,
                name: c.name,
                icon: c.icon,
                color: c.color,
                type: getCategoryType(c),
                budget_limit: 0,
                is_default: false,
                created_at: c.createdAt,
              }));
              await safeUpsert('categories', catPayload);
            }

            // Upload transaksi baru
            if (newTransactions.length > 0) {
              const txPayload = newTransactions.map(tx => ({
                id: tx.id,
                user_id: user.id,
                amount: tx.amount,
                date: tx.date,
                category_id: tx.categoryId,
                type: getTransactionType(tx),
                notes: tx.notes || null,
                payment_method: tx.paymentMethod || null,
                created_at: tx.createdAt,
              }));
              await safeUpsert('transactions', txPayload);
            }
          } catch (e) {
            console.warn('Gagal mengunggah data hasil import:', e);
          }
        }
      });
    }
  });

  return newTransactions.length;
}
