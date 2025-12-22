-- Item Category Rules Schema
-- Auto-categorization rules for individual line items from receipts
-- Run this SQL in your Supabase SQL Editor

-- Create item_category_rules table
CREATE TABLE IF NOT EXISTS item_category_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_pattern TEXT NOT NULL,
  match_type TEXT CHECK (match_type IN ('exact', 'contains', 'starts_with')) DEFAULT 'contains',
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  is_business BOOLEAN DEFAULT true,
  vendor_pattern TEXT,  -- Optional: only apply at specific vendors
  priority INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  auto_created BOOLEAN DEFAULT false,
  match_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique index that handles NULL vendor_pattern
CREATE UNIQUE INDEX IF NOT EXISTS idx_item_category_rules_unique
  ON item_category_rules(user_id, item_pattern, match_type, COALESCE(vendor_pattern, ''));

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_item_category_rules_user ON item_category_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_item_category_rules_user_active ON item_category_rules(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_item_category_rules_pattern ON item_category_rules(item_pattern);

-- Enable Row Level Security
ALTER TABLE item_category_rules ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own item rules"
  ON item_category_rules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own item rules"
  ON item_category_rules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own item rules"
  ON item_category_rules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own item rules"
  ON item_category_rules FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_item_category_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_item_category_rules_updated_at ON item_category_rules;
CREATE TRIGGER update_item_category_rules_updated_at
  BEFORE UPDATE ON item_category_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_item_category_rules_updated_at();

-- Function to increment match count when rule is applied
CREATE OR REPLACE FUNCTION increment_item_rule_match_count(rule_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE item_category_rules
  SET match_count = match_count + 1
  WHERE id = rule_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
