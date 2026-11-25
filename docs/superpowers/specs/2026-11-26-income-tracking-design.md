# Design Spec: Optional Income Tracking & Cash Flow Status (Surplus vs Boncos)

**Date:** 2026-11-26
**Branch:** `feat/income-tracking`
**Project:** DuIt (`v2.0.2`)

## 1. Intent & Why
DuIt currently tracks expenses only. Users who want to know whether their income actually covers their spending—or whether they are overspending ("boncos" / deficit)—need a way to record income alongside expenses and immediately see their net cash flow. At the same time, users who only want a fast, focused expense tracker must be able to keep income tracking turned off with zero extra UI noise.

## 2. Goals, Non-Goals, and Anti-Goals
### Goals
- Add an optional **Income Tracking (Arus Kas / Cash Flow)** feature controlled by a persistent **on/off toggle** (`duit_income_tracking_enabled` in `localStorage`, defaulting to `false` so existing expense-only users stay unaffected).
- Turning the toggle **OFF** hides all income UI, income transactions, and income categories from views and calculations **without deleting stored income records**; turning it back **ON** restores visibility immediately.
- When **ON**, users can record both **Expenses** (`expense`) and **Income** (`income`), using dedicated income categories, manual input, Smart AI/regex input, and Excel import/export.
- Surface clear **Surplus vs Boncos (Deficit)** feedback on both the main Transactions summary banner and the Analytics view, including total income, total expense, net cash flow, expense-to-income ratio, and side-by-side trend comparison.
- Keep **Budget & Safe-to-Spend separate** from income calculations (Budgets remain manual expense limits per category; income is used solely for Cash Flow / Surplus vs Boncos comparison).
- Maintain 100% backward compatibility with existing Dexie IndexedDB records, Supabase cloud sync (even if cloud tables haven't been migrated yet), theme variants (light/dark/OLED/Sepia + accent colors), and bilingual UI (`id` / `en`).

### Non-Goals
- Multi-wallet / bank account balance reconciliation or transfers between accounts.
- Recurring income/expense auto-posting UI (separate future feature).
- Tax calculation, split bills, or investment portfolio tracking.

### Anti-Goals
- Never delete or corrupt income records when the user toggles income tracking OFF.
- Never mix income amounts into expense totals, category spending limits, or Safe-to-Spend burn rate.
- Never break Supabase cloud sync if a user's Supabase schema does not yet have the `type` column.
- Never pollute expense-only mode with extra tabs, modal toggles, or empty income prompts when the feature is OFF.

## 3. Constraints
- **Stack:** React 19, TypeScript (`~6.0.2`, `erasableSyntaxOnly: true`, `verbatimModuleSyntax: true`), Vite 8, Tailwind CSS 3, Dexie 4, Recharts 3, Capacitor 8, oxlint.
- **Offline-First & Backward Compatible Data:** Existing `Transaction` and `Category` rows have no `type` property; any record with `type === undefined` MUST be treated as `'expense'` via shared helpers (`getTransactionType`, `getCategoryType`).
- **Supabase Self-Healing:** `supabase_schema.sql` will add `type TEXT DEFAULT 'expense'` to `categories` and `transactions`, while `syncService.ts` already uses `safeUpsert` column-stripping fallback if cloud DB lacks the column.
- **Zero New Runtime Dependencies:** Use existing libraries (`lucide-react`, `recharts`, `date-fns`, `dexie`, `xlsx`, Node 24 built-in test runner / `jiti` for unit tests).
- **UI & Theme Fidelity:** Must use DuIt's `.glass-card`, `.glass-panel`, `.transaction-modal-*` classes, responsive mobile-first layouts, and respect `hideNominals` (privacy blur/masking).

## 4. Approaches Considered
1. **Separate `incomes` & `incomeCategories` tables:**
   - *Trade-off:* Clean separation, but duplicates CRUD handlers, Supabase sync pipelines, realtime subscriptions, Excel export/import, category manager, and modal routing.
2. **Unified `transactions` & `categories` with optional `type?: 'expense' | 'income'` (Chosen):**
   - *Trade-off:* Reuses Dexie indexing, `syncService` realtime & conflict resolution, `CategoryManager`, `CategoryDetailModal`, `TransactionModal`, `SmartAiInput`, and `backupService` with minimal surface area and 100% backward compatibility (missing `type` defaults to `'expense'`). Only requires type-aware filtering at view/service boundaries and a Dexie v3 schema upgrade adding the `type` index.

## 5. Detailed Behavior & Architecture

### 5.1 Data Model & Storage
- `src/types/index.ts`:
  - `export type TransactionType = 'expense' | 'income';`
  - Add `type?: TransactionType` to `Category` and `Transaction`.
  - Add pure helpers in `src/utils/transactionType.ts` (or `src/types/index.ts`? Keep `types` pure types, put helpers in `src/utils/transactionHelpers.ts`):
    - `getTransactionType(tx: Pick<Transaction, 'type'>): TransactionType` (`tx.type === 'income' ? 'income' : 'expense'`)
    - `getCategoryType(cat: Pick<Category, 'type'>): TransactionType` (`cat.type === 'income' ? 'income' : 'expense'`)
    - `isIncomeTrackingEnabled(): boolean` / `setIncomeTrackingEnabled(enabled: boolean): void` (`localStorage` key `'duit_income_tracking_enabled'`, default `false`).
    - `calculateCashFlowSummary(transactions, periodInterval?)` returning `{ totalIncome, totalExpense, netCashFlow, status: 'surplus' | 'boncos' | 'no_income' | 'even', expenseRatioPct, savingRatePct }`.
- `src/db/database.ts`:
  - Add Dexie `version(3)` adding `type` index to `categories` and `transactions` (`categories: 'id, name, type, createdAt'`, `transactions: 'id, date, categoryId, type, amount, createdAt, [categoryId+date]'`).
  - Export `DEFAULT_INCOME_CATEGORIES: Category[]`:
    - `cat-inc-salary`: `Gaji` (`Briefcase`, `#10b981`)
    - `cat-inc-bonus`: `Bonus & THR` (`Gift`, `#14b8a6`)
    - `cat-inc-freelance`: `Freelance & Usaha` (`Laptop`, `#0ea5e9`)
    - `cat-inc-invest`: `Investasi & Dividen` (`PiggyBank`, `#8b5cf6`)
    - `cat-inc-others`: `Pemasukan Lain` (`CircleEllipsis`, `#64748b`)
  - In `initializeDefaultData()`: seed any missing `DEFAULT_INCOME_CATEGORIES` unless marked deleted in `getDeletedCategoryIds()` (preventing resurrection on users who deleted one, while automatically provisioning default income categories for existing users upgrading to v2.1!).
- `supabase_schema.sql` & `src/services/syncService.ts`:
  - Update `supabase_schema.sql` with `ALTER TABLE ... ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'expense'` for both `categories` and `transactions`, plus in `CREATE TABLE`.
  - In `syncService.ts`: read/write `type` (`'expense' | 'income'`) on `categories` and `transactions` during `syncCategories`, `syncTransactions`, `pushCategory`, `pushTransaction`. Ensure `resetLocalDataToDefaults()` restores both `DEFAULT_CATEGORIES` and `DEFAULT_INCOME_CATEGORIES`. Ensure category name reconciliation only merges categories of the **same `type`**.

### 5.2 Toggle & Visibility Rules
- **SettingsView (`src/components/settings/SettingsView.tsx`):**
  - Add a dedicated toggle card (matching the existing Daily Reminder switch style) for **Pelacakan Pendapatan (Arus Kas) / Income Tracking (Cash Flow)** with clear helper text explaining that disabling only hides income data without deleting it.
- **Top Summary Banner (`src/App.tsx`):**
  - Next to the Eye (`hideNominals`) button in the banner header, add a compact icon/pill button to toggle Income Mode directly (with clear tooltip & aria-label), keeping the banner clean when OFF and instant to switch ON/OFF.
- **When `incomeEnabled === false`:**
  - `App.tsx` filters active transactions to `expense` only and active categories to `expense` only before passing to `TransactionList`, `QuickPresets`, `AnalyticsView`, `CategoryManager`, `BudgetManager`, `TransactionModal`, and `ExcelModal`.
  - All KPIs, labels, charts, and lists look and behave identically to the existing expense-only experience.

### 5.3 UI Changes When `incomeEnabled === true`
- **Top Summary Banner (`App.tsx`):**
  - Header shows label (`Arus Kas Bulan Ini` / `Arus Kas Keseluruhan`), privacy Eye toggle, Income Mode quick toggle, and a **Cash Flow Status Badge**:
    - `income > 0 && net > 0` -> Emerald pill: `Surplus`
    - `income > 0 && net === 0` -> Slate/Blue pill: `Impas` / `Break-even`
    - `income > 0 && net < 0` -> Rose pill: `Boncos` / `Deficit`
    - `income === 0 && expense > 0` -> Amber pill: `Belum Ada Pemasukan`
  - Hero big number shows **Net Cash Flow (Sisa / Selisih Bersih)** (`+Rp ...` or `-Rp ...` colored emerald/slate vs rose) with subtitle/ratio bar showing `% terpakai dari pendapatan` when `income > 0`.
  - Right-side metrics grid shows 4 compact metrics:
    1. **Pendapatan** (emerald `ArrowUpRight`)
    2. **Pengeluaran** (rose `ArrowDownRight`)
    3. **Rata-rata Keluar/Hari** (amber)
    4. **Hari Ini / Keluar Terbesar** (slate)
- **TransactionModal (`src/components/transactions/TransactionModal.tsx`):**
  - Shows a top segmented switcher `Pengeluaran` | `Pendapatan` (when `incomeEnabled` is true, or when editing an existing income transaction).
  - Filters displayed categories by the selected `type`. Switching type preserves amount/notes/date/paymentMethod and auto-selects the first category of the new type if needed.
  - Updates `Rp` accent, field label (`Nominal Pengeluaran` / `Nominal Pendapatan`), and submit button label (`Simpan Pengeluaran` / `Simpan Pendapatan`).
  - Batch AI review cards each get a clickable `Keluar` / `Masuk` pill and filter their category `<select>` by item type.
- **SmartAiInput & `aiService.ts`:**
  - Accepts `allowIncome?: boolean` and categories with `type?: TransactionType`.
  - When `allowIncome` is true, Groq prompt and `fallbackLocalParser` extract `type: 'expense' | 'income'` and resolve category within matching-type categories (using Indonesian & English income keywords: `gaji`, `gajian`, `bonus`, `thr`, `freelance`, `komisi`, `honor`, `dividen`, `pemasukan`, `pendapatan`, `dapat`, `terima`, `salary`, `income`, etc.).
- **TransactionList (`src/components/transactions/TransactionList.tsx`):**
  - When `incomeEnabled` is true, adds a `Tipe` filter (`Semua Tipe`, `Pengeluaran`, `Pendapatan`) and filters category dropdown dynamically by selected type (or groups/tags them).
  - Income rows render with emerald `ArrowUpRight` and `+ Rp ...`, expense rows render with rose `ArrowDownRight` and `− Rp ...`.
  - Date group header subtotal shows `+Rp X` (emerald) and `−Rp Y` (rose) when both or income exist; keeps `− Rp Y` when only expenses exist.
- **CategoryManager & CategoryDetailModal:**
  - When `incomeEnabled` is true, `CategoryManager` shows a segmented tab `Pengeluaran` | `Pendapatan`.
  - Income categories do not expose monthly budget limit input/badges and display `"Total pemasukan"` in emerald.
  - Deleting an income category re-routes its transactions to `cat-inc-others` (creating it if missing).
  - `CategoryDetailModal` filters destination categories for batch move to the same `type` and displays income totals in emerald.
- **BudgetManager (`src/components/budget/BudgetManager.tsx`):**
  - Strictly operates on `expense` categories and `expense` transactions (`getCategoryType(c) === 'expense'`, `getTransactionType(tx) === 'expense'`).
  - When `incomeEnabled` is true and current month income > 0, displays a subtle contextual badge in the summary header comparing total monthly budget target vs monthly income.
- **AnalyticsView (`src/components/analytics/AnalyticsView.tsx`):**
  - When `incomeEnabled` is true:
    - Shows a **Cash Flow Health Card (Surplus vs Boncos)** summarizing `Pendapatan`, `Pengeluaran`, `Arus Kas Bersih`, `Rasio Keluar/Masuk`, and `Rasio Tabungan` with a color-coded progress bar (`<80%` emerald, `80-100%` amber, `>100%` rose).
    - Adds an Analytics Mode switcher in the header: `Arus Kas` | `Pengeluaran` | `Pendapatan`.
    - `Arus Kas` mode renders dual-series `TrendChart` (Income emerald vs Expense rose side-by-side bars or dual areas), KPI cards for Income, Expense, Net Cash Flow, and Transaction Count, plus Expense Category Pie & Ranking below.
    - `Pengeluaran` and `Pendapatan` modes render focused KPIs, single-series trend, pie chart, and ranking for that respective type.
    - `SafeToSpendCard` always evaluates expense transactions against expense budgets (`terpisah` from income).
- **Excel & Backup (`src/services/excelService.ts`, `ExcelModal.tsx`, `backupService.ts`):**
  - **Export:** Respects the active `incomeEnabled` toggle. When `incomeEnabled === false`, `ExcelModal` exports `expense` transactions only (matching the summary shown in the modal) with the existing layout. When `incomeEnabled === true`, exports all transactions with a `Tipe` (`Pengeluaran` / `Pendapatan`) column and separates Income vs Expense totals in the Summary sheet so totals are never conflated.
  - **Import:** Parses optional `Tipe`/`Type`/`Jenis` column (`pendapatan`/`pemasukan`/`income`/`masuk` -> `'income'`, else `'expense'`) and creates/matches categories with that `type`. Shows a `Tipe` badge in the import preview table whenever `incomeEnabled === true` or any parsed row is `'income'`. If `incomeEnabled === false` and the user imports rows containing `'income'`, the app automatically enables `incomeEnabled = true` upon import confirmation (and notifies the user via toast) so the imported income records are immediately visible rather than silently hidden.
  - **Backup & Restore (JSON):** Always exports and restores the entire IndexedDB database (including hidden income transactions/categories regardless of toggle state) and syncs `type` to Supabase.

## 6. Open Questions / Left to Builder
All product decisions are resolved per user authorization ("gunakan rekomendasimu dalam pengambilan keputusan"). Implementation details such as exact Tailwind class names, internal helper decomposition, and unit test file structure are left to the plan and builder.
