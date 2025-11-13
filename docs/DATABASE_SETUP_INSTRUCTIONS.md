# Database Setup Instructions for Expenses Made Easy

## Overview

This guide will help you set up the database for the Expenses Made Easy app. You'll need to run ONE SQL file in your Supabase dashboard to complete the setup.

## Prerequisites

- Active Supabase account
- Access to your Supabase project: https://vckynnyputrvwjhosryl.supabase.co
- The `COMPLETE_DATABASE_SETUP.sql` file from this project

## Step-by-Step Instructions

### 1. Access Supabase SQL Editor

1. Go to https://vckynnyputrvwjhosryl.supabase.co
2. Log in with your Supabase credentials
3. Click on **SQL Editor** in the left sidebar
4. Click on the **New Query** button (top right)

### 2. Copy the SQL Script

1. Open the file `COMPLETE_DATABASE_SETUP.sql` in your code editor
2. Select ALL the contents (Ctrl+A or Cmd+A)
3. Copy to clipboard (Ctrl+C or Cmd+C)

### 3. Paste and Run

1. Paste the SQL into the Supabase SQL Editor (Ctrl+V or Cmd+V)
2. Click the **RUN** button (bottom right)
3. Wait for the script to complete (should take 5-10 seconds)

### 4. Verify Success

You should see output messages like:
```
NOTICE: RLS enabled on expenses table
NOTICE: RLS enabled on expense_categories table
NOTICE: RLS policies created for expenses table
NOTICE: Indexes created for mileage_trips table
```

Scroll to the bottom of the results and check the verification queries:

####  All tables should show `rls_enabled = true`
```
tablename           | rls_enabled
--------------------|------------
expenses            | t
expense_categories  | t
user_profiles       | t
mileage_trips       | t
```

####  Each table should have multiple policies
You should see policies like:
- "Users can view their own expenses"
- "Users can insert their own expenses"
- "Users can update their own expenses"
- "Users can delete their own expenses"

####  No security warnings
The last two queries should return **empty results** (no rows). If you see warnings, contact support.

## What This Script Does

### 1. Creates User Profiles Table
- Stores user info (name, industry, business name, phone)
- Enables industry-specific expense categories
- Protected with Row Level Security (RLS)

### 2. Fixes Expense Categories
- Adds `is_default` column to track system vs custom categories
- Prevents users from deleting essential categories

### 3. Enables Security (RLS) on All Tables
- **expenses**: Users only see their own expenses
- **expense_categories**: Users see their categories + defaults
- **mileage_trips**: Users only see their own trips
- **user_profiles**: Users only see their own profile
- **budgets**: Users only see their own budgets
- **budget_alerts**: Users only see their own alerts

### 4. Adds Performance Indexes
- Speeds up common queries
- Improves app responsiveness
- Optimizes filtering by user, date, category, etc.

### 5. Runs Security Audit
- Verifies all tables have RLS enabled
- Checks that policies exist
- Identifies any security issues

## Troubleshooting

### Error: "relation does not exist"

**Cause**: Some tables haven't been created yet (normal for first-time setup)

**Solution**: The script handles this automatically with conditional logic. Continue to the next step.

### Error: "duplicate key value violates unique constraint"

**Cause**: Script has already been run

**Solution**: This is fine! The script is idempotent (safe to run multiple times).

### Error: "permission denied"

**Cause**: You're not logged in as the project owner

**Solution**:
1. Check you're logged into the correct Supabase account
2. Verify you have admin access to this project

### Tables show `rls_enabled = false`

**Cause**: Script didn't complete successfully

**Solution**:
1. Check for error messages in the SQL output
2. Try running the script again
3. Contact support if issue persists

### No policies showing for a table

**Cause**: The table doesn't exist yet OR policies failed to create

**Solution**:
1. Check if the table exists in **Table Editor**
2. If it exists, try running the script again
3. Check the SQL output for specific error messages

## After Setup

### Test the App

1. Open the Expenses Made Easy app
2. Create a test expense
3. Create a test category
4. Track a mileage trip
5. View your profile

### Verify Data Isolation

1. Create a second test account
2. Log in with the second account
3. Verify you **cannot** see the first account's data
4. This confirms RLS is working correctly

## Integration with MC Smart Bytes Accounting

Once the database is set up, expense data from this mobile app can be synced to the MC Smart Bytes accounting system for bookkeeping. See `INTEGRATION_DESIGN.md` for details.

## Support

If you encounter issues:
1. Check the error messages in Supabase SQL Editor
2. Review this troubleshooting guide
3. Check `COMPLETE_DATABASE_SETUP.sql` comments for details
4. Create an issue in the project repository

## Summary

After running `COMPLETE_DATABASE_SETUP.sql`, you should have:
-  user_profiles table created
-  expense_categories.is_default column added
-  RLS enabled on all tables
-  Security policies protecting user data
-  Performance indexes for speed
-  No security warnings in audit

The app is now ready for production use! =€
