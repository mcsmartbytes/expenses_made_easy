-- Merchant Rules Schema
-- Auto-categorization rules for expense tracking
-- Run this SQL in your Supabase SQL Editor

-- Create merchant_rules table
CREATE TABLE IF NOT EXISTS merchant_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  merchant_pattern TEXT NOT NULL,
  match_type TEXT CHECK (match_type IN ('exact', 'contains', 'starts_with')) DEFAULT 'contains',
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  is_business BOOLEAN DEFAULT true,
  vendor_display_name TEXT,
  priority INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  auto_created BOOLEAN DEFAULT false,
  match_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, merchant_pattern, match_type)
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_merchant_rules_user ON merchant_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_merchant_rules_user_active ON merchant_rules(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_merchant_rules_pattern ON merchant_rules(merchant_pattern);

-- Enable Row Level Security
ALTER TABLE merchant_rules ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own merchant rules"
  ON merchant_rules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own merchant rules"
  ON merchant_rules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own merchant rules"
  ON merchant_rules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own merchant rules"
  ON merchant_rules FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_merchant_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_merchant_rules_updated_at ON merchant_rules;
CREATE TRIGGER update_merchant_rules_updated_at
  BEFORE UPDATE ON merchant_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_merchant_rules_updated_at();

-- Function to increment match count when rule is applied
CREATE OR REPLACE FUNCTION increment_rule_match_count(rule_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE merchant_rules
  SET match_count = match_count + 1
  WHERE id = rule_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
