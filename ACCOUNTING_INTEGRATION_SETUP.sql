-- ============================================================================
-- ACCOUNTING INTEGRATION SETUP
-- ============================================================================
-- This script sets up the database schema for integrating Expenses Made Easy
-- mobile app with MC Smart Bytes accounting system
--
-- Run this in Supabase SQL Editor: https://vckynnyputrvwjhosryl.supabase.co
-- ============================================================================

-- ============================================================================
-- PART 1: MOBILE APP ENHANCEMENTS (Expenses Made Easy)
-- ============================================================================

-- Add sync tracking columns to expenses table
ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS synced_to_accounting BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sync_error TEXT,
ADD COLUMN IF NOT EXISTS accounting_journal_entry_id UUID,
ADD COLUMN IF NOT EXISTS synced_at TIMESTAMP WITH TIME ZONE;

-- Add index for finding unsynced expenses
CREATE INDEX IF NOT EXISTS idx_expenses_sync_status ON expenses(synced_to_accounting, profile);

-- Add comment for documentation
COMMENT ON COLUMN expenses.synced_to_accounting IS 'Whether this expense has been synced to the accounting system';
COMMENT ON COLUMN expenses.sync_error IS 'Error message if sync failed';
COMMENT ON COLUMN expenses.accounting_journal_entry_id IS 'Reference to the journal entry created in accounting system';
COMMENT ON COLUMN expenses.synced_at IS 'Timestamp when expense was successfully synced';

-- ============================================================================
-- PART 2: ACCOUNTING SYSTEM ENHANCEMENTS (MC Smart Bytes)
-- ============================================================================

-- Note: This assumes journal_entries table exists in MC Smart Bytes accounting system
-- If not, this will be created when the accounting app sets up its schema

-- Add source tracking to journal_entries (if table exists)
DO $$
BEGIN
  -- Check if journal_entries table exists
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'journal_entries') THEN
    -- Add columns if they don't exist
    ALTER TABLE journal_entries
    ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual',
    ADD COLUMN IF NOT EXISTS mobile_expense_id UUID,
    ADD COLUMN IF NOT EXISTS mobile_user_id UUID;

    -- Add index
    CREATE INDEX IF NOT EXISTS idx_journal_entries_mobile_expense ON journal_entries(mobile_expense_id);

    -- Add comments
    COMMENT ON COLUMN journal_entries.source IS 'Source of entry: manual, mobile_app, import, recurring';
    COMMENT ON COLUMN journal_entries.mobile_expense_id IS 'Reference to expenses.id from mobile app';
    COMMENT ON COLUMN journal_entries.mobile_user_id IS 'Reference to user who created expense in mobile app';

    RAISE NOTICE 'journal_entries table updated for mobile integration';
  ELSE
    RAISE NOTICE 'journal_entries table does not exist yet - will be created by accounting app';
  END IF;
END $$;

-- ============================================================================
-- PART 3: ACCESS CONTROL TABLE
-- ============================================================================

-- Create table for linking mobile users to accounting clients
CREATE TABLE IF NOT EXISTS client_bookkeeper_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mobile_user_id UUID NOT NULL,           -- User ID from Expenses Made Easy app
  bookkeeper_user_id UUID NOT NULL,       -- Bookkeeper user ID in accounting system
  client_id UUID NOT NULL,                -- Client ID in accounting system
  access_level TEXT DEFAULT 'view',       -- 'view', 'sync', 'full'
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  granted_by UUID,                        -- Who granted access
  revoked_at TIMESTAMP WITH TIME ZONE,
  revoked_by UUID,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  UNIQUE(mobile_user_id, client_id)
);

-- Add indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_client_bookkeeper_mobile_user ON client_bookkeeper_access(mobile_user_id);
CREATE INDEX IF NOT EXISTS idx_client_bookkeeper_client ON client_bookkeeper_access(client_id);
CREATE INDEX IF NOT EXISTS idx_client_bookkeeper_active ON client_bookkeeper_access(is_active);

-- Add comments
COMMENT ON TABLE client_bookkeeper_access IS 'Links mobile app users to accounting system clients for data sharing';
COMMENT ON COLUMN client_bookkeeper_access.mobile_user_id IS 'User from Expenses Made Easy mobile app';
COMMENT ON COLUMN client_bookkeeper_access.client_id IS 'Client in MC Smart Bytes accounting system';
COMMENT ON COLUMN client_bookkeeper_access.access_level IS 'view: can see, sync: can sync expenses, full: can edit';

-- Enable RLS on client_bookkeeper_access
ALTER TABLE client_bookkeeper_access ENABLE ROW LEVEL SECURITY;

-- RLS policies for client_bookkeeper_access
DROP POLICY IF EXISTS "Bookkeepers can view their client access" ON client_bookkeeper_access;
CREATE POLICY "Bookkeepers can view their client access"
  ON client_bookkeeper_access FOR SELECT
  USING (auth.uid() = bookkeeper_user_id OR auth.uid() = granted_by);

DROP POLICY IF EXISTS "Bookkeepers can grant access" ON client_bookkeeper_access;
CREATE POLICY "Bookkeepers can grant access"
  ON client_bookkeeper_access FOR INSERT
  WITH CHECK (auth.uid() = bookkeeper_user_id);

DROP POLICY IF EXISTS "Bookkeepers can revoke access" ON client_bookkeeper_access;
CREATE POLICY "Bookkeepers can revoke access"
  ON client_bookkeeper_access FOR UPDATE
  USING (auth.uid() = bookkeeper_user_id OR auth.uid() = granted_by);

-- ============================================================================
-- PART 4: CATEGORY MAPPING TABLE
-- ============================================================================

-- Create table for mapping mobile categories to accounting chart of accounts
CREATE TABLE IF NOT EXISTS category_account_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,                -- Client in accounting system
  industry TEXT,                          -- Industry for context (optional)
  mobile_category TEXT NOT NULL,          -- Category name from mobile app
  account_id UUID,                        -- Chart of accounts ID in accounting system
  account_number TEXT,                    -- Account number for reference
  account_name TEXT,                      -- Account name for display
  debit_account_id UUID,                  -- Debit side account
  credit_account_id UUID,                 -- Credit side account (usually Cash/Credit Card)
  is_default BOOLEAN DEFAULT false,       -- Whether this is a default mapping
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  UNIQUE(client_id, mobile_category)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_category_mapping_client ON category_account_mapping(client_id);
CREATE INDEX IF NOT EXISTS idx_category_mapping_industry ON category_account_mapping(industry);
CREATE INDEX IF NOT EXISTS idx_category_mapping_category ON category_account_mapping(mobile_category);

-- Add comments
COMMENT ON TABLE category_account_mapping IS 'Maps mobile expense categories to accounting chart of accounts';
COMMENT ON COLUMN category_account_mapping.mobile_category IS 'Category name from Expenses Made Easy app';
COMMENT ON COLUMN category_account_mapping.account_id IS 'Expense account in chart of accounts';
COMMENT ON COLUMN category_account_mapping.debit_account_id IS 'Account to debit (usually expense account)';
COMMENT ON COLUMN category_account_mapping.credit_account_id IS 'Account to credit (usually Cash or Credit Card)';

-- Enable RLS
ALTER TABLE category_account_mapping ENABLE ROW LEVEL SECURITY;

-- RLS policies for category_account_mapping
DROP POLICY IF EXISTS "Users can view their category mappings" ON category_account_mapping;
CREATE POLICY "Users can view their category mappings"
  ON category_account_mapping FOR SELECT
  USING (
    -- Allow if user has access to this client
    EXISTS (
      SELECT 1 FROM client_bookkeeper_access
      WHERE client_id = category_account_mapping.client_id
      AND bookkeeper_user_id = auth.uid()
      AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Users can create category mappings" ON category_account_mapping;
CREATE POLICY "Users can create category mappings"
  ON category_account_mapping FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM client_bookkeeper_access
      WHERE client_id = category_account_mapping.client_id
      AND bookkeeper_user_id = auth.uid()
      AND is_active = true
      AND access_level IN ('sync', 'full')
    )
  );

DROP POLICY IF EXISTS "Users can update category mappings" ON category_account_mapping;
CREATE POLICY "Users can update category mappings"
  ON category_account_mapping FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM client_bookkeeper_access
      WHERE client_id = category_account_mapping.client_id
      AND bookkeeper_user_id = auth.uid()
      AND is_active = true
      AND access_level IN ('sync', 'full')
    )
  );

-- ============================================================================
-- PART 5: SYNC HISTORY TABLE
-- ============================================================================

-- Create table for tracking sync operations
CREATE TABLE IF NOT EXISTS expense_sync_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mobile_user_id UUID NOT NULL,
  client_id UUID NOT NULL,
  expense_id UUID NOT NULL,               -- From expenses table
  journal_entry_id UUID,                  -- Created journal entry
  sync_status TEXT NOT NULL,              -- 'pending', 'success', 'failed'
  sync_direction TEXT DEFAULT 'mobile_to_accounting', -- Future: support bi-directional
  error_message TEXT,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  synced_by UUID,                         -- Bookkeeper who triggered sync
  retry_count INTEGER DEFAULT 0,
  metadata JSONB                          -- Additional sync details
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_sync_history_expense ON expense_sync_history(expense_id);
CREATE INDEX IF NOT EXISTS idx_sync_history_journal_entry ON expense_sync_history(journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_sync_history_status ON expense_sync_history(sync_status);
CREATE INDEX IF NOT EXISTS idx_sync_history_mobile_user ON expense_sync_history(mobile_user_id);
CREATE INDEX IF NOT EXISTS idx_sync_history_synced_at ON expense_sync_history(synced_at DESC);

-- Add comments
COMMENT ON TABLE expense_sync_history IS 'Audit log of all expense sync operations';
COMMENT ON COLUMN expense_sync_history.sync_status IS 'pending, success, failed';
COMMENT ON COLUMN expense_sync_history.metadata IS 'JSON with sync details (amount, category, date, etc.)';

-- Enable RLS
ALTER TABLE expense_sync_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for expense_sync_history
DROP POLICY IF EXISTS "Users can view sync history for their clients" ON expense_sync_history;
CREATE POLICY "Users can view sync history for their clients"
  ON expense_sync_history FOR SELECT
  USING (
    -- Mobile users can see their own sync history
    auth.uid() = mobile_user_id
    OR
    -- Bookkeepers can see sync history for their clients
    EXISTS (
      SELECT 1 FROM client_bookkeeper_access
      WHERE client_id = expense_sync_history.client_id
      AND bookkeeper_user_id = auth.uid()
      AND is_active = true
    )
  );

DROP POLICY IF EXISTS "System can insert sync history" ON expense_sync_history;
CREATE POLICY "System can insert sync history"
  ON expense_sync_history FOR INSERT
  WITH CHECK (true); -- Allow inserts from sync process

-- ============================================================================
-- PART 6: DEFAULT CATEGORY MAPPINGS (EXAMPLES)
-- ============================================================================

-- These are examples - actual mappings should be created by the accounting app
-- based on the client's chart of accounts

-- Example: Construction Industry Default Mappings
-- Note: Replace account_id values with actual UUIDs from your chart_of_accounts table

-- INSERT INTO category_account_mapping (
--   client_id,
--   industry,
--   mobile_category,
--   account_number,
--   account_name,
--   is_default
-- ) VALUES
-- (
--   'client-uuid-here',
--   'Construction',
--   'Materials',
--   '5100',
--   'Direct Materials',
--   true
-- ),
-- (
--   'client-uuid-here',
--   'Construction',
--   'Equipment Rental',
--   '5300',
--   'Equipment Rental Expense',
--   true
-- ),
-- (
--   'client-uuid-here',
--   'Construction',
--   'Fuel',
--   '5400',
--   'Vehicle Fuel',
--   true
-- );

-- ============================================================================
-- PART 7: HELPER VIEWS
-- ============================================================================

-- View for unsynced expenses
CREATE OR REPLACE VIEW unsynced_expenses AS
SELECT
  e.*,
  up.business_name,
  up.industry,
  up.full_name as user_name
FROM expenses e
LEFT JOIN user_profiles up ON e.user_id = up.user_id
WHERE e.synced_to_accounting = false
  AND e.profile = 'business'  -- Only business expenses
ORDER BY e.date DESC, e.created_at DESC;

COMMENT ON VIEW unsynced_expenses IS 'Shows all business expenses that need to be synced to accounting';

-- View for recent sync operations
CREATE OR REPLACE VIEW recent_syncs AS
SELECT
  esh.*,
  e.description as expense_description,
  e.amount as expense_amount,
  e.category as expense_category,
  e.date as expense_date,
  up.business_name,
  up.full_name as user_name
FROM expense_sync_history esh
LEFT JOIN expenses e ON esh.expense_id = e.id
LEFT JOIN user_profiles up ON esh.mobile_user_id = up.user_id
ORDER BY esh.synced_at DESC
LIMIT 100;

COMMENT ON VIEW recent_syncs IS 'Shows last 100 sync operations with expense details';

-- ============================================================================
-- PART 8: MODIFIED RLS POLICY FOR EXPENSES
-- ============================================================================

-- Update expenses RLS to allow bookkeepers to read client expenses
DROP POLICY IF EXISTS "Bookkeepers can view client expenses" ON expenses;
CREATE POLICY "Bookkeepers can view client expenses"
  ON expenses FOR SELECT
  USING (
    -- Users see their own expenses
    auth.uid() = user_id
    OR
    -- Bookkeepers with access can view business expenses
    (
      profile = 'business' AND
      EXISTS (
        SELECT 1 FROM client_bookkeeper_access cba
        WHERE cba.mobile_user_id = expenses.user_id
        AND cba.bookkeeper_user_id = auth.uid()
        AND cba.is_active = true
      )
    )
  );

-- ============================================================================
-- PART 9: VERIFICATION QUERIES
-- ============================================================================

-- Check sync-related columns in expenses
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'expenses'
  AND column_name IN ('synced_to_accounting', 'sync_error', 'accounting_journal_entry_id', 'synced_at')
ORDER BY ordinal_position;

-- Check new tables
SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('client_bookkeeper_access', 'category_account_mapping', 'expense_sync_history')
ORDER BY tablename;

-- Check new indexes
SELECT
  indexname,
  tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('expenses', 'client_bookkeeper_access', 'category_account_mapping', 'expense_sync_history')
  AND indexname LIKE '%sync%'
ORDER BY tablename, indexname;

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================
-- After running this script, you should have:
-- 1. ✅ Sync tracking columns in expenses table
-- 2. ✅ client_bookkeeper_access table for access control
-- 3. ✅ category_account_mapping table for category mapping
-- 4. ✅ expense_sync_history table for audit log
-- 5. ✅ Helper views for unsynced expenses and recent syncs
-- 6. ✅ Updated RLS policies for data sharing
-- 7. ✅ Indexes for performance
--
-- Next Steps:
-- 1. Build sync UI in accounting app
-- 2. Implement category mapping configuration
-- 3. Create journal entry generation logic
-- 4. Test sync workflow
-- ============================================================================

