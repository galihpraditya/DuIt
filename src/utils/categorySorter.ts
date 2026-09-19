import type { Category, CategorySortMode, Transaction } from '../types';

export const CATEGORY_SORT_MODE_STORAGE_KEY = 'duit_category_sort_mode';

/**
 * Mengambil preferensi mode pengurutan kategori dari localStorage.
 * Default adalah 'most_used' (Cerdas: paling sering digunakan).
 */
export function getStoredCategorySortMode(): CategorySortMode {
  try {
    const saved = localStorage.getItem(CATEGORY_SORT_MODE_STORAGE_KEY);
    if (
      saved === 'manual' ||
      saved === 'most_used' ||
      saved === 'highest_amount' ||
      saved === 'name_asc' ||
      saved === 'name_desc' ||
      saved === 'newest'
    ) {
      return saved;
    }
  } catch (e) {
    console.warn('Gagal membaca mode pengurutan kategori dari storage:', e);
  }
  return 'most_used';
}

/**
 * Menyimpan preferensi mode pengurutan kategori ke localStorage.
 */
export function setStoredCategorySortMode(mode: CategorySortMode): void {
  try {
    localStorage.setItem(CATEGORY_SORT_MODE_STORAGE_KEY, mode);
  } catch (e) {
    console.warn('Gagal menyimpan mode pengurutan kategori ke storage:', e);
  }
}

/**
 * Mengurutkan array kategori berdasarkan mode urut dan riwayat transaksi.
 * Menghasilkan array baru (pure function tanpa mutasi array asli).
 */
export function sortCategories(
  categories: Category[],
  sortMode: CategorySortMode,
  transactions: Transaction[] = []
): Category[] {
  if (!categories || categories.length === 0) return [];

  const copy = [...categories];

  switch (sortMode) {
    case 'manual': {
      return copy.sort((a, b) => {
        const orderA = typeof a.order === 'number' ? a.order : 999999;
        const orderB = typeof b.order === 'number' ? b.order : 999999;
        if (orderA !== orderB) return orderA - orderB;
        return a.name.localeCompare(b.name);
      });
    }

    case 'most_used': {
      const countMap = new Map<string, number>();
      for (const tx of transactions) {
        countMap.set(tx.categoryId, (countMap.get(tx.categoryId) || 0) + 1);
      }
      return copy.sort((a, b) => {
        const countA = countMap.get(a.id) || 0;
        const countB = countMap.get(b.id) || 0;
        if (countB !== countA) return countB - countA;
        // Fallback ke urutan manual atau nama jika frekuensi sama
        const orderA = typeof a.order === 'number' ? a.order : 999999;
        const orderB = typeof b.order === 'number' ? b.order : 999999;
        if (orderA !== orderB) return orderA - orderB;
        return a.name.localeCompare(b.name);
      });
    }

    case 'highest_amount': {
      const sumMap = new Map<string, number>();
      for (const tx of transactions) {
        sumMap.set(tx.categoryId, (sumMap.get(tx.categoryId) || 0) + (tx.amount || 0));
      }
      return copy.sort((a, b) => {
        const sumA = sumMap.get(a.id) || 0;
        const sumB = sumMap.get(b.id) || 0;
        if (sumB !== sumA) return sumB - sumA;
        return a.name.localeCompare(b.name);
      });
    }

    case 'name_asc': {
      return copy.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    }

    case 'name_desc': {
      return copy.sort((a, b) => b.name.localeCompare(a.name, undefined, { sensitivity: 'base' }));
    }

    case 'newest': {
      return copy.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });
    }

    default:
      return copy;
  }
}

/**
 * Memberikan indeks urutan manual `order: 0, 1, 2, ...` secara berurutan.
 */
export function reassignCategoryOrders(categories: Category[]): Category[] {
  return categories.map((cat, index) => ({
    ...cat,
    order: index,
  }));
}

/**
 * Menggeser kategori 1 langkah ke atas atau ke bawah dalam urutan manual.
 * Mengembalikan array kategori baru dengan nilai `order` yang telah diperbarui.
 */
export function moveCategoryOrder(
  categories: Category[],
  categoryId: string,
  direction: 'up' | 'down'
): Category[] {
  const currentIndex = categories.findIndex((c) => c.id === categoryId);
  if (currentIndex === -1) return categories;

  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= categories.length) {
    return categories; // Sudah di ujung atas atau ujung bawah
  }

  const result = [...categories];
  const [removed] = result.splice(currentIndex, 1);
  result.splice(targetIndex, 0, removed);

  return reassignCategoryOrders(result);
}
