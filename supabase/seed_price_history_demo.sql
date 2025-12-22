-- Price Tracker Demo Data
-- Run this in your Supabase SQL Editor
-- Replace YOUR_USER_ID with your actual user ID from auth.users

-- First, get your user ID by running:
-- SELECT id FROM auth.users LIMIT 1;

-- Then replace 'YOUR_USER_ID' below with that ID

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get the first user (or specify your user ID directly)
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No user found. Please sign up first.';
  END IF;

  -- Clear existing demo data (optional - comment out if you want to keep existing data)
  -- DELETE FROM item_price_history WHERE user_id = v_user_id;

  -- Insert demo price history data
  -- Items purchased from multiple vendors at different prices

  -- Paper Towels - bought at 3 stores, Home Depot is cheapest
  INSERT INTO item_price_history (user_id, item_name_normalized, vendor, vendor_normalized, unit_price, quantity, unit_of_measure, purchase_date)
  VALUES
    (v_user_id, 'paper towels bounty', 'Home Depot', 'home depot', 12.99, 1, 'pack', NOW() - INTERVAL '5 days'),
    (v_user_id, 'paper towels bounty', 'Home Depot', 'home depot', 12.99, 2, 'pack', NOW() - INTERVAL '35 days'),
    (v_user_id, 'paper towels bounty', 'Walmart', 'walmart', 14.97, 1, 'pack', NOW() - INTERVAL '20 days'),
    (v_user_id, 'paper towels bounty', 'Walmart', 'walmart', 15.47, 1, 'pack', NOW() - INTERVAL '50 days'),
    (v_user_id, 'paper towels bounty', 'Target', 'target', 15.99, 1, 'pack', NOW() - INTERVAL '12 days');

  -- 2x4 Lumber - Home Depot vs Lowes
  INSERT INTO item_price_history (user_id, item_name_normalized, vendor, vendor_normalized, unit_price, quantity, unit_of_measure, purchase_date)
  VALUES
    (v_user_id, '2x4x8 lumber', 'Home Depot', 'home depot', 3.48, 10, 'each', NOW() - INTERVAL '3 days'),
    (v_user_id, '2x4x8 lumber', 'Home Depot', 'home depot', 3.28, 20, 'each', NOW() - INTERVAL '45 days'),
    (v_user_id, '2x4x8 lumber', 'Lowes', 'lowes', 4.28, 15, 'each', NOW() - INTERVAL '25 days'),
    (v_user_id, '2x4x8 lumber', 'Lowes', 'lowes', 4.18, 8, 'each', NOW() - INTERVAL '60 days');

  -- Milk - grocery stores comparison
  INSERT INTO item_price_history (user_id, item_name_normalized, vendor, vendor_normalized, unit_price, quantity, unit_of_measure, purchase_date)
  VALUES
    (v_user_id, 'milk whole gallon', 'Costco', 'costco', 3.49, 2, 'gallon', NOW() - INTERVAL '2 days'),
    (v_user_id, 'milk whole gallon', 'Costco', 'costco', 3.49, 2, 'gallon', NOW() - INTERVAL '16 days'),
    (v_user_id, 'milk whole gallon', 'Costco', 'costco', 3.29, 2, 'gallon', NOW() - INTERVAL '30 days'),
    (v_user_id, 'milk whole gallon', 'Walmart', 'walmart', 3.98, 1, 'gallon', NOW() - INTERVAL '8 days'),
    (v_user_id, 'milk whole gallon', 'Walmart', 'walmart', 4.12, 1, 'gallon', NOW() - INTERVAL '22 days'),
    (v_user_id, 'milk whole gallon', 'Kroger', 'kroger', 4.29, 1, 'gallon', NOW() - INTERVAL '5 days'),
    (v_user_id, 'milk whole gallon', 'Kroger', 'kroger', 3.99, 1, 'gallon', NOW() - INTERVAL '19 days');

  -- Gasoline - different gas stations
  INSERT INTO item_price_history (user_id, item_name_normalized, vendor, vendor_normalized, unit_price, quantity, unit_of_measure, purchase_date)
  VALUES
    (v_user_id, 'gasoline regular', 'Costco Gas', 'costco gas', 2.89, 15, 'gallon', NOW() - INTERVAL '1 day'),
    (v_user_id, 'gasoline regular', 'Costco Gas', 'costco gas', 2.95, 12, 'gallon', NOW() - INTERVAL '10 days'),
    (v_user_id, 'gasoline regular', 'Costco Gas', 'costco gas', 3.05, 14, 'gallon', NOW() - INTERVAL '20 days'),
    (v_user_id, 'gasoline regular', 'Shell', 'shell', 3.29, 10, 'gallon', NOW() - INTERVAL '5 days'),
    (v_user_id, 'gasoline regular', 'Shell', 'shell', 3.35, 8, 'gallon', NOW() - INTERVAL '15 days'),
    (v_user_id, 'gasoline regular', 'Exxon', 'exxon', 3.45, 12, 'gallon', NOW() - INTERVAL '7 days');

  -- Office Supplies - Staples vs Amazon vs Office Depot
  INSERT INTO item_price_history (user_id, item_name_normalized, vendor, vendor_normalized, unit_price, quantity, unit_of_measure, purchase_date)
  VALUES
    (v_user_id, 'printer paper ream', 'Amazon', 'amazon', 7.99, 2, 'ream', NOW() - INTERVAL '4 days'),
    (v_user_id, 'printer paper ream', 'Amazon', 'amazon', 8.49, 1, 'ream', NOW() - INTERVAL '34 days'),
    (v_user_id, 'printer paper ream', 'Staples', 'staples', 9.99, 1, 'ream', NOW() - INTERVAL '18 days'),
    (v_user_id, 'printer paper ream', 'Office Depot', 'office depot', 10.49, 1, 'ream', NOW() - INTERVAL '28 days');

  -- Bananas - produce comparison
  INSERT INTO item_price_history (user_id, item_name_normalized, vendor, vendor_normalized, unit_price, quantity, unit_of_measure, purchase_date)
  VALUES
    (v_user_id, 'bananas organic', 'Trader Joes', 'trader joes', 0.29, 6, 'lb', NOW() - INTERVAL '2 days'),
    (v_user_id, 'bananas organic', 'Trader Joes', 'trader joes', 0.29, 5, 'lb', NOW() - INTERVAL '9 days'),
    (v_user_id, 'bananas organic', 'Whole Foods', 'whole foods', 0.49, 4, 'lb', NOW() - INTERVAL '5 days'),
    (v_user_id, 'bananas organic', 'Whole Foods', 'whole foods', 0.49, 3, 'lb', NOW() - INTERVAL '12 days'),
    (v_user_id, 'bananas organic', 'Kroger', 'kroger', 0.39, 5, 'lb', NOW() - INTERVAL '7 days');

  -- Eggs - multiple stores
  INSERT INTO item_price_history (user_id, item_name_normalized, vendor, vendor_normalized, unit_price, quantity, unit_of_measure, purchase_date)
  VALUES
    (v_user_id, 'eggs large dozen', 'Aldi', 'aldi', 2.49, 2, 'dozen', NOW() - INTERVAL '3 days'),
    (v_user_id, 'eggs large dozen', 'Aldi', 'aldi', 2.29, 1, 'dozen', NOW() - INTERVAL '17 days'),
    (v_user_id, 'eggs large dozen', 'Costco', 'costco', 2.99, 2, 'dozen', NOW() - INTERVAL '10 days'),
    (v_user_id, 'eggs large dozen', 'Walmart', 'walmart', 3.28, 1, 'dozen', NOW() - INTERVAL '6 days'),
    (v_user_id, 'eggs large dozen', 'Kroger', 'kroger', 3.49, 1, 'dozen', NOW() - INTERVAL '14 days');

  -- Bread
  INSERT INTO item_price_history (user_id, item_name_normalized, vendor, vendor_normalized, unit_price, quantity, unit_of_measure, purchase_date)
  VALUES
    (v_user_id, 'bread whole wheat', 'Aldi', 'aldi', 1.89, 1, 'loaf', NOW() - INTERVAL '4 days'),
    (v_user_id, 'bread whole wheat', 'Aldi', 'aldi', 1.89, 1, 'loaf', NOW() - INTERVAL '11 days'),
    (v_user_id, 'bread whole wheat', 'Walmart', 'walmart', 2.48, 1, 'loaf', NOW() - INTERVAL '7 days'),
    (v_user_id, 'bread whole wheat', 'Kroger', 'kroger', 2.99, 1, 'loaf', NOW() - INTERVAL '2 days');

  -- Chicken breast
  INSERT INTO item_price_history (user_id, item_name_normalized, vendor, vendor_normalized, unit_price, quantity, unit_of_measure, purchase_date)
  VALUES
    (v_user_id, 'chicken breast boneless', 'Costco', 'costco', 3.49, 5, 'lb', NOW() - INTERVAL '6 days'),
    (v_user_id, 'chicken breast boneless', 'Costco', 'costco', 3.29, 4, 'lb', NOW() - INTERVAL '20 days'),
    (v_user_id, 'chicken breast boneless', 'Walmart', 'walmart', 3.98, 2, 'lb', NOW() - INTERVAL '10 days'),
    (v_user_id, 'chicken breast boneless', 'Kroger', 'kroger', 4.49, 2, 'lb', NOW() - INTERVAL '3 days'),
    (v_user_id, 'chicken breast boneless', 'Whole Foods', 'whole foods', 6.99, 1, 'lb', NOW() - INTERVAL '15 days');

  -- Laundry detergent
  INSERT INTO item_price_history (user_id, item_name_normalized, vendor, vendor_normalized, unit_price, quantity, unit_of_measure, purchase_date)
  VALUES
    (v_user_id, 'tide laundry detergent', 'Costco', 'costco', 19.99, 1, 'bottle', NOW() - INTERVAL '8 days'),
    (v_user_id, 'tide laundry detergent', 'Amazon', 'amazon', 22.99, 1, 'bottle', NOW() - INTERVAL '25 days'),
    (v_user_id, 'tide laundry detergent', 'Target', 'target', 24.99, 1, 'bottle', NOW() - INTERVAL '40 days'),
    (v_user_id, 'tide laundry detergent', 'Walmart', 'walmart', 21.97, 1, 'bottle', NOW() - INTERVAL '55 days');

  RAISE NOTICE 'Demo data inserted successfully for user %', v_user_id;
END $$;

-- Verify the data was inserted
SELECT
  item_name_normalized,
  vendor,
  unit_price,
  quantity,
  purchase_date
FROM item_price_history
ORDER BY item_name_normalized, vendor, purchase_date DESC
LIMIT 50;
