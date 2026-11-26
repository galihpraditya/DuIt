# UI Declutter & Redundancy Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove redundant UI toggles, status badges, and type pills from the income tracking UI so information is communicated cleanly through color, sign, placement, and Settings without visual clutter.

**Architecture:** Purely a presentation-layer cleanup across 5 UI components (`App.tsx`, `CashFlowCard.tsx`, `TransactionList.tsx`, `CategoryManager.tsx`, `SettingsView.tsx`). No data model, Dexie schema, sync logic, or analytics math changes are required.

**Tech Stack:** React 19, TypeScript (`~6.0.2`), Tailwind CSS 3, Lucide icons, oxlint, Vite 8.

**Spec:** User refinement request following `docs/superpowers/specs/2026-11-26-income-tracking-design.md`

## Global Constraints
- `noUnusedLocals: true` and `noUnusedParameters: true` in `tsconfig.app.json` — remove any unused imports (`ArrowUpDown` in `App.tsx`) or unused variables (`status` / `badgeConfig` in `CashFlowCard.tsx`).
- `npm test`, `npm run lint`, and `npm run build` must all pass with 0 errors and 0 warnings.

---

### Task 1: Remove Quick Hero Toggle and Redundant Badges Across Views

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/analytics/CashFlowCard.tsx`
- Modify: `src/components/transactions/TransactionList.tsx`
- Modify: `src/components/categories/CategoryManager.tsx`
- Modify: `src/components/settings/SettingsView.tsx`

- [ ] **Step 1: Remove hero status badge & quick toggle in `src/App.tsx`**
  - Remove the `cashFlowStatus` pill badge (`Surplus` / `Boncos` / `Impas` / `Belum Ada Pemasukan`) from the Top Summary Banner header (`src/App.tsx:950-970`).
  - Remove the quick `ArrowUpDown` income toggle button from the Top Summary Banner header (`src/App.tsx:985-998`), keeping the income toggle exclusively in `SettingsView`.
  - Remove unused `ArrowUpDown` import and unused `cashFlowStatus` destructured variable (if no longer referenced) in `src/App.tsx`.

- [ ] **Step 2: Remove redundant status badge in `src/components/analytics/CashFlowCard.tsx`**
  - Remove `badgeConfig` and the status pill (`Surplus` / `Boncos` / etc.) from the `CashFlowCard` header (`src/components/analytics/CashFlowCard.tsx:22-60`), letting the emerald/rose signed numbers and expense-ratio bar communicate cash flow health directly.
  - Remove unused `status` from destructured `summary`.

- [ ] **Step 3: Remove `Pendapatan` row badge in `src/components/transactions/TransactionList.tsx`**
  - Remove the `isIncome` pill badge next to the category name (`src/components/transactions/TransactionList.tsx:496-500`), keeping the emerald `+` / `ArrowUpRight` amount formatting.

- [ ] **Step 4: Remove redundant `Pendapatan` badge on income category cards in `src/components/categories/CategoryManager.tsx`**
  - Remove the right-side `t.incomeTypeLabel` pill in the bottom row of income category cards (`src/components/categories/CategoryManager.tsx:454-458`), since the user is already inside the `Pendapatan` tab.

- [ ] **Step 5: Remove redundant `ON`/`OFF` badge next to the toggle switch in `src/components/settings/SettingsView.tsx`**
  - Remove the `ON`/`OFF` pill beside `t.incomeFeatureSection` (`src/components/settings/SettingsView.tsx:363-371`), matching the clean layout of the Daily Reminder card right below it where the switch state itself indicates ON/OFF.

- [ ] **Step 6: Verify & commit**
  - Run `npm test; if ($LASTEXITCODE -eq 0) { npm run lint }; if ($LASTEXITCODE -eq 0) { npm run build }`
  - Expected: 15/15 tests pass, 0 lint warnings/errors, build exits 0.
  - Commit: `git commit -am "refactor(ui): remove redundant badges and keep income toggle in settings"`
