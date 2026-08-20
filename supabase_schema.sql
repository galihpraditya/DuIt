-- ==============================================================================
-- SUPABASE SCHEMA UNTUK DUIT EXPENSE TRACKER
-- Salin seluruh isi skrip ini dan jalankan di menu: SQL Editor di Dashboard Supabase
-- ==============================================================================

-- 1. EXTENSION UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABEL PROFIL PENGGUNA (PROFILES)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABEL KATEGORI (CATEGORIES)
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  budget_limit NUMERIC DEFAULT 0,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABEL TRANSAKSI (TRANSACTIONS)
CREATE TABLE IF NOT EXISTS public.transactions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL,
  date TEXT NOT NULL,
  category_id TEXT NOT NULL,
  notes TEXT,
  payment_method TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABEL ANGGARAN (BUDGETS)
CREATE TABLE IF NOT EXISTS public.budgets (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id TEXT,
  amount NUMERIC NOT NULL,
  month TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABEL PENGELUARAN BERULANG (RECURRING EXPENSES)
CREATE TABLE IF NOT EXISTS public.recurring_expenses (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  category_id TEXT NOT NULL,
  frequency TEXT NOT NULL,
  next_due_date TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- KEAMANAN: AKTIFKAN ROW LEVEL SECURITY (RLS) DI SEMUA TABEL
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_expenses ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- POLICIES UNTUK PROFILES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Profiles Select Policy" ON public.profiles;
CREATE POLICY "Profiles Select Policy" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Profiles Insert Policy" ON public.profiles;
CREATE POLICY "Profiles Insert Policy" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Profiles Update Policy" ON public.profiles;
CREATE POLICY "Profiles Update Policy" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- POLICIES UNTUK CATEGORIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Categories Access Policy" ON public.categories;
CREATE POLICY "Categories Access Policy" ON public.categories FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- POLICIES UNTUK TRANSACTIONS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Transactions Access Policy" ON public.transactions;
CREATE POLICY "Transactions Access Policy" ON public.transactions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- POLICIES UNTUK BUDGETS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Budgets Access Policy" ON public.budgets;
CREATE POLICY "Budgets Access Policy" ON public.budgets FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- POLICIES UNTUK RECURRING EXPENSES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Recurring Access Policy" ON public.recurring_expenses;
CREATE POLICY "Recurring Access Policy" ON public.recurring_expenses FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Trigger otomatis untuk membuat profile saat user baru mendaftar di auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, created_at)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)), NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- FUNGSI UNTUK MENGHAPUS AKUN (DIPANGGIL VIA RPC DARI APLIKASI)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION delete_user()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  -- Menghapus akun user yang memanggil fungsi ini dari auth.users
  -- Tabel profiles dan data lain akan otomatis terhapus karena ON DELETE CASCADE
  DELETE FROM auth.users WHERE id = auth.uid();
$$;
