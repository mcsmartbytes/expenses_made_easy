-- Receipt Line Items Schema
-- Store individual items from receipts with price tracking
-- Run this SQL in your Supabase SQL Editor

-- Individual line items extracted from receipts
CREATE TABLE IF NOT EXISTS receipt_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  item_name_normalized TEXT, -- lowercase, trimmed for matching
  quantity DECIMAL(12,4) DEFAULT 1,
  unit_price DECIMAL(10,2),
  line_total DECIMAL(10,2),
  unit_of_measure TEXT, -- 'each', 'lb', 'oz', 'gal', 'kg', etc.
  is_taxable BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Price history for tracking item costs over time
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_line_items_expense ON receipt_line_items(expense_id);
CREATE INDEX IF NOT EXISTS idx_line_items_user ON receipt_line_items(user_id);
CREATE INDEX IF NOT EXISTS idx_line_items_name ON receipt_line_items(item_name_normalized);
CREATE INDEX IF NOT EXISTS idx_line_items_user_name ON receipt_line_items(user_id, item_name_normalized);

CREATE INDEX IF NOT EXISTS idx_price_history_user ON item_price_history(user_id);
CREATE INDEX IF NOT EXISTS idx_price_history_item ON item_price_history(item_name_normalized);
CREATE INDEX IF NOT EXISTS idx_price_history_user_item ON item_price_history(user_id, item_name_normalized);
CREATE INDEX IF NOT EXISTS idx_price_history_vendor ON item_price_history(vendor_normalized);
CREATE INDEX IF NOT EXISTS idx_price_history_date ON item_price_history(purchase_date DESC);

-- Enable Row Level Security
ALTER TABLE receipt_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_price_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for receipt_line_items
CREATE POLICY "Users can view own line items"
  ON receipt_line_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own line items"
  ON receipt_line_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own line items"
  ON receipt_line_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own line items"
  ON receipt_line_items FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for item_price_history
CREATE POLICY "Users can view own price history"
  ON item_price_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own price history"
  ON item_price_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own price history"
  ON item_price_history FOR DELETE
  USING (auth.uid() = user_id);

-- Function to normalize item names for matching
CREATE OR REPLACE FUNCTION normalize_item_name(name TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(TRIM(REGEXP_REPLACE(name, '\s+', ' ', 'g')));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to auto-populate normalized name
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

-- Trigger to auto-populate vendor_normalized
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
