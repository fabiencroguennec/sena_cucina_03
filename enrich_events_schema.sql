-- Add new columns to events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS contact_name TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT,
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS allergens TEXT[], -- Array of strings
ADD COLUMN IF NOT EXISTS diets JSONB DEFAULT '{}'::jsonb, -- Key-value pairs of Diet Name -> Count
ADD COLUMN IF NOT EXISTS notes TEXT;
