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
  detailSectionLabel: string;
  todayQuickLabel: string;
  yesterdayQuickLabel: string;
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

  // Category Sort & Reorder
  categorySortBy: string;
  sortModeManual: string;
  sortModeMostUsed: string;
  sortModeHighestAmount: string;
  sortModeNameAsc: string;
  sortModeNameDesc: string;
  sortModeNewest: string;
  applyAsManualOrder: string;
  applyAsManualTooltip: string;
  moveUp: string;
  moveDown: string;
  categoryOrderUpdated: string;
  orderRankBadge: string;

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
  kpiToday: string;
  kpiTodayDesc: string;
  trendChartTitle: string;
  trendChartDesc: string;
  chartBar: string;
  chartArea: string;
  categoryDistTitle: string;
  categoryDistDesc: string;
  rankingTitle: string;
  noDataPeriod: string;
  noRankingData: string;

  // Safe-to-Spend & Forecast
  safeToSpendTitle: string;
  safeToSpendDesc: string;
  safeDailyLimitLabel: string;
  remainingBudgetLabel: string;
  projectedTotalLabel: string;
  statusHealthy: string;
  statusWarning: string;
  statusCritical: string;
  statusNoBudget: string;
  setBudgetPrompt: string;
  btnSetBudget: string;
  pacingAhead: string;
  pacingBehind: string;
  pacingExact: string;
  daysPassedLabel: string;
  daysRemainingLabel: string;
  budgetUsedLabel: string;
  pastPeriodRecapTitle: string;
  pastPeriodRecapDesc: string;
  recapSurplus: string;
  recapDeficit: string;
  adviceHealthy: string;
  adviceWarning: string;
  adviceCritical: string;
  topBurnerLabel: string;
  avgReferenceLineLabel: string;
  categoryBudgetLimitUsed: string;
  categoryOverbudgetBadge: string;
  adviceLabel: string;
  timeElapsedLegend: string;

  // Settings Modal
  settingsTitle: string;
  settingsDesc: string;
  appearanceAndLanguage: string;
  languageSection: string;
  themeSection: string;
  themeModeTitle: string;
  lightMode: string;
  darkMode: string;
  systemMode: string;
  surfaceMoodTitle: string;
  surfaceDefault: string;
  surfaceDefaultDesc: string;
  surfaceOled: string;
  surfaceOledDesc: string;
  surfaceWarm: string;
  surfaceWarmDesc: string;
  accentColorTitle: string;
  customColorLabel: string;
  hexCodeLabel: string;
  colorEmerald: string;
  colorBlue: string;
  colorPurple: string;
  colorAmber: string;
  colorRose: string;
  colorTeal: string;
  colorIndigo: string;
  radiusTitle: string;
  radiusRounded: string;
  radiusCrisp: string;
  fontTitle: string;
  fontSubtitle: string;
  fontJakarta: string;
  fontJakartaDesc: string;
  fontNunito: string;
  fontNunitoDesc: string;
  fontLora: string;
  fontLoraDesc: string;
  fontInter: string;
  fontInterDesc: string;
  fontOutfit: string;
  fontOutfitDesc: string;
  previewTitle: string;
  previewBalanceLabel: string;
  previewCategoryFood: string;
  resetThemeBtn: string;
  themeResetSuccess: string;
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
  installAppBannerSubtitle: string;
  installPwaBtn: string;
  downloadApkBtn: string;
  downloadApkNativeTitle: string;
  downloadApkNativeDesc: string;
  // Daily Reminder Settings
  reminderSection: string;
  reminderDesc: string;
  reminderEnable: string;
  reminderTime: string;
  reminderTestBtn: string;
  reminderTestSuccess: string;
  reminderPermissionDenied: string;
  reminderActiveBadge: string;
  reminderInactiveBadge: string;
  reminderNotificationTitle: string;
  reminderNotificationBody: string;
  // Groq AI Settings & Smart Input
  aiSection: string;
  aiDesc: string;
  aiApiKeyLabel: string;
  aiApiKeyPlaceholder: string;
  aiSaveKeyBtn: string;
  aiRemoveKeyBtn: string;
  aiStatusActive: string;
  aiStatusInactive: string;
  aiTestKeyBtn: string;
  aiTestSuccess: string;
  aiTestFailed: string;
  aiGetKeyHelp: string;
  aiInputPlaceholder: string;
  aiInputButton: string;
  aiListening: string;
  aiProcessing: string;
  aiSpeechError: string;
  aiParseError: string;
  aiParseSuccess: string;
  batchReviewTitle: string;
  batchReviewDesc: string;
  saveAllBatchBtn: string;
  cancelBatchBtn: string;
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
  authDeleteAccount: string;
  authDeleteAccountDesc: string;
  authDeleteAccountConfirmTitle: string;
  authDeleteAccountConfirmMsg: string;
  authDeleteAccountBtn: string;
  authDeleteAccountSuccess: string;

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

  // Shortcut & Date Actions
  addTransactionOnThisDate: string;

  // Category Details & Batch Move
  categoryDetails: string;
  categoryTransactions: string;
  categoryNoTransactions: string;
  moveCategory: string;
  selectDestinationCategory: string;
  selectedCount: string;
  batchMoveSuccess: string;
  selectAll: string;
  deselectAll: string;
  batchMoveConfirmTitle: string;
  batchMoveConfirmMsg: string;
  searchCategoryTxPlaceholder: string;
  currentCategoryBadge: string;
  destinationCategoryLabel: string;
  confirmMoveBtn: string;

  // Settings Page
  backToTransactions: string;
  keyboardShortcuts: string;
  shortcutNewTx: string;
  shortcutSettings: string;
  shortcutSearch: string;
  localDataSummary: string;
  totalRecordsCount: string;
  databaseStatus: string;
  statusConnected: string;
  statusLocalOnly: string;

  // Privacy & Sensor Nominal
  hideNominal: string;
  showNominal: string;
  nominalHidden: string;
  nominalVisible: string;

  // Refresh & Sync
  refreshData: string;
  refreshing: string;
  dataRefreshed: string;
  cloudSyncSuccess: string;
  cloudSyncFailed: string;

  // Mobile Navigation
  back: string;
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
    modalNewDesc: '',
    modalEditDesc: '',
    amountLabel: 'Nominal Pengeluaran',
    mathActive: 'Kalkulator Aktif',
    computedTotal: 'Total Terhitung:',
    categoryLabel: 'Kategori',
    manageCategories: 'Kelola Kategori',
    dateTimeLabel: 'Tanggal & Waktu',
    paymentMethodLabel: 'Metode Pembayaran',
    notesLabel: 'Catatan / Keterangan (Opsional)',
    notesPlaceholder: 'Contoh: Makan siang, Kopi susu, Bensin motor, Belanja bulanan',
    detailSectionLabel: 'Detail',
    todayQuickLabel: 'Hari Ini',
    yesterdayQuickLabel: 'Kemarin',
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
    budgetHeaderDesc: '',
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
    categoryHeaderDesc: '',
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

    // Category Sort & Reorder
    categorySortBy: 'Urutkan:',
    sortModeManual: 'Urutan Kustom (Manual)',
    sortModeMostUsed: 'Paling Sering Digunakan (Cerdas)',
    sortModeHighestAmount: 'Pengeluaran Terbesar',
    sortModeNameAsc: 'Nama (A - Z)',
    sortModeNameDesc: 'Nama (Z - A)',
    sortModeNewest: 'Kategori Terbaru',
    applyAsManualOrder: 'Simpan susunan ini ke Urutan Manual',
    applyAsManualTooltip: 'Kunci susunan otomatis saat ini menjadi susunan manual agar tetap bisa Anda sesuaikan',
    moveUp: 'Pindah ke atas',
    moveDown: 'Pindah ke bawah',
    categoryOrderUpdated: 'Urutan kategori berhasil disimpan!',
    orderRankBadge: 'Urutan',

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
    kpiDailyAvgDesc: '',
    kpiHighestExpense: 'Pengeluaran Terbesar',
    kpiHighestExpenseDesc: '',
    kpiFrequency: 'Frekuensi Belanja',
    kpiTimes: 'kali',
    kpiFreqDesc: '',
    kpiToday: 'Hari Ini',
    kpiTodayDesc: '',
    trendChartTitle: 'Tren Pengeluaran',
    trendChartDesc: '',
    chartBar: 'Batang',
    chartArea: 'Area',
    categoryDistTitle: 'Distribusi Kategori',
    categoryDistDesc: '',
    rankingTitle: 'Peringkat Kategori',
    noDataPeriod: 'Tidak ada data pada rentang waktu ini',
    noRankingData: 'Tidak ada data untuk ditampilkan.',

    // Safe-to-Spend & Forecast
    safeToSpendTitle: 'Batas Belanja Aman & Proyeksi',
    safeToSpendDesc: 'Panduan batas harian agar pengeluaran tidak melampaui anggaran bulan ini',
    safeDailyLimitLabel: 'Batas Harian Aman',
    remainingBudgetLabel: 'Sisa Anggaran',
    projectedTotalLabel: 'Proyeksi Akhir Bulan',
    statusHealthy: 'Laju Aman',
    statusWarning: 'Perlu Waspada',
    statusCritical: 'Risiko Overbudget',
    statusNoBudget: 'Belum Ada Anggaran',
    setBudgetPrompt: 'Atur limit anggaran kategori untuk mengaktifkan Safe-to-Spend & Proyeksi.',
    btnSetBudget: 'Atur Anggaran',
    pacingAhead: 'Laju belanja melebihi laju hari',
    pacingBehind: 'Laju pengeluaran masih terkendali',
    pacingExact: 'Laju belanja seimbang dengan waktu',
    daysPassedLabel: 'Hari Berjalan',
    daysRemainingLabel: 'Hari Tersisa',
    budgetUsedLabel: 'Anggaran Terpakai',
    pastPeriodRecapTitle: 'Rekapitulasi Anggaran Periode Ini',
    pastPeriodRecapDesc: 'Perbandingan realisasi pengeluaran dengan target anggaran kategori',
    recapSurplus: 'Surplus Hemat',
    recapDeficit: 'Melebihi Target',
    adviceHealthy: 'Pengeluaran masih dalam batas aman dengan alokasi harian yang terjaga.',
    adviceWarning: 'Laju belanja melebihi laju hari. Prioritaskan kebutuhan pokok agar alokasi harian tetap aman.',
    adviceCritical: 'Proyeksi pengeluaran melampaui target anggaran. Tahan belanja non-pokok dan evaluasi batas kategori.',
    topBurnerLabel: 'Penyerap Anggaran Terbesar',
    avgReferenceLineLabel: 'Rata-rata',
    categoryBudgetLimitUsed: 'terpakai dari limit',
    categoryOverbudgetBadge: 'Melebihi Limit',
    adviceLabel: 'Saran',
    timeElapsedLegend: 'Waktu berjalan',

    // Settings Modal
    settingsTitle: 'Pengaturan',
    settingsDesc: '',
    appearanceAndLanguage: 'Preferensi Tampilan & Bahasa',
    languageSection: 'Pilihan Bahasa',
    themeSection: 'Tema & Tampilan',
    themeModeTitle: 'Mode Tampilan',
    lightMode: 'Mode Terang',
    darkMode: 'Mode Gelap',
    systemMode: 'Ikuti Sistem',
    surfaceMoodTitle: 'Karakter Permukaan',
    surfaceDefault: 'Standar Slate',
    surfaceDefaultDesc: 'Bersih & seimbang',
    surfaceOled: 'OLED Hitam Pekat',
    surfaceOledDesc: 'Hitam murni (#000000) AMOLED',
    surfaceWarm: 'Warm Sepia',
    surfaceWarmDesc: 'Nuansa hangat ramah mata',
    accentColorTitle: 'Warna Aksen Utama',
    customColorLabel: 'Kustom',
    hexCodeLabel: 'Kode Hex',
    colorEmerald: 'Zamrud',
    colorBlue: 'Biru',
    colorPurple: 'Ungu',
    colorAmber: 'Oranye',
    colorRose: 'Mawar',
    colorTeal: 'Toska',
    colorIndigo: 'Indigo',
    radiusTitle: 'Gaya Sudut',
    radiusRounded: 'Bulat Lembut',
    radiusCrisp: 'Tajam Ringkas',
    fontTitle: 'Gaya Teks & Tipografi',
    fontSubtitle: 'Pilih karakter huruf yang sesuai dengan selera visual Anda',
    fontJakarta: 'Plus Jakarta Sans',
    fontJakartaDesc: 'Modern & Geometris',
    fontNunito: 'Nunito',
    fontNunitoDesc: 'Soft & Ramah (Rounded)',
    fontLora: 'Lora',
    fontLoraDesc: 'Classic & Elegan (Serif)',
    fontInter: 'Inter',
    fontInterDesc: 'Netral & Fungsional',
    fontOutfit: 'Outfit',
    fontOutfitDesc: 'Stylish & Trendi',
    previewTitle: 'Pratinjau Langsung',
    previewBalanceLabel: 'Total Pengeluaran Bulan Ini',
    previewCategoryFood: 'Makanan',
    resetThemeBtn: 'Kembalikan Tema ke Default',
    themeResetSuccess: 'Tema telah dikembalikan ke pengaturan default',
    dataManagementSection: 'Manajemen Data & Excel',
    dataManagementDesc: '',
    openExcelCenter: 'Buka Pusat Data & Excel',
    dangerZoneSection: 'Zona Berbahaya',
    resetAllData: 'Reset Seluruh Data Aplikasi',
    resetAllDataDesc: 'Menghapus semua transaksi dan kategori kembali ke awal.',
    resetConfirmTitle: 'Reset Seluruh Data Aplikasi',
    resetConfirmMsg: 'Peringatan: Tindakan ini akan menghapus permanen semua catatan pengeluaran dan kategori Anda. Lanjutkan?',
    resetConfirmBtn: 'Reset Semua Data',
    versionLabel: 'DuIt Expense Tracker v2.0.0 • Offline-First PWA',
    installAppBannerSubtitle: 'Pasang di HP Anda untuk akses offline instan & lebih cepat',
    installPwaBtn: 'Pasang Cepat',
    downloadApkBtn: 'Unduh APK',
    downloadApkNativeTitle: 'Aplikasi Android Native (APK)',
    downloadApkNativeDesc: 'Unduh file installer APK v2.0.0 langsung untuk dipasang mandiri di perangkat Android Anda.',

    // Daily Reminder Settings
    reminderSection: 'Pengingat Pengeluaran Harian',
    reminderDesc: '',
    reminderEnable: 'Aktifkan Pengingat Harian',
    reminderTime: 'Waktu Pengingat',
    reminderTestBtn: 'Uji Coba Notifikasi',
    reminderTestSuccess: 'Notifikasi pengujian berhasil dikirim!',
    reminderPermissionDenied: 'Izin notifikasi diblokir browser. Mohon izinkan notifikasi pada pengaturan browser Anda.',
    reminderActiveBadge: 'Pengingat Aktif',
    reminderInactiveBadge: 'Nonaktif',
    reminderNotificationTitle: 'DuIt - Pengingat Harian',
    reminderNotificationBody: 'Kamu belum mencatat pengeluaran hari ini. Yuk catat agar keuanganmu tetap terkontrol! 💰',

    // Groq AI Settings & Smart Input
    aiSection: 'Input Cerdas',
    aiDesc: '',
    aiApiKeyLabel: 'API Key',
    aiApiKeyPlaceholder: 'Tempel API Key di sini (gsk_...)',
    aiSaveKeyBtn: 'Simpan Kunci',
    aiRemoveKeyBtn: 'Hapus',
    aiStatusActive: 'Aktif',
    aiStatusInactive: 'Belum Dikonfigurasi',
    aiTestKeyBtn: 'Uji Koneksi',
    aiTestSuccess: 'Koneksi API berhasil! Siap digunakan.',
    aiTestFailed: 'Gagal terhubung. Pastikan API Key valid.',
    aiGetKeyHelp: 'Dapatkan Groq API Key di console.groq.com',
    aiInputPlaceholder: 'Contoh: Kopi 25rb tunai, Makan siang 45rb qris, Belanja 120rb transfer...',
    aiInputButton: 'Proses',
    aiListening: 'Mendengarkan suara... Silakan bicara',
    aiProcessing: 'Memproses...',
    aiSpeechError: 'Gagal mengakses mikrofon atau pengenalan suara tidak didukung browser.',
    aiParseError: 'Tidak dapat mendeteksi transaksi dari kalimat ini. Coba kalimat yang lebih spesifik.',
    aiParseSuccess: 'Transaksi berhasil terdeteksi!',
    batchReviewTitle: 'Tinjau Transaksi',
    batchReviewDesc: 'Beberapa transaksi terdeteksi. Periksa dan simpan sekaligus.',
    saveAllBatchBtn: 'Simpan Semua Transaksi',
    cancelBatchBtn: 'Batal / Input Manual',

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
    authDeleteAccount: 'Hapus Akun',
    authDeleteAccountDesc: 'Hapus akun Anda secara permanen beserta seluruh data yang tersinkronisasi di cloud.',
    authDeleteAccountConfirmTitle: 'Hapus Akun Permanen?',
    authDeleteAccountConfirmMsg: 'Peringatan: Tindakan ini tidak dapat dibatalkan. Seluruh data akun, transaksi, dan kategori di cloud akan dihapus secara permanen. Lanjutkan?',
    authDeleteAccountBtn: 'Hapus Akun Permanen',
    authDeleteAccountSuccess: 'Akun dan seluruh data berhasil dihapus.',

    // Excel & Backup Center
    excelCenterTitle: 'Pusat Data & Excel',
    excelCenterDesc: '',
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

    // Shortcut & Date Actions
    addTransactionOnThisDate: 'Catat di tanggal ini',

    // Category Details & Batch Move
    categoryDetails: 'Detail Kategori',
    categoryTransactions: 'Transaksi Kategori',
    categoryNoTransactions: 'Belum ada transaksi di kategori ini.',
    moveCategory: 'Pindahkan Kategori',
    selectDestinationCategory: 'Pilih Kategori Tujuan',
    selectedCount: 'transaksi dipilih',
    batchMoveSuccess: '{count} transaksi berhasil dipindahkan ke kategori {name}!',
    selectAll: 'Pilih Semua',
    deselectAll: 'Batal Pilih Semua',
    batchMoveConfirmTitle: 'Pindahkan Transaksi Terpilih',
    batchMoveConfirmMsg: 'Pindahkan {count} transaksi terpilih ke kategori "{name}"?',
    searchCategoryTxPlaceholder: 'Cari catatan atau nominal dalam kategori...',
    currentCategoryBadge: 'Kategori Saat Ini',
    destinationCategoryLabel: 'Pilih kategori baru untuk transaksi terpilih:',
    confirmMoveBtn: 'Pindahkan Sekarang',

    // Settings Page
    backToTransactions: 'Kembali ke Transaksi',
    keyboardShortcuts: 'Pintasan Keyboard',
    shortcutNewTx: 'Tambah Transaksi Baru',
    shortcutSettings: 'Buka Pengaturan',
    shortcutSearch: 'Fokus Pencarian',
    localDataSummary: 'Ringkasan Data Lokal',
    totalRecordsCount: 'Total Catatan',
    databaseStatus: 'Status Penyimpanan',
    statusConnected: 'Tersinkronisasi',
    statusLocalOnly: 'Penyimpanan Lokal',

    // Privacy & Sensor Nominal
    hideNominal: 'Sembunyikan nominal',
    showNominal: 'Tampilkan nominal',
    nominalHidden: 'Nominal disembunyikan',
    nominalVisible: 'Nominal ditampilkan',

    // Refresh & Sync
    refreshData: 'Segarkan data',
    refreshing: 'Menyegarkan...',
    dataRefreshed: 'Data lokal berhasil disegarkan!',
    cloudSyncSuccess: 'Data berhasil disinkronkan dengan cloud!',
    cloudSyncFailed: 'Gagal menyinkronkan data.',

    // Mobile Navigation
    back: 'Kembali',
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
    modalNewDesc: '',
    modalEditDesc: '',
    amountLabel: 'Expense Amount',
    mathActive: 'Calculator Active',
    computedTotal: 'Calculated Total:',
    categoryLabel: 'Category',
    manageCategories: 'Manage Categories',
    dateTimeLabel: 'Date & Time',
    paymentMethodLabel: 'Payment Method',
    notesLabel: 'Notes / Description (Optional)',
    notesPlaceholder: 'Example: Lunch, Coffee, Fuel, Monthly groceries',
    detailSectionLabel: 'Details',
    todayQuickLabel: 'Today',
    yesterdayQuickLabel: 'Yesterday',
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
    budgetHeaderDesc: '',
    totalSpentThisMonth: 'Total Spent This Month:',
    spentOfTarget: 'spent of',
    remaining: 'Remaining',
    overBy: 'Over by',
    noLimitSet: 'No limit set',
    safeDailyAllowanceTitle: 'Safe Daily Allowance:',
    safeDailyAllowanceDesc: '',
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
    categoryHeaderDesc: '',
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

    // Category Sort & Reorder
    categorySortBy: 'Sort by:',
    sortModeManual: 'Custom Order (Manual)',
    sortModeMostUsed: 'Most Frequently Used (Smart)',
    sortModeHighestAmount: 'Highest Spending',
    sortModeNameAsc: 'Name (A - Z)',
    sortModeNameDesc: 'Name (Z - A)',
    sortModeNewest: 'Newest Created',
    applyAsManualOrder: 'Lock current as Manual Order',
    applyAsManualTooltip: 'Save this automatic arrangement as your custom manual order so you can fine-tune it',
    moveUp: 'Move up',
    moveDown: 'Move down',
    categoryOrderUpdated: 'Category order saved successfully!',
    orderRankBadge: 'Rank',

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
    kpiDailyAvgDesc: '',
    kpiHighestExpense: 'Highest Single Expense',
    kpiHighestExpenseDesc: '',
    kpiFrequency: 'Spending Frequency',
    kpiTimes: 'times',
    kpiFreqDesc: '',
    kpiToday: 'Today',
    kpiTodayDesc: '',
    trendChartTitle: 'Spending Trend',
    trendChartDesc: '',
    chartBar: 'Bar',
    chartArea: 'Area',
    categoryDistTitle: 'Category Breakdown',
    categoryDistDesc: '',
    rankingTitle: 'Category Ranking',
    noDataPeriod: 'No transaction data in this timeframe',
    noRankingData: 'No data to display.',

    // Safe-to-Spend & Forecast
    safeToSpendTitle: 'Safe-to-Spend & Forecast',
    safeToSpendDesc: 'Daily spending guide to stay within your monthly budget targets',
    safeDailyLimitLabel: 'Daily Safe Limit',
    remainingBudgetLabel: 'Remaining Budget',
    projectedTotalLabel: 'Month-End Forecast',
    statusHealthy: 'On Track',
    statusWarning: 'Pacing High',
    statusCritical: 'Overbudget Risk',
    statusNoBudget: 'No Budget Set',
    setBudgetPrompt: 'Set category budget limits to enable Safe-to-Spend & Forecast.',
    btnSetBudget: 'Set Budget',
    pacingAhead: 'Spending is outpacing the days',
    pacingBehind: 'Spending pace is well controlled',
    pacingExact: 'Spending is in sync with time',
    daysPassedLabel: 'Days Elapsed',
    daysRemainingLabel: 'Days Left',
    budgetUsedLabel: 'Budget Used',
    pastPeriodRecapTitle: 'Period Budget Recap',
    pastPeriodRecapDesc: 'Comparison of actual spending against target category budgets',
    recapSurplus: 'Budget Surplus',
    recapDeficit: 'Over Target',
    adviceHealthy: 'Spending is within safe limits with a steady daily allowance.',
    adviceWarning: 'Spending is outpacing the calendar. Prioritize essentials to keep your daily limit on track.',
    adviceCritical: 'Projected spending will exceed your monthly budget. Pause non-essential purchases and review category limits.',
    topBurnerLabel: 'Top Burner Category',
    avgReferenceLineLabel: 'Average',
    categoryBudgetLimitUsed: 'used of limit',
    categoryOverbudgetBadge: 'Over Limit',
    adviceLabel: 'Recommendation',
    timeElapsedLegend: 'Time elapsed',

    // Settings Modal
    settingsTitle: 'Settings',
    settingsDesc: '',
    appearanceAndLanguage: 'Appearance & Language',
    languageSection: 'Language',
    themeSection: 'Theme & Appearance',
    themeModeTitle: 'Display Mode',
    lightMode: 'Light Mode',
    darkMode: 'Dark Mode',
    systemMode: 'Follow System',
    surfaceMoodTitle: 'Surface Mood',
    surfaceDefault: 'Default Slate',
    surfaceDefaultDesc: 'Clean & balanced',
    surfaceOled: 'Pure OLED Black',
    surfaceOledDesc: 'Pure AMOLED black (#000000)',
    surfaceWarm: 'Warm Sepia',
    surfaceWarmDesc: 'Cozy tone, easy on eyes',
    accentColorTitle: 'Accent Color',
    customColorLabel: 'Custom',
    hexCodeLabel: 'Hex Code',
    colorEmerald: 'Emerald',
    colorBlue: 'Blue',
    colorPurple: 'Violet',
    colorAmber: 'Amber',
    colorRose: 'Rose',
    colorTeal: 'Teal',
    colorIndigo: 'Indigo',
    radiusTitle: 'Corner Style',
    radiusRounded: 'Rounded Modern',
    radiusCrisp: 'Crisp Compact',
    fontTitle: 'Typography & Font Style',
    fontSubtitle: 'Choose the font character that best fits your visual taste',
    fontJakarta: 'Plus Jakarta Sans',
    fontJakartaDesc: 'Modern & Clean',
    fontNunito: 'Nunito',
    fontNunitoDesc: 'Soft & Friendly (Rounded)',
    fontLora: 'Lora',
    fontLoraDesc: 'Classic & Editorial (Serif)',
    fontInter: 'Inter',
    fontInterDesc: 'Neutral & Functional',
    fontOutfit: 'Outfit',
    fontOutfitDesc: 'Stylish & Display',
    previewTitle: 'Live Preview',
    previewBalanceLabel: 'Total Spent This Month',
    previewCategoryFood: 'Food',
    resetThemeBtn: 'Reset Theme to Default',
    themeResetSuccess: 'Theme has been reset to defaults',
    dataManagementSection: 'Data & Excel Center',
    dataManagementDesc: '',
    openExcelCenter: 'Open Data & Excel Center',
    dangerZoneSection: 'Danger Zone',
    resetAllData: 'Reset All Application Data',
    resetAllDataDesc: 'Permanently remove all transactions and categories to factory defaults.',
    resetConfirmTitle: 'Reset All Application Data',
    resetConfirmMsg: 'Warning: This will permanently wipe all your expense records and categories. Proceed?',
    resetConfirmBtn: 'Reset All Data',
    versionLabel: 'DuIt Expense Tracker v2.0.0 • Offline-First PWA',
    installAppBannerSubtitle: 'Install on your phone for instant offline access & speed',
    installPwaBtn: 'Quick Install',
    downloadApkBtn: 'Download APK',
    downloadApkNativeTitle: 'Native Android App (APK)',
    downloadApkNativeDesc: 'Download the v2.0.0 APK installer directly for standalone installation on your Android device.',

    // Daily Reminder Settings
    reminderSection: 'Daily Expense Reminder',
    reminderDesc: '',
    reminderEnable: 'Enable Daily Reminder',
    reminderTime: 'Reminder Time',
    reminderTestBtn: 'Test Notification',
    reminderTestSuccess: 'Test notification sent successfully!',
    reminderPermissionDenied: 'Notification permission was denied. Please allow notifications in browser settings.',
    reminderActiveBadge: 'Reminder Active',
    reminderInactiveBadge: 'Disabled',
    reminderNotificationTitle: 'DuIt - Daily Reminder',
    reminderNotificationBody: "You haven't recorded any expenses today. Track your spending to stay on budget! 💰",

    // Groq AI Settings & Smart Input
    aiSection: 'Smart Input',
    aiDesc: '',
    aiApiKeyLabel: 'API Key',
    aiApiKeyPlaceholder: 'Paste API Key here (gsk_...)',
    aiSaveKeyBtn: 'Save Key',
    aiRemoveKeyBtn: 'Remove',
    aiStatusActive: 'Active',
    aiStatusInactive: 'Not Configured',
    aiTestKeyBtn: 'Test Connection',
    aiTestSuccess: 'API connection successful! Ready to use.',
    aiTestFailed: 'Connection failed. Please check your API Key.',
    aiGetKeyHelp: 'Get a free Groq API Key at console.groq.com',
    aiInputPlaceholder: 'Example: Coffee 25k cash, Lunch 45k card, Groceries 120k transfer...',
    aiInputButton: 'Process',
    aiListening: 'Listening... Speak now',
    aiProcessing: 'Processing...',
    aiSpeechError: 'Microphone access failed or speech recognition is not supported.',
    aiParseError: 'Could not detect any transactions. Try a clearer description.',
    aiParseSuccess: 'Transactions detected!',
    batchReviewTitle: 'Review Transactions',
    batchReviewDesc: 'Multiple expenses detected. Review and save all at once.',
    saveAllBatchBtn: 'Save All Transactions',
    cancelBatchBtn: 'Cancel / Manual Form',

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
    authDeleteAccount: 'Delete Account',
    authDeleteAccountDesc: 'Permanently delete your account and all synchronized cloud data.',
    authDeleteAccountConfirmTitle: 'Permanently Delete Account?',
    authDeleteAccountConfirmMsg: 'Warning: This action cannot be undone. All your account data, transactions, and categories in the cloud will be permanently deleted. Proceed?',
    authDeleteAccountBtn: 'Delete Account Permanently',
    authDeleteAccountSuccess: 'Account and all data successfully deleted.',

    // Excel & Backup Center
    excelCenterTitle: 'Data & Excel Center',
    excelCenterDesc: '',
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
    // Shortcut & Date Actions
    addTransactionOnThisDate: 'Record on this date',

    // Category Details & Batch Move
    categoryDetails: 'Category Details',
    categoryTransactions: 'Category Transactions',
    categoryNoTransactions: 'No transactions in this category yet.',
    moveCategory: 'Move Category',
    selectDestinationCategory: 'Select Destination Category',
    selectedCount: 'transactions selected',
    batchMoveSuccess: '{count} transactions successfully moved to {name}!',
    selectAll: 'Select All',
    deselectAll: 'Deselect All',
    batchMoveConfirmTitle: 'Move Selected Transactions',
    batchMoveConfirmMsg: 'Move {count} selected transactions to category "{name}"?',
    searchCategoryTxPlaceholder: 'Search notes or amount in this category...',
    currentCategoryBadge: 'Current Category',
    destinationCategoryLabel: 'Select new category for selected transactions:',
    confirmMoveBtn: 'Move Now',

    // Settings Page
    backToTransactions: 'Back to Transactions',
    keyboardShortcuts: 'Keyboard Shortcuts',
    shortcutNewTx: 'New Transaction',
    shortcutSettings: 'Open Settings',
    shortcutSearch: 'Focus Search',
    localDataSummary: 'Local Data Summary',
    totalRecordsCount: 'Total Records',
    databaseStatus: 'Storage Status',
    statusConnected: 'Synchronized',
    statusLocalOnly: 'Local Storage',

    // Privacy & Sensor Nominal
    hideNominal: 'Hide amounts',
    showNominal: 'Show amounts',
    nominalHidden: 'Amounts hidden',
    nominalVisible: 'Amounts visible',

    // Refresh & Sync
    refreshData: 'Refresh data',
    refreshing: 'Refreshing...',
    dataRefreshed: 'Local data refreshed!',
    cloudSyncSuccess: 'Data synchronized with cloud!',
    cloudSyncFailed: 'Failed to sync data.',

    // Mobile Navigation
    back: 'Back',
  },
};

