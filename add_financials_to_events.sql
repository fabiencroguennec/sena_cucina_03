-- Add selling_price to events for profit calculation
ALTER TABLE events ADD COLUMN IF NOT EXISTS selling_price NUMERIC(10, 2) DEFAULT 0;
