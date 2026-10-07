import type { PaymentMethodType } from '../types';

const STORAGE_KEY_GROQ_KEY = 'duit_groq_api_key';
export const GROQ_MODEL_ID = 'openai/gpt-oss-120b';
export const GROQ_FALLBACK_MODEL_ID = 'openai/gpt-oss-20b';

export interface ParsedTransactionResult {
  amount: number;
  categoryId?: string;
  notes: string;
  paymentMethod: PaymentMethodType;
  dateIso?: string;
}

interface CategoryRef {
  id: string;
  name: string;
  isDefault?: boolean;
}

export const DEFAULT_CATEGORY_IDS = new Set([
  'cat-food',
  'cat-transport',
  'cat-shopping',
  'cat-bills',
  'cat-entertainment',
  'cat-health',
  'cat-education',
  'cat-others',
]);

export const CUSTOM_CATEGORY_DOMAIN_RULES = [
  {
    pattern: /kucing|anjing|pet|hewan|pelihara|cat|dog/i,
    keywords: ['makanan kucing', 'pasir kucing', 'kucing', 'anjing', 'pet', 'petshop', 'whiskas', 'royal canin', 'vet', 'dokter hewan', 'grooming hewan'],
  },
  {
    pattern: /zakat|sedekah|infaq|infak|donasi|amal|sosial|sumbangan/i,
    keywords: ['sedekah', 'zakat', 'infaq', 'infak', 'donasi', 'amal', 'kotak amal', 'celengan masjid', 'sumbangan', 'dhuafa', 'yatim', 'panti asuhan', 'wakaf'],
  },
  {
    pattern: /invest|saham|tabung|reksa|crypto|kripto|emas|trading|deposito/i,
    keywords: ['saham', 'reksadana', 'reksa dana', 'crypto', 'kripto', 'bitcoin', 'btc', 'eth', 'emas', 'antam', 'tabungan', 'deposito', 'bibit', 'bareksa', 'ajaib', 'pluang', 'p2p', 'dinar', 'investasi'],
  },
  {
    pattern: /olahraga|gym|fitness|sport|futsal|badminton/i,
    keywords: ['gym', 'fitness', 'olahraga', 'futsal', 'badminton', 'bulutangkis', 'renang', 'sewa lapangan', 'yoga', 'pilates', 'tenis', 'sepeda', 'running'],
  },
  {
    pattern: /skincare|perawatan|salon|barber|cukur|kecantikan|beauty/i,
    keywords: ['skincare', 'serum', 'sunscreen', 'sunblock', 'moisturizer', 'facial', 'salon', 'barbershop', 'cukur', 'potong rambut', 'creambath', 'toner', 'kosmetik', 'lipstik'],
  },
  {
    pattern: /rokok|vape|smoking/i,
    keywords: ['rokok', 'vape', 'liquid', 'pods', 'surya', 'sampoerna', 'marlboro', 'esse', 'djarum', 'gudang garam'],
  },
  {
    pattern: /keluarga|anak|baby|bayi|family|ortu/i,
    keywords: ['susu formula', 'popok', 'pampers', 'uang jajan anak', 'mainan anak', 'imunisasi anak', 'baju anak', 'kirim ortu', 'uang ortu'],
  },
  {
    pattern: /bisnis|usaha|kerja|kantor|proyek|modal/i,
    keywords: ['modal usaha', 'bisnis', 'proyek', 'kantor', 'meeting', 'klien', 'bahan baku'],
  },
];

export const SEMANTIC_CATEGORY_KEYWORDS = {
  food: [
    'makan', 'sarapan', 'maksi', 'dinner', 'lunch', 'sahur', 'buka puasa', 'bukber',
    'minum', 'es teh', 'teh manis', 'kopi', 'ngopi', 'coffee', 'cafe', 'kafe', 'warkop', 'angkringan', 'warmindo',
    'bakso', 'mie', 'mi', 'mie ayam', 'mie instan', 'indomie', 'popmie', 'bihun', 'kwetiau',
    'soto', 'rawon', 'gulai', 'sop', 'tongseng',
    'nasi', 'nasgor', 'nasi goreng', 'nasi uduk', 'nasi kuning', 'nasi padang', 'warteg', 'pecel', 'pecel lele',
    'ayam', 'ayam geprek', 'geprek', 'ayam bakar', 'ayam goreng', 'bebek', 'sate', 'rendang',
    'burger', 'pizza', 'pasta', 'spaghetti', 'steak', 'kentang goreng', 'hotdog', 'sandwich', 'kebab',
    'roti', 'toast', 'donat', 'donut', 'kue', 'cake', 'brownies', 'martabak', 'terang bulan',
    'snack', 'cemilan', 'camilan', 'keripik', 'biskuit', 'wafer', 'cokelat', 'permen',
    'gorengan', 'bakwan', 'mendoan', 'cireng', 'cilok', 'batagor', 'siomay', 'dimsum', 'pempek', 'seblak',
    'jus', 'juice', 'boba', 'es krim', 'ice cream', 'gelato', 'es campur', 'es teler', 'es kelapa', 'dawet', 'cendol',
    'resto', 'restoran', 'kedai', 'warung makan', 'mcd', 'mcdonalds', 'kfc', 'aw', 'hokben', 'richeese', 'marugame', 'solaria',
    'starbucks', 'janji jiwa', 'kopi kenangan', 'point coffee', 'tomoro', 'fore', 'mixue', 'chatime',
    'gofood', 'grabfood', 'shopeefood', 'kuliner', 'lauk', 'sayur', 'lalapan', 'sambal'
  ],
  transport: [
    'bensin', 'pertalite', 'pertamax', 'solar', 'dexlite', 'shell', 'spbu', 'pom bensin',
    'parkir', 'valet', 'tol', 'e-toll', 'etoll',
    'gojek', 'grab', 'maxim', 'indriver', 'ojol', 'goride', 'gocar', 'grabcar', 'grabride', 'anjem',
    'motor', 'mobil', 'kendaraan', 'sepeda',
    'servis', 'service', 'bengkel', 'montir', 'oli', 'ganti oli', 'tune up', 'sparepart', 'onderdil', 'radiator', 'rem', 'kampas', 'aki',
    'cuci motor', 'cuci mobil', 'steam motor', 'steam mobil', 'car wash',
    'ban', 'tambal ban', 'isi angin', 'nitrogen', 'spooring', 'balancing', 'helm', 'jas hujan',
    'kereta', 'krl', 'mrt', 'lrt', 'busway', 'transjakarta', 'angkot', 'mikrolet', 'elf', 'bus', 'bis', 'travel', 'shuttle', 'terminal', 'stasiun',
    'taksi', 'taxi', 'bluebird', 'pesawat', 'tiket pesawat', 'bandara', 'kai', 'kapal', 'feri',
    'ongkir', 'kurir', 'jne', 'jnt', 'j&t', 'sicepat', 'anteraja', 'pos'
  ],
  bills: [
    'listrik', 'pln', 'token listrik', 'token pln', 'meteran listrik',
    'air', 'pdam', 'pam', 'aetra',
    'pulsa', 'kuota', 'paket data', 'paket internet', 'telkomsel', 'indosat', 'im3', 'xl', 'smartfren', 'tri', 'axis', 'byu',
    'wifi', 'indihome', 'biznet', 'first media', 'myrepublic', 'iconnet', 'cbn', 'oxygen', 'internet rumah',
    'gas', 'lpg', 'elpiji', 'tabung gas',
    'kos', 'kost', 'kosan', 'kontrakan', 'sewa rumah', 'sewa apartemen', 'sewa kamar', 'sewa kos',
    'iuran rt', 'iuran rw', 'iuran warga', 'kebersihan', 'keamanan', 'sampah', 'ipl', 'maintenance gedung',
    'bpjs', 'bpjs kesehatan', 'bpjs ketenagakerjaan', 'asuransi', 'premi',
    'tagihan', 'billing', 'cicilan', 'angsuran', 'kpr', 'leasing', 'kredit motor', 'kredit mobil', 'kartu kredit', 'paylater', 'spaylater', 'kredivo', 'akulaku',
    'pbb', 'pajak', 'samsat', 'stnk', 'sim', 'perpanjang stnk', 'perpanjang sim',
    'langganan', 'subscription', 'netflix', 'spotify', 'youtube premium', 'icloud', 'google one', 'disney', 'canva', 'domain', 'hosting', 'vps'
  ],
  shopping: [
    'belanja', 'shopping', 'buy', 'beli barang',
    'shopee', 'tokopedia', 'lazada', 'tiktok shop', 'tiktokshop', 'blibli', 'zalora',
    'mall', 'supermarket', 'hypermart', 'transmart', 'superindo', 'indomaret', 'alfamart', 'alfamidi', 'minimarket', 'toko kelontong', 'pasar',
    'sembako', 'beras', 'minyak goreng', 'gula', 'garam', 'telur', 'bumbu dapur', 'tepung',
    'sabun', 'sabun mandi', 'sabun cuci', 'detergen', 'rinso', 'daia', 'soklin', 'sunlight', 'mama lemon', 'molto', 'pewangi', 'softener',
    'shampo', 'sampo', 'shampoo', 'odol', 'pasta gigi', 'sikat gigi', 'ember', 'gayung', 'spons',
    'tisu', 'tissue', 'kapas', 'pembalut', 'popok', 'pampers',
    'baju', 'kaos', 'kemeja', 'celana', 'jeans', 'rok', 'gamis', 'daster', 'hoodie', 'jaket', 'sweater', 'jas', 'pakaian', 'boxer', 'underwear',
    'sepatu', 'sandal', 'sneakers', 'heels', 'kaos kaki',
    'tas', 'ransel', 'backpack', 'sling bag', 'totebag', 'dompet', 'koper',
    'hijab', 'jilbab', 'kerudung', 'pashmina', 'mukena', 'sarung', 'peci',
    'aksesoris', 'jam tangan', 'kacamata', 'ikat pinggang', 'topi', 'perhiasan', 'kalung', 'cincin', 'gelang',
    'hp', 'handphone', 'smartphone', 'tablet', 'ipad', 'laptop', 'komputer', 'pc',
    'casing hp', 'charger', 'casan', 'kabel data', 'earphone', 'headset', 'tws', 'powerbank', 'flashdisk', 'mouse', 'keyboard',
    'perabotan', 'furnitur', 'kasur', 'bantal', 'guling', 'sprei', 'selimut', 'gorden', 'handuk', 'keset', 'hanger', 'jemuran',
    'panci', 'wajan', 'teflon', 'piring', 'gelas', 'sendok', 'garpu', 'pisau', 'tupperware', 'termos'
  ],
  health: [
    'obat', 'apotek', 'apotik', 'k24', 'kimia farma', 'century', 'guardian', 'watsons',
    'dokter', 'periksa dokter', 'konsul dokter', 'spesialis', 'bidan', 'mantri', 'puskesmas', 'klinik', 'rs', 'rumah sakit', 'rawat inap', 'ugd', 'igd',
    'vitamin', 'suplemen', 'curcuma', 'enervon', 'cdr', 'imboost', 'zinc',
    'paracetamol', 'panadol', 'bodrex', 'pusing', 'demam', 'flu', 'batuk', 'obat batuk', 'komix', 'obh', 'tolak angin', 'antangin',
    'betadine', 'perban', 'plester', 'hansaplast', 'minyak kayu putih', 'kayu putih', 'minyak telon', 'freshcare', 'counterpain', 'balsem', 'salonpas',
    'tes darah', 'lab', 'laboratorium', 'rontgen', 'usg', 'cek darah', 'kolesterol', 'asam urat', 'gula darah', 'tensi', 'swab', 'antigen',
    'dokter gigi', 'tambal gigi', 'cabut gigi', 'scaling gigi', 'karang gigi', 'behel',
    'optik', 'periksa mata', 'kacamata minus', 'softlens',
    'fisioterapi', 'terapi medis', 'vaksin', 'imunisasi'
  ],
  entertainment: [
    'nonton', 'bioskop', 'cinema', 'cgv', 'xxi', 'cinepolis', 'movie', 'film', 'tiket nonton',
    'game', 'gaming', 'steam', 'playstation', 'ps', 'ps4', 'ps5', 'rental ps', 'nintendo', 'switch', 'xbox',
    'top up game', 'topup game', 'topup diamond', 'diamond ml', 'robux', 'voucher game', 'mlbb', 'mobile legends', 'free fire', 'ff', 'pubg', 'genshin', 'valorant',
    'konser', 'festival', 'tiket konser', 'event', 'pameran', 'museum',
    'wisata', 'liburan', 'rekreasi', 'jalan-jalan', 'tamanya', 'piknik', 'pantai', 'gunung', 'curug', 'camping', 'waterpark', 'dufan', 'ancol', 'tmii', 'zoo',
    'staycation', 'hotel', 'villa', 'resort', 'penginapan', 'homestay', 'airbnb',
    'hobi', 'mainan', 'gundam', 'diecast', 'action figure', 'lego', 'komik', 'manga', 'anime',
    'karaoke', 'biliar', 'billiard', 'bowling', 'arcade', 'timezone',
    'futsal', 'sepak bola', 'badminton', 'bulu tangkis', 'tenis', 'tenis meja', 'pingpong', 'gym', 'fitness', 'sewa lapangan', 'yoga', 'renang'
  ],
  education: [
    'buku', 'buku tulis', 'buku pelajaran', 'buku cetak', 'novel', 'komik edukasi', 'kamus',
    'gramedia', 'periplus', 'togamas', 'toko buku',
    'atk', 'alat tulis', 'pulpen', 'pensil', 'penghapus', 'penggaris', 'spidol', 'tipp-ex', 'binder', 'kertas', 'hvs', 'map',
    'fotocopy', 'fotokopi', 'foto copy', 'print', 'cetak skripsi', 'jilid', 'laminating',
    'spp', 'iuran sekolah', 'uang sekolah', 'uang semester', 'ukt', 'uang kuliah', 'daftar ulang', 'skripsi', 'wisuda',
    'kursus', 'les', 'bimbel', 'privat', 'kumon', 'ruangguru', 'kelas online', 'bootcamp', 'sertifikasi', 'toefl', 'ielts', 'seminar', 'webinar', 'workshop', 'pelatihan'
  ],
  others: [
    'potong rambut', 'pangkas rambut', 'cukur', 'barbershop', 'salon', 'creambath', 'facial', 'lulur', 'pijat', 'urut', 'massage', 'spa', 'refleksi',
    'skincare', 'serum', 'sunblock', 'sunscreen', 'moisturizer', 'facial wash', 'toner', 'lipstik', 'bedak', 'make up', 'makeup', 'kosmetik',
    'laundry', 'cuci baju', 'setrika', 'laundry kiloan', 'cuci sepatu',
    'sedekah', 'infaq', 'zakat', 'donasi', 'sumbangan', 'amal', 'kotak amal', 'celengan', 'panti asuhan',
    'kondangan', 'amplop nikahan', 'kado', 'hadiah', 'angpao', 'hampers',
    'uang jajan adik', 'kirim uang ortu', 'transfer ortu', 'uang bulanan ortu', 'nafkah', 'uang saku', 'sangu',
    'tip', 'uang tip', 'tips',
    'biaya admin', 'admin bank', 'biaya transfer', 'materai',
    'rokok', 'vape', 'pods', 'liquid', 'surya', 'sampoerna', 'marlboro',
    'makanan kucing', 'cat food', 'whiskas', 'pasir kucing', 'petshop', 'dokter hewan', 'dog food'
  ]
};

class AiService {
  /**
   * Ambil default Groq API Key dari environment variables (.env)
   */
  getDefaultEnvApiKey(): string {
    const envKey = (import.meta as any).env?.VITE_GROQ_API_KEY || '';
    return typeof envKey === 'string' ? envKey.trim() : '';
  }

  /**
   * Ambil Groq API Key kustom yang disimpan pengguna di localStorage
   */
  getUserApiKey(): string {
    if (typeof window === 'undefined') return '';
    return (localStorage.getItem(STORAGE_KEY_GROQ_KEY) || '').trim();
  }

  /**
   * Ambil Groq API Key efektif:
   * Prioritas 1: Kunci pribadi di localStorage
   * Prioritas 2: Default kunci dari environment variable (.env)
   */
  getApiKey(): string {
    const userKey = this.getUserApiKey();
    if (userKey) return userKey;
    return this.getDefaultEnvApiKey();
  }

  /**
   * Simpan Groq API Key ke localStorage
   */
  saveApiKey(key: string): void {
    if (typeof window === 'undefined') return;
    const cleanKey = key.trim();
    if (cleanKey) {
      localStorage.setItem(STORAGE_KEY_GROQ_KEY, cleanKey);
    } else {
      localStorage.removeItem(STORAGE_KEY_GROQ_KEY);
    }
  }

  /**
   * Hapus API Key dari localStorage
   */
  removeApiKey(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY_GROQ_KEY);
  }

  /**
   * Cek apakah API Key sudah terpasang (baik kustom maupun default .env)
   */
  hasApiKey(): boolean {
    return Boolean(this.getApiKey());
  }

  /**
   * Cek apakah saat ini menggunakan default API key dari .env
   */
  isUsingEnvApiKey(): boolean {
    return !this.getUserApiKey() && Boolean(this.getDefaultEnvApiKey());
  }

  /**
   * Cek apakah ada default API key di .env
   */
  hasDefaultEnvApiKey(): boolean {
    return Boolean(this.getDefaultEnvApiKey());
  }

  /**
   * Helper request fetch dengan fallback ganda (Vite/Vercel Proxy -> Direct API)
   * Mengatasi pembatasan browser CORS secara tuntas
   */
  private async fetchGroqChat(
    apiKey: string,
    payload: Record<string, any>
  ): Promise<Response> {
    const endpoints: string[] = [];

    // Jika berjalan di browser web, utamakan endpoint proxy internal untuk bypass CORS
    if (typeof window !== 'undefined' && !window.location.protocol.startsWith('capacitor')) {
      endpoints.push('/groq-api/openai/v1/chat/completions');
    }
    // Direct endpoint sebagai fallback
    endpoints.push('https://api.groq.com/openai/v1/chat/completions');

    let lastError: any = null;

    for (const url of endpoints) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(payload),
        });

        // Jika endpoint proxy 404 (misal static preview tanpa server proxy), coba direct
        if (res.status === 404 && url.startsWith('/groq-api')) {
          continue;
        }

        return res;
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError || new Error('Gagal terhubung ke layanan Groq');
  }

  /**
   * Uji apakah API Key valid dengan request ping ringan ke Groq
   */
  async testApiKey(keyToTest?: string): Promise<{ success: boolean; message: string }> {
    const key = (keyToTest || this.getApiKey()).trim();
    if (!key) {
      return { success: false, message: 'Kunci API belum diisi' };
    }

    try {
      const res = await this.fetchGroqChat(key, {
        model: GROQ_MODEL_ID,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 5,
      });

      if (res.ok) {
        return {
          success: true,
          message: 'Koneksi Groq AI berhasil! Model openai/gpt-oss-120b siap digunakan.',
        };
      }

      const errData = await res.json().catch(() => null);
      const detail = errData?.error?.message || `HTTP ${res.status} ${res.statusText}`;

      if (res.status === 401) {
        return {
          success: false,
          message: `Kunci API tidak valid (Groq 401: Invalid API Key). Pastikan Anda menyalin seluruh teks kunci gsk_...`,
        };
      }

      return {
        success: false,
        message: `Groq Error (${res.status}): ${detail}`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Gagal menghubungi Groq: ${err?.message || 'Periksa koneksi internet'}`,
      };
    }
  }

  /**
   * Pemecah kategori cerdas yang memvalidasi ID dari AI, memprioritaskan kategori kustom pengguna,
   * atau menebak kategori secara semantik
   */
  resolveCategory(
    suggestedId: string | undefined,
    itemText: string,
    categories: CategoryRef[]
  ): string {
    if (!categories || categories.length === 0) return 'cat-others';

    const textClean = (itemText || '').toLowerCase().trim();

    // Pisahkan kategori kustom pengguna (non-default) dari kategori bawaan
    const customCategories = categories.filter(
      (c) => !DEFAULT_CATEGORY_IDS.has(c.id) || c.isDefault === false
    );

    // 1. PRIORITAS 1: Cek domain khusus untuk kategori kustom pengguna (misal Kucing, Zakat/Sedekah, Investasi, Gym, Skincare, dll.)
    if (customCategories.length > 0) {
      for (const rule of CUSTOM_CATEGORY_DOMAIN_RULES) {
        const matchedCustomCat = customCategories.find((c) => rule.pattern.test(c.name));
        if (matchedCustomCat) {
          for (const kw of rule.keywords) {
            const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`(?:^|\\s|,|\\.)${escaped}(?:$|\\s|,|\\.)`, 'i');
            if (regex.test(textClean) || textClean.includes(kw)) {
              return matchedCustomCat.id;
            }
          }
        }
      }

      // 2. PRIORITAS 2: Pencocokan kata (token matching) pada nama kategori kustom
      const stopWords = new Set(['dan', 'atau', 'serta', 'yg', 'yang', 'of', 'and', 'the', 'in', 'for', '&', '/', '-']);
      let bestCustomTokenCat: string | null = null;
      let maxCustomTokenScore = 0;

      for (const cat of customCategories) {
        const rawTokens = cat.name.toLowerCase().split(/[\s&/,-]+/);
        const tokens = rawTokens.filter((t) => t.length >= 3 && !stopWords.has(t));
        let catScore = 0;

        for (const token of tokens) {
          const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`(?:^|\\s|,|\\.)${escaped}(?:$|\\s|,|\\.)`, 'i');
          if (regex.test(textClean) || textClean.includes(token)) {
            catScore += token.length * 2;
          }
        }

        if (catScore > maxCustomTokenScore) {
          maxCustomTokenScore = catScore;
          bestCustomTokenCat = cat.id;
        }
      }

      if (bestCustomTokenCat && maxCustomTokenScore >= 6) {
        return bestCustomTokenCat;
      }
    }

    // 3. PRIORITAS 3: Pencocokan langsung nama lengkap semua kategori
    for (const cat of categories) {
      const name = cat.name.toLowerCase().trim();
      if (name.length >= 3) {
        const regex = new RegExp(`(?:^|\\s|,|\\.)${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:$|\\s|,|\\.)`, 'i');
        if (regex.test(textClean) || textClean.includes(name)) {
          return cat.id;
        }
      }
    }

    // 4. PRIORITAS 4: Jika ada suggestedId dari AI, lakukan validasi & resolusi ID
    if (suggestedId) {
      const cleanSuggested = suggestedId.trim();
      // Cocok langsung dengan id spesifik (bukan cat-others)
      const exactId = categories.find((c) => c.id === cleanSuggested);
      if (exactId && cleanSuggested !== 'cat-others' && !/lain|other/i.test(exactId.name)) {
        return exactId.id;
      }

      // Cocok dengan nama kategori spesifik (bukan kategori lain-lain)
      const byName = categories.find(
        (c) => c.name.toLowerCase().trim() === cleanSuggested.toLowerCase()
      );
      if (byName && byName.id !== 'cat-others' && !/lain|other/i.test(byName.name)) {
        return byName.id;
      }

      // Cocok dengan kemiripan slug spesifik
      const bySlug = categories.find(
        (c) =>
          (c.id.toLowerCase().includes(cleanSuggested.toLowerCase()) ||
          cleanSuggested.toLowerCase().includes(c.id.toLowerCase())) &&
          c.id !== 'cat-others'
      );
      if (bySlug && !/lain|other/i.test(bySlug.name)) {
        return bySlug.id;
      }
    }

    // 5. PRIORITAS 5: Pencocokan semantik standar berdasarkan kamus kata kunci 8 arketipe bawaan
    let bestArchetype: keyof typeof SEMANTIC_CATEGORY_KEYWORDS | null = null;
    let maxScore = 0;

    for (const [archetype, words] of Object.entries(SEMANTIC_CATEGORY_KEYWORDS)) {
      let score = 0;
      for (const w of words) {
        const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(?:^|\\s|,|\\.)${escaped}(?:$|\\s|,|\\.)`, 'i');
        if (regex.test(textClean) || textClean.includes(w)) {
          score += w.length; // Kata kunci yang lebih spesifik/panjang mendapat bobot lebih tinggi
        }
      }
      if (score > maxScore) {
        maxScore = score;
        bestArchetype = archetype as keyof typeof SEMANTIC_CATEGORY_KEYWORDS;
      }
    }

    if (bestArchetype && maxScore > 0) {
      const archetypePatterns: Record<string, RegExp> = {
        food: /food|makan|minum|kuliner|konsumsi/i,
        transport: /transport|bensin|kendaraan|ojol|perjalanan/i,
        bills: /bill|tagihan|utilitas|listrik|air|pulsa|internet|sewa|kos/i,
        shopping: /shop|belanja|kebutuhan|barang/i,
        health: /health|sehat|obat|medis|dokter/i,
        entertainment: /entertain|hibur|hobi|game|wisata|rekreasi/i,
        education: /educat|edukasi|buku|sekolah|kuliah|kursus/i,
        others: /other|lain|umum|personal|sosial|misc/i,
      };

      const pattern = archetypePatterns[bestArchetype];
      if (pattern) {
        const matched = categories.find(
          (c) => pattern.test(c.id) || pattern.test(c.name)
        );
        if (matched) return matched.id;
      }
    }

    // 6. Jika AI menyarankan ID dan valid (termasuk cat-others jika memang tidak cocok kategori lain)
    if (suggestedId) {
      const cleanSuggested = suggestedId.trim();
      const exact = categories.find((c) => c.id === cleanSuggested);
      if (exact) return exact.id;
      const byName = categories.find((c) => c.name.toLowerCase().trim() === cleanSuggested.toLowerCase());
      if (byName) return byName.id;
    }

    // 7. Default fallback: UTAMAKAN kategori "Lain-lain" / "Others", JANGAN pernah ke "cat-food"
    const othersCat = categories.find(
      (c) => c.id === 'cat-others' || /lain|other|umum|general|misc|sisa/i.test(c.name)
    );
    return othersCat?.id || categories[categories.length - 1]?.id || categories[0]?.id;
  }

  /**
   * Ekstrak satu atau banyak transaksi sekaligus menggunakan Groq AI dengan fallback berjenjang
   */
  async parseNaturalTransactions(
    text: string,
    categories: CategoryRef[]
  ): Promise<ParsedTransactionResult[]> {
    const key = this.getApiKey();
    const cleanInput = text.trim();
    if (!cleanInput) return [];

    const nowIso = new Date().toISOString();

    // Jika ada API Key, coba panggil Groq AI
    if (key) {
      const categoriesJson = JSON.stringify(
        categories.map((c) => ({ id: c.id, name: c.name }))
      );

      const systemPrompt = `You are a strict, ultra-fast financial transaction extractor for the DuIt expense tracker app.
Extract ALL distinct expenses mentioned in the user statement (e.g. "bakso 10k, bensin 30k, mie ayam 7k" -> 3 separate items).

Output MUST be a valid JSON object matching this schema:
{
  "transactions": [
    {
      "amount": 25000,
      "categoryId": "cat-food",
      "notes": "Bakso",
      "paymentMethod": "Tunai",
      "dateIso": "${nowIso}"
    }
  ]
}

Available user categories (Use ONLY these exact category "id" values):
${categoriesJson}

Available payment methods:
["Tunai", "E-Wallet", "Transfer Bank", "Kartu Debit", "Kartu Kredit", "Lainnya"]

Rules:
1. Extract ALL distinct expenses mentioned in the user statement (e.g. "bakso 10k, bensin 30k, mie ayam 7k" -> 3 separate items).
2. Convert all Indonesian / English amounts to integer:
   - "10k" / "10rb" / "sepuluh ribu" -> 10000
   - "30k" / "30rb" -> 30000
   - "15.000" / "15 rb" -> 15000
   - "1.5jt" / "1,5 juta" -> 1500000
   - "7k" / "7rb" -> 7000
3. DEFAULT paymentMethod is ALWAYS "Tunai", UNLESS the user explicitly states another payment method (e.g. "qris", "bca", "transfer", "kartu debit", "gopay", "ovo", "dana", "kartu kredit").
4. "categoryId" MUST be the exact "id" string from the available categories list above.
   CRITICAL PRIORITY: If the user has defined CUSTOM categories in the available list (e.g. for Investment/Investasi/Saham, Charity/Zakat/Sedekah, Pets/Kucing/Hewan, Sports/Gym/Fitness, Skincare/Perawatan, Children/Family, Smoking/Rokok, etc.), ALWAYS prioritize assigning the item to that custom category ID!
   GENERAL GUIDELINES:
   - Pulsa, kuota, paket data, wifi, listrik/pln, air/pdam, sewa kos/kontrakan, cicilan -> pick bills/tagihan category (e.g. "cat-bills")
   - Servis motor/mobil, ganti oli, cuci motor/mobil, bensin/pertalite/pertamax, parkir, tol, ojol/gojek/grab -> pick transport category (e.g. "cat-transport")
   - Sabun, detergen, odol, sampo, shampo, sembako, beras, minyak, galon, baju, celana, sepatu, tas, belanja supermarket/minimarket/online -> pick shopping category (e.g. "cat-shopping")
   - Makanan, minuman, kopi, cemilan, makan siang, nasi, resto, cafe -> pick food category (e.g. "cat-food")
   - Bioskop, nonton film, game, topup diamond, futsal, wisata, liburan -> pick entertainment category (e.g. "cat-entertainment")
   - Obat, vitamin, apotek, dokter, klinik, periksa kesehatan -> pick health category (e.g. "cat-health")
   - Buku, atk, spp, les, kuliah, kursus -> pick education category (e.g. "cat-education")
   - Sedekah, zakat, infaq, laundry, potong rambut/cukur, salon, skincare, kado, biaya admin bank -> pick others/lain-lain category (e.g. "cat-others" unless a custom category exists)
   - DO NOT return category name, DO NOT invent new IDs.
5. "notes": Clean item or merchant name (Capitalize first letter, e.g. "Bakso", "Bensin", "Mie ayam").
6. "dateIso": Use "${nowIso}" unless relative dates like "kemarin" or "tadi pagi" are mentioned.`;

      // Coba model utama, jika gagal atau rate limit coba model cadangan
      const modelsToTry = [GROQ_MODEL_ID, GROQ_FALLBACK_MODEL_ID];

      for (const model of modelsToTry) {
        try {
          const response = await this.fetchGroqChat(key, {
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: cleanInput },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.1,
            max_tokens: 600,
          });

          if (response.ok) {
            const data = await response.json();
            const content = data.choices?.[0]?.message?.content;
            if (content) {
              const parsed = JSON.parse(content);
              const items: any[] = Array.isArray(parsed.transactions)
                ? parsed.transactions
                : Array.isArray(parsed)
                  ? parsed
                  : [parsed];

              const validResults: ParsedTransactionResult[] = items
                .filter((item) => item && typeof item.amount === 'number' && item.amount > 0)
                .map((item) => ({
                  amount: Math.round(item.amount),
                  categoryId: this.resolveCategory(item.categoryId, item.notes || cleanInput, categories),
                  notes: (item.notes || 'Pengeluaran').trim(),
                  paymentMethod: (item.paymentMethod || 'Tunai') as PaymentMethodType,
                  dateIso: item.dateIso || nowIso,
                }));

              if (validResults.length > 0) {
                return validResults;
              }
            }
          } else {
            const errData = await response.json().catch(() => null);
            console.warn(`[AiService] Groq API model ${model} error:`, errData || response.status);
            // Jika 429 atau error sementara, lanjut coba model berikutnya
          }
        } catch (err) {
          console.warn(`[AiService] Groq API call failed for ${model}:`, err);
        }
      }
    }

    // Fallback: Local rule-based extraction (bekerja 100% offline & instan)
    return this.fallbackLocalParser(cleanInput, categories, nowIso);
  }

  /**
   * Helper parsing nominal Indonesia (mendukung titik ribuan 15.000, 1.5jt, 25rb, Rp 50.000, dll.)
   */
  private parseIndonesianAmount(text: string): { amount: number; matchedText: string } | null {
    // 1. Format dengan awalan 'Rp' (cth: Rp 50.000, Rp. 100k, Rp25000)
    const rpMatch = text.match(/rp\.?\s*([\d.,]+)\s*(k|rb|ribu|jt|juta)?\b/i);
    if (rpMatch) {
      const amt = this.calculateUnitAmount(rpMatch[1], (rpMatch[2] || '').toLowerCase());
      if (amt > 0) return { amount: amt, matchedText: rpMatch[0] };
    }

    // 2. Format dengan unit k/rb/ribu/jt/juta (cth: 10k, 25rb, 1.5jt, 50 ribu)
    const unitMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(k|rb|ribu|jt|juta)\b/i);
    if (unitMatch) {
      const amt = this.calculateUnitAmount(unitMatch[1], unitMatch[2].toLowerCase());
      if (amt > 0) return { amount: amt, matchedText: unitMatch[0] };
    }

    // 3. Format titik ribuan standar Indonesia (cth: 25.000, 150.000, 1.500.000)
    const dotThousandsMatch = text.match(/\b(\d{1,3}(?:\.\d{3})+)\b/);
    if (dotThousandsMatch) {
      const clean = dotThousandsMatch[1].replace(/\./g, '');
      const amt = parseInt(clean, 10);
      if (!isNaN(amt) && amt > 0) return { amount: amt, matchedText: dotThousandsMatch[0] };
    }

    // 4. Format koma ribuan atau angka bulat biasa (cth: 25,000 atau 25000)
    const plainMatch = text.match(/\b(\d{1,3}(?:,\d{3})+|\d+)\b/);
    if (plainMatch) {
      const clean = plainMatch[1].replace(/,/g, '');
      const amt = parseInt(clean, 10);
      if (!isNaN(amt) && amt > 0) return { amount: amt, matchedText: plainMatch[0] };
    }

    return null;
  }

  private calculateUnitAmount(rawNum: string, unit: string): number {
    if (unit === 'jt' || unit === 'juta') {
      const val = parseFloat(rawNum.replace(',', '.'));
      return Math.round(val * 1000000);
    }
    if (unit === 'k' || unit === 'rb' || unit === 'ribu') {
      const val = parseFloat(rawNum.replace(',', '.'));
      return Math.round(val * 1000);
    }
    // Jika ada titik ribuan pada angka tanpa unit
    if (rawNum.includes('.')) {
      const parts = rawNum.split('.');
      if (parts.slice(1).every((p) => p.length === 3)) {
        return parseInt(rawNum.replace(/\./g, ''), 10);
      }
    }
    return Math.round(parseFloat(rawNum.replace(',', '.')));
  }

  /**
   * Parser lokal regex fallback cerdas jika offline atau jaringan terkendala
   */
  private fallbackLocalParser(
    input: string,
    categories: CategoryRef[],
    nowIso: string
  ): ParsedTransactionResult[] {
    // 1. Coba split berdasarkan koma, titik koma, baris baru, atau kata "dan"
    let segments = input
      .split(/[,;\n]|\bdan\b/i)
      .map((s) => s.trim())
      .filter(Boolean);

    // 2. Jika hanya 1 segmen namun terdapat beberapa nominal (cth: "bakso 10k bensin 30k mie ayam 7k")
    if (segments.length <= 1) {
      const amountRegex = /(\d+(?:[.,]\d+)?\s*(?:k|rb|ribu|jt|juta)\b|rp\.?\s*[\d.,]+|\b\d{1,3}(?:\.\d{3})+\b)/gi;
      const matches = [...input.matchAll(amountRegex)];
      if (matches.length > 1) {
        segments = [];
        let lastIndex = 0;
        for (const m of matches) {
          const endIndex = (m.index ?? 0) + m[0].length;
          const chunk = input.slice(lastIndex, endIndex).trim();
          if (chunk) segments.push(chunk);
          lastIndex = endIndex;
        }
        const remainder = input.slice(lastIndex).trim();
        if (remainder && segments.length > 0) {
          segments[segments.length - 1] += ' ' + remainder;
        }
      }
    }

    const results: ParsedTransactionResult[] = [];

    for (const seg of segments) {
      const parsedAmount = this.parseIndonesianAmount(seg);
      if (!parsedAmount || parsedAmount.amount <= 0) continue;

      const amount = parsedAmount.amount;

      // Bersihkan teks catatan dari nominal dan kata sambung / metode pembayaran
      const notesClean = seg
        .replace(parsedAmount.matchedText, '')
        .replace(/\b(bayar|pake|pakai|via|beli|buat|untuk|qris|debit|transfer|bca|mandiri|bri|bni|gopay|ovo|dana|wallet|kredit|cash|tunai)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

      const notes = notesClean
        ? notesClean.charAt(0).toUpperCase() + notesClean.slice(1)
        : 'Pengeluaran';

      // Default pembayaran adalah Tunai, kecuali disebutkan khusus
      let paymentMethod: PaymentMethodType = 'Tunai';
      const segLower = seg.toLowerCase();
      if (
        segLower.includes('qris') ||
        segLower.includes('gopay') ||
        segLower.includes('ovo') ||
        segLower.includes('dana') ||
        segLower.includes('shopee') ||
        segLower.includes('spay') ||
        segLower.includes('linkaja') ||
        segLower.includes('wallet')
      ) {
        paymentMethod = 'E-Wallet';
      } else if (segLower.includes('debit') || segLower.includes('atm')) {
        paymentMethod = 'Kartu Debit';
      } else if (
        segLower.includes('transfer') ||
        segLower.includes('tf') ||
        segLower.includes('bca') ||
        segLower.includes('mandiri') ||
        segLower.includes('bni') ||
        segLower.includes('bri') ||
        segLower.includes('seabank') ||
        segLower.includes('jago') ||
        segLower.includes('cimb')
      ) {
        paymentMethod = 'Transfer Bank';
      } else if (
        segLower.includes('kredit') ||
        segLower.includes('cc') ||
        segLower.includes('paylater') ||
        segLower.includes('kredivo') ||
        segLower.includes('akulaku')
      ) {
        paymentMethod = 'Kartu Kredit';
      }

      // Deteksi kategori otomatis menggunakan resolver semantik yang akurat
      const categoryId = this.resolveCategory(undefined, seg, categories);

      results.push({
        amount,
        categoryId,
        notes,
        paymentMethod,
        dateIso: nowIso,
      });
    }

    return results;
  }

  /**
   * Cek dukungan Web Speech Recognition di peramban
   */
  isSpeechSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean(
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    );
  }

  /**
   * Buat instance SpeechRecognition dengan bahasa Indonesia
   */
  createSpeechRecognizer(
    onResult: (transcript: string) => void,
    onError: (err: any) => void,
    onEnd: () => void,
    lang: string = 'id-ID'
  ): any | null {
    if (!this.isSpeechSupported()) return null;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    const recognizer = new SpeechRecognition();
    recognizer.lang = lang;
    recognizer.continuous = false;
    recognizer.interimResults = false;

    recognizer.onresult = (event: any) => {
      const last = event.results.length - 1;
      const text = event.results[last]?.[0]?.transcript || '';
      onResult(text);
    };

    recognizer.onerror = (event: any) => {
      onError(event);
    };

    recognizer.onend = () => {
      onEnd();
    };

    return recognizer;
  }
}

export const aiService = new AiService();
