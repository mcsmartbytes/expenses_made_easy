-- Create mileage_trips table for tracking mileage
-- Run this SQL in your Supabase SQL Editor

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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_mileage_trips_user_id ON mileage_trips(user_id);
CREATE INDEX IF NOT EXISTS idx_mileage_trips_start_time ON mileage_trips(start_time);
CREATE INDEX IF NOT EXISTS idx_mileage_trips_purpose ON mileage_trips(purpose);

-- Enable Row Level Security
ALTER TABLE mileage_trips ENABLE ROW LEVEL SECURITY;

-- Create policies for mileage_trips
CREATE POLICY "Users can view their own mileage trips"
  ON mileage_trips FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mileage trips"
  ON mileage_trips FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mileage trips"
  ON mileage_trips FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mileage trips"
  ON mileage_trips FOR DELETE
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON mileage_trips TO authenticated;
GRANT ALL ON mileage_trips TO service_role;
