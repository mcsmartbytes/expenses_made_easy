# Integration Quick Start ⚡

## 5-Step Setup (25 minutes)

### Step 1: Database Setup (5 min)

```bash
# 1. Go to Supabase SQL Editor
# https://supabase.com/dashboard/project/vckynnyputrvwjhosryl/sql/new

# 2. Copy and run: ACCOUNTING_INTEGRATION_SETUP.sql
```

**Verify**:
```sql
-- Should return 3 tables
SELECT tablename FROM pg_tables
WHERE tablename IN ('client_bookkeeper_access',
                    'category_account_mapping',
                    'expense_sync_history');
```

---

### Step 2: Create Category Mappings (10 min)

```sql
-- Replace with your actual client_id and account UUIDs

INSERT INTO category_account_mapping (
  client_id,
  mobile_category,
  account_number,
  account_name,
  debit_account_id,
  credit_account_id
) VALUES
('YOUR-CLIENT-ID', 'Materials', '5100', 'Direct Materials',
 'expense-account-uuid', 'cash-account-uuid'),

('YOUR-CLIENT-ID', 'Equipment Rental', '5300', 'Equipment Rental',
 'expense-account-uuid', 'cash-account-uuid'),

('YOUR-CLIENT-ID', 'Fuel', '5400', 'Vehicle Fuel',
 'expense-account-uuid', 'cash-account-uuid');
```

---

### Step 3: Set Up Access (5 min)

```sql
-- Link your mobile user to accounting client

INSERT INTO client_bookkeeper_access (
  mobile_user_id,      -- From user_profiles.user_id
  bookkeeper_user_id,  -- Your auth.users.id
  client_id,           -- From clients table
  access_level
) VALUES
('mobile-user-uuid', 'bookkeeper-uuid', 'client-uuid', 'sync');
```

**Get IDs**:
```sql
-- Mobile user ID
SELECT user_id, full_name, business_name FROM user_profiles;

-- Bookkeeper user ID
SELECT id, email FROM auth.users WHERE email = 'your@email.com';

-- Client ID
SELECT id, name FROM clients;
```

---

### Step 4: Test Sync (5 min)

1. **Add test expense in mobile app**:
   - Open Expenses Made Easy
   - Add expense: "Test Materials", $10, Category: Materials
   - Save

2. **Sync in accounting app**:
   - Navigate to: `http://localhost:3000/admin/accounting/expense-sync`
   - See expense in "Pending Sync" tab
   - Select it
   - Click "Sync Selected"
   - Enter client ID when prompted

3. **Verify**:
   ```sql
   -- Check journal entry was created
   SELECT * FROM journal_entries
   WHERE source = 'mobile_app'
   ORDER BY created_at DESC
   LIMIT 1;

   -- Check journal entry lines (should be 2: debit + credit)
   SELECT * FROM journal_entry_lines
   WHERE journal_entry_id = 'journal-entry-id-from-above';

   -- Check expense is marked as synced
   SELECT id, description, synced_to_accounting, synced_at
   FROM expenses
   WHERE description = 'Test Materials';
   ```

---

### Step 5: Go Live! (Now!)

Start tracking real expenses:
- Use mobile app for all business expenses
- Sync weekly (or daily) to accounting system
- Review sync history for any errors
- Enjoy automated bookkeeping!

---

## Quick Reference

### Access URLs

- **Supabase Dashboard**: https://supabase.com/dashboard/project/vckynnyputrvwjhosryl
- **SQL Editor**: https://supabase.com/dashboard/project/vckynnyputrvwjhosryl/sql
- **Expense Sync Page**: http://localhost:3000/admin/accounting/expense-sync

### Common Queries

**Find unsynced expenses**:
```sql
SELECT * FROM unsynced_expenses ORDER BY date DESC;
```

**Check sync history**:
```sql
SELECT * FROM recent_syncs LIMIT 20;
```

**View category mappings**:
```sql
SELECT mobile_category, account_name
FROM category_account_mapping
WHERE client_id = 'YOUR-CLIENT-ID';
```

**Check failed syncs**:
```sql
SELECT expense_description, error_message, synced_at
FROM recent_syncs
WHERE sync_status = 'failed';
```

---

## Troubleshooting

**"No category mapping found"**
→ Create mapping in `category_account_mapping` table

**"Journal entries table not found"**
→ Run `ACCOUNTING_INTEGRATION_SETUP.sql` in Supabase

**"Not authenticated"**
→ Make sure you're logged in to accounting app

**Expense not showing in sync page**
→ Check that expense has `profile = 'business'` and `synced_to_accounting = false`

---

## Documentation

- **Full Setup Guide**: `INTEGRATION_SETUP_GUIDE.md`
- **Complete Overview**: `INTEGRATION_COMPLETE.md`
- **Database SQL**: `ACCOUNTING_INTEGRATION_SETUP.sql`
- **This Quick Start**: `INTEGRATION_QUICK_START.md`

---

## Support

If you run into issues:

1. Check browser console (F12) for errors
2. Check Supabase logs for database errors
3. Review `INTEGRATION_SETUP_GUIDE.md` troubleshooting section
4. Test with simple expense first

---

**Total Time: 25 minutes from start to syncing real expenses** ⚡

*Last Updated: October 21, 2025*
