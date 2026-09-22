# DuIt - Personal Expense Tracker & Financial Analytics

DuIt is a local-first personal expense tracker and financial analytics app. Built with PWA standards and Capacitor, it runs on the web, installs as a standalone web app, and compiles into an Android APK.

---

## Key Features

- **Expense Management**: Log income and expenses with categories, payment methods, tags, and notes.
- **Category Management**: Set category icons, colors, and monthly budget limits.
- **Budget Monitoring**: Set spending targets per category and track progress in real time.
- **Visual Analytics**: Interactive breakdowns, expense distributions, and monthly spending trends powered by Recharts.
- **Recurring Expenses**: Track subscriptions and bills with due-date reminders.
- **Data Portability**: Export and import data in Excel (.xlsx) and JSON formats.
- **Offline & Cloud Sync**: Store data locally with IndexedDB and sync across Web and Android via Supabase.

---

## Tech Stack

- **Frontend Core**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS, Framer Motion
- **Local Storage**: Dexie.js (IndexedDB wrapper)
- **Cloud Backend & Auth**: Supabase (PostgreSQL, Row Level Security, Auth)
- **Mobile Runtime**: Capacitor (Android bridge)
- **Data Visualization**: Recharts, Lucide Icons
- **Data Processing**: SheetJS (xlsx), date-fns

---

## Architecture & Data Storage

DuIt uses a local-first, cloud-synced model:

1. **Offline Storage**: Transactions, categories, budgets, and recurring expenses save locally in IndexedDB (`Dexie.js`). The app works without an internet connection.
2. **Cloud Sync**: When signed in through Supabase, data syncs with a PostgreSQL database protected by Row Level Security (RLS), so users only access their own records.

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
   Copy `.env.example` to `.env` and set your Supabase credentials:
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

   Without this, confirmation email links redirect to `localhost` instead of the deployed app.

5. Start the local development server:
   ```bash
   npm run dev
   ```

6. Open the application at `http://localhost:5173`.

---

## Deployment

### Web Deployment (Vercel)

DuIt is configured for SPA deployment on Vercel:

1. Push your repository to GitHub.
2. Import the project in the [Vercel Dashboard](https://vercel.com).
3. Under **Project Settings > Environment Variables**, define `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. Deploy. The included `vercel.json` handles SPA routing rewrites.

### Automated Android APK Builds (GitHub Actions)

A GitHub Actions workflow at `.github/workflows/build-apk.yml` builds and releases Android APKs automatically:

1. Go to **Repository Settings > Secrets and variables > Actions** on GitHub.
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as repository secrets.
3. Push a version tag to trigger a release:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
4. Download the release APK from the GitHub Releases page.

### Manual Android Build (Local)

1. Build web assets and sync with Capacitor:
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

- **Row Level Security (RLS)**: Database policies restrict data access so users can only view, insert, update, and delete their own records (`auth.uid() = user_id`).
- **Encrypted Transmission**: Cloud traffic uses TLS/HTTPS encryption (`android:usesCleartextTraffic="false"`).
- **Client Security**: Secret service role keys stay out of the client app. Only public anonymous keys are exposed alongside RLS policies.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
