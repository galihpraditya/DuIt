# DuIt - Personal Expense Tracker & Financial Analytics

DuIt is a modern, responsive, and privacy-conscious personal expense tracker and financial analytics application. Built with a local-first architecture using Progressive Web App (PWA) standards and Capacitor, DuIt runs seamlessly on the web, can be installed as a standalone desktop/mobile web app, and compiles into a native Android APK.

---

## Key Features

- **Expense Management**: Log daily income and expenses with detailed metadata (categories, payment methods, tags, and notes).
- **Dynamic Category Management**: Customize expense categories with custom icons, colors, and monthly budget limits.
- **Budgeting & Monitoring**: Set monthly spending targets per category and track real-time utilization progress.
- **Visual Analytics**: Interactive breakdowns, expense distributions, and monthly spending comparisons powered by Recharts.
- **Recurring Expenses**: Manage periodic subscriptions and utility bills with automated next-due tracking.
- **Data Portability**: Full control over your data with direct import and export capabilities for Excel (.xlsx) and JSON formats.
- **Hybrid Multi-Device Sync**: Works offline out-of-the-box using IndexedDB, with real-time cloud synchronization across Web and Android via Supabase.

---

## Tech Stack

- **Frontend Core**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS, Framer Motion
- **Local Storage**: Dexie.js (IndexedDB wrapper)
- **Cloud Backend & Authentication**: Supabase (PostgreSQL, Row Level Security, Auth)
- **Mobile Runtime**: Capacitor (Android native bridge)
- **Data Visualization**: Recharts, Lucide Icons
- **Data Processing**: SheetJS (xlsx), date-fns

---

## Architecture & Data Storage

DuIt operates on a **Local-First, Cloud-Synced** model:

1. **Offline-First Storage**: All transactions, categories, budgets, and recurring expenses are stored locally on the device using IndexedDB (`Dexie.js`). The app remains fast, responsive, and fully functional without an internet connection.
2. **Optional Cloud Synchronization**: When authenticated through Supabase, data is synchronized securely with a remote PostgreSQL database protected by **Row Level Security (RLS)**, ensuring data isolation per authenticated user.

---

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm 9 or higher
- Android Studio (optional, for local Android APK compilation)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/DuIt.git
   cd DuIt
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables (optional for cloud sync):
   Copy `.env.example` to `.env` and provide your Supabase credentials:
   ```bash
   cp .env.example .env
   ```
   Edit `.env`:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   VITE_APP_URL=https://duit-wallet.vercel.app
   ```

4. **Configure Supabase Auth URLs (required for email verification)**:
   In the Supabase Dashboard, open **Authentication > URL Configuration** and set:
   - **Site URL**: `https://duit-wallet.vercel.app`
   - **Redirect URLs**: `https://duit-wallet.vercel.app/**` plus `http://localhost:5173/**` (for local development)

   Without this, confirmation email links will redirect to `localhost` instead of the deployed app.

5. Start the local development server:
   ```bash
   npm run dev
   ```

5. Access the application in your browser at `http://localhost:5173`.

---

## Deployment

### Web Deployment (Vercel)

DuIt is preconfigured for single-page application (SPA) deployment on Vercel:

1. Push your repository to GitHub.
2. Import the project in the [Vercel Dashboard](https://vercel.com).
3. Under **Project Settings > Environment Variables**, define `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. Deploy. The included `vercel.json` configuration handles SPA routing rewrites automatically.

### Automated Android APK Builds (GitHub Actions)

A GitHub Actions workflow is included at `.github/workflows/build-apk.yml` to compile and release Android APKs automatically:

1. Navigate to **Repository Settings > Secrets and variables > Actions** on GitHub.
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as repository secrets.
3. Push a version tag to trigger an automated release:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
4. The compiled release APK will be attached directly to the GitHub Releases page.

### Manual Android Build (Local)

1. Build the web assets and sync with Capacitor:
   ```bash
   npm run cap:build
   ```

2. Open the Android project in Android Studio:
   ```bash
   npm run cap:open
   ```

3. In Android Studio, select **Build > Build Bundle(s) / APK(s) > Build APK(s)**.

---

## Security

- **Row Level Security (RLS)**: Database policies enforce that users can only view, insert, update, and delete their own records (`auth.uid() = user_id`).
- **Encrypted Transmission**: All cloud communications use TLS/HTTPS encryption (`android:usesCleartextTraffic="false"`).
- **Client Security**: Secret service role keys are excluded from the client application. Only public anonymous keys are used in conjunction with RLS policies.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
