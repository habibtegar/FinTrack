-- ==============================================================================
-- FINTRACK - SKEMA DATABASE SUPABASE (FINAL & PRODUCTION-READY)
-- ==============================================================================
-- File: supabase/schema_final.sql
--
-- Keunggulan dan Penyempurnaan:
-- 1. Idempotent & Aman: Dapat dijalankan pada proyek baru yang kosong maupun
--    dijalankan berulang kali tanpa error (DROP POLICY IF EXISTS, DROP TRIGGER,
--    IF NOT EXISTS, ON CONFLICT).
-- 2. Concurrency-Safe Username: Penanganan pendaftaran konkuren (dua user mendaftar
--    bersamaan dengan email mirip) menggunakan blok EXCEPTION loop atomik agar
--    registrasi tidak pernah gagal.
-- 3. Double-Layer Category Security:
--    - Tingkat RLS: Klausul WITH CHECK memastikan category_id adalah milik user atau default.
--    - Tingkat Trigger: Fungsi validate_category_assignment() memblokir cross-user category access.
-- 4. Perlindungan Kategori Default:
--    - Kategori default (user_id IS NULL) dapat dibaca seluruh user terautentikasi.
--    - Kategori default dilindungi 100% dari INSERT, UPDATE, dan DELETE oleh pengguna biasa.
-- 5. Partial Unique Index & ON CONFLICT:
--    - Indeks ekspresi ((LOWER(TRIM(name))), type) mencegah duplikasi nama kategori.
--    - Klausul ON CONFLICT pada data seed terverifikasi cocok secara sintaksis PostgreSQL.
-- 6. Zero-Data Default Finansial:
--    - Pengguna baru memulai dengan nilai realistis: budget = 0, tabungan = 0 (bukan data demo).
-- 7. Hardened Security Definer:
--    - Seluruh fungsi trigger memiliki deklarasi eksplisit 'SET search_path = public, pg_temp'
--      untuk mencegah eksploitasi search path injection.
-- ==============================================================================

-- 1. Ekstensi UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. FUNGSI UTILITAS & TRIGGER KEAMANAN
-- ==============================================================================

-- Fungsi pembaruan otomatis timestamp updated_at
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

-- Fungsi validasi kepemilikan category_id di tingkat database
-- Memastikan pengguna tidak dapat menyematkan category_id milik pengguna lain
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

-- Fungsi handle_new_user yang kebal terhadap konflik konkurensi username
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_base_username TEXT;
  v_candidate TEXT;
  v_suffix TEXT;
  v_attempts INT := 0;
BEGIN
  -- 1. Bersihkan karakter dasar username dari metadata atau awalan email
  v_base_username := LOWER(REGEXP_REPLACE(
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    '[^a-zA-Z0-9_]',
    '',
    'g'
  ));

  IF v_base_username IS NULL OR v_base_username = '' THEN
    v_base_username := 'user';
  END IF;

  -- Batasi panjang base username agar muat dengan suffix
  v_base_username := SUBSTRING(v_base_username FROM 1 FOR 20);
  v_candidate := v_base_username;

  -- 2. Loop insert dengan exception handler untuk menangani konkurensi secara atomik
  LOOP
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
        v_candidate,
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

      -- Jika berhasil, keluar dari loop
      EXIT;

    EXCEPTION
      WHEN unique_violation THEN
        -- Terjadi tabrakan username (misal dua akun mendaftar bersamaan dengan email prefix sama)
        v_attempts := v_attempts + 1;
        IF v_attempts = 1 THEN
          v_suffix := SUBSTRING(REPLACE(NEW.id::text, '-', '') FROM 1 FOR 4);
        ELSIF v_attempts = 2 THEN
          v_suffix := SUBSTRING(REPLACE(NEW.id::text, '-', '') FROM 1 FOR 8);
        ELSE
          v_suffix := SUBSTRING(REPLACE(gen_random_uuid()::text, '-', '') FROM 1 FOR 6);
        END IF;

        v_candidate := v_base_username || '_' || v_suffix;

        -- Batas aman loop maksimal 10 kali
        IF v_attempts > 10 THEN
          v_candidate := 'user_' || SUBSTRING(REPLACE(NEW.id::text, '-', '') FROM 1 FOR 12);
          INSERT INTO public.profiles (
            id, name, email, username, avatar, monthly_budget, savings_goal_name, savings_goal_amount
          )
          VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
            NEW.email,
            v_candidate,
            COALESCE(NEW.raw_user_meta_data->>'avatar', 'US'),
            0, NULL, 0
          )
          ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
          EXIT;
        END IF;
    END;
  END LOOP;

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

-- Partial Unique Index untuk kategori sistem default (user_id IS NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_unique_system_default
  ON public.categories ((LOWER(TRIM(name))), type)
  WHERE is_default = true AND user_id IS NULL;

-- Partial Unique Index untuk kategori kustom pengguna (user_id IS NOT NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_unique_user_category
  ON public.categories (user_id, (LOWER(TRIM(name))), type)
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

-- Trigger verifikasi kepemilikan kategori transaksi
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

-- Trigger verifikasi kepemilikan kategori anggaran
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

-- Trigger verifikasi kepemilikan kategori transaksi berulang
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

-- Pengguna hanya dapat membaca kategori miliknya sendiri atau kategori default sistem
DROP POLICY IF EXISTS "categories_select" ON public.categories;
CREATE POLICY "categories_select"
  ON public.categories FOR SELECT
  USING (auth.uid() = user_id OR (is_default = true AND user_id IS NULL));

-- Pengguna hanya dapat membuat kategori kustom untuk dirinya sendiri (is_default wajib false)
DROP POLICY IF EXISTS "categories_insert_own" ON public.categories;
CREATE POLICY "categories_insert_own"
  ON public.categories FOR INSERT
  WITH CHECK (auth.uid() = user_id AND is_default = false);

-- Pengguna hanya dapat mengedit kategori miliknya sendiri (kategori default sistem dilindungi)
DROP POLICY IF EXISTS "categories_update_own" ON public.categories;
CREATE POLICY "categories_update_own"
  ON public.categories FOR UPDATE
  USING (auth.uid() = user_id AND is_default = false)
  WITH CHECK (auth.uid() = user_id AND is_default = false);

-- Pengguna hanya dapat menghapus kategori miliknya sendiri (kategori default sistem dilindungi)
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
-- 11. DATA SEEDING: KATEGORI DEFAULT SISTEM
-- Menggunakan klausul ON CONFLICT ((LOWER(TRIM(name))), type) yang sesuai
-- dengan partial unique index idx_categories_unique_system_default
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
ON CONFLICT ((LOWER(TRIM(name))), type) WHERE is_default = true AND user_id IS NULL
DO NOTHING;
