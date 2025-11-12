-- ============================================================================
-- COMPLETE DATABASE SETUP FOR EXPENSES MADE EASY
-- ============================================================================
-- This script combines all necessary database migrations including:
-- 1. User profiles table creation
-- 2. Expense categories is_default column
-- 3. Security policies (RLS) for all tables
-- 4. Performance indexes
-- 5. Security audit and verification queries
--
-- IMPORTANT: This script is IDEMPOTENT - it can be run multiple times safely
-- It will only create what doesn't exist and won't break existing data
-- ============================================================================

-- ============================================================================
-- SECTION 1: USER PROFILES TABLE
-- ============================================================================
-- Purpose: Store user profile information including industry, business name,
--          phone, and preferences
-- Why needed: The app requires user profile data for personalized categories
--              and business/personal expense tracking
-- ============================================================================

-- Drop existing function if it exists (for clean rebuild)
DROP FUNCTION IF EXISTS update_user_profiles_updated_at() CASCADE;

-- Create user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT,
  industry TEXT,
  business_name TEXT,
  phone TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster user lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- Enable Row Level Security on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts (idempotent approach)
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;

-- Create RLS policies for user_profiles
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Create function to automatically update the updated_at timestamp
CREATE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at (drop first to make idempotent)
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profiles_updated_at();

-- ============================================================================
-- SECTION 2: EXPENSE CATEGORIES - ADD IS_DEFAULT COLUMN
-- ============================================================================
-- Purpose: Add is_default column to track system-provided vs user categories
-- Why needed: Prevents users from deleting essential system categories and
--              helps distinguish between default and custom categories
-- ============================================================================

-- Add is_default column if it doesn't exist
ALTER TABLE expense_categories
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;

-- Add helpful comment explaining the column
COMMENT ON COLUMN expense_categories.is_default IS 'Whether this is a default system category';

-- Optional: Uncomment the line below to mark some categories as default
-- UPDATE expense_categories SET is_default = true WHERE name IN ('Food', 'Gas', 'Office Supplies', 'Transportation', 'Utilities');

-- ============================================================================
-- SECTION 3: EXPENSES TABLE SECURITY (RLS)
-- ============================================================================
-- Purpose: Ensure expenses table has Row Level Security enabled
-- Why needed: Critical for data privacy - users should only see their own expenses
-- ============================================================================

-- Enable RLS on expenses table (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'expenses') THEN
    ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS enabled on expenses table';
  ELSE
    RAISE WARNING 'expenses table does not exist yet - will need to be created first';
  END IF;
END $$;

-- Drop existing policies to avoid conflicts (idempotent)
DROP POLICY IF EXISTS "Users can view their own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can insert their own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can update their own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can delete their own expenses" ON expenses;

-- Create comprehensive RLS policies for expenses (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'expenses') THEN
    EXECUTE '
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
    ';
    RAISE NOTICE 'RLS policies created for expenses table';
  END IF;
END $$;

-- ============================================================================
-- SECTION 4: EXPENSE CATEGORIES SECURITY (RLS)
-- ============================================================================
-- Purpose: Ensure expense_categories table has Row Level Security enabled
-- Why needed: Users should only see and modify their own custom categories
-- ============================================================================

-- Enable RLS on expense_categories table
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'expense_categories') THEN
    ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS enabled on expense_categories table';
  ELSE
    RAISE WARNING 'expense_categories table does not exist yet';
  END IF;
END $$;

-- Drop existing policies (idempotent)
DROP POLICY IF EXISTS "Users can view their own categories" ON expense_categories;
DROP POLICY IF EXISTS "Users can view default categories" ON expense_categories;
DROP POLICY IF EXISTS "Users can insert their own categories" ON expense_categories;
DROP POLICY IF EXISTS "Users can update their own categories" ON expense_categories;
DROP POLICY IF EXISTS "Users can delete their own categories" ON expense_categories;

-- Create RLS policies for expense_categories (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'expense_categories') THEN
    EXECUTE '
      -- Users can view their own categories OR default categories
      CREATE POLICY "Users can view their own categories"
        ON expense_categories FOR SELECT
        USING (auth.uid() = user_id OR is_default = true);

      CREATE POLICY "Users can insert their own categories"
        ON expense_categories FOR INSERT
        WITH CHECK (auth.uid() = user_id);

      CREATE POLICY "Users can update their own categories"
        ON expense_categories FOR UPDATE
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);

      -- Users can only delete their own non-default categories
      CREATE POLICY "Users can delete their own categories"
        ON expense_categories FOR DELETE
        USING (auth.uid() = user_id AND is_default = false);
    ';
    RAISE NOTICE 'RLS policies created for expense_categories table';
  END IF;
END $$;

-- ============================================================================
-- SECTION 5: MILEAGE TRIPS SECURITY (RLS)
-- ============================================================================
-- Purpose: Ensure mileage_trips table has Row Level Security enabled
-- Why needed: Users should only see their own mileage tracking data
-- ============================================================================

-- Enable RLS on mileage_trips table
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'mileage_trips') THEN
    ALTER TABLE mileage_trips ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS enabled on mileage_trips table';
  ELSE
    RAISE NOTICE 'mileage_trips table does not exist yet (will be created when mileage feature is used)';
  END IF;
END $$;

-- Drop existing policies (idempotent)
DROP POLICY IF EXISTS "Users can view their own mileage trips" ON mileage_trips;
DROP POLICY IF EXISTS "Users can insert their own mileage trips" ON mileage_trips;
DROP POLICY IF EXISTS "Users can update their own mileage trips" ON mileage_trips;
DROP POLICY IF EXISTS "Users can delete their own mileage trips" ON mileage_trips;

-- Create RLS policies for mileage_trips (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'mileage_trips') THEN
    EXECUTE '
      CREATE POLICY "Users can view their own mileage trips"
        ON mileage_trips FOR SELECT
        USING (auth.uid() = user_id);

      CREATE POLICY "Users can insert their own mileage trips"
        ON mileage_trips FOR INSERT
        WITH CHECK (auth.uid() = user_id);

      CREATE POLICY "Users can update their own mileage trips"
        ON mileage_trips FOR UPDATE
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);

      CREATE POLICY "Users can delete their own mileage trips"
        ON mileage_trips FOR DELETE
        USING (auth.uid() = user_id);
    ';
    RAISE NOTICE 'RLS policies created for mileage_trips table';
  END IF;
END $$;

-- ============================================================================
-- SECTION 6: BUDGETS SECURITY (RLS)
-- ============================================================================
-- Purpose: Ensure budgets table has Row Level Security enabled
-- Why needed: Users should only see and modify their own budget data
-- ============================================================================

-- Enable RLS on budgets table
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'budgets') THEN
    ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS enabled on budgets table';
  ELSE
    RAISE NOTICE 'budgets table does not exist yet (will be created when budget feature is used)';
  END IF;
END $$;

-- Drop existing policies and create new ones (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'budgets') THEN
    -- Drop existing policies
    DROP POLICY IF EXISTS "Users can view their own budgets" ON budgets;
    DROP POLICY IF EXISTS "Users can insert their own budgets" ON budgets;
    DROP POLICY IF EXISTS "Users can update their own budgets" ON budgets;
    DROP POLICY IF EXISTS "Users can delete their own budgets" ON budgets;

    -- Create RLS policies for budgets
    EXECUTE '
      CREATE POLICY "Users can view their own budgets"
        ON budgets FOR SELECT
        USING (auth.uid() = user_id);

      CREATE POLICY "Users can insert their own budgets"
        ON budgets FOR INSERT
        WITH CHECK (auth.uid() = user_id);

      CREATE POLICY "Users can update their own budgets"
        ON budgets FOR UPDATE
        USING (auth.uid() = user_id);

      CREATE POLICY "Users can delete their own budgets"
        ON budgets FOR DELETE
        USING (auth.uid() = user_id);
    ';
    RAISE NOTICE 'RLS policies created for budgets table';
  ELSE
    RAISE NOTICE 'budgets table does not exist - skipping policy setup';
  END IF;
END $$;

-- ============================================================================
-- SECTION 7: BUDGET ALERTS SECURITY (RLS)
-- ============================================================================
-- Purpose: Ensure budget_alerts table has Row Level Security enabled
-- Why needed: Users should only see their own budget alert notifications
-- ============================================================================

-- Enable RLS on budget_alerts table
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'budget_alerts') THEN
    ALTER TABLE budget_alerts ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS enabled on budget_alerts table';
  ELSE
    RAISE NOTICE 'budget_alerts table does not exist yet (will be created when budget feature is used)';
  END IF;
END $$;

-- Drop existing policies and create new ones (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'budget_alerts') THEN
    -- Drop existing policies
    DROP POLICY IF EXISTS "Users can view their own budget alerts" ON budget_alerts;
    DROP POLICY IF EXISTS "Users can insert their own budget alerts" ON budget_alerts;
    DROP POLICY IF EXISTS "Users can update their own budget alerts" ON budget_alerts;

    -- Create RLS policies for budget_alerts
    EXECUTE '
      CREATE POLICY "Users can view their own budget alerts"
        ON budget_alerts FOR SELECT
        USING (auth.uid() = user_id);

      CREATE POLICY "Users can insert their own budget alerts"
        ON budget_alerts FOR INSERT
        WITH CHECK (auth.uid() = user_id);

      CREATE POLICY "Users can update their own budget alerts"
        ON budget_alerts FOR UPDATE
        USING (auth.uid() = user_id);
    ';
    RAISE NOTICE 'RLS policies created for budget_alerts table';
  ELSE
    RAISE NOTICE 'budget_alerts table does not exist - skipping policy setup';
  END IF;
END $$;

-- ============================================================================
-- SECTION 8: PERFORMANCE INDEXES
-- ============================================================================
-- Purpose: Create indexes for faster query performance
-- Why needed: Improves app responsiveness when fetching expenses, categories, etc.
-- ============================================================================

-- Expenses table indexes
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_profile ON expenses(profile);
CREATE INDEX IF NOT EXISTS idx_expenses_user_profile ON expenses(user_id, profile);

-- Expense categories indexes
CREATE INDEX IF NOT EXISTS idx_expense_categories_user_id ON expense_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_expense_categories_is_default ON expense_categories(is_default);

-- Mileage trips indexes (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'mileage_trips') THEN
    CREATE INDEX IF NOT EXISTS idx_mileage_trips_user_id ON mileage_trips(user_id);
    CREATE INDEX IF NOT EXISTS idx_mileage_trips_start_time ON mileage_trips(start_time);
    CREATE INDEX IF NOT EXISTS idx_mileage_trips_purpose ON mileage_trips(purpose);
    RAISE NOTICE 'Indexes created for mileage_trips table';
  END IF;
END $$;

-- Budgets indexes (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'budgets') THEN
    CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);

    -- Only create profile index if column exists
    IF EXISTS (SELECT FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = 'budgets' AND column_name = 'profile') THEN
      CREATE INDEX IF NOT EXISTS idx_budgets_user_profile ON budgets(user_id, profile);
    END IF;

    -- Only create is_active index if column exists
    IF EXISTS (SELECT FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = 'budgets' AND column_name = 'is_active') THEN
      CREATE INDEX IF NOT EXISTS idx_budgets_active ON budgets(is_active);
    END IF;

    RAISE NOTICE 'Indexes created for budgets table';
  END IF;
END $$;

-- Budget alerts indexes (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'budget_alerts') THEN
    CREATE INDEX IF NOT EXISTS idx_budget_alerts_user_id ON budget_alerts(user_id);
    CREATE INDEX IF NOT EXISTS idx_budget_alerts_budget_id ON budget_alerts(budget_id);
    CREATE INDEX IF NOT EXISTS idx_budget_alerts_acknowledged ON budget_alerts(acknowledged);
    RAISE NOTICE 'Indexes created for budget_alerts table';
  END IF;
END $$;

-- ============================================================================
-- SECTION 9: VERIFICATION QUERIES
-- ============================================================================
-- Purpose: Verify that all security measures are properly in place
-- Run these queries after the migration to check everything is correct
-- ============================================================================

-- Check which tables have RLS enabled
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('expenses', 'expense_categories', 'mileage_trips', 'user_profiles', 'budgets', 'budget_alerts')
ORDER BY tablename;

-- Check all RLS policies
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

-- ============================================================================
-- SECTION 10: SECURITY AUDIT
-- ============================================================================
-- Purpose: Identify any security issues that need attention
-- ============================================================================

-- WARNING: Tables without RLS
SELECT
  tablename,
  'WARNING: RLS NOT ENABLED' as status
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false
  AND tablename NOT LIKE 'pg_%'
  AND tablename NOT LIKE 'sql_%'
ORDER BY tablename;

-- WARNING: Tables with RLS but no policies
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

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- After running this script, you should see:
-- 1. user_profiles table created with RLS policies
-- 2. expense_categories.is_default column added
-- 3. All tables have RLS enabled
-- 4. All tables have appropriate policies
-- 5. Performance indexes in place
-- 6. Verification queries show no security warnings
-- ============================================================================
