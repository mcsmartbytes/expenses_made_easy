# Integration Setup Guide - Expenses Made Easy ↔ MC Smart Bytes

## 🎯 Overview

This guide walks you through setting up the integration between the Expenses Made Easy mobile app and the MC Smart Bytes accounting system.

**Status**: ✅ Code complete, ready for database setup and testing

---

## ✅ What's Been Completed

### 1. Database Schema (ACCOUNTING_INTEGRATION_SETUP.sql)
**Location**: `/home/mcsmart/projects/active/expenses_made_easy/ACCOUNTING_INTEGRATION_SETUP.sql`

**What it does**:
- Adds sync tracking columns to `expenses` table
- Creates `client_bookkeeper_access` table for access control
- Creates `category_account_mapping` table for category mapping
- Creates `expense_sync_history` table for audit log
- Creates views: `unsynced_expenses` and `recent_syncs`
- Sets up RLS policies for secure data sharing

**Status**: ✅ SQL file ready to run

---

### 2. Expense Sync Service (expenseSyncService.ts)
**Location**: `/bytes_super_site/frontend/src/services/expenseSyncService.ts`

**What it does**:
- Creates journal entries from mobile expenses
- Implements double-entry bookkeeping (debit expense account, credit cash/credit card)
- Handles category-to-account mapping
- Logs sync history
- Provides bulk sync functionality
- Checks system readiness

**Key Functions**:
```typescript
createJournalEntryFromExpense() - Converts 1 expense to journal entry
syncExpensesBulk() - Syncs multiple expenses at once
getCategoryMappings() - Gets category mappings for a client
checkSyncReadiness() - Verifies all required tables exist
```

**Status**: ✅ Service complete and integrated

---

### 3. Expense Sync UI Page (expense-sync/page.tsx)
**Location**: `/bytes_super_site/frontend/src/app/admin/accounting/expense-sync/page.tsx`

**What it does**:
- Displays unsynced expenses from mobile app
- Allows bulk selection and syncing
- Shows sync history with success/failure status
- Displays business info and receipt links
- Provides error messages for failed syncs

**Features**:
- Two tabs: "Pending Sync" and "Sync History"
- Select All / Deselect All functionality
- System readiness check on load
- Client ID prompt (temporary until settings page created)
- Detailed error reporting

**Status**: ✅ UI complete and functional

---

## 🚀 Setup Instructions

### Step 1: Run Database Setup SQL

**IMPORTANT**: You must run the SQL script in Supabase before syncing will work.

1. **Go to Supabase SQL Editor**:
   - URL: https://supabase.com/dashboard/project/vckynnyputrvwjhosryl/sql/new
   - OR go to your project → SQL Editor

2. **Copy the entire contents of**:
   `/home/mcsmart/projects/active/expenses_made_easy/ACCOUNTING_INTEGRATION_SETUP.sql`

3. **Paste into SQL Editor and click "Run"**

4. **Verify Setup**:
   Run these verification queries (included at end of SQL file):
   ```sql
   -- Check sync-related columns in expenses
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_name = 'expenses'
     AND column_name IN ('synced_to_accounting', 'sync_error',
                         'accounting_journal_entry_id', 'synced_at')
   ORDER BY ordinal_position;

   -- Check new tables
   SELECT tablename, rowsecurity as rls_enabled
   FROM pg_tables
   WHERE schemaname = 'public'
     AND tablename IN ('client_bookkeeper_access',
                       'category_account_mapping',
                       'expense_sync_history')
   ORDER BY tablename;
   ```

**Expected Result**:
- 4 new columns in expenses table
- 3 new tables created
- RLS enabled on all new tables

---

### Step 2: Create Category Mappings

Before you can sync expenses, you need to map mobile expense categories to your chart of accounts.

**Option A: Manual Setup (For Now)**

Run SQL directly in Supabase:

```sql
-- Replace 'YOUR-CLIENT-ID' with actual client UUID
-- Replace account IDs with your actual chart of accounts IDs

INSERT INTO category_account_mapping (
  client_id,
  mobile_category,
  account_number,
  account_name,
  debit_account_id,     -- Expense account (debit increases expense)
  credit_account_id,    -- Cash or Credit Card account
  is_default
) VALUES
-- Example mappings (adjust to your chart of accounts)
('YOUR-CLIENT-ID', 'Materials', '5100', 'Direct Materials',
 'expense-account-uuid', 'cash-account-uuid', true),

('YOUR-CLIENT-ID', 'Equipment Rental', '5300', 'Equipment Rental Expense',
 'expense-account-uuid', 'cash-account-uuid', true),

('YOUR-CLIENT-ID', 'Fuel', '5400', 'Vehicle Fuel',
 'expense-account-uuid', 'cash-account-uuid', true),

('YOUR-CLIENT-ID', 'Office Supplies', '5500', 'Office Supplies',
 'expense-account-uuid', 'cash-account-uuid', true),

('YOUR-CLIENT-ID', 'Meals & Entertainment', '5600', 'Meals & Entertainment',
 'expense-account-uuid', 'cash-account-uuid', true);
```

**Option B: UI Page (TODO - Next Phase)**

Create a category mapping configuration page in the accounting app to make this easier.

---

### Step 3: Set Up Client Access

Link mobile users to accounting clients:

```sql
-- Replace UUIDs with actual values
-- Get mobile_user_id from user_profiles table in mobile app
-- Get bookkeeper_user_id from auth.users in accounting system
-- Get client_id from clients table in accounting system

INSERT INTO client_bookkeeper_access (
  mobile_user_id,      -- Mobile app user ID
  bookkeeper_user_id,  -- Your bookkeeper user ID
  client_id,           -- Client in accounting system
  access_level,        -- 'view', 'sync', or 'full'
  is_active
) VALUES
('mobile-user-uuid', 'bookkeeper-uuid', 'client-uuid', 'sync', true);
```

---

### Step 4: Test Sync Workflow

1. **Add Test Expense in Mobile App**:
   - Open Expenses Made Easy app
   - Add a business expense
   - Use a category that you've mapped (e.g., "Materials")
   - Add a receipt photo

2. **Navigate to Sync Page in Accounting App**:
   - Go to: `http://localhost:3000/admin/accounting/expense-sync`
   - You should see the expense in "Pending Sync" tab

3. **Sync the Expense**:
   - Select the expense (checkbox)
   - Click "Sync Selected"
   - Enter your Client ID when prompted
   - Click OK

4. **Verify Sync**:
   - Check "Sync History" tab - should show success
   - Check `journal_entries` table in Supabase
   - Check `journal_entry_lines` table for debit/credit entries
   - Expense should be marked as synced in mobile app

---

## 🔧 Configuration

### Getting Your Client ID

**Method 1: Query Supabase**
```sql
SELECT id, name FROM clients WHERE name = 'Your Client Name';
```

**Method 2: Create New Client**
```sql
INSERT INTO clients (name, email, industry)
VALUES ('Your Business', 'email@example.com', 'Construction')
RETURNING id;
```

**Method 3: Settings Page (TODO)**
Create a settings page where users can:
- View their client ID
- Configure default client for sync
- Manage category mappings

---

### Getting Mobile User ID

```sql
-- Find mobile user by email
SELECT user_id, full_name, business_name
FROM user_profiles
WHERE full_name = 'Your Name' OR business_name = 'Your Business';
```

---

## 📊 How It Works

### Double-Entry Bookkeeping

When you sync an expense, the system creates a journal entry with two lines:

**Example**: $50 expense for Materials paid with Cash

```
Journal Entry #1234
Date: 10/21/2025
Description: Mobile Expense: Hardware Store Materials

Lines:
  Debit:  Materials Expense (5100)     $50.00
  Credit: Cash (1000)                          $50.00
```

This follows accounting rules:
- **Debit increases expenses** (expense account goes up by $50)
- **Credit decreases assets** (cash account goes down by $50)

---

### Sync Process Flow

```
1. User adds expense in mobile app
   ↓
2. Expense saved to Supabase (synced_to_accounting = false)
   ↓
3. Bookkeeper opens expense sync page in accounting app
   ↓
4. System queries unsynced_expenses view
   ↓
5. Bookkeeper selects expenses and clicks "Sync"
   ↓
6. Service looks up category mapping
   ↓
7. Service creates journal entry header
   ↓
8. Service creates journal entry lines (debit + credit)
   ↓
9. Service marks expense as synced
   ↓
10. Service logs to expense_sync_history
```

---

## 🔐 Security & Access Control

### Row Level Security (RLS)

The integration uses Supabase RLS to ensure:
- Bookkeepers can only view expenses for clients they have access to
- Mobile users can only see their own expenses
- Sync history is visible to both parties

### Access Levels

- **view**: Bookkeeper can see expenses but not sync
- **sync**: Bookkeeper can view and sync expenses
- **full**: Bookkeeper can view, sync, and edit mappings

---

## ⚠️ Troubleshooting

### Error: "No category mapping found"

**Problem**: Expense category doesn't have a mapping in category_account_mapping table

**Solution**:
1. Check what categories are being used in mobile app
2. Create mappings for those categories (see Step 2)

---

### Error: "Journal entries table not found"

**Problem**: Database setup SQL hasn't been run yet

**Solution**: Run ACCOUNTING_INTEGRATION_SETUP.sql in Supabase (see Step 1)

---

### Error: "Missing tables"

**Problem**: System readiness check failed

**Solution**:
1. Check that you ran the full SQL script
2. Verify tables exist:
   ```sql
   SELECT tablename FROM pg_tables
   WHERE schemaname = 'public'
   ORDER BY tablename;
   ```
3. Look for: journal_entries, journal_entry_lines, category_account_mapping

---

### Sync shows success but no journal entry created

**Problem**: Journal entry was created but might not be visible in current view

**Solution**:
```sql
-- Check journal entries
SELECT * FROM journal_entries
WHERE source = 'mobile_app'
ORDER BY created_at DESC
LIMIT 10;

-- Check journal entry lines
SELECT jel.*, je.description
FROM journal_entry_lines jel
JOIN journal_entries je ON je.id = jel.journal_entry_id
WHERE je.source = 'mobile_app'
ORDER BY je.created_at DESC;
```

---

## 📝 TODO: Future Enhancements

### Phase 2 Features

1. **Category Mapping UI** (Priority: High)
   - Page to configure category mappings
   - Industry-specific templates
   - Account picker from chart of accounts

2. **Settings Page** (Priority: High)
   - Configure default client ID
   - Manage client access
   - View sync statistics

3. **Real-time Sync** (Priority: Medium)
   - Supabase Edge Function to auto-sync
   - Trigger on expense insert
   - Optional: Manual approval queue

4. **Mobile App Sync Indicators** (Priority: Medium)
   - Show sync status on expenses
   - Badge for "Not Synced" expenses
   - Sync error display

5. **Bulk Operations** (Priority: Low)
   - Bulk category mapping creation
   - Bulk access management
   - Bulk sync by date range

6. **Reporting** (Priority: Low)
   - Sync analytics dashboard
   - Category usage reports
   - Failed sync reports

---

## 🎓 Understanding the Database Tables

### expenses (Mobile App)
```
id                              UUID    - Expense ID
user_id                         UUID    - Mobile user who created it
date                            DATE    - Expense date
description                     TEXT    - What was purchased
amount                          DECIMAL - Cost
category                        TEXT    - Expense category
synced_to_accounting            BOOL    - Has it been synced?
sync_error                      TEXT    - Error message if sync failed
accounting_journal_entry_id     UUID    - Link to journal entry
synced_at                       TIMESTAMP - When synced
```

### client_bookkeeper_access (Integration)
```
id                  UUID    - Access record ID
mobile_user_id      UUID    - Mobile app user
bookkeeper_user_id  UUID    - Accounting system user
client_id           UUID    - Client in accounting system
access_level        TEXT    - 'view', 'sync', 'full'
is_active           BOOL    - Is this access active?
```

### category_account_mapping (Integration)
```
id                  UUID    - Mapping ID
client_id           UUID    - Client in accounting system
mobile_category     TEXT    - Category name from mobile app
account_id          UUID    - Account in chart of accounts
debit_account_id    UUID    - Account to debit (expense account)
credit_account_id   UUID    - Account to credit (cash/credit card)
```

### expense_sync_history (Integration)
```
id                  UUID    - History record ID
expense_id          UUID    - Expense that was synced
journal_entry_id    UUID    - Journal entry that was created
sync_status         TEXT    - 'success', 'failed', 'pending'
error_message       TEXT    - Error if failed
synced_at           TIMESTAMP - When sync was attempted
metadata            JSONB   - Additional sync details
```

### journal_entries (Accounting System)
```
id                  UUID    - Journal entry ID
date                DATE    - Transaction date
description         TEXT    - What happened
source              TEXT    - 'mobile_app', 'manual', etc.
mobile_expense_id   UUID    - Link to mobile expense
mobile_user_id      UUID    - Mobile user who created expense
```

### journal_entry_lines (Accounting System)
```
id                  UUID    - Line ID
journal_entry_id    UUID    - Parent journal entry
account_id          UUID    - Chart of accounts ID
debit               DECIMAL - Debit amount (0 if credit)
credit              DECIMAL - Credit amount (0 if debit)
description         TEXT    - Line description
```

---

## 📞 Support

### If You Get Stuck:

1. **Check System Readiness**:
   - Open expense sync page
   - Look at browser console (F12)
   - Should show readiness check result

2. **Verify Database Setup**:
   - Run verification queries from SQL file
   - Check that all tables exist

3. **Check Logs**:
   - Browser console for frontend errors
   - Supabase logs for database errors

4. **Test with Simple Expense**:
   - Create expense with basic category
   - Try syncing just one expense
   - Check each step in the process

---

## ✅ Ready to Go!

After completing the setup steps above, you'll have:
- ✅ Expenses from mobile app visible in accounting system
- ✅ One-click sync to create journal entries
- ✅ Complete audit trail in sync history
- ✅ Secure access control between users
- ✅ Category-to-account mapping

**Next**: Run the database setup SQL and start syncing your real expenses!

---

*Last Updated: October 2025*
*Version: 1.0*
*Status: Ready for Testing*
