-- ============================================================================
-- EXPENSES MADE EASY - FRESH DATABASE SETUP
-- ============================================================================
-- Run this SQL in your NEW Supabase project's SQL Editor
-- This creates all tables needed for a standalone expenses_made_easy instance
-- ============================================================================

-- ============================================================================
-- SECTION 1: CATEGORIES TABLE (must be first - other tables reference it)
-- ============================================================================

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  icon TEXT DEFAULT '💰',
  is_tax_deductible BOOLEAN DEFAULT false,
  tax_category TEXT,
  is_default BOOLEAN DEFAULT false,
  deduction_percentage INT DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own categories" ON categories
  FOR SELECT USING (auth.uid() = user_id OR is_default = true);
CREATE POLICY "Users can create own categories" ON categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own categories" ON categories
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own categories" ON categories
  FOR DELETE USING (auth.uid() = user_id AND is_default = false);

CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_is_default ON categories(is_default);

-- ============================================================================
-- SECTION 2: EXPENSES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  receipt_url TEXT,
  notes TEXT,
  is_business BOOLEAN DEFAULT true,
  payment_method TEXT,
  vendor TEXT,
  profile TEXT CHECK (profile IN ('business', 'personal')) DEFAULT 'business',
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own expenses" ON expenses
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own expenses" ON expenses
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own expenses" ON expenses
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own expenses" ON expenses
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_profile ON expenses(profile);

-- ============================================================================
-- SECTION 3: MILEAGE TABLE (simple version)
-- ============================================================================

CREATE TABLE IF NOT EXISTS mileage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  distance DECIMAL(8, 2) NOT NULL,
  start_location TEXT,
  end_location TEXT,
  purpose TEXT,
  is_business BOOLEAN DEFAULT true,
  rate DECIMAL(4, 2) DEFAULT 0.67,
  amount DECIMAL(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE mileage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mileage" ON mileage
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own mileage" ON mileage
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own mileage" ON mileage
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own mileage" ON mileage
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_mileage_user_date ON mileage(user_id, date DESC);

-- ============================================================================
-- SECTION 4: MILEAGE TRIPS TABLE (GPS tracking version)
-- ============================================================================

CREATE TABLE IF NOT EXISTS mileage_trips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  start_location JSONB NOT NULL,
  end_location JSONB,
  distance_miles DECIMAL(10, 2) DEFAULT 0 NOT NULL,
  purpose TEXT CHECK (purpose IN ('business', 'personal')) NOT NULL,
  notes TEXT,
  fuel_stops JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE mileage_trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own mileage trips" ON mileage_trips
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own mileage trips" ON mileage_trips
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own mileage trips" ON mileage_trips
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own mileage trips" ON mileage_trips
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_mileage_trips_user_id ON mileage_trips(user_id);
CREATE INDEX IF NOT EXISTS idx_mileage_trips_start_time ON mileage_trips(start_time);
CREATE INDEX IF NOT EXISTS idx_mileage_trips_purpose ON mileage_trips(purpose);

GRANT ALL ON mileage_trips TO authenticated;
GRANT ALL ON mileage_trips TO service_role;

-- ============================================================================
-- SECTION 5: USER PROFILES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  industry TEXT,
  business_name TEXT,
  phone TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profiles_updated_at();

-- ============================================================================
-- SECTION 6: BUDGETS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  period TEXT CHECK (period IN ('monthly', 'quarterly', 'yearly')) DEFAULT 'monthly',
  profile TEXT CHECK (profile IN ('business', 'personal')) DEFAULT 'personal',
  alert_threshold DECIMAL(3,2) DEFAULT 0.80,
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, category, profile, period, start_date)
);

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own budgets" ON budgets
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own budgets" ON budgets
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own budgets" ON budgets
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own budgets" ON budgets
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_profile ON budgets(user_id, profile);
CREATE INDEX IF NOT EXISTS idx_budgets_active ON budgets(is_active);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_budgets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_budgets_updated_at ON budgets;
CREATE TRIGGER update_budgets_updated_at
  BEFORE UPDATE ON budgets
  FOR EACH ROW
  EXECUTE FUNCTION update_budgets_updated_at();

-- ============================================================================
-- SECTION 7: BUDGET ALERTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS budget_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_type TEXT CHECK (alert_type IN ('threshold', 'exceeded', 'near_end')) NOT NULL,
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  amount_spent DECIMAL(10,2) NOT NULL,
  budget_amount DECIMAL(10,2) NOT NULL,
  percentage_used DECIMAL(5,2) NOT NULL,
  acknowledged BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE budget_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own budget alerts" ON budget_alerts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own budget alerts" ON budget_alerts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own budget alerts" ON budget_alerts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_budget_alerts_user_id ON budget_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_alerts_budget_id ON budget_alerts(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_alerts_acknowledged ON budget_alerts(acknowledged);

-- ============================================================================
-- SECTION 8: MERCHANT RULES TABLE (auto-categorization)
-- ============================================================================

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

ALTER TABLE merchant_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own merchant rules" ON merchant_rules
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own merchant rules" ON merchant_rules
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own merchant rules" ON merchant_rules
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own merchant rules" ON merchant_rules
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_merchant_rules_user ON merchant_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_merchant_rules_user_active ON merchant_rules(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_merchant_rules_pattern ON merchant_rules(merchant_pattern);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_merchant_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_merchant_rules_updated_at ON merchant_rules;
CREATE TRIGGER update_merchant_rules_updated_at
  BEFORE UPDATE ON merchant_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_merchant_rules_updated_at();

-- Function to increment match count
CREATE OR REPLACE FUNCTION increment_rule_match_count(rule_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE merchant_rules SET match_count = match_count + 1 WHERE id = rule_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECTION 9: ITEM CATEGORY RULES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS item_category_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_pattern TEXT NOT NULL,
  match_type TEXT CHECK (match_type IN ('exact', 'contains', 'starts_with')) DEFAULT 'contains',
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  is_business BOOLEAN DEFAULT true,
  vendor_pattern TEXT,
  priority INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  auto_created BOOLEAN DEFAULT false,
  match_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE item_category_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own item rules" ON item_category_rules
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own item rules" ON item_category_rules
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own item rules" ON item_category_rules
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own item rules" ON item_category_rules
  FOR DELETE USING (auth.uid() = user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_item_category_rules_unique
  ON item_category_rules(user_id, item_pattern, match_type, COALESCE(vendor_pattern, ''));
CREATE INDEX IF NOT EXISTS idx_item_category_rules_user ON item_category_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_item_category_rules_user_active ON item_category_rules(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_item_category_rules_pattern ON item_category_rules(item_pattern);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_item_category_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_item_category_rules_updated_at ON item_category_rules;
CREATE TRIGGER update_item_category_rules_updated_at
  BEFORE UPDATE ON item_category_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_item_category_rules_updated_at();

-- Function to increment match count
CREATE OR REPLACE FUNCTION increment_item_rule_match_count(rule_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE item_category_rules SET match_count = match_count + 1 WHERE id = rule_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECTION 10: DETECTED SUBSCRIPTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS detected_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor TEXT NOT NULL,
  vendor_normalized TEXT,
  avg_amount DECIMAL(10,2),
  min_amount DECIMAL(10,2),
  max_amount DECIMAL(10,2),
  frequency TEXT CHECK (frequency IN ('weekly', 'biweekly', 'monthly', 'quarterly', 'annually', 'irregular')),
  confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  first_seen DATE,
  last_seen DATE,
  next_expected DATE,
  occurrence_count INT DEFAULT 0,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  category_name TEXT,
  is_confirmed BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, vendor_normalized)
);

ALTER TABLE detected_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions" ON detected_subscriptions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subscriptions" ON detected_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subscriptions" ON detected_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own subscriptions" ON detected_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON detected_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_active ON detected_subscriptions(user_id, is_active, is_dismissed);
CREATE INDEX IF NOT EXISTS idx_subscriptions_vendor ON detected_subscriptions(vendor_normalized);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next ON detected_subscriptions(user_id, next_expected);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_subscription_updated_at ON detected_subscriptions;
CREATE TRIGGER update_subscription_updated_at
  BEFORE UPDATE ON detected_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_updated_at();

-- ============================================================================
-- SECTION 11: SUBSCRIPTION PRICE HISTORY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscription_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES detected_subscriptions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  detected_date DATE NOT NULL,
  expense_id UUID REFERENCES expenses(id) ON DELETE SET NULL,
  price_change DECIMAL(10,2),
  price_change_pct DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE subscription_price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own price history" ON subscription_price_history
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own price history" ON subscription_price_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own price history" ON subscription_price_history
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_sub_price_history_sub ON subscription_price_history(subscription_id);
CREATE INDEX IF NOT EXISTS idx_sub_price_history_user ON subscription_price_history(user_id);

-- ============================================================================
-- SECTION 12: RECEIPT LINE ITEMS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS receipt_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  item_name_normalized TEXT,
  quantity DECIMAL(12,4) DEFAULT 1,
  unit_price DECIMAL(10,2),
  line_total DECIMAL(10,2),
  unit_of_measure TEXT,
  is_taxable BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE receipt_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own line items" ON receipt_line_items
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own line items" ON receipt_line_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own line items" ON receipt_line_items
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own line items" ON receipt_line_items
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_line_items_expense ON receipt_line_items(expense_id);
CREATE INDEX IF NOT EXISTS idx_line_items_user ON receipt_line_items(user_id);
CREATE INDEX IF NOT EXISTS idx_line_items_name ON receipt_line_items(item_name_normalized);
CREATE INDEX IF NOT EXISTS idx_line_items_user_name ON receipt_line_items(user_id, item_name_normalized);

-- Function and trigger for normalized name
CREATE OR REPLACE FUNCTION normalize_item_name(name TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(TRIM(REGEXP_REPLACE(name, '\s+', ' ', 'g')));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION set_item_name_normalized()
RETURNS TRIGGER AS $$
BEGIN
  NEW.item_name_normalized = normalize_item_name(NEW.item_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_line_item_name_normalized ON receipt_line_items;
CREATE TRIGGER set_line_item_name_normalized
  BEFORE INSERT OR UPDATE ON receipt_line_items
  FOR EACH ROW
  EXECUTE FUNCTION set_item_name_normalized();

-- ============================================================================
-- SECTION 13: ITEM PRICE HISTORY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS item_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_name_normalized TEXT NOT NULL,
  vendor TEXT,
  vendor_normalized TEXT,
  unit_price DECIMAL(10,2) NOT NULL,
  quantity DECIMAL(12,4),
  unit_of_measure TEXT,
  purchase_date DATE NOT NULL,
  expense_id UUID REFERENCES expenses(id) ON DELETE SET NULL,
  line_item_id UUID REFERENCES receipt_line_items(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE item_price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own item price history" ON item_price_history
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own item price history" ON item_price_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own item price history" ON item_price_history
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_price_history_user ON item_price_history(user_id);
CREATE INDEX IF NOT EXISTS idx_price_history_item ON item_price_history(item_name_normalized);
CREATE INDEX IF NOT EXISTS idx_price_history_user_item ON item_price_history(user_id, item_name_normalized);
CREATE INDEX IF NOT EXISTS idx_price_history_vendor ON item_price_history(vendor_normalized);
CREATE INDEX IF NOT EXISTS idx_price_history_date ON item_price_history(purchase_date DESC);

-- Trigger for vendor_normalized
CREATE OR REPLACE FUNCTION set_vendor_normalized()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.vendor IS NOT NULL THEN
    NEW.vendor_normalized = LOWER(TRIM(REGEXP_REPLACE(NEW.vendor, '[^a-zA-Z0-9\s]', '', 'g')));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_price_history_vendor_normalized ON item_price_history;
CREATE TRIGGER set_price_history_vendor_normalized
  BEFORE INSERT OR UPDATE ON item_price_history
  FOR EACH ROW
  EXECUTE FUNCTION set_vendor_normalized();

-- ============================================================================
-- SECTION 14: DEFAULT CATEGORIES TRIGGER
-- ============================================================================
-- Creates default categories when a new user signs up

CREATE OR REPLACE FUNCTION create_default_categories()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO categories (user_id, name, color, icon, is_tax_deductible, tax_category, deduction_percentage) VALUES
    (NEW.id, 'Meals & Entertainment', '#EF4444', '🍽️', true, 'meals', 50),
    (NEW.id, 'Travel', '#3B82F6', '✈️', true, 'travel', 100),
    (NEW.id, 'Office Supplies', '#8B5CF6', '📎', true, 'office', 100),
    (NEW.id, 'Vehicle', '#10B981', '🚗', true, 'vehicle', 100),
    (NEW.id, 'Utilities', '#F59E0B', '💡', true, 'utilities', 100),
    (NEW.id, 'Marketing', '#EC4899', '📢', true, 'marketing', 100),
    (NEW.id, 'Professional Services', '#6366F1', '👔', true, 'professional', 100),
    (NEW.id, 'Insurance', '#14B8A6', '🛡️', true, 'insurance', 100),
    (NEW.id, 'Rent', '#F97316', '🏢', true, 'rent', 100),
    (NEW.id, 'Personal', '#64748B', '👤', false, null, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_categories ON auth.users;
CREATE TRIGGER on_auth_user_created_categories
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_categories();

-- ============================================================================
-- SECTION 15: STORAGE BUCKET FOR RECEIPTS
-- ============================================================================
-- Run this separately if you need receipt image storage

-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('receipts', 'receipts', false)
-- ON CONFLICT (id) DO NOTHING;

-- CREATE POLICY "Users can upload their own receipts"
-- ON storage.objects FOR INSERT TO authenticated
-- WITH CHECK (bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::text);

-- CREATE POLICY "Users can view their own receipts"
-- ON storage.objects FOR SELECT TO authenticated
-- USING (bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::text);

-- CREATE POLICY "Users can delete their own receipts"
-- ON storage.objects FOR DELETE TO authenticated
-- USING (bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================
-- After running this script:
-- 1. Copy the Supabase URL and anon key from Project Settings > API
-- 2. Update .env.local with the new credentials
-- 3. Restart the development server
-- ============================================================================
