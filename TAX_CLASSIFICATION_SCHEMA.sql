-- IRS Tax Classification System for Expenses Made Easy
-- This schema adds comprehensive tax deduction tracking to the expense tracking app

-- =====================================================
-- 1. TAX CLASSIFICATION TYPES TABLE
-- =====================================================
-- Reference table for IRS tax classification types
CREATE TABLE IF NOT EXISTS tax_classification_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  deduction_percentage INTEGER NOT NULL CHECK (deduction_percentage >= 0 AND deduction_percentage <= 100),
  irs_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert standard IRS tax classification types
INSERT INTO tax_classification_types (id, name, description, deduction_percentage, irs_notes) VALUES
  ('fully_deductible', 'Fully Deductible (100%)', 'Ordinary and necessary business expenses that are 100% deductible', 100, 'Most business expenses fall into this category per IRS Publication 535'),
  ('meals_entertainment', 'Meals & Entertainment (50%)', 'Business meals and entertainment expenses limited to 50% deduction', 50, 'IRS limits meals and entertainment to 50% per IRC Section 274(n)'),
  ('non_deductible', 'Non-Deductible (0%)', 'Personal expenses, fines, penalties, and other non-deductible items', 0, 'Per IRS Publication 535 - personal expenses are not deductible'),
  ('depreciation', 'Depreciation (Multi-Year)', 'Assets depreciated over multiple years using IRS depreciation schedules', 0, 'Use Form 4562 - deduction spread over asset useful life per MACRS'),
  ('home_office', 'Home Office Deduction', 'Home office expenses using simplified or regular method', 100, 'Must meet exclusive and regular use tests per IRS Publication 587'),
  ('vehicle_standard', 'Vehicle - Standard Mileage', 'Vehicle expenses using IRS standard mileage rate', 100, 'IRS standard mileage rate for 2025: $0.67/mile for business use'),
  ('vehicle_actual', 'Vehicle - Actual Expenses', 'Vehicle expenses using actual cost method', 100, 'Track all vehicle costs and multiply by business use percentage')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 2. SCHEDULE C LINE ITEMS TABLE
-- =====================================================
-- Reference table for IRS Schedule C line items (Form 1040)
CREATE TABLE IF NOT EXISTS schedule_c_line_items (
  line_number TEXT PRIMARY KEY,
  line_name TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert Schedule C line items (2025 tax year)
INSERT INTO schedule_c_line_items (line_number, line_name, description, instructions) VALUES
  ('8', 'Advertising', 'Advertising expenses', 'Include costs for business cards, newspaper ads, online advertising, promotional materials'),
  ('9', 'Car and Truck Expenses', 'Vehicle expenses', 'Either standard mileage rate or actual expenses (not both)'),
  ('10', 'Commissions and Fees', 'Commissions and fees paid', 'Payments to non-employees for services'),
  ('11', 'Contract Labor', 'Contract labor costs', 'Payments to independent contractors (1099-NEC required if >$600)'),
  ('12', 'Depletion', 'Depletion deduction', 'For natural resource businesses'),
  ('13', 'Depreciation', 'Depreciation and Section 179', 'Use Form 4562 for depreciation calculations'),
  ('14', 'Employee Benefit Programs', 'Employee benefits', 'Health insurance, retirement plans for employees (not self)'),
  ('15', 'Insurance', 'Business insurance', 'Liability, property, malpractice, workers comp (not health insurance for self-employed)'),
  ('16', 'Interest - Mortgage', 'Mortgage interest on business property', 'Interest on business real estate loans'),
  ('16b', 'Interest - Other', 'Other business interest', 'Credit card interest, business loan interest'),
  ('17', 'Legal and Professional', 'Legal and professional services', 'Attorneys, accountants, consultants, bookkeepers'),
  ('18', 'Office Expenses', 'Office expenses', 'Stationery, postage, office supplies, software subscriptions'),
  ('19', 'Pension and Profit-Sharing', 'Pension and profit-sharing plans', 'Contributions to employee retirement plans'),
  ('20a', 'Rent or Lease - Vehicles', 'Vehicle lease payments', 'Business vehicle lease costs'),
  ('20b', 'Rent or Lease - Equipment', 'Equipment rental', 'Machinery, equipment, tools rental'),
  ('20c', 'Rent or Lease - Property', 'Business property rent', 'Office, warehouse, retail space rent'),
  ('21', 'Repairs and Maintenance', 'Repairs and maintenance', 'Repairs to business property and equipment (not improvements)'),
  ('22', 'Supplies', 'Supplies used in business', 'Materials and supplies consumed in the business'),
  ('23', 'Taxes and Licenses', 'Taxes and licenses', 'Business licenses, permits, payroll taxes, property taxes'),
  ('24a', 'Travel', 'Travel expenses', 'Airfare, hotels, transportation while traveling overnight for business'),
  ('24b', 'Meals', 'Business meals (50% deductible)', 'Meals while traveling or with clients (50% limit)'),
  ('25', 'Utilities', 'Business utilities', 'Electricity, gas, water, phone, internet for business location'),
  ('26', 'Wages', 'Employee wages', 'Wages paid to employees (not self)'),
  ('27a', 'Other Expenses', 'Other business expenses', 'Any ordinary and necessary business expense not listed above')
ON CONFLICT (line_number) DO NOTHING;

-- =====================================================
-- 3. UPDATE CATEGORIES TABLE
-- =====================================================
-- Add tax classification fields to existing categories table
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS tax_classification_type TEXT REFERENCES tax_classification_types(id) DEFAULT 'fully_deductible',
  ADD COLUMN IF NOT EXISTS deduction_percentage INTEGER DEFAULT 100 CHECK (deduction_percentage >= 0 AND deduction_percentage <= 100),
  ADD COLUMN IF NOT EXISTS schedule_c_line TEXT REFERENCES schedule_c_line_items(line_number),
  ADD COLUMN IF NOT EXISTS tax_notes TEXT;

-- Create index for tax classification queries
CREATE INDEX IF NOT EXISTS idx_categories_tax_classification ON categories(tax_classification_type);
CREATE INDEX IF NOT EXISTS idx_categories_schedule_c_line ON categories(schedule_c_line);

-- =====================================================
-- 4. UPDATE DEFAULT CATEGORIES FUNCTION
-- =====================================================
-- Update the default categories with proper tax classifications
DROP FUNCTION IF EXISTS create_default_categories() CASCADE;

CREATE OR REPLACE FUNCTION create_default_categories()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO categories (user_id, name, color, icon, is_tax_deductible, tax_category, tax_classification_type, deduction_percentage, schedule_c_line) VALUES
    -- 100% Deductible Categories
    (NEW.id, 'Office Supplies', '#8B5CF6', '📎', true, 'office', 'fully_deductible', 100, '18'),
    (NEW.id, 'Software & Subscriptions', '#6366F1', '💻', true, 'software', 'fully_deductible', 100, '18'),
    (NEW.id, 'Professional Services', '#3B82F6', '👔', true, 'professional', 'fully_deductible', 100, '17'),
    (NEW.id, 'Insurance', '#14B8A6', '🛡️', true, 'insurance', 'fully_deductible', 100, '15'),
    (NEW.id, 'Marketing & Advertising', '#EC4899', '📢', true, 'marketing', 'fully_deductible', 100, '8'),
    (NEW.id, 'Utilities', '#F59E0B', '💡', true, 'utilities', 'fully_deductible', 100, '25'),
    (NEW.id, 'Rent', '#F97316', '🏢', true, 'rent', 'fully_deductible', 100, '20c'),
    (NEW.id, 'Travel', '#0EA5E9', '✈️', true, 'travel', 'fully_deductible', 100, '24a'),
    (NEW.id, 'Equipment & Supplies', '#22C55E', '🔧', true, 'equipment', 'fully_deductible', 100, '22'),
    (NEW.id, 'Bank Fees', '#64748B', '🏦', true, 'fees', 'fully_deductible', 100, '27a'),

    -- 50% Deductible (Meals)
    (NEW.id, 'Meals & Entertainment', '#EF4444', '🍽️', true, 'meals', 'meals_entertainment', 50, '24b'),

    -- Vehicle (uses mileage tracker)
    (NEW.id, 'Vehicle Expenses', '#10B981', '🚗', true, 'vehicle', 'vehicle_standard', 100, '9'),

    -- Non-Deductible
    (NEW.id, 'Personal', '#94A3B8', '👤', false, null, 'non_deductible', 0, null);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger for default categories
DROP TRIGGER IF EXISTS on_auth_user_created_categories ON auth.users;
CREATE TRIGGER on_auth_user_created_categories
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_categories();

-- =====================================================
-- 5. TAX SUMMARY VIEW
-- =====================================================
-- Create a view for tax deduction summaries
CREATE OR REPLACE VIEW expense_tax_summary AS
SELECT
  e.user_id,
  EXTRACT(YEAR FROM e.date) AS tax_year,
  c.tax_classification_type,
  c.schedule_c_line,
  scl.line_name AS schedule_c_line_name,
  COUNT(e.id) AS expense_count,
  SUM(e.amount) AS total_amount,
  SUM(e.amount * c.deduction_percentage / 100.0) AS deductible_amount,
  c.deduction_percentage
FROM expenses e
JOIN categories c ON e.category_id = c.id
LEFT JOIN schedule_c_line_items scl ON c.schedule_c_line = scl.line_number
WHERE e.is_business = true
GROUP BY
  e.user_id,
  tax_year,
  c.tax_classification_type,
  c.schedule_c_line,
  scl.line_name,
  c.deduction_percentage
ORDER BY tax_year DESC, total_amount DESC;

-- =====================================================
-- 6. MILEAGE TAX SUMMARY VIEW
-- =====================================================
-- Create a view for mileage deduction summaries
CREATE OR REPLACE VIEW mileage_tax_summary AS
SELECT
  user_id,
  EXTRACT(YEAR FROM date) AS tax_year,
  COUNT(id) AS trip_count,
  SUM(distance) AS total_miles,
  SUM(amount) AS total_deduction,
  AVG(rate) AS avg_rate
FROM mileage
WHERE is_business = true
GROUP BY user_id, tax_year
ORDER BY tax_year DESC;

-- =====================================================
-- 7. GRANT PERMISSIONS (if using RLS)
-- =====================================================
-- Enable RLS on new tables
ALTER TABLE tax_classification_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_c_line_items ENABLE ROW LEVEL SECURITY;

-- Create policies for reference tables (readable by all authenticated users)
CREATE POLICY "Anyone can view tax classification types" ON tax_classification_types
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Anyone can view schedule C line items" ON schedule_c_line_items
  FOR SELECT TO authenticated USING (true);

-- =====================================================
-- 8. MIGRATION SCRIPT FOR EXISTING CATEGORIES
-- =====================================================
-- Update existing categories with appropriate tax classifications
-- Run this AFTER applying the schema changes

-- Update common category names with tax classifications
UPDATE categories SET
  tax_classification_type = 'meals_entertainment',
  deduction_percentage = 50,
  schedule_c_line = '24b'
WHERE LOWER(name) LIKE '%meal%' OR LOWER(name) LIKE '%entertainment%' OR LOWER(name) LIKE '%food%';

UPDATE categories SET
  tax_classification_type = 'vehicle_standard',
  deduction_percentage = 100,
  schedule_c_line = '9'
WHERE LOWER(name) LIKE '%vehicle%' OR LOWER(name) LIKE '%car%' OR LOWER(name) LIKE '%gas%' OR LOWER(name) LIKE '%fuel%';

UPDATE categories SET
  tax_classification_type = 'fully_deductible',
  deduction_percentage = 100,
  schedule_c_line = '18'
WHERE LOWER(name) LIKE '%office%' OR LOWER(name) LIKE '%supplies%' OR LOWER(name) LIKE '%software%';

UPDATE categories SET
  tax_classification_type = 'fully_deductible',
  deduction_percentage = 100,
  schedule_c_line = '8'
WHERE LOWER(name) LIKE '%marketing%' OR LOWER(name) LIKE '%advertis%';

UPDATE categories SET
  tax_classification_type = 'non_deductible',
  deduction_percentage = 0,
  schedule_c_line = NULL
WHERE LOWER(name) LIKE '%personal%' OR is_tax_deductible = false;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
-- Schema update complete!
-- Next steps:
-- 1. Update the UI to show tax classifications
-- 2. Add tax classification selector to category management
-- 3. Display deduction percentages on expense forms
-- 4. Create tax reports using the new views
