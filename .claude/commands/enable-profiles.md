# Enable Profile Feature

Help me enable the Profile and Industry Categories feature.

## Current Status

✅ Code is complete and ready
⏸️ Database table needs to be created
⏸️ Profile button is commented out in Dashboard

## Steps to Enable

### 1. Database Setup
First, run this SQL in Supabase:
- File: `supabase_user_profile_schema_fixed.sql`
- Location: Project root
- Where to run: https://vckynnyputrvwjhosryl.supabase.co → SQL Editor

### 2. Verify Table Created
Check in Supabase → Table Editor:
- Table name: `user_profiles`
- Columns: id, user_id, full_name, industry, business_name, phone, preferences, created_at, updated_at

### 3. Enable Profile Button
File: `src/screens/Dashboard/DashboardScreen.tsx`
Lines: 253-258
Action: Remove comment markers `{/* ... */}`

### 4. Test the Feature
1. Restart app: `npx expo start`
2. Go to Dashboard → should see "👤 My Profile" button
3. Tap Profile → fill in industry
4. Save profile
5. Switch to Business mode
6. Add expense → should see industry categories

## Troubleshooting

**Error 500**: RLS policies issue, run `supabase_profile_policies_fix.sql`
**Profile button missing**: Check if you uncommented correctly
**No industry categories**: Make sure you're in Business mode and industry is selected

Let me know if you're ready to enable this feature!
