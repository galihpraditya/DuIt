import type { Transaction, Category, PaymentMethodType } from '../types';
import { db } from '../db/database';
import { format } from 'date-fns';
import { generateId } from '../utils/formatters';

export interface ExportDataParams {
  transactions: Transaction[];
  categories: Category[];
}

export async function exportTransactionsToExcel({ transactions, categories }: ExportDataParams) {
  // Dynamically load XLSX on demand to optimize initial bundle size
  const XLSX = await import('xlsx');
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  // Sheet 1: Transactions Data
  const transactionRows = transactions.map((t, idx) => ({
    No: idx + 1,
    'ID Transaksi': t.id,
    Tanggal: format(new Date(t.date), 'yyyy-MM-dd HH:mm'),
    Kategori: categoryMap.get(t.categoryId) || 'Lain-lain',
    'Nominal (IDR)': t.amount,
    'Metode Pembayaran': t.paymentMethod || '-',
    Catatan: t.notes || '-',
  }));

  const wsTransactions = XLSX.utils.json_to_sheet(transactionRows);

  // Column width styling
  wsTransactions['!cols'] = [
    { wch: 6 }, // No
    { wch: 15 }, // ID
    { wch: 18 }, // Tanggal
    { wch: 22 }, // Kategori
    { wch: 16 }, // Nominal
    { wch: 18 }, // Metode
    { wch: 35 }, // Catatan
  ];

  // Sheet 2: Category Summary
  const categorySummaryMap = new Map<string, { count: number; total: number }>();
  transactions.forEach((t) => {
    const catName = categoryMap.get(t.categoryId) || 'Lain-lain';
    const existing = categorySummaryMap.get(catName) || { count: 0, total: 0 };
    categorySummaryMap.set(catName, {
      count: existing.count + 1,
      total: existing.total + t.amount,
    });
  });

  const totalExpense = transactions.reduce((acc, t) => acc + t.amount, 0);

  const categorySummaryRows = Array.from(categorySummaryMap.entries()).map(([catName, stats]) => ({
    Kategori: catName,
    'Jumlah Transaksi': stats.count,
    'Total Pengeluaran (IDR)': stats.total,
    Persentase: totalExpense > 0 ? `${((stats.total / totalExpense) * 100).toFixed(1)}%` : '0%',
  }));

  const wsSummary = XLSX.utils.json_to_sheet(categorySummaryRows);
  wsSummary['!cols'] = [{ wch: 25 }, { wch: 18 }, { wch: 24 }, { wch: 14 }];

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsTransactions, 'Daftar Pengeluaran');
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Kategori');

  const fileName = `DuIt_Expense_Report_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

export interface ParsedImportRow {
  date: string;
  amount: number;
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
          const amountVal =
            row['Nominal'] || row['Nominal (IDR)'] || row['Amount'] || row['amount'] || row['Pengeluaran'];
          const categoryVal = row['Kategori'] || row['Category'] || row['kategori'] || 'Lain-lain';
          const notesVal = row['Catatan'] || row['Keterangan'] || row['Notes'] || row['Description'] || '';
          const paymentVal = row['Metode Pembayaran'] || row['Metode'] || row['Payment Method'] || 'Tunai';

          const parsedAmount = Number(String(amountVal).replace(/[^0-9.-]+/g, ''));
          if (isNaN(parsedAmount) || parsedAmount <= 0) {
            return {
              date: new Date().toISOString(),
              amount: 0,
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
            categoryName: String(categoryVal).trim() || 'Lain-lain',
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
  const categoryMap = new Map<string, string>(); // categoryName.toLowerCase() -> id
  existingCategories.forEach((c) => categoryMap.set(c.name.toLowerCase(), c.id));

  const newTransactions: Transaction[] = [];
  const newCategories: Category[] = [];

  for (const row of validRows) {
    let catId = categoryMap.get(row.categoryName.toLowerCase());

    // Auto-create category if doesn't exist
    if (!catId) {
      const newCat: Category = {
        id: generateId('cat'),
        name: row.categoryName,
        icon: 'Tag',
        color: '#6366f1',
        createdAt: new Date().toISOString(),
      };
      await db.categories.add(newCat);
      newCategories.push(newCat);
      categoryMap.set(row.categoryName.toLowerCase(), newCat.id);
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
      notes: row.notes,
      paymentMethod: matchedMethod,
      createdAt: new Date().toISOString(),
    });
  }

  await db.transactions.bulkAdd(newTransactions);

  // Sync ke cloud secara otomatis agar tidak dihapus oleh syncAll()
  import('./supabaseClient').then(async ({ supabase, isSupabaseConfigured }) => {
    if (isSupabaseConfigured) {
      import('./authService').then(async ({ authService }) => {
        const user = await authService.getCurrentUser();
        if (user?.id) {
          try {
            // Upload kategori baru
            if (newCategories.length > 0) {
              const catPayload = newCategories.map(c => ({
                id: c.id,
                user_id: user.id,
                name: c.name,
                icon: c.icon,
                color: c.color,
                budget_limit: 0,
                is_default: false,
                created_at: c.createdAt,
              }));
              await supabase.from('categories').upsert(catPayload);
            }

            // Upload transaksi baru
            if (newTransactions.length > 0) {
              const txPayload = newTransactions.map(tx => ({
                id: tx.id,
                user_id: user.id,
                amount: tx.amount,
                date: tx.date,
                category_id: tx.categoryId,
                notes: tx.notes || null,
                payment_method: tx.paymentMethod || null,
                created_at: tx.createdAt,
              }));
              await supabase.from('transactions').upsert(txPayload);
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
