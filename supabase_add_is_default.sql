-- Add is_default column to expense_categories table
ALTER TABLE expense_categories
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;

-- Add comment
COMMENT ON COLUMN expense_categories.is_default IS 'Whether this is a default system category';

-- Optional: Mark some categories as default if you want
-- UPDATE expense_categories SET is_default = true WHERE name IN ('Food', 'Gas', 'Office Supplies');
