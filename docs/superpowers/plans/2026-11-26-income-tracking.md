# Income Tracking & Cash Flow (Surplus vs Boncos) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an optional, toggleable Income Tracking feature to DuIt so users can record income alongside expenses and see whether their income covers their spending (Surplus) or falls short (Boncos), while keeping expense-only mode clean and unaffected when turned OFF.

**Architecture:** Extend `Category` and `Transaction` with an optional `type?: 'expense' | 'income'` field (defaulting `undefined` to `'expense'` via pure helpers for 100% backward compatibility), indexed in Dexie `version(3)` and mirrored in `supabase_schema.sql` / `syncService.ts`. Gate all income UI, filtering, AI parsing, cashflow analytics, and Excel export/import behind `incomeEnabled` (`localStorage` key `duit_income_tracking_enabled`, default `false`) while keeping stored income data intact when toggled OFF and keeping Budgets/Safe-to-Spend strictly expense-based.

**Tech Stack:** React 19, TypeScript (`~6.0.2`, `erasableSyntaxOnly`, `verbatimModuleSyntax`), Tailwind CSS 3, Dexie 4, Recharts 3, date-fns 4, xlsx, Node 24 + `jiti` (unit tests), oxlint, Vite 8.

**Spec:** `docs/superpowers/specs/2026-11-26-income-tracking-design.md`

## Global Constraints
- `erasableSyntaxOnly: true` and `verbatimModuleSyntax: true` in `tsconfig.app.json` — use `import type` for types and no parameter properties or enums.
- `noUnusedLocals: true` and `noUnusedParameters: true` — zero unused imports or params; `npm run lint` (`oxlint`) and `npm run build` (`tsc -b && vite build`) must exit 0.
- Zero new runtime or dev npm dependencies.
- Backward compatibility: `type === undefined` on any `Transaction` or `Category` MUST resolve to `'expense'`.
- Respect `hideNominals` (privacy masking) on every monetary value in UI components.
- Bilingual UI (`id` / `en`) via `src/constants/translations.ts` and theme compatibility (light, dark, OLED, warm sepia, custom `--brand-primary`).

## Review Focus
- Toggling `incomeEnabled` OFF after recording income hides income transactions/categories from every summary, list, chart, and Excel export without deleting them from Dexie, and toggling ON restores them intact.
- Deleting an income category re-routes its transactions to `cat-inc-others` (never to expense `cat-others`), and `CategoryDetailModal` batch move never offers cross-type destination categories.
- `BudgetManager` and `SafeToSpendCard` never include income transactions in `totalSpentThisMonth` or list income categories as budgetable.
- `calculateCashFlowSummary` distinguishes `income === 0 && expense > 0` (`no_income`) from `income > 0 && expense > income` (`boncos`) so new users aren't falsely flagged `boncos` before logging their first paycheck.
- `ExcelModal` import containing `Pendapatan` rows while `incomeEnabled === false` preserves `type: 'income'` and auto-enables `incomeEnabled = true` with user notification.

---

### Task 1: Core Types, Transaction Helpers, & Test Runner Setup

**Files:**
- Create: `scripts/run-tests.mjs`
- Create: `src/utils/transactionHelpers.ts`
- Create: `src/utils/transactionHelpers.test.ts`
- Modify: `package.json`
- Modify: `src/types/index.ts`

**Interfaces:**
- Produces in `src/types/index.ts`: `export type TransactionType = 'expense' | 'income'`; `Category.type?: TransactionType`; `Transaction.type?: TransactionType`.
- Produces in `src/utils/transactionHelpers.ts`:
  - `INCOME_TRACKING_STORAGE_KEY = 'duit_income_tracking_enabled'`
  - `getTransactionType(tx: Pick<Transaction, 'type'>): TransactionType`
  - `getCategoryType(cat: Pick<Category, 'type'>): TransactionType`
  - `filterTransactionsByType(transactions: Transaction[], type: TransactionType): Transaction[]`
  - `filterCategoriesByType(categories: Category[], type: TransactionType): Category[]`
  - `isIncomeTrackingEnabled(): boolean`
  - `setIncomeTrackingEnabled(enabled: boolean): void`
  - `CashFlowStatus = 'surplus' | 'boncos' | 'even' | 'no_income'`
  - `CashFlowSummary = { totalIncome: number; totalExpense: number; netCashFlow: number; status: CashFlowStatus; expenseRatioPct: number; savingRatePct: number }`
  - `calculateCashFlowSummary(transactions: Transaction[]): CashFlowSummary`

- [ ] **Step 1: Add `"test": "node scripts/run-tests.mjs"` to `package.json` and create `scripts/run-tests.mjs` using `jiti` + `node:assert` discovery for `src/**/*.test.ts`.**
- [ ] **Step 2: Write failing tests in `src/utils/transactionHelpers.test.ts`** covering:
  - `getTransactionType` / `getCategoryType` defaulting `undefined` to `'expense'` and returning `'income'` when `'income'`
  - `filterTransactionsByType` and `filterCategoriesByType`
  - `calculateCashFlowSummary`: `surplus` (`income: 5_000_000, expense: 3_000_000` -> `net: 2_000_000, expenseRatioPct: 60, savingRatePct: 40`), `boncos` (`income: 3_000_000, expense: 3_500_000` -> `net: -500_000, status: 'boncos', expenseRatioPct: 117, savingRatePct: 0`), `even` (`income: 1_000_000, expense: 1_000_000` -> `net: 0, status: 'even'`), `no_income` (`income: 0, expense: 200_000` -> `status: 'no_income'`, `expenseRatioPct: 0`), and empty list (`income: 0, expense: 0` -> `status: 'even'`).
- [ ] **Step 3: Run `npm test` to verify it fails because `transactionHelpers.ts` does not exist.**
- [ ] **Step 4: Update `src/types/index.ts` and implement `src/utils/transactionHelpers.ts`.**
- [ ] **Step 5: Run `npm test` and `npm run lint` to verify all tests pass.**
- [ ] **Step 6: Commit Task 1.**

---

### Task 2: Database v3, Default Income Categories, Sync, & Supabase Schema

**Files:**
- Modify: `src/db/database.ts`
- Modify: `src/services/syncService.ts`
- Modify: `supabase_schema.sql`
- Create: `src/services/syncServiceHelpers.test.ts` (testing payload mapping & same-type reconciliation logic extracted as pure helpers in `syncService.ts`)

**Interfaces:**
- Consumes: `TransactionType`, `getTransactionType`, `getCategoryType`.
- Produces in `src/db/database.ts`: `DEFAULT_INCOME_CATEGORIES: Category[]`, Dexie `version(3)`, updated `initializeDefaultData()`.
- Produces in `src/services/syncService.ts`: `mapCloudCategoryToLocal(cc, localExisting)`, `mapCloudTransactionToLocal(ctx, effectiveCatId)`, `findSameTypeCategoryMatch(localCat, cloudCats)`.

- [ ] **Step 1: Write failing tests in `src/services/syncServiceHelpers.test.ts`** verifying:
  - Cloud category/transaction rows without `type` map to `'expense'`, and `'income'` maps to `'income'`.
  - `findSameTypeCategoryMatch` matches `"Lain-lain"` (`expense`) with `"Lain-lain"` (`expense`), and does NOT merge `"Lain-lain"` (`expense`) with `"Lain-lain"` (`income`).
- [ ] **Step 2: Run `npm test` to verify failure.**
- [ ] **Step 3: Update `src/db/database.ts` with `version(3)`, `DEFAULT_INCOME_CATEGORIES`, and `initializeDefaultData()` (seeding missing default income categories unless present in `getDeletedCategoryIds()`).**
- [ ] **Step 4: Update `src/services/syncService.ts` (map & push `type`, ensure `cat-inc-others` anchor if needed, restore both `DEFAULT_CATEGORIES` and `DEFAULT_INCOME_CATEGORIES` in `resetLocalDataToDefaults()`, export pure mapping/reconciliation helpers) and `supabase_schema.sql` (`type TEXT DEFAULT 'expense'` on `categories` and `transactions`).**
- [ ] **Step 5: Run `npm test` and `npm run lint` to verify pass.**
- [ ] **Step 6: Commit Task 2.**

---

### Task 3: Bilingual Translations & Settings Toggle

**Files:**
- Modify: `src/constants/translations.ts`
- Modify: `src/components/settings/SettingsView.tsx`

**Interfaces:**
- Consumes: `Language`, `Translations`.
- Produces: new translation keys on `Translations` (`id` & `en`); `incomeEnabled: boolean` and `onToggleIncomeEnabled: (next: boolean) => void` props on `SettingsViewProps`.

- [ ] **Step 1: Add all required `id` and `en` keys to `src/constants/translations.ts`** covering: income tracking toggle title/desc, transaction type labels (`expenseTypeLabel`, `incomeTypeLabel`, `allTypes`), cashflow banner labels (`cashFlowThisMonth`, `cashFlowAllTime`, `totalIncomeLabel`, `totalExpenseLabel`, `netCashFlowLabel`, `statusSurplus`, `statusBoncos`, `statusEven`, `statusNoIncome`, `incomeCoveredPct`), modal labels (`incomeAmountLabel`, `saveIncomeBtn`, `updateIncomeBtn`, `incomeNotesPlaceholder`), category tabs (`expenseCategoriesTab`, `incomeCategoriesTab`, `totalIncomeEarned`), analytics cashflow (`analyticsModeCashFlow`, `analyticsModeExpense`, `analyticsModeIncome`, `savingRateLabel`, `expenseRatioLabel`, `cashFlowHealthTitle`), and Excel type column (`importColType`, `incomeAutoEnabledToast`).
- [ ] **Step 2: Add the Income Tracking toggle card in `src/components/settings/SettingsView.tsx`** matching the Daily Reminder switch UI and respecting `incomeEnabled` & `onToggleIncomeEnabled`.
- [ ] **Step 3: Run `npm run lint` and `npm run build` (note: App.tsx props update in Task 5, or give optional default `incomeEnabled = false` / `onToggleIncomeEnabled` in `SettingsViewProps` so build stays green after each task!).**
  - *Crucial:* Make `incomeEnabled?: boolean` and `onToggleIncomeEnabled?: (enabled: boolean) => void` optional on `SettingsViewProps` (and similarly on incremental component props) until wired in `App.tsx`, so `tsc -b` stays 100% green at every commit!
- [ ] **Step 4: Commit Task 3.**

---

### Task 4: Smart AI Parser, Transaction Modal, & Quick Presets

**Files:**
- Modify: `src/services/aiService.ts`
- Create: `src/services/aiService.test.ts`
- Modify: `src/components/transactions/SmartAiInput.tsx`
- Modify: `src/components/transactions/TransactionModal.tsx`
- Modify: `src/components/transactions/QuickPresets.tsx`

**Interfaces:**
- Produces in `src/services/aiService.ts`:
  - `ParsedTransactionResult.type?: TransactionType`
  - `CategoryRef.type?: TransactionType`
  - `parseNaturalTransactions(text: string, categories: CategoryRef[], options?: { allowIncome?: boolean }): Promise<ParsedTransactionResult[]>`
  - `detectTransactionType(text: string, allowIncome?: boolean): TransactionType` (exported for direct unit testing)

- [ ] **Step 1: Write failing tests in `src/services/aiService.test.ts`** covering:
  - `detectTransactionType("gaji bulan november 8jt", true)` -> `'income'`
  - `detectTransactionType("dapat bonus freelance 1.5jt", true)` -> `'income'`
  - `detectTransactionType("bakso 15rb tunai", true)` -> `'expense'`
  - `detectTransactionType("gaji 8jt", false)` -> `'expense'` (when income tracking disabled)
  - `fallbackLocalParser` / `parseNaturalTransactions` (without API key) routes `"gaji 8jt transfer bca"` to an `'income'` category when `allowIncome: true`, and never picks an `'income'` category when `allowIncome: false`.
- [ ] **Step 2: Run `npm test` to verify failure.**
- [ ] **Step 3: Implement `type` detection & category-type scoping in `src/services/aiService.ts` (both Groq prompt & `fallbackLocalParser`).**
- [ ] **Step 4: Update `SmartAiInput.tsx`, `TransactionModal.tsx` (type segmented toggle `Pengeluaran | Pendapatan`, category filtering by type, emerald vs rose accents, batch review type switcher), and `QuickPresets.tsx` (preserve `tx.type` on `QuickPresetItem`, filter to expense when `!incomeEnabled`).**
- [ ] **Step 5: Run `npm test`, `npm run lint`, and `npm run build`.**
- [ ] **Step 6: Commit Task 4.**

---

### Task 5: Dashboard Cashflow Banner, Transaction List, Category Manager, & Budget Manager

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/transactions/TransactionList.tsx`
- Modify: `src/components/categories/CategoryManager.tsx`
- Modify: `src/components/categories/CategoryDetailModal.tsx`
- Modify: `src/components/budget/BudgetManager.tsx`

**Interfaces:**
- Consumes: `isIncomeTrackingEnabled`, `setIncomeTrackingEnabled`, `calculateCashFlowSummary`, `filterTransactionsByType`, `filterCategoriesByType`, `getTransactionType`, `getCategoryType`.

- [ ] **Step 1: Update `TransactionList.tsx`** to accept `incomeEnabled?: boolean`, add `Tipe` filter (`ALL | expense | income`) when `incomeEnabled`, display emerald `+` / `ArrowUpRight` for income rows, rose `−` / `ArrowDownRight` for expense rows, and dual `+Masuk • −Keluar` date group subtotals when income exists.
- [ ] **Step 2: Update `CategoryManager.tsx` & `CategoryDetailModal.tsx`** to accept `incomeEnabled?: boolean`:
  - `CategoryManager` shows `Pengeluaran | Pendapatan` tabs when `incomeEnabled`, hides budget limit fields/badges for income categories, shows `"Total pemasukan"` in emerald, and passes `defaultType` when creating a new category.
  - `CategoryDetailModal` filters batch-move target categories to same `type` as the current category and styles income totals in emerald.
- [ ] **Step 3: Update `BudgetManager.tsx`** to filter categories & transactions strictly to `'expense'`, plus optionally display a compact contextual pill showing this month's income when `incomeEnabled && monthlyIncome > 0`.
- [ ] **Step 4: Wire everything in `src/App.tsx`:**
  - `incomeEnabled` state initialized via `isIncomeTrackingEnabled()` and persisted via `setIncomeTrackingEnabled()`.
  - Filter `visibleTransactions` & `visibleCategories` cleanly when `!incomeEnabled`.
  - Update Top Summary Banner: compact Income Mode toggle button next to Eye button; when `incomeEnabled` show Cash Flow hero (Net Cash Flow, Surplus/Boncos/Impas/Belum Ada Pemasukan badge, `% terpakai` progress bar, Income & Expense breakdown + Daily Avg & Today/Highest).
  - Fix `handleDeleteCategory` so deleting an income category falls back to `cat-inc-others` (creating it if missing) instead of `cat-others`.
  - Pass `incomeEnabled` and `onToggleIncomeEnabled` to `SettingsView`, `TransactionModal`, `TransactionList`, `CategoryManager`, `BudgetManager`, `AnalyticsView`, and `ExcelModal`.
- [ ] **Step 5: Run `npm test`, `npm run lint`, and `npm run build` to verify.**
- [ ] **Step 6: Commit Task 5.**

---

### Task 6: Cash Flow Analytics & Excel/Backup Integration

**Files:**
- Modify: `src/components/analytics/analyticsCalculator.ts`
- Create: `src/components/analytics/analyticsCalculator.test.ts`
- Create: `src/components/analytics/CashFlowCard.tsx`
- Modify: `src/components/analytics/TrendChart.tsx`
- Modify: `src/components/analytics/KpiCards.tsx`
- Modify: `src/components/analytics/AnalyticsView.tsx`
- Modify: `src/services/excelService.ts`
- Create: `src/services/excelService.test.ts`
- Modify: `src/components/excel/ExcelModal.tsx`
- Modify: `src/services/backupService.ts`

**Interfaces:**
- Produces in `src/components/analytics/analyticsCalculator.ts`:
  - `CashFlowTrendEntry = { label: string; income: number; expense: number; net: number }`
  - `calculateCashFlowTrend(transactions: Transaction[], currentInterval, selectedPeriod, locale): CashFlowTrendEntry[]`
  - `calculateAnalytics(...)` accepts optional `transactionType?: TransactionType` (defaults to `'expense'` so existing behavior is preserved and never mixes income into expense charts!)
- Produces in `src/services/excelService.ts`:
  - `ParsedImportRow.type: TransactionType`
  - `parseImportType(rawValue: unknown): TransactionType` (exported for TDD)
  - `exportTransactionsToExcel({ transactions, categories, includeType })`

- [ ] **Step 1: Write failing tests in `src/components/analytics/analyticsCalculator.test.ts` and `src/services/excelService.test.ts`** covering:
  - `calculateAnalytics` with `transactionType: 'expense'` ignores `'income'` rows; with `'income'` ignores `'expense'` rows.
  - `calculateCashFlowTrend` builds matching daily/monthly buckets with `income`, `expense`, and `net`.
  - `parseImportType` maps `'Pendapatan'`, `'pemasukan'`, `'Income'`, `'Masuk'` -> `'income'`, and empty/unknown/`'Pengeluaran'` -> `'expense'`.
- [ ] **Step 2: Run `npm test` to verify failures.**
- [ ] **Step 3: Implement `analyticsCalculator.ts` additions, `CashFlowCard.tsx`, dual-series `TrendChart.tsx`, `KpiCards.tsx` mode support, and `AnalyticsView.tsx` (`Arus Kas | Pengeluaran | Pendapatan` switcher when `incomeEnabled`).**
- [ ] **Step 4: Implement `excelService.ts` (`parseImportType`, `Tipe` column in export & import, separated summaries), `ExcelModal.tsx` (filter export by `expense` when `!incomeEnabled`; show `Tipe` column in preview when relevant; auto-enable `incomeEnabled` on importing income rows), and `backupService.ts` (include `type` in cloud restore payloads).**
- [ ] **Step 5: Run `npm test`, `npm run lint`, and `npm run build` to verify all pass.**
- [ ] **Step 6: Commit Task 6.**

---

### Task 7: Final Verification, Whole-Branch Code Review, & Cleanup

- [ ] **Step 1: Run full verification suite (`npm test`, `npm run lint`, `npm run build`).**
- [ ] **Step 2: Dispatch a fresh `research` / `self` code reviewer subagent using `superpowers:requesting-code-review/code-reviewer.md` against `git diff master..HEAD`, checking all Review Focus items and spec requirements.**
- [ ] **Step 3: Fix any Critical/Important findings via TDD, re-verify full suite (`npm test`, `npm run lint`, `npm run build`).**
