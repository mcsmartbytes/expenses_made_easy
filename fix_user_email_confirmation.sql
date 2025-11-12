-- Fix email confirmation for existing user
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/vckynnyputrvwjhosryl/sql/new

-- Step 1: Confirm the existing user's email
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'mcsmartbytes@outlook.com';

-- Step 2: Verify the update worked
SELECT
  id,
  email,
  email_confirmed_at,
  confirmed_at,
  created_at
FROM auth.users
WHERE email = 'mcsmartbytes@outlook.com';
