export type Language = 'id' | 'en';

export interface Translations {
  appName: string;
  transactions: string;
  analytics: string;
  budget: string;
  categories: string;
  settings: string;

  // Dashboard Hero
  totalExpenseThisMonth: string;
  totalExpenseAllTime: string;
  thisWeekExpense: string;
  recordNew: string;
  totalTransactionsCount: string;
  viewAnalyticsChart: string;

  // Quick Presets
  shortcuts: string;
  presetCoffee: string;
  presetLunch: string;
  presetFuel: string;
  presetParking: string;
  presetGroceries: string;
  presetSnacks: string;

  // Transaction List
  searchPlaceholder: string;
  filter: string;
  allCategories: string;
  allMonths: string;
  allWeeks: string;
  allTransactions: string;
  allTime: string;
  showAllTransactions: string;
  allTimeBadge: string;
  thisMonthBadge: string;
  showingAllTime: string;
  weekPrefix: string;
  resetFilter: string;
  noTransactionsYet: string;
  noTransactionsDesc: string;
  recordFirstTransaction: string;
  noMatchFilter: string;
  noMatchFilterDesc: string;
  resetAllFilters: string;
  edit: string;
  delete: string;
  deleteTransactionTitle: string;
  deleteTransactionMsg: string;
  deleteConfirmBtn: string;
  cancelBtn: string;

  // Transaction Modal
  modalNewTitle: string;
  modalEditTitle: string;
  modalNewDesc: string;
  modalEditDesc: string;
  amountLabel: string;
  mathActive: string;
  computedTotal: string;
  categoryLabel: string;
  manageCategories: string;
  dateTimeLabel: string;
  paymentMethodLabel: string;
  notesLabel: string;
  notesPlaceholder: string;
  saveBtn: string;
  updateBtn: string;
  savingBtn: string;
  resetBtn: string;
  errorValidAmount: string;
  errorSelectCategory: string;

  // Payment Methods
  paymentEWallet: string;
  paymentCash: string;
  paymentBankTransfer: string;
  paymentDebit: string;
  paymentCredit: string;
  paymentOther: string;

  // Budget Manager
  budgetHeaderTitle: string;
  budgetHeaderDesc: string;
  totalSpentThisMonth: string;
  spentOfTarget: string;
  remaining: string;
  overBy: string;
  noLimitSet: string;
  safeDailyAllowanceTitle: string;
  safeDailyAllowanceDesc: string;
  daysRemainingInMonth: string;
  setBudgetLimit: string;
  maxLimitPerMonth: string;
  save: string;
  overBudget: string;
  nearingLimit: string;
  controlled: string;
  limitLabel: string;
  noBudgetLimitYet: string;

  // Category Manager
  categoryHeaderTitle: string;
  categoryHeaderDesc: string;
  newCategoryBtn: string;
  editCategoryTitle: string;
  newCategoryModalTitle: string;
  previewDisplay: string;
  categoryNameLabel: string;
  categoryNamePlaceholder: string;
  pickColorLabel: string;
  pickIconLabel: string;
  monthlyLimitOptionalLabel: string;
  saveCategoryBtn: string;
  deleteCategoryTitle: string;
  deleteCategoryMsg: string;
  deleteCategoryConfirmBtn: string;
  errorCategoryName: string;
  budgetLimitPerMonth: string;

  // Analytics View
  analyticsHeaderTitle: string;
  activePeriodLabel: string;
  periodToday: string;
  period7Days: string;
  period30Days: string;
  periodThisMonth: string;
  periodLastMonth: string;
  periodThisYear: string;
  periodCustom: string;
  fromLabel: string;
  toLabel: string;
  kpiTotalExpense: string;
  kpiVsPrevious: string;
  kpiDailyAverage: string;
  kpiDailyAvgDesc: string;
  kpiHighestExpense: string;
  kpiHighestExpenseDesc: string;
  kpiFrequency: string;
  kpiTimes: string;
  kpiFreqDesc: string;
  trendChartTitle: string;
  trendChartDesc: string;
  chartBar: string;
  chartArea: string;
  categoryDistTitle: string;
  categoryDistDesc: string;
  rankingTitle: string;
  noDataPeriod: string;
  noRankingData: string;

  // Settings Modal
  settingsTitle: string;
  settingsDesc: string;
  languageSection: string;
  themeSection: string;
  lightMode: string;
  darkMode: string;
  dataManagementSection: string;
  dataManagementDesc: string;
  openExcelCenter: string;
  dangerZoneSection: string;
  resetAllData: string;
  resetAllDataDesc: string;
  resetConfirmTitle: string;
  resetConfirmMsg: string;
  resetConfirmBtn: string;
  versionLabel: string;
  // Auth
  authSignIn: string;
  authSignUp: string;
  authEmailLabel: string;
  authPasswordLabel: string;
  authConfirmPasswordLabel: string;
  authNameLabel: string;
  authLogout: string;
  authAccountSection: string;
  authLoginToSync: string;
  authLogoutConfirmTitle: string;
  authLogoutConfirmMsg: string;
  authErrorEmail: string;
  authErrorPasswordMatch: string;
  authErrorWeakPassword: string;
  authSuccessLogin: string;
  authSuccessRegister: string;

  // Excel & Backup Center
  excelCenterTitle: string;
  excelCenterDesc: string;
  tabExportExcel: string;
  tabImportExcel: string;
  tabBackupRestore: string;
  exportSummaryHeading: string;
  exportTxCountLabel: string;
  exportCatCountLabel: string;
  exportFormatLabel: string;
  exportTotalLabel: string;
  exportSheetDesc: string;
  exportDownloadBtn: string;
  exportPreparingBtn: string;
  exportSuccessMsg: string;
  exportFailedMsg: string;
  importDesc: string;
  importDropzoneTitle: string;
  importDropzoneHint: string;
  importPreviewHeading: string;
  importValidOf: string;
  importRowsCount: string;
  importColDate: string;
  importColCategory: string;
  importColAmount: string;
  importColNotes: string;
  importColStatus: string;
  importStatusReady: string;
  importSaveBtn: string;
  importProcessingBtn: string;
  importSuccessMsg: string;
  importFailedMsg: string;
  backupSectionTitle: string;
  backupSectionDesc: string;
  backupDownloadBtn: string;
  backupRestoreBtn: string;
  backupSuccessMsg: string;
  backupFailedMsg: string;
}

export const translations: Record<Language, Translations> = {
  id: {
    appName: 'DuIt',
    transactions: 'Transaksi',
    analytics: 'Analitik',
    budget: 'Anggaran',
    categories: 'Kategori',
    settings: 'Pengaturan',

    // Dashboard Hero
    totalExpenseThisMonth: 'Total Pengeluaran Bulan Ini',
    totalExpenseAllTime: 'Total Seluruh Pengeluaran',
    thisWeekExpense: 'Pengeluaran Minggu Ini',
    recordNew: 'Catat Baru',
    totalTransactionsCount: 'total transaksi tercatat',
    viewAnalyticsChart: 'Lihat Grafik Analitik',

    // Quick Presets
    shortcuts: 'Pintasan:',
    presetCoffee: 'Kopi',
    presetLunch: 'Makan Siang',
    presetFuel: 'Bensin Motor/Mobil',
    presetParking: 'Parkir & Tol',
    presetGroceries: 'Minimarket',
    presetSnacks: 'Camilan / Snack',

    // Transaction List
    searchPlaceholder: 'Cari catatan, nominal, kategori, metode bayar...',
    filter: 'Filter:',
    allCategories: 'Semua Kategori',
    allMonths: 'Semua Bulan',
    allWeeks: 'Semua Minggu',
    allTransactions: 'Seluruh Transaksi',
    allTime: 'Semua Waktu',
    showAllTransactions: 'Tampilkan Seluruh Transaksi',
    allTimeBadge: 'Semua Waktu',
    thisMonthBadge: 'Bulan Ini',
    showingAllTime: 'Menampilkan Seluruh Catatan Transaksi',
    weekPrefix: 'Minggu',
    resetFilter: 'Reset Filter',
    noTransactionsYet: 'Belum ada data transaksi',
    noTransactionsDesc: 'Mulai catat pengeluaran harian Anda untuk melihat analitik dan grafik keuangan secara otomatis.',
    recordFirstTransaction: '+ Catat Pengeluaran Pertama',
    noMatchFilter: 'Tidak ada transaksi yang cocok',
    noMatchFilterDesc: 'Tidak ada data yang sesuai dengan kata kunci pencarian atau filter yang Anda pilih.',
    resetAllFilters: 'Reset Semua Filter',
    edit: 'Edit',
    delete: 'Hapus',
    deleteTransactionTitle: 'Hapus Catatan Pengeluaran',
    deleteTransactionMsg: 'Apakah Anda yakin ingin menghapus catatan transaksi ini? Tindakan ini tidak dapat dibatalkan.',
    deleteConfirmBtn: 'Hapus Transaksi',
    cancelBtn: 'Batal',

    // Transaction Modal
    modalNewTitle: 'Catat Pengeluaran Baru',
    modalEditTitle: 'Edit Pengeluaran',
    modalNewDesc: 'Catat pengeluaran harian Anda dengan cepat',
    modalEditDesc: 'Perbarui data catatan pengeluaran',
    amountLabel: 'Nominal Pengeluaran',
    mathActive: 'Kalkulator Aktif',
    computedTotal: 'Total Terhitung:',
    categoryLabel: 'Kategori',
    manageCategories: 'Kelola Kategori',
    dateTimeLabel: 'Tanggal & Waktu',
    paymentMethodLabel: 'Metode Pembayaran',
    notesLabel: 'Catatan / Keterangan (Opsional)',
    notesPlaceholder: 'Contoh: Makan siang Nasi Padang...',
    saveBtn: 'Simpan Transaksi',
    updateBtn: 'Perbarui Pengeluaran',
    savingBtn: 'Menyimpan...',
    resetBtn: 'Reset',
    errorValidAmount: 'Harap masukkan nominal pengeluaran yang valid.',
    errorSelectCategory: 'Pilih kategori pengeluaran.',

    // Payment Methods
    paymentEWallet: 'E-Wallet / QRIS',
    paymentCash: 'Tunai',
    paymentBankTransfer: 'Transfer Bank',
    paymentDebit: 'Debit',
    paymentCredit: 'Kredit',
    paymentOther: 'Lainnya',

    // Budget Manager
    budgetHeaderTitle: 'Anggaran & Limit Bulanan',
    budgetHeaderDesc: 'Pantau batas maksimal dan ritme pengeluaran',
    totalSpentThisMonth: 'Total Terpakai Bulan Ini:',
    spentOfTarget: 'terpakai dari ',
    remaining: 'Sisa',
    overBy: 'Melebihi',
    noLimitSet: 'Belum ada limit',
    safeDailyAllowanceTitle: 'Uang Harian Aman:',
    safeDailyAllowanceDesc: '',
    daysRemainingInMonth: 'hari sampai akhir bulan',
    setBudgetLimit: '+ Pasang Limit',
    maxLimitPerMonth: 'Batas Maksimal Pengeluaran (Rp / Bulan):',
    save: 'Simpan',
    overBudget: 'Over Budget',
    nearingLimit: 'Mendekati Batas',
    controlled: 'Terkendali',
    limitLabel: 'Limit:',
    noBudgetLimitYet: 'Belum ada batas anggaran',

    // Category Manager
    categoryHeaderTitle: 'Kategori Pengeluaran',
    categoryHeaderDesc: 'Sesuaikan jenis pengeluaran dengan warna dan ikon pilihan Anda',
    newCategoryBtn: 'Tambah',
    editCategoryTitle: 'Edit Kategori',
    newCategoryModalTitle: 'Tambah Kategori Baru',
    previewDisplay: 'Pratinjau Tampilan',
    categoryNameLabel: 'Nama Kategori',
    categoryNamePlaceholder: 'Contoh: Belanja Online, Bensin, Kopi',
    pickColorLabel: 'Pilih Warna',
    pickIconLabel: 'Pilih Ikon',
    monthlyLimitOptionalLabel: 'Batas Anggaran Bulanan (Opsional)',
    saveCategoryBtn: 'Simpan Kategori',
    deleteCategoryTitle: 'Hapus Kategori',
    deleteCategoryMsg: 'Apakah Anda yakin ingin menghapus kategori ini? Transaksi yang sudah terlanjur tercatat akan dipindahkan secara aman ke kategori "Lain-lain".',
    deleteCategoryConfirmBtn: 'Hapus Kategori',
    errorCategoryName: 'Nama kategori tidak boleh kosong.',
    budgetLimitPerMonth: 'Batas Anggaran:',

    // Analytics View
    analyticsHeaderTitle: 'Analisis & Grafik Pengeluaran',
    activePeriodLabel: 'Periode aktif:',
    periodToday: 'Hari Ini',
    period7Days: '7 Hari',
    period30Days: '30 Hari',
    periodThisMonth: 'Bulan Ini',
    periodLastMonth: 'Bulan Lalu',
    periodThisYear: 'Tahun Ini',
    periodCustom: 'Kustom',
    fromLabel: 'Dari:',
    toLabel: 'Sampai:',
    kpiTotalExpense: 'Total Pengeluaran',
    kpiVsPrevious: 'vs periode lalu',
    kpiDailyAverage: 'Rata-rata Harian',
    kpiDailyAvgDesc: 'Perkiraan pengeluaran / hari',
    kpiHighestExpense: 'Pengeluaran Terbesar',
    kpiHighestExpenseDesc: 'Dalam satu transaksi tunggal',
    kpiFrequency: 'Frekuensi Belanja',
    kpiTimes: 'kali',
    kpiFreqDesc: 'Total catatan transaksi',
    trendChartTitle: 'Tren Pengeluaran Waktu',
    trendChartDesc: 'Grafik naik-turun pengeluaran harian/bulanan',
    chartBar: 'Batang',
    chartArea: 'Area',
    categoryDistTitle: 'Distribusi Kategori',
    categoryDistDesc: 'Proporsi pengeluaran berdasarkan jenis kategori',
    rankingTitle: 'Peringkat Pengeluaran Kategori Terbanyak',
    noDataPeriod: 'Tidak ada data pada rentang waktu ini',
    noRankingData: 'Tidak ada data untuk ditampilkan.',

    // Settings Modal
    settingsTitle: 'Pengaturan',
    settingsDesc: 'Kelola preferensi bahasa, tema, dan data aplikasi',
    languageSection: 'Bahasa / Language',
    themeSection: 'Tema Aplikasi',
    lightMode: 'Mode Terang',
    darkMode: 'Mode Gelap',
    dataManagementSection: 'Manajemen Data & Excel',
    dataManagementDesc: 'Ekspor, impor file Excel, dan cadangan offline',
    openExcelCenter: 'Buka Pusat Data & Excel',
    dangerZoneSection: 'Zona Berbahaya',
    resetAllData: 'Reset Seluruh Data Aplikasi',
    resetAllDataDesc: 'Menghapus semua transaksi dan kategori kembali ke awal.',
    resetConfirmTitle: 'Reset Seluruh Data Aplikasi',
    resetConfirmMsg: 'Peringatan: Tindakan ini akan menghapus permanen semua catatan pengeluaran dan kategori Anda. Lanjutkan?',
    resetConfirmBtn: 'Reset Semua Data',
    versionLabel: 'DuIt Expense Tracker v1.2.0',

    // Auth
    authSignIn: 'Masuk Akun',
    authSignUp: 'Daftar',
    authEmailLabel: 'Alamat Email',
    authPasswordLabel: 'Kata Sandi',
    authConfirmPasswordLabel: 'Konfirmasi Sandi',
    authNameLabel: 'Nama',
    authLogout: 'Keluar Akun',
    authAccountSection: 'Akun & Cloud Sync',
    authLoginToSync: 'Masuk dengan Akun untuk mencadangkan data & sinkron antar-perangkat',
    authLogoutConfirmTitle: 'Keluar dari Akun',
    authLogoutConfirmMsg: 'Anda akan keluar dari akun. Data tetap tersimpan secara lokal. Lanjutkan?',
    authErrorEmail: 'Format email tidak valid.',
    authErrorPasswordMatch: 'Kata sandi dan konfirmasi sandi tidak cocok.',
    authErrorWeakPassword: 'Kata sandi harus minimal 6 karakter.',
    authSuccessLogin: 'Berhasil masuk!',
    authSuccessRegister: 'Akun berhasil dibuat dan Anda telah masuk.',

    // Excel & Backup Center
    excelCenterTitle: 'Pusat Data & Excel',
    excelCenterDesc: 'Export, Import, dan Cadangan Offline',
    tabExportExcel: 'Export Excel',
    tabImportExcel: 'Import Excel',
    tabBackupRestore: 'Backup & Restore',
    exportSummaryHeading: 'Ringkasan Data yang Akan Diexport:',
    exportTxCountLabel: 'Jumlah Transaksi:',
    exportCatCountLabel: 'Jumlah Kategori:',
    exportFormatLabel: 'Format File:',
    exportTotalLabel: 'Total Pengeluaran:',
    exportSheetDesc: 'File Excel akan memiliki 2 Lembar Kerja (Sheet): Lembar Transaksi Lengkap dan Lembar Ringkasan per Kategori.',
    exportDownloadBtn: 'Unduh File Excel (.xlsx)',
    exportPreparingBtn: 'Menyiapkan File...',
    exportSuccessMsg: 'File Excel (.xlsx) berhasil diunduh!',
    exportFailedMsg: 'Gagal mengekspor file Excel.',
    importDesc: 'Pilih file Excel (.xlsx / .xls) untuk mengimpor catatan transaksi pengeluaran. Kolom yang didukung: Tanggal, Nominal, Kategori, Catatan, Metode Pembayaran.',
    importDropzoneTitle: 'Klik atau tarik file Excel ke sini',
    importDropzoneHint: 'Format .xlsx, .xls',
    importPreviewHeading: 'Pratinjau Data',
    importValidOf: 'valid dari',
    importRowsCount: 'baris',
    importColDate: 'Tanggal',
    importColCategory: 'Kategori',
    importColAmount: 'Nominal',
    importColNotes: 'Catatan',
    importColStatus: 'Status',
    importStatusReady: 'Siap',
    importSaveBtn: 'Simpan',
    importProcessingBtn: 'Mengimpor Data...',
    importSuccessMsg: 'Berhasil mengimpor {count} transaksi ke database!',
    importFailedMsg: 'Terjadi kesalahan saat menyimpan data impor.',
    backupSectionTitle: 'Cadangan Lengkap Database Lokal (JSON Snapshot)',
    backupSectionDesc: 'Simpan seluruh data transaksi, kategori, anggaran, dan tagihan rutin ke dalam satu file cadangan lokal untuk dipindahkan ke HP atau browser lain.',
    backupDownloadBtn: 'Unduh Cadangan (.json)',
    backupRestoreBtn: 'Pulihkan Data (.json)',
    backupSuccessMsg: 'File cadangan (.json) berhasil diunduh!',
    backupFailedMsg: 'Gagal membuat cadangan.',
  },
  en: {
    appName: 'DuIt',
    transactions: 'Transactions',
    analytics: 'Analytics',
    budget: 'Budget',
    categories: 'Categories',
    settings: 'Settings',

    // Dashboard Hero
    totalExpenseThisMonth: 'Total Expenses This Month',
    totalExpenseAllTime: 'Total All-Time Expenses',
    thisWeekExpense: 'This Week Expenses',
    recordNew: 'Record New',
    totalTransactionsCount: 'total recorded transactions',
    viewAnalyticsChart: 'View Analytics Charts',

    // Quick Presets
    shortcuts: 'Shortcuts:',
    presetCoffee: 'Coffee',
    presetLunch: 'Lunch',
    presetFuel: 'Fuel',
    presetParking: 'Parking & Tolls',
    presetGroceries: 'Groceries',
    presetSnacks: 'Snacks',

    // Transaction List
    searchPlaceholder: 'Search notes, amount, category, payment method...',
    filter: 'Filter:',
    allCategories: 'All Categories',
    allMonths: 'All Months',
    allWeeks: 'All Weeks',
    allTransactions: 'All Transactions',
    allTime: 'All Time',
    showAllTransactions: 'Show All Transactions',
    allTimeBadge: 'All Time',
    thisMonthBadge: 'This Month',
    showingAllTime: 'Showing All Transaction Records',
    weekPrefix: 'Week',
    resetFilter: 'Reset Filter',
    noTransactionsYet: 'No transactions recorded yet',
    noTransactionsDesc: 'Start recording your daily expenses to see analytics and smart financial tracking automatically.',
    recordFirstTransaction: '+ Record First Expense',
    noMatchFilter: 'No matching transactions found',
    noMatchFilterDesc: 'No transactions match your current search query or active filter selection.',
    resetAllFilters: 'Reset All Filters',
    edit: 'Edit',
    delete: 'Delete',
    deleteTransactionTitle: 'Delete Expense Record',
    deleteTransactionMsg: 'Are you sure you want to delete this expense record? This action cannot be undone.',
    deleteConfirmBtn: 'Delete Expense',
    cancelBtn: 'Cancel',

    // Transaction Modal
    modalNewTitle: 'Record New Expense',
    modalEditTitle: 'Edit Expense',
    modalNewDesc: 'Record your daily spending quickly',
    modalEditDesc: 'Update your expense record details',
    amountLabel: 'Expense Amount',
    mathActive: 'Calculator Active',
    computedTotal: 'Calculated Total:',
    categoryLabel: 'Category',
    manageCategories: 'Manage Categories',
    dateTimeLabel: 'Date & Time',
    paymentMethodLabel: 'Payment Method',
    notesLabel: 'Notes / Description (Optional)',
    notesPlaceholder: 'Example: Lunch Padang Rice...',
    saveBtn: 'Save Transaction',
    updateBtn: 'Update Expense',
    savingBtn: 'Saving...',
    resetBtn: 'Reset',
    errorValidAmount: 'Please enter a valid expense amount.',
    errorSelectCategory: 'Please select an expense category.',

    // Payment Methods
    paymentEWallet: 'E-Wallet / QRIS',
    paymentCash: 'Cash',
    paymentBankTransfer: 'Bank Transfer',
    paymentDebit: 'Debit Card',
    paymentCredit: 'Credit Card',
    paymentOther: 'Other',

    // Budget Manager
    budgetHeaderTitle: 'Monthly Budget & Limits',
    budgetHeaderDesc: 'Track your spending limits and monthly burn rate',
    totalSpentThisMonth: 'Total Spent This Month:',
    spentOfTarget: 'spent of',
    remaining: 'Remaining',
    overBy: 'Over by',
    noLimitSet: 'No limit set',
    safeDailyAllowanceTitle: 'Safe Daily Allowance:',
    safeDailyAllowanceDesc: 'You can safely spend up to',
    daysRemainingInMonth: 'days until month end',
    setBudgetLimit: '+ Set Limit',
    maxLimitPerMonth: 'Max Monthly Limit (IDR / Month):',
    save: 'Save',
    overBudget: 'Over Budget',
    nearingLimit: 'Nearing Limit',
    controlled: 'On Track',
    limitLabel: 'Limit:',
    noBudgetLimitYet: 'No budget limit set yet',

    // Category Manager
    categoryHeaderTitle: 'Expense Categories',
    categoryHeaderDesc: 'Customize your spending categories with icons and color themes',
    newCategoryBtn: 'New Category',
    editCategoryTitle: 'Edit Category',
    newCategoryModalTitle: 'Add New Category',
    previewDisplay: 'Visual Preview',
    categoryNameLabel: 'Category Name',
    categoryNamePlaceholder: 'Example: Online Shopping, Fuel, Coffee',
    pickColorLabel: 'Select Color',
    pickIconLabel: 'Select Icon',
    monthlyLimitOptionalLabel: 'Monthly Budget Limit (Optional)',
    saveCategoryBtn: 'Save Category',
    deleteCategoryTitle: 'Delete Category',
    deleteCategoryMsg: 'Are you sure you want to delete this category? Existing transactions will safely transfer to "Other".',
    deleteCategoryConfirmBtn: 'Delete Category',
    errorCategoryName: 'Category name cannot be empty.',
    budgetLimitPerMonth: 'Budget Limit:',

    // Analytics View
    analyticsHeaderTitle: 'Financial Analytics & Charts',
    activePeriodLabel: 'Active period:',
    periodToday: 'Today',
    period7Days: 'Last 7 Days',
    period30Days: 'Last 30 Days',
    periodThisMonth: 'This Month',
    periodLastMonth: 'Last Month',
    periodThisYear: 'This Year',
    periodCustom: 'Custom',
    fromLabel: 'From:',
    toLabel: 'To:',
    kpiTotalExpense: 'Total Expenses',
    kpiVsPrevious: 'vs previous period',
    kpiDailyAverage: 'Daily Average',
    kpiDailyAvgDesc: 'Estimated expense / day',
    kpiHighestExpense: 'Highest Single Expense',
    kpiHighestExpenseDesc: 'In a single transaction',
    kpiFrequency: 'Spending Frequency',
    kpiTimes: 'times',
    kpiFreqDesc: 'Total transaction count',
    trendChartTitle: 'Spending Trend Over Time',
    trendChartDesc: 'Daily and monthly expenditure trend',
    chartBar: 'Bar',
    chartArea: 'Area',
    categoryDistTitle: 'Category Breakdown',
    categoryDistDesc: 'Spending proportion by category',
    rankingTitle: 'Top Spending Categories Ranking',
    noDataPeriod: 'No transaction data in this timeframe',
    noRankingData: 'No data to display.',

    // Settings Modal
    settingsTitle: 'Settings',
    settingsDesc: 'Manage language, theme, and data preferences',
    languageSection: 'Language / Bahasa',
    themeSection: 'App Theme',
    lightMode: 'Light Mode',
    darkMode: 'Dark Mode',
    dataManagementSection: 'Data & Excel Center',
    dataManagementDesc: 'Export, import Excel files, and local backup',
    openExcelCenter: 'Open Data & Excel Center',
    dangerZoneSection: 'Danger Zone',
    resetAllData: 'Reset All Application Data',
    resetAllDataDesc: 'Permanently remove all transactions and categories to factory defaults.',
    resetConfirmTitle: 'Reset All Application Data',
    resetConfirmMsg: 'Warning: This will permanently wipe all your expense records and categories. Proceed?',
    resetConfirmBtn: 'Reset All Data',
    versionLabel: 'DuIt Expense Tracker v1.2.0 • Offline-First PWA',

    // Auth
    authSignIn: 'Sign In',
    authSignUp: 'Sign Up',
    authEmailLabel: 'Email Address',
    authPasswordLabel: 'Password',
    authConfirmPasswordLabel: 'Confirm Password',
    authNameLabel: 'Name (Optional)',
    authLogout: 'Sign Out',
    authAccountSection: 'Account & Cloud Sync',
    authLoginToSync: 'Sign in to back up data & sync across devices',
    authLogoutConfirmTitle: 'Sign Out',
    authLogoutConfirmMsg: 'You will be signed out. Your data remains safe locally. Proceed?',
    authErrorEmail: 'Invalid email format.',
    authErrorPasswordMatch: 'Passwords do not match.',
    authErrorWeakPassword: 'Password must be at least 6 characters.',
    authSuccessLogin: 'Signed in successfully!',
    authSuccessRegister: 'Account created and signed in successfully.',

    // Excel & Backup Center
    excelCenterTitle: 'Data & Excel Center',
    excelCenterDesc: 'Export, Import, and Offline Backup',
    tabExportExcel: 'Export Excel',
    tabImportExcel: 'Import Excel',
    tabBackupRestore: 'Backup & Restore',
    exportSummaryHeading: 'Data Export Summary:',
    exportTxCountLabel: 'Total Transactions:',
    exportCatCountLabel: 'Total Categories:',
    exportFormatLabel: 'File Format:',
    exportTotalLabel: 'Total Spending:',
    exportSheetDesc: 'The Excel file contains 2 worksheets: Full Transactions and Category Summary.',
    exportDownloadBtn: 'Download Excel File (.xlsx)',
    exportPreparingBtn: 'Preparing File...',
    exportSuccessMsg: 'Excel file (.xlsx) downloaded successfully!',
    exportFailedMsg: 'Failed to export Excel file.',
    importDesc: 'Choose an Excel file (.xlsx / .xls) to import expense records. Supported columns: Date, Amount, Category, Notes, Payment Method.',
    importDropzoneTitle: 'Click or drag Excel file here',
    importDropzoneHint: 'Supported formats: .xlsx, .xls',
    importPreviewHeading: 'Data Preview',
    importValidOf: 'valid out of',
    importRowsCount: 'rows',
    importColDate: 'Date',
    importColCategory: 'Category',
    importColAmount: 'Amount',
    importColNotes: 'Notes',
    importColStatus: 'Status',
    importStatusReady: 'Ready',
    importSaveBtn: 'Save',
    importProcessingBtn: 'Importing Data...',
    importSuccessMsg: 'Successfully imported {count} transactions to database!',
    importFailedMsg: 'An error occurred while saving imported data.',
    backupSectionTitle: 'Full Local Database Backup (JSON Snapshot)',
    backupSectionDesc: 'Save all transactions, categories, budgets, and recurring expenses into a single local backup file to transfer to another device or browser.',
    backupDownloadBtn: 'Download Backup (.json)',
    backupRestoreBtn: 'Restore Data (.json)',
    backupSuccessMsg: 'Backup file (.json) downloaded successfully!',
    backupFailedMsg: 'Failed to generate backup.',
  },
};
