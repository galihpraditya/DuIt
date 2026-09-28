# DuIt - Smart Expense Tracker & Financial Analytics

[![Version](https://img.shields.io/badge/version-2.0.0-emerald.svg)](package.json)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![Capacitor](https://img.shields.io/badge/Capacitor-8-119EFF.svg)](https://capacitorjs.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E.svg)](https://supabase.com/)
[![Dexie](https://img.shields.io/badge/Dexie.js-IndexedDB-22c55e.svg)](https://dexie.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A modern, local-first personal finance tracker built with **React 19**, **TypeScript**, and **Tailwind CSS**. Works 100% offline with **Dexie.js (IndexedDB)**, synchronizes across devices with **Supabase (PostgreSQL)**, supports smart natural language & voice input via **Groq AI**, and packages into native Android via **Capacitor 8**.

---

## Quick Links

- **Live Web App**: [https://duit.galihh.me](https://duit.galihh.me)
- **Download Android APK**: [DuIt-Wallet-latest.apk](https://github.com/galihpraditya/DuIt/releases/latest/download/DuIt-Wallet-latest.apk)
- **Releases**: [GitHub Releases](https://github.com/galihpraditya/DuIt/releases)
- **Database Schema**: [`supabase_schema.sql`](supabase_schema.sql)

---

## Features

- **Local-First & Offline**: Instant zero-latency CRUD operations using IndexedDB (`Dexie.js 4`). Fully functional without internet connection.
- **Cloud Sync & RLS**: Deterministic two-way sync with Supabase PostgreSQL, secured by Row Level Security (`auth.uid() = user_id`) and composite primary keys `(id, user_id)`.
- **Smart AI & Voice Input**:
  - Natural language transaction parsing via **Groq Cloud API** (`openai/gpt-oss-120b`).
  - Voice-to-text recording in Indonesian (`id-ID`) using the Web Speech API.
  - Offline heuristic regex parser fallback when offline or without an API key.
  - Setup key in `.env` or directly inside the app Settings.
- **Deep Personalization**:
  - 3 Modes (Light, Dark, System) & 3 Surface Tones (Default, OLED True Black, Warm).
  - 7 curated color presets + custom Hex color picker with dynamic runtime CSS variables.
  - 5 typography options: Plus Jakarta Sans, Inter, Nunito, Outfit, and Lora.
- **Visual Analytics**: Interactive Recharts pie breakdowns, daily spending trends, and monthly comparisons (code-split for fast loading).
- **Budgets & Recurring Expenses**: Per-category monthly spending limits with progress indicators, over-budget alerts, and subscription tracking.
- **Smart Daily Reminder**: Scheduled Web Notification & PWA alert (only triggers if no transactions were logged that day).
- **Data Portability**: Dual-sheet Excel export/import (`.xlsx` via SheetJS) and full JSON backup/restore.
- **Privacy & Convenience**: Balance masking toggle (`••••••`), one-tap quick preset chips, and native Android back-button handling.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite 8, Tailwind CSS, Framer Motion, Lucide Icons
- **Storage**: Dexie.js (IndexedDB) & Supabase (PostgreSQL + Auth)
- **AI & Audio**: Groq Cloud API, Web Speech API (`SpeechRecognition`)
- **Mobile & PWA**: Capacitor 8 (Android, Status Bar, Keyboard), Vite PWA
- **Analytics & Tools**: Recharts, SheetJS (xlsx), date-fns, Oxlint

---

## Getting Started

### Prerequisites

- Node.js 20+ / 22 LTS
- npm 10+

### Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/galihpraditya/DuIt.git
   cd DuIt
   npm install
   ```

2. **Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   VITE_APP_URL=https://duit.galihh.me

   # Optional: Default Groq API key (can also be entered in app Settings)
   VITE_GROQ_API_KEY=your-groq-key
   ```

3. **Supabase Database**:
   Open **SQL Editor** in your Supabase Dashboard and run [`supabase_schema.sql`](supabase_schema.sql).

4. **Start Development**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173`.

---

## Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Start Vite development server with HMR and `/groq-api` proxy |
| `npm run build` | Type-check (`tsc -b`) and bundle for production |
| `npm run lint` | Run ultra-fast Oxlint across the project |
| `npm run preview` | Preview production build locally |
| `npm run cap:sync` | Build web assets and sync to Capacitor Android |
| `npm run cap:open` | Open native Android project in Android Studio |
| `npm run cap:build` | Build and sync directly to Capacitor Android |

---

## Android Build

- **Automated CI/CD**: Pushing a version tag (e.g. `git tag v2.0.0 && git push origin v2.0.0`) automatically builds and publishes release APKs to GitHub Releases.
- **Local Build**:
  ```bash
  npm run cap:build
  npm run cap:open
  ```
  Then build the APK in Android Studio (**Build > Build Bundle(s) / APK(s) > Build APK(s)**).

---

## License

This project is open-source under the [MIT License](LICENSE).
