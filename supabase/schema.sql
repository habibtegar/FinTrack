-- ==============================================================================
-- FINTRACK - SKEMA DATABASE SUPABASE (POSTGRESQL)
-- ==============================================================================
-- Skema ini dirancang untuk mendukung penuh fitur FinTrack:
-- 1. profiles                : Data profil, preferensi tampilan, dan batas finansial pengguna.
-- 2. categories              : Kategori transaksi (pemasukan/pengeluaran) dengan warna dan ikon.
-- 3. transactions            : Catatan transaksi keuangan dengan nominal, tipe, dan tanggal.
-- 4. budgets                 : Alokasi batas anggaran bulanan per kategori atau keseluruhan.
-- 5. savings_goals           : Target pencapaian akumulasi tabungan dan status progres.
-- 6. recurring_transactions  : Transaksi berulang otomatis (harian, mingguan, bulanan, tahunan).
--
-- Keamanan:
-- - Primary Key menggunakan UUID (gen_random_uuid()).
-- - Setiap data terhubung langsung dengan auth.users(id) melalui user_id.
-- - Foreign Key dengan CASCADE untuk integritas relasional saat akun dihapus.
-- - Row Level Security (RLS) AKTIF di setiap tabel.
-- - Policy RLS granular (SELECT, INSERT, UPDATE, DELETE) menjamin isolasi data 100%.
-- ==============================================================================

-- Aktifkan ekstensi UUID jika belum aktif
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. FUNGSI & TRIGGER BANTUAN
-- ==============================================================================

-- Fungsi otomatis untuk memperbarui kolom updated_at setiap ada perubahan baris
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 2. TABEL: PROFILES
-- Menyimpan informasi profil akun, preferensi mata uang, format tanggal, & tema
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  username TEXT UNIQUE,
  avatar TEXT,
  monthly_budget NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (monthly_budget >= 0),
  savings_goal_name TEXT DEFAULT 'Dana Darurat & Investasi',
  savings_goal_amount NUMERIC(15, 2) DEFAULT 0 CHECK (savings_goal_amount >= 0),
  currency TEXT NOT NULL DEFAULT 'IDR',
  currency_symbol TEXT NOT NULL DEFAULT 'Rp',
  date_format TEXT NOT NULL DEFAULT 'D MMMM YYYY',
  theme TEXT NOT NULL DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system')),
  language TEXT NOT NULL DEFAULT 'id' CHECK (language IN ('id', 'en')),
  financial_period_start_day SMALLINT NOT NULL DEFAULT 1 CHECK (financial_period_start_day BETWEEN 1 AND 31),
  notifications JSONB NOT NULL DEFAULT '{"transactionAlerts": true, "budgetWarning": true, "savingsGoalAlert": true, "monthlySummary": true}'::jsonB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger updated_at untuk profiles
DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Fungsi & trigger untuk membuat profil otomatis saat pengguna baru mendaftar di Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    name,
    email,
    username,
    avatar,
    monthly_budget,
    savings_goal_name,
    savings_goal_amount
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar', UPPER(SUBSTRING(COALESCE(NEW.raw_user_meta_data->>'name', NEW.email) FROM 1 FOR 2))),
    9000000,
    'Dana Darurat & Investasi',
    35000000
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 3. TABEL: CATEGORIES
-- Menyimpan kategori pemasukan dan pengeluaran beserta ikon dan warna
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  color TEXT NOT NULL DEFAULT '#3478F6',
  icon TEXT NOT NULL DEFAULT 'Layers',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger updated_at untuk categories
DROP TRIGGER IF EXISTS trigger_categories_updated_at ON public.categories;
CREATE TRIGGER trigger_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 4. TABEL: TRANSACTIONS
-- Menyimpan riwayat transaksi finansial (pemasukan & pengeluaran)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  amount NUMERIC(15, 2) NOT NULL CHECK (amount >= 0),
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger updated_at untuk transactions
DROP TRIGGER IF EXISTS trigger_transactions_updated_at ON public.transactions;
CREATE TRIGGER trigger_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 5. TABEL: BUDGETS
-- Menyimpan batas anggaran belanja bulanan atau per kategori
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Batas Anggaran Bulanan',
  amount NUMERIC(15, 2) NOT NULL CHECK (amount >= 0),
  period TEXT NOT NULL DEFAULT 'monthly' CHECK (period IN ('daily', 'weekly', 'monthly', 'yearly')),
  month TEXT, -- Format: YYYY-MM untuk anggaran periode tertentu, NULL untuk default rutin
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger updated_at untuk budgets
DROP TRIGGER IF EXISTS trigger_budgets_updated_at ON public.budgets;
CREATE TRIGGER trigger_budgets_updated_at
  BEFORE UPDATE ON public.budgets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 6. TABEL: SAVINGS_GOALS
-- Menyimpan target akumulasi tabungan, target nominal, dan status pencapaian
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.savings_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount NUMERIC(15, 2) NOT NULL CHECK (target_amount > 0),
  current_amount NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
  target_date DATE,
  color TEXT DEFAULT '#3478F6',
  icon TEXT DEFAULT 'Target',
  is_completed BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger updated_at untuk savings_goals
DROP TRIGGER IF EXISTS trigger_savings_goals_updated_at ON public.savings_goals;
CREATE TRIGGER trigger_savings_goals_updated_at
  BEFORE UPDATE ON public.savings_goals
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 7. TABEL: RECURRING_TRANSACTIONS
-- Menyimpan transaksi berulang (gaji rutin, langganan internet, tagihan listrik, dll)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.recurring_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  amount NUMERIC(15, 2) NOT NULL CHECK (amount >= 0),
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'yearly')),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  next_run_date DATE,
  last_run_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger updated_at untuk recurring_transactions
DROP TRIGGER IF EXISTS trigger_recurring_transactions_updated_at ON public.recurring_transactions;
CREATE TRIGGER trigger_recurring_transactions_updated_at
  BEFORE UPDATE ON public.recurring_transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 8. INDEXING UNTUK OPTIMASI PERFORMA QUERY
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_type ON public.categories(type);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_type ON public.transactions(user_id, type);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON public.transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON public.budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_category_id ON public.budgets(category_id);
CREATE INDEX IF NOT EXISTS idx_savings_goals_user_id ON public.savings_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_user_id ON public.recurring_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_next_run ON public.recurring_transactions(next_run_date) WHERE is_active = true;

-- ==============================================================================
-- 9. ROW LEVEL SECURITY (RLS) & POLICIES
-- Memastikan setiap pengguna hanya dapat membaca, menambah, mengubah, dan menghapus
-- data miliknya sendiri secara terisolasi dan aman.
-- ==============================================================================

-- A. RLS: PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_delete_own"
  ON public.profiles FOR DELETE
  USING (auth.uid() = id);

-- B. RLS: CATEGORIES
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Pengguna dapat melihat kategori bawaan (is_default = true) atau kategori yang ia buat sendiri
CREATE POLICY "categories_select"
  ON public.categories FOR SELECT
  USING (auth.uid() = user_id OR is_default = true);

-- Pengguna hanya dapat menambahkan kategori untuk dirinya sendiri
CREATE POLICY "categories_insert_own"
  ON public.categories FOR INSERT
  WITH CHECK (auth.uid() = user_id AND is_default = false);

-- Pengguna hanya dapat mengubah kategori miliknya sendiri (bukan kategori sistem default)
CREATE POLICY "categories_update_own"
  ON public.categories FOR UPDATE
  USING (auth.uid() = user_id AND is_default = false)
  WITH CHECK (auth.uid() = user_id AND is_default = false);

-- Pengguna hanya dapat menghapus kategori miliknya sendiri (bukan kategori sistem default)
CREATE POLICY "categories_delete_own"
  ON public.categories FOR DELETE
  USING (auth.uid() = user_id AND is_default = false);

-- C. RLS: TRANSACTIONS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transactions_select_own"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "transactions_insert_own"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "transactions_update_own"
  ON public.transactions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "transactions_delete_own"
  ON public.transactions FOR DELETE
  USING (auth.uid() = user_id);

-- D. RLS: BUDGETS
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "budgets_select_own"
  ON public.budgets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "budgets_insert_own"
  ON public.budgets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "budgets_update_own"
  ON public.budgets FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "budgets_delete_own"
  ON public.budgets FOR DELETE
  USING (auth.uid() = user_id);

-- E. RLS: SAVINGS_GOALS
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "savings_goals_select_own"
  ON public.savings_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "savings_goals_insert_own"
  ON public.savings_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "savings_goals_update_own"
  ON public.savings_goals FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "savings_goals_delete_own"
  ON public.savings_goals FOR DELETE
  USING (auth.uid() = user_id);

-- F. RLS: RECURRING_TRANSACTIONS
ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recurring_transactions_select_own"
  ON public.recurring_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "recurring_transactions_insert_own"
  ON public.recurring_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "recurring_transactions_update_own"
  ON public.recurring_transactions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "recurring_transactions_delete_own"
  ON public.recurring_transactions FOR DELETE
  USING (auth.uid() = user_id);

-- ==============================================================================
-- 10. DATA INISIAL KATEGORI DEFAULT SISTEM (OPSIONAL / PRAKTIS)
-- Kategori umum yang langsung tersedia untuk seluruh pengguna
-- ==============================================================================
INSERT INTO public.categories (name, type, color, icon, is_default, user_id)
VALUES
  -- Pemasukan
  ('Gaji Pokok', 'income', '#10B981', 'Briefcase', true, NULL),
  ('Freelance & Sampingan', 'income', '#06B6D4', 'TrendingUp', true, NULL),
  ('Investasi & Dividen', 'income', '#6366F1', 'Coins', true, NULL),
  ('Bonus & Hadiah', 'income', '#EC4899', 'Gift', true, NULL),
  ('Pemasukan Lainnya', 'income', '#8B5CF6', 'ArrowDownLeft', true, NULL),
  -- Pengeluaran
  ('Makanan & Minuman', 'expense', '#F97316', 'Utensils', true, NULL),
  ('Transportasi', 'expense', '#3478F6', 'Car', true, NULL),
  ('Belanja & Kebutuhan', 'expense', '#EC4899', 'ShoppingBag', true, NULL),
  ('Tagihan & Utilitas', 'expense', '#EAB308', 'Zap', true, NULL),
  ('Tempat Tinggal', 'expense', '#8B5CF6', 'Home', true, NULL),
  ('Hiburan & Liburan', 'expense', '#14B8A6', 'Film', true, NULL),
  ('Kesehatan & Medis', 'expense', '#EF4444', 'HeartPulse', true, NULL),
  ('Pendidikan & Buku', 'expense', '#6366F1', 'GraduationCap', true, NULL),
  ('Donasi & Sedekah', 'expense', '#F43F5E', 'Heart', true, NULL),
  ('Pengeluaran Lainnya', 'expense', '#64748B', 'Layers', true, NULL)
ON CONFLICT DO NOTHING;
