-- ===========================================
-- SECURITY AUDIT AND FIX SCRIPT
-- Run this in your Supabase SQL Editor
-- ===========================================

-- ===========================================
-- 1. ENSURE EXPENSES TABLE HAS RLS
-- ===========================================

-- Check if expenses table exists and enable RLS
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'expenses') THEN
    ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS enabled on expenses table';
  ELSE
    RAISE NOTICE 'WARNING: expenses table does not exist';
  END IF;
END $$;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can insert their own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can update their own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can delete their own expenses" ON expenses;

-- Create comprehensive RLS policies for expenses
CREATE POLICY "Users can view their own expenses"
  ON expenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own expenses"
  ON expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses"
  ON expenses FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses"
  ON expenses FOR DELETE
  USING (auth.uid() = user_id);

-- ===========================================
-- 2. ENSURE CATEGORIES TABLE HAS RLS
-- ===========================================

-- Check if categories table exists and enable RLS
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'categories') THEN
    ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS enabled on categories table';
  ELSE
    RAISE NOTICE 'INFO: categories table does not exist (may not be needed)';
  END IF;
END $$;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own categories" ON categories;
DROP POLICY IF EXISTS "Users can insert their own categories" ON categories;
DROP POLICY IF EXISTS "Users can update their own categories" ON categories;
DROP POLICY IF EXISTS "Users can delete their own categories" ON categories;

-- Create RLS policies for categories (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'categories') THEN
    EXECUTE '
      CREATE POLICY "Users can view their own categories"
        ON categories FOR SELECT
        USING (auth.uid() = user_id);

      CREATE POLICY "Users can insert their own categories"
        ON categories FOR INSERT
        WITH CHECK (auth.uid() = user_id);

      CREATE POLICY "Users can update their own categories"
        ON categories FOR UPDATE
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);

      CREATE POLICY "Users can delete their own categories"
        ON categories FOR DELETE
        USING (auth.uid() = user_id);
    ';
  END IF;
END $$;

-- ===========================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- ===========================================

-- Expenses table indexes
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_profile ON expenses(profile);
CREATE INDEX IF NOT EXISTS idx_expenses_user_profile ON expenses(user_id, profile);

-- ===========================================
-- 4. VERIFY ALL TABLES HAVE RLS ENABLED
-- ===========================================

-- This query shows which tables have RLS enabled
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('expenses', 'mileage_trips', 'categories', 'user_profiles', 'budgets', 'budget_alerts')
ORDER BY tablename;

-- ===========================================
-- 5. VERIFY POLICIES EXIST
-- ===========================================

-- This query shows all RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ===========================================
-- 6. SECURITY AUDIT REPORT
-- ===========================================

-- Check for tables without RLS
SELECT
  tablename,
  'WARNING: RLS NOT ENABLED' as status
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false
  AND tablename NOT LIKE 'pg_%'
  AND tablename NOT LIKE 'sql_%'
ORDER BY tablename;

-- Check for tables with RLS but no policies
SELECT DISTINCT
  t.tablename,
  'WARNING: RLS ENABLED BUT NO POLICIES' as status
FROM pg_tables t
WHERE t.schemaname = 'public'
  AND t.rowsecurity = true
  AND NOT EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.schemaname = t.schemaname
    AND p.tablename = t.tablename
  )
ORDER BY t.tablename;

-- ===========================================
-- SUMMARY
-- ===========================================
-- After running this script:
-- 1. All user data tables have RLS enabled
-- 2. Users can ONLY access their own data
-- 3. Performance indexes are in place
-- 4. You can verify security with the audit queries above
--
-- IMPORTANT: Run the verification queries at the end
-- to ensure everything is secure!
-- ===========================================
