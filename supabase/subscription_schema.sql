-- Subscription Intelligence Schema
-- Auto-detect recurring charges and track price changes
-- Run this SQL in your Supabase SQL Editor

-- Detected subscriptions (auto-detected from expense patterns)
CREATE TABLE IF NOT EXISTS detected_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor TEXT NOT NULL,
  vendor_normalized TEXT, -- lowercase for matching
  avg_amount DECIMAL(10,2),
  min_amount DECIMAL(10,2),
  max_amount DECIMAL(10,2),
  frequency TEXT CHECK (frequency IN ('weekly', 'biweekly', 'monthly', 'quarterly', 'annually', 'irregular')),
  confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1), -- 0.00 to 1.00
  first_seen DATE,
  last_seen DATE,
  next_expected DATE,
  occurrence_count INT DEFAULT 0,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  category_name TEXT, -- denormalized for display
  is_confirmed BOOLEAN DEFAULT false, -- user confirmed it's a subscription
  is_dismissed BOOLEAN DEFAULT false, -- user said "not a subscription"
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, vendor_normalized)
);

-- Price history for subscriptions (track price changes over time)
CREATE TABLE IF NOT EXISTS subscription_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES detected_subscriptions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  detected_date DATE NOT NULL,
  expense_id UUID REFERENCES expenses(id) ON DELETE SET NULL,
  price_change DECIMAL(10,2), -- difference from previous
  price_change_pct DECIMAL(5,2), -- percentage change
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON detected_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_active ON detected_subscriptions(user_id, is_active, is_dismissed);
CREATE INDEX IF NOT EXISTS idx_subscriptions_vendor ON detected_subscriptions(vendor_normalized);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next ON detected_subscriptions(user_id, next_expected);
CREATE INDEX IF NOT EXISTS idx_sub_price_history_sub ON subscription_price_history(subscription_id);
CREATE INDEX IF NOT EXISTS idx_sub_price_history_user ON subscription_price_history(user_id);

-- Enable Row Level Security
ALTER TABLE detected_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_price_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for detected_subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON detected_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions"
  ON detected_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions"
  ON detected_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscriptions"
  ON detected_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for subscription_price_history
CREATE POLICY "Users can view own price history"
  ON subscription_price_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own price history"
  ON subscription_price_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own price history"
  ON subscription_price_history FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_subscription_updated_at ON detected_subscriptions;
CREATE TRIGGER update_subscription_updated_at
  BEFORE UPDATE ON detected_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_updated_at();
