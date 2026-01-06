-- ============================================
-- MILK ATM TRACKER - DATABASE SCHEMA UPDATE
-- Run these commands in your Supabase SQL Editor
-- ============================================

-- 1. Create milk_atms table
CREATE TABLE IF NOT EXISTS milk_atms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    location TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Insert 4 default ATMs
INSERT INTO milk_atms (name, location) VALUES
    ('ATM 1', 'Location 1'),
    ('ATM 2', 'Location 2'),
    ('ATM 3', 'Location 3'),
    ('ATM 4', 'Location 4');

-- 3. Create settings table
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Insert default milk rate setting (0 = manual entry)
INSERT INTO settings (key, value) VALUES ('milk_rate', '0')
ON CONFLICT (key) DO NOTHING;

-- 5. Add new columns to daily_entries table
ALTER TABLE daily_entries 
ADD COLUMN IF NOT EXISTS atm_id UUID REFERENCES milk_atms(id),
ADD COLUMN IF NOT EXISTS cash_liters DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS upi_liters DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS card_liters DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS udhaar_permanent_liters DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS udhaar_temporary_liters DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS others_liters DECIMAL(10,2) DEFAULT 0;

-- 6. Rename starting_milk to total_milk for clarity (optional, keeping backward compat)
-- Note: We'll use starting_milk as total_milk in the app

-- 7. Add unique constraint for date + atm_id (one entry per ATM per day)
-- First, we need to handle existing entries without atm_id
-- This constraint will only apply to new entries with atm_id
CREATE UNIQUE INDEX IF NOT EXISTS unique_date_atm 
ON daily_entries(date, atm_id) 
WHERE atm_id IS NOT NULL;

-- 8. Enable Row Level Security (RLS) for new tables
ALTER TABLE milk_atms ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- 9. Create policies for public access (since this is a single-user app)
CREATE POLICY "Allow public read access on milk_atms" ON milk_atms
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access on milk_atms" ON milk_atms
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access on milk_atms" ON milk_atms
    FOR UPDATE USING (true);

CREATE POLICY "Allow public read access on settings" ON settings
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access on settings" ON settings
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access on settings" ON settings
    FOR UPDATE USING (true);

-- ============================================
-- VERIFICATION: Run these to check the schema
-- ============================================
-- SELECT * FROM milk_atms;
-- SELECT * FROM settings;
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'daily_entries';
