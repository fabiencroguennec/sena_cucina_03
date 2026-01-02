-- Add missing columns to events table if they don't exist
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS selling_price NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS contact_name TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT,
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS allergens TEXT[], 
ADD COLUMN IF NOT EXISTS diets JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Reload Supabase Schema Cache to recognize new columns
NOTIFY pgrst, 'reload config';
