-- Add profile column to expenses table
-- Run this SQL in your Supabase SQL Editor

ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS profile TEXT CHECK (profile IN ('business', 'personal')) DEFAULT 'personal';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_expenses_profile ON expenses(profile);
CREATE INDEX IF NOT EXISTS idx_expenses_user_profile ON expenses(user_id, profile);

-- Add profile column to mileage_trips table
ALTER TABLE mileage_trips
ADD COLUMN IF NOT EXISTS profile TEXT CHECK (profile IN ('business', 'personal')) DEFAULT 'business';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_mileage_trips_profile ON mileage_trips(profile);
CREATE INDEX IF NOT EXISTS idx_mileage_trips_user_profile ON mileage_trips(user_id, profile);

-- Update existing records (optional - sets default values for existing data)
UPDATE expenses SET profile = 'personal' WHERE profile IS NULL;
UPDATE mileage_trips SET profile = 'business' WHERE profile IS NULL;
