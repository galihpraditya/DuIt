# DuIt - Smart Expense Tracker 💸

DuIt adalah aplikasi pencatat pengeluaran (*expense tracker*) yang modern, ringan, dan **Offline-First**. Dibangun dengan arsitektur PWA (Progressive Web App) dan Capacitor, aplikasi ini bisa berjalan di Web, di-install di Desktop/Mobile Browser, maupun di-*build* menjadi aplikasi native Android.

## Fitur Utama ✨
- **Pencatatan Pengeluaran**: Catat pengeluaran harian dengan antarmuka yang bersih dan intuitif.
- **Kategori Dinamis**: Tambah, ubah, dan hapus kategori pengeluaran sesuai dengan gaya hidup Anda.
- **Budgeting**: Atur batas anggaran bulanan per kategori dan pantau progresnya.
- **Analitik Visual**: Pantau tren pengeluaran bulanan dan mingguan dengan grafik yang interaktif.
- **Langganan & Tagihan Berulang**: Kelola langganan bulanan agar tidak ada tagihan yang terlewat.
- **Impor & Ekspor Data (Excel/JSON)**: Kendali penuh atas data Anda; ekspor ke `.xlsx` atau `.json` untuk di-backup.

## Konfigurasi Database & Deployment 🗄️

**DuIt menggunakan pendekatan Offline-First.** Tidak ada *backend* server atau *database* eksternal (seperti MySQL, PostgreSQL, Firebase, dll) yang perlu Anda *deploy*.

Semua data pengeluaran dan pengaturan pengguna disimpan secara lokal di dalam memori perangkat pengguna melalui **IndexedDB** (menggunakan library `Dexie.js`).

**Keuntungan pendekatan ini:**
1. **Privasi Maksimal**: Data finansial pengguna 100% tersimpan di perangkat mereka sendiri, tidak ada data yang dikirim ke server pihak ketiga.
2. **Cepat & Hemat Kuota**: Tidak ada *loading* untuk mengambil data dari internet.
3. **Deployment Bebas Ribet**: Untuk mempublikasikan aplikasi ini, Anda hanya perlu men-*deploy* file *frontend* statisnya saja (folder `dist/`). Anda **TIDAK PERLU** men-setup atau membayar hosting untuk *database*.

## Cara Menjalankan di Lokal (Development) 💻

Pastikan Anda telah menginstal Node.js versi 18+.

1. Install dependensi:
   ```bash
   npm install
   ```
2. Jalankan development server:
   ```bash
   npm run dev
   ```
3. Buka browser di `http://localhost:5173/`.

## Cara Deployment Frontend 🚀

Karena ini adalah aplikasi klien murni (*static site*), Anda dapat men-deploy-nya ke layanan hosting statis manapun secara gratis.

### Vercel / Netlify
1. *Push* repositori ini ke GitHub.
2. Buka dashboard Vercel / Netlify, buat proyek baru (New Project).
3. Import repositori GitHub ini.
4. *Framework preset* akan mendeteksi **Vite**.
5. *Build command*: `npm run build`
6. *Output directory*: `dist`
7. Klik Deploy. Selesai!

### GitHub Pages
Jika menggunakan GitHub Pages, Anda harus mengubah konfigurasi `base` pada `vite.config.ts`:
```typescript
export default defineConfig({
  base: '/nama-repo-github-anda/',
  // ...
})
```
Lalu jalankan action deployment bawaan GitHub.

## Build ke Android (APK) 📱

Aplikasi ini menggunakan Capacitor untuk *wrapper* native Android. Pastikan Anda telah menginstal Android Studio.

1. Jalankan proses *build* lokal:
   ```bash
   npm run cap:build
   ```
2. Buka proyek di Android Studio:
   ```bash
   npm run cap:open
   ```
3. Di dalam Android Studio, tunggu Gradle Sync selesai.
4. Pergi ke **Build > Build Bundle(s) / APK(s) > Build APK(s)** untuk membuat APK.
