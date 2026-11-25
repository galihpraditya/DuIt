import type { Category, Transaction, TransactionType } from '../types';
import { getCategoryType, getTransactionType } from '../utils/transactionHelpers';

const LEGACY_DUMMY_BUDGET_MAP: Record<string, number> = {
  'cat-food': 2500000,
  'cat-transport': 1000000,
  'cat-shopping': 1500000,
  'cat-bills': 1200000,
  'cat-entertainment': 800000,
  'cat-health': 500000,
  'cat-education': 500000,
};

function normalizeType(rawType: unknown): TransactionType | undefined {
  if (rawType === 'income') return 'income';
  if (rawType === 'expense') return 'expense';
  return undefined;
}

export function mapCloudCategoryToLocal(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cc: any,
  localExisting: Category | undefined
): Category {
  const rawLimit = cc.budget_limit ? Number(cc.budget_limit) : undefined;
  const isLegacyDummy = rawLimit !== undefined && LEGACY_DUMMY_BUDGET_MAP[cc.id] === rawLimit;
  const explicitType = normalizeType(cc.type);
  const fallbackType: TransactionType =
    localExisting?.type === 'income' || (typeof cc.id === 'string' && cc.id.startsWith('cat-inc-'))
      ? 'income'
      : 'expense';

  return {
    id: cc.id,
    name: cc.name || 'Kategori',
    icon: cc.icon || 'Tag',
    color: cc.color || '#64748b',
    type: explicitType ?? fallbackType,
    budgetLimit: isLegacyDummy ? undefined : rawLimit,
    isDefault: Boolean(cc.is_default),
    order: typeof cc.order_index === 'number' ? cc.order_index : (localExisting?.order ?? 0),
    createdAt: cc.created_at || new Date().toISOString(),
  };
}

export function mapCloudTransactionToLocal(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: any,
  effectiveCatId: string,
  localExisting?: Transaction,
  resolvedCategoryType?: TransactionType
): Transaction {
  const explicitType = normalizeType(ctx.type);
  const fallbackType: TransactionType =
    localExisting?.type === 'income'
      ? 'income'
      : localExisting?.type === 'expense'
      ? 'expense'
      : resolvedCategoryType === 'income'
      ? 'income'
      : 'expense';

  return {
    id: ctx.id,
    amount: Number(ctx.amount) || 0,
    date: ctx.date || new Date().toISOString(),
    categoryId: effectiveCatId,
    type: explicitType ?? fallbackType,
    notes: ctx.notes || undefined,
    paymentMethod: ctx.payment_method || undefined,
    tags: Array.isArray(ctx.tags) ? ctx.tags : undefined,
    createdAt: ctx.created_at || new Date().toISOString(),
  };
}

export function findSameTypeCategoryMatch(
  localCat: Category,
  cloudCats: Array<{ id: string; name?: string | null; type?: string | null }>
): string | undefined {
  const normName = (localCat.name || '').trim().toLowerCase();
  if (!normName) return undefined;
  const localType = getCategoryType(localCat);

  const match = cloudCats.find((cc) => {
    const cloudName = (cc.name || '').trim().toLowerCase();
    const cloudType =
      normalizeType(cc.type) ?? (cc.id.startsWith('cat-inc-') ? 'income' : 'expense');
    return cloudName === normName && cloudType === localType;
  });

  return match?.id;
}

export function mapLocalCategoryToCloudPayload(cat: Category, userId: string) {
  return {
    id: cat.id,
    user_id: userId,
    name: cat.name || 'Kategori',
    icon: cat.icon || 'Tag',
    color: cat.color || '#64748b',
    type: getCategoryType(cat),
    budget_limit: cat.budgetLimit || 0,
    is_default: Boolean(cat.isDefault),
    order_index: typeof cat.order === 'number' ? cat.order : 0,
    created_at: cat.createdAt || new Date().toISOString(),
  };
}

export function mapLocalTransactionToCloudPayload(
  tx: Transaction,
  userId: string,
  effectiveCatId: string
) {
  return {
    id: tx.id,
    user_id: userId,
    amount: Number(tx.amount) || 0,
    date: tx.date || new Date().toISOString(),
    category_id: effectiveCatId,
    type: getTransactionType(tx),
    notes: tx.notes || null,
    payment_method: tx.paymentMethod || null,
    tags: tx.tags || null,
    created_at: tx.createdAt || new Date().toISOString(),
  };
}
