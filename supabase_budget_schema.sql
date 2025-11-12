-- Budget Tracking Schema
-- Run this SQL in your Supabase SQL Editor

-- Create budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  period TEXT CHECK (period IN ('monthly', 'quarterly', 'yearly')) DEFAULT 'monthly',
  profile TEXT CHECK (profile IN ('business', 'personal')) DEFAULT 'personal',
  alert_threshold DECIMAL(3,2) DEFAULT 0.80, -- Alert when 80% of budget is reached
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, category, profile, period, start_date)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_profile ON budgets(user_id, profile);
CREATE INDEX IF NOT EXISTS idx_budgets_active ON budgets(is_active);

-- Enable Row Level Security
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own budgets"
  ON budgets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own budgets"
  ON budgets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budgets"
  ON budgets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budgets"
  ON budgets FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_budgets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_budgets_updated_at ON budgets;
CREATE TRIGGER update_budgets_updated_at
  BEFORE UPDATE ON budgets
  FOR EACH ROW
  EXECUTE FUNCTION update_budgets_updated_at();

-- Create budget alerts table (for tracking when users were alerted)
CREATE TABLE IF NOT EXISTS budget_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  alert_type TEXT CHECK (alert_type IN ('threshold', 'exceeded', 'near_end')) NOT NULL,
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  amount_spent DECIMAL(10,2) NOT NULL,
  budget_amount DECIMAL(10,2) NOT NULL,
  percentage_used DECIMAL(5,2) NOT NULL,
  acknowledged BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for alerts
CREATE INDEX IF NOT EXISTS idx_budget_alerts_user_id ON budget_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_alerts_budget_id ON budget_alerts(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_alerts_acknowledged ON budget_alerts(acknowledged);

-- Enable Row Level Security for alerts
ALTER TABLE budget_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies for alerts
CREATE POLICY "Users can view their own budget alerts"
  ON budget_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own budget alerts"
  ON budget_alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budget alerts"
  ON budget_alerts FOR UPDATE
  USING (auth.uid() = user_id);
