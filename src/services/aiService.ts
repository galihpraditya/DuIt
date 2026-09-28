import type { PaymentMethodType } from '../types';

const STORAGE_KEY_GROQ_KEY = 'duit_groq_api_key';
export const GROQ_MODEL_ID = 'openai/gpt-oss-120b';

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
}

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
   * Ekstrak satu atau banyak transaksi sekaligus menggunakan Groq AI (openai/gpt-oss-120b)
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
      "categoryId": "cat-id",
      "notes": "Description",
      "paymentMethod": "Tunai",
      "dateIso": "${nowIso}"
    }
  ]
}

Available user categories:
${categoriesJson}

Available payment methods:
["Tunai", "E-Wallet", "Transfer Bank", "Kartu Debit", "Kartu Kredit", "Lainnya"]

Rules:
1. Extract ALL distinct expenses mentioned in the user statement (e.g. "bakso 10k, bensin 30k, mie ayam 7k" -> 3 separate items).
2. Convert all colloquial Indonesian / English amounts to integer:
   - "10k" / "10rb" / "sepuluh ribu" -> 10000
   - "30k" / "30rb" -> 30000
   - "1.5jt" / "1,5 juta" -> 1500000
   - "7k" / "7rb" -> 7000
3. DEFAULT paymentMethod is ALWAYS "Tunai", UNLESS the user explicitly states another payment method (e.g. "qris", "bca", "transfer", "kartu debit", "gopay", "kartu kredit").
4. "categoryId": Pick the closest category ID from the available categories list for each item.
5. "notes": Clean item or merchant name (Capitalize first letter, e.g. "Bakso", "Bensin", "Mie ayam").
6. "dateIso": Use "${nowIso}" unless relative dates like "kemarin" or "tadi pagi" are mentioned.`;

      try {
        const response = await this.fetchGroqChat(key, {
          model: GROQ_MODEL_ID,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: cleanInput },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1,
          max_tokens: 1000,
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
                categoryId: item.categoryId || categories[0]?.id || 'cat-others',
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
          console.warn('[AiService] Groq API returned error:', errData || response.status);
        }
      } catch (err) {
        console.warn('[AiService] Groq API call failed or offline, falling back to local parser:', err);
      }
    }

    // Fallback: Local rule-based extraction (bekerja 100% offline & instan)
    return this.fallbackLocalParser(cleanInput, categories, nowIso);
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
      const amountRegex = /(\d+(?:[.,]\d+)?\s*(?:k|rb|ribu|jt|juta)\b|rp\.?\s*\d+(?:[.,]\d+)?)/gi;
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
      // Cari nominal: 10k, 25rb, 50.000, 1.5jt, dll.
      const match = seg.match(
        /(\d+(?:[.,]\d+)?)\s*(k|rb|ribu|jt|juta)?\b|rp\.?\s*(\d+(?:[.,]\d+)?)/i
      );
      if (!match) continue;

      let amount = 0;
      if (match[3]) {
        // Format Rp 25.000
        amount = parseInt(match[3].replace(/[.,]/g, ''), 10);
      } else if (match[1]) {
        const num = parseFloat(match[1].replace(',', '.'));
        const unit = (match[2] || '').toLowerCase();
        if (unit === 'k' || unit === 'rb' || unit === 'ribu') {
          amount = Math.round(num * 1000);
        } else if (unit === 'jt' || unit === 'juta') {
          amount = Math.round(num * 1000000);
        } else if (num < 1000 && (seg.toLowerCase().includes('k') || seg.toLowerCase().includes('rb'))) {
          amount = Math.round(num * 1000);
        } else {
          amount = Math.round(num);
        }
      }

      if (!amount || isNaN(amount) || amount <= 0) continue;

      // Bersihkan teks catatan dari kata sambung dan kata metode pembayaran
      const notesClean = seg
        .replace(match[0], '')
        .replace(/\b(bayar|pake|pakai|via|beli|buat|untuk|qris|debit|transfer|bca|mandiri|gopay|ovo|dana|wallet|kredit|cash|tunai)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

      const notes = notesClean
        ? notesClean.charAt(0).toUpperCase() + notesClean.slice(1)
        : 'Pengeluaran';

      // Default pembayaran adalah Tunai, kecuali disebutkan khusus
      let paymentMethod: PaymentMethodType = 'Tunai';
      const segLower = seg.toLowerCase();
      if (segLower.includes('qris') || segLower.includes('debit')) {
        paymentMethod = 'Kartu Debit';
      } else if (segLower.includes('transfer') || segLower.includes('bca') || segLower.includes('mandiri')) {
        paymentMethod = 'Transfer Bank';
      } else if (segLower.includes('gopay') || segLower.includes('ovo') || segLower.includes('dana') || segLower.includes('wallet')) {
        paymentMethod = 'E-Wallet';
      } else if (segLower.includes('kredit')) {
        paymentMethod = 'Kartu Kredit';
      }

      // Deteksi kategori otomatis berdasarkan kata kunci
      let categoryId = categories[0]?.id || 'cat-food';
      const foodKeywords = ['makan', 'bakso', 'mie', 'nasi', 'kopi', 'sate', 'ayam', 'roti', 'snack', 'minum', 'soto'];
      const transportKeywords = ['bensin', 'pertalite', 'pertamax', 'parkir', 'tol', 'gojek', 'grab', 'ojol'];
      const billKeywords = ['listrik', 'pln', 'wifi', 'pulsa', 'air', 'pdam', 'kuota', 'tagihan'];

      if (foodKeywords.some((k) => segLower.includes(k))) {
        const found = categories.find((c) => c.name.toLowerCase().includes('makan') || c.id.includes('food'));
        if (found) categoryId = found.id;
      } else if (transportKeywords.some((k) => segLower.includes(k))) {
        const found = categories.find((c) => c.name.toLowerCase().includes('transport') || c.id.includes('transport'));
        if (found) categoryId = found.id;
      } else if (billKeywords.some((k) => segLower.includes(k))) {
        const found = categories.find((c) => c.name.toLowerCase().includes('tagihan') || c.id.includes('bills'));
        if (found) categoryId = found.id;
      }

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
    onEnd: () => void
  ): any | null {
    if (!this.isSpeechSupported()) return null;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    const recognizer = new SpeechRecognition();
    recognizer.lang = 'id-ID';
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
