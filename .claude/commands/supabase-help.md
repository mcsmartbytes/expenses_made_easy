# Supabase Help

Help me with Supabase setup or issues for Expenses Made Easy.

**Project URL**: https://vckynnyputrvwjhosryl.supabase.co

## What I'll Check

1. **Database Schema**
   - Current tables: expenses, mileage_trips, expense_categories
   - Pending table: user_profiles (for industry feature)
   - Check column types and constraints
   - Review indexes

2. **Row Level Security (RLS)**
   - Verify policies are correct
   - Check auth.uid() usage
   - Test authenticated vs anonymous access
   - Make sure users can only access their own data

3. **Queries**
   - Review Supabase client usage in src/services/
   - Check for proper error handling
   - Verify filtering by user_id and profile
   - Test async/await patterns

4. **Authentication**
   - Check auth flow in LoginScreen/SignupScreen
   - Verify token storage
   - Test session persistence

## Common Issues

- **500 Errors**: Usually RLS policy issues
- **No Data Returned**: Check RLS policies and user_id filtering
- **Profile Column Missing**: Need to run profile schema SQL
- **Foreign Key Errors**: Check table references

## SQL Files Available

- `supabase_profile_schema.sql` - Business/Personal (done)
- `supabase_mileage_schema.sql` - Mileage tracking (done)
- `supabase_user_profile_schema_fixed.sql` - Industry profiles (pending)
- `supabase_profile_policies_fix.sql` - RLS fixes

What Supabase issue are you experiencing?
