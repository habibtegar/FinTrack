-- ==============================================================================
-- FINTRACK - SKEMA DATABASE SUPABASE REVISI (V2)
-- ==============================================================================
-- File ini merupakan versi penyempurnaan dari schema.sql sebelumnya dengan fokus:
-- 1. Penanganan username unik yang aman saat pendaftaran (mencegah kegagalan registrasi jika awalan email sama).
-- 2. Partial Unique Index untuk kategori sistem default dan kategori kustom pengguna (mencegah duplikasi).
-- 3. Validasi ketat category_id di level RLS dan trigger (hanya mengizinkan kategori milik user atau sistem default).
-- 4. Pengamanan fungsi SECURITY DEFINER dengan parameter 'SET search_path = public, pg_temp'.
-- 5. Default realistis monthly_budget = 0 dan savings_goal_amount = 0 untuk akun baru (bukan data demo).
-- 6. Dukungan penuh eksekusi ulang (Idempotent): DROP POLICY IF EXISTS, ON CONFLICT, dan IF NOT EXISTS.
--
-- Seluruh tabel menggunakan UUID (gen_random_uuid()), terhubung ke auth.users, dan memiliki RLS aktif 100%.
-- ==============================================================================

-- 1. Ekstensi UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. FUNGSI UTILITAS UMUM
-- ==============================================================================

-- Trigger otomatis kolom updated_at dengan search_path terlindungi
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fungsi validasi kepemilikan category_id (Tingkat Database Trigger)
-- Mencegah transaksi, anggaran, atau transaksi berulang menggunakan category_id milik pengguna lain
CREATE OR REPLACE FUNCTION public.validate_category_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.category_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.categories
      WHERE id = NEW.category_id
      AND (user_id = NEW.user_id OR (is_default = true AND user_id IS NULL))
    ) THEN
      RAISE EXCEPTION 'Akses Kategori Ditolak: Kategori ID % bukan milik pengguna % dan bukan kategori default sistem.',
        NEW.category_id, NEW.user_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- ==============================================================================
-- 3. TABEL: PROFILES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  username TEXT UNIQUE,
  avatar TEXT,
  monthly_budget NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (monthly_budget >= 0),
  savings_goal_name TEXT DEFAULT NULL,
  savings_goal_amount NUMERIC(15, 2) DEFAULT 0 CHECK (savings_goal_amount >= 0),
  currency TEXT NOT NULL DEFAULT 'IDR',
  currency_symbol TEXT NOT NULL DEFAULT 'Rp',
  date_format TEXT NOT NULL DEFAULT 'D MMMM YYYY',
  theme TEXT NOT NULL DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system')),
  language TEXT NOT NULL DEFAULT 'id' CHECK (language IN ('id', 'en')),
  financial_period_start_day SMALLINT NOT NULL DEFAULT 1 CHECK (financial_period_start_day BETWEEN 1 AND 31),
  notifications JSONB NOT NULL DEFAULT '{"transactionAlerts": true, "budgetWarning": true, "savingsGoalAlert": true, "monthlySummary": true}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Fungsi handle_new_user dengan mitigasi username tabrakan dan nilai default realistis (Rp0)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_base_username TEXT;
  v_username TEXT;
  v_count INT := 0;
BEGIN
  -- 1. Bersihkan karakter username dasar dari metadata atau awalan email
  v_base_username := LOWER(REGEXP_REPLACE(
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    '[^a-zA-Z0-9_]',
    '',
    'g'
  ));

  IF v_base_username IS NULL OR v_base_username = '' THEN
    v_base_username := 'user';
  END IF;

  v_username := v_base_username;

  -- 2. Jika username sudah ada yang menggunakan, berikan suffix unik dari potongan user_id
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = v_username) LOOP
    v_count := v_count + 1;
    v_username := v_base_username || '_' || SUBSTRING(REPLACE(NEW.id::text, '-', '') FROM 1 FOR 4) || (CASE WHEN v_count > 1 THEN v_count::text ELSE '' END);
  END LOOP;

  -- 3. Masukkan ke tabel profiles dengan default saldo dan target 0 (bukan data demo)
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
    v_username,
    COALESCE(
      NEW.raw_user_meta_data->>'avatar',
      UPPER(SUBSTRING(COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)) FROM 1 FOR 2))
    ),
    COALESCE((NEW.raw_user_meta_data->>'monthly_budget')::numeric, 0),
    COALESCE(NEW.raw_user_meta_data->>'savings_goal_name', NULL),
    COALESCE((NEW.raw_user_meta_data->>'savings_goal_amount')::numeric, 0)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(public.profiles.name, EXCLUDED.name),
    updated_at = NOW();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 4. TABEL: CATEGORIES
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

DROP TRIGGER IF EXISTS trigger_categories_updated_at ON public.categories;
CREATE TRIGGER trigger_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Unique Index untuk mencegah duplikasi kategori default sistem
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_unique_system_default
  ON public.categories(LOWER(TRIM(name)), type)
  WHERE is_default = true AND user_id IS NULL;

-- Unique Index untuk mencegah duplikasi nama kategori kustom per pengguna
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_unique_user_category
  ON public.categories(user_id, LOWER(TRIM(name)), type)
  WHERE user_id IS NOT NULL;

-- ==============================================================================
-- 5. TABEL: TRANSACTIONS
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

DROP TRIGGER IF EXISTS trigger_transactions_updated_at ON public.transactions;
CREATE TRIGGER trigger_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger validasi category_id transaksi
DROP TRIGGER IF EXISTS trigger_transactions_validate_category ON public.transactions;
CREATE TRIGGER trigger_transactions_validate_category
  BEFORE INSERT OR UPDATE OF category_id, user_id ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.validate_category_assignment();

-- ==============================================================================
-- 6. TABEL: BUDGETS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Batas Anggaran Bulanan',
  amount NUMERIC(15, 2) NOT NULL CHECK (amount >= 0),
  period TEXT NOT NULL DEFAULT 'monthly' CHECK (period IN ('daily', 'weekly', 'monthly', 'yearly')),
  month TEXT,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trigger_budgets_updated_at ON public.budgets;
CREATE TRIGGER trigger_budgets_updated_at
  BEFORE UPDATE ON public.budgets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger validasi category_id anggaran
DROP TRIGGER IF EXISTS trigger_budgets_validate_category ON public.budgets;
CREATE TRIGGER trigger_budgets_validate_category
  BEFORE INSERT OR UPDATE OF category_id, user_id ON public.budgets
  FOR EACH ROW EXECUTE FUNCTION public.validate_category_assignment();

-- ==============================================================================
-- 7. TABEL: SAVINGS_GOALS
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

DROP TRIGGER IF EXISTS trigger_savings_goals_updated_at ON public.savings_goals;
CREATE TRIGGER trigger_savings_goals_updated_at
  BEFORE UPDATE ON public.savings_goals
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 8. TABEL: RECURRING_TRANSACTIONS
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

DROP TRIGGER IF EXISTS trigger_recurring_transactions_updated_at ON public.recurring_transactions;
CREATE TRIGGER trigger_recurring_transactions_updated_at
  BEFORE UPDATE ON public.recurring_transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger validasi category_id transaksi berulang
DROP TRIGGER IF EXISTS trigger_recurring_validate_category ON public.recurring_transactions;
CREATE TRIGGER trigger_recurring_validate_category
  BEFORE INSERT OR UPDATE OF category_id, user_id ON public.recurring_transactions
  FOR EACH ROW EXECUTE FUNCTION public.validate_category_assignment();

-- ==============================================================================
-- 9. INDEKS PERFORMA QUERY
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
-- 10. ROW LEVEL SECURITY (RLS) & IDEMPOTENT POLICIES
-- ==============================================================================

-- A. PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;
CREATE POLICY "profiles_delete_own"
  ON public.profiles FOR DELETE
  USING (auth.uid() = id);

-- B. CATEGORIES
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_select" ON public.categories;
CREATE POLICY "categories_select"
  ON public.categories FOR SELECT
  USING (auth.uid() = user_id OR (is_default = true AND user_id IS NULL));

DROP POLICY IF EXISTS "categories_insert_own" ON public.categories;
CREATE POLICY "categories_insert_own"
  ON public.categories FOR INSERT
  WITH CHECK (auth.uid() = user_id AND is_default = false);

DROP POLICY IF EXISTS "categories_update_own" ON public.categories;
CREATE POLICY "categories_update_own"
  ON public.categories FOR UPDATE
  USING (auth.uid() = user_id AND is_default = false)
  WITH CHECK (auth.uid() = user_id AND is_default = false);

DROP POLICY IF EXISTS "categories_delete_own" ON public.categories;
CREATE POLICY "categories_delete_own"
  ON public.categories FOR DELETE
  USING (auth.uid() = user_id AND is_default = false);

-- C. TRANSACTIONS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "transactions_select_own" ON public.transactions;
CREATE POLICY "transactions_select_own"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "transactions_insert_own" ON public.transactions;
CREATE POLICY "transactions_insert_own"
  ON public.transactions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (
      category_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.categories c
        WHERE c.id = category_id
        AND (c.user_id = auth.uid() OR (c.is_default = true AND c.user_id IS NULL))
      )
    )
  );

DROP POLICY IF EXISTS "transactions_update_own" ON public.transactions;
CREATE POLICY "transactions_update_own"
  ON public.transactions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND (
      category_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.categories c
        WHERE c.id = category_id
        AND (c.user_id = auth.uid() OR (c.is_default = true AND c.user_id IS NULL))
      )
    )
  );

DROP POLICY IF EXISTS "transactions_delete_own" ON public.transactions;
CREATE POLICY "transactions_delete_own"
  ON public.transactions FOR DELETE
  USING (auth.uid() = user_id);

-- D. BUDGETS
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "budgets_select_own" ON public.budgets;
CREATE POLICY "budgets_select_own"
  ON public.budgets FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "budgets_insert_own" ON public.budgets;
CREATE POLICY "budgets_insert_own"
  ON public.budgets FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (
      category_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.categories c
        WHERE c.id = category_id
        AND (c.user_id = auth.uid() OR (c.is_default = true AND c.user_id IS NULL))
      )
    )
  );

DROP POLICY IF EXISTS "budgets_update_own" ON public.budgets;
CREATE POLICY "budgets_update_own"
  ON public.budgets FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND (
      category_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.categories c
        WHERE c.id = category_id
        AND (c.user_id = auth.uid() OR (c.is_default = true AND c.user_id IS NULL))
      )
    )
  );

DROP POLICY IF EXISTS "budgets_delete_own" ON public.budgets;
CREATE POLICY "budgets_delete_own"
  ON public.budgets FOR DELETE
  USING (auth.uid() = user_id);

-- E. SAVINGS_GOALS
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "savings_goals_select_own" ON public.savings_goals;
CREATE POLICY "savings_goals_select_own"
  ON public.savings_goals FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "savings_goals_insert_own" ON public.savings_goals;
CREATE POLICY "savings_goals_insert_own"
  ON public.savings_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "savings_goals_update_own" ON public.savings_goals;
CREATE POLICY "savings_goals_update_own"
  ON public.savings_goals FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "savings_goals_delete_own" ON public.savings_goals;
CREATE POLICY "savings_goals_delete_own"
  ON public.savings_goals FOR DELETE
  USING (auth.uid() = user_id);

-- F. RECURRING_TRANSACTIONS
ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "recurring_transactions_select_own" ON public.recurring_transactions;
CREATE POLICY "recurring_transactions_select_own"
  ON public.recurring_transactions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "recurring_transactions_insert_own" ON public.recurring_transactions;
CREATE POLICY "recurring_transactions_insert_own"
  ON public.recurring_transactions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (
      category_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.categories c
        WHERE c.id = category_id
        AND (c.user_id = auth.uid() OR (c.is_default = true AND c.user_id IS NULL))
      )
    )
  );

DROP POLICY IF EXISTS "recurring_transactions_update_own" ON public.recurring_transactions;
CREATE POLICY "recurring_transactions_update_own"
  ON public.recurring_transactions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND (
      category_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.categories c
        WHERE c.id = category_id
        AND (c.user_id = auth.uid() OR (c.is_default = true AND c.user_id IS NULL))
      )
    )
  );

DROP POLICY IF EXISTS "recurring_transactions_delete_own" ON public.recurring_transactions;
CREATE POLICY "recurring_transactions_delete_own"
  ON public.recurring_transactions FOR DELETE
  USING (auth.uid() = user_id);

-- ==============================================================================
-- 11. INISIALISASI DATA KATEGORI DEFAULT SISTEM
-- Menggunakan klausul ON CONFLICT dengan partial unique index agar aman dijalankan berulang kali
-- ==============================================================================
INSERT INTO public.categories (name, type, color, icon, is_default, user_id)
VALUES
  -- Kategori Pemasukan Bawaan
  ('Gaji Pokok', 'income', '#10B981', 'Briefcase', true, NULL),
  ('Freelance & Sampingan', 'income', '#06B6D4', 'TrendingUp', true, NULL),
  ('Investasi & Dividen', 'income', '#6366F1', 'Coins', true, NULL),
  ('Bonus & Hadiah', 'income', '#EC4899', 'Gift', true, NULL),
  ('Pemasukan Lainnya', 'income', '#8B5CF6', 'ArrowDownLeft', true, NULL),
  -- Kategori Pengeluaran Bawaan
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
ON CONFLICT (LOWER(TRIM(name)), type) WHERE is_default = true AND user_id IS NULL
DO NOTHING;
