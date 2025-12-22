-- Add category support to receipt line items
-- Run this SQL in your Supabase SQL Editor

-- Add category_id column to receipt_line_items
ALTER TABLE receipt_line_items
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

-- Add is_business column for per-item business/personal classification
ALTER TABLE receipt_line_items
ADD COLUMN IF NOT EXISTS is_business BOOLEAN DEFAULT true;

-- Create index for category lookups
CREATE INDEX IF NOT EXISTS idx_line_items_category ON receipt_line_items(category_id);
