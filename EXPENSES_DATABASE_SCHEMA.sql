-- Expenses Made Easy - Complete Database Schema

-- CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  icon TEXT DEFAULT '💰',
  is_tax_deductible BOOLEAN DEFAULT false,
  tax_category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own categories" ON categories
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own categories" ON categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own categories" ON categories
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own categories" ON categories
  FOR DELETE USING (auth.uid() = user_id);

-- EXPENSES TABLE
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

-- MILEAGE TABLE
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
  amount DECIMAL(10, 2) GENERATED ALWAYS AS (distance * rate) STORED,
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

-- DEFAULT CATEGORIES FUNCTION
CREATE OR REPLACE FUNCTION create_default_categories()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO categories (user_id, name, color, icon, is_tax_deductible, tax_category) VALUES
    (NEW.id, 'Meals & Entertainment', '#EF4444', '🍽️', true, 'meals'),
    (NEW.id, 'Travel', '#3B82F6', '✈️', true, 'travel'),
    (NEW.id, 'Office Supplies', '#8B5CF6', '📎', true, 'office'),
    (NEW.id, 'Vehicle', '#10B981', '🚗', true, 'vehicle'),
    (NEW.id, 'Utilities', '#F59E0B', '💡', true, 'utilities'),
    (NEW.id, 'Marketing', '#EC4899', '📢', true, 'marketing'),
    (NEW.id, 'Professional Services', '#6366F1', '👔', true, 'professional'),
    (NEW.id, 'Insurance', '#14B8A6', '🛡️', true, 'insurance'),
    (NEW.id, 'Rent', '#F97316', '🏢', true, 'rent'),
    (NEW.id, 'Personal', '#64748B', '👤', false, null);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_categories ON auth.users;
CREATE TRIGGER on_auth_user_created_categories
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_categories();

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_mileage_user_date ON mileage(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id);
